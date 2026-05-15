const db = require('../db.cjs');
const log = require('electron-log');

/**
 * [KB] Mendapatkan sesi yang belum ditutup
 */
function getActiveSession() {
    try {
        return db.prepare('SELECT * FROM cashier_sessions WHERE closed_at IS NULL ORDER BY opened_at DESC LIMIT 1').get();
    } catch (err) {
        log.error(`getActiveSession failed: ${err.message}`);
        return null;
    }
}

/**
 * [KB] Buka sesi kasir baru.
 */
function openSession(openingCash) {
    try {
        const active = getActiveSession();
        if (active) throw new Error('Masih ada sesi kasir yang aktif. Tutup sesi sebelumnya terlebih dahulu.');

        // [INF] Bersihkan held bills dari sesi sebelumnya agar tidak menumpuk
        db.prepare('DELETE FROM held_bills').run();

        const stmt = db.prepare('INSERT INTO cashier_sessions (opening_cash) VALUES (?)');
        const result = stmt.run(openingCash);
        log.info(`Session opened with cash: ${openingCash}`);

        // Sembahyang startup jobs — fire and forget
        try {
            const sembahyang = require('./sembahyang.cjs');
            sembahyang.runSembahyangStartupJobs();
        } catch (e) {
            log.error(`Sembahyang startup jobs failed: ${e.message}`);
        }

        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        log.error(`openSession failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * [INF] Helper Kalkulasi Kas Ekspektasi (Starting + In - Out)
 */
function _calculateCashExpected(sessionId, openingCash) {
    // 1. Kas masuk dari transaksi tunai langsung
    const cashInStmt = db.prepare(`
        SELECT COALESCE(SUM(total), 0) AS total
        FROM transactions
        WHERE cashier_session_id = ?
          AND payment_method = 'cash'
          AND status = 'completed'
    `);
    const cashInDirect = cashInStmt.get(sessionId).total;

    // 2. Kas masuk dari pelunasan PIUTANG (AR) tunai
    const arInStmt = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM receivable_payments
        WHERE cashier_session_id = ?
          AND payment_method = 'cash'
    `);
    const cashInAR = arInStmt.get(sessionId).total;

    // 3. Kas keluar dari pengeluaran tunai (Petty Cash)
    const cashOutStmt = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM expenses
        WHERE cashier_session_id = ?
          AND payment_method = 'cash'
    `);
    const cashOutDirect = cashOutStmt.get(sessionId).total;

    // 4. Kas keluar dari pelunasan HUTANG (AP) tunai
    const apOutStmt = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM purchase_payments
        WHERE cashier_session_id = ?
          AND payment_method = 'cash'
    `);
    const cashOutAP = apOutStmt.get(sessionId).total;

    const totalCashIn = cashInDirect + cashInAR;
    const totalCashOut = cashOutDirect + cashOutAP;

    return {
        cashIn: totalCashIn,
        cashOut: totalCashOut,
        expectedCash: openingCash + totalCashIn - totalCashOut
    };
}

/**
 * [INF] Tutup Shift: Rekonsiliasi Otomatis antara Sistem vs Hitungan Fisik Kasir.
 */
function closeSession(sessionId, closingCash, notes = '') {
    try {
        const session = db.prepare('SELECT * FROM cashier_sessions WHERE id = ?').get(sessionId);
        if (!session) throw new Error("Sesi tidak ditemukan.");
        if (session.closed_at) throw new Error("Sesi sudah ditutup.");

        // Kalkulasi ekspektasi vs aktual
        const { cashIn, cashOut, expectedCash } = _calculateCashExpected(sessionId, session.opening_cash);
        const cashDifference = closingCash - expectedCash;

        // Total sales (Semua metode pembayaran)
        const totalSalesStmt = db.prepare(`
            SELECT COALESCE(SUM(total), 0) AS total
            FROM transactions
            WHERE cashier_session_id = ? AND status = 'completed'
        `);
        const totalSales = totalSalesStmt.get(sessionId).total;

        const updateStmt = db.prepare(`
            UPDATE cashier_sessions 
            SET closed_at = datetime('now','localtime'),
                closing_cash = ?,
                total_sales = ?,
                notes = ?,
                cash_difference = ?
            WHERE id = ?
        `);
        
        updateStmt.run(closingCash, totalSales, notes, cashDifference, sessionId);

        // [T5] Log Anomaly if Gap exists
        if (cashDifference !== 0) {
            db.prepare(`
                INSERT INTO void_anomaly_log (session_id, reason, gap_amount)
                VALUES (?, ?, ?)
            `).run(sessionId, notes || 'Auto-logged reconciliation gap', cashDifference);
        }

        log.info(`Session closed: ID ${sessionId}, Diff: ${cashDifference}`);
        
        return {
            success: true,
            sessionId: sessionId,
            totalSales: totalSales,
            closingCash: closingCash,
            expectedCash: expectedCash,
            cashDifference: cashDifference,
            cashIn: cashIn,
            cashOut: cashOut,
            openingCash: session.opening_cash,
            notes: notes
        };
    } catch (err) {
        log.error(`closeSession failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * [NEW] Mendapatkan riwayat sesi
 */
function getSessions(limit = 50) {
    try {
        return db.prepare('SELECT * FROM cashier_sessions ORDER BY opened_at DESC LIMIT ?').all(limit);
    } catch (err) {
        log.error(`getSessions failed: ${err.message}`);
        return [];
    }
}

// Alias untuk getSessionHistory sesuai instruksi Fase 2c
const getSessionHistory = getSessions;

/**
 * Task 5: Blind Reconciliation Backend
 * Menghitung selisih kas fisik vs sistem, lalu mencatatnya ke log anomali.
 */
const closeBlindSession = (sessionId, inputCash) => {
  try {
    db.exec('BEGIN TRANSACTION;');

    const session = db.prepare('SELECT opening_cash FROM cashier_sessions WHERE id = ?').get(sessionId);
    if (!session) throw new Error("Sesi tidak ditemukan");

    // Gunakan helper yang sudah ada untuk kalkulasi
    const { expectedCash } = _calculateCashExpected(sessionId, session.opening_cash);
    const difference = Number(inputCash) - expectedCash;
    const isMatch = difference === 0;

    // Log Anomali jika ada selisih
    if (!isMatch) {
      db.prepare(`
        INSERT INTO void_anomaly_log (session_id, reason, gap_amount) 
        VALUES (?, ?, ?)
      `).run(sessionId, difference > 0 ? 'Surplus kas fisik' : 'Kekurangan kas fisik', difference);
    }

    // Hitung total sales
    const totalSales = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE cashier_session_id = ? AND status = 'completed'").get(sessionId).total;

    // Update status sesi
    db.prepare(`
      UPDATE cashier_sessions 
      SET closed_at = datetime('now','localtime'), 
          closing_cash = ?, 
          total_sales = ?, 
          cash_difference = ?,
          notes = ?
      WHERE id = ?
    `).run(inputCash, totalSales, difference, isMatch ? 'Recon Match' : 'Recon Gap Logged', sessionId);

    db.exec('COMMIT;');

    return {
      expected: expectedCash,
      actual: Number(inputCash),
      difference: difference,
      isMatch: isMatch
    };

  } catch (error) {
    db.exec('ROLLBACK;');
    log.error("[SESSIONS] Error in closeBlindSession:", error);
    throw error;
  }
};

module.exports = {
    getActiveSession,
    openSession,
    closeSession,
    closeBlindSession,
    getSessions,
    getSessionHistory
};

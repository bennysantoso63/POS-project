import db from '../db.js';
import log from 'electron-log';

/**
 * [KB] Mendapatkan sesi yang belum ditutup
 */
export function getActiveSession() {
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
export function openSession(openingCash) {
    try {
        const active = getActiveSession();
        if (active) throw new Error('Masih ada sesi kasir yang aktif. Tutup sesi sebelumnya terlebih dahulu.');

        // [INF] Bersihkan held bills dari sesi sebelumnya agar tidak menumpuk
        db.prepare('DELETE FROM held_bills').run();

        const stmt = db.prepare('INSERT INTO cashier_sessions (opening_cash) VALUES (?)');
        const result = stmt.run(openingCash);
        log.info(`Session opened with cash: ${openingCash}`);
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
    // Kas masuk dari transaksi tunai sesi ini
    const cashInStmt = db.prepare(`
        SELECT COALESCE(SUM(total), 0) AS total
        FROM transactions
        WHERE cashier_session_id = ?
          AND payment_method = 'cash'
          AND status = 'completed'
    `);
    const cashIn = cashInStmt.get(sessionId).total;

    // Kas keluar dari pengeluaran tunai sesi ini
    const cashOutStmt = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM expenses
        WHERE cashier_session_id = ?
          AND payment_method = 'cash'
    `);
    const cashOut = cashOutStmt.get(sessionId).total;

    return {
        cashIn,
        cashOut,
        expectedCash: openingCash + cashIn - cashOut
    };
}

/**
 * [INF] Tutup Shift: Rekonsiliasi Otomatis antara Sistem vs Hitungan Fisik Kasir.
 */
export function closeSession(sessionId, closingCash, notes = '') {
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
 * [KB] Mendapatkan seluruh riwayat sesi kasir
 */
export function getSessionHistory(limit = 50) {
    try {
        return db.prepare('SELECT * FROM cashier_sessions ORDER BY opened_at DESC LIMIT ?').all(limit);
    } catch (err) {
        log.error(`getSessionHistory failed: ${err.message}`);
        return [];
    }
}

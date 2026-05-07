import db from '../db.js';
import log from 'electron-log';

/**
 * [KB] Manajemen Piutang / Bon (Receivables)
 */
export function createReceivable(data) {
    try {
        const insertReceivable = db.prepare(`
            INSERT INTO receivables (transaction_id, customer_id, customer_name, customer_phone, amount, due_date, notes)
            VALUES (@transaction_id, @customer_id, @customer_name, @customer_phone, @amount, @due_date, @notes)
        `);
        const result = insertReceivable.run(data);
        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        log.error(`createReceivable failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

export function recordPayment(receivable_id, paymentData, sessionId) {
    const insertPayment = db.prepare(`
        INSERT INTO receivable_payments (receivable_id, amount, payment_method, cashier_session_id, notes)
        VALUES (?, ?, ?, ?, ?)
    `);

    const updateStatus = db.prepare(`
        UPDATE receivables 
        SET status = ? 
        WHERE id = ?
    `);

    try {
        const transaction = db.transaction(() => {
            // 1. Validasi Piutang
            const receivable = db.prepare('SELECT * FROM receivables WHERE id = ?').get(receivable_id);
            if (!receivable) throw new Error('Piutang tidak ditemukan');
            if (receivable.status === 'paid' || receivable.status === 'void') throw new Error(`Piutang sudah ${receivable.status}`);

            // 2. Insert Payment
            insertPayment.run(receivable_id, paymentData.amount, paymentData.payment_method, sessionId, paymentData.notes);

            // 3. Kalkulasi total terbayar
            const totalPaid = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM receivable_payments WHERE receivable_id = ?').get(receivable_id).total;

            // 4. Update Status
            let newStatus = 'partial';
            if (totalPaid >= receivable.amount) {
                newStatus = 'paid';
            }
            updateStatus.run(newStatus, receivable_id);

            return { success: true, remaining_amount: Math.max(0, receivable.amount - totalPaid), new_status: newStatus };
        });

        return transaction();
    } catch (err) {
        log.error(`recordPayment failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

export function voidReceivable(receivable_id, reason) {
    try {
        const updateVoid = db.prepare(`
            UPDATE receivables 
            SET status = 'void', notes = ? 
            WHERE id = ? AND status != 'paid'
        `);
        const result = updateVoid.run(`VOID: ${reason}`, receivable_id);
        return { success: result.changes > 0 };
    } catch (err) {
        log.error(`voidReceivable failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

export function getReceivableById(id) {
    try {
        const receivable = db.prepare('SELECT * FROM receivables WHERE id = ?').get(id);
        if (!receivable) return null;
        
        const payments = db.prepare('SELECT * FROM receivable_payments WHERE receivable_id = ? ORDER BY paid_at DESC').all(id);
        return { ...receivable, payments };
    } catch (err) {
        log.error(`getReceivableById failed: ${err.message}`);
        return null;
    }
}

export function getAllReceivables(filters = {}) {
    try {
        let query = 'SELECT * FROM receivables WHERE 1=1';
        const params = [];

        if (filters.status) { query += ' AND status = ?'; params.push(filters.status); }
        if (filters.customer_id) { query += ' AND customer_id = ?'; params.push(filters.customer_id); }
        if (filters.date_from && filters.date_to) { query += ' AND date(created_at) BETWEEN ? AND ?'; params.push(filters.date_from, filters.date_to); }
        if (filters.overdue_only) { query += " AND due_date < date('now', 'localtime') AND status IN ('outstanding', 'partial')"; }

        query += ' ORDER BY created_at DESC';
        return db.prepare(query).all(...params);
    } catch (err) {
        log.error(`getAllReceivables failed: ${err.message}`);
        return [];
    }
}

export function getReceivableSummary() {
    try {
        return db.prepare(`
            SELECT 
                COALESCE(SUM(amount - (SELECT COALESCE(SUM(amount),0) FROM receivable_payments rp WHERE rp.receivable_id = r.id)), 0) as total_outstanding,
                COALESCE(SUM(CASE WHEN due_date < date('now', 'localtime') THEN amount - (SELECT COALESCE(SUM(amount),0) FROM receivable_payments rp WHERE rp.receivable_id = r.id) ELSE 0 END), 0) as total_overdue,
                COUNT(id) as count_outstanding,
                SUM(CASE WHEN due_date < date('now', 'localtime') THEN 1 ELSE 0 END) as count_overdue
            FROM receivables r
            WHERE status IN ('outstanding', 'partial')
        `).get();
    } catch (err) {
        log.error(`getReceivableSummary failed: ${err.message}`);
        return { total_outstanding: 0, total_overdue: 0, count_outstanding: 0, count_overdue: 0 };
    }
}

export function getCustomerReceivables(customer_id) {
    try {
        const receivables = db.prepare('SELECT * FROM receivables WHERE customer_id = ? ORDER BY created_at DESC').all(customer_id);
        const summary = db.prepare(`
            SELECT COALESCE(SUM(amount - (SELECT COALESCE(SUM(amount),0) FROM receivable_payments rp WHERE rp.receivable_id = r.id)), 0) as total_outstanding
            FROM receivables r
            WHERE customer_id = ? AND status IN ('outstanding', 'partial')
        `).get(customer_id);
        
        return { receivables, total_outstanding: summary.total_outstanding };
    } catch (err) {
        log.error(`getCustomerReceivables failed: ${err.message}`);
        return { receivables: [], total_outstanding: 0 };
    }
}

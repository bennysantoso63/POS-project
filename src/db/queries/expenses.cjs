const db = require('../db.cjs');
const log = require('electron-log');

/**
 * [KB] Mencatat Pengeluaran (Expense/Petty Cash) sesuai Blueprint Sprint 7
 */
function createExpense(data) {
    try {
        const stmt = db.prepare(`
            INSERT INTO expenses (
                amount, category, subcategory, description, 
                payment_method, cashier_session_id, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            data.amount,
            data.category || 'opex',
            data.subcategory || null,
            data.description,
            data.payment_method || 'cash',
            data.cashier_session_id || null,
            data.notes || null
        );
        log.info(`Expense created: ${data.amount} [${data.category}]`);
        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        log.error(`createExpense failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * [KB] Mendapatkan seluruh riwayat pengeluaran
 */
function getAllExpenses(limit = 100) {
    try {
        return db.prepare('SELECT * FROM expenses ORDER BY created_at DESC LIMIT ?').all(limit);
    } catch (err) {
        log.error(`getAllExpenses failed: ${err.message}`);
        return [];
    }
}

/**
 * [KB] Query spesifik untuk laporan P&L / Tax (Sprint 7)
 */
function getExpensesByMonth(year, month) {
    try {
        const dateStr = `${year}-${String(month).padStart(2, '0')}%`;
        return db.prepare('SELECT * FROM expenses WHERE date LIKE ?').all(dateStr);
    } catch (err) {
        log.error(`getExpensesByMonth failed: ${err.message}`);
        return [];
    }
}

function getExpenseSummaryByCategory(year, month) {
    try {
        const dateStr = `${year}-${String(month).padStart(2, '0')}%`;
        return db.prepare(`
            SELECT category, SUM(amount) as total
            FROM expenses
            WHERE date LIKE ?
            GROUP BY category
        `).all(dateStr);
    } catch (err) {
        log.error(`getExpenseSummaryByCategory failed: ${err.message}`);
        return [];
    }
}

function getExpensesByCategory(category, year, month) {
    try {
        const dateStr = `${year}-${String(month).padStart(2, '0')}%`;
        return db.prepare('SELECT * FROM expenses WHERE category = ? AND date LIKE ?').all(category, dateStr);
    } catch (err) {
        log.error(`getExpensesByCategory failed: ${err.message}`);
        return [];
    }
}

function updateExpense(id, data) {
    try {
        const stmt = db.prepare(`
            UPDATE expenses 
            SET amount = ?, category = ?, subcategory = ?, description = ?, notes = ?
            WHERE id = ?
        `);
        stmt.run(data.amount, data.category, data.subcategory, data.description, data.notes, id);
        return { success: true };
    } catch (err) {
        log.error(`updateExpense failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

function deleteExpense(id) {
    try {
        db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
        return { success: true };
    } catch (err) {
        log.error(`deleteExpense failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

module.exports = {
    createExpense,
    getAllExpenses,
    getExpensesByMonth,
    getExpenseSummaryByCategory,
    getExpensesByCategory,
    updateExpense,
    deleteExpense
};

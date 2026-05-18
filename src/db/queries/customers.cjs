const db = require('../db.cjs');
const log = require('electron-log');

/**
 * [KB] Manajemen Pelanggan (Customers)
 */
function getAllCustomers(includeInactive = false) {
    try {
        const query = `
            SELECT c.*, 
              COALESCE(
                (SELECT SUM(r.amount - COALESCE((SELECT SUM(rp.amount) FROM receivable_payments rp WHERE rp.receivable_id = r.id), 0))
                 FROM receivables r
                 WHERE r.customer_id = c.id AND r.status IN ('outstanding', 'partial')
                ), 0
              ) AS balance,
              (SELECT MIN(r.id) 
               FROM receivables r 
               WHERE r.customer_id = c.id AND r.status IN ('outstanding', 'partial')
              ) AS receivable_id
            FROM customers c
            WHERE ${includeInactive ? '1=1' : 'c.is_active = 1'}
            ORDER BY c.name ASC
        `;
        return db.prepare(query).all();
    } catch (err) {
        log.error(`getAllCustomers failed: ${err.message}`);
        return [];
    }
}

function searchCustomers(keyword) {
    try {
        const searchTerm = `%${keyword}%`;
        return db.prepare(`
            SELECT * FROM customers 
            WHERE (name LIKE ? OR phone LIKE ?) AND is_active = 1 
            ORDER BY name ASC LIMIT 10
        `).all(searchTerm, searchTerm);
    } catch (err) {
        log.error(`searchCustomers failed: ${err.message}`);
        return [];
    }
}

function createCustomer(data) {
    try {
        const stmt = db.prepare(`
            INSERT INTO customers (name, phone, address, notes) 
            VALUES (@name, @phone, @address, @notes)
        `);
        const result = stmt.run(data);
        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        log.error(`createCustomer failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

function updateCustomer(id, data) {
    try {
        const stmt = db.prepare(`
            UPDATE customers 
            SET name = @name, phone = @phone, address = @address, notes = @notes, is_active = @is_active 
            WHERE id = @id
        `);
        const result = stmt.run({ ...data, id });
        return { success: result.changes > 0 };
    } catch (err) {
        log.error(`updateCustomer failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

function deleteCustomer(id) {
  return db.prepare(
    "UPDATE customers SET is_active=0 WHERE id=?"
  ).run(id);
}

module.exports = {
    getAllCustomers,
    searchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
};

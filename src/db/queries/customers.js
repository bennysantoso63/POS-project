import db from '../db.js';
import log from 'electron-log';

/**
 * [KB] Manajemen Pelanggan (Customers)
 */
export function getAllCustomers(includeInactive = false) {
    try {
        if (includeInactive) {
            return db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
        }
        return db.prepare('SELECT * FROM customers WHERE is_active = 1 ORDER BY name ASC').all();
    } catch (err) {
        log.error(`getAllCustomers failed: ${err.message}`);
        return [];
    }
}

export function searchCustomers(keyword) {
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

export function createCustomer(data) {
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

export function updateCustomer(id, data) {
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

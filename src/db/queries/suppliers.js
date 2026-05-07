import db from '../db.js';
import log from 'electron-log';

/**
 * [KB] Manajemen Supplier (Pemasok)
 */
export function getAllSuppliers(includeInactive = false) {
    try {
        if (includeInactive) return db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
        return db.prepare('SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name ASC').all();
    } catch (err) {
        log.error(`getAllSuppliers failed: ${err.message}`);
        return [];
    }
}

export function searchSuppliers(keyword) {
    try {
        const searchTerm = `%${keyword}%`;
        return db.prepare('SELECT * FROM suppliers WHERE (name LIKE ? OR phone LIKE ?) AND is_active = 1 LIMIT 10').all(searchTerm, searchTerm);
    } catch (err) {
        log.error(`searchSuppliers failed: ${err.message}`);
        return [];
    }
}

export function createSupplier(data) {
    try {
        const stmt = db.prepare(`INSERT INTO suppliers (name, contact_name, phone, address, notes) VALUES (@name, @contact_name, @phone, @address, @notes)`);
        const result = stmt.run(data);
        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        log.error(`createSupplier failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

export function updateSupplier(id, data) {
    try {
        const stmt = db.prepare(`UPDATE suppliers SET name=@name, contact_name=@contact_name, phone=@phone, address=@address, notes=@notes, is_active=@is_active WHERE id=@id`);
        const result = stmt.run({ ...data, id });
        return { success: result.changes > 0 };
    } catch (err) {
        log.error(`updateSupplier failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

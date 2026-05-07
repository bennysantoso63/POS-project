import db from '../db.js';
import log from 'electron-log';

/**
 * [KB] Manajemen Kategori Produk
 */
export function getAllCategories() {
    try {
        return db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC').all();
    } catch (err) {
        log.error(`getAllCategories failed: ${err.message}`);
        return [];
    }
}

export function createCategory(name, sortOrder = 0) {
    try {
        const stmt = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
        const result = stmt.run(name, sortOrder);
        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        log.error(`createCategory failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

export function updateCategory(id, data) {
    try {
        const stmt = db.prepare('UPDATE categories SET name = @name, sort_order = @sort_order WHERE id = @id');
        const result = stmt.run({ ...data, id });
        return { success: result.changes > 0 };
    } catch (err) {
        log.error(`updateCategory failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

export function deleteCategory(id) {
    try {
        const transaction = db.transaction(() => {
            // [INF] Pindahkan produk ke kategori 'Umum' sebelum menghapus kategori ini
            db.prepare("UPDATE products SET category = 'Umum' WHERE category = (SELECT name FROM categories WHERE id = ?)").run(id);
            const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
            return { success: result.changes > 0 };
        });
        return transaction();
    } catch (err) {
        log.error(`deleteCategory failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * [KB] Filter Produk berdasarkan Kategori
 */
export function getProductsByCategory(category) {
    try {
        if (category === 'Semua') {
            return db.prepare('SELECT * FROM products ORDER BY name ASC').all();
        }
        return db.prepare('SELECT * FROM products WHERE category = ? ORDER BY name ASC').all(category);
    } catch (err) {
        log.error(`getProductsByCategory failed: ${err.message}`);
        return [];
    }
}

const db = require('../db.js');

/**
 * [KB] Mengambil semua produk untuk tampilan kasir/inventori
 */
function getProducts() {
    return db.prepare('SELECT * FROM products ORDER BY name ASC').all();
}

/**
 * [KB] Penyesuaian stok manual (Stock Adjustment)
 */
function adjustStock(productId, delta, reason, notes) {
    return db.transaction(() => {
        db.prepare(`
            UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?
        `).run(delta, productId);
        
        db.prepare(`
            INSERT INTO stock_movements (product_id, delta, reason, notes, created_at)
            VALUES (?, ?, ?, ?, datetime('now','localtime'))
        `).run(productId, delta, reason || 'adjustment', notes || null);
        
        return { success: true };
    })();
}

/**
 * [KB] Mengambil riwayat pergerakan stok
 */
function getStockMovements(productId, limit = 50) {
    if (productId) {
        return db
            .prepare('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ?')
            .all(productId, limit);
    }
    return db
        .prepare('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT ?')
        .all(limit);
}

/**
 * [KB] Fungsi CRUD standar
 */
function getProductById(id) {
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

function getProductBySku(sku) {
    return db.prepare('SELECT * FROM products WHERE sku = ?').get(sku);
}

function searchProducts(keyword) {
    const term = `%${keyword}%`;
    return db
        .prepare('SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? LIMIT 20')
        .all(term, term);
}

function createProduct(data) {
    const stmt = db.prepare(`
        INSERT INTO products (name, sku, price, stock_qty, low_stock_threshold, category, purchase_price)
        VALUES (@name, @sku, @price, @stock_qty, @low_stock_threshold, @category, @purchase_price)
    `);
    const result = stmt.run(data);
    return result.lastInsertRowid;
}

function updateProduct(id, data) {
    const stmt = db.prepare(`
        UPDATE products
        SET name = @name, sku = @sku, price = @price,
            stock_qty = @stock_qty, low_stock_threshold = @low_stock_threshold,
            category = @category, purchase_price = @purchase_price
        WHERE id = @id
    `);
    const result = stmt.run({ ...data, id });
    return result.changes;
}

function deleteProduct(id) {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return result.changes;
}

function getLowStockProducts() {
    return db
        .prepare('SELECT * FROM products WHERE stock_qty <= low_stock_threshold ORDER BY stock_qty ASC')
        .all();
}

module.exports = {
    getProducts,
    getProductById,
    getProductBySku,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    adjustStock,
    getStockMovements,
};

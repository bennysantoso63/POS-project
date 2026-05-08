const db = require('../db.js');

/**
 * F&B INVENTORY & RECIPE QUERIES
 * Logic for Bill of Materials (BOM) and Spoilage Tracking
 */

// 1. Ingredients Management
const getIngredients = () => {
    return db.prepare('SELECT * FROM ingredients ORDER BY name ASC').all();
};

const updateIngredientStock = (id, delta, reason, user) => {
    const update = db.prepare('UPDATE ingredients SET stock_qty = stock_qty + ? WHERE id = ?');
    const result = update.run(delta, id);
    
    // Logging is crucial for auditing shrinkage
    if (result.changes > 0 && reason) {
        db.prepare('INSERT INTO spoilage_logs (ing_id, qty, reason, loss_value, logged_by) VALUES (?, ?, ?, ?, ?)')
          .run(id, Math.abs(delta), reason, 0, user || 'System');
    }
    return result;
};

// 2. Spoilage & Loss Tracking
const recordSpoilage = db.transaction((ingId, qty, reason, user) => {
    const ing = db.prepare('SELECT cost_per_unit FROM ingredients WHERE id = ?').get(ingId);
    if (!ing) throw new Error('Bahan baku tidak ditemukan');

    const lossValue = qty * ing.cost_per_unit;
    
    // Deduct stock
    db.prepare('UPDATE ingredients SET stock_qty = stock_qty - ? WHERE id = ?').run(qty, ingId);
    
    // Log as loss
    const result = db.prepare(`
        INSERT INTO spoilage_logs (ing_id, qty, reason, loss_value, logged_by) 
        VALUES (?, ?, ?, ?, ?)
    `).run(ingId, qty, reason, lossValue, user);

    return { success: true, lossValue };
});

const getSpoilageLogs = (limit = 50) => {
    return db.prepare(`
        SELECT s.*, i.name as ing_name, i.unit 
        FROM spoilage_logs s
        JOIN ingredients i ON s.ing_id = i.id
        ORDER BY s.logged_at DESC
        LIMIT ?
    `).all(limit);
};

// 3. Recipe (BOM) Logic
const getRecipeByProduct = (productId) => {
    return db.prepare(`
        SELECT r.*, i.name as ing_name, i.unit, i.cost_per_unit
        FROM product_recipes r
        JOIN ingredients i ON r.ing_id = i.id
        WHERE r.product_id = ?
    `).all(productId);
};

const saveRecipe = db.transaction((productId, items) => {
    // Clear old recipe first
    db.prepare('DELETE FROM product_recipes WHERE product_id = ?').run(productId);
    
    const insert = db.prepare('INSERT INTO product_recipes (product_id, ing_id, qty) VALUES (?, ?, ?)');
    for (const item of items) {
        insert.run(productId, item.ing_id, item.qty);
    }
    return { success: true };
});

// 4. KDS (Kitchen Display) Tickets
const getKdsTickets = (status = 'PENDING') => {
    const tickets = db.prepare(`
        SELECT * FROM kds_tickets 
        WHERE status = ? OR status = 'COOKING' OR status = 'READY'
        ORDER BY created_at ASC
    `).all(status);

    return tickets.map(t => ({
        ...t,
        items: JSON.parse(t.items_json)
    }));
};

const updateTicketStatus = (ticketId, status) => {
    return db.prepare('UPDATE kds_tickets SET status = ? WHERE id = ?').run(status, ticketId);
};

module.exports = {
    getIngredients,
    updateIngredientStock,
    recordSpoilage,
    getSpoilageLogs,
    getRecipeByProduct,
    saveRecipe,
    getKdsTickets,
    updateTicketStatus
};

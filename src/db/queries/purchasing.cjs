const db = require('../db.cjs');
const log = require('electron-log');

/**
 * [KB] PURCHASE ORDERS & ACCOUNTS PAYABLE (AP)
 */
function createPurchaseOrder(data) {
    const insertPO = db.prepare(`
        INSERT INTO purchase_orders (supplier_id, supplier_name, order_date, due_date, notes)
        VALUES (@supplier_id, @supplier_name, @order_date, @due_date, @notes)
    `);
    const insertItem = db.prepare(`
        INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, qty, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateTotal = db.prepare(`UPDATE purchase_orders SET total_amount = ? WHERE id = ?`);

    try {
        const transaction = db.transaction(() => {
            const result = insertPO.run(data);
            const po_id = result.lastInsertRowid;
            let grandTotal = 0;

            for (const item of data.items) {
                const totalPrice = item.qty * item.unit_price;
                grandTotal += totalPrice;
                insertItem.run(po_id, item.product_id || null, item.product_name, item.qty, item.unit_price, totalPrice);
            }

            updateTotal.run(grandTotal, po_id);
            return { success: true, po_id };
        });

        return transaction();
    } catch (err) {
        log.error(`createPurchaseOrder failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

function receivePurchaseOrder(po_id) {
    const updatePOStatus = db.prepare(`UPDATE purchase_orders SET status = 'received' WHERE id = ? AND status IN ('draft', 'ordered')`);
    const getItems = db.prepare(`SELECT * FROM purchase_order_items WHERE purchase_order_id = ? AND product_id IS NOT NULL`);
    const updateStock = db.prepare(`UPDATE products SET stock_pcs = stock_pcs + ?, cost_price = ? WHERE id = ?`);
    const insertMovement = db.prepare(`INSERT INTO stock_movements (product_id, delta, reason, user_name) VALUES (?, ?, ?, ?)`);

    try {
        const transaction = db.transaction(() => {
            const result = updatePOStatus.run(po_id);
            if (result.changes === 0) throw new Error("PO tidak valid atau sudah diterima/dibayar.");

            const items = getItems.all(po_id);
            for (const item of items) {
                // [INF] Auto-update HPP (cost_price) ke unit_price terbaru
                updateStock.run(item.qty, item.unit_price, item.product_id);
                insertMovement.run(item.product_id, item.qty, `PO-${po_id} Received`, 'System');
            }
            return { success: true, products_updated: items.length };
        });

        return transaction();
    } catch (err) {
        log.error(`receivePurchaseOrder failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

function recordPurchasePayment(po_id, paymentData, sessionId) {
    const insertPayment = db.prepare(`INSERT INTO purchase_payments (purchase_order_id, amount, payment_method, cashier_session_id, notes) VALUES (?, ?, ?, ?, ?)`);
    const updatePO = db.prepare(`UPDATE purchase_orders SET paid_amount = ?, status = ? WHERE id = ?`);
    
    try {
        const transaction = db.transaction(() => {
            const po = db.prepare('SELECT total_amount FROM purchase_orders WHERE id = ?').get(po_id);
            if(!po) throw new Error("PO tidak ditemukan");

            insertPayment.run(po_id, paymentData.amount, paymentData.payment_method, sessionId, paymentData.notes);
            
            const totalPaid = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM purchase_payments WHERE purchase_order_id = ?').get(po_id).total;
            
            const newStatus = totalPaid >= po.total_amount ? 'paid' : 'partial';
            updatePO.run(totalPaid, newStatus, po_id);

            return { success: true, remaining: Math.max(0, po.total_amount - totalPaid), new_status: newStatus };
        });

        return transaction();
    } catch (err) {
        log.error(`recordPurchasePayment failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

function voidPurchaseOrder(po_id, reason) {
    try {
        const po = db.prepare(`SELECT status FROM purchase_orders WHERE id = ?`).get(po_id);
        if (!po || po.status === 'paid') throw new Error("PO yang sudah lunas tidak bisa di-void.");

        const updateStatus = db.prepare(`UPDATE purchase_orders SET status = 'void', notes = ? WHERE id = ?`);
        const getItems = db.prepare(`SELECT * FROM purchase_order_items WHERE purchase_order_id = ? AND product_id IS NOT NULL`);
        const rollbackStock = db.prepare(`UPDATE products SET stock_pcs = stock_pcs - ? WHERE id = ?`);
        const insertMovement = db.prepare(`INSERT INTO stock_movements (product_id, delta, reason, user_name) VALUES (?, ?, ?, ?)`);

        const transaction = db.transaction(() => {
            if (po.status === 'received' || po.status === 'partial') {
                const items = getItems.all(po_id);
                for (const item of items) {
                    rollbackStock.run(item.qty, item.product_id);
                    insertMovement.run(item.product_id, -item.qty, `PO-${po_id} Voided Rollback`, 'System');
                }
            }
            updateStatus.run(`VOID: ${reason}`, po_id);
            return { success: true };
        });

        return transaction();
    } catch (err) {
        log.error(`voidPurchaseOrder failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

function getPurchaseOrderById(id) {
    try {
        const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id);
        if (!po) return null;
        po.items = db.prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?').all(id);
        po.payments = db.prepare('SELECT * FROM purchase_payments WHERE purchase_order_id = ? ORDER BY paid_at DESC').all(id);
        return po;
    } catch (err) {
        log.error(`getPurchaseOrderById failed: ${err.message}`);
        return null;
    }
}

function getAllPurchaseOrders(filters = {}) {
    try {
        let query = 'SELECT * FROM purchase_orders WHERE 1=1';
        const params = [];

        if (filters.status) { query += ' AND status = ?'; params.push(filters.status); }
        if (filters.supplier_id) { query += ' AND supplier_id = ?'; params.push(filters.supplier_id); }
        if (filters.date_from && filters.date_to) { query += ' AND date(order_date) BETWEEN ? AND ?'; params.push(filters.date_from, filters.date_to); }

        query += ' ORDER BY created_at DESC';
        return db.prepare(query).all(...params);
    } catch (err) {
        log.error(`getAllPurchaseOrders failed: ${err.message}`);
        return [];
    }
}

function getAPSummary() {
    try {
        return db.prepare(`
            SELECT 
                COALESCE(SUM(total_amount - paid_amount), 0) as total_hutang,
                COALESCE(SUM(CASE WHEN due_date < date('now', 'localtime') THEN total_amount - paid_amount ELSE 0 END), 0) as total_overdue,
                SUM(CASE WHEN status IN ('ordered', 'received', 'partial') THEN 1 ELSE 0 END) as count_pending
            FROM purchase_orders
            WHERE status IN ('ordered', 'received', 'partial')
        `).get();
    } catch (err) {
        log.error(`getAPSummary failed: ${err.message}`);
        return { total_hutang: 0, total_overdue: 0, count_pending: 0 };
    }
}

function getSupplierStatement(supplier_id) {
    try {
        const orders = db.prepare('SELECT * FROM purchase_orders WHERE supplier_id = ? ORDER BY order_date DESC').all(supplier_id);
        const summary = db.prepare(`
            SELECT COALESCE(SUM(total_amount - paid_amount), 0) as total_hutang
            FROM purchase_orders
            WHERE supplier_id = ? AND status IN ('ordered', 'received', 'partial')
        `).get(supplier_id);

        return { orders, total_hutang: summary.total_hutang };
    } catch (err) {
        log.error(`getSupplierStatement failed: ${err.message}`);
        return { orders: [], total_hutang: 0 };
    }
}

module.exports = {
    createPurchaseOrder,
    receivePurchaseOrder,
    recordPurchasePayment,
    voidPurchaseOrder,
    getPurchaseOrderById,
    getAllPurchaseOrders,
    getAPSummary,
    getSupplierStatement
};

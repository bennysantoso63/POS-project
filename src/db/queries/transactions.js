const db = require('../db.js');

// Transaksi Atomik
const createTransaction = db.transaction((txData) => {
  // 1. Insert ke tabel transactions
  const insertTx = db.prepare(`
    INSERT INTO transactions (total, payment_method, amount_paid, change_amount, tx_tier, customer_id, is_receivable, due_date, cashier_session_id, status)
    VALUES (@total, @payment_method, @amount_paid, @change_amount, @tx_tier, @customer_id, @is_receivable, @due_date, @cashier_session_id, 'completed')
  `);
  
  const txInfo = insertTx.run({
    total: txData.total,
    payment_method: txData.paymentMethod,
    amount_paid: txData.amountPaid,
    change_amount: txData.changeAmount,
    tx_tier: txData.txTier || 'eceran',
    customer_id: txData.customerId || null,
    is_receivable: txData.paymentMethod === 'kasbon' ? 1 : 0,
    due_date: txData.dueDate || null,
    cashier_session_id: txData.sessionId || null
  });
  
  const txId = txInfo.lastInsertRowid;

  // Siapkan statement untuk item & stok
  const insertItem = db.prepare(`
    INSERT INTO transaction_items (transaction_id, product_id, qty, multiplier, unit_type, unit_price, cost_price) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const updateStock = db.prepare(`UPDATE products SET stock_pcs = stock_pcs - ? WHERE id = ? AND stock_pcs >= ?`);
  const insertMovement = db.prepare(`
    INSERT INTO stock_movements (product_id, delta, reason, transaction_id, user_name) 
    VALUES (?, ?, ?, ?, ?)
  `);

  // 2. Loop setiap item di keranjang
  for (const item of txData.items) {
    const totalPcs = item.qty * item.multiplier;
    
    // Ambil data produk terbaru untuk cost_price
    const prod = db.prepare('SELECT cost_price FROM products WHERE id = ?').get(item.product_id);
    const costPrice = prod ? prod.cost_price : 0;

    // Kurangi stok (Validasi level database)
    const stockResult = updateStock.run(totalPcs, item.product_id, totalPcs);
    if (stockResult.changes === 0) {
      throw new Error(`Stok tidak mencukupi untuk produk: ${item.name}`);
    }

    // Catat item terjual (Termasuk HPP)
    insertItem.run(txId, item.product_id, item.qty, item.multiplier, item.unitType, item.price_at_transaction, costPrice);
    
    // Catat audit trail pergerakan barang
    insertMovement.run(item.product_id, -totalPcs, `Penjualan (TX-${txId})`, txId, txData.userName || 'System');
  }

  // 3. Update Session if exists and payment is cash
  if (txData.sessionId && txData.paymentMethod === 'cash') {
    db.prepare(`
      UPDATE cashier_sessions 
      SET expected_cash = expected_cash + ?, total_tx_count = total_tx_count + 1 
      WHERE id = ?
    `).run(txData.total, txData.sessionId);
  } else if (txData.sessionId) {
    db.prepare(`
      UPDATE cashier_sessions 
      SET total_tx_count = total_tx_count + 1 
      WHERE id = ?
    `).run(txData.sessionId);
  }

  // 4. Update Customer total spent if exists
  if (txData.customerId) {
    db.prepare(`UPDATE customers SET total_spent = total_spent + ? WHERE id = ?`).run(txData.total, txData.customerId);
  }

  return txId;
});

// Void Atomik
const voidTransaction = db.transaction((txId) => {
  const tx = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(txId);
  if (!tx || tx.status === 'void') return { success: false, message: 'Transaksi tidak valid atau sudah di-void' };

  // 1. Ubah status transaksi
  db.prepare(`UPDATE transactions SET status = 'void' WHERE id = ?`).run(txId);

  // 2. Kembalikan Stok & Catat pergerakan
  const items = db.prepare(`SELECT * FROM transaction_items WHERE transaction_id = ?`).all(txId);
  const updateStock = db.prepare(`UPDATE products SET stock_pcs = stock_pcs + ? WHERE id = ?`);
  const insertMovement = db.prepare(`INSERT INTO stock_movements (product_id, delta, reason, transaction_id) VALUES (?, ?, ?, ?)`);

  for (const item of items) {
    const totalPcsToReturn = item.qty * item.multiplier;
    updateStock.run(totalPcsToReturn, item.product_id);
    insertMovement.run(item.product_id, totalPcsToReturn, `Void Transaksi (${txId})`, txId);
  }

  // 3. Update Session expected cash if was cash
  if (tx.cashier_session_id && tx.payment_method === 'cash') {
    db.prepare(`UPDATE cashier_sessions SET expected_cash = expected_cash - ? WHERE id = ?`).run(tx.total, tx.cashier_session_id);
  }

  // 4. Update Customer total spent
  if (tx.customer_id) {
    db.prepare(`UPDATE customers SET total_spent = total_spent - ? WHERE id = ?`).run(tx.total, tx.customer_id);
  }

  return { success: true, message: 'Void berhasil, stok & saldo direvisi' };
});

const getTransactions = () => {
  const transactions = db.prepare(`
    SELECT t.*, c.name as customer_name
    FROM transactions t
    LEFT JOIN customers c ON t.customer_id = c.id
    ORDER BY created_at DESC
  `).all();

  return transactions.map(tx => {
    const items = db.prepare(`
      SELECT ti.*, p.name, p.sku
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE ti.transaction_id = ?
    `).all(tx.id);
    return { ...tx, items };
  });
};

/**
 * [KB] Mendapatkan rangkuman piutang per pelanggan.
 */
const getCustomerReceivables = () => {
    const stmt = db.prepare(`
        SELECT 
            c.id, c.name, c.phone,
            SUM(CASE WHEN t.payment_method = 'kasbon' AND t.status = 'completed' THEN t.total ELSE 0 END) as total_kasbon,
            SUM(CASE WHEN t.payment_method = 'pelunasan_kasbon' AND t.status = 'completed' THEN t.total ELSE 0 END) as total_dibayar
        FROM customers c
        LEFT JOIN transactions t ON c.id = t.customer_id
        GROUP BY c.id
        HAVING (total_kasbon - total_dibayar) > 0
    `);
    
    const customers = stmt.all();
    return customers.map(c => ({
        ...c,
        sisa_utang: (c.total_kasbon || 0) - (c.total_dibayar || 0)
    }));
};

const getPiutangReport = () => {
  return db.prepare(`
    SELECT 
      c.id, 
      c.name, 
      c.phone,
      SUM(CASE WHEN t.payment_method = 'kasbon' AND t.status = 'completed' THEN t.total ELSE 0 END) -
      SUM(CASE WHEN t.payment_method = 'pelunasan_kasbon' AND t.status = 'completed' THEN t.total ELSE 0 END) as total_piutang,
      MAX(t.created_at) as last_tx
    FROM customers c
    JOIN transactions t ON c.id = t.customer_id
    GROUP BY c.id
    HAVING total_piutang > 0
    ORDER BY total_piutang DESC
  `).all();
};

module.exports = {
  createTransaction,
  voidTransaction,
  getTransactions,
  getCustomerReceivables,
  getPiutangReport
};

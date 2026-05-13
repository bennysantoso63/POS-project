const migrations = [
    // transactions
    "ALTER TABLE transactions ADD COLUMN is_receivable INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE transactions ADD COLUMN due_date TEXT",
    // cashier_sessions
    "ALTER TABLE cashier_sessions ADD COLUMN cash_difference INTEGER DEFAULT 0",
    "ALTER TABLE cashier_sessions ADD COLUMN total_sales INTEGER DEFAULT 0",
    // expenses
    "ALTER TABLE expenses ADD COLUMN subcategory TEXT",
    "ALTER TABLE expenses ADD COLUMN notes TEXT",
    // purchase_orders
    "ALTER TABLE purchase_orders ADD COLUMN supplier_name TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN order_date TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN due_date TEXT",
    "ALTER TABLE purchase_orders ADD COLUMN notes TEXT",
    // receivables
    "ALTER TABLE receivables ADD COLUMN customer_name TEXT",
    "ALTER TABLE receivables ADD COLUMN customer_phone TEXT",
    "ALTER TABLE receivables ADD COLUMN notes TEXT",
    // suppliers
    "ALTER TABLE suppliers ADD COLUMN contact_name TEXT",
    "ALTER TABLE suppliers ADD COLUMN notes TEXT",
    // customers
    "ALTER TABLE customers ADD COLUMN notes TEXT",
];

const createTables = [
    `CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id),
        product_id INTEGER REFERENCES products(id),
        product_name TEXT NOT NULL,
        qty INTEGER NOT NULL CHECK(qty > 0),
        unit_price INTEGER NOT NULL,
        total_price INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_items(purchase_order_id)`,
    `CREATE TABLE IF NOT EXISTS purchase_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id),
        amount INTEGER NOT NULL CHECK(amount > 0),
        payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','transfer','qris_manual')),
        paid_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        cashier_session_id INTEGER REFERENCES cashier_sessions(id),
        notes TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_pp_po ON purchase_payments(purchase_order_id)`,
    `CREATE TABLE IF NOT EXISTS receivable_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receivable_id INTEGER NOT NULL REFERENCES receivables(id),
        amount INTEGER NOT NULL CHECK(amount > 0),
        payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','transfer','qris_manual')),
        paid_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        cashier_session_id INTEGER REFERENCES cashier_sessions(id),
        notes TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_rp_receivable ON receivable_payments(receivable_id)`,
    `CREATE TABLE IF NOT EXISTS held_bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        cart_data TEXT NOT NULL,
        created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )`
];

const applyMissingColumnsMigration = (db) => {
    console.log('--- Memulai Migrasi Kolom (Missing Columns) ---');

    // CREATE TABLE
    for (const sql of createTables) {
        try {
            db.exec(sql);
            console.log('OK (Table/Index):', sql.substring(0, 50).replace(/\n/g, ' ') + '...');
        } catch (err) {
            // console.error('SKIP (Table/Index):', err.message);
        }
    }

    // ALTER TABLE
    for (const sql of migrations) {
        try {
            db.exec(sql);
            console.log('OK (Column):', sql);
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                // console.log('SKIP (Sudah ada):', sql);
            } else {
                console.error('ERROR (Column):', err.message, '|', sql);
            }
        }
    }

    console.log('--- Migrasi Kolom Selesai ---');
};

module.exports = { applyMissingColumnsMigration };

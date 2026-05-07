-- Tabel Produk
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price_retail INTEGER NOT NULL,
    price_wholesale INTEGER NOT NULL,
    cost_price INTEGER DEFAULT 0, -- Harga Modal (HPP)
    stock_pcs INTEGER NOT NULL DEFAULT 0,
    uom_box_active INTEGER DEFAULT 0, -- 0: Inactive, 1: Active
    uom_box_multiplier INTEGER DEFAULT 1,
    low_stock_threshold INTEGER DEFAULT 5,
    category TEXT DEFAULT 'Uncategorized',
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- Tabel Pelanggan (CRM)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    default_tier TEXT DEFAULT 'eceran',
    total_spent INTEGER DEFAULT 0,
    join_date TEXT DEFAULT (date('now'))
);

-- Tabel Sesi Kasir
CREATE TABLE IF NOT EXISTS cashier_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- Bisa dikaitkan ke tabel users nanti jika ada
    user_name TEXT,
    opened_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    closed_at TEXT,
    opening_cash INTEGER NOT NULL,
    closing_cash INTEGER,
    expected_cash INTEGER DEFAULT 0,
    total_tx_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active' or 'closed'
    notes TEXT
);

-- Tabel Transaksi (AR: Mendukung Kasbon / Piutang)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    total INTEGER NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','transfer','qris_manual', 'kasbon', 'pelunasan_kasbon')),
    amount_paid INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    tx_tier TEXT DEFAULT 'eceran',
    customer_id INTEGER REFERENCES customers(id),
    is_receivable BOOLEAN DEFAULT 0, -- [KB] Flag piutang
    due_date TEXT DEFAULT NULL,      -- [KB] Tanggal jatuh tempo piutang
    cashier_session_id INTEGER REFERENCES cashier_sessions(id),
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','void'))
);

-- Item dalam Transaksi
CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    qty INTEGER NOT NULL CHECK(qty > 0),
    multiplier INTEGER DEFAULT 1, -- Untuk mencatat apakah beli Box atau Pcs
    unit_type TEXT DEFAULT 'Pcs', -- 'Box' atau 'Pcs'
    unit_price INTEGER NOT NULL,
    cost_price INTEGER DEFAULT 0 -- Menyimpan HPP saat transaksi terjadi (Audit Integrity)
);

-- Pergerakan Stok (Audit Trail)
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL, -- Misal: 'Penjualan (TX-1001)', 'Void', etc.
    user_name TEXT,
    transaction_id INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- Pengaturan Toko
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Index Wajib
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- Seed Default Settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
('store_name', 'Toko Grosir Mandiri'), 
('store_address', 'Jl. Pahlawan No. 45, Surabaya'), 
('store_phone', '08123456789'),
('tax_type', 'OP'),
('tax_start_year', '2024'),
('server_ip', '192.168.1.100');

-- Tabel Pengguna (Sistem Login & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL, -- Bcrypt Hash
    role TEXT NOT NULL DEFAULT 'kasir' CHECK(role IN ('admin', 'supervisor', 'kasir')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Tabel Sesi Kasir (Moka Style)
CREATE TABLE IF NOT EXISTS cashier_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opening_cash INTEGER NOT NULL,
    opened_at TEXT DEFAULT (datetime('now','localtime')),
    closed_at TEXT DEFAULT NULL,
    closing_cash INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    cash_difference INTEGER DEFAULT 0,
    notes TEXT DEFAULT ''
);

-- Tabel Held Bills (Simpan Antrian / Draft)
CREATE TABLE IF NOT EXISTS held_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    cart_data TEXT NOT NULL, -- JSON String
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- Tabel Expenses (Kas Keluar - Sprint 7 Blueprint)
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL DEFAULT (date('now','localtime')),
    amount INTEGER NOT NULL CHECK(amount > 0),
    category TEXT NOT NULL CHECK(category IN ('opex','non_deductible','prive')),
    subcategory TEXT,
    description TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','transfer','qris_manual')),
    cashier_session_id INTEGER REFERENCES cashier_sessions(id),
    receipt_image_path TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    notes TEXT
);

-- --- RELATIONSHIPS & ACCOUNTING (PATCH 9B) ---

-- 1. TABEL CUSTOMER (PELANGGAN)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 2. TABEL PIUTANG (ACCOUNTS RECEIVABLE)
CREATE TABLE IF NOT EXISTS receivables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT,
    customer_phone TEXT,
    amount INTEGER NOT NULL,
    due_date TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'outstanding' CHECK(status IN ('outstanding', 'partial', 'paid', 'void')),
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 3. TABEL PEMBAYARAN PIUTANG
CREATE TABLE IF NOT EXISTS receivable_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receivable_id INTEGER NOT NULL REFERENCES receivables(id),
    amount INTEGER NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    cashier_session_id INTEGER REFERENCES cashier_sessions(id),
    notes TEXT,
    paid_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 4. TABEL SUPPLIER (PEMASOK)
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 5. TABEL PURCHASE ORDERS (ACCOUNTS PAYABLE)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER REFERENCES suppliers(id),
    supplier_name TEXT,
    total_amount INTEGER DEFAULT 0,
    paid_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'ordered', 'received', 'partial', 'paid', 'void')),
    order_date TEXT DEFAULT (datetime('now', 'localtime')),
    due_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 6. ITEM DALAM PURCHASE ORDER
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER REFERENCES purchase_orders(id),
    product_id INTEGER REFERENCES products(id),
    product_name TEXT,
    qty INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL
);

-- 7. TABEL PEMBAYARAN HUTANG (PO PAYMENTS)
CREATE TABLE IF NOT EXISTS purchase_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id),
    amount INTEGER NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    cashier_session_id INTEGER REFERENCES cashier_sessions(id),
    notes TEXT,
    paid_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- [KB] Migration for existing supplier/po tables if they were simple
DROP TABLE IF EXISTS po_items; 
-- Item sekarang menggunakan purchase_order_items untuk konsistensi dengan snippet.

-- [CLEANUP] petty_cash_logs removed in favor of unified expenses table

-- Migration Scripts (Safe execution for Patch 9A)
-- [KB] Migration for cashier_sessions
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS cashier_sessions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opening_cash INTEGER NOT NULL,
    opened_at TEXT DEFAULT (datetime('now','localtime')),
    closed_at TEXT DEFAULT NULL,
    closing_cash INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    cash_difference INTEGER DEFAULT 0,
    notes TEXT DEFAULT ''
);
INSERT OR IGNORE INTO cashier_sessions_new (id, opening_cash, opened_at, closed_at, closing_cash)
SELECT id, opening_cash, opened_at, closed_at, closing_cash FROM cashier_sessions;
DROP TABLE IF EXISTS cashier_sessions;
ALTER TABLE cashier_sessions_new RENAME TO cashier_sessions;
COMMIT;
PRAGMA foreign_keys=ON;

-- [KB] Migration for existing transactions table
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS transactions_new3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    total INTEGER NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','transfer','qris_manual', 'kasbon', 'pelunasan_kasbon')),
    amount_paid INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    tx_tier TEXT DEFAULT 'eceran',
    customer_id INTEGER REFERENCES customers(id),
    is_receivable BOOLEAN DEFAULT 0,
    due_date TEXT DEFAULT NULL,
    cashier_session_id INTEGER REFERENCES cashier_sessions(id),
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','void'))
);
INSERT OR IGNORE INTO transactions_new3 (id, created_at, total, payment_method, amount_paid, change_amount, tx_tier, customer_id, is_receivable, due_date, cashier_session_id, status)
SELECT id, created_at, total, payment_method, amount_paid, change_amount, tx_tier, customer_id, is_receivable, due_date, cashier_session_id, status FROM transactions;
DROP TABLE IF EXISTS transactions;
ALTER TABLE transactions_new3 RENAME TO transactions;
COMMIT;
PRAGMA foreign_keys=ON;

-- Tabel Leakage (Kerugian / Barang Rusak / Selisih Kas)
CREATE TABLE IF NOT EXISTS leakages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    qty INTEGER DEFAULT 1,
    reason TEXT NOT NULL, -- 'BROKEN', 'EXPIRED', 'SHIFT_SHORTAGE'
    total_loss INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Tabel Kategori Produk
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Seed awal kategori jika belum ada
INSERT OR IGNORE INTO categories (name, sort_order) VALUES ('Umum', 99);
INSERT OR IGNORE INTO categories (name, sort_order) VALUES ('Makanan', 1);
INSERT OR IGNORE INTO categories (name, sort_order) VALUES ('Minuman', 2);


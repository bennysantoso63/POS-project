-- ==============================================================================
-- POS MANDIRI ENTERPRISE v2.5 - MASTER SCHEMA
-- Includes: Retail, F&B (BOM), Security (RBAC), and Audit Trail
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. SECURITY & AUTHENTICATION (Sprint 9B/11)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL, -- Bcrypt Hash
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier', 'auditor')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL, -- 'VOID', 'CREATE_USER', 'CHANGE_SETTINGS', 'SPOILAGE'
    target TEXT, -- 'TX-12345', 'ING-5'
    details TEXT, -- JSON Payload
    timestamp DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- 2. MASTER DATA (RETAIL & F&B)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    price_retail INTEGER NOT NULL,
    price_wholesale INTEGER NOT NULL,
    cost_price INTEGER DEFAULT 0, -- HPP Ritel
    stock_pcs INTEGER NOT NULL DEFAULT 0,
    uom_box_active INTEGER DEFAULT 0,
    uom_box_multiplier INTEGER DEFAULT 1,
    low_stock_threshold INTEGER DEFAULT 5,
    last_sold_at DATETIME,
    -- [SEMBAHYANG] Metadata
    is_anchor_item INTEGER NOT NULL DEFAULT 0,
    margin_target_pct REAL,
    event_tag TEXT,
    event_end_date TEXT,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- 3. F&B ENGINE (Sprint 10: BOM & INGREDIENTS)
CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY, -- Cth: 'ING-001'
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- 'gram', 'ml', 'pcs'
    stock_qty REAL NOT NULL DEFAULT 0,
    max_capacity REAL NOT NULL DEFAULT 0,
    cost_per_unit INTEGER NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS product_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    ing_id TEXT NOT NULL REFERENCES ingredients(id),
    qty REAL NOT NULL, -- Jumlah bahan yang dibutuhkan per 1 porsi produk
    UNIQUE(product_id, ing_id)
);

CREATE TABLE IF NOT EXISTS spoilage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ing_id TEXT NOT NULL REFERENCES ingredients(id),
    qty REAL NOT NULL,
    reason TEXT,
    loss_value INTEGER NOT NULL,
    logged_by TEXT,
    logged_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- 4. KASIR, SHIFT & BILLING
CREATE TABLE IF NOT EXISTS cashier_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    user_name TEXT,
    opened_at DATETIME DEFAULT (datetime('now', 'localtime')),
    closed_at DATETIME,
    opening_cash INTEGER NOT NULL,
    closing_cash INTEGER DEFAULT 0,
    expected_cash INTEGER DEFAULT 0,
    total_tx_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed')),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total INTEGER NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','transfer','qris','kasbon','pelunasan_kasbon')),
    amount_paid INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    tx_tier TEXT DEFAULT 'eceran',
    customer_id INTEGER REFERENCES customers(id),
    cashier_session_id INTEGER REFERENCES cashier_sessions(id),
    business_mode TEXT DEFAULT 'RETAIL', -- 'RETAIL' or 'FNB'
    table_label TEXT, -- Khusus F&B
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','void')),
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    qty INTEGER NOT NULL,
    multiplier INTEGER DEFAULT 1,
    unit_type TEXT DEFAULT 'pcs',
    unit_price INTEGER NOT NULL,
    name TEXT, -- Nama produk saat transaksi
    cost_price INTEGER DEFAULT 0 -- Menyimpan HPP saat transaksi (HPP Ritel atau HPP BOM)
);

CREATE TABLE IF NOT EXISTS kds_tickets (
    id TEXT PRIMARY KEY, -- Format: KDS-[TX_ID]
    table_label TEXT,
    items_json TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COOKING', 'READY', 'SERVED', 'CANCELLED')),
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- 5. CRM & RECEIVABLES (PIUTANG)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    default_tier TEXT DEFAULT 'eceran',
    total_spent INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS receivables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER REFERENCES transactions(id),
    customer_id INTEGER REFERENCES customers(id),
    amount INTEGER NOT NULL,
    due_date TEXT,
    status TEXT DEFAULT 'outstanding' CHECK(status IN ('outstanding', 'paid', 'void')),
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- 6. SUPPLIERS & PAYABLES (HUTANG)
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER REFERENCES suppliers(id),
    total_amount INTEGER DEFAULT 0,
    paid_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ordered' CHECK(status IN ('ordered', 'received', 'paid', 'void')),
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- 7. AUDIT & SETTINGS
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    delta INTEGER NOT NULL,
    reason TEXT,
    transaction_id INTEGER,
    user_name TEXT,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL,
    category TEXT CHECK(category IN ('opex', 'non_deductible', 'prive')),
    description TEXT,
    payment_method TEXT DEFAULT 'cash',
    cashier_session_id INTEGER REFERENCES cashier_sessions(id),
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 8. SEED DATA
INSERT OR IGNORE INTO settings (key, value) VALUES 
('store_name', 'Toko Grosir Mandiri'),
('store_id', 'STORE-001'),
('business_mode', 'RETAIL'),
('target_laba', '15000000'),
('fixed_opex', '3500000'),
('tax_type', 'OP'),
('cloud_enabled', 'false'),
('cloud_url', 'http://localhost:3000'),
('cloud_key', 'POS_SECRET_2024');

INSERT OR IGNORE INTO categories (id, name) VALUES (1, 'Umum'), (2, 'Makanan'), (3, 'Minuman');

-- 9. REMOTE SYNC DATA (Sprint 12)
CREATE TABLE IF NOT EXISTS remote_store_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cloud_id INTEGER UNIQUE,
    store_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    pulled_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS held_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    cart_data TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- 10. SEMBAHYANG INTELLIGENCE (LUNAR & RAG)
CREATE TABLE IF NOT EXISTS Dim_Date_Lunar (
    date_id TEXT PRIMARY KEY, -- Format: YYYY-MM-DD
    gregorian_date TEXT NOT NULL,
    lunar_date TEXT NOT NULL,
    ritual_name TEXT,
    intensity_score INTEGER NOT NULL DEFAULT 1 -- Skala 1-10
);

CREATE TABLE IF NOT EXISTS Knowledge_Vectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_name TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding_json TEXT NOT NULL
);

-- 11. SEMBAHYANG INTELLIGENCE (Analytics & Predictions)
CREATE TABLE IF NOT EXISTS apriori_rules (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    item_a_id       INTEGER NOT NULL REFERENCES products(id),
    item_b_id       INTEGER NOT NULL REFERENCES products(id),
    support         REAL NOT NULL DEFAULT 0.0,
    confidence_pct  INTEGER NOT NULL,
    lift            REAL NOT NULL DEFAULT 1.0,
    computed_at     TEXT DEFAULT (datetime('now','localtime')),
    CHECK(item_a_id != item_b_id)
);

CREATE TABLE IF NOT EXISTS customer_rfm (
    customer_id  INTEGER PRIMARY KEY REFERENCES customers(id),
    recency_days INTEGER NOT NULL,
    frequency    INTEGER NOT NULL,
    monetary     INTEGER NOT NULL,
    rfm_score    REAL NOT NULL,
    rfm_label    TEXT NOT NULL CHECK(rfm_label IN ('vip','loyal','potential','at_risk','churned')),
    computed_at  TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS burnrate_predictions (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id               INTEGER NOT NULL REFERENCES customers(id),
    product_id                INTEGER NOT NULL REFERENCES products(id),
    avg_days_between_purchase REAL NOT NULL,
    last_purchase_date        TEXT NOT NULL,
    predicted_next_purchase   TEXT NOT NULL,
    days_until_stockout       INTEGER NOT NULL,
    computed_at               TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS void_anomaly_log (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    cashier_session_id INTEGER NOT NULL REFERENCES cashier_sessions(id),
    user_id            INTEGER REFERENCES users(id),
    void_count         INTEGER NOT NULL,
    void_total_value   INTEGER NOT NULL,
    anomaly_flag       INTEGER NOT NULL DEFAULT 0,
    threshold_used     INTEGER NOT NULL,
    created_at         TEXT DEFAULT (datetime('now','localtime'))
);



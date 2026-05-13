-- SCHEMA FONDASI DATA POS MANDIRI (LUNAR-INTEGRATED)
-- Menggunakan INTEGER untuk data finansial demi mencegah kesalahan pembulatan desimal

CREATE TABLE IF NOT EXISTS Products (
    barcode TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    cost_price INTEGER NOT NULL,
    sell_price INTEGER NOT NULL,
    stock_level INTEGER NOT NULL DEFAULT 0,
    safety_stock INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS Dim_Date_Lunar (
    date_id TEXT PRIMARY KEY, -- Format: YYYY-MM-DD
    gregorian_date TEXT NOT NULL,
    lunar_date TEXT NOT NULL,
    ritual_name TEXT,
    intensity_score INTEGER NOT NULL DEFAULT 1 -- Skala 1-10 (High Intensity = Sembahyang Besar)
);

CREATE TABLE IF NOT EXISTS Sales_Facts (
    transaction_id TEXT PRIMARY KEY,
    date_id TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    total_profit INTEGER NOT NULL,
    FOREIGN KEY (date_id) REFERENCES Dim_Date_Lunar(date_id)
);

CREATE TABLE IF NOT EXISTS Transaction_Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL,
    product_barcode TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES Sales_Facts(transaction_id),
    FOREIGN KEY (product_barcode) REFERENCES Products(barcode)
);

-- Tabel untuk RAG Lokal (Linguistic Search)
CREATE TABLE IF NOT EXISTS Knowledge_Vectors (
    doc_id TEXT PRIMARY KEY,
    chunk_text TEXT NOT NULL,
    embedding_vector BLOB -- Menyimpan vektor B-Tree/VSS (Virtual Search System)
);

-- DATA SIMULASI (Seed Data)
INSERT OR IGNORE INTO Products (barcode, name, category, cost_price, sell_price, stock_level, safety_stock) VALUES 
('8991234567890', 'Dupa Cendana Premium', 'Dupa', 15000, 25000, 50, 10),
('8991234500045', 'Lilin Teratai Merah (Pasang)', 'Lilin', 25000, 40000, 8, 15),
('8999876543210', 'Kertas Kimcoa Emas', 'Kertas', 8000, 15000, 120, 20);

/**
 * Migration Script: Sembahyang Module
 * Menambahkan kolom pada tabel `products` dan membuat tabel penunjang
 * (Apriori, RFM, Burn-rate, Anomaly Log) tanpa mengganggu skema retail utama.
 */

const applySembahyangMigration = (db) => {
  try {
    // Memulai transaksi agar jika terjadi error, skema utama tidak corrupt (Clean Code: Atomicity)
    db.exec('BEGIN TRANSACTION;');

    // ---------------------------------------------------------
    // 1. ALTER TABLE `products` (Safe/Idempotent Check)
    // ---------------------------------------------------------
    const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    const existingColumns = tableInfo.map(col => col.name);

    if (!existingColumns.includes('is_anchor_item')) {
      db.exec("ALTER TABLE products ADD COLUMN is_anchor_item INTEGER DEFAULT 0;");
    }
    if (!existingColumns.includes('margin_target_pct')) {
      db.exec("ALTER TABLE products ADD COLUMN margin_target_pct INTEGER DEFAULT 0;");
    }
    if (!existingColumns.includes('event_tag')) {
      db.exec("ALTER TABLE products ADD COLUMN event_tag TEXT;");
    }
    if (!existingColumns.includes('event_end_date')) {
      db.exec("ALTER TABLE products ADD COLUMN event_end_date TEXT;");
    }

    // ---------------------------------------------------------
    // 2. CREATE INTELLIGENCE TABLES
    // ---------------------------------------------------------
    db.exec(`
      -- Tabel Aturan Asosiasi Bundling (Cache dari background job)
      CREATE TABLE IF NOT EXISTS apriori_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        primary_item_id INTEGER NOT NULL,
        secondary_item_id INTEGER NOT NULL,
        confidence_pct INTEGER NOT NULL,
        FOREIGN KEY(primary_item_id) REFERENCES products(id),
        FOREIGN KEY(secondary_item_id) REFERENCES products(id)
      );

      -- Tabel Segmentasi RFM Pelanggan
      CREATE TABLE IF NOT EXISTS customer_rfm (
        customer_id INTEGER PRIMARY KEY,
        segment TEXT NOT NULL,
        score INTEGER NOT NULL,
        last_updated TEXT NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      );

      -- Tabel Prediksi Kehabisan Barang (Burn-Rate)
      CREATE TABLE IF NOT EXISTS burnrate_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        predicted_out_date TEXT NOT NULL,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      );

      -- Tabel Audit Log untuk Blind Reconciliation
      CREATE TABLE IF NOT EXISTS void_anomaly_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        tx_id INTEGER,
        reason TEXT NOT NULL,
        gap_amount INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );
    `);

    db.exec('COMMIT;');
    console.log("[MIGRATION SUCCESS] Sembahyang Module schema applied.");
    return true;

  } catch (error) {
    db.exec('ROLLBACK;');
    console.error("[MIGRATION ERROR] Failed to apply Sembahyang Module schema:", error);
    throw error;
  }
};

module.exports = { applySembahyangMigration };

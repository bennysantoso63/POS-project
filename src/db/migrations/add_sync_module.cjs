/**
 * Migration Script: Omnichannel Sync Module
 * Menambahkan tabel untuk mapping ID eksternal (Shopee/Tokped) 
 * dan kolom untuk Google Contacts Sync secara Idempotent.
 */

const applySyncMigration = (db) => {
  try {
    // Memulai transaksi agar skema tetap utuh jika terjadi kegagalan (Atomic)
    db.exec('BEGIN TRANSACTION;');

    // 1. CREATE TABLE: external_mappings (Untuk Shopee/Tokped/Tiktok)
    db.exec(`
      CREATE TABLE IF NOT EXISTS external_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        internal_id INTEGER NOT NULL,
        entity_type TEXT NOT NULL, -- cth: 'product', 'category'
        external_id TEXT NOT NULL, -- cth: ID Produk di Shopee
        platform_name TEXT NOT NULL, -- cth: 'shopee', 'tokopedia'
        last_synced TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entity_type, external_id, platform_name) -- Mencegah duplikasi mapping
      );
    `);

    // 2. CREATE TABLE: sync_logs (Untuk Audit & Debugging)
    db.exec(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_type TEXT NOT NULL, -- cth: 'excel_upload', 'google_contacts'
        status TEXT NOT NULL, -- 'SUCCESS', 'FAILED', 'PARTIAL'
        records_processed INTEGER DEFAULT 0,
        error_details TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. ALTER TABLE: customers (Safe Check untuk Google Contacts)
    const custCols = db.prepare("PRAGMA table_info(customers)").all().map(c => c.name);
    if (!custCols.includes('google_contact_id')) {
      db.exec("ALTER TABLE customers ADD COLUMN google_contact_id TEXT;");
    }

    // 4. ALTER TABLE: products (Safe Check untuk Online Price)
    const prodCols = db.prepare("PRAGMA table_info(products)").all().map(c => c.name);
    if (!prodCols.includes('price_online')) {
      db.exec("ALTER TABLE products ADD COLUMN price_online INTEGER DEFAULT 0;");
    }

    db.exec('COMMIT;');
    console.log("[MIGRATION SUCCESS] Omnichannel Sync Module schema applied.");
    return true;

  } catch (error) {
    db.exec('ROLLBACK;');
    console.error("[MIGRATION ERROR] Failed to apply Sync Module schema:", error);
    throw error;
  }
};

module.exports = { applySyncMigration };

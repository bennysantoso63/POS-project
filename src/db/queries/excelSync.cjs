const XLSX = require('xlsx');
const db = require('../db.cjs');

/**
 * Task 3: Excel Mass Sync
 * Menerapkan pola "Design Thinking": Header Matcher & Dry Run UX.
 */

// Konfigurasi Header Matcher (Regex untuk menangkap variasi nama kolom dari platform)
const HEADER_DICTIONARY = {
  sku: /sku|barcode|nomor referensi/i,
  name: /nama.*produk|product.*name|judul/i,
  price: /harga|price/i,
  stock: /stok|stock|kuantitas/i,
  external_id: /id.*produk|item.*id/i // Opsional, ID bawaan platform
};

/**
 * Fase 1: DRY RUN (Baca Excel, petakan data, validasi, JANGAN sentuh DB)
 */
const parseExcelDryRun = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Konversi ke JSON format array of objects
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    if (rawData.length === 0) throw new Error("File Excel kosong.");
    if (rawData.length > 5000) throw new Error("Maksimal 5000 baris per upload untuk mencegah Out-Of-Memory.");

    // Ekstrak Header Asli
    const originalHeaders = Object.keys(rawData[0]);
    
    // Lakukan Mapping Header dengan Regex
    const mappedKeys = {};
    for (const header of originalHeaders) {
      for (const [standardKey, regex] of Object.entries(HEADER_DICTIONARY)) {
        if (regex.test(header) && !mappedKeys[standardKey]) {
          mappedKeys[standardKey] = header;
          break;
        }
      }
    }

    if (!mappedKeys.sku || !mappedKeys.name) {
      throw new Error("Gagal mendeteksi kolom wajib: 'SKU' atau 'Nama Produk'. Pastikan format Excel benar.");
    }

    // Ambil daftar SKU yang sudah ada di DB untuk mendeteksi Insert vs Update
    const existingSkusRaw = db.prepare("SELECT sku FROM products").all();
    const existingSkus = new Set(existingSkusRaw.map(row => row.sku.toString().trim()));

    const preview = {
      valid: [],
      errors: [],
      stats: { insert: 0, update: 0, error: 0 }
    };

    // Evaluasi Baris per Baris
    rawData.forEach((row, index) => {
      const sku = row[mappedKeys.sku]?.toString().trim();
      const name = row[mappedKeys.name]?.toString().trim();
      const price = parseFloat(row[mappedKeys.price]) || 0;
      const stock = parseInt(row[mappedKeys.stock], 10) || 0;
      const extId = mappedKeys.external_id ? row[mappedKeys.external_id]?.toString().trim() : sku;

      const item = { rowNumber: index + 2, sku, name, price, stock, external_id: extId };

      // Validasi Dasar
      if (!sku || !name) {
        item.errorReason = "SKU atau Nama kosong";
        preview.errors.push(item);
        preview.stats.error++;
      } else if (price < 0 || stock < 0) {
        item.errorReason = "Harga/Stok tidak boleh negatif";
        preview.errors.push(item);
        preview.stats.error++;
      } else {
        // Tentukan Action: Insert atau Update
        item.action = existingSkus.has(sku) ? 'UPDATE' : 'INSERT';
        preview.valid.push(item);
        if (item.action === 'UPDATE') preview.stats.update++;
        if (item.action === 'INSERT') preview.stats.insert++;
      }
    });

    return preview;

  } catch (error) {
    console.error("[EXCEL PARSER] Dry Run Error:", error);
    throw error;
  }
};

/**
 * Fase 2: COMMIT (Eksekusi All-or-Nothing Transaction ke Database)
 */
const commitExcelSync = (validDataArray, platformName = 'excel_manual') => {
  if (!validDataArray || validDataArray.length === 0) return { success: true, processed: 0 };

  const insertProductStmt = db.prepare(`
    INSERT INTO products (sku, name, price_retail, price_online, stock_pcs) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const updateProductRetailStmt = db.prepare(`
    UPDATE products SET name = ?, price_retail = ?, stock_pcs = ? 
    WHERE sku = ?
  `);

  const updateProductOnlineStmt = db.prepare(`
    UPDATE products SET name = ?, price_online = ?, stock_pcs = ? 
    WHERE sku = ?
  `);

  const upsertMappingStmt = db.prepare(`
    INSERT INTO external_mappings (internal_id, entity_type, external_id, platform_name)
    VALUES (?, 'product', ?, ?)
    ON CONFLICT(entity_type, external_id, platform_name) 
    DO UPDATE SET last_synced = CURRENT_TIMESTAMP
  `);

  try {
    db.exec('BEGIN TRANSACTION;');

    let processedCount = 0;

    for (const item of validDataArray) {
      let productId = null;

      if (item.action === 'UPDATE') {
        if (platformName === 'excel_manual') {
          updateProductRetailStmt.run(item.name, item.price, item.stock, item.sku);
        } else {
          updateProductOnlineStmt.run(item.name, item.price, item.stock, item.sku);
        }
        // Dapatkan ID internal untuk tabel mapping
        const prod = db.prepare("SELECT id FROM products WHERE sku = ?").get(item.sku);
        productId = prod.id;
      } else if (item.action === 'INSERT') {
        // Untuk produk baru, inisialisasi kedua harga (Retail & Online) dengan nilai yang sama dari Excel
        const result = insertProductStmt.run(item.sku, item.name, item.price, item.price, item.stock);
        productId = result.lastInsertRowid;
      }

      // Catat Mapping eksternal (Berguna untuk integrasi API Tokped/Shopee di masa depan)
      if (productId && item.external_id) {
        upsertMappingStmt.run(productId, item.external_id, platformName);
      }

      processedCount++;
    }

    // Catat ke Log Sinkronisasi
    db.prepare("INSERT INTO sync_logs (sync_type, status, records_processed) VALUES (?, ?, ?)")
      .run('excel_upload', 'SUCCESS', processedCount);

    db.exec('COMMIT;');
    return { success: true, processed: processedCount };

  } catch (error) {
    db.exec('ROLLBACK;');
    // Catat kegagalan ke Log
    db.prepare("INSERT INTO sync_logs (sync_type, status, error_details) VALUES (?, ?, ?)")
      .run('excel_upload', 'FAILED', error.message);
    
    console.error("[EXCEL SYNC] Commit Failed, Rolled back:", error);
    throw error;
  }
};

module.exports = {
  parseExcelDryRun,
  commitExcelSync
};

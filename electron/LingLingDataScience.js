// const Database = require('better-sqlite3'); // REMOVED: Using centralized db.cjs

/**
 * LING-LING DATA SCIENCE ENGINE
 * Modul intelijen untuk analisis perilaku konsumen dan prediksi stok.
 */
const { ipcMain } = require('electron');
const db = require('../src/db/db.cjs');

class LingLingDataScience {
  constructor() {
    // Menggunakan instance database global yang sudah di-init di main.cjs
    this.db = db;
  }

  // 1. ALGORITMA APRIORI (Cross-Selling Suggestions)
  // Mencari produk yang paling sering dibeli bersamaan dengan item di keranjang.
  getCrossSellRecommendations(cartBarcodes) {
    if (!cartBarcodes || cartBarcodes.length === 0) return [];

    const triggerBarcode = cartBarcodes[cartBarcodes.length - 1];

    try {
      const query = this.db.prepare(`
        SELECT 
            t2.product_barcode, 
            p.name, 
            COUNT(t2.transaction_id) as frequency 
        FROM Transaction_Items t1
        JOIN Transaction_Items t2 ON t1.transaction_id = t2.transaction_id
        JOIN Products p ON t2.product_barcode = p.barcode
        WHERE t1.product_barcode = ? 
          AND t2.product_barcode != ?
        GROUP BY t2.product_barcode
        ORDER BY frequency DESC
        LIMIT 3
      `);

      return query.all(triggerBarcode, triggerBarcode);
    } catch (error) {
      console.error("Ling-Ling Apriori Error:", error);
      return [];
    }
  }

  // 2. ALGORITMA PREDIKSI STOK LUNAR (Lunar Burn-Rate)
  // Menghitung sisa hari stok dengan mempertimbangkan intensitas ritual lunar.
  calculateLunarBurnRate(barcode, lookaheadDays = 7) {
    try {
      // A. Rata-rata penjualan harian (30 hari terakhir)
      const salesQuery = this.db.prepare(`
        SELECT SUM(quantity) as total_sold
        FROM Transaction_Items ti
        JOIN Sales_Facts sf ON ti.transaction_id = sf.transaction_id
        WHERE ti.product_barcode = ?
          AND date(sf.date_id) >= date('now', '-30 days')
      `);
      const salesData = salesQuery.get(barcode);
      const averageDailySales = (salesData.total_sold || 0) / 30;

      if (averageDailySales === 0) return { status: 'Aman', days_left: 999 };

      // B. Intensitas Ritual Lunar (Multiplier)
      const lunarQuery = this.db.prepare(`
        SELECT AVG(intensity_score) as avg_intensity
        FROM Dim_Date_Lunar
        WHERE date(gregorian_date) BETWEEN date('now') AND date('now', '+' || ? || ' days')
      `);
      const lunarData = lunarQuery.get(lookaheadDays);
      const intensityMultiplier = lunarData.avg_intensity || 1;

      // C. Stok Saat Ini
      const stockQuery = this.db.prepare(`SELECT stock_level, name FROM Products WHERE barcode = ?`);
      const product = stockQuery.get(barcode);

      // D. Kalkulasi Sisa Hari (Adjusted Burn Rate)
      const adjustedDailyBurn = averageDailySales * intensityMultiplier;
      const daysLeft = Math.floor(product.stock_level / adjustedDailyBurn);

      let status = 'Aman';
      if (daysLeft <= 3) status = 'Kritis';
      else if (daysLeft <= 7) status = 'Waspada';

      return {
        product_name: product.name,
        current_stock: product.stock_level,
        adjusted_burn_rate: adjustedDailyBurn.toFixed(2),
        days_left: daysLeft,
        status: status
      };

    } catch (error) {
      console.error("Ling-Ling Burn-Rate Error:", error);
      return null;
    }
  }

  // 3. 🚀 GLOBAL RECALCULATION: RFM (Recency, Frequency, Monetary)
  // Menghitung skor loyalitas pelanggan berdasarkan data historis.
  async recalculateRFM() {
    try {
      // Inisialisasi tabel rfm jika belum ada
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS customer_rfm (
          customer_id INTEGER PRIMARY KEY,
          recency INTEGER,
          frequency INTEGER,
          monetary REAL,
          segment TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Logika RFM Sederhana: Agregasi data transaksi
      const rfmData = this.db.prepare(`
        SELECT 
          customer_id,
          MAX(julianday('now') - julianday(created_at)) as recency,
          COUNT(id) as frequency,
          SUM(total) as monetary
        FROM transactions
        WHERE customer_id IS NOT NULL AND status = 'completed'
        GROUP BY customer_id
      `).all();

      const insertRfm = this.db.prepare(`
        INSERT OR REPLACE INTO customer_rfm (customer_id, recency, frequency, monetary, segment)
        VALUES (?, ?, ?, ?, ?)
      `);

      this.db.transaction(() => {
        for (const row of rfmData) {
          let segment = 'Reguler';
          if (row.frequency > 5 && row.monetary > 1000000) segment = 'Loyal';
          if (row.recency > 30) segment = 'Hibernating';
          
          insertRfm.run(row.customer_id, Math.floor(row.recency), row.frequency, row.monetary, segment);
        }
      })();

      return true;
    } catch (e) {
      console.error("RFM Calculation Error:", e);
      return false;
    }
  }

  // 4. 🚀 GLOBAL RECALCULATION: APRIORI (Association Rules)
  // Menghitung aturan cross-selling berdasarkan pola pembelian massal.
  async recalculateApriori() {
    try {
      log.info('[DS-ENGINE] Memperbarui aturan asosiasi produk (Apriori)...');

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS apriori_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          primary_item_id INTEGER,
          secondary_item_id INTEGER,
          confidence REAL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Cari pasangan item yang paling sering muncul bersamaan
      const rules = this.db.prepare(`
        SELECT 
          ti1.product_id as primary_id,
          ti2.product_id as secondary_id,
          COUNT(*) as count
        FROM transaction_items ti1
        JOIN transaction_items ti2 ON ti1.transaction_id = ti2.transaction_id
        WHERE ti1.product_id != ti2.product_id
        GROUP BY ti1.product_id, ti2.product_id
        HAVING count >= 2
        ORDER BY count DESC
        LIMIT 100
      `).all();

      this.db.prepare("DELETE FROM apriori_rules").run();
      const insertRule = this.db.prepare("INSERT INTO apriori_rules (primary_item_id, secondary_item_id, confidence) VALUES (?, ?, ?)");

      this.db.transaction(() => {
        for (const rule of rules) {
          insertRule.run(rule.primary_id, rule.secondary_id, 0.85); // Dummy confidence for POC
        }
      })();

      return true;
    } catch (e) {
      console.error("Apriori Calculation Error:", e);
      return false;
    }
  }

  /**
   * [P5] Unified Bundling Engine
   * Memadukan data statistik historis (dari DB) dengan analisis keranjang saat ini.
   */
  async getBundlingSuggestion(primaryItemId) {
    try {
      // Menggunakan koneksi DB utama (SQLite)
      const stmt = this.db.prepare(`
        SELECT p.id, p.name, p.price_retail as price, a.confidence_pct
        FROM apriori_rules a
        JOIN products p ON a.secondary_item_id = p.id
        WHERE a.primary_item_id = ?
        ORDER BY a.confidence_pct DESC
        LIMIT 1
      `);
      
      const staticSuggestion = stmt.get(primaryItemId);
      return staticSuggestion || null;

    } catch (error) {
      console.error("[DS_ENGINE] Error in getBundlingSuggestion:", error);
      return null;
    }
  }
}

// Global logger helper
const log = require('electron-log');
module.exports = new LingLingDataScience();

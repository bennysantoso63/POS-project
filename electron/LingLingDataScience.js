const log = require('electron-log');
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
  getCrossSellRecommendations(productId) {
    if (!productId) return [];
    try {
        const query = this.db.prepare(`
            SELECT
                t2.product_id,
                p.name,
                COUNT(t2.transaction_id) as frequency
            FROM transaction_items t1
            JOIN transaction_items t2
                ON t1.transaction_id = t2.transaction_id
            JOIN products p ON t2.product_id = p.id
            WHERE t1.product_id = ?
              AND t2.product_id != ?
            GROUP BY t2.product_id
            ORDER BY frequency DESC
            LIMIT 3
        `);
        return query.all(productId, productId);
    } catch (error) {
        console.error("Ling-Ling Apriori Error:", error);
        return [];
    }
  }

  // 2. ALGORITMA PREDIKSI STOK LUNAR (Lunar Burn-Rate)
  // Menghitung sisa hari stok dengan mempertimbangkan intensitas ritual lunar.
  calculateLunarBurnRate(productId, lookaheadDays = 7) {
    try {
        const salesQuery = this.db.prepare(`
            SELECT COALESCE(SUM(ti.qty), 0) as total_sold
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.product_id = ?
              AND t.status = 'completed'
              AND date(t.created_at) >= date('now', '-30 days')
        `);
        const salesData = salesQuery.get(productId);
        const averageDailySales = (salesData.total_sold || 0) / 30;
        if (averageDailySales === 0) return { status: 'Aman', days_left: 999 };

        const stockQuery = this.db.prepare(
            `SELECT stock_pcs, name FROM products WHERE id = ?`
        );
        const product = stockQuery.get(productId);
        if (!product) return null;

        const daysLeft = Math.floor(product.stock_pcs / averageDailySales);
        let status = 'Aman';
        if (daysLeft <= 3) status = 'Kritis';
        else if (daysLeft <= 7) status = 'Waspada';

        return {
            product_name       : product.name,
            current_stock      : product.stock_pcs,
            adjusted_burn_rate : averageDailySales.toFixed(2),
            days_left          : daysLeft,
            status,
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
        INSERT OR REPLACE INTO customer_rfm
        (customer_id, recency_days, frequency, monetary, rfm_score, rfm_label, computed_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))
      `);

      this.db.transaction(() => {
        for (const row of rfmData) {
          // Simple Scoring Normalization (Base 0-5 for calculation)
          const rScore = row.recency < 7 ? 5 : row.recency < 14 ? 4 : row.recency < 30 ? 3 : row.recency < 90 ? 2 : 1;
          const fScore = row.frequency > 10 ? 5 : row.frequency > 5 ? 4 : row.frequency > 2 ? 3 : 2;
          const mScore = row.monetary > 2000000 ? 5 : row.monetary > 1000000 ? 4 : row.monetary > 500000 ? 3 : 2;

          // Hitung rfm_score dari R, F, M yang sudah dinormalisasi (Weighting: 30%, 30%, 40%)
          const rfmScore = (rScore * 0.3 + fScore * 0.3 + mScore * 0.4) * 20;

          let rfmLabel;
          if (rfmScore >= 80)                              rfmLabel = 'vip';
          else if (rfmScore >= 60)                         rfmLabel = 'loyal';
          else if (rfmScore >= 40)                         rfmLabel = 'potential';
          else if (row.recency < 90 && rfmScore < 40)      rfmLabel = 'at_risk';
          else                                             rfmLabel = 'churned';

          insertRfm.run(
            row.customer_id,
            Math.floor(row.recency),
            row.frequency,
            row.monetary,
            Math.round(rfmScore),
            rfmLabel
          );
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
          confidence_pct INTEGER,
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
      const insertRule = this.db.prepare("INSERT INTO apriori_rules (primary_item_id, secondary_item_id, confidence_pct) VALUES (?, ?, ?)");

      this.db.transaction(() => {
        for (const rule of rules) {
          insertRule.run(rule.primary_id, rule.secondary_id, 85); // Dummy confidence for POC
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


module.exports = new LingLingDataScience();

const db = require('../db.cjs');

/**
 * Task 6: Intelligence Backend Layer
 * Bertanggung jawab mengeksekusi kueri analitik pre-calculated
 * seperti Apriori Bundling, tanpa mengganggu jalur transaksi utama.
 */

const getBundlingSuggestion = (primaryItemId) => {
  try {
    // Mengekstrak pasangan item dengan tingkat confidence tertinggi (cache dari background job)
    const stmt = db.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.price_retail as price, 
        p.is_anchor_item, 
        a.confidence_pct
      FROM apriori_rules a
      JOIN products p ON a.secondary_item_id = p.id
      WHERE a.primary_item_id = ?
      ORDER BY a.confidence_pct DESC
      LIMIT 1
    `);
    
    const suggestion = stmt.get(primaryItemId);
    return suggestion || null;

  } catch (error) {
    console.error("[INTELLIGENCE] Error fetching apriori suggestion:", error);
    return null; // Fail-safe (jangan merusak fungsi kasir meski query ini gagal)
  }
};

module.exports = {
  getBundlingSuggestion
};

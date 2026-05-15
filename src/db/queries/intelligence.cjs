const db = require('../db.cjs');

/**
 * Task 6: Intelligence Backend Layer
 * Bertanggung jawab mengeksekusi kueri analitik pre-calculated
 * seperti Apriori Bundling, tanpa mengganggu jalur transaksi utama.
 */

const getBundlingSuggestion = (primaryItemId) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.price_retail as price, 
        a.confidence
      FROM apriori_rules a
      JOIN products p ON a.secondary_item_id = p.id
      WHERE a.primary_item_id = ?
      ORDER BY a.confidence DESC
      LIMIT 1
    `);
    
    const suggestion = stmt.get(primaryItemId);
    return suggestion || null;
  } catch (error) {
    console.error("[INTELLIGENCE] Error fetching apriori suggestion:", error);
    return null;
  }
};

const getRFMMatrix = () => {
  try {
    const stmt = db.prepare(`
      SELECT
          c.name,
          c.phone,
          COALESCE(
              (SELECT SUM(t.total)
               FROM transactions t
               WHERE t.customer_id = c.id
                 AND t.status = 'completed'
                 AND t.created_at >= date('now','-90 days')
              ), 0
          ) AS totalSpent,
          rfm.rfm_label AS badge,
          CASE
              WHEN rfm.rfm_label = 'vip'
                  THEN 'bg-yellow-500/20 text-yellow-400'
              WHEN rfm.rfm_label = 'loyal'
                  THEN 'bg-emerald-500/20 text-emerald-400'
              WHEN rfm.rfm_label = 'at_risk'
                  THEN 'bg-orange-500/20 text-orange-400'
              WHEN rfm.rfm_label = 'churned'
                  THEN 'bg-slate-500/20 text-slate-400'
              ELSE 'bg-blue-500/20 text-blue-400'
          END AS color
      FROM customer_rfm rfm
      JOIN customers c ON rfm.customer_id = c.id
      ORDER BY rfm.rfm_score DESC
      LIMIT 20
    `);
    return stmt.all();
  } catch (e) {
    return [];
  }
};

const getAprioriRules = () => {
  try {
    return db.prepare('SELECT * FROM apriori_rules').all();
  } catch (e) {
    return [];
  }
};

const getBurnRateAlerts = () => {
  try {
    const stmt = db.prepare(`
      SELECT 
        name, 
        stock_pcs as current_stock,
        CAST(stock_pcs / 2.5 AS INTEGER) as daysLeft,
        2.5 as daily_velocity
      FROM products 
      WHERE stock_pcs < 50
      LIMIT 8
    `);
    return stmt.all();
  } catch (e) {
    return [];
  }
};

const getSembahyangBigBang = () => {
  // Data statis untuk POC atau bisa ditarik dari Dim_Date_Lunar jika tersedia
  return [
    { gregorian_date: '2024-02-10', ritual_name: 'Tahun Baru Imlek 2575', lunar_date: '01-01', intensity_score: 10 },
    { gregorian_date: '2024-02-24', ritual_name: 'Cap Go Meh', lunar_date: '01-15', intensity_score: 8 },
    { gregorian_date: '2024-04-04', ritual_name: 'Cheng Beng', lunar_date: '03-12', intensity_score: 9 }
  ];
};

const askLingLing = async (question) => {
  // Simple heuristic response logic for Ling-Ling Chat
  const q = question.toLowerCase();
  if (q.includes('stok')) return "Beberapa produk lilin dan dupa mulai menipis menjelang hari raya Cheng Beng. Sebaiknya lakukan restock 30% lebih banyak.";
  if (q.includes('laris')) return "Produk paling laris bulan ini adalah Dupa Wangi Premium dan Lilin Merah Besar.";
  return "Saya Ling-Ling, asisten AI toko Anda. Saya bisa membantu menganalisa stok dan tren penjualan berdasarkan kalender lunar.";
};

module.exports = {
  getBundlingSuggestion,
  getRFMMatrix,
  getAprioriRules,
  getBurnRateAlerts,
  getSembahyangBigBang,
  askLingLing
};

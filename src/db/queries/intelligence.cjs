const getDb = require('../db.cjs');

// Template fallback default jika AI tidak mengenali intent
const DEFAULT_RESPONSE = {
  found: false,
  answer: "Maaf bos, Ling-Ling kurang paham pertanyaannya. Coba tanya seputar 'barang apa yang stoknya mau habis', 'stok mati', atau 'kombinasi bundling produk'.",
  confidence_score: 0.1,
  citations: [],
  nudge: "Gunakan kata kunci sederhana seperti: 'stok habis', 'stok mati', atau 'cocoknya bareng'."
};

/**
 * RECALCULATE INSIGHTS (Pre-computed Architecture)
 * Dipanggil saat App Boot atau saat fetchData() untuk mencicil query berat.
 * Memiliki mekanisme stale-tolerance 1 jam (3600000 ms) agar tidak membebani UI.
 */
function recalculateInsights() {
  const db = getDb();
  
  // 1. Inisialisasi tabel jika belum ada (Safe Migration)
  db.exec(`
    CREATE TABLE IF NOT EXISTS lingling_daily_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insight_type TEXT NOT NULL,
      target_id INTEGER,
      target_name TEXT,
      metric_value REAL,
      metric_text TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Cek kapan terakhir kali insight di-generate
  try {
    const lastUpdateRow = db.prepare("SELECT MAX(last_updated) as last_update FROM lingling_daily_insights").get();
    if (lastUpdateRow && lastUpdateRow.last_update) {
      // Pastikan parser zona waktu kompatibel dengan string SQLite
      const lastUpdateMs = new Date(lastUpdateRow.last_update + 'Z').getTime(); 
      if (Date.now() - lastUpdateMs < 3600000) {
        return { status: "skipped", message: "Data is fresh (< 1 hour)" };
      }
    }
  } catch (e) {
    console.error("Ling-Ling DB Check Error:", e);
  }

  // 3. Mulai Transaksi (Zero-Latency for UI during computation)
  const transaction = db.transaction(() => {
    // Bersihkan data lama
    db.prepare("DELETE FROM lingling_daily_insights").run();

    const insertInsight = db.prepare(`
      INSERT INTO lingling_daily_insights (insight_type, target_id, target_name, metric_value, metric_text)
      VALUES (?, ?, ?, ?, ?)
    `);

    // A. Hitung Stok Habis (Urgent Replenishment) - Gabungan Threshold & Burnrate
    try {
      const stokHabis = db.prepare(`
        SELECT p.id, p.name, p.stock_pcs 
        FROM products p
        LEFT JOIN burnrate_predictions b ON p.id = b.product_id
        WHERE (p.stock_pcs <= p.low_stock_threshold AND p.stock_pcs >= 0) OR b.days_until_stockout <= 3
        ORDER BY p.stock_pcs ASC LIMIT 5
      `).all();

      for (const item of stokHabis) {
        insertInsight.run('stok_habis', item.id, item.name, item.stock_pcs, `Sisa ${item.stock_pcs} pcs`);
      }
    } catch (e) {
      // Fallback jika burnrate_predictions tidak ada
      const stokHabis = db.prepare("SELECT id, name, stock_pcs FROM products WHERE stock_pcs <= low_stock_threshold ORDER BY stock_pcs ASC LIMIT 5").all();
      for (const item of stokHabis) {
        insertInsight.run('stok_habis', item.id, item.name, item.stock_pcs, `Sisa ${item.stock_pcs} pcs`);
      }
    }

    // B. Hitung Stok Mati (Dead Stock / Capital Trap) - Tidak laku > 30 hari
    try {
      const stokMati = db.prepare(`
        SELECT p.id, p.name, p.stock_pcs, p.price_retail
        FROM products p
        WHERE p.stock_pcs > 0 AND p.id NOT IN (
            SELECT DISTINCT ti.product_id
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE t.created_at >= date('now', '-30 days')
        )
        ORDER BY (p.stock_pcs * p.price_retail) DESC LIMIT 5
      `).all();

      for (const item of stokMati) {
        const modalTertahan = item.stock_pcs * item.price_retail;
        insertInsight.run('stok_mati', item.id, item.name, modalTertahan, `Modal tertahan Rp ${modalTertahan.toLocaleString('id-ID')}`);
      }
    } catch (e) {
      console.error("Ling-Ling Dead Stock Error:", e);
    }
  });

  transaction();
  return { status: "success", message: "Insights updated" };
}

/**
 * ASK LING-LING (The Brain)
 * Membaca data yang sudah di-precompute untuk latensi mendekati 0ms.
 */
function askLingLing(question) {
  const db = getDb();
  const q = question.toLowerCase();

  // ROUTER 1: INTENT STOK MATI (Capital Trap)
  if (/(stok mati|gak laku|mandek|lambat|numpuk|susah jual)/.test(q)) {
    let data = [];
    try { data = db.prepare("SELECT * FROM lingling_daily_insights WHERE insight_type = 'stok_mati' ORDER BY metric_value DESC").all(); } catch (e) {}
    
    if (data.length === 0) {
      return {
        found: true,
        answer: "Kabar baik bos! Tidak ada barang mati di toko bulan ini. Arus kas berputar lancar.",
        confidence_score: 0.99,
        citations: ["Pengecekan transaksi 30 hari terakhir"],
        nudge: "Pertahankan performa ini! Pastikan display barang selalu rapi."
      };
    }

    const itemList = data.map(d => `- ${d.target_name} (${d.metric_text})`).join("\n");
    const totalMandek = data.reduce((sum, item) => sum + item.metric_value, 0);
    
    return {
      found: true,
      answer: `Hati-hati bos, ada ${data.length} barang yang tidak laku sebulan terakhir. Total modal Anda yang mandek sekitar **Rp ${totalMandek.toLocaleString('id-ID')}**.\n\nBerikut daftarnya:\n${itemList}`,
      confidence_score: 0.95,
      citations: [
        "Sistem mengecek data transaksi 30 hari terakhir (Zero Sales)",
        "Perhitungan: Jumlah Stok Aktual x Harga Retail"
      ],
      nudge: `Aksi disarankan: Diskon 15% atau jadikan bonus bundling untuk ${data[0].target_name} akhir pekan ini agar modal cair kembali!`
    };
  }

  // ROUTER 2: INTENT STOK HABIS (Urgent Replenishment)
  if (/(stok|habis|kosong|kulakan|restock|sisa|tipis)/.test(q)) {
    let data = [];
    try { data = db.prepare("SELECT * FROM lingling_daily_insights WHERE insight_type = 'stok_habis'").all(); } catch (e) {}
    
    if (data.length === 0) {
      return {
        found: true,
        answer: "Aman bos. Semua stok barang masih di atas batas minimal.",
        confidence_score: 0.95,
        citations: ["Perbandingan stok fisik aktual dengan Low Stock Threshold"],
        nudge: "Fokus maksimalkan penjualan harian hari ini!"
      };
    }

    const itemList = data.map(d => `- ${d.target_name} (${d.metric_text})`).join("\n");
    return {
      found: true,
      answer: `Ada ${data.length} barang yang sudah tipis dan wajib masuk daftar kulakan hari ini:\n\n${itemList}`,
      confidence_score: 0.92,
      citations: [
        "Stok fisik < batas minimal",
        "Prediksi burn-rate < 3 hari"
      ],
      nudge: `Segera hubungi supplier untuk ${data[0].target_name}! Barang menipis berisiko membuat toko kehilangan omset harian.`
    };
  }

  // ROUTER 3: INTENT CROSS-SELLING / BUNDLING
  if (/(pasangan|cocok|bundling|kombinasi|bareng)/.test(q)) {
    // Basic NLP: Buang kata-kata stopwords untuk menangkap entitas produk target
    const cleanWords = q.replace(/(pasangan|cocok|bundling|kombinasi|bareng|dijual|apa|yang|untuk|sama|dengan|coba|cari|tanya)/g, '').trim().split(/\s+/);
    const keyword = cleanWords.filter(w => w.length > 2)[0];
    
    if (!keyword) {
      return {
        found: false,
        answer: "Mau cek rekomendasi bundling untuk barang apa bos? Sebutkan nama barangnya, contoh: 'Kopi cocoknya bundling bareng apa?'",
        confidence_score: 0.5,
        citations: [],
        nudge: "Sebutkan nama produk yang spesifik."
      };
    }

    // Eksekusi langsung ke SQLite jika Keyword ditemukan
    try {
      const product = db.prepare("SELECT id, name FROM products WHERE name LIKE ? LIMIT 1").get(`%${keyword}%`);

      if (!product) {
         return {
           found: false,
           answer: `Maaf bos, Ling-Ling tidak menemukan barang dengan nama "${keyword}" di sistem.`,
           confidence_score: 0.8,
           citations: [],
           nudge: "Cek pengetikan namanya, atau pastikan barang sudah terdaftar."
         };
      }

      // Cari pasangan di apriori_rules
      const rules = db.prepare(`
        SELECT p.name as paired_item, a.confidence_pct, a.lift 
        FROM apriori_rules a
        JOIN products p ON a.item_b_id = p.id
        WHERE a.item_a_id = ?
        ORDER BY a.lift DESC, a.confidence_pct DESC LIMIT 1
      `).all(product.id);

      if (rules.length === 0) {
        return {
          found: true,
          answer: `Untuk produk "${product.name}", datanya belum cukup kuat untuk memprediksi pasangan yang pasti.`,
          confidence_score: 0.7,
          citations: ["Tabel apriori_rules (Confidence/Support di bawah threshold minimal)"],
          nudge: "Coba pantau dulu transaksi barang ini secara manual selama seminggu ke depan."
        };
      }

      const rec = rules[0];
      return {
        found: true,
        answer: `Berdasarkan nota kasir sebelumnya, "${product.name}" paling sering dibeli bersamaan dengan **${rec.paired_item}**.`,
        confidence_score: (rec.confidence_pct / 100).toFixed(2), // Dynamic Score
        citations: [
          `Peluang dibeli bersama (Confidence): ${rec.confidence_pct}%`,
          `Kekuatan asosiasi (Lift): ${rec.lift.toFixed(2)}`
        ],
        nudge: `Saran aksi: Tawarkan diskon Rp 1.500 jika pembeli mengambil "${product.name}" + "${rec.paired_item}" secara bersamaan. Posisikan mereka berdekatan di rak kasir!`
      };
    } catch (e) {
      console.error("Ling-Ling Cross-Selling Error:", e);
      return DEFAULT_RESPONSE;
    }
  }

  // JIKA INTENT TIDAK DIKENALI
  return DEFAULT_RESPONSE;
}

// ------------------------------------------------------------------
// STUBS FOR EXISTING IPC HANDLERS (Agar main.cjs tidak error crash)
// Fungsi-fungsi ini menjaga kompatibilitas dengan UI yang lama
// ------------------------------------------------------------------
function getBundlingSuggestion() { return []; }
function getRFMMatrix() { return []; }
function getAprioriRules() { return []; }
function getBurnRateAlerts() { return []; }
function getSembahyangBigBang() { return []; }

module.exports = {
  recalculateInsights, // Export agar bisa dipanggil saat boot/polling
  askLingLing,         // Otak utama untuk Chat UI
  getBundlingSuggestion,
  getRFMMatrix,
  getAprioriRules,
  getBurnRateAlerts,
  getSembahyangBigBang
};

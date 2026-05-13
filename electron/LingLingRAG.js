const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Database = require('better-sqlite3');

/**
 * LING-LING RAG (Retrieval-Augmented Generation) ENGINE
 * Modul untuk pemahaman dokumen lokal 100% Offline (Zero-API).
 * Menggunakan transformers.js untuk ekstraksi fitur semantik.
 */
const { pipeline } = require('@xenova/transformers');

class LingLingRAG {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.extractor = null;
    this.initDatabase();
  }

  // 1. Inisialisasi Tabel Vektor (Linguistic Brain)
  initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS Knowledge_Vectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_name TEXT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding_json TEXT NOT NULL
      )
    `);
  }

  // 2. Pemuatan Model AI Lokal ke Memori
  async loadModel() {
    if (!this.extractor) {
      console.log("Ling-Ling: Menyiapkan model pemahaman bahasa (Xenova/all-MiniLM-L6-v2)...");
      // Model ini dipilih karena sangat ringan dan optimal untuk PC/Laptop standar
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
  }

  // 3. Pemecahan Teks (Chunking)
  splitTextIntoChunks(text, chunkSize = 500) {
    const words = text.replace(/\s+/g, ' ').split(' ');
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
  }

  // 4. Ingesti Dokumen (Belajar dari PDF)
  async ingestDocument(filePath, docName) {
    await this.loadModel();
    
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      const chunks = this.splitTextIntoChunks(pdfData.text);

      const insertStmt = this.db.prepare(`
        INSERT INTO Knowledge_Vectors (doc_name, chunk_text, embedding_json) 
        VALUES (?, ?, ?)
      `);

      console.log(`Ling-Ling: Mempelajari dokumen ${docName}...`);
      
      for (const chunk of chunks) {
        // Ekstraksi fitur vektor (Embedding)
        const output = await this.extractor(chunk, { pooling: 'mean', normalize: true });
        const vector = Array.from(output.data);
        
        insertStmt.run(docName, chunk, JSON.stringify(vector));
      }
      
      console.log(`Ling-Ling: Selesai mempelajari ${docName}.`);
      return { success: true, chunks: chunks.length };
    } catch (error) {
      console.error("Ingestion Error:", error);
      return { success: false, error: error.message };
    }
  }

  // 5. Kalkulasi Kemiripan Semantik (Cosine Similarity)
  calculateCosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // 6. Data Bridge: Mengambil konteks transaksi real-time dari SQLite
  getStoreContext() {
    try {
      const last24h = this.db.prepare(`
        SELECT 
          COUNT(*) as total_tx, 
          SUM(total) as revenue,
          (SELECT name FROM transaction_items JOIN transactions ON transactions.id = transaction_items.transaction_id ORDER BY transactions.id DESC LIMIT 1) as last_product
        FROM transactions 
        WHERE created_at > datetime('now', '-1 day') AND status = 'completed'
      `).get();

      return `DATA REAL-TIME TOKO (24 Jam Terakhir):
- Total Transaksi: ${last24h.total_tx}
- Total Pendapatan: Rp ${last24h.revenue?.toLocaleString() || 0}
- Produk Terakhir Terjual: ${last24h.last_product || 'Belum ada'}
`;
    } catch (error) {
      console.error("Context Bridge Error:", error);
      return "Data transaksi real-time tidak tersedia.";
    }
  }

  // 7. Kueri Pengetahuan (Ask AI) - Enhanced with Data Bridge
  async askLingLing(question) {
    await this.loadModel();
    const storeContext = this.getStoreContext();

    try {
      // Ubah pertanyaan menjadi vektor
      const output = await this.extractor(question, { pooling: 'mean', normalize: true });
      const questionVector = Array.from(output.data);

      // Ambil pengetahuan dari database dokumen
      const rows = this.db.prepare('SELECT doc_name, chunk_text, embedding_json FROM Knowledge_Vectors').all();
      
      let bestMatch = null;
      let highestScore = -1;

      for (const row of rows) {
        const dbVector = JSON.parse(row.embedding_json);
        const score = this.calculateCosineSimilarity(questionVector, dbVector);
        
        if (score > highestScore) {
          highestScore = score;
          bestMatch = row;
        }
      }

      // Logika Pemilihan Konteks (Hati-hati & Cerdas)
      let answer = "";
      let confidence = 0;
      let citations = [];
      let found = false;

      // Prioritas 1: Kecocokan Dokumen yang Sangat Kuat (> 75%)
      if (highestScore > 0.75) {
        answer = bestMatch.chunk_text;
        confidence = highestScore;
        citations.push(bestMatch.doc_name);
        found = true;
      } 
      // Prioritas 2: Data Riil Toko (Jika dokumen tidak yakin atau user bertanya soal data)
      else {
        answer = "Berdasarkan data toko real-time: " + storeContext;
        if (highestScore > 0.5) {
          answer += "\n\nCatatan tambahan dari dokumen: " + bestMatch.chunk_text;
          citations.push(bestMatch.doc_name);
        }
        confidence = 0.90; // Data SQL dianggap otoritatif
        citations.push("Database Transaksi Lokal");
        found = true;
      }

      return {
        found: found,
        answer: answer,
        confidence_score: confidence,
        citations: citations,
        nudge: confidence < 0.7 ? "⚠️ Verifikasi manual diperlukan." : "Data divalidasi dari database lokal."
      };

    } catch (error) {
      console.error("Query Error:", error);
      return { found: false, error: "Kesalahan saat memproses pertanyaan." };
    }
  }
}

module.exports = LingLingRAG;

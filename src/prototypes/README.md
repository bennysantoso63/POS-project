# 📦 PROTOTYPES — Kumpulan Kode Fitur Masa Depan
**Lokasi:** `src/prototypes/`
**Status:** BELUM DIINTEGRASIKAN — Referensi untuk Sprint berikutnya

---

## Daftar Prototipe

### 1. `LocalIntelligenceDashboard.jsx`
**Sumber:** Roadmap Fase A & B
**Fitur yang tersedia:**
- Market Basket Analysis (Algoritma Apriori)
- Survival Runway Calculator (Masa Bertahan Bisnis)
- Dead-Stock Cash Radar (Deteksi Modal Membeku)

**Catatan Integrasi:**
- Props yang dibutuhkan: `transactions`, `products`, `settings`
- Read-Only — tidak mengubah data apa pun
- Sudah punya versi aktif di `src/components/IntelligenceView.jsx`

---

### 2. `SembahyangIntelligence.jsx`
**Sumber:** Roadmap Fase B & C (Edge-AI & Agentic Brain)
**Fitur yang tersedia:**
- **Ling-Ling Chat** — Asisten NLP Lokal (Zero-API)
  - Intent: Kasbon, Barang Laku, Omzet, Stok Rendah
- **Burn-Rate Predictor** — Prediksi hari stok habis
- **RFM Matrix** — Segmentasi pelanggan otomatis (Donatur Emas / Pelanggan Aktif / Pelanggan Pasif)
- **RBAC Guard** — Hanya Owner/Admin yang bisa akses

**Catatan Integrasi:**
- Props yang dibutuhkan: `db` (object berisi `products`, `customers`, `transactions`), `isAdmin`
- Perlu adaptasi props agar sesuai dengan `usePosData.js`
- Layout "Split Panel" (Analytics kiri + Chat kanan)

---

## Aturan Penggunaan

```
1. Jangan import file dari folder ini ke App.jsx — belum siap produksi
2. Gunakan sebagai referensi algoritma saat integrasi di sprint berikutnya
3. Setiap prototipe harus melalui review UI alignment sebelum digabung
4. Folder ini aman untuk di-commit ke GitHub (tidak merusak build)
```

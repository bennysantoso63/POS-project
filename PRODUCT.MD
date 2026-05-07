# 📦 POS MANDIRI OFFLINE - Enterprise Edition v2.4

**POS Mandiri Offline** adalah sistem kasir (Point of Sale) desktop berbasis **Electron-React** yang dirancang khusus untuk operasional retail dan grosir dengan prinsip *local-first*. Sistem ini menggabungkan kecepatan aplikasi desktop dengan kecerdasan analitik modern, memberikan kontrol penuh atas inventaris, keuangan, dan relasi pelanggan tanpa ketergantungan pada koneksi internet.

---

## 🚀 Fitur Unggulan

### 1. Terminal Kasir Cerdas (Smart Checkout)
*   **Dual-Scanner Technology**: Mendukung pemindai barcode fisik (HID) konvensional dan fitur **AI Vision Scanner** berbasis simulasi WASM untuk dekripsi cepat via kamera.
*   **Multi-UOM Support**: Transaksi otomatis dalam satuan Eceran (Pcs) maupun Grosir (Box/Karton) dengan konversi stok *real-time*.
*   **Multi-Tier Pricing**: Harga otomatis menyesuaikan profil pelanggan (Eceran vs Partai).
*   **Draft & Hold**: Simpan pesanan sementara untuk melayani pelanggan lain tanpa kehilangan data keranjang.

### 2. "Invisible Accountant" Engine (Keuangan)
*   **P&L Statement Otomatis**: Laporan Laba/Rugi yang dihasilkan secara instan dengan validasi HPP (Harga Pokok Penjualan).
*   **Smart Guardrails**: Sistem mengunci laporan keuangan secara otomatis jika data HPP produk belum lengkap (>20%) untuk mencegah "Laba Semu".
*   **Sinking Fund Management**: Alokasi otomatis (default 10%) untuk cadangan biaya sewa, depresiasi alat, atau renovasi masa depan.
*   **Tax Radar (PPh Final 0.5%)**: Pelacakan ambang batas PTKP (500jt) untuk Wajib Pajak OP dan estimasi pajak UMKM bulanan.
*   **Profit Splitter**: Simulasi pembagian keuntungan antar mitra bisnis berdasarkan laba bersih akhir.

### 3. CRM & Manajemen Piutang (Financial Relations)
*   **Kasbon/Piutang Tracking**: Mencatat transaksi hutang pelanggan secara rapi.
*   **Relations Dashboard**: Panel khusus untuk memantau penagihan, *aging* hutang, dan pencatatan pelunasan cicilan.
*   **Customer Loyalty**: Profiling pelanggan berdasarkan total belanja dan loyalitas tier.

### 4. Inventaris & Rantai Pasok (Supply Chain)
*   **Purchasing (PO)**: Manajemen Kulakan dengan status pending hingga barang diterima (Stock-In otomatis).
*   **Cycle Count (Stock Opname)**: Modul penyesuaian stok fisik dengan audit trail yang mencatat alasan setiap perubahan.
*   **Audit Trail Pergerakan Barang**: Setiap keluar-masuk barang tercatat dengan detail (Penjualan, Void, atau Penyesuaian Manual).

### 5. Analitik & Laporan Dashboard
*   **Recharts Integration**: Visualisasi tren pendapatan dan volume transaksi menggunakan grafik area interaktif.
*   **Top Product Insights**: Analisis otomatis produk terlaris berdasarkan kuantitas dan kontribusi pendapatan.
*   **Session/Shift Management**: Rekonsiliasi kas harian (EOD) untuk memastikan saldo di laci fisik sesuai dengan sistem.

---

## 💎 Manfaat Produk

*   **Offline-First Stability**: Tidak perlu khawatir koneksi internet mati atau server cloud down. Data tersimpan aman di database lokal (SQLite).
*   **Integritas Data Tinggi**: Menggunakan transaksi database atomik untuk memastikan stok dan saldo kas selalu sinkron (No data corruption).
*   **Desain Premium & Modern**: UI bertema *Dark-Modern* yang elegan, responsif, dan nyaman digunakan untuk durasi lama.
*   **Kepatuhan Fiskal**: Membantu pelaku UMKM mengelola kewajiban pajak dengan fitur perhitungan PPh Final yang transparan.
*   **Efisiensi Operasional**: Mengurangi kesalahan manual dalam perhitungan laba bersih dan pembagian hasil bisnis.

---

## 🛠️ Spesifikasi Teknis
*   **Frontend**: React.js, TailwindCSS, Lucide Icons.
*   **Backend**: Electron, Node.js.
*   **Database**: SQLite (via Better-SQLite3) dengan mode WAL.
*   **Analytics**: Recharts.
*   **State Management**: Zustand.

---
© 2026 Antigravity Enterprise Solutions.

# 🚀 DAFTAR KERJAAN MENDATANG (BACKLOG)
*Gunakan file ini sebagai pengingat fitur-fitur yang perlu dipoles atau ditambahkan di sesi berikutnya.*

---

### 🔐 1. Keamanan & Akses (Security)
- [ ] **Bcrypt Password Hashing:** Saat ini login masih menggunakan plain-text. Perlu diubah ke hashing di `main.js`.
- [ ] **Role-Based Access Control (RBAC):** Memastikan menu Akuntansi dan Inventory benar-benar terkunci total untuk user dengan role `cashier`.
- [ ] **Auto-Logout:** Fitur kunci layar otomatis jika tidak ada aktivitas selama X menit.

### 📊 2. Laporan & Ekspor (Advanced Reporting)
- [ ] **Export to PDF:** Selain CSV, tambahkan fitur ekspor laporan Laba Rugi dan Struk ke PDF agar lebih profesional.
- [ ] **Grafik Performa:** Visualisasi omzet harian/mingguan di Dashboard menggunakan Chart.js atau Recharts.
- [ ] **Laporan Stok Opname:** Cetak hasil selisih stok (loss/gain) setelah melakukan Cycle Count.

### 📦 3. Manajemen Inventori & Suplai
- [ ] **Manajemen Hutang (Accounts Payable):** Melacak pembayaran ke Supplier pada modul Purchasing (Kulakan).
- [ ] **Barcode Generator:** Integrasi dengan printer label thermal (TSC/Zebra) untuk cetak barcode tempel secara masal.
- [ ] **Multi-Warehouse:** Dukungan untuk pemindahan stok antar gudang/cabang (jika usaha berkembang).

### 🤝 4. Pelanggan & Loyalitas (CRM)
- [ ] **Poin Loyalitas:** Berikan poin otomatis untuk setiap transaksi pelanggan (misal: 10rb = 1 poin).
- [ ] **Sistem Piutang:** Mencatat transaksi "Bon" atau "Utang" pelanggan dan integrasi ke laporan arus kas.

### 🛠️ 5. Integrasi Hardware & Sistem
- [ ] **Auto-Update Header Struk:** Pastikan perubahan di menu Settings langsung merubah tampilan struk fisik tanpa restart.
- [ ] **Database Backup:** Fitur pencadangan otomatis file `pos.db` ke folder eksternal (USB/Cloud) setiap hari saat toko tutup.

---
*Update terakhir: 5 Mei 2026*

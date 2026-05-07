# 🛒 Chronos POS Desktop - Pro Edition
**Sistem Kasir Desktop Offline-First dengan Integrasi Hardware Thermal Printer**

Chronos POS adalah solusi manajemen toko ritel (khususnya toko jam/elektronik) yang dibangun menggunakan **React** dan **Electron**. Aplikasi ini dirancang untuk bekerja secara lokal (offline) dengan database SQLite, memastikan kecepatan transaksi tanpa ketergantungan internet.

---

## 🚀 Fitur Utama (Produksi)

### 1. Terminal Kasir & Penjualan
*   **AI Barcode Scanner**: Integrasi kamera untuk scan barcode secara real-time dengan pemrosesan filter CLAHE.
*   **Multi-Tier Pricing**: Mendukung harga Eceran dan Grosir (Partai) secara otomatis.
*   **Draft Pesanan**: Simpan transaksi tertunda (hold) untuk dilayani nanti.
*   **Shift Management**: Sistem buka/tutup shift (EOD) dengan rekonsiliasi laci kasir otomatis.

### 2. Inventaris & Pergudangan
*   **Data Induk Produk**: Manajemen stok, SKU, kategori, dan konversi satuan (Pcs/Box).
*   **Cetak Label Barcode**: Cetak label harga dan barcode langsung ke printer thermal dari aplikasi.
*   **Stok Opname (Cycle Count)**: Algoritma acak harian untuk pengecekan fisik barang guna mencegah fraud.
*   **Kulakan (Purchasing)**: Modul Purchase Order (PO) lengkap dengan manajemen supplier dan update stok otomatis saat barang diterima.

### 3. Analitik & Dashboard
*   **Visualisasi Tren**: Grafik pendapatan interaktif berbasis SVG.
*   **Profit Tracking**: Perhitungan laba kotor otomatis berdasarkan HPP (Cost of Goods Sold).
*   **Alarm Stok**: Notifikasi visual untuk barang yang mencapai ambang batas stok rendah (low stock).
*   **Ekspor Data**: Laporan transaksi dapat diunduh dalam format CSV untuk kebutuhan akuntansi.

### 4. Integrasi Hardware
*   **ESC/POS Thermal Printing**: Dukungan native untuk printer thermal (58mm/80mm) via Electron IPC.
*   **Custom Receipt**: Header dan footer struk dapat diubah melalui menu Pengaturan.

---

## 🛠️ Panduan Teknis

### Cara Menjalankan (Mode Pengembangan)
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).
```powershell
# Instal dependensi
npm install

# Jalankan aplikasi (React + Electron)
npm run dev
```

### Cara Membuat Installer (.exe)
```powershell
# Build aplikasi untuk Windows
npm run build
```

---

## 📂 Arsitektur Proyek
- `src/App.jsx`: Orkestrator state dan routing utama aplikasi.
- `src/components/`: Kumpulan modul modular (Cashier, Inventory, Dashboard, dll).
- `src/hooks/usePosData.js`: Bridge komunikasi ke SQLite melalui Electron IPC.
- `src/store/`: Manajemen state frontend (Zustand/Context).

---

## ⚙️ Konfigurasi
Anda dapat menyesuaikan identitas toko melalui menu **Pengaturan** di dalam aplikasi:
- Nama Toko
- Alamat & Nomor Telepon
- Pesan Footer Struk (Terima Kasih)

---
**Status Proyek**: Production Ready - Hardened Interface
*Dikembangkan dengan fokus pada stabilitas transaksi ritel harian.*

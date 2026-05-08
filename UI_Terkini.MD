# 🎨 DOKUMENTASI UI TERKINI: POS MANDIRI ENTERPRISE (DHARMA EDITION)
**Versi:** 3.0 (Dharma Enterprise - Full AI & Dark Mode Integration)
**Status:** Produksi / Stable

---

## 1. DESIGN SYSTEM & ENTERPRISE TOKENS
Aplikasi kini menggunakan palet warna kustom yang dioptimalkan untuk visibilitas tinggi di lingkungan ritel (Enterprise Grade).

| Token | Hex Code | Penggunaan Utama |
| :--- | :--- | :--- |
| **Deep Navy** | `#141E30` | Latar belakang utama (Main BG) dan Sidebar. |
| **Sky Blue** | `#3196E2` | Aksi utama, tombol simpan, dan penanda aktif. |
| **Gold** | `#FFC05F` | Highlight premium, status VIP, dan Asisten Ling-Ling. |
| **Teal** | `#38B2AC` | Aksen Intelligence (AI), Kas Masuk, dan status Aman. |
| **Coral** | `#FF826C` | Peringatan stok, Kas Keluar, dan Piutang (Buku Bon). |

---

## 2. ATRIBUT VISUAL & KOMPONEN
- **Rounded Corners**: Konsisten menggunakan `rounded-[2rem]` untuk kartu dan `rounded-3xl` untuk tombol.
- **Glassmorphism**: Digunakan pada modal dengan `backdrop-blur-sm` dan overlay `bg-slate-900/60`.
- **Global Dark Mode**: Implementasi sinkronisasi class `dark` pada root `<html>`, mendukung transisi tema yang halus di seluruh view.
- **Typography**: Header menggunakan `font-black` dengan `tracking-tight` untuk kesan tegas dan profesional.

---

## 3. MODUL INTELLIGENCE (DHARMA AI)
Fitur unggulan v3.0 yang membedakan dari versi standar:
- **Ling-Ling Chatbot**: Asisten AI lokal (Zero-API) yang dapat menjawab pertanyaan seputar performa toko secara natural.
- **Dharma Dashboard**: Panel analitik terpadu (RFM Matrix, Burn-rate Predictor, Apriori Bundling Rules).
- **RBAC Guard**: Modul intelijen dilindungi oleh sistem hak akses; hanya Admin yang dapat melihat data strategis.

---

## 4. DAFTAR VIEW TERSEDIA (INVENTORY)
1.  **Kasir (CashierView)**: Sistem POS retail dengan dukungan *Hold Bills* dan *Quick Search*.
2.  **Buku Bon (RelationsView)**: (UPDATE) Manajemen piutang dengan visualisasi segmentasi pelanggan RFM.
3.  **Kulakan (PurchasingView)**: (UPDATE) Alur PO Supplier yang terintegrasi dengan penambahan stok otomatis.
4.  **Ling-Ling (IntelligenceView)**: (BARU) Pusat kendali AI dan analitik bisnis.
5.  **Data Induk (InventoryView)**: Manajemen produk dengan radar pergerakan stok.
6.  **Akuntansi (AccountingView)**: Laporan laba rugi otomatis dan manajemen pengeluaran.
7.  **Riwayat (HistoryView)**: Log transaksi lengkap dengan fitur *Void* dan cetak ulang struk.

---

## 5. STANDAR PENGEMBANGAN LANJUTAN
- **Zero-API Sovereignty**: Dilarang keras menggunakan API eksternal untuk pemrosesan data; semua harus berjalan lokal (SQLite/Renderer).
- **Iconography**: Wajib menggunakan **Lucide React** dengan stroke width standar.
- **Data Formatting**: Gunakan `Intl.NumberFormat` IDR untuk semua representasi mata uang guna menjaga konsistensi audit.

---
*Dokumen ini adalah Source of Truth untuk standar UI/UX POS Mandiri Enterprise.*

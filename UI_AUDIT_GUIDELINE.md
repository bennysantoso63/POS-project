# 📋 UI/UX Mass Audit Report & Refactoring Guidelines (Ling-Ling POS)

Dokumen ini berisi hasil audit menyeluruh terhadap komponen UI aplikasi POS ini. Dokumen ini dirancang sebagai **guideline (panduan instruksi)** yang akan dibaca dan dieksekusi oleh **Gemini Flash** pada sesi selanjutnya. Tidak ada kode yang dieksekusi selama audit ini.

---

## 🛑 1. Isu Utama yang Ditemukan (Audit Report)

### 1.1 Duplikasi Kode Komponen (DRY Principle Violation)
Komponen `CustomDropdown` didefinisikan secara berulang di banyak file:
- `CashierView.jsx`
- `AccountingView.jsx`
- `CrmView.jsx`
- `DashboardView.jsx`
- `SettingsView.jsx`
**Dampak**: Ketika ada perubahan gaya (seperti bug "potongan biru"), perubahan harus dilakukan di 5 tempat berbeda yang rentan menyebabkan inkonsistensi.

### 1.2 "Tailwind Bloat" (Kelas CSS Terlalu Panjang)
Banyak elemen (terutama di `LoginView`, `SettingsView`, dan `DashboardView`) memiliki kelas inline Tailwind yang sangat panjang dan sulit dibaca.
Contoh dari `DashboardView.jsx`:
`className="bg-brand-card/60 backdrop-blur-md border border-brand-border p-10 rounded-[3.5rem] shadow-2xl shadow-black/5 hover:border-brand-primary/30 transition-all group relative overflow-hidden"`
**Dampak**: Menurunkan *readability* (keterbacaan) kode dan menyulitkan *maintenance* komponen standar (seperti kartu atau tombol).

### 1.3 Isu Responsivitas & Hardcoded Dimensions
- Di `CashierView.jsx`, keranjang belanja (Manifest) memiliki ukuran statis `w-[580px]`. Ini akan tumpang tindih atau terpotong pada layar yang lebih kecil.
- Di `DashboardView.jsx` dan `AccountingView.jsx`, beberapa kontainer dropdown menggunakan `min-w-[350px]` yang terlalu lebar untuk layar sempit.
- Grafik Recharts di `DashboardView` menggunakan tinggi statis `h-[450px]` dan `h-[280px]` alih-alih proporsi berbasis persentase atau `min-h`.

### 1.4 Over-Animation & Performance Overhead
Aplikasi ini sangat heavily-animated (contoh: `animate-[pulse_10s_infinite]`, `duration-[5000ms]`, `animate-spin-slow` di background `LoginView` dan `SettingsView`).
**Dampak**: Animasi CSS yang terus-menerus berjalan (terutama blur dan shadow dalam skala besar) akan menyebabkan beban tinggi pada GPU/CPU, yang bisa membuat antarmuka terasa lambat (*laggy*) pada PC Kasir kelas menengah ke bawah.

---

## 🚀 2. Action Plan & Guidelines untuk Gemini Flash

**Kepada Gemini Flash:** Saat Anda menerima instruksi untuk memulai perbaikan berdasarkan dokumen ini, jalankan langkah-langkah berikut secara berurutan:

### TAHAP 1: Ekstraksi Komponen Reusable
1. Buat folder baru `src/components/ui/` jika belum ada.
2. Pindahkan logika `CustomDropdown` dari file-file *View* ke dalam satu file terpusat: `src/components/ui/CustomDropdown.jsx`.
3. Ganti semua penggunaan `CustomDropdown` di `CashierView`, `AccountingView`, `CrmView`, `DashboardView`, dan `SettingsView` agar mengimpor dari file komponen terpusat tersebut. Pastikan parameter props dan styling yang sudah sempurna tetap dipertahankan.

### TAHAP 2: Pembersihan Tailwind Bloat (CSS Abstraction)
1. Buka file `src/index.css`.
2. Ekstrak kelas-kelas Tailwind yang sering berulang menjadi komponen kelas menggunakan `@apply`.
   - Buat kelas `.card-premium` (atau `.cockpit-card`) untuk menggantikan kombinasi background blur, shadow besar, dan border melengkung (gunakan `bg-brand-card/60` dan variabel brand lainnya).
   - Buat kelas `.btn-primary` untuk tombol utama.
   - Buat kelas `.glass-panel` untuk elemen transparan blur.
3. Tambahkan proteksi aksesibilitas di `@layer components`:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```
4. Terapkan kelas-kelas baru ini secara bertahap di file `.jsx` untuk merapikan kode.

### TAHAP 3: Optimasi Responsivitas (Fluid Layouts)
1. **CashierView.jsx**: Ubah `w-[580px]` pada keranjang belanja menjadi responsif (misalnya `w-full lg:w-[400px] xl:w-[500px] flex-shrink-0`). Gunakan flexbox untuk memastikan kolom grid produk bisa mengecil secara proporsional di layar sedang (tablet/laptop kecil).
2. **DashboardView & AccountingView**: Hapus aturan `min-w-[350px]` pada kontainer dropdown atau ganti dengan batas maksimum yang lebih fleksibel (`max-w-md w-full`).

### TAHAP 4: Optimasi Performa Animasi
1. Hapus animasi latar belakang infinite yang tidak menambah nilai bisnis (seperti pulse pada blur raksasa di background Login/Dashboard).
2. Kurangi durasi animasi interaksi. Ubah `duration-[5000ms]` menjadi durasi yang lebih responsif (maksimal `1000ms`).
3. Tambahkan kelas utilitas `transform-gpu` pada elemen yang tetap menggunakan animasi `scale`, `translate`, atau `rotate` agar rendering dialihkan ke GPU.

### TAHAP 5: Audit Aksesibilitas (a11y) & UX Dasar
1. Tambahkan prop `aria-label` atau atribut `title` pada semua tombol ikon-saja (seperti tombol hapus keranjang (tong sampah), dll).
2. Periksa rasio kontras warna teks. Hindari penumpukan tingkat keburaman seperti `text-brand-muted opacity-40`. Sesuaikan transparansi agar tetap mudah dibaca oleh pengguna.

### TAHAP 6: Perbaikan Layout Form Pesanan Baru (PurchasingView)
1. Buka file `src/components/PurchasingView.jsx`.
2. Cari bagian kode form input "Jumlah Unit" dan "Harga Beli (HPP)" (di dalam "MODUL DRAFT").
3. Ubah tata letak input agar memanjang ke bawah (vertikal) dan tidak kepotong ke samping:
   - Ubah elemen `<div className="grid grid-cols-2 gap-10">` menjadi `<div className="flex flex-col gap-8">`.
4. Hilangkan efek scroll pada form jika tidak diperlukan:
   - Cari kontainer utama form (elemen dengan teks "Input Pesanan Baru" dan kelas `w-full lg:w-[550px] ... overflow-y-auto`).
   - Hapus kelas `overflow-y-auto` dan `custom-scrollbar` agar kontainer dapat meregang ke bawah secara natural (tidak me-scroll isi di dalamnya).

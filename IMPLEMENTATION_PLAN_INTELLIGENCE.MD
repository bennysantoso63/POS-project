# PELAN INTEGRASI: POS DHARMA ENTERPRISE (PREMIUM UPGRADE)

Rencana ini merinci langkah-langkah presisi untuk mengganti modul legacy dengan desain premium serta mengintegrasikan mesin kecerdasan buatan lokal (Ling-Ling AI) tanpa merusak integritas database SQLite yang ada.

## Status Saat Ini
- [x] **Fase 1: Fondasi UI** (Tailwind Dark Mode & Global CSS) - **SELESAI**
- [x] **Langkah 2.1: Migrasi HistoryView** (Log Transaksi Premium) - **SELESAI**
- [ ] **Langkah 2.2: Migrasi PurchasingView** (Supplier & PO Workflow) - **MENUNGGU**
- [ ] **Langkah 2.3: Migrasi RelationsView** (Piutang & AR Tracking) - **MENUNGGU**

---

## STANDAR DESAIN PREMIUM (DESIGN TOKENS)
Semua modul baru WAJIB mengikuti palet warna berikut untuk konsistensi "Enterprise Look":

| Element | Light Mode | Dark Mode | Hex Code |
| :--- | :--- | :--- | :--- |
| **Main Background** | White | Deep Navy | `#141E30` |
| **Surface/Panel** | Soft Cyan | Dark Steel | `#F0FAFA` / `#1A2640` |
| **Primary Action** | Sky Blue | Muted Blue | `#3196E2` / `#35577D` |
| **Accent/AI** | Teal | Mint | `#53D2DC` / `#38B2AC` |
| **Warning/Alert** | Coral | Muted Red | `#FF826C` / `#E07060` |
| **Monetary/Gold** | Amber | Bronze | `#FFC05F` / `#D4A040` |

---

## RENCANA DETAIL PER FASE

### FASE 2: MIGRASI MODUL INTI (REPLACE & ALIGN)
Tujuan: Mengganti komponen UI lama dengan komponen Premium yang sudah divalidasi.

#### 1. PurchasingView (Langkah 2.2)
- **Target File**: `src/components/PurchasingView.jsx`
- **Logic Alignment**:
  - Mapping Prop: `onAddSupplier`, `onCreatePO`, `onReceivePO`, `onPayPO`.
  - Penambahan Widget **Total Hutang Usaha (AP)** di header.
  - Implementasi modal pembayaran pelunasan PO yang terintegrasi dengan saldo kas.
  - **Dark Mode Compatibility**: Menggunakan class `dark:bg-slate-900` dsb.

#### 2. RelationsView (Langkah 2.3)
- **Target File**: `src/components/RelationsView.jsx`
- **Logic Alignment**:
  - Mapping Prop: `onAddCustomer`, `onUpdateCustomer`, `onAddPayment` (untuk cicilan piutang).
  - Penambahan Widget **Piutang Donatur (AR)**.
  - **AI Nudge Integration**: Menampilkan segmentasi RFM (👑 Donatur Emas, 🔥 Umat Aktif) langsung pada daftar pelanggan untuk prioritas layanan.

#### 3. PosCashier (Langkah 2.4 - REFINEMENT) [NEW]
- **Target File**: `src/components/PosView.jsx` (atau `CashierView`)
- **Intelligence Overlay**:
  - **Lunar Insight**: Logika peringatan hari besar (Cap Go Meh, Imlek) berdasarkan histori belanja pelanggan.
  - **Apriori Nudge**: Rekomendasi bundling barang ("Umat yang beli Dupa ini biasanya juga beli Lilin...") saat barang ditambahkan ke keranjang.

---

### FASE 3: INTEGRASI MESIN KECERDASAN (AI ENGINE)
Tujuan: Mengaktifkan logika analitik di level Electron (Backend) dan menjembatani ke UI.

#### 1. Backend AI (`electron/queries/intelligence.js`) [NEW]
- **Data Scientist Logic**:
  - **RFM Matrix Engine**: Query rekursif untuk menghitung skor loyalitas pelanggan.
  - **Apriori Association**: Analisis keranjang belanja (market basket) untuk menentukan korelasi antar SKU.
  - **Predictive Inventory**: Algoritma Burn-rate sederhana (Stock / Avg Daily Sales).
- **NLP Engine (Ling-Ling)**:
  - Implementasi `LocalLingLingEngine` di sisi backend untuk memproses query teks dari frontend via IPC.

#### 2. IPC Bridge (`main.js` & `preload.cjs`) [MODIFY]
- **Secure Channel**:
  - `intelligence:get-dashboard-data`: Mengambil sekaligus data RFM, Apriori, dan Burn-rate.
  - `intelligence:ask-lingling`: Mengirim teks user dan mengembalikan jawaban dari AI Engine.

#### 3. Intelligence Hook (`src/hooks/useIntelligence.js`) [NEW]
- Mengelola state data analitik secara reaktif.
- Melakukan auto-refresh data setiap kali ada transaksi baru.

---

### FASE 4: DEPLOYMENT DASHBOARD & LING-LING CHAT
Tujuan: Menampilkan hasil analitik ke Owner.

#### 1. IntelligenceView (`src/components/IntelligenceView.jsx`) [REPLACE]
- Implementasi dashboard visual (Burn-rate alerts, RFM table).
- Integrasi chatbox **Ling-Ling AI** di panel kanan.
- Proteksi RBAC: Hanya render jika `currentUser.role === 'admin'`.

#### 2. App Shell (`src/App.jsx`) [MODIFY]
- **Dark Mode Propagation**:
  - Implementasi `useEffect` untuk memanipulasi `document.documentElement.classList` (class `dark`) agar utility Tailwind `dark:` bekerja di seluruh portal dan modal.
- **Routing Integration**:
  - Menyambungkan state `tab` dengan modul Intelligence yang baru.
  - Memastikan sidebar menggunakan palet `#1A2640` (Dark) dan `#F0FAFA` (Light).

---

## VERIFIKASI & AUDIT
1. **Data Integrity Test**: Memastikan pembuatan PO menambah stok dan mengurangi kas (jika lunas).
2. **Security Test**: Memastikan kasir tidak bisa membuka tab Intelligence/AI.
3. **Performance Test**: Memastikan query RFM/Apriori tidak membuat aplikasi lag (penggunaan `better-sqlite3` async-like).
4. **Visual Audit**: Memastikan konsistensi Dark Mode di semua screen.

---

## JADWAL EKSEKUSI
1. **Sesi A**: Selesaikan Fase 2 (Purchasing & Relations).
2. **Sesi B**: Selesaikan Fase 3 (Backend & IPC).
3. **Sesi C**: Selesaikan Fase 4 (Frontend AI & App Shell).

> [!IMPORTANT]
> Jangan lakukan perubahan kode sebelum mendapatkan persetujuan pada rencana ini.

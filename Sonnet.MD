# 🔧 SOP INTEGRASI INFRASTRUKTUR POS MANDIRI ENTERPRISE
## Protokol Eksekusi untuk Gemini Flash — Zero-Error Tolerance

> [!CAUTION]
> Dokumen ini adalah **SATU-SATUNYA PANDUAN** yang boleh diikuti saat melakukan integrasi.
> Setiap langkah WAJIB dieksekusi secara **BERURUTAN**. Jangan lompat fase.
> **DILARANG** menghapus, mengganti nama, atau memindahkan file yang sudah berjalan di produksi tanpa instruksi eksplisit.

---

## BAGIAN 0: PETA SITUASI (WAJIB BACA DULU)

### 0.1 Arsitektur Saat Ini (PRODUCTION)

```
barcode-sistem/
├── electron/
│   ├── main.js              ← IPC Handler Registry (198 baris)
│   ├── preload.cjs           ← Context Bridge API (81 baris)
│   └── restServer.js
├── src/
│   ├── App.jsx               ← Router Utama (513 baris) — KRITIS
│   ├── main.jsx              ← Entry Point React
│   ├── index.css             ← Global Styles (25 baris)
│   ├── components/
│   │   ├── Sidebar.jsx       ← Navigasi (52 baris)
│   │   ├── CashierView.jsx   ← Layar Kasir
│   │   ├── DashboardView.jsx ← Dashboard Admin
│   │   ├── HistoryView.jsx   ← Riwayat Transaksi (217 baris) ← AKAN DIGANTI
│   │   ├── RelationsView.jsx ← Piutang/CRM (189 baris) ← AKAN DIGANTI
│   │   ├── PurchasingView.jsx← Kulakan/AP (360 baris) ← AKAN DIUPGRADE
│   │   ├── IntelligenceView.jsx ← AI Lokal (210 baris) ← AKAN DIUPGRADE
│   │   └── [14 file lainnya — JANGAN SENTUH]
│   ├── hooks/usePosData.js   ← Data Fetcher (106 baris)
│   ├── store/useSessionStore.js
│   └── prototypes/           ← Blueprint baru (READ-ONLY sampai integrasi)
└── tailwind.config.js        ← BELUM ada darkMode config
```

### 0.2 Inventaris Prototipe (SUMBER KODE BARU)

| # | File Prototipe | Target Produksi | Aksi |
|---|---------------|-----------------|------|
| 1 | `HistoryView_Premium.jsx` | `components/HistoryView.jsx` | **REPLACE** seluruh isi file |
| 2 | `PiutangView_Premium.jsx` | `components/RelationsView.jsx` | **REPLACE** seluruh isi file |
| 3 | `SupplierView_Premium.jsx` | `components/PurchasingView.jsx` | **REPLACE** seluruh isi file |
| 4 | `App_Shell_Integrated.jsx` | **JANGAN REPLACE App.jsx** | **EXTRACT** komponen LingLingAI saja |
| 5 | `sembahyang_ai_backend.js` | `electron/queries/sembahyang_ai.js` | **CREATE** file baru |
| 6 | `preload_intelligence_snippet.js` | `electron/preload.cjs` | **APPEND** 4 baris API baru |

### 0.3 Daftar File yang DILARANG DISENTUH

> [!WARNING]
> File-file ini adalah pondasi sistem. **JANGAN EDIT** kecuali ada instruksi eksplisit:

- `src/components/CashierView.jsx` — Mesin kasir utama
- `src/components/DashboardView.jsx` — Dashboard analytics
- `src/components/AccountingView.jsx` — Modul akuntansi
- `src/components/SessionOverlay.jsx` — Autentikasi shift
- `src/components/Modals.jsx` & `AdditionalModals.jsx`
- `src/components/BarcodeScanner.jsx`
- `src/components/CycleCountView.jsx`
- `src/components/MonitorView.jsx`
- `src/components/SettingsView.jsx`
- `src/components/CrmView.jsx`
- `src/components/PettyCashModal.jsx`
- `src/hooks/usePosData.js`
- `src/store/useSessionStore.js`
- `src/main.jsx`

---

## BAGIAN 1: FASE INFRASTRUKTUR (Tailwind Dark Mode)

### Langkah 1.1 — Update `tailwind.config.js`

**File:** `tailwind.config.js`
**Aksi:** Tambahkan `darkMode: 'class'`

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

> [!IMPORTANT]
> Tanpa ini, semua class `dark:` di prototipe tidak akan berfungsi.

### Langkah 1.2 — Update `src/index.css`

**File:** `src/index.css`
**Aksi:** Tambahkan utility `custom-scrollbar` dan perbaiki `color-scheme`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark light;
}

body {
  margin: 0;
  overflow: hidden;
  background-color: #020617; /* slate-950 */
}

/* Custom scrollbar untuk semua view */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.5);
}

/* Hide scrollbar utility */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### ✅ CHECKPOINT FASE 1
Jalankan `npm run dev`. Pastikan:
- Tidak ada error di terminal
- Aplikasi tampil normal (belum ada perubahan visual)

---

## BAGIAN 2: FASE REPLACE KOMPONEN (Urutan Kritis)

> [!CAUTION]
> **URUTAN EKSEKUSI WAJIB**: HistoryView → PurchasingView → LingLingAI.
> Jangan balik urutan. Setiap langkah harus dicek sebelum lanjut.

### Langkah 2.1 — Replace `HistoryView.jsx`

**Sumber:** `src/prototypes/HistoryView_Premium.jsx`
**Target:** `src/components/HistoryView.jsx`

**KRITIS — Perbaikan Prop Mismatch:**

Prototipe menggunakan prop `onReprint` tapi `App.jsx` baris 413 mengirim `onPrintReceipt`. 
Sebelum replace, Anda **HARUS** melakukan salah satu:

**Opsi A (DIREKOMENDASIKAN): Ubah nama prop di prototipe sebelum paste**
```jsx
// Di prototipe, ganti baris 7-12:
export default function HistoryView({   // ← GANTI "History" jadi "HistoryView"
  transactions = [], 
  currentUser, 
  onVoidTransaction, 
  onPrintReceipt,    // ← GANTI "onReprint" jadi "onPrintReceipt"
  showToast 
}) {
```

Dan di baris 167 prototipe, ganti:
```jsx
// SEBELUM:
<button onClick={() => onReprint(selectedTx)}
// SESUDAH:
<button onClick={() => onPrintReceipt(selectedTx)}
```

**Checklist setelah replace:**
- [ ] Nama export = `HistoryView` (bukan `History`)
- [ ] Prop `onPrintReceipt` (bukan `onReprint`)  
- [ ] Prop `onVoidTransaction` menerima `id` (lihat App.jsx baris 414: `onVoidTransaction={async (id) => ...}`)
- [ ] Semua `tx.id` di prototipe di-render tanpa prefix `TX-` (data dari DB sudah punya prefix)

**Verifikasi di `App.jsx` baris 410-418:**
```jsx
case 'history': return (
  <HistoryView 
    transactions={transactions} 
    onPrintReceipt={(tx) => setReceiptToPrint({ type: 'transaction', data: tx })} 
    onVoidTransaction={async (id) => { await window.api.voidTransaction(id); fetchData(); }} 
    currentUser={currentUser} 
    showToast={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
  />
);
```

> [!WARNING]
> **PERHATIAN pada handleVoid di prototipe:**
> Prototipe memanggil `onVoidTransaction(selectedTx)` (mengirim object).
> Tapi App.jsx mengharapkan `onVoidTransaction(id)` (mengirim ID saja).
> **FIX:** Ubah baris 44 prototipe menjadi `onVoidTransaction(selectedTx.id)`

---

### Langkah 2.2 — Replace `PurchasingView.jsx` (Supplier/AP)

**Sumber:** `src/prototypes/SupplierView_Premium.jsx`
**Target:** `src/components/PurchasingView.jsx`

**KRITIS — Perbaikan Prop Mismatch:**

Prototipe export `Supplier` tapi App.jsx mengimpor `PurchasingView`.

```jsx
// GANTI baris export di prototipe:
// SEBELUM:
export default function Supplier({
// SESUDAH:
export default function PurchasingView({
```

**Verifikasi Prop Compatibility (App.jsx baris 387-398):**

| Prop di App.jsx | Prop di Prototipe | Status |
|----------------|-------------------|--------|
| `suppliers` | `suppliers` | ✅ Match |
| `purchaseOrders` | `purchaseOrders` | ✅ Match |
| `products` | `products` | ✅ Match |
| `onAddSupplier` | `onAddSupplier` | ✅ Match |
| `onCreatePO` | `onCreatePO` | ✅ Match |
| `onReceivePO` | `onReceivePO` | ✅ Match |
| `onPayPO` | `onPayPO` | ✅ Match |
| `showToast` | `showToast` | ✅ Match |

**Status: AMAN untuk replace langsung** (setelah fix nama export).

---

### Langkah 2.3 — JANGAN Replace RelationsView (Piutang) Langsung

> [!CAUTION]
> `PiutangView_Premium.jsx` memiliki **PROP MISMATCH KRITIS** dengan `App.jsx`.

**Masalah yang terdeteksi:**

| Prop di App.jsx (baris 401-408) | Prop di Prototipe | Problem |
|--------------------------------|-------------------|---------|
| `customers` | `customers` | ✅ Match |
| `transactions` | `transactions` | ✅ Match |
| `onRecordPayment` | `onRecordPayment` | ⚠️ Format data berbeda |
| `onAddCustomer` | ❌ TIDAK ADA | 🔴 Prototipe pakai `setCustomers` |
| `showToast` | `showToast` | ✅ Match |

**MASALAH UTAMA:**
1. Prototipe menggunakan `setCustomers` (state setter lokal) untuk tambah pelanggan. Tapi produksi menggunakan `onAddCustomer` yang memanggil `window.api.addCustomer()`.
2. Prototipe menggunakan `onRecordPayment(txData)` dengan format objek transaksi lengkap. Tapi produksi memanggil `onRecordPayment({ customer_id, amount, payment_method, notes })`.

**SOLUSI — Adaptasi prototipe sebelum replace:**

```jsx
// GANTI export dan props:
export default function RelationsView({   // ← Tetap nama "RelationsView"
  customers = [], 
  transactions = [], 
  onRecordPayment,
  onAddCustomer,     // ← GANTI setCustomers -> onAddCustomer
  showToast 
}) {

// GANTI fungsi handleAddCustomer:
const handleAddCustomer = async (e) => {
  e.preventDefault();
  if (!newCustomer.name) return showToast("Nama pelanggan wajib diisi!", "error");
  await onAddCustomer({ name: newCustomer.name, phone: newCustomer.phone });
  setNewCustomer({ name: '', phone: '' });
  showToast("Pelanggan berhasil ditambahkan.", "success");
};

// GANTI fungsi submitPayment — sesuaikan format data:
const submitPayment = (e) => {
  e.preventDefault();
  const amount = parseInt(payAmount);
  if (!amount || amount <= 0) return showToast("Nominal tidak valid", "error");

  onRecordPayment({
    customer_id: paymentModal.id,
    amount: amount,
    payment_method: 'cash',
    notes: 'Pelunasan Piutang via Buku Bon'
  });

  setPaymentModal(null);
  setPayAmount('');
  showToast(`Pelunasan berhasil dicatat!`, "success");
};
```

**Juga perlu diperhatikan:**
- Kalkulasi `sisaUtang` di prototipe bergantung pada scan transaksi secara manual. Di produksi, field `balance` sudah dihitung oleh backend SQLite. Gunakan `c.balance` jika tersedia sebagai fallback.

---

## BAGIAN 3: FASE INTEGRASI LING-LING AI

### Langkah 3.1 — Buat file backend baru

**Aksi:** Copy `src/prototypes/sembahyang_ai_backend.js` ke `src/db/queries/sembahyang_ai.js`

> [!IMPORTANT]
> Perhatikan path `require('../database')` di baris 1 prototipe. 
> Sesuaikan menjadi path relatif yang benar dari lokasi target:
> ```js
> const db = require('../db.js');  // ← sesuaikan dengan struktur src/db/
> ```

### Langkah 3.2 — Daftarkan IPC Handlers di `electron/main.js`

**File:** `electron/main.js`
**Aksi:** Tambahkan di bagian import (setelah baris 18):

```js
const sembahyangAI = require('../src/db/queries/sembahyang_ai');
```

**Aksi:** Tambahkan di dalam fungsi `registerIpcHandlers()` (sebelum closing brace baris 182):

```js
    // [Sprint 13] Sembahyang Intelligence Engine
    sembahyangAI.registerSembahyangIpc(ipcMain);
```

### Langkah 3.3 — Tambahkan API Bridge di `electron/preload.cjs`

**File:** `electron/preload.cjs`
**Aksi:** Tambahkan 4 baris ini **SEBELUM** closing `});` di baris 80:

```js
    // Sprint 13 - Sembahyang Intelligence
    getSembahyangRFM: () => ipcRenderer.invoke('api-sembahyang-rfm'),
    getSembahyangBurnRate: () => ipcRenderer.invoke('api-sembahyang-burnrate'),
    getSembahyangApriori: () => ipcRenderer.invoke('api-sembahyang-apriori'),
    askLingLing: (question) => ipcRenderer.invoke('api-sembahyang-chat', question),
```

### Langkah 3.4 — Buat komponen `LingLingChat.jsx`

**File:** `src/components/LingLingChat.jsx` (FILE BARU)
**Sumber:** Extract komponen `LingLingAI` dari `App_Shell_Integrated.jsx` baris 18-111

**PENTING:** Ubah menjadi `export default` dan pastikan nama konsisten:

```jsx
// Baris pertama file baru:
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Flame, Users, Send } from 'lucide-react';

export default function LingLingChat({ transactions, products, customers }) {
  // ... isi dari LingLingAI di App_Shell_Integrated.jsx ...
}
```

### Langkah 3.5 — Daftarkan di `App.jsx`

**File:** `src/App.jsx`
**Aksi 1:** Tambahkan import (setelah baris 33):
```jsx
import LingLingChat from './components/LingLingChat';
```

**Aksi 2:** Tambahkan case di `renderContent()` switch (setelah baris 420):
```jsx
case 'lingling': return (
  <LingLingChat 
    transactions={transactions} 
    products={products} 
    customers={customers} 
  />
);
```

**Aksi 3:** Update Sidebar tab ID dari `'intelligence'` ke `'lingling'` di `Sidebar.jsx` baris 18:
```jsx
// SEBELUM:
{ id: 'intelligence', icon: BrainCircuit, label: 'AI Intel' }
// SESUDAH:  
{ id: 'lingling', icon: BrainCircuit, label: 'Ling-Ling' }
```

**ATAU** (lebih aman): Pertahankan ID `intelligence` dan daftarkan LingLingChat di case `intelligence`:
```jsx
case 'intelligence': return (
  <LingLingChat transactions={transactions} products={products} customers={customers} />
);
```

> [!TIP]
> Opsi kedua **LEBIH AMAN** karena tidak perlu mengubah Sidebar.jsx sama sekali.

---

## BAGIAN 4: FASE DARK MODE PROPAGATION

### Langkah 4.1 — Update Dark Mode Toggle di `App.jsx`

**File:** `src/App.jsx`
**Target:** Baris 441 — tambahkan class `dark` secara kondisional:

```jsx
// SEBELUM (baris 441):
<div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

// SESUDAH:
<div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
```

> [!IMPORTANT]
> Class `dark` pada root div adalah **WAJIB** agar semua `dark:` utility di child components berfungsi.
> Saat ini `isDarkMode` state sudah ada di baris 49, toggle sudah ada di baris 456-463.
> Yang kurang hanya propagasi class `dark` ke root div.

### Langkah 4.2 — Update `<main>` tag

```jsx
// SEBELUM (baris 453):
<main className={`flex-1 overflow-hidden transition-colors duration-500 relative rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/5 h-full ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

// SESUDAH (lebih bersih, dark mode via parent class):
<main className="flex-1 overflow-hidden transition-colors duration-500 relative rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/5 dark:border-slate-800 h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
```

---

## BAGIAN 5: CHECKLIST VERIFIKASI AKHIR

### 5.1 Compile Check
```bash
npm run dev
```
- [ ] Tidak ada error di terminal Vite
- [ ] Tidak ada warning `import not found`
- [ ] Tidak ada warning `unused variable`

### 5.2 Functional Test (Manual di Browser)

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Buka halaman Riwayat | Split-pane muncul, list transaksi di kiri |
| 2 | Klik transaksi | Detail struk muncul di panel kanan |
| 3 | Klik tombol WhatsApp | Browser buka tab `wa.me` |
| 4 | Klik Void (sebagai admin) | Konfirmasi muncul, stok dikembalikan |
| 5 | Buka halaman Kulakan | Tab PO List dan Buat PO muncul |
| 6 | Buat PO baru | Item bisa ditambah, review tampil benar |
| 7 | Buka Buku Bon/Piutang | Tabel debitur muncul dengan saldo |
| 8 | Tambah pelanggan baru | Form submit, data muncul di tabel |
| 9 | Terima pembayaran | Modal muncul, pelunasan tercatat |
| 10 | Toggle Night Mode | Seluruh UI berubah gelap/terang halus |
| 11 | Buka Ling-Ling AI | Chat interface muncul (simulasi mode) |
| 12 | Kirim pesan ke Ling-Ling | Respons muncul setelah delay |

### 5.3 Regression Test — Fitur Lama TIDAK BOLEH Rusak

| # | Modul | Test |
|---|-------|------|
| 1 | Kasir | Bisa scan produk dan checkout |
| 2 | Dashboard | Chart dan statistik tampil benar |
| 3 | Inventory | Bisa tambah/edit/hapus produk |
| 4 | Opname | Bisa adjust stok |
| 5 | Akuntansi | Laporan P&L tetap tampil |
| 6 | Settings | Bisa simpan pengaturan toko |
| 7 | Login | PIN authentication tetap berfungsi |
| 8 | Shift | Buka/tutup shift tetap berjalan |

---

## BAGIAN 6: ATURAN CLEAN CODE

### 6.1 Konvensi Penamaan
- Nama file komponen: **PascalCase** (`HistoryView.jsx`, bukan `historyView.jsx`)
- Nama export: **HARUS SAMA** dengan nama file (tanpa ekstensi)
- Nama fungsi handler: `handle` + Verb + Noun (`handleAddCustomer`, `handleVoid`)

### 6.2 Aturan Import
- Semua import `lucide-react` di satu blok di atas
- Tidak boleh ada import yang tidak digunakan
- Tidak boleh ada variabel yang tidak digunakan

### 6.3 Aturan JSX
- Setiap `map()` render HARUS punya `key` prop yang unik
- Setiap `<button>` yang bukan submit HARUS punya `type="button"`
- Setiap `<input>` dalam form HARUS punya handler `onChange`

### 6.4 Aturan Dark Mode
- Setiap warna background: pasangkan `bg-X` dengan `dark:bg-Y`
- Setiap warna teks: pasangkan `text-X` dengan `dark:text-Y`
- Setiap border: pasangkan `border-X` dengan `dark:border-Y`
- Setiap hover: pasangkan `hover:bg-X` dengan `dark:hover:bg-Y`
- Tambahkan `transition-colors` pada elemen yang memiliki dark variant

---

## RINGKASAN URUTAN EKSEKUSI

```
FASE 1 → tailwind.config.js + index.css
       ↓ [CHECKPOINT: npm run dev]
FASE 2 → HistoryView replace (fix props dulu!)
       → PurchasingView replace (fix export name!)
       → RelationsView replace (fix props + data format!)
       ↓ [CHECKPOINT: npm run dev + test 3 halaman]
FASE 3 → Buat sembahyang_ai.js backend
       → Update main.js (import + register)
       → Update preload.cjs (4 API baru)
       → Buat LingLingChat.jsx
       → Daftarkan di App.jsx renderContent
       ↓ [CHECKPOINT: npm run dev + test chat]
FASE 4 → Update root div App.jsx (class dark)
       → Update main tag App.jsx
       ↓ [CHECKPOINT: toggle dark mode, semua view berubah]
FASE 5 → Full regression test
```

> [!TIP]
> **Jika terjadi error di fase manapun:** STOP. Jangan lanjut ke fase berikutnya.
> Rollback perubahan terakhir dan analisa error message. 
> Penyebab error paling umum: **typo pada nama prop** atau **path import yang salah**.

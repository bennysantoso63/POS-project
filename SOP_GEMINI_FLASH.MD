# 🤖 SOP EKSKLUSIF UNTUK: GEMINI FLASH

## Sistem: POS Dharma Enterprise — Intelligence Upgrade

## Status: SIAP EKSEKUSI — Semua prototipe sudah divalidasi

> [!CAUTION]
> **BACA DULU SELURUH DOKUMEN INI SEBELUM MENYENTUH SATU BARIS PUN.**
> Setiap langkah WAJIB dikerjakan **BERURUTAN**. Jangan lompat fase.
> Jika ada error di satu fase — **STOP TOTAL**, jangan lanjut.

---

## BAGIAN 0: ORIENTASI CEPAT (TOKEN-EFFICIENT SUMMARY)

### 0.1 Apa yang Sudah Selesai (JANGAN ULANGI)

- ✅ `tailwind.config.js` → `darkMode: 'class'` sudah aktif
- ✅ `src/index.css` → Custom scrollbar & color-scheme sudah update
- ✅ `src/components/HistoryView.jsx` → Sudah di-replace dengan versi premium

### 0.2 Apa yang Harus Dikerjakan (SISA PEKERJAAN)

```
SESI A (Fase 2):
  → Langkah 2.2: Replace PurchasingView.jsx
  → Langkah 2.3: Replace RelationsView.jsx

SESI B (Fase 3):
  → Langkah 3.1: Buat electron/queries/sembahyang_ai.js [NEW FILE]
  → Langkah 3.2: Update electron/main.js (import + register IPC)
  → Langkah 3.3: Update electron/preload.cjs (4 baris API baru)
  → Langkah 3.4: Buat src/components/LingLingChat.jsx [NEW FILE]

SESI C (Fase 4):
  → Langkah 4.1: Update App.jsx (dark mode propagation + Intelligence route)
  → Langkah 4.2: Replace IntelligenceView.jsx dengan Dashboard Premium

SESI D (Fase 5):
  → Full regression test semua modul
```

### 0.3 Peta Arsitektur File (Hanya yang Relevan)

```
barcode-sistem/
├── electron/
│   ├── main.js              ← AKAN DIMODIFIKASI (Fase 3.2)
│   ├── preload.cjs          ← AKAN DIMODIFIKASI (Fase 3.3)
│   └── queries/
│       └── sembahyang_ai.js ← FILE BARU (Fase 3.1)
└── src/
    ├── App.jsx              ← AKAN DIMODIFIKASI (Fase 4.1) — KRITIS
    ├── components/
    │   ├── PurchasingView.jsx   ← AKAN DI-REPLACE (Fase 2.2)
    │   ├── RelationsView.jsx    ← AKAN DI-REPLACE (Fase 2.3)
    │   ├── IntelligenceView.jsx ← AKAN DI-REPLACE (Fase 4.2)
    │   └── LingLingChat.jsx     ← FILE BARU (Fase 3.4)
    └── prototypes/              ← READ-ONLY. Sumber kode. Jangan edit.
```

### 0.4 File DILARANG DISENTUH (Blacklist)

```
CashierView.jsx | DashboardView.jsx | AccountingView.jsx
SessionOverlay.jsx | Modals.jsx | AdditionalModals.jsx
BarcodeScanner.jsx | CycleCountView.jsx | MonitorView.jsx
SettingsView.jsx | CrmView.jsx | PettyCashModal.jsx
usePosData.js | useSessionStore.js | main.jsx
```

---

## BAGIAN 1: STANDAR DESAIN — WAJIB DIIKUTI

### 1.1 Design Token (Palet Warna)

Setiap komponen baru WAJIB menggunakan palet ini. Tidak boleh menggunakan warna lain.

| Element            | Light Mode (Hex) | Dark Mode (Hex) | Tailwind Arbitrary         |
| :----------------- | :--------------- | :-------------- | :------------------------- |
| **Main BG**        | `#FFFFFF`        | `#141E30`       | `dark:bg-[#141E30]`        |
| **Surface/Panel**  | `#F0FAFA`        | `#1A2640`       | `dark:bg-[#1A2640]`        |
| **Card/Widget**    | `#FFFFFF`        | `#243350`       | `dark:bg-[#243350]`        |
| **Border**         | `slate-200`      | `#35577D/30`    | `dark:border-[#35577D]/30` |
| **Primary Action** | `#3196E2`        | `#35577D`       | `dark:bg-[#35577D]`        |
| **Accent/AI Teal** | `#53D2DC`        | `#38B2AC`       | `dark:text-[#38B2AC]`      |
| **Hover Accent**   | `#53D2DC`        | `#38B2AC`       | `dark:hover:bg-[#38B2AC]`  |
| **Warning/Coral**  | `#FF826C`        | `#E07060`       | `dark:text-[#E07060]`      |
| **Monetary/Gold**  | `#FFC05F`        | `#D4A040`       | `dark:text-[#D4A040]`      |
| **Muted Text**     | `slate-500`      | `#64748b`       | `dark:text-[#64748b]`      |

### 1.2 Aturan Dark Mode (WAJIB)

- **SETIAP** elemen yang punya warna HARUS punya pasangan `dark:` variantnya.
- **SETIAP** elemen dengan dark variant HARUS punya class `transition-colors`.
- **TIDAK BOLEH** menggunakan hard-coded color Tailwind standar (slate-900, dll) jika sudah ada hex token di atas. Gunakan arbitrary value `[#hex]`.

### 1.3 Aturan Clean Code (WAJIB)

- Nama export HARUS sama dengan nama file (tanpa ekstensi).
- Setiap `map()` HARUS punya `key` prop yang unik.
- Setiap `<button>` yang bukan submit HARUS punya `type="button"`.
- Tidak boleh ada import atau variabel yang tidak terpakai.
- Handler function: `handle` + Verb + Noun (`handleVoidTransaction`).

---

## BAGIAN 2: SESI A — REPLACE KOMPONEN UI

### ✅ LANGKAH 2.2 — Replace PurchasingView.jsx

**Sumber:** `src/prototypes/SupplierView_Premium.jsx`
**Target:** `src/components/PurchasingView.jsx`

**PERBAIKAN WAJIB SEBELUM PASTE:**

**Fix 1 — Nama Export:**

```jsx
// SEBELUM (baris 20 prototipe):
export default function Supplier({
// SESUDAH:
export default function PurchasingView({
```

**Fix 2 — Warna Dark Mode (terapkan Design Token):**
Saat replace, ganti semua warna Tailwind standar dengan Design Token di atas.
Contoh:

```jsx
// SEBELUM (prototipe masih pakai slate standar):
className = "bg-white border border-slate-200";
// SESUDAH (terapkan token):
className =
  "bg-white dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 transition-colors";
```

**Verifikasi Prop — SUDAH MATCH, TIDAK PERLU FIX:**
| Prop App.jsx | Prop Prototipe | Status |
|:---|:---|:---|
| `suppliers` | `suppliers` | ✅ |
| `purchaseOrders` | `purchaseOrders` | ✅ |
| `products` | `products` | ✅ |
| `onAddSupplier` | `onAddSupplier` | ✅ |
| `onCreatePO` | `onCreatePO` | ✅ |
| `onReceivePO` | `onReceivePO` | ✅ |
| `onPayPO` | `onPayPO` | ✅ |
| `showToast` | `showToast` | ✅ |

**Checkpoint 2.2:** Jalankan `npm run dev`. Buka tab Supplier. Pastikan tab PO List dan Buat PO muncul tanpa error.

---

### ✅ LANGKAH 2.3 — Replace RelationsView.jsx

**Sumber:** `src/prototypes/PiutangView_Premium.jsx`
**Target:** `src/components/RelationsView.jsx`

> [!WARNING]
> Ini langkah PALING BERISIKO. Ada 2 prop mismatch kritis yang HARUS diperbaiki sebelum paste.

**Fix 1 — Nama Export:**

```jsx
// SEBELUM:
export default function PiutangView({
// SESUDAH:
export default function RelationsView({
```

**Fix 2 — Prop `setCustomers` → `onAddCustomer`:**

```jsx
// Ubah signature props:
export default function RelationsView({
  customers = [],
  transactions = [],
  onRecordPayment,
  onAddCustomer,    // ← GANTI dari setCustomers
  showToast
}) {

// Ubah fungsi handler tambah pelanggan:
const handleAddCustomer = async (e) => {
  e.preventDefault();
  if (!newCustomer.name) return showToast("Nama wajib diisi!", "error");
  await onAddCustomer({ name: newCustomer.name, phone: newCustomer.phone });
  setNewCustomer({ name: '', phone: '' });
  showToast("Pelanggan berhasil ditambahkan.", "success");
};
```

**Fix 3 — Format Data `onRecordPayment`:**

```jsx
// Ubah submitPayment untuk mengirim format yang benar:
const submitPayment = (e) => {
  e.preventDefault();
  const amount = parseInt(payAmount);
  if (!amount || amount <= 0) return showToast("Nominal tidak valid", "error");

  // WAJIB: Kirim format objek ini, bukan object transaksi penuh
  onRecordPayment({
    customer_id: paymentModal.id,
    amount: amount,
    payment_method: "cash",
    notes: "Pelunasan Piutang",
  });

  setPaymentModal(null);
  setPayAmount("");
  showToast("Pelunasan berhasil dicatat!", "success");
};
```

**Fix 4 — Field `sisaUtang` → gunakan `balance` dari DB:**
Di prototipe, kalkulasi sisa hutang mungkin menggunakan loop manual. Di produksi, backend SQLite sudah menghitung field `balance`. Gunakan:

```jsx
// SEBELUM (manual calculation):
const sisaUtang = transactions.filter(tx => tx.customerId === c.id)...
// SESUDAH (gunakan field dari DB):
const sisaUtang = c.balance || 0;
```

**Fix 5 — AI Nudge Integration (RFM Badge):**
Tambahkan segmentasi visual di daftar pelanggan:

```jsx
// Di setiap row pelanggan, tambahkan badge RFM:
const getRFMBadge = (balance) => {
  if (balance > 1000000)
    return {
      label: "👑 Donatur Emas",
      color: "text-[#FFC05F] dark:text-[#D4A040]",
    };
  if (balance > 200000)
    return { label: "🔥 Aktif", color: "text-[#53D2DC] dark:text-[#38B2AC]" };
  return { label: "❄️ Pasif", color: "text-slate-400 dark:text-[#64748b]" };
};
```

**Checkpoint 2.3:** Buka tab Piutang. Pastikan tabel debitur muncul, modal pembayaran bisa dibuka dan ditutup.

---

## BAGIAN 3: SESI B — INTEGRASI AI ENGINE

### ✅ LANGKAH 3.1 — Buat File Backend AI

**Target:** `electron/queries/sembahyang_ai.js` (FILE BARU)

Salin isi dari `src/prototypes/sembahyang_ai_backend.js`, lalu perbaiki:

```js
// Baris 1 — WAJIB SESUAIKAN PATH:
// SEBELUM:
const db = require("../database");
// SESUDAH (sesuaikan dengan struktur electron/):
const db = require("../database"); // ← verifikasi path ini benar dari lokasi electron/queries/
```

Pastikan semua fungsi dibungkus dalam `registerSembahyangIpc(ipcMain)`:

```js
function registerSembahyangIpc(ipcMain) {
  ipcMain.handle("api-sembahyang-rfm", () => getRFMMatrix());
  ipcMain.handle("api-sembahyang-burnrate", () => getBurnRate());
  ipcMain.handle("api-sembahyang-apriori", () => getAprioriRules());
  ipcMain.handle("api-sembahyang-chat", (event, question) =>
    processLingLingQuery(question),
  );
}

module.exports = { registerSembahyangIpc };
```

---

### ✅ LANGKAH 3.2 — Update `electron/main.js`

**Tambahkan di bagian import (setelah baris import terakhir):**

```js
const sembahyangAI = require("./queries/sembahyang_ai");
```

**Tambahkan di dalam fungsi `registerIpcHandlers()` (sebelum closing brace):**

```js
// [Sprint 13] Sembahyang Intelligence Engine
sembahyangAI.registerSembahyangIpc(ipcMain);
```

---

### ✅ LANGKAH 3.3 — Update `electron/preload.cjs`

**Tambahkan 4 baris ini SEBELUM closing `});` terakhir:**

```js
// Sprint 13 - Sembahyang Intelligence
getSembahyangRFM: () => ipcRenderer.invoke('api-sembahyang-rfm'),
getSembahyangBurnRate: () => ipcRenderer.invoke('api-sembahyang-burnrate'),
getSembahyangApriori: () => ipcRenderer.invoke('api-sembahyang-apriori'),
askLingLing: (question) => ipcRenderer.invoke('api-sembahyang-chat', question),
```

---

### ✅ LANGKAH 3.4 — Buat `src/components/LingLingChat.jsx`

**FILE BARU.** Extract komponen chatbot dari `App_Shell_Integrated.jsx`.
Wajib menggunakan Design Token warna di atas dan menerima props:

```jsx
export default function LingLingChat({ transactions, products, customers }) {
  // State: chatHistory, chatInput, isTyping
  // Logic: LocalLingLingEngine (query-based NLP)
  // UI: Split-pane — Analytics kiri, Chat kanan
  // Warna: Gunakan Design Token (#1A2640, #3196E2, #38B2AC, dll)
}
```

**Penting:** Jika window.api tersedia (Electron mode), gunakan IPC. Jika tidak (dev mode), gunakan `LocalLingLingEngine` lokal sebagai fallback.

---

## BAGIAN 4: SESI C — DEPLOYMENT DASHBOARD & APP SHELL

### ✅ LANGKAH 4.1 — Update `src/App.jsx`

**Fix 1 — Dark Mode Propagation (useEffect):**
Tambahkan `useEffect` di dalam komponen `App`:

```jsx
useEffect(() => {
  if (isDarkMode) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}, [isDarkMode]);
```

**Fix 2 — Root div class:**

```jsx
// SEBELUM:
<div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

// SESUDAH:
<div className={`flex h-screen font-sans antialiased overflow-hidden transition-colors duration-500 bg-white dark:bg-[#141E30] text-slate-800 dark:text-slate-100`}>
```

**Fix 3 — Tambahkan route Intelligence:**

```jsx
// Tambahkan di renderContent() atau switch/case:
case 'intelligence': return (
  <LingLingChat
    transactions={transactions}
    products={products}
    customers={customers}
  />
);
```

**Fix 4 — Import LingLingChat:**

```jsx
import LingLingChat from "./components/LingLingChat";
```

---

### ✅ LANGKAH 4.2 — Replace `IntelligenceView.jsx`

**Sumber:** Ambil komponen `IntelligenceDashboard` dari prototipe terbaru.
**Target:** `src/components/IntelligenceView.jsx`

**Wajib:**

- Export name: `IntelligenceView`
- Props: `rfmSegments`, `aprioriRules`, `burnRateAlerts`, `transactions`, `customers`, `products`
- RBAC Guard: Jika prop `currentUser.role !== 'admin'`, render halaman "Akses Ditolak"
- Warna: Gunakan Design Token (BUKAN slate-xxx standar)

---

## BAGIAN 5: CHECKLIST VERIFIKASI AKHIR

### 5.1 Test Fungsional Per Modul

| #   | Modul             | Aksi                             | Expected Result                           |
| --- | ----------------- | -------------------------------- | ----------------------------------------- |
| 1   | **Supplier (PO)** | Buka tab Kulakan                 | PO List & Buat PO muncul                  |
| 2   | **Supplier (PO)** | Buat PO baru                     | Item bisa ditambah, total kalkulasi benar |
| 3   | **Supplier (PO)** | Klik "Terima Barang"             | Konfirmasi muncul, status PO berubah      |
| 4   | **Supplier (PO)** | Klik "Bayar Hutang"              | Modal pembayaran muncul                   |
| 5   | **Piutang (AR)**  | Buka tab Piutang                 | Tabel debitur + saldo muncul              |
| 6   | **Piutang (AR)**  | Tambah pelanggan baru            | Form submit, data muncul di tabel         |
| 7   | **Piutang (AR)**  | Klik "Terima Bayaran"            | Modal muncul, input nominal bisa diisi    |
| 8   | **Dharma AI**     | Buka tab Dharma AI sebagai Admin | Dashboard + Chat muncul                   |
| 9   | **Dharma AI**     | Kirim pesan "kasbon vihara"      | Ling-Ling menjawab dengan data real       |
| 10  | **Dharma AI**     | Ganti role ke Kasir, buka tab AI | Halaman "Akses Ditolak" muncul            |
| 11  | **Dark Mode**     | Toggle Night Mode                | Semua modul berubah gelap/terang halus    |
| 12  | **Cashier**       | Pilih pelanggan & tambah barang  | AI Nudge (Lunar/Apriori) muncul           |

### 5.2 Regression Test — JANGAN SAMPAI RUSAK

| #   | Fitur Lama       | Harus Tetap Berfungsi               |
| --- | ---------------- | ----------------------------------- |
| 1   | PIN Login        | Auth screen muncul dan bisa login   |
| 2   | Shift Management | Buka/tutup shift berjalan normal    |
| 3   | Kasir POS        | Scan barcode, tambah item, checkout |
| 4   | Dashboard        | Statistik dan chart tampil benar    |
| 5   | Inventory        | CRUD produk berjalan normal         |
| 6   | Cycle Count      | Opname stok berfungsi               |
| 7   | Akuntansi        | Laporan P&L tampil                  |
| 8   | Settings         | Pengaturan toko bisa disimpan       |

---

## BAGIAN 6: PROTOKOL ERROR HANDLING

### Jika Terjadi Error Kompilasi (Vite/TypeScript):

1. **STOP**. Jangan lanjut.
2. Baca error message dengan seksama.
3. Penyebab paling umum:
   - Typo nama prop → cek tabel Prop Verification di atas
   - Import tidak ditemukan → cek nama file dan path
   - Export name mismatch → cek Bagian 1.3 aturan penamaan
4. Fix error **SATU PER SATU**. Jangan fix banyak sekaligus.
5. Setelah fix, jalankan `npm run dev` lagi.

### Jika Terjadi Runtime Error (Console Browser):

1. Buka DevTools (F12) → Console tab.
2. Cari error merah pertama.
3. Penyebab paling umum:
   - `undefined is not a function` → prop tidak dikirim dari App.jsx
   - `Cannot read property of undefined` → data belum di-load, tambahkan optional chaining `?.`
   - IPC channel not found → `preload.cjs` belum di-update

---

## RINGKASAN EKSEKUSI (COPY-PASTE CHECKLIST)

```
[ ] SESI A:
    [ ] 2.2: Replace PurchasingView.jsx (fix export name + dark mode tokens)
    [ ] 2.2: CHECKPOINT — npm run dev, buka tab Supplier
    [ ] 2.3: Replace RelationsView.jsx (fix 4 prop mismatches + RFM badge)
    [ ] 2.3: CHECKPOINT — npm run dev, buka tab Piutang

[ ] SESI B:
    [ ] 3.1: Buat electron/queries/sembahyang_ai.js
    [ ] 3.2: Update electron/main.js (import + register)
    [ ] 3.3: Update electron/preload.cjs (4 API baru)
    [ ] 3.4: Buat src/components/LingLingChat.jsx
    [ ] CHECKPOINT — npm run dev, test chat AI

[ ] SESI C:
    [ ] 4.1: Update App.jsx (useEffect dark mode + route intelligence)
    [ ] 4.2: Replace IntelligenceView.jsx
    [ ] CHECKPOINT — toggle dark mode, buka tab Dharma AI

[ ] SESI D:
    [ ] Full regression test 8 fitur lama
    [ ] Full functional test 12 skenario baru
    [ ] SELESAI ✅
```

> [!TIP]
> **Strategi token-efisien untuk Gemini Flash:**
> Kerjakan 1 sesi per percakapan. Mulai selalu dengan membaca file target terlebih dahulu
> sebelum mengeditnya agar tidak ada baris yang terlewat atau salah baris.
> Gunakan `replace_file_content` untuk edit targeted, bukan ganti seluruh file.

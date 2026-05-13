# GUIDELINE PENANGANAN ERROR NATIVE MODULE & ESM DI ELECTRON
**Untuk: Agen Gemini Flash (SOP Trouble-Shooting)**

Dokumen ini berisi panduan *step-by-step* jika menemukan error krusial saat instalasi atau saat menjalankan aplikasi Electron, khususnya yang berkaitan dengan `better-sqlite3` dan sistem modul.

---

## KASUS 1: Error "NODE_MODULE_VERSION mismatch"

### 🔴 Gejala (Symptom)
Muncul error di terminal saat menjalankan `npm start`:
> *The module 'better_sqlite3.node' was compiled against a different Node.js version using NODE_MODULE_VERSION 137. This version of Node.js requires NODE_MODULE_VERSION 121.*

### 🔍 Analisis (Root Cause)
Modul native (`better-sqlite3` / C++) di-compile menggunakan versi Node.js sistem lokal pengguna (contoh: v22/v24), namun Electron yang menjalankan aplikasi menggunakan Node.js internal versinya sendiri (v20). "Sidik jari" (Module Version) yang berbeda menyebabkan Electron menolak memuat database.

### 🛠️ Solusi (Step-by-Step)
**JANGAN LAKUKAN `npm rebuild` BIASA.** Anda harus menggunakan alat khusus sinkronisasi Electron.

1. **Install `@electron/rebuild` (sebagai DevDependencies):**
   ```powershell
   npm install --save-dev @electron/rebuild
   ```
2. **Jalankan Sinkronisasi Rebuild (Target Native Modules):**
   Gunakan flag `-f` (force) dan `-w` (which module) untuk fokus pada SQLite:
   ```powershell
   npx electron-rebuild -f -w better-sqlite3
   ```
3. **Verifikasi:**
   Tunggu hingga muncul pesan `✔ Rebuild Complete`. Jika berhasil, jalankan kembali `npm start`.

---

## KASUS 2: Error "Cannot find module" (Setelah konversi .cjs)

### 🔴 Gejala (Symptom)
Aplikasi terhenti saat fase *loading* dengan pesan:
> *Error: Cannot find module './.cjs'*
ATAU
> *Error: Cannot find module '../../src/db/db.js'*

### 🔍 Analisis (Root Cause)
Proyek ini mengaktifkan `"type": "module"` (ESM) pada `package.json` untuk dukungan React/Vite. Akibatnya, seluruh file backend Node.js (Electron) yang masih menggunakan arsitektur `require()` (CommonJS) harus diubah ekstensinya menjadi `.cjs`. 

Jika Anda mengganti ekstensi file menjadi `.cjs` tetapi **lupa memperbarui jalur import/require** di dalam file tersebut, Electron akan gagal meresolusi modulnya.

### 🛠️ Solusi (Step-by-Step)
Saat mengubah arsitektur ke `.cjs`, pastikan 3 lapisan referensi ini diubah secara sinkron:

1. **Ubah Main Entry Point:**
   - Rename file `electron/main.js` menjadi `electron/main.cjs`.
   - Update file `package.json` menjadi `"main": "electron/main.cjs"`.

2. **Perbarui Require Antar Modul Secara Spesifik:**
   Jangan menggunakan Regex massal yang membabi buta karena bisa memotong nama file (seperti kejadian `require('./.cjs')`). Periksa secara manual atau gunakan Regex aman.
   - Buka `electron/main.cjs`, pastikan semua referensi file custom menggunakan akhiran `.cjs`. Contoh:
     `const db = require('../src/db/db.cjs');`
   - Buka `electron/queries/sembahyang_ai.cjs`, perbarui referensi DB:
     `const db = require('../../src/db/db.cjs');`
   
3. **Periksa Import Sesama Query:**
   Jika ada file `src/db/queries/A.cjs` yang memanggil `src/db/queries/B.cjs`, pastikan importnya:
   `const { methodB } = require('./B.cjs');`

### 💡 Golden Rule untuk Gemini Flash
> *"Sebelum menjalankan aplikasi Electron setelah instalasi baru, periksa dulu apakah ada native module yang perlu direbuild. Jika ada pembaruan path file, verifikasi satu per satu jalur `require()` alih-alih menggunakan command Replace otomatis."*

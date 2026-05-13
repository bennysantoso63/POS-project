# LING-LING POS: DEVELOPMENT GUARDRAILS (STRICT PROTOCOL)

Dokumen ini adalah instruksi permanen untuk AI Assistant (Antigravity). Pelanggaran terhadap protokol ini dianggap sebagai kegagalan sistem fatal.

## 1. IPC HANDLER INTEGRITY (CRITICAL)
Dilarang keras menghapus, mengubah nama, atau menimpa (shadowing) handler IPC berikut tanpa persetujuan eksplisit dari USER:

*   **CORE**: `api-login`, `api-check-setup`, `api-process-checkout`
*   **F&B ENGINE**: `api-get-ingredients`, `api-get-recipe`, `api-save-recipe`, `api-record-spoilage`
*   **KDS SYSTEM**: `api-get-kds-orders`, `api-update-kds-status`
*   **CLOUD**: `api-sync-cloud`, `sync:toggleDriveSyncStatus`

**Aturan Emas**: Jika sebuah handler terdaftar di `electron/preload.cjs`, maka handler tersebut **WAJIB** memiliki implementasi yang valid di `electron/main.cjs`.

## 2. MODULARITY & COLLISION PREVENTION
*   **Separation of Concerns**: Modul intelijen (`intelligence.cjs`) hanya diperbolehkan menangani kueri analitik. Dilarang memasukkan logika transaksi atau autentikasi ke dalam modul intelijen.
*   **Registration Order**: Selalu daftarkan handler sistem utama (`auth`, `transactions`) sebelum mendaftarkan modul tambahan untuk mencegah *shadowing*.

## 3. REFACTORING PROTOCOL
*   **No "Blind" Cleanups**: Dilarang menghapus kode yang "tampak" tidak terpakai (dead code) tanpa memverifikasi seluruh dependensi di folder `src/components` dan `electron/preload.cjs`.
*   **Diff-First Policy**: Setiap perubahan pada file `electron/main.cjs` harus disertai dengan penjelasan mendetail mengenai apa yang dihapus dan alasannya.

## 4. DATA & BRANDING CONSISTENCY
*   **Branding**: Nama aplikasi adalah **Ling-Ling POS**. Dilarang menggunakan nama "POS Mandiri" atau variasi lainnya di UI maupun logs.
*   **Currency**: Seluruh input finansial harus mendukung format Rupiah (titik desimal/ribuan) dan harus disanitasi menjadi Integer murni sebelum masuk ke database.
*   **Atomic Transactions**: Seluruh operasi yang melibatkan stok dan saldo (Checkout, Void, Spoilage) **WAJIB** menggunakan `db.transaction()`.

## 5. PRE-COMMIT CHECKLIST
Sebelum menyimpan perubahan pada file Core (`main.cjs`, `db.cjs`, `preload.cjs`), AI harus memverifikasi:
1.  Apakah `api-process-checkout` masih ada?
2.  Apakah `api-login` masih mengarah ke `auth.authenticateByPin`?
3.  Apakah `bwip-js` barcode generator masih bersih dari instruksi teks AI?

---
**KEGAGALAN MEMATUHI PROTOKOL INI AKAN MENYEBABKAN SISTEM BERHENTI BEROPERASI.**

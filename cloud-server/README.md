# POS Mandiri Cloud Server (Sprint 12)

Repositori ini berisi paket **Self-Hosted Infrastructure** untuk agregasi data multi-toko aplikasi POS Mandiri Offline.

## Fitur Utama
- **Multi-Store Aggregation**: Menerima data dari berbagai cabang PC Kasir.
- **Append-Only Logging**: Menjamin integritas data audit (`sync_log`).
- **Pluggable Database**: Mendukung SQLite (UMKM) dan PostgreSQL (Enterprise).
- **Automated Backup**: Rotasi backup harian selama 30 hari.
- **Zero-Build Dashboard**: Pantau omzet seluruh toko secara instan.

## Cara Instalasi (VPS)
1. Clone atau salin folder `cloud-server` ke VPS Anda.
2. Pastikan Docker sudah terinstall.
3. Jalankan skrip setup:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
4. Salin **ADMIN_SECRET** yang muncul di layar.
5. Masukkan URL IP VPS dan Secret tersebut ke menu **Pengaturan Cloud** di aplikasi PC Kasir.

## Keamanan
- Komunikasi menggunakan SHA256 API Key Validation.
- Seluruh data transaksi tetap memiliki salinan penuh secara lokal di PC Kasir (Offline-First).

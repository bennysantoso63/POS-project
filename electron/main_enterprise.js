const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
// Library untuk komunikasi dengan printer thermal ESC/POS
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

/**
 * MANDIRI ENTERPRISE CORE ENGINE
 * File: main_enterprise.js
 * Deskripsi: Engine utama Electron yang menangani database SQLite, 
 * komunikasi hardware printer thermal, dan logika asisten AI Ling-Ling.
 */

// 1. Inisialisasi Basis Data Lokal (Offline-First)
const dbPath = path.join(app.getPath('userData'), 'mandiri_enterprise.db');
const db = new Database(dbPath, { verbose: console.log });

// Pragmas untuk performa disk I/O SQLite
db.pragma('journal_mode = WAL'); 
db.pragma('synchronous = NORMAL');

// 2. Definisi Kueri Deterministik Ling-Ling AI
const queries = {
  getExactProduct: db.prepare(`
    SELECT barcode, name, category, sell_price as price, stock_level as stock 
    FROM Products WHERE barcode = ?
  `),
  
  getPartialProduct: db.prepare(`
    SELECT barcode, name, category, sell_price as price, stock_level as stock 
    FROM Products 
    WHERE barcode LIKE ? OR barcode LIKE ?
    LIMIT 3
  `),

  decrementStock: db.prepare(`
    UPDATE Products SET stock_level = stock_level - ? WHERE barcode = ?
  `)
};

// 3. Manajemen Jendela Aplikasi (Desktop View)
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0A0F1E', 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs') // Menggunakan preload yang sudah ada
    },
    title: "POS Mandiri Enterprise - Edisi Dharma",
  });

  // Memuat URL Vite (Dev Mode) atau file production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ============================================================================
// 4. IPC Handlers (Jembatan Komunikasi Hardware & Database)
// ============================================================================

// Handler untuk pemindaian barcode (AI Pattern Matching)
ipcMain.handle('scan-barcode', async (event, scannedCode) => {
  try {
    const exactMatch = queries.getExactProduct.get(scannedCode);
    if (exactMatch) return { success: true, data: exactMatch };

    if (scannedCode.length > 3) {
      const prefix = `${scannedCode.slice(0, 3)}%`;
      const suffix = `%${scannedCode.slice(-3)}`;
      const partialMatches = queries.getPartialProduct.all(prefix, suffix);

      if (partialMatches.length > 0) {
        return { 
          success: false, 
          isPartial: true, 
          candidates: partialMatches 
        };
      }
    }

    return { success: false, isPartial: false, error: 'Produk tidak ditemukan.' };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Terjadi kesalahan sistem.' };
  }
});

// Handler untuk mencetak struk secara diam-diam (Silent Printing)
ipcMain.handle('print-receipt', async (event, cartData, total) => {
  try {
    // Mencari perangkat printer kasir berbasis USB
    const device = new escpos.USB();
    const printer = new escpos.Printer(device);

    device.open(function(error) {
      if (error) {
        console.error('Koneksi Printer Gagal:', error);
        return { success: false, error: 'Printer tidak terdeteksi.' };
      }

      printer
        .font('a')
        .align('ct')
        .style('b')
        .size(1, 1)
        .text('POS MANDIRI ENTERPRISE')
        .text('Edisi Sembahyang')
        .text('--------------------------------')
        .align('lt');

      cartData.forEach(item => {
        printer.text(`${item.name}`);
        printer.text(`${item.qty}x Rp ${item.price}   Rp ${item.qty * item.price}`);
      });

      printer
        .text('--------------------------------')
        .align('rt')
        .text(`TOTAL: Rp ${total}`)
        .align('ct')
        .text(' ')
        .text('Terima kasih atas kunjungan Anda.')
        .text('Semoga damai dan sejahtera.')
        .cut()
        .cashdraw(2) 
        .close();
    });

    // Jalankan transaksi pengurangan stok secara atomik
    const transaction = db.transaction((cart) => {
      for (const item of cart) {
        queries.decrementStock.run(item.qty, item.barcode);
      }
    });
    transaction(cartData);

    return { success: true, message: 'Struk dicetak dan stok diperbarui.' };

  } catch (error) {
    console.error('Hardware Error:', error);
    return { success: false, error: 'Kesalahan interaksi dengan perangkat keras.' };
  }
});

# Panduan Integrasi Backend: Electron.js & SQLite
**Status:** Deployment-Ready | **Target:** Windows / macOS (Desktop App)

Aplikasi React yang telah kita bangun kini siap dibungkus menjadi aplikasi desktop offline-first. Ikuti langkah-langkah ini di code editor lokal Anda (seperti VS Code).

---

## Tahap 1: Inisialisasi Proyek
Buka terminal di folder proyek React (Vite) Anda, lalu install dependensi backend:
```bash
npm install electron better-sqlite3
```

---

## Tahap 2: Buat File `database.js` (Mesin SQLite)
Buat file baru bernama `database.js` di folder root Anda. File ini akan membuat database `.db` asli di komputer kasir.

```javascript
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Membuat database di folder AppData OS (Aman dari hapusan cache)
const dbPath = path.join(app.getPath('userData'), 'pos_mandiri.db');
const db = new Database(dbPath);

// Membuat tabel Key-Value untuk Sinkronisasi State React kita
db.exec(`
  CREATE TABLE IF NOT EXISTS store (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

function saveData(key, value) {
  const stmt = db.prepare('INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)');
  stmt.run(key, value);
}

function loadData(key) {
  const stmt = db.prepare('SELECT value FROM store WHERE key = ?');
  const row = stmt.get(key);
  return row ? row.value : null;
}

module.exports = { saveData, loadData };
```

---

## Tahap 3: Buat File `preload.js` (Jembatan Keamanan)
Agar React bisa mengobrol dengan Node.js/SQLite dengan aman, kita butuh jembatan IPC (Inter-Process Communication). Buat file `preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (key, value) => ipcRenderer.send('db-save', key, value),
  loadDataSync: (key) => ipcRenderer.sendSync('db-load', key),
  printReceipt: (txData) => ipcRenderer.send('print-receipt', txData)
});
```

---

## Tahap 4: Buat File `main.js` (Inti Electron)
Buat file `main.js`. File ini akan membuka jendela aplikasi desktop dan mendengarkan perintah dari React.

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { saveData, loadData } = require('./database');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Saat development gunakan localhost, saat build arahkan ke file index.html
  win.loadURL('http://localhost:5173'); 
}

app.whenReady().then(() => {
  createWindow();

  // Mendengarkan sinyal dari App.jsx (React)
  ipcMain.on('db-save', (event, key, value) => { saveData(key, value); });
  ipcMain.on('db-load', (event, key) => { event.returnValue = loadData(key); });
  
  ipcMain.on('print-receipt', (event, txData) => {
    console.log("MENGIRIM KE PRINTER THERMAL ESC/POS:", txData.id);
    // Di sini Anda bisa mengintegrasikan library seperti 'electron-pos-printer'
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

---

## Tahap 5: Jalankan Aplikasi!
Tambahkan skrip ini di `package.json` Anda:

```json
{
  "main": "main.js",
  "scripts": {
    "start:electron": "electron ."
  }
}
```

Lalu jalankan `npm run start:electron`. 

**Selamat!** Aplikasi POS Anda kini adalah perangkat lunak Enterprise seutuhnya!

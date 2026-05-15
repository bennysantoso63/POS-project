const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const bwipjs = require('bwip-js');
const isDev = !app.isPackaged;
const db = require('../../src/db/db.cjs');

// 1. IMPORT QUERIES (RESTORED)
const auth = require('../../src/db/queries/auth.cjs');
const products = require('../../src/db/queries/products.cjs');
const categories = require('../../src/db/queries/categories.cjs');
const sessions = require('../../src/db/queries/sessions.cjs');
const transactions = require('../../src/db/queries/transactions.cjs');
const heldBills = require('../../src/db/queries/heldBills.cjs');
const customers = require('../../src/db/queries/customers.cjs');
const receivables = require('../../src/db/queries/receivables.cjs');
const suppliers = require('../../src/db/queries/suppliers.cjs');
const purchasing = require('../../src/db/queries/purchasing.cjs');
const expenses = require('../../src/db/queries/expenses.cjs');
const intelligence = require('../../src/db/queries/intelligence.cjs');
const excelSyncQueries = require('../../src/db/queries/excelSync.cjs');
const googleSyncQueries = require('../../src/db/queries/googleSync.cjs');
const sembahyangQueries = require('../../src/db/queries/sembahyang.cjs');
const syncManager = require('../../src/db/queries/syncManager.cjs');

// Initialize Core Services
try {
    syncManager.startSyncService();
} catch (e) {
    console.error("Sync Service Error:", e);
}

const printerService = require('../../src/utils/PrinterService.cjs');

function createWindow() {
    const win = new BrowserWindow({
        width: 1366,
        height: 768,
        backgroundColor: '#141E30',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.removeMenu();
    win.maximize();
    
    if (isDev) {
        win.loadURL('http://localhost:5175');
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../../dist/index.html'));
    }
}

function registerIpcHandlers() {
    // 🛡️ AUTH & AUDIT (RESTORED)
    ipcMain.handle('api-check-setup', () => auth.checkNeedsSetup());
    ipcMain.handle('api-setup-admin', (e, d) => auth.createUser(d.username, d.pin, 'owner'));
    ipcMain.handle('api-login', (e, pin) => auth.authenticateByPin(pin));
    ipcMain.handle('api-get-users', () => auth.getAllUsers());
    
    // 📦 PRODUCTS & CATEGORIES
    ipcMain.handle('api-get-products', () => products.getProducts());
    ipcMain.handle('api-add-product', (e, d) => products.createProduct(d));
    ipcMain.handle('api-update-product', (e, id, d, userId) => {
        auth.logAudit(userId, 'update_product', `Updated product ${id}`);
        return products.updateProduct(id, d);
    });
    ipcMain.handle('api-delete-product', (e, id) => products.deleteProduct(id));
    ipcMain.handle('api-get-categories', () => categories.getAllCategories());

    // 💰 TRANSACTIONS
    ipcMain.handle('api-process-checkout', (e, d) => transactions.createTransaction(d));
    ipcMain.handle('api-get-transactions', (e, f) => transactions.getTransactions(f));
    ipcMain.handle('api-void-transaction', (e, id, sid) => transactions.voidTransaction(id, sid));

    // 🕒 SESSIONS & AUTO-BACKUP
    ipcMain.handle('api-get-active-session', () => sessions.getActiveSession());
    ipcMain.handle('api-open-session', (e, cash) => sessions.openSession(cash));
    ipcMain.handle('api-close-session', async (e, d) => {
        const res = await sessions.closeSession(d.sessionId, d.closingCash, d.notes);
        if (res.success) {
            try { await googleSyncQueries.uploadToDrive(); } catch (err) {}
        }
        return res;
    });

    // 🧠 INTELLIGENCE & SEMBAHYANG (RESTORED)
    ipcMain.handle('api-intelligence-rfm', () => intelligence.getRFMMatrix());
    ipcMain.handle('api-intelligence-apriori', () => intelligence.getAprioriRules());
    ipcMain.handle('api-intelligence-burnrate', () => intelligence.getBurnRateAlerts());
    ipcMain.handle('api-intelligence-bigbang', () => intelligence.getSembahyangBigBang());
    ipcMain.handle('api-intelligence-chat', (e, q) => intelligence.askLingLing(q));
    ipcMain.handle('sembahyang:getBundlingSuggestion', (_, id) => sembahyangQueries.getBundlingSuggestion(id));
    ipcMain.handle('sembahyang:closeBlindSession', (_, sid, cash) => sembahyangQueries.closeBlindSession(sid, cash));

    // 🔄 SYNC & EXCEL
    ipcMain.handle('sync:googleLogin', () => googleSyncQueries.googleLogin());
    ipcMain.handle('sync:dryRunExcel', (_, path) => excelSyncQueries.dryRunExcel(path));
    ipcMain.handle('sync:commitExcel', (_, data, platform) => excelSyncQueries.commitExcel(data, platform));
    ipcMain.handle('sync:getDriveSyncStatus', () => googleSyncQueries.getDriveSyncStatus());

    // ⚙️ SETTINGS & HARDWARE
    ipcMain.handle('api-get-settings', () => {
        const rows = db.prepare('SELECT * FROM settings').all();
        return rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
    });
    ipcMain.handle('api-save-settings', (e, d) => {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        db.transaction(() => Object.entries(d.data).forEach(([k, v]) => stmt.run(k, v?.toString() || '')))();
        return { success: true };
    });
    ipcMain.handle('api-print-receipt', async (e, d) => await printerService.printReceipt(d));

    ipcMain.on('quit-app', () => app.quit());
}

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
});

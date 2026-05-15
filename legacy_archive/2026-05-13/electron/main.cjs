const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const bwipjs = require('bwip-js');
const bcrypt = require('bcryptjs');
const isDev = !app.isPackaged;
const db = require('../src/db/db.cjs');

// 1. IMPORT QUERIES (RESTORED)
const auth = require('../src/db/queries/auth.cjs');
const products = require('../src/db/queries/products.cjs');
const categories = require('../src/db/queries/categories.cjs');
const sessions = require('../src/db/queries/sessions.cjs');
const transactions = require('../src/db/queries/transactions.cjs');
const heldBills = require('../src/db/queries/heldBills.cjs');
const customers = require('../src/db/queries/customers.cjs');
const receivables = require('../src/db/queries/receivables.cjs');
const suppliers = require('../src/db/queries/suppliers.cjs');
const purchasing = require('../src/db/queries/purchasing.cjs');
const expenses = require('../src/db/queries/expenses.cjs');
const cloudSync = require('../src/db/queries/cloudSync.cjs');
const syncManager = require('../src/db/queries/syncManager.cjs');
const intelligenceQueries = require('../src/db/queries/intelligence.cjs');
const sessionQueries = require('../src/db/queries/sessions.cjs');
const excelSyncQueries = require('../src/db/queries/excelSync.cjs');
const googleSyncQueries = require('../src/db/queries/googleSync.cjs');

// Initialize Services (Fix B: Defer sync service to avoid DB lock at startup)
try {
    cloudSync.initSyncTable();
    setTimeout(() => {
        try { 
            syncManager.startSyncService(); 
            console.log("[SYNC] Enterprise Orchestrator started with 3s delay.");
        } catch (e) {
            console.error("[Sync Error]", e.message);
        }
    }, 3000);
} catch (e) { console.error(e); }

const printerService = require('../src/utils/PrinterService.cjs');
const printer = {
    print: async (txData, settings) => await printerService.printReceipt(txData, settings),
    invalidateCache: () => {}
};

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
    win.once('ready-to-show', () => {
        win.show();
        if (!app.isPackaged) win.webContents.openDevTools();
    });

    if (app.isPackaged) {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    } else {
        win.loadURL('http://localhost:5175');
    }
}

function registerIpcHandlers() {
    ipcMain.handle('api-check-setup', () => auth.checkNeedsSetup());
    ipcMain.handle('api-setup-admin', async (e, d) => auth.createUser(d.username, d.pin, 'owner'));
    ipcMain.handle('api-login', async (e, pin) => auth.authenticateByPin(pin));
    ipcMain.handle('api-get-products', () => products.getProducts());
    ipcMain.handle('api-add-product', (e, d) => products.createProduct(d));
    ipcMain.handle('api-update-product', (e, id, d) => products.updateProduct(id, d));
    ipcMain.handle('api-delete-product', (e, id) => products.deleteProduct(id));
    ipcMain.handle('api-get-categories', () => categories.getAllCategories());
    ipcMain.handle('api-get-transactions', (e, f) => transactions.getTransactions(f));
    ipcMain.handle('api-process-checkout', (e, d) => transactions.createTransaction(d));
    ipcMain.handle('api-void-transaction', (e, id, sid) => transactions.voidTransaction(id, sid));
    ipcMain.handle('api-get-active-session', () => sessions.getActiveSession());
    ipcMain.handle('api-open-session', (e, c) => sessions.openSession(c));
    ipcMain.handle('api-close-session', (e, d) => sessions.closeSession(d.sessionId, d.closingCash, d.notes));
    ipcMain.handle('api-get-sessions', () => sessions.getSessions());
    ipcMain.handle('api-get-held-bills', () => heldBills.getHeldBills());
    ipcMain.handle('api-hold-bill', (e, d) => heldBills.holdBill(d.label, d.cartItems));
    ipcMain.handle('api-restore-bill', (e, id) => heldBills.restoreBill(id));
    ipcMain.handle('api-get-customers', () => customers.getAllCustomers());
    ipcMain.handle('api-add-customer', (e, d) => customers.createCustomer(d));
    ipcMain.handle('api-record-payment', (e, d) => receivables.recordPayment(d.receivable_id, d, d.sessionId));
    ipcMain.handle('api-get-purchase-orders', () => purchasing.getAllPurchaseOrders());
    ipcMain.handle('api-receive-po', (e, id) => purchasing.receivePurchaseOrder(id));
    ipcMain.handle('api-get-settings', () => {
        const rows = db.prepare('SELECT * FROM settings').all();
        return rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
    });
    ipcMain.handle('api-save-settings', (e, d) => {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        db.transaction(() => Object.entries(d).forEach(([k, v]) => stmt.run(k, v?.toString() || '')))();
        return { success: true };
    });
    ipcMain.handle('api-print-receipt', async (e, d) => await printer.print(d));
    ipcMain.handle('api-generate-barcode', async (e, t) => {
        const png = await bwipjs.toBuffer({ bcid: 'code128', text: t, scale: 3, height: 10, includetext: true });
        return `data:image/png;base64,${png.toString('base64')}`;
    });
    ipcMain.handle('sembahyang:getBundlingSuggestion', (_, id) => intelligenceQueries.getBundlingSuggestion(id));
    ipcMain.handle('api-get-dashboard-stats', (e, f) => {
        const t = f.date || new Date().toISOString().split('T')[0];
        const s = db.prepare(`SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(id) AS transaction_count FROM transactions WHERE date(created_at) = ? AND status != 'void'`).get(t);
        const tp = db.prepare(`SELECT p.name, SUM(ti.qty) as totalPcs FROM transaction_items ti JOIN products p ON ti.product_id = p.id JOIN transactions t ON t.id = ti.transaction_id WHERE date(t.created_at) = ? AND t.status != 'void' GROUP BY p.id ORDER BY totalPcs DESC LIMIT 5`).all(t);
        return { ...s, topProducts: tp };
    });

    // Fix A: Stub handlers for missing channels to prevent hung promises
    ipcMain.handle('api-get-users', () => []);
    ipcMain.handle('api-get-suppliers', () => []);
    ipcMain.handle('api-get-expenses', () => []);
    
    // Intelligence Stubs (Missing in intelligence.cjs)
    ipcMain.handle('api-intelligence-rfm', () => ({ customers: [], segments: {} }));
    ipcMain.handle('api-intelligence-burnrate', () => []);
    ipcMain.handle('api-intelligence-apriori', () => []);
    ipcMain.handle('api-intelligence-bigbang', () => null);
    ipcMain.handle('api-intelligence-chat', () => "Asisten Ling-Ling sedang offline.");

    ipcMain.on('quit-app', () => app.quit());
}

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

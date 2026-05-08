const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('../src/db/db.js');

// 1. IMPORT QUERIES
const auth = require('../src/db/queries/auth');
const products = require('../src/db/queries/products');
const categories = require('../src/db/queries/categories');
const sessions = require('../src/db/queries/sessions');
const transactions = require('../src/db/queries/transactions');
const heldBills = require('../src/db/queries/heldBills');
const customers = require('../src/db/queries/customers');
const receivables = require('../src/db/queries/receivables');
const suppliers = require('../src/db/queries/suppliers');
const purchasing = require('../src/db/queries/purchasing');
const fnb = require('../src/db/queries/fnb');
const expenses = require('../src/db/queries/expenses');
const cloudSync = require('../src/db/queries/cloudSync');
const syncManager = require('../src/db/queries/syncManager');
const sembahyangAI = require('./queries/sembahyang_ai');


// Initialize DB Tables
cloudSync.initSyncTable();

// 2. HARDWARE & NETWORK PLACEHOLDERS (Ready for Sprint 12)
const kdsServer = {
    broadcast: (data) => { /* TODO: Implement KDS broadcast (Sprint 12) */ },
    start: (port) => { /* TODO: Implement KDS listener (Sprint 12) */ }
};

const printer = {
    print: (data) => { /* TODO: Implement EscPos USB/Network (Sprint 12) */ },
    invalidateCache: () => { /* TODO: Implement printer cache clear */ }
};

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: "POS Mandiri Enterprise",
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (app.isPackaged) {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    } else {
        win.loadURL('http://localhost:5173');
        // win.webContents.openDevTools(); // Optional for dev
    }
}

function registerIpcHandlers() {
    // --- AUTH & USER MANAGEMENT ---
    ipcMain.handle('api-check-setup', () => auth.checkNeedsSetup());
    ipcMain.handle('api-setup-admin', async (e, data) => auth.createUser(data.username, data.pin, 'admin'));
    ipcMain.handle('api-login', async (e, pin) => auth.authenticateUser(pin));
    ipcMain.handle('api-get-users', () => auth.getAllUsers());
    ipcMain.handle('api-create-user', async (e, data) => {
        const res = await auth.createUser(data.username, data.pin, data.role);
        if (res.success && data.currentUserId) {
            auth.logAudit(data.currentUserId, 'CREATE_USER', `USER-${res.userId}`, { username: data.username, role: data.role });
        }
        return res;
    });
    ipcMain.handle('api-update-user', (e, id, data) => {
        const stmt = db.prepare('UPDATE users SET role = ?, is_active = ? WHERE id = ?');
        return { success: stmt.run(data.role, data.is_active ? 1 : 0, id).changes > 0 };
    });
    ipcMain.handle('api-delete-user', (e, id) => {
        const stmt = db.prepare('UPDATE users SET is_active = 0 WHERE id = ?');
        return { success: stmt.run(id).changes > 0 };
    });
    ipcMain.handle('api-get-audit-logs', () => auth.getAuditLogs());

    // --- MASTER DATA ---
    ipcMain.handle('api-get-products', () => products.getProducts());
    ipcMain.handle('api-get-categories', () => categories.getAllCategories());
    ipcMain.handle('api-add-product', (e, data) => products.createProduct(data));
    ipcMain.handle('api-update-product', (e, id, data) => products.updateProduct(id, data));
    ipcMain.handle('api-delete-product', (e, id) => products.deleteProduct(id));

    // --- SHIFT & SESSION ---
    ipcMain.handle('api-get-active-session', () => sessions.getActiveSession());
    ipcMain.handle('api-open-session', (e, openingCash) => sessions.openSession(openingCash));
    ipcMain.handle('api-close-session', (e, data) => sessions.closeSession(data.sessionId, data.closingCash, data.notes));
    ipcMain.handle('api-get-sessions', () => sessions.getSessions());

    // --- KASIR & TRANSAKSI ---
    ipcMain.handle('api-process-checkout', async (e, txData) => {
        const res = await transactions.createTransaction(txData);
        if (res.success && txData.businessMode === 'FNB') {
            kdsServer.broadcast({ type: 'NEW_ORDER', txId: res.txId, items: txData.items });
        }
        return res;
    });
    ipcMain.handle('api-void-transaction', (e, txId) => transactions.voidTransaction(txId));
    ipcMain.handle('api-get-transactions', (e, filters) => transactions.getTransactions(filters));
    
    // Hold Bills (Draft / Table Management)
    ipcMain.handle('api-hold-bill', (e, data) => {
        const res = heldBills.holdBill(data.label, data.cartItems);
        if (res.success) kdsServer.broadcast({ type: 'HELD_ORDER', table: data.label, items: data.cartItems });
        return res;
    });
    ipcMain.handle('api-get-held-bills', () => heldBills.getHeldBills());
    ipcMain.handle('api-restore-bill', (e, id) => heldBills.restoreBill(id));
    ipcMain.handle('api-discard-held-bill', (e, id) => heldBills.discardHeldBill(id));

    // --- ACCOUNTS RECEIVABLE (CRM) ---
    ipcMain.handle('api-get-customers', () => customers.getAllCustomers());
    ipcMain.handle('api-add-customer', (e, data) => customers.createCustomer(data));
    ipcMain.handle('api-create-receivable', (e, data) => receivables.createReceivable(data));
    ipcMain.handle('api-record-payment', (e, data) => receivables.recordPayment(data.receivable_id, data, data.sessionId));

    // --- ACCOUNTS PAYABLE (Hutang) ---
    ipcMain.handle('api-get-suppliers', () => suppliers.getAllSuppliers());
    ipcMain.handle('api-create-supplier', (e, data) => suppliers.createSupplier(data));
    ipcMain.handle('api-get-purchase-orders', () => purchasing.getAllPurchaseOrders());
    ipcMain.handle('api-create-po', (e, data) => purchasing.createPurchaseOrder(data));
    ipcMain.handle('api-receive-po', (e, id) => purchasing.receivePurchaseOrder(id));
    ipcMain.handle('api-pay-po', (e, id, data) => purchasing.recordPurchasePayment(id, data));

    // --- F&B ENGINE ---
    ipcMain.handle('api-get-kds-orders', () => fnb.getKdsTickets());
    ipcMain.handle('api-update-kds-status', (e, id, status) => {
        const res = fnb.updateTicketStatus(id, status);
        kdsServer.broadcast({ type: 'TICKET_UPDATED', id, status });
        return res;
    });
    ipcMain.handle('api-get-ingredients', () => fnb.getIngredients());
    ipcMain.handle('api-record-spoilage', (e, data) => fnb.recordSpoilage(data.ingId, data.qty, data.reason, data.user));
    ipcMain.handle('api-get-spoilages', () => fnb.getSpoilageLogs(50));
    ipcMain.handle('api-get-recipe', (e, productId) => fnb.getRecipeByProduct(productId));
    ipcMain.handle('api-save-recipe', (e, productId, items) => fnb.saveRecipe(productId, items));

    // --- SETTINGS & HARDWARE ---
    ipcMain.handle('api-get-settings', () => {
        const rows = db.prepare('SELECT * FROM settings').all();
        return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    });
    ipcMain.handle('api-save-settings', (e, data) => {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        db.transaction(() => {
            Object.entries(data).forEach(([key, value]) => stmt.run(key, value.toString()));
        })();
        printer.invalidateCache();
        return { success: true };
    });
    ipcMain.handle('api-print-receipt', (e, data) => {
        printer.print(data);
        return { success: true };
    });
    
    // Inventory Adjustments
    ipcMain.handle('api-adjust-stock', (e, adjustments) => {
        db.transaction(() => {
            adjustments.forEach(adj => products.adjustStock(adj.productId, adj.delta, adj.reason, adj.notes));
        })();
        return { success: true };
    });
    ipcMain.handle('api-get-stock-movements', () => products.getStockMovements());
    
    // Expenses
    ipcMain.handle('api-create-expense', (e, data) => expenses.createExpense(data));
    ipcMain.handle('api-get-expenses', () => expenses.getAllExpenses());

    // [Sprint 12] Cloud Sync Orchestrator
    ipcMain.handle('api-force-sync', () => syncManager.forceSyncNow());
    ipcMain.handle('api-sync-cloud', async (e, options) => {
        try {
            return await syncManager.syncCloud(options);
        } catch (err) {
            return { success: false, error: err.message };
        }
    });
    ipcMain.handle('api-get-sync-health', () => syncManager.getSyncHealth());

    // [Sprint 13] Sembahyang Intelligence Engine
    sembahyangAI.registerSembahyangIpc(ipcMain);
}


app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
    
    // Initialize dummy KDS server
    kdsServer.start(3002);

    // [Sprint 12] Start Enterprise Sync Orchestrator
    syncManager.startSyncService();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const bwipjs = require('bwip-js');
const isDev = !app.isPackaged;
const db = require('../src/db/db.cjs');

// 🛠️ FIX: Cache Permission & GPU Issues
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.setPath('userData', path.join(app.getPath('appData'), 'pos-offline-mandiri'));

// 🚀 PHASE 0: DB Schema Patch for Categories (Missing Columns)
try {
    db.exec("ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1");
    console.log("[MIGRATION] Added is_active column to categories table.");
} catch (e) {
    if (!e.message.includes('duplicate column name')) {
        console.error("[MIGRATION ERROR] is_active:", e.message);
    }
}
try {
    db.exec("ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0");
    console.log("[MIGRATION] Added sort_order column to categories table.");
} catch (e) {
    if (!e.message.includes('duplicate column name')) {
        console.error("[MIGRATION ERROR] sort_order:", e.message);
    }
}

// 🚀 PHASE 0: Global State
let mainWindow;
let isDeferredLogicLoaded = false;

// 1. LIGHTWEIGHT IMPORTS (Top-level only for core Electron)
const auth = require('../src/db/queries/auth.cjs');
const sessions = require('../src/db/queries/sessions.cjs');
// (Other heavy queries moved to deferred loading)

// 2. BOOT SERVICES (Deferred)
function startBackgroundServices() {
    setTimeout(() => {
        try {
            const syncManager = require('../src/db/queries/syncManager.cjs');
            syncManager.startSyncService();
            
            // 🚀 AKTIVASI REACTIVE DATA PIPELINE
            const analyticsService = require('./AnalyticsService.js');
            analyticsService.start();
            
            console.log("[SYSTEM] Background Services (Sync & Analytics) Started.");
        } catch (e) {
            console.error("Background Service Error:", e);
        }
    }, 5000); // Jeda 5 detik agar UI benar-benar stabil
}

// const printerService = require('../src/utils/PrinterService.cjs'); // Removed duplicate require

const waitForVite = (retries = 20) => {
    return new Promise((resolve, reject) => {
        const attempt = (n) => {
            fetch('http://localhost:5175')
                .then(() => resolve())
                .catch(() => {
                    if (n <= 0) return reject(new Error('Vite timeout'));
                    console.log(`[SYSTEM] Menunggu Vite... sisa ${n} percobaan`);
                    setTimeout(() => attempt(n - 1), 1000);
                });
        };
        attempt(retries);
    });
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        backgroundColor: '#141E30',
        show: false, // 🚀 Tier 1: Hide initially
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.removeMenu();
    mainWindow.maximize();
    
    if (isDev) {
        waitForVite()
            .then(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.loadURL('http://localhost:5175');
                }
            })
            .catch((err) => {
                console.error('[SYSTEM] Vite gagal start:', err);
                app.quit();
            });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    
    // 🔍 DEBUG: Lifecycle Monitors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('[RENDERER] Load failed:', errorCode, errorDescription);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
        mainWindow.show();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[RENDERER] Load finished successfully');
    });

    mainWindow.webContents.on('dom-ready', () => {
        console.log('[RENDERER] DOM ready');
        if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
    });

    // 🚀 PHASE 2: UI is ready to paint
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
        mainWindow.focus();
        
        // Load deferred logic after window is visible
        if (!isDeferredLogicLoaded) {
            bootDeferredLogic();
        }
    });
}

function registerCriticalHandlers() {
    // 🛡️ TIER 1: Handlers needed for login/setup (Must be ready before loadFile)
    ipcMain.handle('api-check-setup', () => auth.checkNeedsSetup());
    ipcMain.handle('api-setup-admin', (e, d) => auth.createUser(d.username, d.pin, 'owner'));
    ipcMain.handle('api-login', async (e, pin) => {
        try {
            console.log('[IPC] api-login invoked');
            const result = await auth.authenticateByPin(pin);
            console.log('[IPC] api-login result:', JSON.stringify({ success: result?.success, hasUser: !!result?.user }));
            return result;
        } catch (err) {
            console.error('[IPC] api-login FATAL ERROR:', err);
            return { success: false, error: err?.message || 'Terjadi kesalahan sistem.' };
        }
    });
    ipcMain.handle('api-get-users', () => auth.getAllUsers());
    
    ipcMain.handle('api-get-active-session', () => sessions.getActiveSession());
}

function bootDeferredLogic() {
    console.log("[SYSTEM] Memulai Deferred & Lazy Initialization...");

    // Lazy Imports (Hanya dimuat saat dibutuhkan)
    const products = require('../src/db/queries/products.cjs');
    const categories = require('../src/db/queries/categories.cjs');
    const transactions = require('../src/db/queries/transactions.cjs');
    const heldBills = require('../src/db/queries/heldBills.cjs');
    const customers = require('../src/db/queries/customers.cjs');
    const suppliers = require('../src/db/queries/suppliers.cjs');
    const intelligence = require('../src/db/queries/intelligence.cjs');
    const log = require('electron-log');
    try {
        intelligence.recalculateInsights();
        log.info('[LING-LING] Insights pre-computed.');
    } catch(e) {
        log.warn('[LING-LING] Recalc skipped:', e.message);
    }
    const excelSyncQueries = require('../src/db/queries/excelSync.cjs');
    const googleSyncQueries = require('../src/db/queries/googleSync.cjs');
    // const sembahyangQueries = require('../src/db/queries/sembahyang.cjs'); // DEPRECATED: Consolidated into dsEngine
    const printerService = require('../src/utils/PrinterService.cjs');
    const dsEngine = require('./LingLingDataScience.js');
    const sembahyang = require('../src/db/queries/sembahyang.cjs');

    // 📦 PRODUCTS & CATEGORIES
    ipcMain.handle('api-get-products', () => products.getProducts());
    ipcMain.handle('api-add-product', (e, d) => products.createProduct(d));
    ipcMain.handle('api-update-product', (e, id, d, userId) => {
        auth.logAudit(userId, 'update_product', `Updated product ${id}`);
        return products.updateProduct(id, d);
    });
    ipcMain.handle('api-delete-product', (e, id) => products.deleteProduct(id));
    ipcMain.handle('api-get-categories', () => categories.getAllCategories());

    // 💰 TRANSACTIONS & HELD BILLS
    ipcMain.handle('api-process-checkout', (e, d) => transactions.createTransaction(d));
    ipcMain.handle('api-get-transactions', (e, f) => transactions.getTransactions(f));
    ipcMain.handle('api-void-transaction', (e, id, sid) => transactions.voidTransaction(id, sid));
    ipcMain.handle('api-hold-bill', (e, d) => heldBills.createHeldBill(d.label, d.cartItems));
    ipcMain.handle('api-get-held-bills', () => heldBills.getHeldBills());
    ipcMain.handle('api-restore-bill', (e, id) => heldBills.getHeldBill(id));
    ipcMain.handle('api-delete-held-bill', (e, id) => heldBills.deleteHeldBill(id));

    // 👥 CRM & SUPPLIERS
    ipcMain.handle('api-get-customers', () => customers.getAllCustomers());
    ipcMain.handle('api-add-customer', (e, d) => customers.createCustomer(d));
    ipcMain.handle('api-update-customer', (e, id, data) => customers.updateCustomer(id, data));
    ipcMain.handle('api-delete-customer', (e, id) => customers.deleteCustomer(id));
    ipcMain.handle('api-get-suppliers', () => suppliers.getAllSuppliers());
    
    // 🚚 PURCHASING
    const purchasing = require('../src/db/queries/purchasing.cjs');
    ipcMain.handle('api-get-purchase-orders', (e, f) => purchasing.getAllPurchaseOrders(f));
    ipcMain.handle('api-create-po', (e, d) => purchasing.createPurchaseOrder(d));
    ipcMain.handle('api-receive-po', (e, id) => purchasing.receivePurchaseOrder(id));
    ipcMain.handle('api-pay-po', (e, id, amount, sessionId) => purchasing.recordPurchasePayment(id, { amount, payment_method: 'cash' }, sessionId));

    // 💸 EXPENSES & RECEIVABLES
    const expenses = require('../src/db/queries/expenses.cjs');
    const receivables = require('../src/db/queries/receivables.cjs');
    ipcMain.handle('api-record-expense', (e, d) => expenses.createExpense(d));
    ipcMain.handle('api-get-expenses', async () => {
      try {
        return expenses.getAllExpenses();
      } catch(e) {
        return [];
      }
    });
    ipcMain.handle('api-record-payment', (e, id, d, sid) => receivables.recordPayment(id, d, sid));
    ipcMain.handle('api-get-movements', (e, pid) => products.getStockMovements(pid));
    ipcMain.handle('api-apply-adjustments', (e, items, userId) => {
        return db.transaction(() => {
            for (const item of items) {
                products.adjustStock(item.id, item.diff, 'Opname', userId || 'Admin');
            }
            return { success: true };
        })();
    });

    // 🕒 SESSIONS & AUTO-BACKUP
    ipcMain.handle('api-open-session', (e, cash) => sessions.openSession(cash));
    ipcMain.handle('api-close-session', async (e, d) => {
        const res = await sessions.closeSession(d.sessionId, d.closingCash, d.notes);
        if (res.success) {
            try { await googleSyncQueries.uploadFileToGoogleDrive(); } catch (err) {}
        }
        return res;
    });
    ipcMain.handle('api-get-sessions', () => sessions.getSessions());

    // 🧠 INTELLIGENCE & SEMBAHYANG
    ipcMain.handle('api-intelligence-rfm', () => intelligence.getRFMMatrix());
    ipcMain.handle('api-intelligence-apriori', () => intelligence.getAprioriRules());
    ipcMain.handle('api-intelligence-burnrate', () => intelligence.getBurnRateAlerts());
    ipcMain.handle('api-intelligence-bigbang', () => intelligence.getSembahyangBigBang());
    ipcMain.handle('api-intelligence-chat', (e, q) => intelligence.askLingLing(q));
    ipcMain.handle('api-intelligence-recalculate', async () => {
        const rfmSuccess = await dsEngine.recalculateRFM();
        const aprioriSuccess = await dsEngine.recalculateApriori();
        return { success: rfmSuccess && aprioriSuccess };
    });
    ipcMain.handle('sembahyang:getBundlingSuggestion', (_, id) => dsEngine.getBundlingSuggestion(id));
    ipcMain.handle('sembahyang:closeBlindSession', (_, sid, cash) => sessions.closeBlindSession(sid, cash));
    
    // New Sembahyang Handlers
    ipcMain.handle('sembahyang:get-anchor-items', () => sembahyang.getAnchorItems());
    ipcMain.handle('sembahyang:get-lunar-date', () => sembahyang.getLunarDate());
    ipcMain.handle('sembahyang:get-credit-score', (e, id) => sembahyang.getCustomerCreditScore(id));
    ipcMain.handle('sembahyang:get-seasonal-alerts', () => sembahyang.getSeasonalMarkdownAlerts());
    ipcMain.handle('sembahyang:get-void-anomaly', (e, sid) => sembahyang.getVoidAnomalyForSession(sid));
    ipcMain.handle('sembahyang:get-burnrate-alerts', () => sembahyang.getBurnrateAlerts());
    ipcMain.handle('sembahyang:get-bundling', (e, pid) => sembahyang.getBundlingSuggestions(pid));
    ipcMain.handle('sembahyang:get-rfm-profile', (e, cid) => sembahyang.getCustomerRFMProfile(cid));
    ipcMain.handle('sembahyang:get-rfm-summary', () => sembahyang.getRFMSummary());
    ipcMain.handle('sembahyang:compute-all', () => {
        sembahyang.computeAndSetAnchorItems();
        sembahyang.computeBurnratePredictions();
        return { success: true };
    });


    // 🤖 LING-LING DATA SCIENCE (REAL-TIME ENGINE)
    ipcMain.handle('ds:get-recommendations', (_, barcodes) => dsEngine.getCrossSellRecommendations(barcodes));
    ipcMain.handle('ds:get-burn-rate', (_, barcode) => dsEngine.calculateLunarBurnRate(barcode));

    // 🔄 SYNC & EXCEL
    ipcMain.handle('sync:googleLogin', () => googleSyncQueries.googleLogin());
    ipcMain.handle('sync:dryRunExcel', (_, path) => excelSyncQueries.parseExcelDryRun(path));
    ipcMain.handle('sync:commitExcel', (_, data, platform) => excelSyncQueries.commitExcelSync(data, platform));
    ipcMain.handle('sync:uploadToDrive', (_, filePath, fileName) =>
        googleSyncQueries.uploadFileToGoogleDrive(filePath, fileName)
    );
    ipcMain.handle('sync:getDriveSyncStatus', () => 
        googleSyncQueries.getDriveSyncStatus 
            ? googleSyncQueries.getDriveSyncStatus() 
            : { connected: false }
    );

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

    isDeferredLogicLoaded = true;
    startBackgroundServices();
}

app.whenReady().then(() => {
    registerCriticalHandlers();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && !isDev) app.quit();
});

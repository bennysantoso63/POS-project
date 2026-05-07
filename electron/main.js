import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import log from 'electron-log';
import { initDb, closeDb, getDb } from '../src/db/db.js';
import { createTransaction, voidTransaction, getTransactions, getPiutangReport, getCustomerReceivables as getReceivablesLegacy } from '../src/db/queries/transactions.js';
import { 
  createPurchaseOrder, receivePurchaseOrder, recordPurchasePayment, voidPurchaseOrder, 
  getPurchaseOrderById, getAllPurchaseOrders, getAPSummary, getSupplierStatement 
} from '../src/db/queries/purchasing.js';
import { authenticateUser, registerUser } from '../src/db/queries/auth.js';
import { getActiveSession, openSession, closeSession, getSessionHistory } from '../src/db/queries/sessions.js';
import { createExpense, getAllExpenses, getExpensesByMonth, getExpensesByCategory, getExpenseSummaryByCategory, updateExpense, deleteExpense } from '../src/db/queries/expenses.js';
import { holdBill, getHeldBills, restoreBill, discardHeldBill, clearAllHeldBills } from '../src/db/queries/heldBills.js';
import { getAllCustomers, searchCustomers, createCustomer, updateCustomer } from '../src/db/queries/customers.js';
import { 
  createReceivable, recordPayment as recordReceivablePayment, voidReceivable, 
  getReceivableById, getAllReceivables, getReceivableSummary, getCustomerReceivables 
} from '../src/db/queries/receivables.js';
import { getAllSuppliers, searchSuppliers, createSupplier, updateSupplier } from '../src/db/queries/suppliers.js';
import { getAllCategories, createCategory, updateCategory, deleteCategory, getProductsByCategory } from '../src/db/queries/categories.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { printReceipt } = require('../src/print/escpos.cjs');

// Cache untuk Store Settings agar tidak query DB setiap kali print
let settingsCache = null;

function loadStoreSettings() {
    if (settingsCache) return settingsCache;
    try {
      const rows = getDb().prepare('SELECT key, value FROM settings').all();
      const settings = {};
      rows.forEach(r => settings[r.key] = r.value);
      settingsCache = settings;
      return settingsCache;
    } catch (err) {
      return {};
    }
}

function invalidateSettingsCache() {
    settingsCache = null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#020617', // slate-950
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('userData'), 'pos-mandiri', 'pos.db');
  
  try {
    initDb(dbPath);
    log.info('App ready. DB path: ' + dbPath);
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
        'Database Error',
        `Gagal membuka database:\n${err.message}\n\nPath: ${dbPath}`
    );
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  closeDb();
  log.info('App closing. DB closed.');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function parseCSVLine(line) {
  const result = [];
  const regex = /("(?:[^"\\]|\\.)*"|[^,]+)(?:,|$)/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
      let val = match[1];
      if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
      }
      result.push(val.trim());
  }
  return result;
}

// --- IPC HANDLERS ---

// Auth & Users
ipcMain.handle('users:login', async (event, pin) => {
  return await authenticateUser(pin);
});

ipcMain.handle('users:register', async (event, data) => {
  return await registerUser(data.username, data.pin, data.role);
});

// Sessions (Moka-style)
ipcMain.handle('db:getActiveSession', () => {
  return getActiveSession();
});

ipcMain.handle('db:openSession', (event, openingCash) => {
  return openSession(openingCash);
});

ipcMain.handle('db:closeSession', (event, data) => {
  return closeSession(data.sessionId, data.closingCash, data.notes);
});

// Held Bills (Drafts)
ipcMain.handle('db:holdBill', (event, data) => {
  return holdBill(data.label, data.cartItems);
});

ipcMain.handle('db:getHeldBills', () => {
  return getHeldBills();
});

ipcMain.handle('db:restoreBill', (event, id) => {
  return restoreBill(id);
});

ipcMain.handle('db:discardHeldBill', (event, id) => {
  return discardHeldBill(id);
});

ipcMain.handle('db:clearAllHeldBills', () => {
  return clearAllHeldBills();
});

// Core DB Getters
ipcMain.handle('db:getProducts', () => {
  try {
    return getDb().prepare('SELECT * FROM products ORDER BY name ASC').all();
  } catch (err) {
    log.error(`db:getProducts failed: ${err.message}`);
    return [];
  }
});

ipcMain.handle('db:getTransactions', () => {
  try {
    return getTransactions();
  } catch (err) {
    log.error(`db:getTransactions failed: ${err.message}`);
    return [];
  }
});

ipcMain.handle('db:getCustomerReceivables', () => {
  try {
    return getCustomerReceivables();
  } catch (err) {
    log.error(`db:getCustomerReceivables failed: ${err.message}`);
    return [];
  }
});

ipcMain.handle('db:getCustomers', () => {
  try {
    return getDb().prepare('SELECT * FROM customers ORDER BY name ASC').all();
  } catch (err) {
    log.error(`db:getCustomers failed: ${err.message}`);
    return [];
  }
});

ipcMain.handle('db:getMovements', () => {
  try {
    return getDb().prepare(`
      SELECT sm.*, p.name as product_name, p.sku 
      FROM stock_movements sm 
      JOIN products p ON sm.product_id = p.id 
      ORDER BY sm.created_at DESC LIMIT 100
    `).all();
  } catch (err) {
    log.error(`db:getMovements failed: ${err.message}`);
    return [];
  }
});

// Settings
ipcMain.handle('db:getSettings', () => {
  return loadStoreSettings();
});

ipcMain.handle('db:updateSettings', (event, settings) => {
  try {
    const stmt = getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const transaction = getDb().transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          stmt.run(key, value.toString());
        }
      }
    });
    transaction(settings);
    invalidateSettingsCache();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Transaction & AR Logic
ipcMain.handle('db:createTransaction', (event, data) => {
  try {
    const txId = createTransaction(data);
    log.info(`TX Created: TX-${txId} (Shift: ${data.shiftId || 'N/A'})`);
    return { success: true, txId };
  } catch (err) {
    log.error(`TX Failed: ${err.message}`);
    return { success: false, message: err.message };
  }
});

ipcMain.handle('db:voidTransaction', async (event, id) => {
  return await voidTransaction(id);
});

// Product CRUD
ipcMain.handle('db:addProduct', (event, product) => {
  try {
    const result = getDb().prepare(`
      INSERT INTO products (sku, name, price_retail, price_wholesale, cost_price, stock_pcs, uom_box_active, uom_box_multiplier, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(product.sku, product.name, product.price_retail, product.price_wholesale, product.cost_price || 0, product.stock_pcs, product.uom_box_active, product.uom_box_multiplier, product.category);
    
    getDb().prepare(`INSERT INTO stock_movements (product_id, delta, reason, user_name) VALUES (?, ?, ?, ?)`)
      .run(result.lastInsertRowid, product.stock_pcs, 'Produk Baru', product.userName || 'System');

    return { success: true, id: result.lastInsertRowid };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('db:updateProduct', (event, product) => {
  try {
    const old = getDb().prepare('SELECT stock_pcs FROM products WHERE id = ?').get(product.id);
    getDb().prepare(`
      UPDATE products 
      SET sku = ?, name = ?, price_retail = ?, price_wholesale = ?, cost_price = ?, stock_pcs = ?, uom_box_active = ?, uom_box_multiplier = ?, category = ?
      WHERE id = ?
    `).run(product.sku, product.name, product.price_retail, product.price_wholesale, product.cost_price || 0, product.stock_pcs, product.uom_box_active, product.uom_box_multiplier, product.category, product.id);
    
    const diff = product.stock_pcs - old.stock_pcs;
    if (diff !== 0) {
      getDb().prepare(`INSERT INTO stock_movements (product_id, delta, reason, user_name) VALUES (?, ?, ?, ?)`)
        .run(product.id, diff, 'Penyesuaian Manual', product.userName || 'System');
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('db:deleteProduct', (event, id) => {
  try {
    getDb().prepare(`DELETE FROM products WHERE id = ?`).run(id);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Customer CRUD
ipcMain.handle('db:addCustomer', (event, customer) => {
  try {
    const result = getDb().prepare(`
      INSERT INTO customers (name, phone) VALUES (?, ?)
    `).run(customer.name, customer.phone);
    return { success: true, id: result.lastInsertRowid };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Printer IPC
ipcMain.handle('print-receipt', (event, data) => {
  try {
    const settings = loadStoreSettings();
    printReceipt({ 
      ...data, 
      storeName: settings.store_name, 
      storeAddress: settings.store_address,
      storeFooter: settings.receipt_footer
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Customers (CRM)
ipcMain.handle('db:getAllCustomers', (e, includeInactive) => getAllCustomers(includeInactive));
ipcMain.handle('db:searchCustomers', (e, keyword) => searchCustomers(keyword));
ipcMain.handle('db:createCustomer', (e, data) => createCustomer(data));
ipcMain.handle('db:updateCustomer', (e, id, data) => updateCustomer(id, data));

// Receivables (AR)
ipcMain.handle('db:createReceivable', (e, data) => createReceivable(data));
ipcMain.handle('db:recordReceivablePayment', (e, id, data, sid) => recordReceivablePayment(id, data, sid));
ipcMain.handle('db:voidReceivable', (e, id, reason) => voidReceivable(id, reason));
ipcMain.handle('db:getReceivableById', (e, id) => getReceivableById(id));
ipcMain.handle('db:getAllReceivables', (e, filters) => getAllReceivables(filters));
ipcMain.handle('db:getReceivableSummary', () => getReceivableSummary());
ipcMain.handle('db:getCustomerReceivables', (e, id) => getCustomerReceivables(id));

// Suppliers
ipcMain.handle('db:getAllSuppliers', (e, inc) => getAllSuppliers(inc));
ipcMain.handle('db:searchSuppliers', (e, kw) => searchSuppliers(kw));
ipcMain.handle('db:createSupplier', (e, data) => createSupplier(data));
ipcMain.handle('db:updateSupplier', (e, id, data) => updateSupplier(id, data));

// Purchasing (AP)
ipcMain.handle('db:createPurchaseOrder', (e, data) => createPurchaseOrder(data));
ipcMain.handle('db:receivePurchaseOrder', (e, id) => receivePurchaseOrder(id));
ipcMain.handle('db:recordPurchasePayment', (e, id, data, sid) => recordPurchasePayment(id, data, sid));
ipcMain.handle('db:voidPurchaseOrder', (e, id, reason) => voidPurchaseOrder(id, reason));
ipcMain.handle('db:getPurchaseOrderById', (e, id) => getPurchaseOrderById(id));
ipcMain.handle('db:getAllPurchaseOrders', (e, filters) => getAllPurchaseOrders(filters));
ipcMain.handle('db:getAPSummary', () => getAPSummary());
ipcMain.handle('db:getSupplierStatement', (e, id) => getSupplierStatement(id));

// Categories
ipcMain.handle('db:getAllCategories', () => getAllCategories());
ipcMain.handle('db:createCategory', (e, name, order) => createCategory(name, order));
ipcMain.handle('db:updateCategory', (e, id, data) => updateCategory(id, data));
ipcMain.handle('db:deleteCategory', (e, id) => deleteCategory(id));
ipcMain.handle('db:getProductsByCategory', (e, cat) => getProductsByCategory(cat));

// Utilities
ipcMain.handle('db:adjustStock', (event, adjustments) => {
  const db = getDb();
  const adjust = db.transaction((adjs) => {
    const update = db.prepare('UPDATE products SET stock_pcs = ? WHERE id = ?');
    const log = db.prepare('INSERT INTO stock_movements (product_id, delta, reason, user_name) VALUES (?, ?, ?, ?)');
    for (const a of adjs) {
      update.run(a.newStock, a.id);
      log.run(a.id, a.diff, 'Stok Opname', a.userName || 'System');
    }
  });

  try {
    adjust(adjustments);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Expenses (Sprint 7 Unified)
ipcMain.handle('db:createExpense', (e, data) => createExpense(data));
ipcMain.handle('db:getAllExpenses', (e, limit) => getAllExpenses(limit));
ipcMain.handle('db:getExpensesByMonth', (e, y, m) => getExpensesByMonth(y, m));
ipcMain.handle('db:getExpensesByCategory', (e, cat, y, m) => getExpensesByCategory(cat, y, m));
ipcMain.handle('db:getExpenseSummaryByCategory', (e, y, m) => getExpenseSummaryByCategory(y, m));
ipcMain.handle('db:updateExpense', (e, id, data) => updateExpense(id, data));
ipcMain.handle('db:deleteExpense', (e, id) => deleteExpense(id));

// Sessions History
ipcMain.handle('db:getSessionHistory', (e, limit) => getSessionHistory(limit));

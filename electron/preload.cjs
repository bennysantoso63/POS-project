const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Database Functions
  createTransaction: (data) => ipcRenderer.invoke('db:createTransaction', data),
  voidTransaction: (id) => ipcRenderer.invoke('db:voidTransaction', id),
  getProducts: () => ipcRenderer.invoke('db:getProducts'),
  getTransactions: () => ipcRenderer.invoke('db:getTransactions'),
  getCustomers: () => ipcRenderer.invoke('db:getCustomers'),
  getSessions: () => ipcRenderer.invoke('db:getSessions'),
  getMovements: () => ipcRenderer.invoke('db:getMovements'),
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  updateSettings: (settings) => ipcRenderer.invoke('db:updateSettings', settings),
  
  addProduct: (product) => ipcRenderer.invoke('db:addProduct', product),
  updateProduct: (product) => ipcRenderer.invoke('db:updateProduct', product),
  deleteProduct: (id) => ipcRenderer.invoke('db:deleteProduct', id),

  addCustomer: (customer) => ipcRenderer.invoke('db:addCustomer', customer),
  updateCustomer: (customer) => ipcRenderer.invoke('db:updateCustomer', customer),
  deleteCustomer: (id) => ipcRenderer.invoke('db:deleteCustomer', id),

  openSession: (data) => ipcRenderer.invoke('db:openSession', data),
  closeSession: (data) => ipcRenderer.invoke('db:closeSession', data),
  
  // Hardware Functions
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),

  // Authentication & RBAC
  login: (pin) => ipcRenderer.invoke('users:login', pin),
  registerUser: (data) => ipcRenderer.invoke('users:register', data),
  
  // Sessions (Moka-style)
  getActiveSession: () => ipcRenderer.invoke('db:getActiveSession'),
  openSession: (openingCash) => ipcRenderer.invoke('db:openSession', openingCash),
  closeSession: (data) => ipcRenderer.invoke('db:closeSession', data),

  // Held Bills (Drafts - Moka UX)
  holdBill: (data) => ipcRenderer.invoke('db:holdBill', data),
  getHeldBills: () => ipcRenderer.invoke('db:getHeldBills'),
  restoreBill: (id) => ipcRenderer.invoke('db:restoreBill', id),
  discardHeldBill: (id) => ipcRenderer.invoke('db:discardHeldBill', id),
  clearAllHeldBills: () => ipcRenderer.invoke('db:clearAllHeldBills'),

  // Categories
  getAllCategories: () => ipcRenderer.invoke('db:getAllCategories'),
  createCategory: (name, order) => ipcRenderer.invoke('db:createCategory', name, order),
  updateCategory: (id, data) => ipcRenderer.invoke('db:updateCategory', id, data),
  deleteCategory: (id) => ipcRenderer.invoke('db:deleteCategory', id),
  getProductsByCategory: (cat) => ipcRenderer.invoke('db:getProductsByCategory', cat),

  // File Operations
  exportTransactions: (filter) => ipcRenderer.invoke('db:exportTransactions', filter),
  importCsv: (csvContent) => ipcRenderer.invoke('db:importCsv', csvContent),
  
  // CRM & AR (Receivables)
  getAllCustomers: (inc) => ipcRenderer.invoke('db:getAllCustomers', inc),
  searchCustomers: (kw) => ipcRenderer.invoke('db:searchCustomers', kw),
  createCustomer: (data) => ipcRenderer.invoke('db:createCustomer', data),
  updateCustomer: (id, data) => ipcRenderer.invoke('db:updateCustomer', id, data),
  
  createReceivable: (data) => ipcRenderer.invoke('db:createReceivable', data),
  recordReceivablePayment: (id, data, sid) => ipcRenderer.invoke('db:recordReceivablePayment', id, data, sid),
  voidReceivable: (id, res) => ipcRenderer.invoke('db:voidReceivable', id, res),
  getReceivableById: (id) => ipcRenderer.invoke('db:getReceivableById', id),
  getAllReceivables: (flt) => ipcRenderer.invoke('db:getAllReceivables', flt),
  getReceivableSummary: () => ipcRenderer.invoke('db:getReceivableSummary'),
  getCustomerReceivables: (id) => ipcRenderer.invoke('db:getCustomerReceivables', id),

  // Suppliers & AP (Purchasing)
  getAllSuppliers: (inc) => ipcRenderer.invoke('db:getAllSuppliers', inc),
  searchSuppliers: (kw) => ipcRenderer.invoke('db:searchSuppliers', kw),
  createSupplier: (data) => ipcRenderer.invoke('db:createSupplier', data),
  updateSupplier: (id, data) => ipcRenderer.invoke('db:updateSupplier', id, data),

  createPurchaseOrder: (data) => ipcRenderer.invoke('db:createPurchaseOrder', data),
  receivePurchaseOrder: (id) => ipcRenderer.invoke('db:receivePurchaseOrder', id),
  recordPurchasePayment: (id, data, sid) => ipcRenderer.invoke('db:recordPurchasePayment', id, data, sid),
  voidPurchaseOrder: (id, res) => ipcRenderer.invoke('db:voidPurchaseOrder', id, res),
  getPurchaseOrderById: (id) => ipcRenderer.invoke('db:getPurchaseOrderById', id),
  getAllPurchaseOrders: (flt) => ipcRenderer.invoke('db:getAllPurchaseOrders', flt),
  getAPSummary: () => ipcRenderer.invoke('db:getAPSummary'),
  getSupplierStatement: (id) => ipcRenderer.invoke('db:getSupplierStatement', id),

  // Utilities
  adjustStock: (adjustments) => ipcRenderer.invoke('db:adjustStock', adjustments),

  // Expenses (Sprint 7)
  createExpense: (data) => ipcRenderer.invoke('db:createExpense', data),
  getAllExpenses: (limit) => ipcRenderer.invoke('db:getAllExpenses', limit),
  getExpensesByMonth: (y, m) => ipcRenderer.invoke('db:getExpensesByMonth', y, m),
  getExpensesByCategory: (cat, y, m) => ipcRenderer.invoke('db:getExpensesByCategory', cat, y, m),
  getExpenseSummaryByCategory: (y, m) => ipcRenderer.invoke('db:getExpenseSummaryByCategory', y, m),
  updateExpense: (id, data) => ipcRenderer.invoke('db:updateExpense', id, data),
  deleteExpense: (id) => ipcRenderer.invoke('db:deleteExpense', id),

  // Sessions History
  getSessionHistory: (limit) => ipcRenderer.invoke('db:getSessionHistory', limit),
});


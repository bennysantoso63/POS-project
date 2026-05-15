const { contextBridge, ipcRenderer } = require('electron');

/**
 * POS MANDIRI ENTERPRISE - CONSOLIDATED IPC BRIDGE
 * Optimized for Security and Professional Deployment
 */
contextBridge.exposeInMainWorld('api', {
    // 1. AUTH & USER MANAGEMENT
    checkSetup: () => ipcRenderer.invoke('api-check-setup'),
    setupAdmin: (data) => ipcRenderer.invoke('api-setup-admin', data),
    login: (pin) => ipcRenderer.invoke('api-login', pin),
    getUsers: () => ipcRenderer.invoke('api-get-users'),
    createUser: (data) => ipcRenderer.invoke('api-create-user', data),
    updateUser: (id, data) => ipcRenderer.invoke('api-update-user', id, data),
    deleteUser: (id) => ipcRenderer.invoke('api-delete-user', id),
    getAuditLogs: () => ipcRenderer.invoke('api-get-audit-logs'),
    generateBarcode: (text) => ipcRenderer.invoke('api-generate-barcode', text),

    // 2. MASTER DATA
    getProducts: () => ipcRenderer.invoke('api-get-products'),
    getCategories: () => ipcRenderer.invoke('api-get-categories'),
    addProduct: (data) => ipcRenderer.invoke('api-add-product', data),
    updateProduct: (id, data, userId) => ipcRenderer.invoke('api-update-product', id, data, userId),
    deleteProduct: (id) => ipcRenderer.invoke('api-delete-product', id),

    // 3. SHIFT & SESSION MANAGEMENT
    getActiveSession: () => ipcRenderer.invoke('api-get-active-session'),
    openSession: (openingCash) => ipcRenderer.invoke('api-open-session', openingCash),
    closeSession: (data) => ipcRenderer.invoke('api-close-session', data),
    getSessions: () => ipcRenderer.invoke('api-get-sessions'),

    // 4. KASIR & TRANSAKSI
    processCheckout: (txData) => ipcRenderer.invoke('api-process-checkout', txData),
    voidTransaction: (txId) => ipcRenderer.invoke('api-void-transaction', txId),
    getTransactions: (filters) => ipcRenderer.invoke('api-get-transactions', filters),
    
    // Hold Bills (Draft / Table Management)
    holdBill: (data) => ipcRenderer.invoke('api-hold-bill', data),
    getHeldBills: () => ipcRenderer.invoke('api-get-held-bills'),
    restoreBill: (id) => ipcRenderer.invoke('api-restore-bill', id),
    discardHeldBill: (id) => ipcRenderer.invoke('api-discard-held-bill', id),

    // 5. ACCOUNTS RECEIVABLE (CRM)
    getCustomers: () => ipcRenderer.invoke('api-get-customers'),
    addCustomer: (data) => ipcRenderer.invoke('api-add-customer', data),
    createReceivable: (data) => ipcRenderer.invoke('api-create-receivable', data),
    recordPayment: (data) => ipcRenderer.invoke('api-record-payment', data),

    // 6. ACCOUNTS PAYABLE (Hutang)
    getSuppliers: () => ipcRenderer.invoke('api-get-suppliers'),
    createSupplier: (data) => ipcRenderer.invoke('api-create-supplier', data),
    getPurchaseOrders: () => ipcRenderer.invoke('api-get-purchase-orders'),
    createPurchaseOrder: (data) => ipcRenderer.invoke('api-create-po', data),
    receivePurchaseOrder: (id) => ipcRenderer.invoke('api-receive-po', id),
    payPurchaseOrder: (id, data) => ipcRenderer.invoke('api-pay-po', id, data),

    // 7. F&B ENGINE (BOM & KDS)
    getKdsOrders: () => ipcRenderer.invoke('api-get-kds-orders'),
    updateKdsStatus: (id, status) => ipcRenderer.invoke('api-update-kds-status', id, status),
    getIngredients: () => ipcRenderer.invoke('api-get-ingredients'),
    recordSpoilage: (data) => ipcRenderer.invoke('api-record-spoilage', data),
    getSpoilages: () => ipcRenderer.invoke('api-get-spoilages'),
    getRecipe: (productId) => ipcRenderer.invoke('api-get-recipe', productId),
    saveRecipe: (productId, items) => ipcRenderer.invoke('api-save-recipe', productId, items),

    // 8. SETTINGS & HARDWARE
    getSettings: () => ipcRenderer.invoke('api-get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('api-save-settings', settings),
    printReceipt: (data) => ipcRenderer.invoke('api-print-receipt', data),
    
    // Inventory
    adjustStock: (adjustments) => ipcRenderer.invoke('api-adjust-stock', adjustments),
    getStockMovements: () => ipcRenderer.invoke('api-get-stock-movements'),
    
    // Expenses
    createExpense: (data) => ipcRenderer.invoke('api-create-expense', data),
    getExpenses: () => ipcRenderer.invoke('api-get-expenses'),

    // Cloud Sync
    syncCloud: (options) => ipcRenderer.invoke('api-sync-cloud', options),

    // Sprint 13 - Intelligence Engine (Ling-Ling v3.5)
    getIntelligenceRFM: () => ipcRenderer.invoke('api-intelligence-rfm'),
    getIntelligenceBurnRate: () => ipcRenderer.invoke('api-intelligence-burnrate'),
    getIntelligenceApriori: () => ipcRenderer.invoke('api-intelligence-apriori'),
    getSembahyangApriori: () => ipcRenderer.invoke('api-intelligence-apriori'), // Alias for compatibility
    getBigBang: () => ipcRenderer.invoke('api-intelligence-bigbang'),
    getBundlingSuggestion: (id) => ipcRenderer.invoke('api-get-bundling-suggestion', id),
    askLingLing: (question) => ipcRenderer.invoke('api-intelligence-chat', question),
    getDashboardStats: (filters) => ipcRenderer.invoke('api-get-dashboard-stats', filters),
    quitApp: () => ipcRenderer.send('quit-app'),
    
    // Tambahan Namespace khusus Modul Sembahyang (Task 4: IPC Bridge)
    sembahyang: {
      getBundlingSuggestion: (itemId) => ipcRenderer.invoke('sembahyang:getBundlingSuggestion', itemId),
      closeBlindSession: (sessionId, inputCash) => ipcRenderer.invoke('sembahyang:closeBlindSession', sessionId, inputCash)
    },
    // Tambahan Namespace khusus Modul Sync (Task 4: IPC Bridge)
    sync: {
      dryRunExcel: (filePath) => ipcRenderer.invoke('sync:dryRunExcel', filePath),
      commitExcel: (validDataArray, platformName) => ipcRenderer.invoke('sync:commitExcel', validDataArray, platformName),
      googleLogin: () => ipcRenderer.invoke('sync:googleLogin'),
      syncCustomersToGoogle: () => ipcRenderer.invoke('sync:syncCustomersToGoogle'),
      uploadToDrive: (filePath, fileName) => ipcRenderer.invoke('sync:uploadToDrive', filePath, fileName),
      getDriveSyncStatus: () => ipcRenderer.invoke('sync:getDriveSyncStatus'),
      toggleDriveSyncStatus: (isEnabled) => ipcRenderer.invoke('sync:toggleDriveSyncStatus', isEnabled)
    }
});

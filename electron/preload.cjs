const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // AUTH & SETUP
    checkSetup: () => ipcRenderer.invoke('api-check-setup'),
    setupAdmin: (data) => ipcRenderer.invoke('api-setup-admin', data),
    login: (pin) => ipcRenderer.invoke('api-login', pin),

    getUsers: () => ipcRenderer.invoke('api-get-users'),

    // MASTER DATA (Standardized)
    getProducts: () => ipcRenderer.invoke('api-get-products'),
    addProduct: (data) => ipcRenderer.invoke('api-add-product', data),
    updateProduct: (id, data, userId) => ipcRenderer.invoke('api-update-product', id, data, userId),
    deleteProduct: (id) => ipcRenderer.invoke('api-delete-product', id),
    getCategories: () => ipcRenderer.invoke('api-get-categories'),
    getCustomers: () => ipcRenderer.invoke('api-get-customers'),
    addCustomer: (data) => ipcRenderer.invoke('api-add-customer', data),
    getSuppliers: () => ipcRenderer.invoke('api-get-suppliers'),

    // PURCHASING
    getPurchaseOrders: (filters) => ipcRenderer.invoke('api-get-purchase-orders', filters),
    createPO: (data) => ipcRenderer.invoke('api-create-po', data),
    receivePO: (id) => ipcRenderer.invoke('api-receive-po', id),
    payPO: (id, amount, sessionId) => ipcRenderer.invoke('api-pay-po', id, amount, sessionId),

    // EXPENSES, RECEIVABLES & MOVEMENTS
    recordExpense: (data) => ipcRenderer.invoke('api-record-expense', data),
    recordPayment: (id, data, sessionId) => ipcRenderer.invoke('api-record-payment', id, data, sessionId),
    getMovements: (productId) => ipcRenderer.invoke('api-get-movements', productId),
    applyAdjustments: (items, userId) => ipcRenderer.invoke('api-apply-adjustments', items, userId),

    // TRANSAKSI & HISTORY
    processCheckout: (data) => ipcRenderer.invoke('api-process-checkout', data),
    getTransactions: (filters) => ipcRenderer.invoke('api-get-transactions', filters),
    voidTransaction: (id, sid) => ipcRenderer.invoke('api-void-transaction', id, sid),
    holdBill: (data) => ipcRenderer.invoke('api-hold-bill', data),
    getHeldBills: () => ipcRenderer.invoke('api-get-held-bills'),
    restoreBill: (id) => ipcRenderer.invoke('api-restore-bill', id),
    deleteHeldBill: (id) => ipcRenderer.invoke('api-delete-held-bill', id),

    // SESSIONS
    getActiveSession: () => ipcRenderer.invoke('api-get-active-session'),
    openSession: (cash) => ipcRenderer.invoke('api-open-session', cash),
    closeSession: (data) => ipcRenderer.invoke('api-close-session', data),
    getSessions: () => ipcRenderer.invoke('api-get-sessions'),

    // INTELLIGENCE (Namespace Unified)
    intelligence: {
      getRFM: () => ipcRenderer.invoke('api-intelligence-rfm'),
      getApriori: () => ipcRenderer.invoke('api-intelligence-apriori'),
      getBurnRate: () => ipcRenderer.invoke('api-intelligence-burnrate'),
      getBigBang: () => ipcRenderer.invoke('api-intelligence-bigbang'),
      chat: (q) => ipcRenderer.invoke('api-intelligence-chat', q),
      recalculate: () => ipcRenderer.invoke('api-intelligence-recalculate')
    },

    // SEMBAHYANG & DS ENGINE
    sembahyang: {
      getBundlingSuggestion: (itemId) => ipcRenderer.invoke('sembahyang:getBundlingSuggestion', itemId),
      closeBlindSession: (sessionId, inputCash) => ipcRenderer.invoke('sembahyang:closeBlindSession', sessionId, inputCash),
      
      // New Sembahyang APIs
      getAnchorItems    : () => ipcRenderer.invoke('sembahyang:get-anchor-items'),
      getLunarDate      : () => ipcRenderer.invoke('sembahyang:get-lunar-date'),
      getCreditScore    : (id)  => ipcRenderer.invoke('sembahyang:get-credit-score', id),
      getSeasonalAlerts : () => ipcRenderer.invoke('sembahyang:get-seasonal-alerts'),
      getVoidAnomaly    : (sid) => ipcRenderer.invoke('sembahyang:get-void-anomaly', sid),
      getBurnrateAlerts : () => ipcRenderer.invoke('sembahyang:get-burnrate-alerts'),
      getBundling       : (pid) => ipcRenderer.invoke('sembahyang:get-bundling', pid),
      getRFMProfile     : (cid) => ipcRenderer.invoke('sembahyang:get-rfm-profile', cid),
      getRFMSummary     : () => ipcRenderer.invoke('sembahyang:get-rfm-summary'),
      computeAll        : () => ipcRenderer.invoke('sembahyang:compute-all'),
    },
    
    ds: {
      getRecommendations: (barcodes) => ipcRenderer.invoke('ds:get-recommendations', barcodes),
      getBurnRate: (barcode) => ipcRenderer.invoke('ds:get-burn-rate', barcode)
    },

    // SYNC & EXCEL
    sync: {
      googleLogin: () => ipcRenderer.invoke('sync:googleLogin'),
      dryRunExcel: (filePath) => ipcRenderer.invoke('sync:dryRunExcel', filePath),
      commitExcel: (data, platform) => ipcRenderer.invoke('sync:commitExcel', data, platform),
      uploadToDrive: (filePath, fileName) => ipcRenderer.invoke('sync:uploadToDrive', filePath, fileName),
      getDriveSyncStatus: () => ipcRenderer.invoke('sync:getDriveSyncStatus')
    },

    // SETTINGS & HARDWARE
    getSettings: () => ipcRenderer.invoke('api-get-settings'),
    saveSettings: (data) => ipcRenderer.invoke('api-save-settings', data),
    printReceipt: (data) => ipcRenderer.invoke('api-print-receipt', data),
    
    quitApp: () => ipcRenderer.send('quit-app')
});

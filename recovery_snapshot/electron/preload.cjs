const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // AUTH
    checkSetup: () => ipcRenderer.invoke('api-check-setup'),
    setupAdmin: (data) => ipcRenderer.invoke('api-setup-admin', data),
    login: (pin) => ipcRenderer.invoke('api-login', pin),
    getUsers: () => ipcRenderer.invoke('api-get-users'),

    // MASTER DATA
    getProducts: () => ipcRenderer.invoke('api-get-products'),
    addProduct: (data) => ipcRenderer.invoke('api-add-product', data),
    updateProduct: (id, data, userId) => ipcRenderer.invoke('api-update-product', id, data, userId),
    deleteProduct: (id) => ipcRenderer.invoke('api-delete-product', id),
    getCategories: () => ipcRenderer.invoke('api-get-categories'),

    // TRANSAKSI
    processCheckout: (data) => ipcRenderer.invoke('api-process-checkout', data),
    getTransactions: (filters) => ipcRenderer.invoke('api-get-transactions', filters),
    voidTransaction: (id, sid) => ipcRenderer.invoke('api-void-transaction', id, sid),

    // SESSIONS
    getActiveSession: () => ipcRenderer.invoke('api-get-active-session'),
    openSession: (cash) => ipcRenderer.invoke('api-open-session', cash),
    closeSession: (data) => ipcRenderer.invoke('api-close-session', data),
    getSessions: () => ipcRenderer.invoke('api-get-sessions'),

    // CRM & SUPPLIERS
    getCustomers: () => ipcRenderer.invoke('api-get-customers'),
    addCustomer: (data) => ipcRenderer.invoke('api-add-customer', data),
    getSuppliers: () => ipcRenderer.invoke('api-get-suppliers'),

    // INTELLIGENCE & SEMBAHYANG
    getIntelligenceRFM: () => ipcRenderer.invoke('api-intelligence-rfm'),
    getIntelligenceApriori: () => ipcRenderer.invoke('api-intelligence-apriori'),
    getIntelligenceBurnRate: () => ipcRenderer.invoke('api-intelligence-burnrate'),
    askLingLing: (q) => ipcRenderer.invoke('api-intelligence-chat', q),
    sembahyang: {
      getBundlingSuggestion: (itemId) => ipcRenderer.invoke('sembahyang:getBundlingSuggestion', itemId),
      closeBlindSession: (sessionId, inputCash) => ipcRenderer.invoke('sembahyang:closeBlindSession', sessionId, inputCash)
    },

    // SYNC
    sync: {
      dryRunExcel: (filePath) => ipcRenderer.invoke('sync:dryRunExcel', filePath),
      commitExcel: (validDataArray, platformName) => ipcRenderer.invoke('sync:commitExcel', validDataArray, platformName),
      googleLogin: () => ipcRenderer.invoke('sync:googleLogin'),
      getDriveSyncStatus: () => ipcRenderer.invoke('sync:getDriveSyncStatus')
    },

    // SETTINGS & HARDWARE
    getSettings: () => ipcRenderer.invoke('api-get-settings'),
    saveSettings: (data) => ipcRenderer.invoke('api-save-settings', data),
    printReceipt: (data) => ipcRenderer.invoke('api-print-receipt', data),
    
    quitApp: () => ipcRenderer.send('quit-app')
});

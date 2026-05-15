/**
 * SyncService: Logika Sinkronisasi Operasional (Restored Version)
 */
export class SyncService {
    constructor(apiClient, options = {}) {
        this.client = apiClient;
        this.token = options.token || null;
    }

    // Mengembalikan headers yang dibutuhkan oleh get/post generik di Facade
    get authHeaders() {
        return {
            'X-Companion-Token': this.token,
            'Content-Type': 'application/json'
        };
    }

    async getProducts() {
        return this.client.fetchWithResilience('/api/sync/products', {
            method: 'GET',
            headers: this.authHeaders
        });
    }

    async searchProducts(query) {
        return this.client.fetchWithResilience(`/api/sync/products/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: this.authHeaders
        });
    }

    async createTransaction(items, payment, sessionId) {
        return this.client.fetchWithResilience('/api/sync/transactions', {
            method: 'POST',
            headers: this.authHeaders,
            body: JSON.stringify({ items, payment, session_id: sessionId })
        });
    }

    async getActiveSession() {
        return this.client.fetchWithResilience('/api/sync/sessions/active', {
            method: 'GET',
            headers: this.authHeaders
        });
    }

    async openSession(initialCash) {
        return this.client.fetchWithResilience('/api/sync/sessions/open', {
            method: 'POST',
            headers: this.authHeaders,
            body: JSON.stringify({ initial_cash: initialCash })
        });
    }

    async closeSession(sessionId, finalCash, notes) {
        return this.client.fetchWithResilience(`/api/sync/sessions/close/${sessionId}`, {
            method: 'POST',
            headers: this.authHeaders,
            body: JSON.stringify({ final_cash: finalCash, notes })
        });
    }

    async getSettings() {
        return this.client.fetchWithResilience('/api/sync/settings', {
            method: 'GET',
            headers: this.authHeaders
        });
    }
}

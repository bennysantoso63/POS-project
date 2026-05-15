import { StorageManager } from '../api/StorageManager';
import { BaseClient } from '../api/BaseClient';
import { AuthService } from '../services/AuthService';
import { SyncService } from '../services/SyncService';
import { Logger } from '../utils/Logger';

/**
 * LING-LING POS - COMPANION API FACADE
 * Versi Asli yang Dipulihkan (Safety Restore)
 */
export class CompanionApiClient {
    constructor() {
        this.config = null;
        this.isConnected = false;
        
        // Modules (Lazy initialized after config load)
        this.client = null;
        this.auth = null;
        this.sync = null;
    }

    async loadConfig() {
        this.config = await StorageManager.getConfig();
        if (this.config) {
            this._initializeModules();
        }
        return this.config;
    }

    async saveConfig(config) {
        this.config = config;
        await StorageManager.saveConfig(config);
        this._initializeModules();
    }

    _initializeModules() {
        const baseUrl = `http://${this.config.ip}:${this.config.port}`;
        this.client = new BaseClient(baseUrl);
        this.auth = new AuthService(this.client);
        this.sync = new SyncService(this.client, { token: this.config.token });
        Logger.info('CompanionAPI', 'Modul berhasil diinisialisasi ulang dengan konfigurasi baru.');
    }

    // --- LEGACY INTERFACE WRAPPERS ---
    
    async ping() {
        if (!this.client) return false;
        try {
            const res = await fetch(`http://${this.config.ip}:${this.config.port}/api/health`, {
                headers: { 'X-Companion-Token': this.config.token },
                signal: AbortSignal.timeout(3000)
            });
            this.isConnected = res.ok;
            return res.ok;
        } catch {
            this.isConnected = false;
            return false;
        }
    }

    async get(endpoint) {
        if (!this.client) throw new Error("Klien belum diinisialisasi");
        return this.client.fetchWithResilience(endpoint, {
            method: 'GET',
            headers: this.sync?.authHeaders || {}
        });
    }

    async post(endpoint, body) {
        if (!this.client) throw new Error("Klien belum diinisialisasi");
        return this.client.fetchWithResilience(endpoint, {
            method: 'POST',
            headers: this.sync?.authHeaders || {},
            body: JSON.stringify(body)
        });
    }

    // Auth
    async loginPin(pin) { return this.auth.loginPin(pin); }
    async loginPassword(u, p) { return this.auth.loginPassword(u, p); }

    // Products
    async getProducts() { return this.sync.getProducts(); }
    async searchProducts(k) { return this.sync.searchProducts(k); }

    // Transactions
    async createTransaction(items, pay, sid) { return this.sync.createTransaction(items, pay, sid); }

    // Sessions
    async getActiveSession() { return this.sync.getActiveSession(); }
    async openSession(cash) { return this.sync.openSession(cash); }
    async closeSession(id, cash, n) { return this.sync.closeSession(id, cash, n); }

    // Settings
    async getSettings() { return this.sync.getSettings(); }
}

export const companionApi = new CompanionApiClient();

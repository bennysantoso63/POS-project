import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StorageManager } from '../api/StorageManager';
import { BaseClient } from '../api/BaseClient';
import { AuthService } from '../services/AuthService';
import { SyncService } from '../services/SyncService';
import { Logger } from '../utils/Logger';

// 1. Inisialisasi Context
const ApiContext = createContext(null);

/**
 * ApiProvider: Composition Root untuk aplikasi mobile.
 * Di sinilah seluruh layanan dirakit (Assembled) dan didistribusikan.
 */
export const ApiProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [isReady, setIsReady] = useState(false);

    // Memuat konfigurasi awal
    useEffect(() => {
        const init = async () => {
            const savedConfig = await StorageManager.getConfig();
            setConfig(savedConfig);
            setIsReady(true);
        };
        init();
    }, []);

    /**
     * Services Memoization: Merakit ulang layanan HANYA jika konfigurasi berubah.
     * Ini menjamin stabilitas referensi instansi di komponen UI.
     */
    const services = useMemo(() => {
        if (!config || !config.ip) return { authService: null, syncService: null };

        const baseUrl = `http://${config.ip}:${config.port}`;
        const apiClient = new BaseClient(baseUrl);
        
        Logger.info('ApiProvider', `Merakit layanan untuk: ${baseUrl}`);

        return {
            authService: new AuthService(apiClient),
            syncService: new SyncService(apiClient, { token: config.token }),
            updateConfig: async (newConfig) => {
                await StorageManager.saveConfig(newConfig);
                setConfig(newConfig);
            }
        };
    }, [config]);

    if (!isReady) return null; // Menunggu inisialisasi storage

    return (
        <ApiContext.Provider value={services}>
            {children}
        </ApiContext.Provider>
    );
};

/**
 * HOOKS SPESIFIK (Interface Segregation Principle)
 * Komponen hanya mengimpor apa yang mereka butuhkan.
 */

export const useAuthService = () => {
    const context = useContext(ApiContext);
    if (!context) throw new Error("useAuthService harus digunakan di dalam ApiProvider");
    return context.authService;
};

export const useSyncService = () => {
    const context = useContext(ApiContext);
    if (!context) throw new Error("useSyncService harus digunakan di dalam ApiProvider");
    return context.syncService;
};

export const useApiConfig = () => {
    const context = useContext(ApiContext);
    if (!context) throw new Error("useApiConfig harus digunakan di dalam ApiProvider");
    return { updateConfig: context.updateConfig };
};

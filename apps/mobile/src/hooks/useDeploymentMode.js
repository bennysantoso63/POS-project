import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { companionApi } from '../adapters/companion-api';

const MODE_KEY = 'deployment_mode';

export function useDeploymentMode() {
    const [mode, setMode] = useState(null);
    // null = belum dipilih, 'standalone', 'companion'
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const saved = await AsyncStorage.getItem(MODE_KEY);
            if (saved) {
                setMode(saved);
                if (saved === 'companion') {
                    await companionApi.loadConfig();
                }
            }
            setIsLoading(false);
        }
        load();
    }, []);

    async function selectMode(newMode) {
        await AsyncStorage.setItem(MODE_KEY, newMode);
        setMode(newMode);
    }

    async function connectCompanion(config) {
        await companionApi.saveConfig(config);
        const ok = await companionApi.ping();
        if (ok) {
            await selectMode('companion');
            return { success: true };
        }
        return { success: false, error: 'Tidak bisa terhubung ke PC kasir' };
    }

    return { mode, isLoading, selectMode, connectCompanion };
}

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useDeploymentMode } from './src/hooks/useDeploymentMode';
import { initMobileDb } from './src/adapters/expo-db';

import { ApiProvider } from './src/contexts/ApiProvider';

export default function App() {
    const { mode, isLoading: modeLoading } = useDeploymentMode();
    const [currentUser, setCurrentUser] = useState(null);
    const [dbReady, setDbReady] = useState(false);

    useEffect(() => {
        async function initApp() {
            if (mode === 'standalone') {
                // Init SQLite lokal
                try {
                    initMobileDb();
                    setDbReady(true);
                } catch (e) {
                    console.error("DB Init Error:", e);
                    setDbReady(true); // Fallback to let user at least see the app
                }
            } else if (mode === 'companion') {
                // Tidak butuh SQLite lokal
                setDbReady(true);
            }
        }
        if (mode !== null) initApp();
        else setDbReady(true); // If no mode, we show selection screen
    }, [mode]);

    if (modeLoading || (mode !== null && !dbReady)) {
        return (
            <View style={{ flex: 1, backgroundColor: '#141E30', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#53D2DC" size="large" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <ApiProvider>
                <StatusBar style="light" backgroundColor="#141E30" />
                <AppNavigator
                    currentUser={currentUser}
                    deploymentMode={mode}
                    onLogin={setCurrentUser}
                    onLogout={() => setCurrentUser(null)}
                />
            </ApiProvider>
        </SafeAreaProvider>
    );
}

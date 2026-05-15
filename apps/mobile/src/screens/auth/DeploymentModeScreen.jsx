import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, TextInput,
    ActivityIndicator, Alert, StyleSheet, SafeAreaView
} from 'react-native';
import { useDeploymentMode } from '../../hooks/useDeploymentMode';

export function DeploymentModeScreen() {
    const { selectMode, connectCompanion } = useDeploymentMode();
    const [showCompanionForm, setShowCompanionForm] = useState(false);
    const [ip, setIp] = useState('');
    const [port, setPort] = useState('3001');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleCompanionConnect() {
        if (!ip || !token) {
            Alert.alert('Error', 'IP dan Token wajib diisi');
            return;
        }
        setLoading(true);
        const result = await connectCompanion({ ip, port: parseInt(port), token });
        setLoading(false);
        if (!result.success) {
            Alert.alert('Gagal', result.error);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>POS Mandiri</Text>
            <Text style={styles.subtitle}>Pilih mode operasi</Text>

            {!showCompanionForm ? (
                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => selectMode('standalone')}
                    >
                        <Text style={styles.primaryButtonText}>📱 Mandiri</Text>
                        <Text style={styles.buttonDesc}>Data tersimpan di HP ini</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setShowCompanionForm(true)}
                    >
                        <Text style={styles.secondaryButtonText}>🖥️ Hubungkan ke PC Kasir</Text>
                        <Text style={styles.buttonDescDark}>Scan QR dari aplikasi PC</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.form}>
                    <Text style={styles.formLabel}>IP Address PC Kasir</Text>
                    <TextInput
                        style={styles.input}
                        value={ip}
                        onChangeText={setIp}
                        placeholder="192.168.1.100"
                        keyboardType="numeric"
                        placeholderTextColor="#35577D"
                    />

                    <Text style={styles.formLabel}>Port (default: 3001)</Text>
                    <TextInput
                        style={styles.input}
                        value={port}
                        onChangeText={setPort}
                        keyboardType="numeric"
                        placeholderTextColor="#35577D"
                    />

                    <Text style={styles.formLabel}>Token Pairing</Text>
                    <TextInput
                        style={styles.input}
                        value={token}
                        onChangeText={setToken}
                        placeholder="Dari Settings PC → Cloud/Companion"
                        placeholderTextColor="#35577D"
                        secureTextEntry
                    />

                    {loading ? (
                        <ActivityIndicator color="#53D2DC" size="large" />
                    ) : (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleCompanionConnect}
                        >
                            <Text style={styles.primaryButtonText}>Hubungkan</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={() => setShowCompanionForm(false)}>
                        <Text style={styles.backText}>← Kembali</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container         : { flex: 1, backgroundColor: '#141E30', alignItems: 'center', justifyContent: 'center', padding: 24 },
    title             : { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
    subtitle          : { fontSize: 16, color: '#35577D', marginBottom: 40 },
    buttonGroup       : { width: '100%', gap: 16 },
    primaryButton     : { backgroundColor: '#3196E2', borderRadius: 16, padding: 20, alignItems: 'center' },
    primaryButtonText : { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    secondaryButton   : { borderWidth: 2, borderColor: '#35577D', borderRadius: 16, padding: 20, alignItems: 'center' },
    secondaryButtonText: { color: '#53D2DC', fontSize: 18, fontWeight: '800' },
    buttonDesc        : { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
    buttonDescDark    : { color: '#35577D', fontSize: 13, marginTop: 4 },
    form              : { width: '100%', gap: 12 },
    formLabel         : { color: '#53D2DC', fontSize: 13, fontWeight: '700', marginBottom: 4 },
    input             : { backgroundColor: '#1A2640', borderWidth: 1, borderColor: '#35577D', borderRadius: 12, padding: 14, color: '#FFFFFF', fontSize: 16 },
    backText          : { color: '#35577D', textAlign: 'center', marginTop: 16, fontSize: 14 },
});

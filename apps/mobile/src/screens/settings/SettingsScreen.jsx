import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Alert, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { companionApi } from '../../adapters/companion-api';
import appConfig from '../../../app.json';

export function SettingsScreen({ onLogout }) {
    const [user, setUser] = useState({ username: 'User', role: 'kasir' });
    const [mode, setMode] = useState('standalone');
    const [companionInfo, setCompanionInfo] = useState(null);
    const [storeName, setStoreName] = useState('POS Mandiri');

    useEffect(() => {
        async function load() {
            const userData = await AsyncStorage.getItem('current_user');
            if (userData) setUser(JSON.parse(userData));
            
            const savedMode = await AsyncStorage.getItem('deployment_mode');
            if (savedMode) setMode(savedMode);

            if (savedMode === 'companion') {
                const config = await companionApi.loadConfig();
                setCompanionInfo(config);
            }
            
            const savedStore = await AsyncStorage.getItem('store_name');
            if (savedStore) setStoreName(savedStore);
        }
        load();
    }, []);

    const handleLogout = () => {
        Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
            { text: "Batal", style: "cancel" },
            { text: "Keluar", onPress: onLogout, style: "destructive" }
        ]);
    };

    const handleChangeMode = async () => {
        Alert.alert("Ganti Mode", "Aplikasi akan kembali ke layar pemilihan mode.", [
            { text: "Batal", style: "cancel" },
            { text: "Lanjutkan", onPress: async () => {
                await AsyncStorage.removeItem('deployment_mode');
                // Navigation logic will handle screen switch in App.jsx
            }}
        ]);
    };

    const SettingRow = ({ label, value, onPress, showArrow = true }) => (
        <TouchableOpacity 
            style={styles.row} 
            onPress={onPress}
            disabled={!onPress}
        >
            <View>
                <Text style={styles.rowLabel}>{label}</Text>
                {value && <Text style={styles.rowValue}>{value}</Text>}
            </View>
            {showArrow && onPress && <Text style={styles.arrow}>›</Text>}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Section 1: Profil */}
            <View style={styles.profileSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.username}>{user.username}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Section 2: Deployment Mode */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>MODE OPERASI</Text>
                <View style={styles.card}>
                    <SettingRow 
                        label="Mode Saat Ini" 
                        value={mode === 'standalone' ? '📱 Mandiri (Offline)' : '🖥️ Terhubung ke PC'} 
                        onPress={handleChangeMode}
                    />
                    {mode === 'companion' && companionInfo && (
                        <SettingRow 
                            label="Koneksi PC" 
                            value={`${companionInfo.ip}:${companionInfo.port}`}
                            showArrow={false}
                        />
                    )}
                </View>
            </View>

            {/* Section 3: Toko (Owner Only) */}
            {user.role === 'owner' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PENGATURAN TOKO</Text>
                    <View style={styles.card}>
                        <SettingRow label="Nama Toko" value={storeName} onPress={() => {}} />
                        <SettingRow label="Alamat Toko" value="Pekalongan, Jawa Tengah" onPress={() => {}} />
                    </View>
                </View>
            )}

            {/* Section 4: Printer */}
            {mode === 'standalone' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PRINTER STRUK</Text>
                    <View style={styles.card}>
                        <SettingRow label="Bluetooth Printer" value="Tidak Terhubung" onPress={() => {}} />
                        <TouchableOpacity style={styles.actionLink}>
                            <Text style={styles.actionLinkText}>Cari Printer Bluetooth</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Section 5: Tentang */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>TENTANG APLIKASI</Text>
                <View style={styles.card}>
                    <SettingRow label="Versi" value={appConfig.expo.version} showArrow={false} />
                    <SettingRow label="Platform" value="Expo SDK 51" showArrow={false} />
                </View>
            </View>

            <Text style={styles.footer}>© 2026 POS Mandiri Enterprise</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141E30' },
    content: { padding: 16, paddingBottom: 40 },
    profileSection: { backgroundColor: '#1A2640', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#3196E2', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
    profileInfo: { flex: 1, marginLeft: 16 },
    username: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
    roleBadge: { backgroundColor: 'rgba(83, 210, 220, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
    roleText: { color: '#53D2DC', fontSize: 10, fontWeight: '900' },
    logoutBtn: { padding: 8 },
    logoutText: { color: '#FF826C', fontWeight: '700' },
    section: { marginBottom: 24 },
    sectionTitle: { color: '#35577D', fontSize: 12, fontWeight: '800', marginBottom: 12, marginLeft: 8, letterSpacing: 1 },
    card: { backgroundColor: '#1A2640', borderRadius: 20, overflow: 'hidden' },
    row: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#141E30' },
    rowLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    rowValue: { color: '#53D2DC', fontSize: 13, marginTop: 4, fontWeight: '600' },
    arrow: { color: '#35577D', fontSize: 20 },
    actionLink: { padding: 16, alignItems: 'center' },
    actionLinkText: { color: '#3196E2', fontWeight: '700' },
    footer: { textAlign: 'center', color: '#35577D', fontSize: 12, marginTop: 20 }
});

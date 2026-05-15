import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { mobileDbAdapter } from '../../adapters/expo-db';
import { companionApi } from '../../adapters/companion-api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function DashboardScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        omzetHariIni: 0,
        jumlahTx: 0,
        lowStockCount: 0,
        recentTx: []
    });
    const [user, setUser] = useState({ username: 'User' });

    async function loadData() {
        setLoading(true);
        const mode = await AsyncStorage.getItem('deployment_mode');
        const userData = await AsyncStorage.getItem('current_user');
        if (userData) setUser(JSON.parse(userData));

        try {
            let dashboardData;
            if (mode === 'standalone') {
                const today = new Date().toISOString().split('T')[0];
                
                const omzet = mobileDbAdapter.get(`
                    SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count 
                    FROM transactions 
                    WHERE date(created_at) = ? AND status = 'completed'
                `, [today]);

                const lowStock = mobileDbAdapter.get(`
                    SELECT COUNT(*) as count FROM products 
                    WHERE stock_pcs <= low_stock_threshold
                `);

                const recent = mobileDbAdapter.all(`
                    SELECT id, total, payment_method, created_at 
                    FROM transactions 
                    WHERE date(created_at) = ?
                    ORDER BY created_at DESC LIMIT 5
                `, [today]);

                dashboardData = {
                    omzetHariIni: omzet.total,
                    jumlahTx: omzet.count,
                    lowStockCount: lowStock.count,
                    recentTx: recent
                };
            } else {
                const res = await companionApi.get('/api/dashboard/summary');
                dashboardData = res.data;
            }
            setData(dashboardData);
        } catch (err) {
            console.error("Dashboard Load Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#53D2DC" size="large" />
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#53D2DC" />}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Selamat pagi, {user.username}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Shift Aktif</Text>
                </View>
            </View>

            <View style={styles.grid}>
                <View style={[styles.card, { borderColor: '#FFC05F' }]}>
                    <Text style={styles.cardLabel}>Omzet Hari Ini</Text>
                    <Text style={[styles.cardValue, { color: '#FFC05F' }]}>
                        Rp {data.omzetHariIni.toLocaleString()}
                    </Text>
                </View>
                <View style={[styles.card, { borderColor: '#53D2DC' }]}>
                    <Text style={styles.cardLabel}>Transaksi</Text>
                    <Text style={[styles.cardValue, { color: '#53D2DC' }]}>
                        {data.jumlahTx}
                    </Text>
                </View>
                <View style={[styles.card, { borderColor: '#FF826C' }]}>
                    <Text style={styles.cardLabel}>Stok Menipis</Text>
                    <Text style={[styles.cardValue, { color: '#FF826C' }]}>
                        {data.lowStockCount} Produk
                    </Text>
                </View>
                <View style={[styles.card, { borderColor: '#3196E2' }]}>
                    <Text style={styles.cardLabel}>Status Shift</Text>
                    <Text style={[styles.cardValue, { color: '#3196E2', fontSize: 16 }]}>Terbuka</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
                {data.recentTx.map((tx, idx) => (
                    <View key={idx} style={styles.txRow}>
                        <View>
                            <Text style={styles.txTime}>
                                {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <View style={[
                                styles.methodBadge, 
                                { backgroundColor: tx.payment_method === 'cash' ? '#FFC05F' : tx.payment_method === 'transfer' ? '#3196E2' : '#53D2DC' }
                            ]}>
                                <Text style={styles.methodText}>{tx.payment_method.toUpperCase()}</Text>
                            </View>
                        </View>
                        <Text style={styles.txTotal}>Rp {tx.total.toLocaleString()}</Text>
                    </View>
                ))}
                {data.recentTx.length === 0 && (
                    <Text style={styles.emptyText}>Belum ada transaksi hari ini</Text>
                )}
            </View>

            {['owner', 'manager'].includes(user.role) && (
                <View style={styles.section}>
                    <TouchableOpacity style={styles.primaryButton}>
                        <Text style={styles.buttonText}>Laporan Hari Ini</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>Export Data</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141E30', padding: 16 },
    loadingContainer: { flex: 1, backgroundColor: '#141E30', justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
    badge: { backgroundColor: 'rgba(83, 210, 220, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#53D2DC' },
    badgeText: { color: '#53D2DC', fontSize: 12, fontWeight: '700' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    card: { width: '48%', backgroundColor: '#1A2640', borderRadius: 16, padding: 16, borderWidth: 1 },
    cardLabel: { color: '#35577D', fontSize: 12, fontWeight: '700', marginBottom: 8 },
    cardValue: { fontSize: 18, fontWeight: '900' },
    section: { marginBottom: 24 },
    sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 12 },
    txRow: { backgroundColor: '#1A2640', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    txTime: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    txTotal: { color: '#FFC05F', fontSize: 16, fontWeight: '800' },
    methodBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
    methodText: { color: '#141E30', fontSize: 10, fontWeight: '900' },
    emptyText: { color: '#35577D', textAlign: 'center', marginTop: 20 },
    primaryButton: { backgroundColor: '#3196E2', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
    buttonText: { color: '#FFFFFF', fontWeight: '800' },
    secondaryButton: { borderWidth: 1, borderColor: '#35577D', borderRadius: 12, padding: 16, alignItems: 'center' },
    secondaryButtonText: { color: '#FFFFFF', fontWeight: '800' }
});

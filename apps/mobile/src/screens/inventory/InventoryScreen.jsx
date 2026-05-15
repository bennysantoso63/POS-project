import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, FlatList,
    TextInput, TouchableOpacity, ActivityIndicator, Modal,
    ScrollView
} from 'react-native';
import { mobileDbAdapter } from '../../adapters/expo-db';
import { companionApi } from '../../adapters/companion-api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function InventoryScreen() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [user, setUser] = useState({ role: 'kasir' });

    async function loadData() {
        setLoading(true);
        const mode = await AsyncStorage.getItem('deployment_mode');
        const userData = await AsyncStorage.getItem('current_user');
        if (userData) setUser(JSON.parse(userData));

        try {
            let data;
            if (mode === 'standalone') {
                data = mobileDbAdapter.all('SELECT * FROM products ORDER BY name ASC');
            } else {
                const res = await companionApi.get('/api/products');
                data = res.data || res; // Handle different API response formats
            }
            setProducts(data);
            setFilteredProducts(data);
        } catch (err) {
            console.error("Inventory Load Error:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
        );
        setFilteredProducts(filtered);
    }, [search, products]);

    const renderProduct = ({ item }) => {
        const isLowStock = item.stock_pcs <= item.low_stock_threshold;
        return (
            <TouchableOpacity 
                style={styles.itemRow}
                onPress={() => setSelectedProduct(item)}
            >
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
                </View>
                <View style={styles.itemMeta}>
                    <Text style={styles.itemPrice}>Rp {item.price_retail.toLocaleString()}</Text>
                    <View style={[styles.stockBadge, { backgroundColor: isLowStock ? 'rgba(255, 130, 108, 0.2)' : 'rgba(83, 210, 220, 0.2)' }]}>
                        <Text style={[styles.stockText, { color: isLowStock ? '#FF826C' : '#53D2DC' }]}>
                            {item.stock_pcs} pcs
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Cari produk atau SKU..."
                        placeholderTextColor="#35577D"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                {['owner', 'manager'].includes(user.role) && (
                    <TouchableOpacity style={styles.addButton}>
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#53D2DC" size="large" />
                </View>
            ) : (
                <FlatList 
                    data={filteredProducts}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Produk tidak ditemukan</Text>}
                />
            )}

            {/* Product Detail Modal (Bottom Sheet Style) */}
            <Modal
                visible={!!selectedProduct}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedProduct(null)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity 
                        style={styles.modalBlur} 
                        onPress={() => setSelectedProduct(null)} 
                    />
                    <View style={styles.sheet}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetHandle} />
                        </View>
                        {selectedProduct && (
                            <ScrollView style={styles.sheetContent}>
                                <Text style={styles.sheetName}>{selectedProduct.name}</Text>
                                <Text style={styles.sheetSku}>SKU: {selectedProduct.sku || '-'}</Text>
                                
                                <View style={styles.detailGrid}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Harga Jual</Text>
                                        <Text style={styles.detailValue}>Rp {selectedProduct.price_retail.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Stok Saat Ini</Text>
                                        <Text style={[styles.detailValue, { color: selectedProduct.stock_pcs <= selectedProduct.low_stock_threshold ? '#FF826C' : '#53D2DC' }]}>
                                            {selectedProduct.stock_pcs} pcs
                                        </Text>
                                    </View>
                                </View>

                                {['owner', 'manager'].includes(user.role) && (
                                    <View style={styles.actionGroup}>
                                        <TouchableOpacity style={styles.editButton}>
                                            <Text style={styles.buttonText}>Edit Produk</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.adjustButton}>
                                            <Text style={styles.buttonText}>Adjust Stok</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141E30' },
    header: { padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
    searchContainer: { flex: 1 },
    searchInput: { backgroundColor: '#1A2640', borderRadius: 12, padding: 12, color: '#FFFFFF', borderWidth: 1, borderColor: '#35577D' },
    addButton: { width: 48, height: 48, backgroundColor: '#3196E2', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    itemRow: { backgroundColor: '#1A2640', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderWidth: 1, borderColor: 'transparent' },
    itemName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 4 },
    itemSku: { color: '#35577D', fontSize: 12, fontWeight: '600' },
    itemMeta: { alignItems: 'flex-end' },
    itemPrice: { color: '#FFC05F', fontSize: 16, fontWeight: '900', marginBottom: 6 },
    stockBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    stockText: { fontSize: 11, fontWeight: '800' },
    emptyText: { color: '#35577D', textAlign: 'center', marginTop: 40 },
    
    // Modal / Sheet Styles
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBlur: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
    sheet: { backgroundColor: '#1A2640', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: '80%' },
    sheetHeader: { alignItems: 'center', padding: 12 },
    sheetHandle: { width: 40, height: 4, backgroundColor: '#35577D', borderRadius: 2 },
    sheetContent: { padding: 24 },
    sheetName: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginBottom: 4 },
    sheetSku: { color: '#53D2DC', fontSize: 14, fontWeight: '700', marginBottom: 24 },
    detailGrid: { flexDirection: 'row', gap: 20, marginBottom: 32 },
    detailItem: { flex: 1 },
    detailLabel: { color: '#35577D', fontSize: 12, fontWeight: '700', marginBottom: 8 },
    detailValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    actionGroup: { gap: 12 },
    editButton: { backgroundColor: '#3196E2', borderRadius: 16, padding: 18, alignItems: 'center' },
    adjustButton: { borderWidth: 1, borderColor: '#35577D', borderRadius: 16, padding: 18, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontWeight: '800' }
});

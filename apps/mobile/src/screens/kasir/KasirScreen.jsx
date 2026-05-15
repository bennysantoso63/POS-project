import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
    FlatList, TextInput, ScrollView, Dimensions, Alert
} from 'react-native';
import { BarcodeScanner } from '../../components/kasir/BarcodeScanner';

const { width } = Dimensions.get('window');

export function KasirScreen() {
    const [activeTab, setActiveTab] = useState('katalog'); // 'katalog' or 'cart'
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Semua');
    const [showScanner, setShowScanner] = useState(false);

    const handleBarcodeScan = (data) => {
        const product = products.find(p => p.sku === data || p.barcode === data);
        if (product) {
            // addToCart(product) - logic placeholder
            Alert.alert("Produk Ditemukan", `Berhasil menambahkan ${product.name}`);
        } else {
            Alert.alert("Gagal", `Produk dengan barcode ${data} tidak ditemukan`);
        }
    };

    // Dummy data
    const products = [
        { id: 1, name: 'Dupa Wangi Premium', price: 25000, stock: 100, category: 'Dupa' },
        { id: 2, name: 'Lilin Merah Besar', price: 45000, stock: 50, category: 'Lilin' },
        { id: 3, name: 'Minyak Sembahyang', price: 32000, stock: 20, category: 'Minyak' },
        { id: 4, name: 'Kertas Kim', price: 15000, stock: 200, category: 'Kertas' },
    ];

    const categories = ['Semua', 'Dupa', 'Lilin', 'Minyak', 'Kertas'];

    const renderProduct = ({ item }) => (
        <TouchableOpacity style={styles.productCard}>
            <View style={styles.stockBadge}>
                <Text style={styles.stockText}>{item.stock} pcs</Text>
            </View>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPrice}>Rp {item.price.toLocaleString()}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Tabs */}
            <View style={styles.tabHeader}>
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'katalog' && styles.tabActive]} 
                    onPress={() => setActiveTab('katalog')}
                >
                    <Text style={[styles.tabText, activeTab === 'katalog' && styles.tabTextActive]}>KATALOG</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'cart' && styles.tabActive]} 
                    onPress={() => setActiveTab('cart')}
                >
                    <Text style={[styles.tabText, activeTab === 'cart' && styles.tabTextActive]}>KERANJANG (0)</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'katalog' ? (
                <View style={styles.content}>
                    <View style={styles.searchContainer}>
                        <TextInput 
                            style={styles.searchInput} 
                            placeholder="Cari produk atau scan..." 
                            placeholderTextColor="#35577D"
                            value={search}
                            onChangeText={setSearch}
                        />
                        <TouchableOpacity 
                            style={styles.scanButton}
                            onPress={() => setShowScanner(true)}
                        >
                            <Text>📷</Text>
                        </TouchableOpacity>
                    </View>

                    {showScanner && (
                        <BarcodeScanner 
                            onScan={handleBarcodeScan}
                            onClose={() => setShowScanner(false)}
                        />
                    )}

                    <View style={styles.categoryContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {categories.map(c => (
                                <TouchableOpacity 
                                    key={c} 
                                    style={[styles.categoryPill, category === c && styles.categoryPillActive]}
                                    onPress={() => setCategory(c)}
                                >
                                    <Text style={[styles.categoryText, category === c && styles.categoryTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <FlatList 
                        data={products}
                        renderItem={renderProduct}
                        keyExtractor={item => item.id.toString()}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.emptyCart}>
                        <Text style={styles.emptyText}>Keranjang masih kosong</Text>
                    </View>
                    
                    <View style={styles.footer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalAmount}>Rp 0</Text>
                        </View>
                        <TouchableOpacity style={styles.checkoutButton} disabled>
                            <Text style={styles.checkoutText}>BAYAR SEKARANG</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141E30' },
    tabHeader: { flexDirection: 'row', backgroundColor: '#1A2640', borderBottomWidth: 1, borderBottomColor: '#35577D' },
    tabItem: { flex: 1, padding: 15, alignItems: 'center' },
    tabActive: { borderBottomWidth: 3, borderBottomColor: '#53D2DC' },
    tabText: { color: '#35577D', fontWeight: '800', fontSize: 12 },
    tabTextActive: { color: '#53D2DC' },
    content: { flex: 1 },
    searchContainer: { flexDirection: 'row', padding: 15, gap: 10 },
    searchInput: { flex: 1, backgroundColor: '#1A2640', borderRadius: 12, padding: 12, color: '#FFFFFF', borderLight: 1, borderColor: '#35577D' },
    scanButton: { width: 50, height: 50, backgroundColor: '#3196E2', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    categoryContainer: { paddingLeft: 15, marginBottom: 15 },
    categoryPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1A2640', marginRight: 10, borderWidth: 1, borderColor: '#35577D' },
    categoryPillActive: { backgroundColor: '#3196E2', borderColor: '#3196E2' },
    categoryText: { color: '#35577D', fontSize: 12, fontWeight: '700' },
    categoryTextActive: { color: '#FFFFFF' },
    listContent: { padding: 10 },
    row: { justifyContent: 'space-between' },
    productCard: { backgroundColor: '#1A2640', width: (width - 30) / 2, borderRadius: 20, padding: 15, marginBottom: 15, position: 'relative' },
    stockBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#141E30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    stockText: { color: '#53D2DC', fontSize: 10, fontWeight: '800' },
    productName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 8 },
    productPrice: { color: '#FFC05F', fontSize: 16, fontWeight: '900' },
    emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: '#35577D', fontSize: 16, fontWeight: '700' },
    footer: { backgroundColor: '#1A2640', padding: 20, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    totalLabel: { color: '#35577D', fontWeight: '800' },
    totalAmount: { color: '#FFC05F', fontSize: 24, fontWeight: '900' },
    checkoutButton: { backgroundColor: '#3196E2', padding: 20, borderRadius: 20, alignItems: 'center', opacity: 0.5 },
    checkoutText: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 1 }
});

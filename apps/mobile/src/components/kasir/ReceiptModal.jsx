import React, { useState } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator
} from 'react-native';
import { printReceipt } from '../../adapters/bluetooth-print';

export function ReceiptModal({ visible, transaction, storeConfig, onClose }) {
    const [printing, setPrinting] = useState(false);

    const handlePrint = async () => {
        setPrinting(true);
        const res = await printReceipt(transaction, storeConfig);
        setPrinting(false);
        if (!res.success) {
            alert(res.error);
        }
    };

    if (!transaction) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.successHeader}>
                        <View style={styles.checkmarkCircle}>
                            <Text style={styles.checkmark}>✓</Text>
                        </View>
                        <Text style={styles.successTitle}>Transaksi Berhasil!</Text>
                    </View>

                    <ScrollView style={styles.receiptCard}>
                        <Text style={styles.storeName}>{storeConfig.store_name || 'POS Mandiri'}</Text>
                        <Text style={styles.storeInfo}>{storeConfig.store_address || '-'}</Text>
                        <View style={styles.divider} />
                        
                        {transaction.items?.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
                                <View style={styles.itemMain}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemDetail}>{item.qty} x Rp {item.unit_price.toLocaleString()}</Text>
                                </View>
                                <Text style={styles.itemTotal}>Rp {(item.qty * item.unit_price).toLocaleString()}</Text>
                            </View>
                        ))}

                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalValue}>Rp {transaction.total.toLocaleString()}</Text>
                        </View>
                        {transaction.payment_method === 'cash' && (
                            <>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Bayar</Text>
                                    <Text style={styles.summaryValue}>Rp {transaction.amount_paid.toLocaleString()}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Kembali</Text>
                                    <Text style={styles.summaryValue}>Rp {transaction.change_amount.toLocaleString()}</Text>
                                </View>
                            </>
                        )}
                        <Text style={styles.footerText}>Terima kasih telah berbelanja!</Text>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={styles.printBtn} 
                            onPress={handlePrint}
                            disabled={printing}
                        >
                            {printing ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.printBtnText}>🖨️ Cetak Nota</Text>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>Selesai</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    container: { backgroundColor: '#141E30', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
    successHeader: { alignItems: 'center', marginBottom: 24 },
    checkmarkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(83, 210, 220, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    checkmark: { color: '#53D2DC', fontSize: 32, fontWeight: '900' },
    successTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    receiptCard: { backgroundColor: '#1A2640', borderRadius: 20, padding: 20 },
    storeName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
    storeInfo: { color: '#35577D', fontSize: 12, textAlign: 'center', marginBottom: 16 },
    divider: { height: 1, backgroundColor: '#141E30', marginVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#35577D' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    itemMain: { flex: 1 },
    itemName: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    itemDetail: { color: '#35577D', fontSize: 12, marginTop: 2 },
    itemTotal: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    totalLabel: { color: '#FFC05F', fontSize: 16, fontWeight: '900' },
    totalValue: { color: '#FFC05F', fontSize: 20, fontWeight: '900' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: '#35577D', fontSize: 13, fontWeight: '600' },
    summaryValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    footerText: { color: '#35577D', textAlign: 'center', marginTop: 24, fontSize: 12, fontStyle: 'italic' },
    footer: { marginTop: 24, gap: 12 },
    printBtn: { backgroundColor: '#3196E2', borderRadius: 16, padding: 18, alignItems: 'center' },
    printBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    closeBtn: { borderWidth: 1, borderColor: '#35577D', borderRadius: 16, padding: 18, alignItems: 'center' },
    closeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});

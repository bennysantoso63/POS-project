import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export function BarcodeScanner({ onScan, onClose }) {
    const [permission, requestPermission] = useCameraPermissions();

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible animationType="fade">
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>Kami butuh izin kamera untuk scan barcode</Text>
                    <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                        <Text style={styles.btnText}>Beri Izin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeText}>Tutup</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible animationType="slide">
            <View style={styles.container}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    barcodeScannerSettings={{
                        barcodeTypes: ['code128', 'qr', 'ean13', 'ean8', 'code39'],
                    }}
                    onBarcodeScanned={({ data }) => {
                        onScan(data);
                        onClose();
                    }}
                />
                
                {/* Overlay UI */}
                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Scan Barcode</Text>
                        <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.scannerArea}>
                        <View style={styles.finder}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                        <Text style={styles.hint}>Arahkan kamera ke barcode produk</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    permissionContainer: { flex: 1, backgroundColor: '#141E30', justifyContent: 'center', alignItems: 'center', padding: 40 },
    permissionText: { color: '#FFFFFF', textAlign: 'center', fontSize: 16, marginBottom: 24, fontWeight: '600' },
    permissionBtn: { backgroundColor: '#3196E2', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
    btnText: { color: '#FFFFFF', fontWeight: '800' },
    closeBtn: { marginTop: 20 },
    closeText: { color: '#35577D', fontWeight: '700' },
    
    overlay: { flex: 1, justifyContent: 'space-between' },
    header: { padding: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(20, 30, 48, 0.5)' },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    closeIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    closeIcon: { color: '#FFFFFF', fontSize: 20 },
    
    scannerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    finder: { width: 280, height: 200, position: 'relative' },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: '#53D2DC', borderWidth: 4 },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    hint: { color: '#FFFFFF', marginTop: 40, fontSize: 14, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }
});

// Gunakan: react-native-thermal-receipt-printer-image-qr
// Install: expo install react-native-thermal-receipt-printer-image-qr

import ThermalPrinter from 'react-native-thermal-receipt-printer-image-qr';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRINTER_KEY = 'paired_printer_address';

export async function scanBluetoothPrinters() {
    try {
        const devices = await ThermalPrinter.getBluetoothDeviceList();
        return devices; // array { deviceName, address }
    } catch (err) {
        console.error("BT Scan Error:", err);
        return [];
    }
}

export async function savePrinterAddress(address) {
    await AsyncStorage.setItem(PRINTER_KEY, address);
}

export async function getPrinterAddress() {
    return AsyncStorage.getItem(PRINTER_KEY);
}

export async function printReceipt(transaction, storeConfig) {
    const address = await getPrinterAddress();
    if (!address) return { success: false, error: 'Printer belum dikonfigurasi' };

    try {
        await ThermalPrinter.connectBluetoothPrinter(address);

        const commands = buildReceiptText(transaction, storeConfig);
        await ThermalPrinter.printBluetooth(commands);

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function buildReceiptText(transaction, storeConfig) {
    // Format teks nota — sama dengan ESC/POS desktop tapi versi teks
    const lines = [];
    const width = 32; // Standard 58mm printer

    const center = (text) => {
        const pad = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(pad) + text;
    };

    lines.push(center(storeConfig.store_name || 'POS MANDIRI'));
    if (storeConfig.store_address) lines.push(center(storeConfig.store_address));
    lines.push('-'.repeat(width));
    lines.push(`No: ${transaction.id}`);
    lines.push(`Tgl: ${new Date(transaction.created_at).toLocaleString('id-ID')}`);
    lines.push('-'.repeat(width));

    transaction.items?.forEach(item => {
        lines.push(item.name.substring(0, width));
        const qty = `${item.qty} x ${item.unit_price.toLocaleString('id-ID')}`;
        const total = (item.qty * item.unit_price).toLocaleString('id-ID');
        lines.push(`  ${qty.padEnd(width - total.length - 2)}${total}`);
    });

    lines.push('-'.repeat(width));
    lines.push(`TOTAL: ${transaction.total.toLocaleString('id-ID').padStart(width - 7)}`);
    if (transaction.payment_method === 'cash') {
        lines.push(`BAYAR: ${transaction.amount_paid.toLocaleString('id-ID').padStart(width - 7)}`);
        lines.push(`KEMBALI: ${transaction.change_amount.toLocaleString('id-ID').padStart(width - 9)}`);
    }
    lines.push('-'.repeat(width));
    lines.push(center('Terima kasih!'));
    lines.push('\n\n\n');

    return lines.join('\n');
}

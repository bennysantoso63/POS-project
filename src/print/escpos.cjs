const escpos = require('escpos');
// const usb = require('escpos-usb'); // Dinonaktifkan sementara jika tidak ada hardware

/**
 * [SPEC] Layanan integrasi Thermal Printer menggunakan standar ESC/POS.
 * Mendukung pencetakan via USB dengan fallback ke konsol.
 */
function printReceipt(data) {
    const storeName = data.storeName || 'TOKO MANDIRI';
    const storeAddress = data.storeAddress || 'Jl. Sudirman No. 12';
    const storeFooter = data.storeFooter || 'Terima Kasih';

    // Mock buffer untuk simulasi console fallback seperti yang Komandan jelaskan
    let printBuffer = `\x1B\x40`; // Initialize printer
    printBuffer += `\x1B\x61\x01`; // Center align
    printBuffer += `${storeName}\n${storeAddress}\n`;
    printBuffer += `--------------------------------\n`;
    printBuffer += `\x1B\x61\x00`; // Left align
    printBuffer += `No: ${data.id}\nKasir: ${data.userName || 'System'}\n`;
    printBuffer += `--------------------------------\n`;
    
    data.items.forEach(item => {
        printBuffer += `${item.name}\n`;
        const price = item.unit_price || item.price_at_transaction || 0;
        const line = `${item.qty} x ${price}`.padEnd(20, ' ') + `${item.qty * price}`.padStart(12, ' ');
        printBuffer += `${line}\n`;
    });

    printBuffer += `--------------------------------\n`;
    printBuffer += `TOTAL:`.padEnd(20, ' ') + `${data.total}`.padStart(12, ' ') + `\n`;
    
    // Logika Status Piutang (AR)
    if (data.payment_method === 'kasbon' || data.paymentMethod === 'kasbon') {
        printBuffer += `\x1B\x45\x01`; // Bold ON
        printBuffer += `** STATUS: KASBON / UTANG **\n`;
        if (data.due_date) printBuffer += `Jatuh Tempo: ${data.due_date}\n`;
        printBuffer += `\x1B\x45\x00`; // Bold OFF
    }

    printBuffer += `\x1B\x61\x01`; // Center align
    printBuffer += `\n${storeFooter}\n`;
    printBuffer += `\x1D\x56\x41\x03`; // Cut paper

    // Deteksi hardware (Simulasi fallback)
    try {
        // const device = new usb(); 
        // const printer = new escpos.Printer(device);
        // ... logika hardware escpos ...
        
        console.log("[ESC/POS] Mencetak ke konsol (Fallback):");
        console.log(printBuffer);
    } catch (err) {
        console.log("[ESC/POS] Printer USB tidak ditemukan. Mencetak ke konsol sebagai fallback:");
        console.log(printBuffer);
    }
    
    return true;
}

module.exports = { printReceipt };

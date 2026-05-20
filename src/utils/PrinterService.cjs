const escpos = require('escpos');
const fs = require('fs');

// ─────────────────────────────────────────────────────────────
// SerialDevice — Node fs built-in, tanpa npm package tambahan
// Windows: akses COM port via \\.\COM3
// Linux/Mac: akses via /dev/ttyUSB0 dst.
// ─────────────────────────────────────────────────────────────
class SerialDevice {
    constructor(port) {
        this.port = port || 'COM3';
        this.stream = null;
    }

    open(callback) {
        try {
            const portPath = process.platform === 'win32'
                ? `\\\\.\\${this.port}`
                : this.port;
            this.stream = fs.createWriteStream(portPath, { flags: 'w' });
            this.stream.once('error', (err) => {
                this.stream = null;
                callback(err);
            });
            this.stream.once('open', () => callback(null));
        } catch (err) {
            this.stream = null;
            callback(err);
        }
    }

    write(data, callback) {
        if (!this.stream) {
            if (callback) callback(new Error('Serial port not open'));
            return;
        }
        this.stream.write(data, callback);
    }

    close(callback) {
        if (!this.stream) {
            if (callback) callback();
            return;
        }
        this.stream.end(callback);
        this.stream = null;
    }
}

// Baca COM port dari DB settings, fallback ke COM3
const getComPortFromDb = () => {
    try {
        const db = require('../db/db.cjs');
        const row = db.prepare("SELECT value FROM settings WHERE key = 'printer_com_port'").get();
        return row?.value || 'COM3';
    } catch (e) {
        console.warn('[PrinterService] Gagal baca settings DB, fallback COM3:', e.message);
        return 'COM3';
    }
};

const printReceipt = async (txData, settings) => {
    return new Promise((resolve) => {
        try {
            const comPort = settings?.printer_com_port || getComPortFromDb();
            const device = new SerialDevice(comPort);
            const options = { encoding: "GB18030" /* standard for many printers */ };
            const printer = new escpos.Printer(device, options);

            device.open(function (error) {
                if (error) {
                    console.error('Printer Error:', error);
                    return resolve({
                        success: false,
                        error: `Serial printer tidak terdeteksi di ${comPort}. Cek COM port di Settings.`
                    });
                }

                printer
                    .font('a')
                    .align('ct')
                    .style('bu')
                    .size(1, 1)
                    .text(settings?.name || 'LING-LING POS')
                    .size(0, 0)
                    .text(settings?.slogan || 'Your Trusted Business Partner')
                    .text(settings?.address || '')
                    .text(settings?.phone || '')
                    .text('--------------------------------')
                    .align('lt')
                    .text(`Date: ${new Date().toLocaleString()}`)
                    .text(`Cashier: ${txData.cashierName || 'System'}`)
                    .text(`TX ID: ${txData.txId || 'N/A'}`)
                    .text('--------------------------------');

                txData.items.forEach(item => {
                    printer.text(`${item.name}`);
                    printer.tableCustom([
                        { text: `${item.qty} x ${item.price_at_transaction}`, align: 'LEFT', width: 0.5 },
                        { text: (item.qty * item.price_at_transaction).toString(), align: 'RIGHT', width: 0.5 }
                    ]);
                });

                printer
                    .text('--------------------------------')
                    .align('rt')
                    .text(`SUBTOTAL: ${txData.subtotal}`)
                    .text(`DISCOUNT: -${txData.discount}`)
                    .text(`TAX: +${txData.tax}`)
                    .size(1, 1)
                    .text(`TOTAL: ${txData.total}`)
                    .size(0, 0)
                    .text('--------------------------------')
                    .text(`PAYMENT: ${txData.payment_method}`)
                    .text(`PAID: ${txData.paid_amount}`)
                    .text(`CHANGE: ${txData.change_amount}`)
                    .align('ct')
                    .text(' ')
                    .text(settings?.receiptFooter || 'THANK YOU FOR YOUR PATRONAGE')
                    .text(' ')
                    .cut()
                    .close();

                resolve({ success: true });
            });
        } catch (err) {
            console.error('Print Execution Error:', err);
            resolve({ success: false, error: err.message });
        }
    });
};

module.exports = { printReceipt };

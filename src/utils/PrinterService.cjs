const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const printReceipt = async (txData, settings) => {
    return new Promise((resolve) => {
        try {
            const device = new escpos.USB();
            const options = { encoding: "GB18030" /* standard for many printers */ };
            const printer = new escpos.Printer(device, options);

            device.open(function (error) {
                if (error) {
                    console.error('Printer Error:', error);
                    return resolve({ success: false, error: 'Thermal Printer not detected or busy.' });
                }

                printer
                    .font('a')
                    .align('ct')
                    .style('bu')
                    .size(1, 1)
                    .text(settings.name || 'LING-LING POS')
                    .size(0, 0)
                    .text(settings.slogan || 'Your Trusted Business Partner')
                    .text(settings.address || '')
                    .text(settings.phone || '')
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
                    .text(settings.receiptFooter || 'THANK YOU FOR YOUR PATRONAGE')
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

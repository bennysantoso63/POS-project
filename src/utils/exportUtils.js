import * as XLSX from 'xlsx';

/**
 * LING-LING POS - EXPORT UTILITIES
 * Centralized logic for Excel/CSV generation
 */

export const exportTransactionsToExcel = (transactions, filterName) => {
    if (!transactions || transactions.length === 0) return false;

    const toLocalDateString = (dateInput) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return "";
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    try {
        const dataToExport = transactions.map(tx => ({
            "ID TRANSAKSI": tx.id,
            "TANGGAL": toLocalDateString(tx.created_at || tx.date),
            "JAM": tx.created_at ? new Date(tx.created_at).toLocaleTimeString('id-ID') : (tx.date || '').split(',')[1] || '',
            "KASIR": tx.cashier || tx.user_name,
            "SUBTOTAL": tx.subtotal || 0,
            "DISKON": tx.discount || 0,
            "PAJAK": tx.tax || 0,
            "TOTAL": tx.total || 0,
            "METODE": tx.payment_method?.toUpperCase(),
            "STATUS": tx.status?.toUpperCase()
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");
        
        // Auto-size columns
        const maxWidths = {};
        dataToExport.forEach(row => {
            Object.keys(row).forEach(key => {
                const val = row[key] ? row[key].toString() : "";
                maxWidths[key] = Math.max(maxWidths[key] || 10, val.length + 2);
            });
        });
        worksheet["!cols"] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] }));

        XLSX.writeFile(workbook, `Laporan_LINGLING_${filterName}_${new Date().getTime()}.xlsx`);
        return true;
    } catch (err) {
        console.error("Export Error:", err);
        return false;
    }
};

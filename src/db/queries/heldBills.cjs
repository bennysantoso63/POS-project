const db = require('../db.cjs');
const log = require('electron-log');

/**
 * [KB] Hold Bill (Simpan Antrian)
 */
function holdBill(label, cartItems) {
    try {
        // Simpan dalam format JSON String agar struktur cart tetap utuh (termasuk diskon, pajak, dll)
        const result = db.prepare('INSERT INTO held_bills (label, cart_data) VALUES (?, ?)')
                 .run(label, JSON.stringify(cartItems));
        log.info(`Bill held with label: ${label}`);
        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        log.error(`holdBill failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * [KB] Ambil semua antrian
 */
function getHeldBills() {
    try {
        const rows = db.prepare('SELECT * FROM held_bills ORDER BY created_at ASC').all();
        // Parse kembali string JSON ke bentuk objek/array
        return rows.map(r => ({ ...r, cart_data: JSON.parse(r.cart_data) }));
    } catch (err) {
        log.error(`getHeldBills failed: ${err.message}`);
        return [];
    }
}

/**
 * [KB] Kembalikan antrian ke keranjang (Restore)
 */
function restoreBill(id) {
    try {
        const row = db.prepare('SELECT * FROM held_bills WHERE id = ?').get(id);
        if (!row) throw new Error('Held bill tidak ditemukan');
        
        // Hapus bill dari tabel setelah di-restore ke keranjang
        db.prepare('DELETE FROM held_bills WHERE id = ?').run(id);
        return { success: true, cart_data: JSON.parse(row.cart_data) };
    } catch (err) {
        log.error(`restoreBill failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * [KB] Buang antrian
 */
function discardHeldBill(id) {
    try {
        db.prepare('DELETE FROM held_bills WHERE id = ?').run(id);
        return { success: true };
    } catch (err) {
        log.error(`discardHeldBill failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * [KB] Bersihkan semua antrian
 */
function clearAllHeldBills() {
    try {
        db.prepare('DELETE FROM held_bills').run();
        return { success: true };
    } catch (err) {
        log.error(`clearAllHeldBills failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

module.exports = {
    holdBill,
    getHeldBills,
    restoreBill,
    discardHeldBill,
    clearAllHeldBills
};

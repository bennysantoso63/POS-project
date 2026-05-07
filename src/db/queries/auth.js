import db from '../db.js';
import bcrypt from 'bcryptjs';
import log from 'electron-log';

/**
 * [KB] Autentikasi menggunakan Bcrypt. Melindungi sistem dari pencurian database (DB dump).
 */
export async function authenticateUser(pinPlain) {
    try {
        const users = db.prepare('SELECT * FROM users WHERE is_active = 1').all();
        
        for (const user of users) {
            // Karena PIN biasanya angka pendek, kita iterasi semua user aktif (jumlah user biasanya < 10 di POS lokal)
            // Bcrypt compare is async but bcryptjs also supports sync. 
            // Here we use async for better non-blocking in main thread if possible.
            const match = await bcrypt.compare(pinPlain, user.pin_hash);
            if (match) {
                const { pin_hash, ...safeUser } = user;
                log.info(`Auth success: ${user.username} as ${user.role}`);
                return { success: true, user: safeUser };
            }
        }
        
        // Legacy fallback for development/bypass (Admin: 1234, Kasir: 1111)
        if (pinPlain === '1234' || pinPlain === '1111') {
            const role = pinPlain === '1234' ? 'admin' : 'kasir';
            const user = db.prepare('SELECT * FROM users WHERE role = ? AND is_active = 1 LIMIT 1').get(role);
            if (user) {
                const { pin_hash, ...safeUser } = user;
                log.info(`Auth success (Bypass): ${user.username}`);
                return { success: true, user: safeUser };
            }
        }

        return { success: false, error: "PIN tidak valid atau pengguna tidak ditemukan." };
    } catch (err) {
        log.error(`Auth error: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * [KB] Helper untuk mendaftarkan user baru dengan PIN ter-hash.
 */
export async function registerUser(username, pinPlain, role = 'kasir') {
    try {
        const hash = await bcrypt.hash(pinPlain, 10);
        const result = db.prepare('INSERT INTO users (username, pin_hash, role) VALUES (?, ?, ?)').run(username, hash, role);
        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        log.error(`Register user failed: ${err.message}`);
        return { success: false, message: err.message };
    }
}

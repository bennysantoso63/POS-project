const db = require('../db.cjs');
const bcrypt = require('bcryptjs');

/**
 * AUTH & USER MANAGEMENT (Sprint 9B / 11)
 * Secure authentication using Bcrypt and Role-Based Access Control (RBAC)
 */

// 1. Setup & Check
const checkNeedsSetup = () => {
    const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
    return row.count === 0;
};

// 2. User Management
const createUser = async (username, pinPlain, role) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const pinHash = await bcrypt.hash(pinPlain, salt);
        
        const stmt = db.prepare(`
            INSERT INTO users (username, pin_hash, role, is_active) 
            VALUES (?, ?, ?, 1)
        `);
        const result = stmt.run(username, pinHash, role);
        
        return { success: true, userId: result.lastInsertRowid };
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return { success: false, error: 'Username sudah digunakan!' };
        }
        return { success: false, error: err.message };
    }
};

const authenticateByPassword = async (username, passwordPlain) => {
    try {
        // O(1) - Langsung target 1 row berdasarkan username (terindeks)
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
        if (!user) return { success: false, error: 'User tidak ditemukan!' };

        const isValid = await bcrypt.compare(passwordPlain, user.pin_hash);
        if (isValid) {
            const { pin_hash, ...safeUser } = user;
            return { success: true, user: safeUser };
        }
        return { success: false, error: 'Password salah!' };
    } catch (err) {
        return { success: false, error: 'Terjadi kesalahan sistem saat login.' };
    }
};

const authenticateByPin = async (pinPlain) => {
    try {
        // Scoped O(N) - Hanya cari di role kasir/chef (biasanya < 10 orang)
        // Menghindari loop di ratusan user jika ada skala besar
        const candidates = db.prepare("SELECT * FROM users WHERE role IN ('cashier', 'chef', 'admin', 'owner') AND is_active = 1").all();
        
        for (const user of candidates) {
            if (!user.pin_hash) continue;
            const isValid = await bcrypt.compare(pinPlain, user.pin_hash);
            if (isValid) {
                const { pin_hash, ...safeUser } = user;
                return { success: true, user: safeUser };
            }
        }
        return { success: false, error: 'PIN yang Anda masukkan salah!' };
    } catch (err) {
        return { success: false, error: 'Terjadi kesalahan sistem saat login.' };
    }
};

const getAllUsers = () => {
    return db.prepare('SELECT id, username, role, is_active, created_at FROM users').all();
};

const updateUserStatus = (id, isActive) => {
    return db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
};

const changePin = async (userId, oldPin, newPin) => {
    try {
        const user = db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(userId);
        if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

        const isValid = await bcrypt.compare(oldPin, user.pin_hash);
        if (!isValid) return { success: false, error: 'PIN lama salah.' };

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPin, salt);
        
        db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(newHash, userId);
        
        logAudit(userId, 'CHANGE_PIN', `USER-${userId}`, { timestamp: new Date().toISOString() });
        return { success: true };
    } catch (err) {
        return { success: false, error: 'Gagal memperbarui PIN: ' + err.message };
    }
};

const resetUserPin = async (userId, newPin, callerUserId) => {
    try {
        // [SECURITY] Privilege Escalation Protection
        const target = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
        const caller = db.prepare('SELECT role FROM users WHERE id = ?').get(callerUserId);

        if (!target) return { success: false, error: 'Target user tidak ditemukan.' };
        if (!caller) return { success: false, error: 'Caller user tidak ditemukan.' };

        // Kasir/Manager dilarang mereset PIN Owner
        if (target.role === 'owner' && caller.role !== 'owner') {
            logAudit(callerUserId, 'SECURITY_VIOLATION', `USER-${userId}`, { msg: 'Percobaan reset PIN Owner oleh non-owner' });
            return { success: false, error: 'Izin ditolak: Anda tidak bisa mereset PIN Owner!' };
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPin, salt);
        db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(newHash, userId);
        
        logAudit(callerUserId, 'RESET_PIN', `USER-${userId}`, { target_role: target.role });
        return { success: true };
    } catch (err) {
        return { success: false, error: 'Gagal mereset PIN: ' + err.message };
    }
};

// 3. Audit Trail Logic
const logAudit = (userId, action, target, details) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO audit_log (user_id, action, target, details) 
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(userId, action, target, JSON.stringify(details || {}));
        return { success: true };
    } catch (err) {
        console.error('Audit Log Error:', err);
        return { success: false };
    }
};

const getAuditLogs = (limit = 100) => {
    return db.prepare(`
        SELECT a.*, u.username 
        FROM audit_log a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.timestamp DESC
        LIMIT ?
    `).all(limit);
};


module.exports = {
    checkNeedsSetup,
    createUser,
    authenticateByPin,
    authenticateByPassword,
    getAllUsers,
    updateUserStatus,
    changePin,
    resetUserPin,
    logAudit,
    getAuditLogs
};

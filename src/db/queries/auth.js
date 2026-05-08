const db = require('../db.js');
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

const authenticateUser = async (pinPlain) => {
    try {
        const users = db.prepare('SELECT * FROM users WHERE is_active = 1').all();
        
        for (const user of users) {
            const isValid = await bcrypt.compare(pinPlain, user.pin_hash);
            if (isValid) {
                // Safety: Never return the hash to frontend
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
    authenticateUser,
    getAllUsers,
    updateUserStatus,
    logAudit,
    getAuditLogs
};

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * [KB] Perform adaptive backup based on DB_TYPE
 */
async function performBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const isPostgres = process.env.DB_TYPE === 'postgres';

    if (isPostgres) {
        // [KB] PostgreSQL Dump (Production Grade)
        const fileName = `pos_backup_pg_${timestamp}.sql`;
        const filePath = path.join(BACKUP_DIR, fileName);
        const cmd = `pg_dump ${process.env.DATABASE_URL} > ${filePath}`;

        exec(cmd, (error) => {
            if (error) {
                console.error(`[BACKUP] Gagal dump PostgreSQL: ${error.message}`);
                return;
            }
            console.log(`[BACKUP] PostgreSQL dump berhasil: ${fileName}`);
        });
    } else {
        // [KB] SQLite Hot Backup (Safe Copy)
        const dbPath = process.env.DB_PATH || path.join(__dirname, 'cloud_pos.db');
        const fileName = `pos_backup_sqlite_${timestamp}.db`;
        const filePath = path.join(BACKUP_DIR, fileName);

        try {
            if (fs.existsSync(dbPath)) {
                fs.copyFileSync(dbPath, filePath);
                console.log(`[BACKUP] SQLite snapshot berhasil: ${fileName}`);
            } else {
                console.warn(`[BACKUP] Source DB tidak ditemukan: ${dbPath}`);
            }
        } catch (err) {
            console.error(`[BACKUP] Gagal copy SQLite: ${err.message}`);
        }
    }

    cleanOldBackups();
}

/**
 * [INF] Retention Policy: Keep backups for 30 days
 */
function cleanOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const expiry = 30 * 24 * 60 * 60 * 1000;

    files.forEach(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > expiry) {
            fs.unlinkSync(filePath);
            console.log(`[BACKUP] Cleared old backup: ${file}`);
        }
    });
}

// Automatic backup every 24 hours
setInterval(performBackup, 24 * 60 * 60 * 1000);

module.exports = { performBackup };

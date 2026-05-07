import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import log from 'electron-log';

let dbInstance = null;

export function initDb(dbPath) {
    if (dbInstance) return dbInstance;

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    try {
        dbInstance = new Database(dbPath, { fileMustExist: false });
        dbInstance.pragma('journal_mode = WAL');
        dbInstance.pragma('foreign_keys = ON');

        // Use fileURLToPath for robust path handling on all platforms
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const schemaPath = path.join(__dirname, 'schema.sql');
        
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            dbInstance.exec(schema);
            log.info(`Schema executed from: ${schemaPath}`);
        }

        log.info(`Database initialized at: ${dbPath}`);
        return dbInstance;
    } catch (err) {
        log.error(`Database init failed: ${err.message}`);
        throw err;
    }
}

export function getDb() {
    if (!dbInstance) throw new Error('Database belum diinisialisasi. Panggil initDb() dulu.');
    return dbInstance;
}

export function closeDb() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
        log.info('Database connection closed.');
    }
}

export default { initDb, getDb, closeDb };

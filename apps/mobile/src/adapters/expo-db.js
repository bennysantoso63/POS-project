import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

import { schema } from '@pos-mandiri/db';

let dbInstance = null;

export function initMobileDb(dbName = 'pos-mandiri.db') {
    if (dbInstance) return dbInstance;

    dbInstance = SQLite.openDatabaseSync(dbName);
    dbInstance.execSync('PRAGMA journal_mode = WAL');
    dbInstance.execSync('PRAGMA foreign_keys = ON');

    // Init schema — CREATE TABLE IF NOT EXISTS aman dijalankan ulang
    dbInstance.execSync(schema);

    return dbInstance;
}

export function getMobileDb() {
    if (!dbInstance) throw new Error('DB not initialized. Call initMobileDb() first.');
    return dbInstance;
}

// Adapter interface — semua SYNC (sama dengan better-sqlite3)
export const mobileDbAdapter = {
    get: (sql, params = []) => {
        const db = getMobileDb();
        return db.getFirstSync(sql, params) || null;
    },

    all: (sql, params = []) => {
        const db = getMobileDb();
        return db.getAllSync(sql, params);
    },

    run: (sql, params = []) => {
        const db = getMobileDb();
        const result = db.runSync(sql, params);
        return {
            changes         : result.changes,
            lastInsertRowid : result.lastInsertRowId,
        };
    },

    transaction: (fn) => {
        const db = getMobileDb();
        return db.withTransactionSync(fn);
    },

    exec: (sql) => {
        const db = getMobileDb();
        db.execSync(sql);
    },
};

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const log = require('electron-log');

let dbInstance = null;

function initDb() {
    if (dbInstance) return dbInstance;

    // Standard path for Electron userData
    let dbPath;
    if (app) {
        dbPath = path.join(app.getPath('userData'), 'pos_mandiri.db');
    } else {
        // Fallback untuk script migrasi Node.js murni
        dbPath = path.join(process.cwd(), 'pos_mandiri.db');
    }
    const dir = path.dirname(dbPath);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    try {
        dbInstance = new Database(dbPath, { fileMustExist: false });
        dbInstance.pragma('journal_mode = WAL');
        dbInstance.pragma('foreign_keys = ON');

        const schemaPath = path.join(__dirname, 'schema.sql');
        
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            dbInstance.exec(schema);
            log.info(`Schema executed from: ${schemaPath}`);

            // --- Base Schema Migrations (Missing Columns) ---
            try {
                const { applyMissingColumnsMigration } = require('./migrations/add_missing_columns.cjs');
                applyMissingColumnsMigration(dbInstance);
                log.info('Base schema migrations applied successfully.');
            } catch (bErr) {
                log.error(`Base migration error: ${bErr.message}`);
            }

            // --- Sembahyang Module Migration Hook ---
            try {
                const { applySembahyangMigration } = require('./migrations/add_sembahyang_module.cjs');
                applySembahyangMigration(dbInstance);
                log.info('Sembahyang Module migration applied successfully.');
            } catch (mErr) {
                log.error(`Sembahyang migration error: ${mErr.message}`);
            }

            // --- Omnichannel Sync Module Migration Hook ---
            try {
                const { applySyncMigration } = require('./migrations/add_sync_module.cjs');
                applySyncMigration(dbInstance);
                log.info('Omnichannel Sync Module migration applied successfully.');
            } catch (sErr) {
                log.error(`Sync module migration error: ${sErr.message}`);
            }

            // --- 🚀 Analytics Queue Module Migration ---
            try {
                dbInstance.exec(`
                    CREATE TABLE IF NOT EXISTS analytics_job_queue (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        transaction_id INTEGER NOT NULL,
                        status TEXT DEFAULT 'PENDING',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(transaction_id) REFERENCES transactions(id)
                    );
                    CREATE INDEX IF NOT EXISTS idx_analytics_status ON analytics_job_queue(status);
                `);
                log.info('Analytics Queue Module initialized successfully.');
            } catch (aErr) {
                log.error(`Analytics Queue init error: ${aErr.message}`);
            }
        }

        log.info(`Database initialized at: ${dbPath}`);
        return dbInstance;
    } catch (err) {
        log.error(`Database init failed: ${err.message}`);
        throw err;
    }
}

// Auto-init on first require
if (!dbInstance && app && app.isReady()) {
    initDb();
} else if (!dbInstance && app) {
    app.on('ready', () => initDb());
}

const getDb = () => {
    if (!dbInstance) initDb();
    return dbInstance;
};

// Exporting proxy methods to allow db.prepare() style usage
module.exports = {
    prepare: (sql) => getDb().prepare(sql),
    transaction: (fn) => getDb().transaction(fn),
    exec: (sql) => getDb().exec(sql),
    close: () => {
        if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
        }
    }
};

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

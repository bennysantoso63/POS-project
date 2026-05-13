const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Path ke DB Electron
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'pos-offline-mandiri', 'pos_mandiri.db');

try {
    const db = new Database(dbPath);
    console.log("Connected to DB at:", dbPath);

    // 1. Create held_bills table
    db.exec(`
        CREATE TABLE IF NOT EXISTS held_bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL,
            cart_data TEXT NOT NULL,
            created_at DATETIME DEFAULT (datetime('now', 'localtime'))
        );
    `);
    console.log("Table 'held_bills' created or already exists.");

    // 2. Add 'name' column to transaction_items if not exists
    // Kita coba cek dulu apakah kolom ada
    const tableInfo = db.prepare("PRAGMA table_info(transaction_items)").all();
    const hasName = tableInfo.some(c => c.name === 'name');
    
    if (!hasName) {
        db.exec("ALTER TABLE transaction_items ADD COLUMN name TEXT;");
        console.log("Column 'name' added to 'transaction_items'.");
    } else {
        console.log("Column 'name' already exists in 'transaction_items'.");
    }

    db.close();
    console.log("Migration successful!");
} catch (err) {
    console.error("Migration failed:", err.message);
}

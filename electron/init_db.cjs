const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * DATABASE INITIALIZER - MANDIRI ENTERPRISE
 * Menjalankan skema SQL dan menyiapkan data awal.
 */

const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'mandiri_enterprise.db');
const db = new Database(dbPath, { verbose: console.log });

const schemaPath = path.join(process.cwd(), 'docs', 'schema_mandiri.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

try {
    console.log("Ling-Ling: Menyiapkan pondasi database...");
    db.exec(schema);
    console.log("Ling-Ling: Database SIAP! Data simulasi telah dimasukkan.");
} catch (err) {
    console.error("Gagal inisialisasi database:", err);
} finally {
    db.close();
}

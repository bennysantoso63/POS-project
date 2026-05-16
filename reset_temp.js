const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Path database di lingkungan Electron (Roaming)
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'pos-offline-mandiri', 'pos_mandiri.db');

if (!fs.existsSync(dbPath)) {
    console.error(`Database tidak ditemukan di: ${dbPath}`);
    process.exit(1);
}

const db = new Database(dbPath);

async function resetPin() {
    const newPin = '1234';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPin, salt);

    // Update PIN untuk user dengan role 'owner'
    const result = db.prepare("UPDATE users SET pin_hash = ? WHERE role = 'owner'").run(hash);

    if (result.changes > 0) {
        console.log(`SUKSES: PIN Pemilik telah direset menjadi: ${newPin}`);
    } else {
        console.error("GAGAL: Tidak ditemukan user dengan role 'owner'.");
    }
    db.close();
}

resetPin();

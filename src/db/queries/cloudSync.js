const db = require('../db.js');
const axios = require('axios');

/**
 * [SPEC] CLOUD SYNC CLIENT (Electron Process) - ENTERPRISE GRADE
 * Lokasi: src/db/queries/cloudSync.js
 * Filosofi: Reliability over Latency (Reliabilitas di atas kecepatan).
 */

// 1. Initialize Sync Tables with Enterprise tracking
const initSyncTable = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            retry_count INTEGER DEFAULT 0,
            last_error TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_sync_pending ON sync_queue (status) WHERE status = 'PENDING';

        CREATE TABLE IF NOT EXISTS remote_store_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cloud_id INTEGER UNIQUE,
            store_id TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            pulled_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
};

// 2. Enqueue Data (Append-Only Audit Trail)
const enqueue = (type, id, data) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO sync_queue (entity_type, entity_id, payload)
            VALUES (?, ?, ?)
        `);
        stmt.run(type, id.toString(), JSON.stringify(data));
    } catch (err) {
        console.error('[Sync Queue] Gagal memasukkan antrean:', err);
    }
};

// 3. [PUSH] Background Job with Retries
const processSyncQueue = async () => {
    const settings = getCloudSettings();
    if (!settings.cloud_enabled || settings.cloud_enabled === 'false') return;

    const pending = db.prepare(`
        SELECT * FROM sync_queue 
        WHERE status = 'PENDING' 
        AND retry_count < 5 
        ORDER BY created_at ASC 
        LIMIT 50
    `).all();

    if (pending.length === 0) return;

    try {
        const response = await axios.post(`${settings.cloud_url}/api/sync/push`, {
            store_id: settings.store_id || 'STORE-001',
            store_name: settings.store_name || 'POS Mandiri',
            logs: pending.map(p => ({
                type: p.entity_type,
                id: p.entity_id,
                data: JSON.parse(p.payload)
            }))
        }, {
            headers: { 
                'x-api-key': settings.cloud_key || 'POS_SECRET_2024',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.data && response.data.success) {
            const ids = pending.map(p => p.id);
            const deleteStmt = db.prepare(`DELETE FROM sync_queue WHERE id = ?`);
            db.transaction(() => {
                ids.forEach(id => deleteStmt.run(id));
            })();
            console.log(`[Sync] ${ids.length} items synced and archived.`);
        }
    } catch (err) {
        const updateStmt = db.prepare(`
            UPDATE sync_queue 
            SET retry_count = retry_count + 1,
                last_error = ?
            WHERE id = ?
        `);
        db.transaction(() => {
            pending.forEach(p => updateStmt.run(err.message, p.id));
        })();
        console.warn(`[Sync Push] Failed. Attempt recorded. Error: ${err.message}`);
    }
};

// 4. [PULL] Background Job to fetch other branch data
const syncFromCloud = async () => {
    const settings = getCloudSettings();
    if (!settings.cloud_enabled || settings.cloud_enabled === 'false') return;

    let lastId = 0;
    const row = db.prepare("SELECT value FROM settings WHERE key = 'cloud_last_pull_id'").get();
    if (row) lastId = parseInt(row.value);

    try {
        const response = await axios.get(`${settings.cloud_url}/api/sync/pull`, {
            params: { last_id: lastId, store_id: settings.store_id || 'STORE-001' },
            headers: { 'x-api-key': settings.cloud_key || 'POS_SECRET_2024' }
        });

        if (response.data && response.data.success && response.data.data.length > 0) {
            const logs = response.data.data;
            const insertRemote = db.prepare(`
                INSERT OR IGNORE INTO remote_store_logs (cloud_id, store_id, entity_type, payload)
                VALUES (?, ?, ?, ?)
            `);

            db.transaction(() => {
                logs.forEach(log => {
                    insertRemote.run(log.id, log.store_id, log.entity_type, log.payload);
                });
                const maxId = Math.max(...logs.map(l => l.id));
                db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('cloud_last_pull_id', ?)")
                  .run(maxId.toString());
            })();
            console.log(`[Sync Pull] ${logs.length} remote logs synchronized.`);
        }
    } catch (err) {
        // Silent background error
    }
};

const getCloudSettings = () => {
    const rows = db.prepare('SELECT key, value FROM settings WHERE key LIKE "cloud_%" OR key IN ("store_id", "store_name")').all();
    return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
};

module.exports = { 
    initSyncTable, 
    enqueue, 
    processSyncQueue,
    syncFromCloud 
};

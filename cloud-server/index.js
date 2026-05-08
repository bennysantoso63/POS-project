const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const backup = require('./backup');
require('dotenv').config();

// Initialize Database
const dbPath = process.env.DB_PATH || path.join(__dirname, 'cloud_pos.db');
const db = new Database(dbPath);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. SECURITY MIDDLEWARE
const validateApiKey = (req, res, next) => {
    const providedKey = req.headers['x-api-key'];
    const serverKey = process.env.ADMIN_SECRET || 'POS_SECRET_2024';

    if (!providedKey || providedKey !== serverKey) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    next();
};

// 2. SCHEMA INIT
db.exec(`
    CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        last_sync DATETIME,
        status TEXT DEFAULT 'active'
    );
`);

// 3. SYNC ENDPOINTS
app.post('/api/sync/push', validateApiKey, (req, res) => {
    const { store_id, store_name, logs } = req.body;
    if (!store_id || !Array.isArray(logs)) return res.status(400).json({ success: false });

    try {
        const stmt = db.prepare(`INSERT INTO sync_log (store_id, entity_type, entity_id, payload) VALUES (?, ?, ?, ?)`);
        const updateStore = db.prepare('INSERT OR REPLACE INTO stores (id, name, last_sync) VALUES (?, ?, CURRENT_TIMESTAMP)');

        const transaction = db.transaction((items) => {
            for (const item of items) {
                stmt.run(store_id, item.type, item.id, JSON.stringify(item.data));
            }
            updateStore.run(store_id, store_name || 'Cabang POS');
        });

        transaction(logs);
        res.json({ success: true, count: logs.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/sync/pull', validateApiKey, (req, res) => {
    try {
        const { last_id, store_id } = req.query;
        const lastId = parseInt(last_id) || 0;
        
        // Ambil log yang bukan berasal dari store ini sendiri dan ID > last_id
        const logs = db.prepare(`
            SELECT id, store_id, entity_type, payload 
            FROM sync_log 
            WHERE id > ? AND store_id != ?
            ORDER BY id ASC 
            LIMIT 500
        `).all(lastId, store_id || '');

        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/analytics/summary', validateApiKey, (req, res) => {
    try {
        const logs = db.prepare(`SELECT payload FROM sync_log WHERE entity_type = 'transaction'`).all();
        let totalRevenue = 0;
        logs.forEach(log => {
            const data = JSON.parse(log.payload);
            totalRevenue += Math.abs(data.total || 0);
        });

        const activeStores = db.prepare('SELECT * FROM stores').all();
        res.json({ success: true, summary: { revenue: totalRevenue, transactions: logs.length, stores_count: activeStores.length, active_stores: activeStores } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. WEB DASHBOARD (Zero-Dependency)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <title>POS Cloud Central</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap" rel="stylesheet">
        <style>body { font-family: 'Inter', sans-serif; }</style>
    </head>
    <body class="bg-slate-950 text-white min-h-screen p-8">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-5xl font-black tracking-tighter mb-2">CLOUD CENTRAL</h1>
            <p class="text-slate-500 uppercase tracking-widest text-xs mb-12">Multi-Store Aggregator v1.0</p>
            
            <div id="auth-panel" class="bg-slate-900 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                <input type="password" id="secret" placeholder="Enter ADMIN_SECRET" class="bg-slate-800 border-none rounded-2xl px-6 py-4 w-full mb-6 text-white outline-none focus:ring-2 ring-blue-500">
                <button onclick="loadStats()" class="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-blue-500 transition-colors">Akses Database Pusat</button>
            </div>

            <div id="stats-grid" class="grid-cols-1 md:grid-cols-3 gap-6 hidden">
                <div class="bg-slate-900 p-8 rounded-[3rem] border border-white/5">
                    <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Omzet</p>
                    <h3 id="rev" class="text-3xl font-black text-emerald-400">Rp 0</h3>
                </div>
                <div class="bg-slate-900 p-8 rounded-[3rem] border border-white/5">
                    <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Transaksi</p>
                    <h3 id="tx-count" class="text-3xl font-black text-blue-400">0</h3>
                </div>
                <div class="bg-slate-900 p-8 rounded-[3rem] border border-white/5">
                    <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Cabang Aktif</p>
                    <h3 id="stores" class="text-3xl font-black text-amber-400">0</h3>
                </div>
            </div>
        </div>
        <script>
            async function loadStats() {
                const secret = document.getElementById('secret').value;
                const res = await fetch('/api/analytics/summary', { headers: { 'x-api-key': secret } });
                const json = await res.json();
                if (json.success) {
                    document.getElementById('auth-panel').classList.add('hidden');
                    document.getElementById('stats-grid').classList.replace('hidden', 'grid');
                    document.getElementById('rev').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(json.summary.revenue);
                    document.getElementById('tx-count').innerText = json.summary.transactions;
                    document.getElementById('stores').innerText = json.summary.stores_count;
                } else { alert('Secret Invalid!'); }
            }
        </script>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[CLOUD] Server POS Mandiri aktif di port ${PORT}`));

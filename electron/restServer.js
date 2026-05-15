const express = require('express');
const cors = require('cors');
const db = require('../src/db/db.cjs');

// Import Query existing
const auth = require('../src/db/queries/auth.cjs');
const products = require('../src/db/queries/products.cjs');
const sessions = require('../src/db/queries/sessions.cjs');
const heldBills = require('../src/db/queries/heldBills.cjs');
const transactions = require('../src/db/queries/transactions.cjs');

const server = express();
server.use(cors());
server.use(express.json());

/**
 * Middleware Keamanan: Token Pairing
 * Memastikan hanya device mobile yang terdaftar yang bisa mengakses data.
 */
function authMiddleware(req, res, next) {
    const token = req.headers['x-companion-token'];
    const validToken = db.prepare("SELECT value FROM settings WHERE key = 'companion_pairing_token'").get()?.value;

    if (!validToken || token !== validToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// 1. Auth Endpoint
server.post('/api/auth/login-pin', async (req, res) => {
    try {
        const { pin } = req.body;
        const user = await auth.authenticateByPin(pin);
        if (!user.success) return res.status(401).json({ success: false, error: 'PIN salah' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

server.post('/api/auth/login-password', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await auth.authenticateByPassword(username, password);
        if (!result.success) return res.status(401).json({ success: false, error: 'Username/password salah' });
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Master Data
server.get('/api/products', authMiddleware, (req, res) => {
    try {
        const data = products.getProducts();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

server.get('/api/products/search', authMiddleware, (req, res) => {
    try {
        const { q } = req.query;
        const data = products.searchProducts(q || '');
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Transactions & Table Management
server.post('/api/transactions', authMiddleware, async (req, res) => {
    try {
        const result = await transactions.createTransaction(req.body);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

server.get('/api/sessions/active', authMiddleware, (req, res) => {
    try {
        const session = sessions.getActiveSession();
        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Dashboard Summary
server.get('/api/dashboard/summary', authMiddleware, (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const omzet = db.prepare(`
            SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS count
            FROM transactions
            WHERE date(created_at) = ? AND status = 'completed'
        `).get(today);

        const lowStock = db.prepare(`
            SELECT COUNT(*) AS count FROM products
            WHERE stock_pcs <= low_stock_threshold
        `).get();

        const recentTx = db.prepare(`
            SELECT id, total, payment_method, created_at, status
            FROM transactions
            WHERE date(created_at) = ?
            ORDER BY created_at DESC LIMIT 5
        `).all(today);

        res.json({
            success: true,
            data: {
                omzetHariIni    : omzet.total,
                jumlahTx        : omzet.count,
                lowStockCount   : lowStock.count,
                recentTx,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

server.get('/api/settings', authMiddleware, (req, res) => {
    try {
        const rows = db.prepare('SELECT key, value FROM settings').all();
        const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

function startServer(port = 3001) {
    try {
        server.listen(port, () => {
            console.log(`[REST API] Companion server running on port ${port}`);
        });
    } catch (err) {
        console.error(`[REST API] Failed to start server: ${err.message}`);
    }
}

module.exports = { startServer };

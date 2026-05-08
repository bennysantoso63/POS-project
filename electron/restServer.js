const express = require('express');
const cors = require('cors');
const db = require('../src/db/db.js');

// Import Query existing
const auth = require('../src/db/queries/auth');
const products = require('../src/db/queries/products');
const sessions = require('../src/db/queries/sessions');
const heldBills = require('../src/db/queries/heldBills');
const transactions = require('../src/db/queries/transactions');

const server = express();
server.use(cors());
server.use(express.json());

/**
 * [SPEC] COMPANION REST API ENDPOINTS
 * Memungkinkan terminal mobile mengakses database PC Kasir Induk via WiFi.
 */

// 1. Auth Endpoint
server.post('/api/auth/login', async (req, res) => {
    const result = await auth.authenticateUser(req.body.pin);
    res.json(result);
});

// 2. Master Data
server.get('/api/products', (req, res) => {
    const data = products.getProducts();
    res.json(data);
});

server.get('/api/categories', (req, res) => {
    const data = db.prepare('SELECT * FROM categories').all();
    res.json(data);
});

// 3. Transactions & Table Management
server.post('/api/transactions/checkout', async (req, res) => {
    const result = await transactions.createTransaction(req.body);
    res.json(result);
});

server.post('/api/transactions/hold', (req, res) => {
    const result = heldBills.holdBill(req.body.label, req.body.cartItems);
    res.json(result);
});

server.get('/api/held-bills', (req, res) => {
    const data = heldBills.getHeldBills();
    res.json(data);
});

// 4. Kitchen Display Status (KDS)
server.get('/api/kds-orders', (req, res) => {
    const data = db.prepare('SELECT * FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE status = "completed" AND created_at > date("now"))').all();
    res.json(data);
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

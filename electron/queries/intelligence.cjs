/**
 * POS MANDIRI - INTELLIGENCE ENGINE (Phase 3)
 * Includes: RFM Segmentation, Burn-Rate Predictor, Sembahyang Big Bang
 */

const db = require('../../src/db/db.cjs');
const log = require('electron-log');

// ==========================================
// 1. RFM MATRIX (RECENCY, FREQUENCY, MONETARY)
// ==========================================
function getRFMMatrix() {
    try {
        const rows = db.prepare(`
            SELECT 
                c.id, 
                c.name, 
                c.phone,
                COUNT(t.id) as txCount,
                COALESCE(SUM(t.total), 0) as totalSpent,
                MAX(t.created_at) as lastPurchase
            FROM customers c
            LEFT JOIN transactions t ON c.id = t.customer_id AND t.status = 'completed'
            WHERE c.is_active = 1
            GROUP BY c.id
            ORDER BY totalSpent DESC
        `).all();

        return rows.map(c => {
            let badge = '❄️ Pelanggan Pasif';
            let color = 'text-slate-500 bg-slate-100 border-slate-300 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
            
            if (c.totalSpent > 1000000) { 
                badge = '👑 Donatur Emas'; 
                color = 'text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-500 dark:bg-amber-900/30 dark:border-amber-700/50'; 
            } else if (c.totalSpent > 200000) { 
                badge = '🔥 Pelanggan Aktif'; 
                color = 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-500 dark:bg-emerald-900/30 dark:border-emerald-700/50'; 
            }

            return { ...c, badge, color };
        });
    } catch (err) {
        log.error(`getRFMMatrix failed: ${err.message}`);
        return [];
    }
}

// ==========================================
// 2. BURN-RATE PREDICTOR (ENHANCED)
// ==========================================
function getBurnRateAlerts() {
    try {
        // [INF] Mengambil tren penjualan 30 hari terakhir untuk prediksi akurat
        const rows = db.prepare(`
            SELECT 
                p.id, 
                p.name, 
                p.stock_pcs, 
                p.price_retail as price,
                COALESCE((
                    SELECT SUM(ti.qty) 
                    FROM transaction_items ti 
                    JOIN transactions t ON ti.transaction_id = t.id 
                    WHERE ti.product_id = p.id 
                      AND t.status = 'completed' 
                      AND t.created_at > date('now', '-30 days')
                ), 0) / 30.0 as daily_velocity
            FROM products p
            WHERE p.stock_pcs < (p.low_stock_threshold * 2)
            ORDER BY p.stock_pcs ASC
        `).all();

        return rows.map(p => {
            const velocity = p.daily_velocity || 0.1; // Fallback velocity
            const daysLeft = Math.floor(p.stock_pcs / velocity);
            return {
                ...p,
                daysLeft: daysLeft > 99 ? 99 : daysLeft,
                unit: 'pcs'
            };
        });
    } catch (err) {
        log.error(`getBurnRateAlerts failed: ${err.message}`);
        return [];
    }
}

// ==========================================
// 3. SEMBAHYANG BIG BANG (LUNAR EVENT PREDICTOR)
// ==========================================
function getSembahyangBigBang() {
    try {
        const events = db.prepare(`
            SELECT * FROM Dim_Date_Lunar 
            WHERE intensity_score >= 5 
              AND gregorian_date >= date('now', 'localtime')
            ORDER BY gregorian_date ASC 
            LIMIT 3
        `).all();
        
        return events;
    } catch (err) {
        log.error(`getSembahyangBigBang failed: ${err.message}`);
        return [];
    }
}

// ==========================================
// 4. APRIORI ALGORITHM (MARKET BASKET)
// ==========================================
function getAprioriRules() {
    try {
        const items = db.prepare(`
            SELECT transaction_id, name 
            FROM transaction_items
        `).all();

        if (items.length === 0) return [];

        const baskets = {};
        items.forEach(item => {
            if (!baskets[item.transaction_id]) baskets[item.transaction_id] = [];
            baskets[item.transaction_id].push(item.name);
        });

        const pairFrequency = {};
        const itemFrequency = {};

        Object.values(baskets).forEach(basket => {
            const uniqueItems = [...new Set(basket)].sort(); 
            
            uniqueItems.forEach(item => {
                itemFrequency[item] = (itemFrequency[item] || 0) + 1;
            });

            for (let i = 0; i < uniqueItems.length; i++) {
                for (let j = i + 1; j < uniqueItems.length; j++) {
                    const pair = `${uniqueItems[i]}|${uniqueItems[j]}`;
                    pairFrequency[pair] = (pairFrequency[pair] || 0) + 1;
                }
            }
        });

        const rules = Object.keys(pairFrequency).map(pair => {
            const [itemA, itemB] = pair.split('|');
            const freq = pairFrequency[pair];
            
            const confAtoB = freq / itemFrequency[itemA];
            const confBtoA = freq / itemFrequency[itemB];
            
            const primary = confAtoB > confBtoA ? itemA : itemB;
            const secondary = confAtoB > confBtoA ? itemB : itemA;
            const maxConfidence = Math.max(confAtoB, confBtoA) * 100;

            return { primary, secondary, confidence: maxConfidence };
        });

        return rules.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    } catch (err) {
        log.error(`getAprioriRules failed: ${err.message}`);
        return [];
    }
}

// ==========================================
// 5. LING-LING LOCAL NLP ENGINE (CHATBOT)
// ==========================================
function askLingLing(question) {
    if (!question) return "Ada yang bisa Ling-Ling bantu?";
    const query = question.toLowerCase();
    const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num || 0);
    
    try {
        if (query.includes('kasbon') || query.includes('hutang') || query.includes('piutang')) {
            const res = db.prepare(`SELECT COALESCE(SUM(amount - (SELECT COALESCE(SUM(amount),0) FROM receivable_payments rp WHERE rp.receivable_id = r.id)), 0) as t FROM receivables r WHERE status != 'paid'`).get();
            const total = res ? res.t : 0;
            return `Total piutang (kasbon) pelanggan yang belum lunas adalah Rp ${formatRp(total)}.`;
        }

        if (query.includes('laku') || query.includes('terlaris') || query.includes('best seller')) {
            const topItem = db.prepare(`
                SELECT name, SUM(qty) as total_sold 
                FROM transaction_items 
                GROUP BY name ORDER BY total_sold DESC LIMIT 1
            `).get();
            if (!topItem) return "Belum ada data penjualan yang bisa saya analisa.";
            return `Barang paling laku saat ini adalah ${topItem.name}, sudah terjual sebanyak ${topItem.total_sold} pcs.`;
        }

        if (query.includes('omzet') || query.includes('pendapatan')) {
            const res = db.prepare(`SELECT COALESCE(SUM(total), 0) as t FROM transactions WHERE status = 'completed'`).get();
            const omzet = res ? res.t : 0;
            return `Total omzet kotor yang tercatat di sistem adalah Rp ${formatRp(omzet)}.`;
        }

        if (query.includes('stok') || query.includes('habis')) {
            const lowStock = db.prepare(`SELECT COUNT(*) as c FROM products WHERE stock_pcs <= low_stock_threshold`).get();
            const count = lowStock ? lowStock.c : 0;
            return count > 0 
                ? `Ada ${count} barang yang stoknya sudah kritis. Segera cek daftar kulakan.` 
                : "Semua stok barang masih aman terkendali.";
        }

        return "Maaf, Ling-Ling belum paham maksudnya. Coba tanya soal 'kasbon', 'barang terlaris', 'stok', atau 'omzet'.";

    } catch (error) {
        log.error("[LING-LING ERROR]", error);
        return "Aduh, Ling-Ling pusing (Database Error). Coba lagi nanti ya.";
    }
}

function getBundlingSuggestion(primaryItemId) {
    try {
        const stmt = db.prepare(`
            SELECT 
                p.id, 
                p.name, 
                p.price_retail as price, 
                p.is_anchor_item, 
                a.confidence_pct
            FROM apriori_rules a
            JOIN products p ON a.secondary_item_id = p.id
            WHERE a.primary_item_id = ?
            ORDER BY a.confidence_pct DESC
            LIMIT 1
        `);
        
        const suggestion = stmt.get(primaryItemId);
        return suggestion || null;
    } catch (err) {
        log.error(`getBundlingSuggestion failed: ${err.message}`);
        return null;
    }
}

// ==========================================
// 6. INTELLIGENCE UPDATER (Populate Tables)
// ==========================================
function recalculateIntelligence() {
    try {
        db.exec('BEGIN TRANSACTION;');

        // A. RECALCULATE APRIORI RULES
        db.exec("DELETE FROM apriori_rules");
        const items = db.prepare(`SELECT transaction_id, product_id FROM transaction_items`).all();
        const baskets = {};
        items.forEach(item => {
            if (!baskets[item.transaction_id]) baskets[item.transaction_id] = [];
            baskets[item.transaction_id].push(item.product_id);
        });

        const pairFrequency = {};
        const itemFrequency = {};
        Object.values(baskets).forEach(basket => {
            const uniqueItems = [...new Set(basket)].sort(); 
            uniqueItems.forEach(id => { itemFrequency[id] = (itemFrequency[id] || 0) + 1; });
            for (let i = 0; i < uniqueItems.length; i++) {
                for (let j = i + 1; j < uniqueItems.length; j++) {
                    const pair = `${uniqueItems[i]}|${uniqueItems[j]}`;
                    pairFrequency[pair] = (pairFrequency[pair] || 0) + 1;
                }
            }
        });

        const insertRule = db.prepare(`INSERT INTO apriori_rules (primary_item_id, secondary_item_id, confidence_pct) VALUES (?, ?, ?)`);
        Object.keys(pairFrequency).forEach(pair => {
            const [idA, idB] = pair.split('|').map(Number);
            const freq = pairFrequency[pair];
            const confAtoB = (freq / itemFrequency[idA]) * 100;
            const confBtoA = (freq / itemFrequency[idB]) * 100;
            if (confAtoB > 20) insertRule.run(idA, idB, Math.round(confAtoB));
            if (confBtoA > 20) insertRule.run(idB, idA, Math.round(confBtoA));
        });

        // B. RECALCULATE RFM (Placeholder logic)
        db.exec("DELETE FROM customer_rfm");
        const customers = db.prepare(`
            SELECT customer_id, COUNT(id) as freq, SUM(total) as mon, MAX(created_at) as last 
            FROM transactions WHERE status = 'completed' AND customer_id IS NOT NULL GROUP BY customer_id
        `).all();
        const insertRFM = db.prepare(`INSERT INTO customer_rfm (customer_id, segment, score, last_updated) VALUES (?, ?, ?, datetime('now'))`);
        customers.forEach(c => {
            let segment = 'Regular';
            if (c.mon > 1000000) segment = 'VIP';
            else if (c.freq > 5) segment = 'Loyal';
            insertRFM.run(c.customer_id, segment, c.freq);
        });

        db.exec('COMMIT;');
        return { success: true };
    } catch (err) {
        try { db.exec('ROLLBACK;'); } catch(e) {}
        log.error(`recalculateIntelligence failed: ${err.message}`);
        throw err;
    }
}

module.exports = {
    getRFMMatrix,
    getBurnRateAlerts,
    getSembahyangBigBang,
    getAprioriRules,
    getBundlingSuggestion,
    askLingLing,
    recalculateIntelligence
};

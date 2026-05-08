/**
 * SEMBAHYANG INTELLIGENCE MODULE - BACKEND ENGINE
 * Lokasi: electron/queries/sembahyang_ai.js
 */

const db = require('../../src/db/db.js');

// ==========================================
// 1. RFM MATRIX (RECENCY, FREQUENCY, MONETARY)
// ==========================================
function getRFMMatrix() {
    const rows = db.prepare(`
        SELECT 
            c.id, 
            c.name, 
            c.phone,
            COUNT(t.id) as txCount,
            COALESCE(SUM(t.total), 0) as totalSpent,
            MAX(t.date) as lastPurchase
        FROM customers c
        LEFT JOIN transactions t ON c.id = t.customer_id AND t.status = 'completed'
        WHERE c.is_active = 1
        GROUP BY c.id
        ORDER BY totalSpent DESC
    `).all();

    return rows.map(c => {
        let badge = '❄️ Umat Pasif';
        let color = 'text-slate-500 bg-slate-100 border-slate-300 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
        
        if (c.totalSpent > 1000000) { 
            badge = '👑 Donatur Emas'; 
            color = 'text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-500 dark:bg-amber-900/30 dark:border-amber-700/50'; 
        } else if (c.totalSpent > 200000) { 
            badge = '🔥 Umat Aktif'; 
            color = 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-500 dark:bg-emerald-900/30 dark:border-emerald-700/50'; 
        }

        return { ...c, badge, color };
    });
}

// ==========================================
// 2. BURN-RATE PREDICTOR
// ==========================================
function getBurnRateAlerts() {
    const rows = db.prepare(`
        SELECT id, name, stock_pcs, price
        FROM products
        WHERE LOWER(category) = 'harian' AND stock_pcs < 20 AND is_active = 1
        ORDER BY stock_pcs ASC

    `).all();

    return rows.map(p => ({
        ...p,
        daysLeft: Math.floor(p.stock_pcs / 3),
        unit: 'pcs'
    }));
}

// ==========================================
// 3. APRIORI ALGORITHM (MARKET BASKET)
// ==========================================
function getAprioriRules() {
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

    const totalTransactions = Object.keys(baskets).length;
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
}

// ==========================================
// 4. LING-LING LOCAL NLP ENGINE (CHATBOT)
// ==========================================
function askLingLing(question) {
    const query = question.toLowerCase();
    const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num || 0);
    
    try {
        if (query.includes('kasbon') || query.includes('hutang') || query.includes('piutang')) {
            if (query.includes('vihara')) {
                const vihara = db.prepare(`SELECT * FROM customers WHERE name LIKE '%vihara%' LIMIT 1`).get();
                if (vihara) {
                    const totalKasbon = db.prepare(`
                        SELECT COALESCE(SUM(amount), 0) as total FROM receivables WHERE customer_id = ? AND status != 'paid'
                    `).get(vihara.id).total;
                    
                    if (totalKasbon > 0) return `Sisa kasbon ${vihara.name} saat ini Rp ${formatRp(totalKasbon)}. Mau saya buatkan draft tagihannya, Bos?`;
                    return `${vihara.name} tidak memiliki tunggakan aktif saat ini, Bos. Lunas!`;
                }
            }
            const total = db.prepare(`SELECT COALESCE(SUM(amount), 0) as t FROM receivables WHERE status != 'paid'`).get().t;
            return `Total uang kita yang nyangkut di luar (Kasbon) adalah Rp ${formatRp(total)}. Cukup besar, Bos. Perlu dikurangi.`;
        }

        if (query.includes('laku') || query.includes('terlaris') || query.includes('best seller')) {
            const topItem = db.prepare(`
                SELECT name, SUM(qty) as total_sold 
                FROM transaction_items 
                GROUP BY name ORDER BY total_sold DESC LIMIT 1
            `).get();
            if (!topItem) return "Belum ada data penjualan, Bos.";
            return `Barang paling laku keras saat ini adalah ${topItem.name}, sudah terjual ${topItem.total_sold} pcs.`;
        }

        if (query.includes('omzet') || query.includes('pendapatan') || query.includes('uang')) {
            const omzet = db.prepare(`SELECT COALESCE(SUM(total), 0) as t FROM transactions WHERE status = 'completed'`).get().t;
            return `Total omzet kotor kita adalah Rp ${formatRp(omzet)}. Ingat, ini belum dikurangi HPP (Modal) ya, Bos.`;
        }

        return "Maaf Bos, Ling-Ling kurang paham. Coba tanya soal 'kasbon vihara', 'barang paling laku', atau 'berapa omzet kita?'.";

    } catch (error) {
        console.error("[LING-LING ERROR]", error);
        return "Aduh, Ling-Ling pusing (Database Error). Coba ulangi pertanyaannya, Bos.";
    }
}

module.exports = {
    getRFMMatrix,
    getBurnRateAlerts,
    getAprioriRules,
    askLingLing,
    registerSembahyangIpc: (ipcMain) => {
        ipcMain.handle('api-sembahyang-rfm', () => getRFMMatrix());
        ipcMain.handle('api-sembahyang-burnrate', () => getBurnRateAlerts());
        ipcMain.handle('api-sembahyang-apriori', () => getAprioriRules());
        ipcMain.handle('api-sembahyang-chat', (_, question) => askLingLing(question));
    }
};

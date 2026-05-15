'use strict';
const db = require('../db.cjs');

// ============================================================
// FEATURE GUARD
// ============================================================

function isSembahyangMode() {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'business_type'").get();
    return setting?.value === 'sembahyang';
}

// ============================================================
// FITUR 1: KVI ANCHOR PRICING
// ============================================================

function computeAndSetAnchorItems(anchorCount = 10) {
    if (!isSembahyangMode()) return [];
    
    return db.transaction(() => {
        db.prepare('UPDATE products SET is_anchor_item = 0').run();
        const topItems = db.prepare(`
            SELECT ti.product_id, SUM(ti.qty) AS total_qty
            FROM transaction_items ti
            JOIN transactions t ON t.id = ti.transaction_id
            WHERE t.status = 'completed'
              AND t.created_at >= date('now', '-90 days')
            GROUP BY ti.product_id
            ORDER BY total_qty DESC
            LIMIT ?
        `).all(anchorCount);
        
        const stmt = db.prepare('UPDATE products SET is_anchor_item = 1 WHERE id = ?');
        topItems.forEach(item => stmt.run(item.product_id));
        return topItems;
    })();
}

function getAnchorItems() {
    if (!isSembahyangMode()) return [];
    return db.prepare(`
        SELECT p.*,
            COALESCE(p.margin_target_pct, 5.0) AS margin_target,
            ROUND((p.price_retail - COALESCE(p.cost_price, 0)) * 100.0 / NULLIF(p.price_retail, 0), 1) AS current_margin_pct
        FROM products p
        WHERE p.is_anchor_item = 1
        ORDER BY p.name ASC
    `).all();
}

// ============================================================
// FITUR 2: LUNAR CALENDAR
// ============================================================

function getLunarDate(date = new Date()) {
    if (!isSembahyangMode()) return null;
    try {
        const { Lunar } = require('lunar-javascript');
        const lunar = Lunar.fromDate(date);
        const day = lunar.getDay();

        const isCeIt  = day === 1;
        const isCapGo = day === 15;

        let daysUntilCeIt = 0;
        let daysUntilCapGo = 0;
        for (let i = 1; i <= 30; i++) {
            const futureDate = new Date(date);
            futureDate.setDate(futureDate.getDate() + i);
            const futureLunar = Lunar.fromDate(futureDate);
            if (!daysUntilCeIt && futureLunar.getDay() === 1)  daysUntilCeIt = i;
            if (!daysUntilCapGo && futureLunar.getDay() === 15) daysUntilCapGo = i;
            if (daysUntilCeIt && daysUntilCapGo) break;
        }

        return {
            lunarDay: day,
            lunarMonth: lunar.getMonth(),
            lunarYear: lunar.getYear(),
            isCeIt, isCapGo,
            daysUntilCeIt, daysUntilCapGo,
            isImportantDay: isCeIt || isCapGo,
            label: isCeIt ? 'Ce It 初一' : isCapGo ? 'Cap Go 十五' : null,
            lunarDateStr: lunar.toString()
        };
    } catch (err) {
        console.error('Lunar calendar error:', err.message);
        return null;
    }
}

// ============================================================
// FITUR 3: RADAR KASBON VIHARA (Credit Score)
// ============================================================

function getCustomerCreditScore(customerId) {
    if (!isSembahyangMode()) return null;

    const paid = db.prepare(`
        SELECT r.amount, r.due_date, MAX(t.created_at) AS actual_paid_at
        FROM receivables r
        JOIN transactions t ON t.id = r.transaction_id
        WHERE r.customer_id = ? AND r.status = 'paid'
        GROUP BY r.id
    `).all(customerId);

    const outstanding = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM receivables
        WHERE customer_id = ? AND status = 'outstanding'
    `).get(customerId);

    if (paid.length === 0) {
        return {
            score: 50, label: 'new',
            outstandingAmount: outstanding.total,
            canReceiveCredit: outstanding.total === 0,
        };
    }

    let totalLateDays = 0, lateCount = 0;
    paid.forEach(r => {
        const diff = Math.floor((new Date(r.actual_paid_at) - new Date(r.due_date)) / 86400000);
        if (diff > 0) { totalLateDays += diff; lateCount++; }
    });

    const avgDaysLate = lateCount > 0 ? totalLateDays / lateCount : 0;
    const onTimeRate = (paid.length - lateCount) / paid.length;
    const score = Math.max(0, Math.min(100, (onTimeRate * 70) + (Math.max(0, 30 - avgDaysLate) / 30 * 30)));

    let label, canReceiveCredit;
    if (outstanding.total > 0)  { label = 'blocked'; canReceiveCredit = false; }
    else if (score >= 80)        { label = 'safe';    canReceiveCredit = true;  }
    else if (score >= 50)        { label = 'caution'; canReceiveCredit = true;  }
    else                         { label = 'risk';    canReceiveCredit = false; }

    return {
        score: Math.round(score), label,
        totalLate: lateCount,
        avgDaysLate: Math.round(avgDaysLate),
        outstandingAmount: outstanding.total,
        canReceiveCredit,
    };
}

// ============================================================
// FITUR 4: SEASONAL MARKDOWN
// ============================================================

function getSeasonalMarkdownAlerts() {
    if (!isSembahyangMode()) return [];
    return db.prepare(`
        SELECT p.*,
            CAST(julianday(p.event_end_date) - julianday('now') AS INTEGER) AS days_remaining,
            COALESCE(p.stock_pcs * p.cost_price, 0) AS stock_value_at_cost
        FROM products p
        WHERE p.event_tag IS NOT NULL
          AND p.event_end_date >= date('now')
          AND p.stock_pcs > 0
          AND CAST(julianday(p.event_end_date) - julianday('now') AS INTEGER) <= 7
        ORDER BY days_remaining ASC
    `).all();
}

function getMarkdownRecommendation(daysRemaining) {
    if (daysRemaining <= 1) return { discountPct: 50, urgency: 'critical' };
    if (daysRemaining <= 3) return { discountPct: 40, urgency: 'high' };
    if (daysRemaining <= 5) return { discountPct: 25, urgency: 'medium' };
    return { discountPct: 15, urgency: 'low' };
}

// ============================================================
// FITUR 5: VOID ANOMALY (Blind Reconciliation support)
// ============================================================

function getVoidAnomalyForSession(sessionId, threshold = 5) {
    if (!isSembahyangMode()) return { voidCount: 0, isAnomaly: false };
    
    const data = db.prepare(`
        SELECT COUNT(*) AS void_count,
               COALESCE(SUM(total), 0) AS void_total_value
        FROM transactions
        WHERE cashier_session_id = ? AND status = 'void'
    `).get(sessionId);

    const isAnomaly = data.void_count >= threshold;
    if (isAnomaly) {
        try {
            db.prepare(`
                INSERT OR REPLACE INTO void_anomaly_log
                (cashier_session_id, void_count, void_total_value,
                 anomaly_flag, threshold_used)
                VALUES (?, ?, ?, 1, ?)
            `).run(sessionId, data.void_count, data.void_total_value, threshold);
        } catch(e) { /* non-blocking */ }
    }

    return {
        voidCount: data.void_count,
        voidTotalValue: data.void_total_value,
        isAnomaly, threshold,
    };
}

// ============================================================
// FITUR 6: BURN-RATE PREDICTOR
// ============================================================

function computeBurnratePredictions() {
    if (!isSembahyangMode()) return;

    const history = db.prepare(`
        SELECT t.customer_id, ti.product_id,
               GROUP_CONCAT(date(t.created_at)) AS purchase_dates
        FROM transactions t
        JOIN transaction_items ti ON ti.transaction_id = t.id
        WHERE t.status = 'completed' AND t.customer_id IS NOT NULL
        GROUP BY t.customer_id, ti.product_id
        HAVING COUNT(*) >= 2
    `).all();

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO burnrate_predictions
        (customer_id, product_id, avg_days_between_purchase,
         last_purchase_date, predicted_next_purchase, days_until_stockout)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
        history.forEach(row => {
            const dates = row.purchase_dates.split(',').map(d => new Date(d));
            if (dates.length < 2) return;
            let totalGap = 0;
            for (let i = 1; i < dates.length; i++) {
                totalGap += (dates[i] - dates[i-1]) / 86400000;
            }
            const avgDays = totalGap / (dates.length - 1);
            const lastDate = dates[dates.length - 1];
            const predictedNext = new Date(lastDate);
            predictedNext.setDate(predictedNext.getDate() + Math.round(avgDays));
            const daysUntil = Math.floor((predictedNext - new Date()) / 86400000);
            stmt.run(
                row.customer_id, row.product_id,
                Math.round(avgDays * 10) / 10,
                lastDate.toISOString().split('T')[0],
                predictedNext.toISOString().split('T')[0],
                daysUntil
            );
        });
    })();
}

function getBurnrateAlerts(daysAhead = 2) {
    if (!isSembahyangMode()) return [];
    return db.prepare(`
        SELECT bp.*,
               c.name AS customer_name, c.phone AS customer_phone,
               p.name AS product_name, p.price_retail AS product_price
        FROM burnrate_predictions bp
        JOIN customers c ON c.id = bp.customer_id
        JOIN products p ON p.id = bp.product_id
        WHERE bp.days_until_stockout <= ?
          AND bp.days_until_stockout >= 0
        ORDER BY bp.days_until_stockout ASC
        LIMIT 20
    `).all(daysAhead);
}

// ============================================================
// FITUR 7: APRIORI BUNDLING (query dari tabel, kalkulasi di DS Engine)
// ============================================================

function getBundlingSuggestions(productId, limit = 3) {
    if (!isSembahyangMode()) return [];
    return db.prepare(`
        SELECT ar.*,
               p.name AS suggested_product_name,
               p.price_retail AS suggested_product_price,
               p.stock_pcs AS stock_qty,
               ar.confidence_pct
        FROM apriori_rules ar
        JOIN products p ON p.id = ar.item_b_id
        WHERE ar.item_a_id = ?
          AND p.stock_pcs > 0
        ORDER BY ar.confidence_pct DESC, ar.lift DESC
        LIMIT ?
    `).all(productId, limit);
}

// ============================================================
// FITUR 8: RFM MATRIX (query dari tabel, kalkulasi di DS Engine)
// ============================================================

function getCustomerRFMProfile(customerId) {
    if (!isSembahyangMode()) return null;
    return db.prepare(`
        SELECT rfm.*, c.name, c.phone
        FROM customer_rfm rfm
        JOIN customers c ON c.id = rfm.customer_id
        WHERE rfm.customer_id = ?
    `).get(customerId);
}

function getRFMSummary() {
    if (!isSembahyangMode()) return [];
    return db.prepare(`
        SELECT
            rfm.rfm_label,
            COUNT(*) AS count,
            AVG(rfm.monetary) AS avg_monetary
        FROM customer_rfm rfm
        GROUP BY rfm.rfm_label
        ORDER BY avg_monetary DESC
    `).all();
}

// ============================================================
// BACKGROUND JOBS (dipanggil saat openSession)
// ============================================================

function runSembahyangStartupJobs() {
    if (!isSembahyangMode()) return;

    const anchorCount = parseInt(
        db.prepare("SELECT value FROM settings WHERE key='sembahyang_anchor_item_count'")
          .get()?.value || '10'
    );

    try { computeAndSetAnchorItems(anchorCount); } catch(e) {}
    try { computeBurnratePredictions(); } catch(e) {}
    // Apriori + RFM kalkulasi berat → delegasi ke LingLingDataScience.js
}

module.exports = {
    isSembahyangMode,
    computeAndSetAnchorItems, getAnchorItems,
    getLunarDate,
    getCustomerCreditScore,
    getSeasonalMarkdownAlerts, getMarkdownRecommendation,
    getVoidAnomalyForSession,
    computeBurnratePredictions, getBurnrateAlerts,
    getBundlingSuggestions,
    getCustomerRFMProfile, getRFMSummary,
    runSembahyangStartupJobs,
};

'use strict';
const log = require('electron-log');

const alterStatements = [
    'ALTER TABLE products ADD COLUMN is_anchor_item INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE products ADD COLUMN margin_target_pct REAL',
    'ALTER TABLE products ADD COLUMN event_tag TEXT',
    'ALTER TABLE products ADD COLUMN event_end_date TEXT',
];

const createStatements = [
    `CREATE TABLE IF NOT EXISTS apriori_rules (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        item_a_id       INTEGER NOT NULL REFERENCES products(id),
        item_b_id       INTEGER NOT NULL REFERENCES products(id),
        support         REAL NOT NULL DEFAULT 0.0,
        confidence_pct  INTEGER NOT NULL,
        lift            REAL NOT NULL DEFAULT 1.0,
        computed_at     TEXT DEFAULT (datetime('now','localtime')),
        CHECK(item_a_id != item_b_id)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_apriori_item_a ON apriori_rules(item_a_id)',
    `CREATE TABLE IF NOT EXISTS customer_rfm (
        customer_id  INTEGER PRIMARY KEY REFERENCES customers(id),
        recency_days INTEGER NOT NULL,
        frequency    INTEGER NOT NULL,
        monetary     INTEGER NOT NULL,
        rfm_score    REAL NOT NULL,
        rfm_label    TEXT NOT NULL CHECK(rfm_label IN (
                         'vip','loyal','potential','at_risk','churned'
                     )),
        computed_at  TEXT DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS burnrate_predictions (
        id                        INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id               INTEGER NOT NULL REFERENCES customers(id),
        product_id                INTEGER NOT NULL REFERENCES products(id),
        avg_days_between_purchase REAL NOT NULL,
        last_purchase_date        TEXT NOT NULL,
        predicted_next_purchase   TEXT NOT NULL,
        days_until_stockout       INTEGER NOT NULL,
        computed_at               TEXT DEFAULT (datetime('now','localtime')),
        UNIQUE(customer_id, product_id)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_burnrate_days ON burnrate_predictions(days_until_stockout)',
    `CREATE TABLE IF NOT EXISTS void_anomaly_log (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        cashier_session_id INTEGER NOT NULL REFERENCES cashier_sessions(id),
        user_id            INTEGER REFERENCES users(id),
        void_count         INTEGER NOT NULL,
        void_total_value   INTEGER NOT NULL,
        anomaly_flag       INTEGER NOT NULL DEFAULT 0,
        threshold_used     INTEGER NOT NULL,
        created_at         TEXT DEFAULT (datetime('now','localtime'))
    )`,
];

const settingsInserts = [
    "INSERT OR IGNORE INTO settings (key,value) VALUES ('sembahyang_lunar_display','1')",
    "INSERT OR IGNORE INTO settings (key,value) VALUES ('sembahyang_apriori_min_support','0.1')",
    "INSERT OR IGNORE INTO settings (key,value) VALUES ('sembahyang_apriori_min_confidence','0.5')",
    "INSERT OR IGNORE INTO settings (key,value) VALUES ('sembahyang_burnrate_days_ahead','2')",
    "INSERT OR IGNORE INTO settings (key,value) VALUES ('sembahyang_anchor_item_count','10')",
    "INSERT OR IGNORE INTO settings (key,value) VALUES ('sembahyang_void_anomaly_threshold','5')",
];

function applySembahyangMigration(db) {
    log.info('[MIGRATION] Starting Sembahyang Module Migration...');

    for (const sql of alterStatements) {
        try {
            db.exec(sql);
            console.log('OK:', sql.substring(0, 60));
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('SKIP (sudah ada):', sql.substring(0, 60));
            } else {
                console.error('ERROR:', err.message);
                log.error(`[MIGRATION] Alter error: ${err.message}`);
            }
        }
    }

    for (const sql of [...createStatements, ...settingsInserts]) {
        try {
            db.exec(sql);
            console.log('OK:', sql.substring(0, 60));
        } catch (err) {
            console.error('ERROR:', err.message);
            log.error(`[MIGRATION] Create/Insert error: ${err.message}`);
        }
    }

    log.info('[MIGRATION] Sembahyang migration selesai.');
}

// Support standalone run
if (require.main === module) {
    const db = require('../db.cjs');
    applySembahyangMigration({
        exec: (sql) => db.exec(sql)
    });
}

module.exports = { applySembahyangMigration };

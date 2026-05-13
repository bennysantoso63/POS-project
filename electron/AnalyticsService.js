const db = require('../src/db/db.cjs');
const log = require('electron-log');
const LingLingDataScience = require('./LingLingDataScience.js');

/**
 * AnalyticsService: Reactive Data Pipeline Engine
 * Menjalankan kalkulasi RFM & Apriori secara asinkron di latar belakang.
 */
class AnalyticsService {
    constructor() {
        this.interval = null;
        this.isProcessing = false;
        this.checkIntervalMs = 10 * 60 * 1000; // 10 Menit
    }

    start() {
        if (this.interval) return;
        
        log.info('[ANALYTICS] Background Worker Started.');
        
        // Cek segera saat startup, lalu setiap interval
        setTimeout(() => this.processQueue(), 5000); 
        this.interval = setInterval(() => this.processQueue(), this.checkIntervalMs);
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // 1. Cek apakah ada pekerjaan PENDING
            const pendingJobs = db.prepare("SELECT id FROM analytics_job_queue WHERE status = 'PENDING'").all();
            
            if (pendingJobs.length > 0) {
                log.info(`[ANALYTICS] Memulai Microbatch: Memproses ${pendingJobs.length} transaksi baru.`);

                // 2. Tandai sebagai PROCESSING (Atomic)
                db.transaction(() => {
                    const stmt = db.prepare("UPDATE analytics_job_queue SET status = 'PROCESSING' WHERE status = 'PENDING'");
                    stmt.run();
                })();

                // 3. Eksekusi Model Data Science (Matematika Berat)
                // Kita jalankan kalkulasi global berdasarkan data terbaru di database
                log.info('[ANALYTICS] Menghitung ulang model RFM & Association Rules...');
                
                await LingLingDataScience.recalculateRFM();
                await LingLingDataScience.recalculateApriori();

                // 4. Tandai sebagai COMPLETED
                db.transaction(() => {
                    const stmt = db.prepare("UPDATE analytics_job_queue SET status = 'COMPLETED' WHERE status = 'PROCESSING'");
                    stmt.run();
                })();

                log.info('[ANALYTICS] Microbatch selesai. Dashboard & Kasir telah ter-update.');
            }
        } catch (error) {
            log.error(`[ANALYTICS ERROR] Kegagalan Pipeline: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

module.exports = new AnalyticsService();

const db = require('../db.js');
const { processSyncQueue, syncFromCloud } = require('./cloudSync');

/**
 * [SPEC] CLIENT SYNC MANAGER - ENTERPRISE ORCHESTRATOR
 * Lokasi: src/db/queries/syncManager.js
 */

let syncStatus = {
    lastPush: null,
    lastPull: null,
    isOnline: false,
    errorCount: 0
};

/**
 * [INF] Heartbeat: Cek ketersediaan server sebelum memproses antrean.
 */
async function checkCloudConnectivity() {
    const rows = db.prepare('SELECT key, value FROM settings WHERE key = "cloud_url"').all();
    const url = rows.find(r => r.key === 'cloud_url')?.value;
    
    if (!url) return false;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Gunakan HEAD request untuk efisiensi bandwidth
        const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        return true; // Jika tidak melempar error, anggap server reachable
    } catch (e) {
        return false;
    }
}

/**
 * [CORE] Layanan Sinkronisasi Latar Belakang.
 */
function startSyncService() {
    console.log("[SYNC] Enterprise Orchestrator active.");

    // 1. PUSH SERVICE (5 Menit)
    setInterval(async () => {
        const online = await checkCloudConnectivity();
        syncStatus.isOnline = online;

        if (online) {
            try {
                await processSyncQueue();
                syncStatus.lastPush = new Date().toISOString();
                syncStatus.errorCount = 0;
            } catch (e) {
                syncStatus.errorCount++;
                console.error("[Sync Manager] Push failed:", e.message);
            }
        }
    }, 5 * 60 * 1000);

    // 2. PULL SERVICE (15 Menit)
    setInterval(async () => {
        if (syncStatus.isOnline) {
            try {
                await syncFromCloud();
                syncStatus.lastPull = new Date().toISOString();
            } catch (e) {
                console.error("[Sync Manager] Pull failed:", e.message);
            }
        }
    }, 15 * 60 * 1000);
}

/**
 * [NEW] Trigger Manual Sync dari UI.
 */
async function forceSyncNow() {
    const isReady = await checkCloudConnectivity();
    syncStatus.isOnline = isReady;

    if (!isReady) throw new Error("Cloud Server tidak dapat dijangkau.");
    
    await processSyncQueue();
    await syncFromCloud();
    
    syncStatus.lastPush = new Date().toISOString();
    syncStatus.lastPull = new Date().toISOString();

    return {
        success: true,
        timestamp: syncStatus.lastPush
    };
}

function getSyncHealth() {
    return { ...syncStatus };
}

/**
 * [NEW] Trigger Sinkronisasi Spesifik (Push/Pull)
 */
async function syncCloud({ direction }) {
    const isReady = await checkCloudConnectivity();
    syncStatus.isOnline = isReady;

    if (!isReady) throw new Error("Cloud Server tidak dapat dijangkau.");

    if (direction === 'push') {
        await processSyncQueue();
        syncStatus.lastPush = new Date().toISOString();
    } else if (direction === 'pull') {
        await syncFromCloud();
        syncStatus.lastPull = new Date().toISOString();
    }

    return { success: true, timestamp: new Date().toISOString() };
}

module.exports = { 
    startSyncService, 
    forceSyncNow, 
    syncCloud,
    getSyncHealth 
};

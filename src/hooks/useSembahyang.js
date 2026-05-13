import { useState, useEffect, useCallback } from 'react';

/**
 * [TASK S6] SEMBAHYANG INTELLIGENCE HOOK
 * Lokasi: src/hooks/useSembahyang.js
 * Deskripsi: Menghubungkan UI React dengan jalur IPC Backend secara reaktif.
 * Digunakan untuk mengambil data RFM, Apriori, dan Burn Rate dari SQLite.
 */

export function useSembahyang() {
    const [rfmData, setRfmData] = useState([]);
    const [aprioriRules, setAprioriRules] = useState([]);
    const [burnRate, setBurnRate] = useState([]);
    const [bigBangData, setBigBangData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Refresh semua data intelijen dari SQLite
    const refreshIntelligence = useCallback(async () => {
        if (!window.api || !window.api.intelligence) {
            console.warn("[Hook] API Intelligence belum terdaftar di preload.cjs");
            return;
        }
        
        setLoading(true);
        try {
            const [rfm, apriori, burn, bigbang] = await Promise.all([
                window.api.intelligence.getRFM(),
                window.api.intelligence.getApriori(),
                window.api.intelligence.getBurnRate(),
                window.api.intelligence.getBigBang()
            ]);
            
            setRfmData(rfm || []);
            setAprioriRules(apriori || []);
            setBurnRate(burn || []);
            setBigBangData(bigbang || []);
        } catch (error) {
            console.error("[Hook Error] Gagal memuat data intelligence:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Tanya asisten Ling-Ling (NLP Interface)
    const askLingLing = async (question) => {
        if (!window.api?.intelligence?.chat) return "Sistem AI tidak terdeteksi (Preload Bridge missing).";
        try {
            return await window.api.intelligence.chat(question);
        } catch (e) {
            console.error("[Chat Error]", e);
            return "Maaf, sistem sedang mengalami kendala teknis saat ini.";
        }
    };

    // Jalankan refresh saat hook pertama kali dipasang
    useEffect(() => {
        refreshIntelligence();
    }, [refreshIntelligence]);

    return {
        rfmData,
        aprioriRules,
        burnRate,
        bigBangData,
        loading,
        refreshIntelligence,
        askLingLing
    };
}

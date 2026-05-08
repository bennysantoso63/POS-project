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
    const [loading, setLoading] = useState(false);

    // Refresh semua data intelijen dari SQLite
    const refreshIntelligence = useCallback(async () => {
        if (!window.api || !window.api.getSembahyangRFM) {
            console.warn("[Hook] API Intelligence belum terdaftar di preload.cjs");
            return;
        }
        
        setLoading(true);
        try {
            // Memanggil 3 query analitik secara paralel untuk efisiensi
            const [rfm, apriori, burn] = await Promise.all([
                window.api.getSembahyangRFM(),
                window.api.getSembahyangApriori(),
                window.api.getSembahyangBurnRate()
            ]);
            
            setRfmData(rfm || []);
            setAprioriRules(apriori || []);
            setBurnRate(burn || []);
        } catch (error) {
            console.error("[Hook Error] Gagal memuat data sembahyang:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Tanya asisten Ling-Ling (NLP Interface)
    const askLingLing = async (question) => {
        if (!window.api?.askLingLing) return "Sistem AI tidak terdeteksi (Preload Bridge missing).";
        try {
            return await window.api.askLingLing(question);
        } catch (e) {
            console.error("[Chat Error]", e);
            return "Maaf Bos, Ling-Ling sedang pusing (Database Error).";
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
        loading,
        refreshIntelligence,
        askLingLing
    };
}

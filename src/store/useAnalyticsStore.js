import { create } from 'zustand';

/**
 * AnalyticsStore: Lapisan Cache untuk Dashboard
 * Memastikan kalkulasi berat hanya dilakukan saat ada data baru.
 */
const useAnalyticsStore = create((set, get) => ({
  // State
  statsCache: null,
  isStatsStale: true, // Default true agar data di-fetch saat pertama kali dibuka
  lastUpdated: null,

  // Actions
  setStats: (stats) => set({ 
    statsCache: stats, 
    isStatsStale: false, 
    lastUpdated: new Date().toISOString() 
  }),

  /**
   * Invalidate Stats: Dipanggil setelah transaksi berhasil.
   * Menandai cache sebagai 'basi' sehingga Dashboard akan menghitung ulang.
   */
  invalidateStats: () => set({ isStatsStale: true }),

  /**
   * Get Cached Stats: Mengembalikan data jika masih segar.
   */
  getStats: () => {
    const { statsCache, isStatsStale } = get();
    return !isStatsStale ? statsCache : null;
  }
}));

export default useAnalyticsStore;

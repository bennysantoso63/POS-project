import { create } from 'zustand';

/**
 * useUIStore: LING-LING POS UI STATE ENGINE
 * Mengelola navigasi dan preferensi visual aplikasi untuk merampingkan App.jsx.
 */
const useUIStore = create((set) => ({
    // --- NAVIGASI ---
    activeView: 'cashier', // Default view
    setActiveView: (view) => set({ activeView: view }),

    // --- TEMA ---
    isDarkMode: true,
    toggleDarkMode: () => set((state) => {
        const nextMode = !state.isDarkMode;
        // Update class HTML secara sinkron untuk mencegah kedipan (flicker)
        if (nextMode) window.document.documentElement.classList.add('dark');
        else window.document.documentElement.classList.remove('dark');
        return { isDarkMode: nextMode };
    }),

    // --- SIDEBAR & OVERLAYS ---
    isSidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    // --- MODAL & GLOBAL OVERLAYS ---
    activeModal: null,
    setActiveModal: (modalId) => set({ activeModal: modalId }),
    closeModal: () => set({ activeModal: null }),
}));

export default useUIStore;

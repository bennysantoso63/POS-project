import { create } from 'zustand';

export const useSessionStore = create((set) => ({
    activeSession: null,
    isSessionActive: false,
    setSession: (session) => set({ activeSession: session, isSessionActive: true }),
    clearSession: () => set({ activeSession: null, isSessionActive: false }),
}));

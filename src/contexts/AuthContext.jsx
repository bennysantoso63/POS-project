import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useSessionStore } from '../store/useSessionStore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { clearSession } = useSessionStore();

  const checkSetup = useCallback(async () => {
    if (!window.api || typeof window.api.checkSetup !== 'function') {
      setIsLoading(false);
      return;
    }
    try {
      const res = await window.api.checkSetup();
      setNeedsSetup(res);
    } catch (err) {
      console.error("Setup Check Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (pin) => {
    try {
      const res = await window.api?.login(pin);
      if (res?.success) {
        setCurrentUser(res.user);
        toast.success(`Selamat datang, ${res.user.username}`);
        return { success: true, user: res.user };
      } else {
        const errorMsg = res?.error || "PIN Salah!";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('[AuthContext] Login IPC Error:', err);
      const errorMsg = err?.message || 'Koneksi ke server gagal.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(() => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      setCurrentUser(null);
      clearSession();
    }
  }, [clearSession]);

  // --- AUTO-LOGOUT ENGINE ---
  useEffect(() => {
    if (!currentUser) return;
    let timeout;
    let lastReset = 0;

    const resetTimer = () => {
      const now = Date.now();
      if (now - lastReset < 5000) return;
      lastReset = now;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        setCurrentUser(null);
        clearSession();
        toast("Session Expired: Security Auto-Lock Engaged", { icon: '🔒' });
      }, 15 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [currentUser, clearSession]);

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  // Memoize roles for performance
  const roles = useMemo(() => ({
    isOwner: currentUser?.role === 'owner',
    isManager: currentUser?.role === 'manager' || currentUser?.role === 'admin',
    isKasir: currentUser?.role === 'cashier',
    role: currentUser?.role?.toUpperCase() || 'GUEST'
  }), [currentUser]);

  const value = useMemo(() => ({
    currentUser,
    needsSetup,
    isLoading,
    login,
    logout,
    ...roles,
    setNeedsSetup
  }), [currentUser, needsSetup, isLoading, login, logout, roles]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

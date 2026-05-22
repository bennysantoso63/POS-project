import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Cloud, Bell, Search, Monitor, BarChart, 
  Box, Power, Clock, ShieldCheck, Zap
} from 'lucide-react';

export default function CockpitLayout({ children, userRole, terminalName, onTabChange, products = [] }) {
  // --- STATE MANAGEMENT ---
  const [time, setTime] = useState(new Date());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulasi state status (Nanti dihubungkan ke State Global)
  const [syncStatus, setSyncStatus] = useState('SUCCESS');
  const stockAlerts = products.filter(p => p.stock_pcs <= (p.low_stock_threshold ?? 5)).length;
  const [isDbSaving, setIsDbSaving] = useState(false);

  const searchInputRef = useRef(null);

  // --- EFEK: JAM DIGITAL & SHORTCUT CTRL+K ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Autofocus input saat Command Palette terbuka
  useEffect(() => {
    if (isCommandPaletteOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Simulasi Micro-Interaction DB Save (Trigger setiap 15 detik untuk demo)
  useEffect(() => {
    const simulateDbSave = setInterval(() => {
      setIsDbSaving(true);
      setTimeout(() => setIsDbSaving(false), 1200);
    }, 15000);
    return () => clearInterval(simulateDbSave);
  }, []);

  const handleCommand = (tabId) => {
    onTabChange(tabId);
    setIsCommandPaletteOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-brand-bg text-brand-text font-sans overflow-hidden selection:bg-brand-primary/30">
      
      {/* 2. TOP NAVIGATION "STATUS HUB" (The Nervous System) */}
      <header className="flex-none h-12 bg-brand-card/50 backdrop-blur-md border-b border-brand-border/40 flex items-center justify-between px-6 text-[10px] z-[700]">
        {/* Kiri: Identitas Terminal & Waktu Presisi */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-brand-bg/50 px-3 py-1.5 rounded-xl border border-brand-border/50 shadow-inner">
            <Terminal className="w-3.5 h-3.5 text-brand-primary" />
            <span className="font-black tracking-wider text-brand-muted">
              {terminalName || 'Node-01'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-brand-muted font-bold tracking-widest border-l border-brand-border pl-6">
            <Clock size={12} className="opacity-40"/>
            <span>
              {time.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Kanan: Cluster Status */}
        <div className="flex items-center gap-6">
          {/* Alert Indicator */}
          <div 
            onClick={() => handleCommand('dashboard')}
            className="relative flex items-center p-2 rounded-xl hover:bg-brand-bg/50 cursor-pointer transition-all active:scale-90 group" 
            title="Sistem Inventory Alerts"
          >
            <Bell className={`w-4 h-4 ${stockAlerts > 0 ? 'text-amber-500' : 'text-brand-muted'} group-hover:rotate-12 transition-transform`} />
            {stockAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow-lg shadow-rose-500/40">
                {stockAlerts}
              </span>
            )}
          </div>

          {/* User Badge dengan Border Gradient */}
          <div className="flex items-center gap-3 pl-6 border-l border-brand-border">
            <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-brand-primary via-brand-accent to-emerald-500 shadow-lg shadow-brand-primary/10">
              <div className="bg-brand-card px-4 py-1 rounded-[10px] text-[9px] font-black tracking-wider text-brand-text">
                {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase() : 'Cashier'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* WORKSPACE UTAMA */}
      <main className="flex-1 overflow-hidden relative flex">
        {children}
      </main>

      {/* 3. "SAVING..." MICRO-INTERACTION (Data Security Feedback) */}
      <div className={`fixed bottom-8 right-8 z-[1000] flex items-center gap-4 px-5 py-3 rounded-2xl bg-brand-card/80 border border-brand-primary/30 backdrop-blur-xl shadow-2xl transition-all duration-500 transform ${isDbSaving ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-90 pointer-events-none'}`}>
        <div className="relative">
            <div className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-ping absolute inset-0" />
            <div className="w-2.5 h-2.5 bg-brand-primary rounded-full relative z-10 shadow-[0_0_10px_var(--brand-primary)]" />
        </div>
        <span className="text-[10px] font-black text-brand-primary tracking-[0.2em] uppercase">Local DB Secured</span>
      </div>

      {/* 1. COMMAND PALETTE (Spotlight Search Modal) */}
      {isCommandPaletteOpen && (
        <div 
          className="fixed inset-0 z-[1001] flex items-start justify-center pt-[12vh] bg-brand-bg/60 backdrop-blur-xl animate-in fade-in duration-300 px-6"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          {/* Modal Container */}
          <div 
            className="w-full max-w-2xl bg-brand-card/90 border-2 border-brand-border/50 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Area */}
            <div className="flex items-center px-8 py-7 border-b border-brand-border bg-brand-bg/40">
              <Search className="w-6 h-6 text-brand-primary mr-6 drop-shadow-[0_0_12px_rgba(var(--brand-primary-rgb),0.6)]" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Ketik perintah (Cari Produk, Pindah Tab, atau Tutup Shift)..."
                className="flex-1 bg-transparent text-xl font-bold text-brand-text outline-none placeholder:text-brand-muted/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex items-center gap-2">
                 <span className="text-[10px] text-brand-muted font-black border border-brand-border px-3 py-1.5 rounded-xl uppercase tracking-widest bg-brand-bg/50">ESC</span>
              </div>
            </div>

            {/* Hasil Pencarian Pintar (Smart Categories) */}
            <div className="p-4 max-h-[55vh] overflow-y-auto custom-scrollbar">
              
              {/* Kategori: Navigasi Cepat */}
              <div className="mb-6">
                <div className="px-5 py-2 text-[9px] font-black text-brand-muted tracking-[0.3em] uppercase opacity-50 mb-2 flex items-center gap-3">
                   <Zap size={10} className="text-brand-primary"/> Navigasi Cepat
                </div>
                <button 
                  onClick={() => handleCommand('cashier')}
                  className="w-full text-left px-5 py-4 rounded-[1.5rem] flex items-center gap-4 hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary transition-all group border border-transparent hover:border-brand-primary/20"
                >
                  <div className="p-2 bg-brand-bg rounded-xl border border-brand-border group-hover:border-brand-primary/30 transition-colors">
                    <Monitor size={18} />
                  </div>
                  <span className="font-black text-sm tracking-tight">Buka Layar Kasir</span>
                </button>
                <button 
                   onClick={() => handleCommand('dashboard')}
                   className="w-full text-left px-5 py-4 rounded-[1.5rem] flex items-center gap-4 hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary transition-all group border border-transparent hover:border-brand-primary/20"
                >
                  <div className="p-2 bg-brand-bg rounded-xl border border-brand-border group-hover:border-brand-primary/30 transition-colors">
                    <BarChart size={18} />
                  </div>
                  <span className="font-black text-sm tracking-tight">Analisa Dashboard Penjualan</span>
                </button>
              </div>

              {/* Kategori: Produk & Inventory */}
              <div className="mb-6">
                <div className="px-5 py-2 text-[9px] font-black text-brand-muted tracking-[0.3em] uppercase opacity-50 mb-2 flex items-center gap-3">
                   <Box size={10} className="text-emerald-500"/> Pencarian Produk
                </div>
                <button 
                   onClick={() => handleCommand('inventory')}
                   className="w-full text-left px-5 py-4 rounded-[1.5rem] flex items-center justify-between hover:bg-emerald-500/10 text-brand-muted hover:text-emerald-500 transition-all group border border-transparent hover:border-emerald-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-bg rounded-xl border border-brand-border group-hover:border-emerald-500/30">
                       <Box size={18} />
                    </div>
                    <span className="text-sm font-bold text-brand-text group-hover:text-emerald-500 transition-colors">Cek Stok Barang</span>
                  </div>
                  <span className="text-[10px] font-black bg-brand-bg px-3 py-1 rounded-lg border border-brand-border">TAB</span>
                </button>
              </div>

              {/* Kategori: Aksi Sistem */}
              <div>
                <div className="px-5 py-2 text-[9px] font-black text-brand-muted tracking-[0.3em] uppercase opacity-50 mb-2 flex items-center gap-3">
                   <ShieldCheck size={10} className="text-rose-500"/> Kendali Sistem
                </div>
                <button className="w-full text-left px-5 py-4 rounded-[1.5rem] flex items-center gap-4 hover:bg-rose-500/10 text-brand-muted hover:text-rose-500 transition-all group border border-transparent hover:border-rose-500/20">
                  <div className="p-2 bg-brand-bg rounded-xl border border-brand-border group-hover:border-rose-500/30">
                    <Power size={18} className="opacity-50" />
                  </div>
                  <span className="font-black text-sm tracking-tight">Tutup Shift & Cetak Laporan</span>
                </button>
                <button 
                   onClick={() => handleCommand('sync')}
                   className="w-full text-left px-5 py-4 rounded-[1.5rem] flex items-center gap-4 hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary transition-all group border border-transparent hover:border-brand-primary/20"
                >
                  <div className="p-2 bg-brand-bg rounded-xl border border-brand-border group-hover:border-brand-primary/30">
                    <Cloud size={18} className="opacity-50" />
                  </div>
                  <span className="font-black text-sm tracking-tight">Paksa Sinkronisasi Cloud</span>
                </button>
              </div>

            </div>
            
            {/* Footer / Helper */}
            <div className="px-8 py-4 bg-brand-bg/50 border-t border-brand-border flex items-center justify-between">
               <p className="text-[8px] font-black text-brand-muted uppercase tracking-[0.2em] opacity-40">Ling-Ling Core Command Engine v2.5</p>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                     <span className="text-[8px] font-black text-brand-muted bg-brand-bg border border-brand-border px-2 py-0.5 rounded">↑↓</span>
                     <span className="text-[8px] font-bold text-brand-muted opacity-40">PILIH</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <span className="text-[8px] font-black text-brand-muted bg-brand-bg border border-brand-border px-2 py-0.5 rounded">ENTER</span>
                     <span className="text-[8px] font-bold text-brand-muted opacity-40">KONFIRMASI</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

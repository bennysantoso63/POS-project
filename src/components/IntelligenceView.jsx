import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, ShieldAlert, Lock, Flame, Users, 
  TrendingUp, AlertCircle, Sparkles, Shield, Activity, RefreshCw
} from 'lucide-react';
import LingLingChat from './LingLingChat';
import toast from 'react-hot-toast';

export default function IntelligenceView({ 
  currentUser, 
  transactions = [], 
  products = [], 
  customers = [],
  rfmData = [],
  aprioriRules = [],
  burnRate = [],
  bigBangData = []
}) {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'chat'

  const handleRecalculate = async () => {
    const loading = toast.loading('Menganalisa data transaksi...');
    try {
      await window.api.intelligence.recalculate();
      toast.success('Analisa Selesai. Data terbaru sudah siap.', { id: loading });
      // Di dunia nyata, kita perlu memicu refresh data di App.jsx
      window.location.reload(); 
    } catch (e) {
      toast.error('Gagal memperbarui analisa', { id: loading });
    }
  };

  // RBAC Guard
  if (currentUser?.role !== 'owner' &&
      currentUser?.role !== 'admin' &&
      currentUser?.role !== 'manager') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-brand-bg text-brand-text">
        <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl">
          <ShieldAlert className="w-10 h-10 text-rose-500"/>
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-4">Akses <span className="text-rose-500">Terbatas</span></h2>
        <p className="text-brand-muted font-bold max-w-sm text-[10px] tracking-widest opacity-60">
          Modul analitik strategis dan asisten AI Ling-Ling hanya dapat diakses oleh Pemilik Bisnis.
        </p>
      </div>
    );
  }

  if (view === 'chat') {
    return (
      <div className="h-full relative">
        <button 
          onClick={() => setView('dashboard')}
          className="absolute left-8 top-8 z-50 p-4 bg-brand-card border border-brand-border rounded-2xl text-brand-muted hover:text-brand-primary transition-all flex items-center gap-3 font-bold text-[10px] tracking-widest"
        >
          <Activity size={16} /> Kembali ke Dasbor
        </button>
        <LingLingChat 
          transactions={transactions} 
          products={products} 
          customers={customers} 
          rfmData={rfmData}
          aprioriData={aprioriRules}
          burnRateData={burnRate}
          bigBangData={bigBangData}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-brand-bg p-8 lg:p-14 overflow-y-auto custom-scrollbar">
       <header className="mb-14 flex justify-between items-end">
           <div>
              <div className="flex items-center gap-3 mb-4">
                 <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-xl tracking-widest border border-brand-primary/20">
                   <Sparkles className="w-3 h-3 inline mr-2"/> AI Ling-Ling Aktif
                 </span>
              </div>
              <h1 className="text-5xl font-bold tracking-tighter leading-none">Sistem <span className="text-brand-primary">Ling-Ling</span></h1>
              <p className="text-brand-muted mt-4 font-bold text-[10px] tracking-widest opacity-70">Pusat analisa & prediksi bisnis</p>
           </div>
          <div className="flex gap-4">
            <button 
              onClick={handleRecalculate}
              className="px-8 py-5 bg-brand-card border border-brand-border text-brand-text rounded-[2rem] font-bold text-[10px] tracking-widest flex items-center gap-4 hover:border-brand-primary transition-all active:scale-95"
            >
              <RefreshCw size={18} /> Perbarui Analisa
            </button>
            <button 
              onClick={() => setView('chat')}
              className="px-10 py-5 bg-brand-primary text-white rounded-[2rem] font-bold text-[12px] tracking-widest flex items-center gap-4 hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/30 active:scale-95"
            >
              <BrainCircuit size={20} /> Buka Obrolan Ling-Ling
            </button>
          </div>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* 1. SEMBAHYANG BIG BANG */}
          <div className="lg:col-span-2 bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                <Flame size={120} className="text-brand-primary" />
              </div>
              <h3 className="text-[11px] font-bold text-brand-primary tracking-widest mb-10 flex items-center gap-4">
                <Flame className="w-6 h-6"/> Prediksi Hari Raya (Sembahyang)
              </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                 {bigBangData.length > 0 ? bigBangData.map((ev, i) => (
                  <div key={i} className="bg-brand-card p-6 rounded-[2.5rem] border border-brand-border/50 hover:border-brand-primary transition-all">
                     <p className="text-[9px] font-bold text-brand-muted tracking-widest mb-2 opacity-50">{ev.gregorian_date}</p>
                     <p className="text-lg font-bold text-brand-text mb-1 tracking-tighter leading-tight">{ev.ritual_name}</p>
                     <p className="text-[10px] font-bold text-brand-primary tracking-widest mb-4">Lunar: {ev.lunar_date}</p>
                     <div className="w-full bg-brand-bg h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-primary h-full transition-all duration-1000" style={{ width: `${ev.intensity_score * 10}%` }} />
                     </div>
                     <p className="text-[8px] font-bold text-brand-muted tracking-widest mt-2 text-right">Intensitas {ev.intensity_score}/10</p>
                  </div>
                )) : (
                  <div className="col-span-3 py-10 text-center border-2 border-dashed border-brand-border/50 rounded-[2.5rem] opacity-30">
                     <p className="font-bold text-[10px] tracking-widest">Belum ada perayaan besar dalam waktu dekat</p>
                  </div>
                )}
             </div>
          </div>

          {/* 2. RFM SNAPSHOT */}
           <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[3.5rem] p-10 shadow-sm">
             <h3 className="text-[11px] font-bold text-brand-accent tracking-widest mb-10 flex items-center gap-4">
               <Users className="w-6 h-6"/> Pelanggan Prioritas (VIP)
             </h3>
             <div className="space-y-6">
                 {rfmData.filter(c => c.totalSpent > 500000).slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center gap-5 p-4 bg-brand-card rounded-3xl border border-brand-border/50">
                     <div className="w-12 h-12 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent font-bold text-lg">
                        {c.name.charAt(0)}
                     </div>
                     <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-bold text-brand-text tracking-widest truncate">{c.name}</p>
                        <p className="text-[9px] font-bold text-brand-muted tracking-widest opacity-60">Total Belanja: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(c.totalSpent)}</p>
                     </div>
                     <span className={`px-3 py-1 rounded-full text-[8px] font-bold tracking-widest ${c.color}`}>
                        {c.badge.split(' ')[1]}
                     </span>
                  </div>
                ))}
             </div>
          </div>

          {/* 3. BURN RATE RADAR */}
           <div className="lg:col-span-3 bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[4rem] p-12 shadow-sm">
             <div className="flex justify-between items-start mb-10">
                <h3 className="text-[11px] font-bold text-rose-500 tracking-widest flex items-center gap-4">
                  <AlertCircle className="w-6 h-6"/> Analisa Kecepatan Penjualan & Stok
                </h3>
                <span className="text-[9px] font-bold text-rose-500 tracking-widest bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">Perhatian: Stok Menipis</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 {burnRate.length > 0 ? burnRate.slice(0, 4).map((p, i) => (
                  <div key={i} className="relative p-6 bg-brand-card rounded-[2.5rem] border border-brand-border/50 hover:border-rose-500/50 transition-all group">
                     <p className="text-[10px] font-bold text-brand-muted tracking-widest mb-3 opacity-60 truncate">{p.name}</p>
                     <div className="flex items-end gap-3 mb-4">
                        <span className="text-4xl font-black text-rose-500 tracking-tighter">{p.daysLeft}</span>
                        <span className="text-[10px] font-bold text-brand-muted tracking-widest mb-1.5">Sisa Hari</span>
                     </div>
                     <div className="w-full bg-brand-bg h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full" style={{ width: `${Math.max(10, (p.daysLeft / 30) * 100)}%` }} />
                     </div>
                     <p className="text-[8px] font-bold text-brand-muted tracking-widest mt-3">Terjual: {p.daily_velocity?.toFixed(2)} pcs/hari</p>
                  </div>
                )) : (
                  <div className="col-span-4 py-14 text-center border-2 border-dashed border-brand-border/50 rounded-[3rem] opacity-30">
                     <p className="font-bold text-[12px] tracking-widest">Stok aman. Tidak ada peringatan kehabisan barang.</p>
                  </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}


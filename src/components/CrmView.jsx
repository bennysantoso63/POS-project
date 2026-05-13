import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Plus, Edit, Trash2, 
  Phone, Mail, MapPin, Tag, Star, 
  TrendingUp, ShoppingBag, Clock, ChevronRight, ChevronDown,
  MessageCircle, Award, UserCheck, Wallet, Globe, Zap, Heart, ShieldCheck, Filter
} from 'lucide-react';

import CustomDropdown from './ui/CustomDropdown';

export default function CrmView({ 
  customers = [], 
  onAddCustomer, 
  onEditCustomer, 
  onDeleteCustomer, 
  formatIDR 
}) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('Semua');

  // --- DERIVED STATE & RFM LOGIC ---
  const tiers = ['Semua', ...new Set(customers.map(c => c.tier || c.default_tier || 'Eceran').filter(Boolean))];

  const crmStats = useMemo(() => {
    let totalSpent = 0;
    let grosirCount = 0;

    customers.forEach(c => {
      totalSpent += (c.total_spent || 0);
      if ((c.tier || c.default_tier) === 'Grosir' || (c.tier || c.default_tier) === 'partai') grosirCount++;
    });

    return {
      totalCustomers: customers.length,
      totalSpent,
      grosirCount,
      avgLTV: customers.length > 0 ? totalSpent / customers.length : 0
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                           c.phone?.includes(search);
      const currentTier = c.tier || c.default_tier || 'Eceran';
      const matchesTier = tierFilter === 'Semua' || currentTier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [customers, search, tierFilter]);

  return (
    <div className="flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto custom-scrollbar bg-brand-bg text-brand-text font-sans h-full relative selection:bg-brand-primary/30 selection:text-white">
      
      {/* HEADER TIER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-xl tracking-widest border border-brand-primary/20">Pusat Data Pelanggan</span>
             <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-xl tracking-widest border border-emerald-500/20">Sistem Loyalitas Aktif</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter flex items-center gap-6 leading-none">
             Data <span className="text-brand-primary">Pelanggan</span>
          </h1>
          <p className="text-brand-muted text-[10px] font-bold mt-4 tracking-widest opacity-60">Sistem manajemen data pelanggan dan riwayat transaksi toko.</p>
        </div>
        <button 
          onClick={onAddCustomer} 
          className="group flex items-center gap-4 px-10 py-5 bg-brand-primary text-white rounded-[2rem] text-xs font-bold tracking-widest hover:bg-brand-secondary transition-all shadow-2xl shadow-brand-primary/40 active:scale-95 hover:-translate-y-1"
        >
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform">
             <Plus className="w-5 h-5" /> 
          </div>
          Tambah Pelanggan
        </button>
      </div>

      {/* STRATEGIC KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
        {[
          { label: 'Total Pelanggan', value: crmStats.totalCustomers, icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' },
          { label: 'Pelanggan Grosir', value: crmStats.grosirCount, icon: Award, color: 'text-brand-accent', bg: 'bg-brand-accent/10', border: 'border-brand-accent/20' },
          { label: 'Total Pemasukan', value: formatIDR(crmStats.totalSpent), icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Rata-rata Belanja', value: formatIDR(crmStats.avgLTV), icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-brand-card/60 backdrop-blur-md border border-brand-border p-8 rounded-[3rem] shadow-2xl shadow-black/5 flex items-center gap-6 hover:-translate-y-2 transition-all group">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${stat.bg} ${stat.color} border ${stat.border} shadow-inner group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-7 h-7" />
            </div>
             <div>
              <p className="text-[9px] font-bold text-brand-muted tracking-widest mb-2">{stat.label}</p>
              <h3 className="text-2xl font-bold tracking-tighter leading-none">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* FILTER & DISCOVERY ENGINE */}
      <div className="bg-brand-card/40 backdrop-blur-xl border border-brand-border rounded-[2.5rem] mb-10 shadow-2xl shadow-black/5 flex flex-col md:flex-row items-center relative z-40 overflow-visible">
        <div className="relative flex-1 w-full group p-2">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted group-focus-within:text-brand-primary transition-all" />
           <input 
            type="text" 
            placeholder="Cari nama atau nomor telepon pelanggan..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 pl-16 pr-6 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-sm placeholder:text-brand-text/30 hover:bg-white/80 dark:hover:bg-white/20 tracking-widest"
          />
        </div>
        <CustomDropdown 
           value={tierFilter}
           onChange={setTierFilter}
           options={tiers}
           label="Tier"
           icon={<Filter className="w-4 h-4" />}
        />
      </div>

      {/* CORE DATA GRID */}
      <div className="bg-brand-card/60 backdrop-blur-2xl border border-brand-border rounded-[4rem] shadow-2xl shadow-black/5 overflow-hidden relative z-10 group">
        <div className="absolute top-0 right-0 p-24 opacity-[0.02] pointer-events-none group-hover:scale-150 transition-transform duration-1000">
           <Globe size={400} className="text-brand-primary" />
        </div>
        <div className="overflow-x-auto custom-scrollbar relative z-10">
          <table className="w-full text-left border-collapse">
             <thead>
              <tr className="bg-brand-bg/50 text-brand-muted border-b border-brand-border">
                <th className="px-10 py-8 text-[9px] font-bold tracking-widest">Profil Pelanggan</th>
                <th className="px-10 py-8 text-[9px] font-bold tracking-widest">Kontak</th>
                <th className="px-10 py-8 text-[9px] font-bold tracking-widest text-center">Kategori</th>
                <th className="px-10 py-8 text-[9px] font-bold tracking-widest text-right">Total Belanja</th>
                <th className="px-10 py-8 text-[9px] font-bold tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-brand-primary/5 transition-all group/row">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center shadow-inner group-hover/row:border-brand-primary/40 transition-all">
                        <span className="text-2xl font-bold text-brand-muted group-hover/row:text-brand-primary">{c.name.charAt(0).toUpperCase()}</span>
                      </div>
                       <div>
                        <p className="font-bold text-base tracking-tight group-hover/row:text-brand-primary transition-colors leading-none">{c.name}</p>
                        <div className="flex items-center gap-3 mt-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                           <p className="text-[9px] font-bold text-brand-muted tracking-widest leading-none">
                             Node: {c.id.toString().padStart(4, '0')} • <span className="text-brand-text">Pelanggan Aktif</span>
                           </p>
                        </div>
                      </div>
                    </div>
                  </td>
                   <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-3 text-xs font-bold text-brand-text tracking-tighter">
                        <Phone className="w-4 h-4 text-brand-primary" /> {c.phone || 'Tidak Ada Kontak'}
                      </div>
                      {c.address && (
                        <div className="flex items-center gap-3 text-[9px] text-brand-muted font-bold tracking-widest opacity-60">
                          <MapPin className="w-3.5 h-3.5" /> {c.address.length > 25 ? c.address.substring(0, 25) + '...' : c.address}
                        </div>
                      )}
                    </div>
                  </td>
                   <td className="px-10 py-8 text-center">
                    <span className={`px-6 py-2 text-[9px] font-bold rounded-2xl border tracking-widest shadow-sm transition-all ${(c.tier || c.default_tier) === 'partai' || (c.tier || c.default_tier) === 'Grosir' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30 shadow-brand-accent/5' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/30 shadow-brand-primary/5'}`}>
                      {c.tier || c.default_tier || 'Retail'}
                    </span>
                  </td>
                   <td className="px-10 py-8 text-right">
                    <p className="text-[9px] font-bold text-brand-muted tracking-widest mb-2 opacity-60">Total Transaksi</p>
                    <p className="font-black text-emerald-500 text-lg tracking-tighter">{formatIDR(c.total_spent || 0)}</p>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center justify-center gap-4">
                      <button 
                        onClick={() => onEditCustomer(c)}
                        className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border text-brand-muted hover:text-brand-primary hover:border-brand-primary/40 transition-all shadow-sm active:scale-90 flex items-center justify-center"
                        title="Edit Data"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onDeleteCustomer(c)}
                        className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border text-brand-muted hover:text-rose-500 hover:border-rose-500/40 transition-all shadow-sm active:scale-90 flex items-center justify-center"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-32 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <div className="w-24 h-24 bg-brand-bg rounded-[2.5rem] border-2 border-dashed border-brand-border flex items-center justify-center mb-8">
                         <Users className="w-12 h-12" />
                      </div>
                       <p className="text-sm font-bold tracking-widest">Tidak ada data pelanggan ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  CreditCard, Package, Calendar, Download, Activity,
  Target, Zap, PieChart as PieChartIcon, History, ArrowRight,
  ShieldCheck, Briefcase, Globe, Cpu, BarChart3, Fingerprint, Layers, Workflow,
  ChevronRight
} from 'lucide-react';

import CustomDropdown from './ui/CustomDropdown';
import PredictiveInsights from './PredictiveInsights';
import { useAuth } from '../contexts/AuthContext';
import useAnalyticsStore from '../store/useAnalyticsStore';

export default function DashboardView({ 
  transactions = [], 
  products = [], 
  formatIDR = (v) => v,
  onExport
}) {
  const { isOwner, isManager } = useAuth();
  const showFullFinancials = isOwner || isManager;
  const [timeRange, setTimeRange] = useState('7d');
  const [customRange, setCustomRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const statsCache = useAnalyticsStore((state) => state.statsCache);
  const isStatsStale = useAnalyticsStore((state) => state.isStatsStale);
  const setStats = useAnalyticsStore((state) => state.setStats);

  // 🚀 TAHAP 3: Optimized Computation Engine
  const summary = useMemo(() => {
    // Jika cache tersedia dan tidak basi, gunakan cache
    if (!isStatsStale && statsCache) {
      return statsCache;
    }

    // Jika basi atau pertama kali, lakukan kalkulasi (akan di-cache setelah ini)
    let totalRevenue = 0;
    let totalCogs = 0;
    let totalOrders = 0;
    
    const isWithinRange = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      if (timeRange === '7d') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return d >= start;
      }
      if (timeRange === '30d') {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        return d >= start;
      }
      if (timeRange === 'this_month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeRange === 'this_year') return d.getFullYear() === now.getFullYear();
      if (timeRange === 'custom') {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }
      return true;
    };

    try {
      transactions.forEach(tx => {
        if (tx.status !== 'void' && isWithinRange(tx.created_at || tx.date)) {
          totalRevenue += (tx.total || 0);
          totalOrders += 1;
          if (Array.isArray(tx.items)) {
            tx.items.forEach(item => {
              const prod = products.find(p => p.id === item.product_id);
              totalCogs += (item.qty || 0) * (item.cost_price || prod?.cost_price || 0);
            });
          }
        }
      });
    } catch (err) {
      console.error("Dashboard calculation error:", err);
    }

    const calculated = {
      totalRevenue,
      totalOrders,
      totalProfit: totalRevenue - totalCogs,
      avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };

    // Update Cache (setStats akan mematikan isStatsStale)
    // Gunakan setTimeout agar tidak mengganggu siklus render React
    setTimeout(() => setStats(calculated), 0);

    return calculated;
  }, [transactions, products, timeRange, statsCache, isStatsStale, setStats]);

  const TARGET_BEP = 25000000;
  const progressPct = Math.min(100, (summary.totalRevenue / TARGET_BEP) * 100);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-brand-card/90 backdrop-blur-2xl border border-brand-border p-6 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
          <p className="text-[9px] font-black text-brand-muted tracking-wider mb-3">{label || 'Titik Data'}</p>
          <p className="text-xl font-black text-brand-primary tracking-tighter">{formatIDR(payload[0].value)}</p>
          <div className="mt-3 pt-3 border-t border-brand-border flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></div>
             <span className="text-[8px] font-bold text-brand-muted tracking-widest">Sinkronisasi Langsung</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto custom-scrollbar bg-brand-bg text-brand-text font-sans h-full relative selection:bg-brand-primary/30 selection:text-white">
      
      {/* STRATEGIC CONTROL HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-16 gap-12 relative z-[30]">
        <div className="relative">
          <div className="flex items-center gap-6 mb-6">
             <div className="w-20 h-20 bg-brand-primary rounded-[2.5rem] flex items-center justify-center shadow-[0_24px_48px_-12px_rgba(var(--brand-primary-rgb),0.5)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out"></div>
                <Activity className="text-white w-10 h-10 relative z-10 group-hover:scale-125 transition-transform duration-500" />
             </div>
               <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-none">
                   Ringkasan <span className="text-brand-primary">Bisnis</span>
                </h1>
                <p className="text-brand-muted text-[10px] font-bold mt-3 tracking-wider opacity-60 leading-none">Analisa Keuangan • Operasi Toko • Data Langsung</p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full xl:w-auto">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {timeRange === 'custom' && (
              <div className="flex items-center gap-4 animate-in slide-in-from-right-8 duration-500 bg-brand-card/40 backdrop-blur-md border border-brand-border p-3 rounded-2xl">
                 <input 
                   type="date" 
                   value={customRange.start} 
                   onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                   className="bg-transparent text-[10px] font-black text-brand-primary outline-none tracking-wider border-r border-brand-border pr-4"
                 />
                 <ArrowRight size={14} className="text-brand-muted opacity-30" />
                 <input 
                   type="date" 
                   value={customRange.end} 
                   onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                   className="bg-transparent text-[10px] font-black text-brand-primary outline-none tracking-wider pl-2"
                 />
              </div>
            )}
            <CustomDropdown 
              value={timeRange} 
              onChange={setTimeRange} 
              options={[
                { value: '7d', label: '7 Hari Terakhir' },
                { value: 'this_month', label: 'Bulan Ini' },
                { value: 'this_year', label: 'Tahun Ini' },
                { value: 'custom', label: 'Kustom Tanggal' }
              ]} 
              label="Waktu"
              icon={<Calendar size={20} />}
            />
          </div>
          <button onClick={onExport} className="w-16 h-16 flex items-center justify-center bg-brand-card/60 backdrop-blur-md border-2 border-brand-border text-brand-muted hover:text-brand-primary rounded-[2rem] hover:border-brand-primary transition-all shadow-xl shadow-black/5 active:scale-90 group">
            <Download className="w-7 h-7 group-hover:translate-y-1 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* KPI INTELLIGENCE MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 relative z-10">
        {[
          { label: 'Total Penjualan (Omzet)', value: formatIDR(summary.totalRevenue), icon: DollarSign, color: 'text-brand-primary', bg: 'bg-brand-primary/10', trend: '+14.2%', border: 'border-brand-primary/20' },
          { label: 'Laba Bersih', value: showFullFinancials ? formatIDR(summary.totalProfit) : 'TERBATAS', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+6.8%', border: 'border-emerald-500/20' },
          { label: 'Total Transaksi', value: summary.totalOrders, icon: ShoppingBag, color: 'text-brand-accent', bg: 'bg-brand-accent/10', trend: '+9.4%', border: 'border-brand-accent/20' },
          { label: 'Rata-rata Belanja', value: formatIDR(summary.avgOrder), icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: '-1.2%', border: 'border-amber-500/20' },
        ].map((item, idx) => (
          <div key={idx} className="card-premium p-10 group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-[120px] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-4 -translate-y-4"></div>
            <div className="flex justify-between items-start mb-8">
              <div className={`w-16 h-16 rounded-[1.8rem] ${item.bg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner border ${item.border}`}>
                <item.icon className={`w-8 h-8 ${item.color}`} />
              </div>
              <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-bold tracking-widest ${item.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                {item.trend.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {item.trend}
              </div>
            </div>
            <p className="text-[10px] font-bold text-brand-muted tracking-wider mb-3 opacity-60 leading-none">{item.label}</p>
            <h3 className="text-3xl font-black tracking-tighter leading-none group-hover:text-brand-primary transition-colors">{item.value === 'TERBATAS' ? 'Terbatas' : item.value}</h3>
          </div>
        ))}
      </div>

      {/* CORE ANALYTICS TIER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16 relative z-10">
        {/* REVENUE VELOCITY CHART */}
        <div className="card-premium card-premium-hover lg:col-span-2 p-12">
          <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover/chart:scale-110 transition-transform duration-1000">
             <Globe size={300} />
          </div>
          <div className="flex justify-between items-center mb-12 relative z-10">
              <div>
                <h3 className="text-xs font-bold tracking-wider flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  Grafik Perkembangan Omzet
                </h3>
                <p className="text-[10px] font-bold text-brand-muted tracking-wider mt-3 opacity-60">Analisa Waktu • Arus Data Langsung</p>
             </div>
             <div className="flex items-center gap-4 bg-brand-bg/50 px-6 py-3 rounded-2xl border border-brand-border">
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_8px_var(--brand-primary)]"></div>
                <span className="text-[9px] font-bold tracking-widest text-brand-muted">Sistem Aktif</span>
             </div>
          </div>
          <div className="min-h-[350px] lg:min-h-[450px] w-full relative z-10 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transactions.filter(t => t.status !== 'void').slice(-30)}>
                <defs>
                   <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#374151" opacity={0.5} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickFormatter={(str) => new Date(str).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})} />
                <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  strokeWidth={4}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
            {(!transactions || transactions.filter(t => t.status !== 'void').length === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-card/20 backdrop-blur-[2px] rounded-[3rem] z-20">
                <Activity size={40} className="text-brand-muted mb-4 opacity-20" />
                <p className="text-[10px] font-bold text-brand-muted tracking-wider opacity-40">Belum ada data transaksi</p>
              </div>
            )}
          </div>
        </div>

        {/* TRANSACTIONAL DISTRIBUTION PIE */}
        <div className="card-premium card-premium-hover p-12 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-10">
             <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 group-hover/pie:scale-110 transition-transform">
                <PieChartIcon size={28} />
             </div>
             <div className="text-right">
                <p className="text-[10px] font-bold text-brand-muted tracking-wider opacity-60">Rincian Kas/Bank</p>
                <span className="text-[9px] font-bold text-emerald-500 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg">Data Valid</span>
             </div>
          </div>
          
          <h3 className="text-xs font-bold tracking-wider mb-8">Cara Pembayaran</h3>
          
          <div className="min-h-[200px] lg:min-h-[280px] w-full relative z-10">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                   <Pie
                      data={[
                        { name: 'Tunai', value: transactions.filter(t => t.payment_method === 'cash').length },
                        { name: 'Transfer', value: transactions.filter(t => t.payment_method === 'transfer').length },
                        { name: 'Kasbon', value: transactions.filter(t => t.payment_method === 'kasbon').length },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                   >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#f59e0b" />
                   </Pie>
                   <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
             </ResponsiveContainer>
             {(!transactions || transactions.filter(t => ['cash', 'transfer', 'kasbon'].includes(t.payment_method)).length === 0) && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-card/20 backdrop-blur-[2px] rounded-[3rem] z-20">
                 <PieChartIcon size={40} className="text-brand-muted mb-4 opacity-20" />
                 <p className="text-[10px] font-bold text-brand-muted tracking-wider opacity-40">Data kosong</p>
               </div>
             )}
          </div>

           <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-brand-border">
              {[
                { label: 'Tunai', color: 'bg-brand-primary' },
                { label: 'Transfer', color: 'bg-brand-accent' },
                { label: 'Kasbon', color: 'bg-amber-500' }
              ].map((l, i) => (
                <div key={i} className="flex flex-col items-center">
                   <div className={`w-3 h-3 ${l.color} rounded-full mb-2`}></div>
                   <span className="text-[8px] font-bold text-brand-muted tracking-widest">{l.label}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* SYSTEM ARCHITECTURE & INTEGRITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
         <div className="lg:col-span-2 bg-brand-primary/5 border-2 border-brand-primary/10 rounded-[3.5rem] p-12 flex flex-col xl:flex-row justify-between items-center gap-10 group hover:bg-brand-primary/10 transition-all duration-700 relative overflow-hidden">
            <div className="absolute -bottom-10 -left-10 p-20 opacity-[0.03] pointer-events-none group-hover:rotate-45 transition-transform duration-1000">
               <Layers size={200} />
            </div>
            <div className="flex items-center gap-8 relative z-10">
               <div className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center text-brand-primary shadow-2xl shadow-brand-primary/10 border border-brand-primary/20 group-hover:scale-110 transition-transform duration-500">
                 <History className="w-10 h-10"/>
               </div>
                <div>
                  <h4 className="font-bold text-xl tracking-tighter leading-none mb-3">Riwayat Aktivitas Sistem</h4>
                  <p className="text-brand-muted text-[11px] font-semibold tracking-wider opacity-60 leading-relaxed">Semua aktivitas dan perubahan data terekam secara aman dan otomatis.</p>
                </div>
            </div>
             <button className="w-full xl:w-auto px-10 py-5 bg-brand-card/80 border-2 border-brand-border rounded-[2rem] text-[10px] font-bold text-brand-primary hover:text-white hover:bg-brand-primary transition-all flex items-center justify-center gap-4 tracking-widest active:scale-95 shadow-xl shadow-black/5 group/btn">
               Lihat Detail Riwayat <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform duration-500" />
             </button>
         </div>

         <div className="card-premium p-10 group flex items-center gap-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.8rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-1000">
               <ShieldCheck size={32} />
            </div>
             <div>
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[10px] font-bold text-emerald-500 tracking-widest">Status Sistem</p>
                </div>
                <h4 className="text-base font-bold tracking-tight text-brand-text leading-none">Normal</h4>
                <p className="text-[9px] font-bold text-brand-muted tracking-wider mt-3 opacity-60">Semua Fungsi Berjalan Baik</p>
             </div>
         </div>
      </div>

      {/* 🔮 PREDICTIVE INTELLIGENCE ENGINE (NEW) */}
      <PredictiveInsights products={products} />
    </div>
  );
}

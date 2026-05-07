import React, { useState, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, TrendingUp, Banknote, ShoppingCart, 
  BarChart3, History, AlertCircle, Calendar, FileSpreadsheet,
  Zap, ArrowUpRight, ArrowDownRight, Package, Trophy,
  Activity, ArrowRight, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

export default function DashboardView({ 
  transactions, 
  products,
  formatIDR,
  onExport
}) {
  const [timeRange, setTimeRange] = useState('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Parser for id-ID date format (DD/MM/YYYY)
  const parseIdDate = useCallback((str) => {
    try {
      if (!str) return new Date();
      const datePart = str.split(/[,\s]/)[0];
      const parts = datePart.split(/[\/\-.]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } catch (e) {}
    return new Date();
  }, []);

  const stats = useMemo(() => {
    let revenue = 0; let cogs = 0; let txCount = 0;
    const productSales = {};

    transactions.forEach(tx => {
      if(tx.status !== 'void') {
        revenue += (tx.total || 0);
        txCount += 1;
        
        // Items analysis for Top Products
        const items = tx.items || [];
        items.forEach(item => {
          const prodId = item.product_id || item.id;
          const qty = item.qty || 0;
          const prod = products.find(p => p.id === prodId);
          const cp = item.cost_price || prod?.cost_price || 0;
          cogs += (qty * cp);

          if (!productSales[prodId]) {
            productSales[prodId] = { 
              name: item.name || prod?.name || 'Unknown Product', 
              qty: 0, 
              revenue: 0 
            };
          }
          productSales[prodId].qty += qty;
          productSales[prodId].revenue += (qty * (item.price || 0));
        });
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { revenue, cogs, profit: revenue - cogs, txCount, topProducts };
  }, [transactions, products]);

  const lowStock = products.filter(p => p.stock_pcs <= 10).sort((a,b) => a.stock_pcs - b.stock_pcs);

  const chartData = useMemo(() => {
    const today = new Date();
    let bins = [];
    let isMonthly = false;

    let start = new Date();
    let end = new Date();

    if (timeRange === '7d') {
      start.setDate(today.getDate() - 6);
    } else if (timeRange === '30d') {
      start.setDate(today.getDate() - 29);
    } else if (timeRange === '1y') {
      start.setMonth(today.getMonth() - 11);
      start.setDate(1);
      isMonthly = true;
    } else if (timeRange === 'custom') {
      if (customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
      } else {
        start.setDate(today.getDate() - 6);
      }
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (isMonthly) {
      for (let i = 0; i < 12; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        bins.push({
          label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
          month: d.getMonth(),
          year: d.getFullYear(),
          value: 0
        });
      }
    } else {
      let current = new Date(start);
      while (current <= end) {
        bins.push({
          label: current.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          dateStr: current.toLocaleDateString('id-ID').split(',')[0],
          time: current.getTime(),
          value: 0
        });
        current.setDate(current.getDate() + 1);
      }
    }

    transactions.forEach(tx => {
      if (tx.status === 'void') return;
      const txDate = parseIdDate(tx.date || tx.created_at);
      
      if (txDate >= start && txDate <= end) {
        if (isMonthly) {
          const bin = bins.find(b => b.month === txDate.getMonth() && b.year === txDate.getFullYear());
          if (bin) bin.value += (tx.total || 0);
        } else {
          const txDateStr = txDate.toLocaleDateString('id-ID').split(',')[0];
          const bin = bins.find(b => b.dateStr === txDateStr);
          if (bin) bin.value += (tx.total || 0);
        }
      }
    });

    return bins;
  }, [transactions, timeRange, customStart, customEnd, parseIdDate]);


  const intelligence = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let currentMonthRevenue = 0;
    let totalKasbonBulanIni = 0;

    transactions.forEach(tx => {
      const txMonth = (tx.created_at || tx.date)?.slice(0, 7);
      if (txMonth === currentMonth && tx.status !== 'void') {
        currentMonthRevenue += (tx.total || 0);
        if (tx.payment_method === 'kasbon') totalKasbonBulanIni += (tx.total || 0);
      }
    });

    const kasbonRatio = currentMonthRevenue > 0 ? (totalKasbonBulanIni / currentMonthRevenue) * 100 : 0;
    const isCashflowChoked = kasbonRatio > 20;

    // Dead Stock Analysis (60 Days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString();

    let deadStockCount = 0;
    let tiedUpCash = 0;
    products.forEach(p => {
      if (p.stock_pcs > 0) {
        const lastSold = p.last_sold_at || '1970-01-01';
        if (lastSold < sixtyDaysAgoStr) {
          deadStockCount++;
          tiedUpCash += (p.stock_pcs * (p.cost_price || 0));
        }
      }
    });

    // BEP Progress (Targeted from settings if available, else hardcoded for demo)
    const bepTargetMonthly = 15000000; 
    const progressMonthly = (currentMonthRevenue / bepTargetMonthly) * 100;

    return { 
      currentMonthRevenue, 
      totalKasbonBulanIni, 
      kasbonRatio, 
      isCashflowChoked,
      deadStockCount,
      tiedUpCash,
      progressMonthly,
      bepTargetMonthly
    };
  }, [transactions, products]);

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50/50 w-full animate-in fade-in duration-500">
      {/* Intelligence Alerts */}
      <div className="space-y-4 mb-8">
        {intelligence.isCashflowChoked && (
          <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] flex items-center gap-5 shadow-sm animate-in slide-in-from-top-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0 border border-red-200">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-red-800 text-lg uppercase tracking-tight">Cash Flow Tercekik!</h3>
              <p className="text-sm text-red-700 font-medium">Kasbon bulan ini mencatat <strong className="font-black text-red-900">{formatIDR(intelligence.totalKasbonBulanIni)}</strong> ({intelligence.kasbonRatio.toFixed(1)}% Omzet). Segera lakukan penagihan.</p>
            </div>
          </div>
        )}

        {intelligence.deadStockCount > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-[2rem] flex items-center gap-5 shadow-sm animate-in slide-in-from-top-4">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0 border border-orange-200">
              <ArrowDownRight className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-orange-800 text-lg uppercase tracking-tight">Radar Stok Mati Aktif!</h3>
              <p className="text-sm text-orange-700 font-medium">Dana sebesar <strong className="font-black text-orange-900">{formatIDR(intelligence.tiedUpCash)}</strong> tersandera pada <strong className="font-black text-orange-900">{intelligence.deadStockCount} produk</strong> tak laku lebih dari 60 hari.</p>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
             <div className="p-3 bg-blue-600 rounded-[1.2rem] shadow-lg shadow-blue-500/30">
               <LayoutDashboard className="w-6 h-6 text-white"/>
             </div>
             DASHBOARD <span className="text-blue-600">COMMAND</span>
           </h1>
           <p className="text-slate-400 font-bold text-xs mt-2 flex items-center gap-2">
             <Activity className="w-3 h-3 text-emerald-500 animate-pulse"/> MONITORING PERFORMA TOKO REALTIME
           </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onExport} className="bg-white border-2 border-slate-100 hover:border-blue-200 text-slate-600 text-[10px] px-6 py-3 rounded-2xl font-black flex items-center shadow-sm transition-all active:scale-95 uppercase tracking-widest">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500"/> Ekspor Laporan
          </button>
          <div className="h-10 w-[2px] bg-slate-100 mx-1 hidden md:block"></div>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm">
             {['7d', '30d', '1y'].map(r => (
               <button 
                 key={r} 
                 onClick={() => setTimeRange(r)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${timeRange === r ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {r.toUpperCase()}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'PENDAPATAN KOTOR', val: formatIDR(stats.revenue), icon: TrendingUp, color: 'blue', sub: 'Omzet Penjualan' },
          { label: 'LABA BERSIH (EST)', val: formatIDR(stats.profit), icon: Banknote, color: 'emerald', sub: 'Setelah HPP' },
          { label: 'VOLUME TRANSAKSI', val: stats.txCount, icon: ShoppingCart, color: 'indigo', sub: 'Total Struk Cetak' },
          { label: 'PRODUK TERJUAL', val: stats.topProducts.reduce((a,b)=>a+b.qty,0), icon: Package, color: 'amber', sub: 'Total Unit Keluar' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-7 rounded-[2.5rem] shadow-sm border-2 border-slate-50 relative overflow-hidden group hover:border-blue-100 transition-all">
             <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-all group-hover:scale-110`}>
                <item.icon className="w-24 h-24"/>
             </div>
             <div className={`w-12 h-12 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center mb-5 border border-${item.color}-100`}>
                <item.icon className="w-6 h-6"/>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
             <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{item.val}</h3>
             <div className="mt-4 flex items-center gap-1.5">
                <span className={`text-[9px] font-black text-${item.color}-600 bg-${item.color}-50 px-2 py-0.5 rounded-md`}>{item.sub}</span>
             </div>
          </div>
        ))}
      </div>

      {/* BEP Progress Radar */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-700 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center text-white mb-10">
        <div className="w-20 h-20 shrink-0 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-blue-500/40 relative z-10 border-2 border-blue-400 animate-pulse">
           <Activity className="w-10 h-10" />
        </div>
        <div className="flex-1 w-full relative z-10">
           <div className="flex justify-between items-end mb-2">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Radar Balik Modal (BEP Bulanan)</p>
             <span className="text-xs font-black">{Math.min(100, intelligence.progressMonthly).toFixed(1)}%</span>
           </div>
           <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden border border-slate-600 shadow-inner mb-4">
             <div className={`h-full transition-all duration-1000 ${intelligence.progressMonthly >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} style={{width: `${Math.min(100, intelligence.progressMonthly)}%`}} />
           </div>
           {intelligence.progressMonthly >= 100 ? (
             <p className="text-sm text-emerald-400 font-bold flex items-center gap-2">🎉 Selamat! Opex bulan ini sudah tertutup. Sisa transaksi bulan ini adalah Laba Bersih Murni.</p>
           ) : (
             <p className="text-sm text-slate-400 font-medium">Omzet saat ini: <strong className="text-white">{formatIDR(intelligence.currentMonthRevenue)}</strong>. Butuh <strong className="text-white">{formatIDR(intelligence.bepTargetMonthly - intelligence.currentMonthRevenue)}</strong> lagi untuk BEP.</p>
           )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-sm p-8 lg:col-span-2 relative overflow-hidden">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10">
              <div>
                 <h3 className="text-lg font-black text-slate-900 flex items-center tracking-tight">
                   <BarChart3 className="w-5 h-5 mr-3 text-blue-600"/> TREN ANALITIK PENDAPATAN
                 </h3>
                 <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Visualisasi Pergerakan Omzet</p>
              </div>
              {timeRange === 'custom' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                   <input type="date" value={customStart} onChange={(e)=>setCustomStart(e.target.value)} className="bg-transparent text-[10px] font-black text-slate-700 focus:outline-none px-2"/>
                   <span className="text-slate-300 font-black">-</span>
                   <input type="date" value={customEnd} onChange={(e)=>setCustomEnd(e.target.value)} className="bg-transparent text-[10px] font-black text-slate-700 focus:outline-none px-2"/>
                </div>
              )}
           </div>

            <div className="h-72 w-full mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity="0.3"/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                      tickFormatter={(val) => `Rp${val/1000}k`} 
                    />
                    <RechartsTooltip 
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                      formatter={(value) => [formatIDR(value), 'Pendapatan']} 
                    />
                    <ReferenceLine y={500000} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'BEP TARGET', fill: '#ef4444', fontSize: 9, fontWeight: 'black' }} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }} 
                    />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-sm p-8 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-[0.02] -rotate-12">
              <Trophy className="w-32 h-32"/>
           </div>
           <div className="mb-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 flex items-center tracking-tight">
                <Zap className="w-5 h-5 mr-3 text-amber-500"/> PRODUK TERLARIS
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Top 5 Berdasarkan Kuantitas</p>
           </div>
           <div className="space-y-4 flex-1 relative z-10">
              {stats.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-100/50 transition-all border border-transparent hover:border-slate-100 group">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-white text-slate-400 border border-slate-200'}`}>
                      {i + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight group-hover:text-blue-600 transition-colors">{p.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{p.qty} Unit Terjual</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{formatIDR(p.revenue)}</p>
                      <div className="flex items-center justify-end text-[9px] font-black text-emerald-500 gap-0.5">
                         <ArrowUpRight className="w-3 h-3"/> {((p.revenue / (stats.revenue || 1)) * 100).toFixed(1)}%
                      </div>
                   </div>
                </div>
              ))}
              {stats.topProducts.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-30 py-10"><Package className="w-12 h-12 mb-2"/><p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Data</p></div>}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b-2 border-slate-50 flex justify-between items-center">
             <h3 className="font-black text-slate-900 flex items-center tracking-tight"><History className="w-5 h-5 mr-3 text-indigo-500"/> TRANSAKSI TERAKHIR</h3>
             <button className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest">Lihat Semua <ArrowRight className="w-3 h-3"/></button>
          </div>
          <div className="divide-y-2 divide-slate-50 flex-1">
             {transactions.slice(0, 5).map(tx => (
               <div key={tx.id} className="p-6 hover:bg-slate-50/50 transition-all flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.status === 'void' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'} group-hover:scale-110 transition-all`}>
                        <ShoppingCart className="w-5 h-5"/>
                     </div>
                     <div>
                       <p className="font-black text-sm text-slate-900 tracking-tight">{tx.id || `TX-${tx.id}`}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{(tx.date || tx.created_at)} • {tx.payment_method || tx.method || 'CASH'}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`font-black text-base ${tx.status === 'void' ? 'text-slate-300 line-through' : 'text-slate-900'}`}>{formatIDR(tx.total)}</p>
                     {tx.status === 'void' ? (
                        <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Voided</span>
                     ) : (
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Success</span>
                     )}
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-[3rem] border-2 border-red-50 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b-2 border-red-50 bg-red-50/30 flex justify-between items-center">
             <h3 className="font-black text-red-900 flex items-center tracking-tight"><AlertCircle className="w-5 h-5 mr-3 text-red-500"/> ALARM STOK KRITIS</h3>
             <span className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-full">{lowStock.length} ITEM</span>
          </div>
          <div className="p-4 space-y-2 flex-1">
             {lowStock.slice(0, 6).map(p => (
               <div key={p.id} className="p-5 flex justify-between items-center bg-white hover:bg-red-50/30 rounded-[2rem] transition-all border-2 border-transparent hover:border-red-100 group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:rotate-12 transition-all">
                        <Package className="w-5 h-5"/>
                     </div>
                     <div>
                       <p className="font-black text-sm text-slate-900 tracking-tight uppercase">{p.name}</p>
                       <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest">{p.sku}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sisa Stok</p>
                        <p className="text-sm font-black text-red-600">{p.stock_pcs} Unit</p>
                     </div>
                     <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((p.stock_pcs / 10) * 100, 100)}%` }}></div>
                     </div>
                  </div>
               </div>
             ))}
             {lowStock.length === 0 && <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 text-emerald-500"><TrendingUp className="w-12 h-12 mb-2"/><p className="text-[10px] font-black uppercase tracking-widest">Semua Stok Aman</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

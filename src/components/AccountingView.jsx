import React, { useState, useMemo } from 'react';
import { 
  Landmark, FileText, PieChart, Lock, Wallet, 
  ArrowUpRight, ArrowDownRight, AlertCircle, Info, Zap, Droplets, SplitSquareHorizontal,
  Download, Eye, Printer, ChevronRight, TrendingUp, ShieldCheck, Package, Box, AlertTriangle, Search, Filter, UploadCloud, PlusCircle, Trash, Edit
} from 'lucide-react';

const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

const XCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

export default function AccountingView({ transactions, expenses, products, settings }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const taxProfile = useMemo(() => ({
    type: settings.tax_type || 'OP',
    startYear: parseInt(settings.tax_start_year || new Date().getFullYear())
  }), [settings]);

  // SPRINT 7: Smart Guardrail Logic (Data Completeness)
  const dataCompleteness = useMemo(() => {
    const total = products.length;
    // Check for missing specific cost_price
    const missing = products.filter(p => !p.cost_price || p.cost_price === 0).length;
    const percentage = total === 0 ? 0 : (missing / total) * 100;
    return { total, missing, percentage, isLocked: percentage > 20 };
  }, [products]);

  // Derived Financial Report
  const report = useMemo(() => {
    let totalOmzet = 0;
    let totalHPP = 0;
    let ytdTurnover = 0;
    const currentYear = new Date().getFullYear();

    // 1. Revenue & COGS Calculation
    transactions.forEach(tx => {
      try {
        const dateStr = tx.created_at || tx.date;
        if (!dateStr) return;
        
        const txDate = new Date(dateStr);
        const txMonth = txDate.toISOString().slice(0, 7);
        const txYear = txDate.getFullYear();

        if (tx.status !== 'void') {
           // YTD Turnover for PTKP 500jt check
           if (txYear === currentYear) ytdTurnover += tx.total;

           if (txMonth === selectedMonth) {
              totalOmzet += tx.total;
              tx.items?.forEach(item => {
                // Priority: Item Cost > Product Cost > Wholesale Proxy
                const prod = products.find(p => p.id === item.product_id);
                const cost = item.cost_price || prod?.cost_price || prod?.price_wholesale || 0;
                totalHPP += (item.qty * (item.multiplier || 1) * cost);
              });
           }
        }
      } catch (e) {
        console.warn("Accounting Date parse error", e);
      }
    });

    const labaKotor = totalOmzet - totalHPP;
    
    // Tax Exemption for Individual (OP) - PTKP 500jt
    let taxableTurnoverThisMonth = totalOmzet;
    const thresholdOP = 500000000;
    if (taxProfile.type === 'OP') {
       const turnoverBeforeThisMonth = ytdTurnover - totalOmzet;
       if (ytdTurnover <= thresholdOP) {
          taxableTurnoverThisMonth = 0;
       } else if (turnoverBeforeThisMonth < thresholdOP) {
          taxableTurnoverThisMonth = ytdTurnover - thresholdOP;
       }
    }

    const estimasiPajak = taxableTurnoverThisMonth * 0.005; 

    // Maturity logic
    const limit = taxProfile.type === 'OP' ? 7 : taxProfile.type === 'CV' ? 4 : 3;
    const yearsUsed = currentYear - taxProfile.startYear;
    const yearsLeft = Math.max(0, limit - yearsUsed);

    // 2. Expenses Calculation (Opex, Prive, Non-Deductible)
    let totalOpex = 0;
    let totalPrive = 0;
    let totalSumbangan = 0;

    expenses?.forEach(exp => {
      try {
        const expDate = new Date(exp.created_at || exp.date);
        const expMonth = expDate.toISOString().slice(0, 7);
        
        if (expMonth === selectedMonth) {
          if (exp.category === 'OPEX' || !exp.category) totalOpex += exp.amount;
          if (exp.category === 'PRIVE') totalPrive += exp.amount;
          if (exp.category === 'NON_DEDUCTIBLE') totalSumbangan += exp.amount;
        }
      } catch (e) {}
    });

    const sinkingFund = labaKotor > 0 ? labaKotor * 0.1 : 0;
    const labaBersih = labaKotor - totalOpex - sinkingFund - estimasiPajak;

    return { 
      totalOmzet, totalHPP, labaKotor, totalOpex, totalPrive, 
      totalSumbangan, labaBersih, estimasiPajak, ytdTurnover,
      yearsLeft, yearsLimit: limit, taxableTurnoverThisMonth, sinkingFund
    };
  }, [transactions, expenses, products, selectedMonth, taxProfile]);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-slate-900 text-slate-100">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Landmark className="w-8 h-8 text-blue-400 p-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20"/> 
            Laporan Akuntansi & Pajak
          </h1>
          <p className="text-sm text-slate-400 mt-1">Sistem Simplified Mode A untuk pelaporan PPh Final UMKM 0.5%.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="bg-transparent border-none font-bold text-blue-400 focus:ring-0 cursor-pointer"
          />
        </div>
      </div>

      {/* SPRINT 7: SMART GUARDRAIL ALERT */}
      {dataCompleteness.isLocked && (
        <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-[2rem] flex items-start gap-4 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <Lock className="w-8 h-8 shrink-0 mt-0.5 text-red-400" />
          <div>
            <h4 className="font-black text-lg text-white">Laporan Laba/Rugi Dikunci Sementara</h4>
            <p className="text-sm mt-1 mb-4 opacity-80">
              Sistem mendeteksi <strong>{Math.round(dataCompleteness.percentage)}%</strong> produk Anda ({dataCompleteness.missing} item) tidak memiliki Harga Pokok Penjualan (HPP). 
              Untuk mencegah <em className="underline decoration-red-400">Laba Semu (Phantom Profit)</em>, laporan disembunyikan.
            </p>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/30 text-red-300">
                Aksi: Lengkapi Harga Modal (HPP) di menu Produk.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAX RADAR SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/40 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="flex items-center gap-6 z-10">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              <PieChart className="w-10 h-10 text-white animate-pulse"/>
            </div>
            <div>
              <h3 className="font-bold text-blue-200 uppercase tracking-[0.2em] text-[10px]">Tax Radar: PPh Final UMKM 0.5%</h3>
              <p className="text-4xl font-black tracking-tighter mt-1">{formatIDR(report.estimasiPajak)}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] font-bold bg-black/20 px-3 py-1 rounded-full w-fit">
                <Info className="w-3 h-3"/> {taxProfile.type === 'OP' && report.ytdTurnover <= 500000000 ? 'Bebas Pajak (<500jt)' : 'Berdasarkan Omzet Terkena Pajak'}
              </div>
            </div>
          </div>

          <div className="text-right bg-white/5 p-6 rounded-3xl border border-white/10 w-full md:w-auto backdrop-blur-sm z-10">
            <p className="text-xs text-blue-200 font-bold uppercase mb-1">Dasar Pengenaan Pajak:</p>
            <p className="text-2xl font-black">{formatIDR(report.taxableTurnoverThisMonth)}</p>
            <p className="text-[9px] text-blue-200 mt-3 opacity-60 leading-relaxed italic">Total Omzet Bruto: {formatIDR(report.totalOmzet)}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-[2.5rem] border border-slate-700 p-8 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Masa Berlaku Tarif 0.5%</p>
                <p className="text-xl font-black text-white">{report.yearsLeft} / {report.yearsLimit} Tahun</p>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Zap className="w-6 h-6 text-amber-400 fill-current"/>
              </div>
           </div>
           
           {taxProfile.type === 'OP' && (
             <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                  <span>Progress PTKP 500jt</span>
                  <span className="text-slate-300">{Math.round(Math.min(100, (report.ytdTurnover/500000000)*100))}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{width: `${Math.min(100, (report.ytdTurnover/500000000)*100)}%`}}></div>
                </div>
                <p className="text-[8px] text-slate-500 italic">YTD Turnover: {formatIDR(report.ytdTurnover)}</p>
             </div>
           )}

           <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400"/>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Profit Margin</p>
                  <p className="text-lg font-black text-white">
                    {report.totalOmzet > 0 ? Math.round((report.labaBersih / report.totalOmzet) * 100) : 0}%
                  </p>
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* P&L Statement */}
        <div className={`bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-xl overflow-hidden flex flex-col relative transition-all duration-500 ${dataCompleteness.isLocked ? 'blur-md grayscale select-none pointer-events-none opacity-40' : ''}`}>
          <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400"/> 
              Income Statement (P&L)
            </h3>
            <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-tighter">Accrual Simplified</span>
          </div>
          <div className="p-8 flex-1 space-y-6">
            <div className="flex justify-between items-center group">
              <span className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors">Penjualan Bersih (Revenue)</span>
              <span className="font-black text-xl text-white">{formatIDR(report.totalOmzet)}</span>
            </div>
            <div className="flex justify-between items-center group">
              <div className="flex flex-col">
                <span className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors">Harga Pokok Penjualan (COGS)</span>
                <span className="text-[9px] text-slate-500 italic mt-0.5">Biaya modal barang yang laku</span>
              </div>
              <span className="font-black text-red-400">- {formatIDR(report.totalHPP)}</span>
            </div>
            
            <div className="h-px bg-slate-700 my-2"></div>
            
            <div className="flex justify-between items-center py-4 bg-blue-500/5 px-6 -mx-6 rounded-2xl border-y border-blue-500/10">
              <span className="font-bold text-blue-200">LABA KOTOR (GROSS PROFIT)</span>
              <span className="font-black text-2xl text-blue-400">{formatIDR(report.labaKotor)}</span>
            </div>

            <div className="flex justify-between items-center group">
              <div className="flex flex-col">
                <span className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors">Biaya Operasional (OPEX)</span>
                <span className="text-[9px] text-slate-500 italic mt-0.5">Listrik, Gaji, ATK, dll</span>
              </div>
              <span className="font-black text-red-400">- {formatIDR(report.totalOpex)}</span>
            </div>

            <div className="flex justify-between items-center group">
              <div className="flex flex-col">
                <span className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors flex items-center gap-2">
                   Alokasi Sinking Fund (10%) <Droplets className="w-3 h-3 text-amber-500"/>
                </span>
                <span className="text-[9px] text-slate-500 italic mt-0.5">Cadangan sewa & depresiasi</span>
              </div>
              <span className="font-black text-amber-400">- {formatIDR(report.sinkingFund)}</span>
            </div>

            <div className="flex justify-between items-center group">
              <div className="flex flex-col">
                <span className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors flex items-center gap-2">
                   Pajak PPh Final 0.5% <Zap className="w-3 h-3 text-red-500"/>
                </span>
                <span className="text-[9px] text-slate-500 italic mt-0.5">Estimasi pajak bulan ini</span>
              </div>
              <span className="font-black text-red-400">- {formatIDR(report.estimasiPajak)}</span>
            </div>

            <div className="pt-6 border-t border-slate-700 flex justify-between items-end">
              <div>
                <span className="block font-black text-slate-500 text-[10px] uppercase tracking-widest mb-1">Profit Usaha</span>
                <span className="font-black text-slate-100 text-lg uppercase tracking-tighter">Laba Bersih Akhir</span>
              </div>
              <span className="font-black text-3xl text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{formatIDR(report.labaBersih)}</span>
            </div>

            <div className="mt-6 p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50">
               <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <SplitSquareHorizontal className="w-3 h-3"/> Profit Splitter (Simulation 50/50)
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                     <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Partner A (50%)</p>
                     <p className="text-sm font-black text-white">{formatIDR(report.labaBersih * 0.5)}</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                     <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Partner B (50%)</p>
                     <p className="text-sm font-black text-white">{formatIDR(report.labaBersih * 0.5)}</p>
                  </div>
               </div>
            </div>
          </div>
          {dataCompleteness.isLocked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
               <div className="bg-slate-800 border border-slate-600 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-xs animate-in zoom-in-90">
                 <Lock className="w-10 h-10 text-red-400 mb-4" />
                 <h4 className="font-black text-white mb-2">Laporan Terkunci</h4>
                 <p className="text-[10px] text-slate-400 leading-relaxed">Data HPP (Modal) belum lengkap. Sistem tidak bisa menghitung laba yang akurat.</p>
               </div>
            </div>
          )}
        </div>

        {/* Behavioral Metrics (Prive & Cash Management) */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-3">
                <Wallet className="w-5 h-5 text-amber-400"/> 
                Personal Drawing & Prive
              </h3>
            </div>
            <div className="p-8 flex-1 space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-3xl">
                <p className="text-[10px] text-amber-300 font-bold uppercase tracking-widest mb-2">Ambil Untung Pribadi (Prive)</p>
                <p className="text-4xl font-black text-white tracking-tighter">{formatIDR(report.totalPrive)}</p>
                <p className="text-[10px] text-amber-200/60 mt-4 leading-relaxed italic">
                  Ini adalah uang laci yang Anda tarik untuk keperluan pribadi. 
                  <br/><strong>Note:</strong> Ini tidak dianggap biaya operasional bisnis.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Non-Deductible</span>
                    <span className="font-bold text-slate-200">{formatIDR(report.totalSumbangan)}</span>
                 </div>
                 <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Opex Ratio</span>
                    <span className="font-bold text-slate-200">
                      {report.totalOmzet > 0 ? ((report.totalOpex / report.totalOmzet) * 100).toFixed(1) : 0}%
                    </span>
                 </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex items-center gap-4">
                 <AlertCircle className="w-5 h-5 text-blue-400 shrink-0"/>
                 <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                   Sistem mendeteksi cash flow laci Anda. Pastikan kategori <strong>"Prive"</strong> hanya digunakan saat Anda mengambil uang keuntungan untuk diri sendiri.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

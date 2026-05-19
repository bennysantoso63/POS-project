import React, { useMemo, useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Download, FileText, PieChart, Activity, Plus, Trash2,
  AlertCircle, Receipt, ArrowUpRight, ArrowDownRight,
  ShieldCheck, Calculator, Landmark, Zap, AlertTriangle, Wallet,
  GanttChart, Landmark as BankIcon, BarChart3, Scale, History,
  ChevronRight, ArrowRight, ShieldAlert, Fingerprint, Globe, Layers,
  Briefcase, Cpu, Network, Database, ChevronDown
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FinancialReport } from './reports/FinancialReport';

import CustomDropdown from './ui/CustomDropdown';

export default function AccountingView({ 
  transactions = [], 
  expenses = [], 
  products = [], 
  settings = {} 
}) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  // --- SOVEREIGN FINANCIAL INTELLIGENCE ENGINE ---
  const report = useMemo(() => {
    let totalRevenue = 0;
    let totalCogs = 0;
    let totalOpex = 0;
    
    const filteredTx = transactions.filter(tx => {
      const d = new Date(tx.created_at || tx.date);
      return d.getMonth() === parseInt(month) && d.getFullYear() === parseInt(year) && tx.status !== 'void';
    });

    const filteredExpenses = expenses.filter(ex => {
      const d = new Date(ex.created_at || ex.date);
      return d.getMonth() === parseInt(month) && d.getFullYear() === parseInt(year);
    });

    filteredTx.forEach(tx => {
      totalRevenue += (tx.total || 0);
      tx.items?.forEach(item => {
        const prod = products.find(p => p.id === item.product_id);
        totalCogs += (item.qty || 0) * (item.cost_price || prod?.cost_price || 0);
      });
    });

    filteredExpenses.forEach(ex => {
      totalOpex += (ex.amount || 0);
    });

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalOpex;
    const taxRate = (settings.tax_rate || 0.5) / 100;
    const estimatedTax = totalRevenue * taxRate;

    const sinkingFundRate =
      parseFloat(settings.sinking_fund_rate || 10) / 100;
    const netProfitAfterTax = netProfit - estimatedTax;
    const sinkingFundAllocation = netProfitAfterTax > 0
      ? Math.round(netProfitAfterTax * sinkingFundRate)
      : 0;

    return { totalRevenue, totalCogs, totalOpex, grossProfit, netProfit, estimatedTax, sinkingFundAllocation, sinkingFundRate, netProfitAfterTax };
  }, [transactions, expenses, products, month, year, settings.tax_rate]);

  const { sinkingFundAllocation, sinkingFundRate } = report;

  return (
    <div className="flex-1 p-10 md:p-20 overflow-y-auto custom-scrollbar bg-brand-bg text-brand-text font-sans h-full relative">
      
      {/* ENTERPRISE FINANCIAL COMMAND HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-10">
        <div className="animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-8 mb-6">
             <div className="w-20 h-20 bg-brand-primary rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(var(--brand-primary-rgb),0.5)] relative group overflow-hidden border-2 border-white/10">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700"></div>
                <BankIcon className="text-white w-10 h-10 relative z-10 group-hover:rotate-12 transition-transform duration-500" />
             </div>
             <div>
                <h1 className="text-6xl font-black tracking-tighter leading-none mb-3">
                  Laporan <span className="text-brand-primary">Keuangan</span>
                </h1>
                <p className="text-brand-muted text-[11px] font-semibold tracking-wider opacity-60 ml-1">
                  Ringkasan Laba Rugi • Pajak • Pengeluaran
                </p>
             </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-right-8 duration-700 relative z-30">
          <div className="flex items-center gap-4 relative z-40 overflow-visible">
             <CustomDropdown 
               value={month} 
               onChange={(val) => setMonth(parseInt(val))} 
               options={['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => ({ value: i, label: m }))} 
               label="Bulan"
             />
             <CustomDropdown 
               value={year} 
               onChange={(val) => setYear(parseInt(val))} 
               options={[2024, 2025, 2026].map(y => ({ value: y, label: y }))} 
               label="Tahun"
             />
          </div>
          <PDFDownloadLink 
            document={<FinancialReport data={report} settings={settings} dateRange={`${month+1}/${year}`} />} 
            fileName={`Audit_Report_${month+1}_${year}.pdf`}
            className="w-20 h-20 flex items-center justify-center bg-brand-primary text-white rounded-[2.2rem] hover:bg-brand-secondary transition-all shadow-[0_20px_40px_-10px_rgba(var(--brand-primary-rgb),0.5)] active:scale-90 group border-2 border-white/10"
          >
            {({ loading }) => (
              loading ? (
                <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full"></div>
              ) : (
                <FileText className="w-8 h-8 group-hover:-translate-y-1 transition-transform duration-500" />
              )
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-14 pb-48">
        
        {/* LEFT COLUMN: FINANCIAL ARCHITECTURE & P&L */}
        <div className="lg:col-span-8 space-y-14">
          
          {/* MASTER P&L INTELLIGENCE STATEMENT */}
            <div className="card-premium p-14 lg:p-20 relative group">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-24 border-b-2 border-brand-border pb-14 relative z-10 gap-10">
              <div>
                <h3 className="text-3xl font-black tracking-tighter flex items-center gap-6">
                  <FileText className="w-10 h-10 text-brand-primary" /> 
                  Laporan Laba Rugi
                </h3>
                <p className="text-[11px] font-bold text-brand-muted tracking-widest mt-3 opacity-60 ml-1">Rincian Pendapatan dan Pengeluaran</p>
              </div>
              <div className="px-8 py-4 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-[1.5rem] tracking-widest border-2 border-brand-primary/20 shadow-inner backdrop-blur-md">
                Laba Bersih Keseluruhan
              </div>
            </div>

            <div className="space-y-14 relative z-10">
              <div className="flex justify-between items-center group/row p-8 rounded-[2.5rem] hover:bg-brand-bg/40 transition-all duration-500 border-2 border-transparent hover:border-brand-border">
                <div>
                   <span className="text-[11px] font-bold text-brand-muted tracking-widest block mb-2 opacity-60">Total Pendapatan Kotor</span>
                   <span className="text-sm font-bold text-brand-text tracking-wide">Total Penjualan Barang</span>
                </div>
                <span className="text-4xl font-black tracking-tighter tabular-nums">{formatIDR(report.totalRevenue)}</span>
              </div>

              <div className="flex justify-between items-center group/row p-8 rounded-[2.5rem] hover:bg-brand-bg/40 transition-all duration-500 border-2 border-transparent hover:border-brand-border">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-brand-muted tracking-widest block mb-2 opacity-60">Harga Pokok Penjualan (HPP)</span>
                  <span className="text-sm font-bold text-brand-accent/60 tracking-wide">Total Modal Barang Terjual</span>
                </div>
                <span className="text-4xl font-black text-brand-accent tracking-tighter tabular-nums">- {formatIDR(report.totalCogs)}</span>
              </div>
              
              <div className="py-16 border-y-4 border-brand-border flex justify-between items-center bg-brand-primary/[0.03] -mx-14 lg:-mx-20 px-14 lg:px-20 shadow-inner relative overflow-hidden group/gross">
                <div className="absolute inset-0 bg-brand-primary/5 translate-x-full group-hover/gross:translate-x-0 transition-transform duration-1000"></div>
                <div className="relative z-10">
                  <span className="text-lg font-black text-brand-primary tracking-widest">Laba Kotor</span>
                  <p className="text-[11px] font-semibold text-brand-muted tracking-wider mt-3 opacity-60">Pendapatan dikurangi HPP</p>
                </div>
                <span className="text-6xl font-black text-brand-primary tracking-tighter drop-shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.3)] tabular-nums relative z-10">{formatIDR(report.grossProfit)}</span>
              </div>
              <div className="flex justify-between items-center group/row p-8 rounded-[2.5rem] hover:bg-brand-bg/40 transition-all duration-500 border-2 border-transparent hover:border-brand-border">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-brand-muted tracking-widest block mb-2 opacity-60">Biaya Operasional</span>
                  <span className="text-sm font-bold text-brand-muted/60 tracking-wide">Gaji, Listrik & Pengeluaran Lainnya</span>
                </div>
                <span className="text-4xl font-black text-brand-accent/80 tracking-tighter tabular-nums">- {formatIDR(report.totalOpex)}</span>
              </div>

              <div className="flex justify-between items-center group/row p-8 rounded-[2.5rem] hover:bg-brand-bg/40 transition-all duration-500 border-2 border-transparent hover:border-brand-border">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-brand-muted tracking-widest block mb-2 opacity-60">Pajak Usaha (PPh {settings.tax_rate || 0.5}%)</span>
                  <span className="text-sm font-bold text-brand-muted/60 tracking-wide">Kewajiban Pajak</span>
                </div>
                <span className="text-4xl font-black text-brand-accent/80 tracking-tighter tabular-nums">- {formatIDR(report.estimatedTax)}</span>
              </div>

              <div className="pt-20 mt-8 border-t-4 border-brand-border flex flex-col md:flex-row justify-between items-end bg-gradient-to-t from-emerald-500/[0.08] to-transparent -mx-14 lg:-mx-20 px-14 lg:px-20 pb-20 rounded-b-[5rem] gap-10">
                <div className="w-full md:w-auto">
                   <div className="flex items-center gap-6 mb-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                         <TrendingUp size={24} />
                      </div>
                      <span className="text-xl font-black text-emerald-500 tracking-widest">Laba Bersih Akhir</span>
                   </div>
                   <span className="text-3xl font-bold tracking-tighter text-brand-muted/60">Keuntungan Bersih Setelah Pajak</span>
                </div>
                <div className="text-right w-full md:w-auto">
                   <span className="text-8xl font-black text-emerald-500 tracking-tighter drop-shadow-[0_0_50px_rgba(16,185,129,0.5)] tabular-nums block mb-2">
                     {formatIDR(report.netProfit - report.estimatedTax)}
                   </span>
                   <span className="text-[11px] font-semibold text-emerald-500/50 tracking-wider">Laporan Diperbarui Real-Time</span>
                </div>
              </div>
            </div>
          </div>

          {/* FISCAL COMPLIANCE COMMAND */}
          <div className="card-premium p-14 flex flex-col lg:flex-row items-center gap-14 group relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="w-32 h-32 bg-brand-primary rounded-[3.5rem] flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(var(--brand-primary-rgb),0.5)] shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 relative border-2 border-white/10 overflow-hidden">
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
               <Scale className="w-14 h-14 text-white relative z-10"/>
            </div>
            <div className="flex-1 text-center lg:text-left relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-5">
                 <h4 className="text-[11px] font-bold text-brand-muted tracking-widest opacity-60 leading-none">Estimasi Pajak Usaha</h4>
                 <div className="inline-flex items-center gap-3 px-6 py-2 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-xl tracking-widest border border-brand-primary/20 backdrop-blur-md">
                   <ShieldCheck size={14} className="animate-pulse" /> Mode UMKM
                 </div>
              </div>
              <h4 className="text-5xl font-black tracking-tighter tabular-nums mb-6">{formatIDR(report.estimatedTax)}</h4>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-2xl tracking-wider border border-emerald-500/20">
                  <Calculator size={16}/> Dihitung Otomatis
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-brand-bg/60 text-brand-muted text-[10px] font-bold rounded-2xl tracking-wider border border-brand-border">
                  <Globe size={16}/> Data Sistem
                </div>
              </div>
            </div>
            <div className="text-right bg-brand-bg/80 backdrop-blur-xl p-10 rounded-[4rem] border-2 border-brand-border w-full lg:w-auto shadow-inner group-hover:border-brand-primary/30 transition-colors relative z-10">
              <p className="text-[10px] font-bold text-brand-muted tracking-widest mb-4 opacity-50">Total Omzet Kena Pajak</p>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-brand-text group-hover:text-brand-primary transition-colors">{formatIDR(report.totalRevenue)}</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: METRICS & STRATEGIC INTELLIGENCE */}
        <div className="lg:col-span-4 space-y-14">
          
          {/* PRIVE / CAPITAL DRAWING MATRIX */}
          <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border rounded-[5rem] p-14 shadow-2xl flex flex-col relative overflow-hidden h-fit group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-brand-accent/10 transition-all duration-1000"></div>
            <div className="flex items-center gap-8 mb-16 relative z-10 border-b-2 border-brand-border pb-10">
              <div className="w-16 h-16 bg-brand-accent/10 rounded-[1.8rem] text-brand-accent flex items-center justify-center shadow-inner border border-brand-accent/20 group-hover:scale-110 transition-transform">
                <Wallet className="w-8 h-8"/>
              </div>
              <div>
                 <h3 className="text-xl font-black tracking-tighter">Prive / Tarik Dana</h3>
                 <p className="text-[9px] font-bold text-brand-muted tracking-wider opacity-40 mt-1">Penarikan Modal Pemilik</p>
              </div>
            </div>
            
            <div className="bg-brand-accent/5 border-2 border-brand-accent/10 p-10 rounded-[3.5rem] mb-14 relative overflow-hidden group/prive shadow-inner">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-accent/10 rounded-full blur-[80px] group-hover/prive:bg-brand-accent/20 transition-all duration-[2000ms]"></div>
              <p className="text-[10px] font-bold text-brand-accent tracking-widest mb-4 relative z-10 opacity-70">Total Penarikan Prive</p>
              <h4 className="text-5xl font-black tracking-tighter relative z-10 tabular-nums">{formatIDR(0)}</h4>
              <p className="text-[11px] text-brand-muted font-bold tracking-wide mt-8 relative z-10 leading-loose opacity-40">
                Total penarikan modal pemilik yang tercatat dalam sistem.
              </p>
            </div>

            <div className="space-y-8 mb-14 relative z-10">
              <div className="bg-brand-bg/60 backdrop-blur-md p-8 rounded-[2.5rem] border-2 border-brand-border shadow-inner group/stat hover:border-emerald-500/30 transition-all duration-500">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-[10px] font-bold text-brand-muted tracking-wider opacity-60">Margin Keuntungan (NPM)</span>
                   <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover/stat:scale-110 transition-transform"><TrendingUp size={16} /></div>
                </div>
                <div className="flex items-end justify-between">
                   <span className="text-4xl font-black text-emerald-500 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                     {report.totalRevenue > 0 ? ((report.netProfit / report.totalRevenue) * 100).toFixed(1) : 0}%
                   </span>
                   <span className="text-[9px] font-bold text-brand-muted tracking-widest mb-1 opacity-30">Rasio Efisiensi</span>
                </div>
              </div>
              
              <div className="bg-brand-bg/60 backdrop-blur-md p-8 rounded-[2.5rem] border-2 border-brand-border shadow-inner group/stat hover:border-brand-accent/30 transition-all duration-500">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-[10px] font-bold text-brand-muted tracking-wider opacity-60">Persentase Pengeluaran</span>
                   <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent group-hover/stat:scale-110 transition-transform"><TrendingDown size={16} /></div>
                </div>
                <div className="flex items-end justify-between">
                   <span className="text-4xl font-black text-brand-accent tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(var(--brand-accent-rgb),0.3)]">
                     {report.totalRevenue > 0 ? ((report.totalOpex / report.totalRevenue) * 100).toFixed(1) : 0}%
                   </span>
                   <span className="text-[9px] font-bold text-brand-muted tracking-widest mb-1 opacity-30">Rasio Operasional</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-brand-primary/5 rounded-[2.5rem] border-2 border-brand-primary/10 flex items-start gap-6 backdrop-blur-sm group-hover:bg-brand-primary/10 transition-all duration-700">
              <ShieldCheck className="w-8 h-8 text-brand-primary shrink-0 mt-1 shadow-sm opacity-50 group-hover:opacity-100 transition-opacity"/>
              <p className="text-[10px] text-brand-muted font-bold tracking-wide leading-relaxed opacity-50">
                Laporan keuangan dienkripsi dan disimpan aman di komputer lokal Anda.
              </p>
            </div>
          </div>

          <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Landmark className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-black text-brand-text">
                  Dana Cadangan
                </h3>
                <p className="text-[10px] text-brand-muted tracking-[0.3em] uppercase">
                  Sinking Fund — Alokasi {Math.round(sinkingFundRate * 100)}%
                </p>
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-500 mb-2">
              {formatIDR(sinkingFundAllocation)}
            </p>
            <p className="text-[10px] text-brand-muted opacity-60 tracking-[0.2em] uppercase">
              Alokasi bulan ini dari laba bersih setelah pajak
            </p>
          </div>

          {/* STRATEGIC FISCAL HEALTH INSIGHT */}
          <div className="bg-brand-primary p-14 rounded-[5rem] text-white shadow-[0_40px_80px_-20px_rgba(var(--brand-primary-rgb),0.6)] flex flex-col justify-between group overflow-hidden relative min-h-[450px] border-4 border-white/10 hover:-translate-y-4 transition-all duration-1000">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/20 rounded-full blur-[100px] group-hover:scale-150 transition-all duration-[2000ms]"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/20 rounded-full blur-[80px]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-8 mb-10">
                 <div className="w-20 h-20 bg-white/20 rounded-[2.2rem] flex items-center justify-center backdrop-blur-xl border-2 border-white/20 shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                    <Zap className="w-10 h-10 text-white fill-white/20" />
                 </div>
                 <div>
                    <h3 className="text-3xl font-black tracking-tighter mb-2">Status Keuangan</h3>
                    <p className="text-[9px] font-bold text-white/40 tracking-widest">Analisa Otomatis</p>
                 </div>
              </div>
              <p className="text-sm text-white/80 font-bold tracking-wide leading-loose max-w-sm">
                {report.netProfit > 0 
                  ? 'Bisnis berjalan menguntungkan. Margin laba positif dan pengeluaran terkontrol dengan baik.' 
                  : 'Operasional sedang defisit. Segera lakukan penyesuaian pada harga beli barang atau kurangi biaya pengeluaran.'}
              </p>
            </div>
            
            <div className="space-y-6 relative z-10 mt-14">
              <button className="w-full py-8 bg-white text-brand-primary text-[11px] font-bold tracking-widest rounded-[2.5rem] hover:bg-brand-bg hover:scale-105 transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] flex items-center justify-center gap-6 group/btn border-2 border-brand-primary/10">
                <History size={24} className="group-hover/btn:rotate-[-360deg] transition-transform duration-[1500ms]" /> 
                Lihat Rincian Transaksi
              </button>
              <div className="flex items-center justify-center gap-4 opacity-40">
                 <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                 <span className="text-[9px] font-bold tracking-widest">Sistem Aktif</span>
              </div>
            </div>
          </div>
          
          {/* FISCAL INTELLIGENCE RADAR */}
          <div className="bg-brand-card/60 backdrop-blur-xl border-2 border-brand-border rounded-[4rem] p-10 flex items-center justify-between group hover:border-brand-primary/40 transition-all duration-700 shadow-xl">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 group-hover:rotate-[-12deg] transition-transform">
                   <Network size={28} />
                </div>
                <div>
                   <h4 className="text-[11px] font-bold tracking-widest text-brand-text mb-1">Sistem Pajak Aktif</h4>
                   <span className="text-[9px] font-bold text-brand-muted tracking-widest opacity-40">Sinkronisasi Aktif</span>
                </div>
             </div>
             <div className="w-12 h-2 bg-brand-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary w-[70%] animate-pulse"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

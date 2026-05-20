import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Plus, CreditCard, Calendar, 
  ChevronRight, AlertCircle, CheckCircle, Clock,
  ArrowUpRight, ArrowDownRight, Wallet, Receipt,
  AlertTriangle, UserCheck, XCircle, X,
  ShieldCheck, History, Database, ArrowRight,
  HandCoins, UserPlus, Phone, Briefcase, Cpu, Network,
  Globe, Zap, Fingerprint, Lock, Unlock, ShieldAlert,
  ChevronDown, Layers, MoreVertical, Share2
} from 'lucide-react';
import { useNotify } from '../hooks/useNotify';
const Modal = ({ title, children, onClose, maxWidth = 'max-w-xl' }) => (
  <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-3xl z-[2000] flex items-center justify-center p-10 animate-in fade-in duration-700">
    <div className={`bg-brand-card rounded-[5rem] w-full ${maxWidth} shadow-[0_100px_200px_-50px_rgba(0,0,0,0.6)] border-2 border-brand-border flex flex-col animate-in zoom-in-95 duration-700 overflow-hidden max-h-[92vh] relative group/modal`}>
      <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent shadow-[0_0_30px_rgba(var(--brand-accent-rgb),0.5)]"></div>
      <div className="px-14 py-12 border-b-2 border-brand-border flex justify-between items-center bg-brand-bg/40 shrink-0 relative z-10">
        <div>
           <h3 className="font-black text-brand-text text-3xl tracking-tighter leading-none">{title}</h3>
           <p className="text-[10px] font-bold text-brand-muted tracking-widest mt-3 opacity-60">Sistem Keuangan Toko • Manajemen Piutang</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="w-16 h-16 bg-brand-bg border-2 border-brand-border flex items-center justify-center text-brand-muted hover:text-rose-500 rounded-[1.8rem] transition-all shadow-xl active:scale-90 hover:border-rose-500/40">
            <XCircle className="w-8 h-8"/>
          </button>
        )}
      </div>
      <div className="p-14 overflow-y-auto custom-scrollbar relative z-10 bg-brand-card/20">{children}</div>
    </div>
  </div>
);

export default function RelationsView({ 
  customers = [], 
  transactions = [], 
  onRecordPayment, 
  onAddCustomer, 
  formatIDR 
}) {
  const { notifySuccess } = useNotify();
  const [search, setSearch] = useState('');
  const [paymentModal, setPaymentModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [onboardForm, setOnboardForm] = useState({ name: '', phone: '' });

  // --- ANALISA DATA PIUTANG ---
  const arData = useMemo(() => {
    let totalReceivables = 0;
    
    const customersWithAr = customers.map(c => {
      const balance = c.balance || 0;
      const receivables = balance;
      totalReceivables += receivables;
      
      return {
        ...c,
        receivables,
        status: receivables > 1000000 ? 'Critical' : receivables > 0 ? 'Active' : 'Settled'
      };
    }).filter(c => 
      c.name?.toLowerCase().includes(search.toLowerCase()) || 
      c.phone?.includes(search)
    ).sort((a, b) => b.receivables - a.receivables);

    return { customersWithAr, totalReceivables };
  }, [customers, search]);

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(String(payAmount).replace(/\D/g, ''));
    if (!amount || amount <= 0) return;
    
    onRecordPayment({
      customer_id: paymentModal.receivable_id || paymentModal.id,
      amount: amount,
      payment_method: 'cash',
      notes: 'Pembayaran hutang melalui modul Pelanggan & Hutang'
    });
    
    setPaymentModal(null);
    setPayAmount('');
    notifySuccess('PEMBAYARAN BERHASIL DICATAT');
  };

  const RFM_BADGE = {
    vip:       { label: '👑 Donatur Emas',    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    loyal:     { label: '🔥 Umat Aktif',      color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    potential: { label: '✨ Umat Potensial',  color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    at_risk:   { label: '⚠️ Perlu Sapaan',   color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    churned:   { label: '💤 Tidak Aktif',     color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  };

  return (
    <div className="flex-1 p-10 md:p-20 overflow-y-auto custom-scrollbar bg-brand-bg text-brand-text font-sans h-full relative">
      
      {/* HEADER UTAMA PELANGGAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-14">
        <div className="animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-8 mb-8">
             <div className="w-20 h-20 bg-brand-accent rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(var(--brand-accent-rgb),0.5)] relative group overflow-hidden border-2 border-white/10">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700"></div>
                <Users className="text-white w-10 h-10 relative z-10 group-hover:rotate-12 transition-transform duration-500" />
             </div>
             <div>
                <h1 className="text-6xl font-black tracking-tighter leading-none mb-3">
                  Pelanggan <span className="text-brand-accent">& Hutang</span>
                </h1>
                <p className="text-brand-muted text-[11px] font-bold tracking-widest opacity-50 ml-1 leading-none">
                  Manajemen Hutang Pelanggan (Bon) • Buku Kredit Toko
                </p>
             </div>
          </div>
        </div>
        
        <div className="bg-brand-card/80 backdrop-blur-xl border-2 border-brand-border p-10 rounded-[4rem] flex items-center gap-10 shadow-2xl group hover:border-brand-accent/30 transition-all animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="w-24 h-24 bg-brand-accent/10 rounded-[2.2rem] flex items-center justify-center text-brand-accent group-hover:scale-110 group-hover:rotate-12 transition-all shadow-inner border-2 border-brand-accent/20">
            <HandCoins className="w-12 h-12" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-brand-muted tracking-widest mb-4 opacity-70">Total Hutang (Semua Pelanggan)</p>
            <h4 className="text-5xl font-black tracking-tighter text-brand-accent tabular-nums drop-shadow-[0_0_30px_rgba(var(--brand-accent-rgb),0.3)]">{formatIDR(arData.totalReceivables)}</h4>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-14 pb-48">
        
        {/* KIRI: FORM TAMBAH PELANGGAN */}
        <div className="lg:col-span-4 space-y-14">
          <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border p-14 rounded-[5rem] shadow-2xl relative overflow-hidden group/form">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-bl-[150px] pointer-events-none group-hover/form:bg-brand-accent/10 transition-all duration-1000"></div>
            
            <div className="flex items-center gap-6 mb-16 relative z-10 border-b-2 border-brand-border pb-10">
               <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border-2 border-brand-primary/20 shadow-inner group-hover/form:scale-110 transition-transform">
                  <UserPlus size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-bold tracking-tighter">Tambah Pelanggan</h3>
                  <p className="text-[9px] font-bold text-brand-muted tracking-widest opacity-40 mt-1">Daftarkan Data Pelanggan Baru</p>
               </div>
            </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                await onAddCustomer(onboardForm);
                setOnboardForm({ name: '', phone: '' });
              }} className="space-y-10 relative z-10">
                <div className="space-y-4">
                  <label className="block text-[11px] font-bold text-brand-muted tracking-widest ml-4 opacity-70">Nama Lengkap</label>
                  <div className="relative group/inp">
                    <UserCheck className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-muted group-focus-within/inp:text-brand-primary transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={onboardForm.name}
                      onChange={e => setOnboardForm({...onboardForm, name: e.target.value})}
                      placeholder="Masukkan nama lengkap..."
                      className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 pl-20 pr-8 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-sm placeholder:text-brand-text/30 hover:bg-white/80 dark:hover:bg-white/20 tracking-wider"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-[11px] font-bold text-brand-muted tracking-widest ml-4 opacity-70">Nomor WhatsApp / HP</label>
                  <div className="relative group/inp">
                    <Phone className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-muted group-focus-within/inp:text-brand-primary transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={onboardForm.phone}
                      onChange={e => setOnboardForm({...onboardForm, phone: e.target.value})}
                      placeholder="Masukkan nomor hp..."
                      className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 pl-20 pr-8 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-sm placeholder:text-brand-text/30 hover:bg-white/80 dark:hover:bg-white/20 tracking-wider"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-8 bg-brand-primary text-white font-bold rounded-[2.8rem] text-[12px] tracking-widest hover:bg-brand-secondary transition-all shadow-[0_25px_50px_-10px_rgba(var(--brand-primary-rgb),0.5)] active:scale-95 flex items-center justify-center gap-6 group/btn border-2 border-white/10 mt-6">
                  <Database size={24} className="group-hover/btn:rotate-12 transition-transform" /> Simpan Data Pelanggan
                </button>
              </form>
          </div>

          <div className="bg-brand-accent/5 backdrop-blur-md border-2 border-brand-accent/20 p-10 rounded-[4rem] flex items-start gap-8 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 left-0 w-2 h-full bg-brand-accent opacity-30"></div>
            <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent shrink-0 mt-1 border border-brand-accent/20 group-hover:scale-110 transition-transform">
               <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <div className="relative z-10">
               <p className="text-[11px] font-bold text-brand-accent tracking-widest mb-4">Info Penting</p>
               <p className="text-[13px] font-semibold text-brand-muted tracking-tight leading-loose opacity-70 italic">
                 Hanya pelanggan yang terdaftar yang bisa berbelanja menggunakan sistem <span className="text-brand-accent font-black underline">hutang (bon)</span> di kasir.
               </p>
            </div>
          </div>
          
          {/* STATUS SINKRONISASI */}
          <div className="bg-brand-card/60 backdrop-blur-xl border-2 border-brand-border rounded-[4rem] p-10 flex items-center justify-between group hover:border-brand-accent/40 transition-all duration-700 shadow-xl">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent border border-brand-accent/20 group-hover:rotate-[-12deg] transition-transform">
                   <Network size={28} />
                </div>
                <div>
                   <h4 className="text-[11px] font-bold tracking-widest text-brand-text mb-1">Sinkronisasi Data</h4>
                   <span className="text-[9px] font-bold text-brand-muted tracking-widest opacity-40">Data Terupdate</span>
                </div>
             </div>
             <div className="w-12 h-2 bg-brand-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent w-[85%] animate-pulse"></div>
             </div>
          </div>
        </div>

        {/* KANAN: TABEL HUTANG PELANGGAN */}
        <div className="lg:col-span-8">
          <div className="bg-brand-card/40 backdrop-blur-2xl border-2 border-brand-border rounded-[5rem] shadow-2xl overflow-hidden flex flex-col h-full transition-all group/ledger hover:border-brand-accent/20 relative">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-accent/5 blur-[200px] pointer-events-none opacity-0 group-hover/ledger:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="p-14 border-b-2 border-brand-border bg-brand-bg/40 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-10 relative z-10">
              <div>
                <h3 className="text-3xl font-black tracking-tighter flex items-center gap-6">
                   <Layers className="w-10 h-10 text-brand-accent" />
                   Buku Hutang (Bon)
                </h3>
                <p className="text-[11px] font-bold text-brand-muted tracking-widest mt-3 opacity-50 ml-1">Catatan Hutang Pelanggan • Detail Saat Ini</p>
              </div>
              <div className="relative w-full sm:w-[28rem] group">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-muted group-focus-within:text-brand-accent transition-all duration-500" />
                  <input 
                    type="text" 
                    placeholder="Cari nama pelanggan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 pl-20 pr-10 text-xs font-bold text-brand-text outline-none focus:border-brand-accent transition-all shadow-sm placeholder:text-brand-text/30 hover:bg-white/80 dark:hover:bg-white/20 tracking-wider"
                  />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar flex-1 relative z-10 p-4">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-brand-muted tracking-widest text-[10px] font-bold">
                    <th className="px-12 py-10 rounded-l-[2rem]">Nama Pelanggan</th>
                    <th className="px-10 py-10 text-right">Jumlah Hutang</th>
                    <th className="px-12 py-10 text-center rounded-r-[2rem]">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="before:block before:h-4">
                  {arData.customersWithAr.map((c) => {
                    const isCritical = c.status === 'Critical';
                    const isSettled = c.status === 'Settled';

                    return (
                      <tr key={c.id} className="group/row transition-all duration-500 hover:translate-x-2">
                        <td className="px-12 py-10 bg-brand-bg/40 rounded-l-[3.5rem] border-y-2 border-l-2 border-brand-border group-hover/row:border-brand-accent/30 transition-colors">
                          <div className="flex items-center gap-8">
                             <div className={`w-16 h-16 rounded-[1.8rem] border-2 flex items-center justify-center transition-all duration-700 group-hover/row:scale-110 group-hover/row:rotate-12 shadow-inner relative overflow-hidden ${isSettled ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : isCritical ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' : 'bg-brand-accent/5 border-brand-accent/20 text-brand-accent'}`}>
                                <Users size={32} className="relative z-10" />
                             </div>
                             <div>
                                <p className="font-bold text-2xl tracking-tighter group-hover/row:text-brand-accent transition-colors mb-2 leading-none flex items-center gap-2">
                                  {c.name}
                                  {c.rfm_label && RFM_BADGE[c.rfm_label] && (
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border tracking-[0.2em] uppercase ${RFM_BADGE[c.rfm_label].color}`}>
                                      {RFM_BADGE[c.rfm_label].label}
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-4">
                                   <div className={`w-2 h-2 rounded-full ${isSettled ? 'bg-emerald-500' : isCritical ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'} `}></div>
                                   <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50 flex items-center gap-3">
                                      <Phone size={12} className="text-brand-primary" /> {c.phone || 'Tidak Ada Nomor'}
                                   </p>
                                </div>
                             </div>
                          </div>
                        </td>
                        <td className="px-10 py-10 bg-brand-bg/40 border-y-2 border-brand-border group-hover/row:border-brand-accent/30 transition-colors text-right">
                          {c.receivables > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-3xl font-black text-rose-500 tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]">{formatIDR(c.receivables)}</span>
                              <div className={`flex items-center gap-3 px-5 py-2 rounded-xl mt-4 border-2 shadow-xl animate-in zoom-in-50 ${isCritical ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                                 <AlertTriangle size={14} className={isCritical ? 'animate-pulse' : ''} />
                                 <span className="text-[10px] font-bold tracking-widest">
                                    {isCritical ? 'Hutang Besar' : 'Ada Hutang'}
                                 </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-4 text-emerald-500 group-hover/row:scale-105 transition-transform">
                               <ShieldCheck size={28} className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                               <span className="px-6 py-3 bg-emerald-500/10 text-[10px] font-bold rounded-2xl tracking-widest border-2 border-emerald-500/20 shadow-inner backdrop-blur-md">Lunas</span>
                            </div>
                          )}
                        </td>
                        <td className="px-12 py-10 bg-brand-bg/40 rounded-r-[3.5rem] border-y-2 border-r-2 border-brand-border group-hover/row:border-brand-accent/30 transition-colors text-center">
                          {c.receivables > 0 && (
                            <button 
                              onClick={() => { setPaymentModal(c); setPayAmount(c.receivables.toString()); }}
                              className="px-10 py-5 bg-brand-card/80 backdrop-blur-xl border-2 border-brand-border text-[11px] font-bold tracking-widest rounded-[2.2rem] hover:text-white hover:bg-brand-accent hover:border-brand-accent transition-all shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] flex items-center gap-5 mx-auto group/btn active:scale-95 hover:shadow-brand-accent/20"
                            >
                               Bayar Hutang <ArrowRight size={18} className="group-hover/btn:translate-x-3 transition-transform duration-500" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {arData.customersWithAr.length === 0 && (
                     <tr>
                        <td colSpan="3" className="px-12 py-48 text-center">
                           <div className="w-32 h-32 bg-brand-bg rounded-[3.5rem] border-4 border-dashed border-brand-border flex items-center justify-center mx-auto mb-10 opacity-20 group-hover/ledger:opacity-60 transition-all duration-1000 rotate-12 group-hover/ledger:rotate-0">
                              <Database size={56} className="text-brand-muted" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-muted tracking-widest opacity-30">Belum Ada Data Hutang</h3>
                            <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-5 opacity-20">Daftar pelanggan yang memiliki hutang akan muncul di sini.</p>
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL BAYAR HUTANG */}
      {paymentModal && (
        <Modal title="Pembayaran Hutang (Bon)" onClose={() => setPaymentModal(null)} maxWidth="max-w-2xl">
          <form onSubmit={handlePaymentSubmit} className="space-y-16">
            <div className="bg-brand-bg/80 backdrop-blur-xl p-14 rounded-[4rem] border-2 border-brand-border flex flex-col md:flex-row justify-between items-center shadow-inner relative overflow-hidden group/pay gap-10">
              <div className="relative z-10">
                <p className="text-[11px] font-bold text-brand-muted tracking-widest mb-6 opacity-60">Nama Pelanggan</p>
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent border-2 border-brand-accent/20">
                      <UserCheck size={32} />
                   </div>
                   <p className="text-4xl font-black text-brand-text tracking-tighter leading-none">{paymentModal.name}</p>
                </div>
              </div>
              <div className="text-right relative z-10 w-full md:w-auto">
                <p className="text-[11px] font-bold text-rose-500 tracking-widest mb-6 opacity-70">Total Hutang Saat Ini</p>
                <p className="font-black text-rose-500 text-6xl tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(244,63,94,0.3)]">{formatIDR(paymentModal.receivables)}</p>
              </div>
            </div>

            <div className="space-y-10">
              <label className="block text-[12px] font-black text-brand-muted uppercase tracking-[0.6em] text-center opacity-60">Jumlah Pembayaran (Rp)</label>
              <div className="relative group/input">
                <div className="absolute left-12 top-1/2 -translate-y-1/2 font-black text-brand-primary/20 text-4xl tracking-tighter group-focus-within/input:text-brand-primary group-focus-within/input:opacity-100 transition-all duration-700">RP</div>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={payAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const maxVal = paymentModal.receivables;
                    const numVal = Math.min(parseInt(val || '0'), maxVal);
                    setPayAmount(numVal ? numVal.toLocaleString('id-ID') : '');
                  }}
                  className="w-full bg-brand-bg/80 border-4 border-brand-border rounded-[4rem] pl-32 pr-14 py-12 text-7xl font-black text-brand-text outline-none focus:border-brand-primary transition-all tracking-tighter shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] text-right tabular-nums focus:bg-brand-bg"
                />
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center px-6 gap-6">
                 <button 
                   type="button" 
                   onClick={() => setPayAmount(paymentModal.receivables.toLocaleString('id-ID'))}
                   className="px-10 py-5 bg-brand-primary/10 text-brand-primary border-2 border-brand-primary/20 rounded-[2rem] text-[11px] font-bold tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-xl active:scale-95 group/all"
                 >
                   <CheckCircle size={20} className="inline-block mr-3 group-hover/all:scale-125 transition-transform" /> Bayar Lunas Semua
                 </button>
                 <span className="text-[10px] font-bold text-brand-muted tracking-widest opacity-40 italic flex items-center gap-3">
                    <ShieldCheck size={14} /> Memerlukan Konfirmasi Kasir
                 </span>
              </div>
            </div>

            <div className="bg-brand-primary/[0.03] backdrop-blur-md p-10 rounded-[4rem] border-2 border-brand-primary/10 flex items-start gap-10 group hover:bg-brand-primary/[0.08] transition-all duration-700 relative overflow-hidden">
              <div className="w-20 h-20 bg-white rounded-[2.2rem] flex items-center justify-center shadow-2xl shrink-0 group-hover:rotate-12 transition-transform duration-700 border-2 border-brand-primary/10">
                 <Receipt className="w-10 h-10 text-brand-primary" />
              </div>
              <div>
                 <p className="text-[14px] font-semibold text-brand-text tracking-tight leading-loose opacity-80">
                   Pembayaran akan dicatat sebagai <span className="text-brand-primary font-black underline decoration-2 underline-offset-8">Uang Masuk</span>. Sisa hutang pelanggan akan otomatis diperbarui oleh sistem.
                 </p>
              </div>
            </div>

            <button type="submit" className="w-full py-10 bg-brand-accent text-white font-bold rounded-[4rem] text-sm tracking-widest shadow-[0_40px_80px_-20px_rgba(var(--brand-accent-rgb),0.6)] active:scale-95 hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-8 group/auth border-4 border-white/20 relative overflow-hidden">
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
               <Fingerprint size={32} className="relative z-10 group-hover:scale-125 transition-transform duration-700" /> 
               <span className="relative z-10">Konfirmasi Pembayaran</span>
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

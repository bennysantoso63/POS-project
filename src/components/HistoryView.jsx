import React, { useState, useMemo } from 'react';
import { 
  History, Search, Filter, Calendar, 
  Printer, Trash2, ChevronRight, Download,
  CheckCircle, XCircle, AlertCircle, ShoppingBag,
  FileText, ArrowRight, Ban, Clock, MessageSquare, Receipt, Unlock, X,
  ShieldAlert, Fingerprint, Share2, MoreVertical, Layers, Hash, Activity, Globe, ShieldCheck, CreditCard, ChevronDown
} from 'lucide-react';

import CustomDropdown from './ui/CustomDropdown';
import { useNotify } from '../hooks/useNotify';

export default function HistoryView({ 
  transactions = [], 
  onPrintReceipt, 
  onVoidTransaction, 
  currentUser, 
  formatIDR
}) {
  const { notifySuccess, notifyError } = useNotify();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [dateFilter, setDateFilter] = useState('Semua');
  const [selectedTx, setSelectedTx] = useState(null);

  // STATE OTORITAS ADMIN (UNTUK VOID)
  const [authModal, setAuthModal] = useState({ isOpen: false, trxId: null });
  const [adminPin, setAdminPin] = useState('');

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // --- MESIN FILTER ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.id.toString().includes(search) || 
                           tx.cashier?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'Semua' || 
                           (statusFilter === 'Berhasil' && tx.status !== 'void') ||
                           (statusFilter === 'Dibatalkan' && tx.status === 'void');
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
  }, [transactions, search, statusFilter]);

  const handleVoidTrigger = (tx) => {
    if (tx.status === 'voided') return;
    
    if (currentUser?.role === 'admin' || currentUser?.role === 'owner') {
      if (window.confirm(`Apakah Anda yakin ingin membatalkan transaksi TX-${tx.id}?`)) {
        onVoidTransaction(tx.id, currentUser.id);
      }
    } else {
      setAuthModal({ isOpen: true, trxId: tx.id });
    }
  };

  const handleAdminOverride = async (e) => {
    e.preventDefault();
    try {
      const res = await window.api.login(adminPin);
      if (res.success && (res.user.role === 'admin' || res.user.role === 'owner')) {
        onVoidTransaction(authModal.trxId, res.user.id);
        setAuthModal({ isOpen: false, trxId: null });
        setAdminPin('');
        notifySuccess('Otoritas Berhasil: Transaksi telah dibatalkan.');
      } else {
        notifyError(res.error || 'Otoritas Ditolak: PIN Admin/Owner salah.');
      }
    } catch (err) {
      notifyError('Terjadi kesalahan sistem saat verifikasi PIN.');
    }
  };

  return (
    <div className="flex h-full w-full bg-brand-bg text-brand-text font-sans overflow-hidden relative">
      
      {/* SIDEBAR DAFTAR TRANSAKSI */}
      <div className="w-[520px] border-r-2 border-brand-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl flex flex-col shrink-0 h-full shadow-[20px_0_100px_-20px_rgba(0,0,0,0.4)] z-20 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary opacity-30"></div>
        
        <div className="p-12 lg:p-14 border-b-2 border-brand-border relative z-[50]">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-brand-primary rounded-[1.5rem] flex items-center justify-center shadow-[0_15px_30px_-5px_rgba(var(--brand-primary-rgb),0.5)] border-2 border-white/10 group">
                   <History className="text-white w-7 h-7 group-hover:rotate-[-360deg] transition-transform duration-[1500ms]" />
                </div>
                <div>
                   <h2 className="text-2xl font-black tracking-tighter leading-none mb-2">
                     Riwayat <span className="text-brand-primary">Transaksi</span>
                   </h2>
                   <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50">Pusat Data Penjualan</p>
                </div>
             </div>
             <button className="w-12 h-12 bg-brand-card border-2 border-brand-border rounded-2xl text-brand-muted hover:text-brand-primary hover:border-brand-primary/30 transition-all flex items-center justify-center active:scale-90 group/dl">
                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
             </button>
          </div>

          <div className="relative mb-8 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary/40 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nomor nota..." 
              className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 pl-16 pr-6 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-sm tracking-widest placeholder:text-brand-text/30 hover:bg-white/80 dark:hover:bg-white/20"
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-5">
             <CustomDropdown 
               value={statusFilter} 
               onChange={setStatusFilter} 
               options={['Semua', 'Berhasil', 'Dibatalkan']} 
               label="Status"
               icon={<Filter className="w-4 h-4" />}
             />
             <CustomDropdown 
               value={dateFilter} 
               onChange={setDateFilter} 
               options={['Semua Waktu', 'Hari Ini', 'Kemarin']} 
               label="Waktu"
               icon={<Calendar className="w-4 h-4" />}
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-brand-bg/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,var(--brand-primary-rgb)_0%,transparent_70%)] opacity-[0.03] pointer-events-none"></div>
          {filteredTransactions.map(tx => {
             const isVoid = tx.status === 'void';
             const isSelected = selectedTx?.id === tx.id;

             return (
              <button 
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className={`w-full p-10 lg:p-12 text-left hover:bg-brand-bg/80 transition-all border-b-2 border-brand-border relative group/tx animate-in slide-in-from-left-4 duration-500 ${isSelected ? 'bg-brand-bg/95 shadow-inner' : ''}`}
              >
                {isSelected && (
                   <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-brand-primary shadow-[10px_0_30px_rgba(var(--brand-primary-rgb),0.5)] z-20" />
                )}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-brand-muted tracking-widest mb-2 opacity-50">NOMOR NOTA</span>
                    <span className={`font-black text-lg tracking-tighter transition-all duration-500 ${isSelected ? 'text-brand-primary scale-105 origin-left' : 'group-hover/tx:text-brand-primary'}`}>TX-{tx.id}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-brand-muted tracking-widest mb-2 opacity-50">TOTAL</span>
                    <span className="font-black text-xl text-brand-accent tracking-tighter shadow-brand-accent/10 drop-shadow-sm">{formatIDR(tx.total)}</span>
                  </div>
                </div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-brand-muted tracking-widest">
                  <div className="flex items-center gap-4 group-hover/tx:text-brand-text transition-colors">
                    <Clock size={14} className="text-brand-primary animate-pulse" />
                    <span>{formatDateTime(tx.created_at || tx.date).time}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-border"></span>
                    <span className="opacity-60">{formatDateTime(tx.created_at || tx.date).date}</span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl border-2 transition-all duration-700 ${isVoid ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                    {isVoid ? 'Dibatalkan' : 'Berhasil'}
                  </div>
                </div>
              </button>
             );
          })}
          {filteredTransactions.length === 0 && (
            <div className="p-24 text-center flex flex-col items-center opacity-10">
               <div className="w-24 h-24 bg-brand-border rounded-[2.5rem] flex items-center justify-center mb-8 border-4 border-dashed border-brand-muted">
                  <Layers size={48} className="text-brand-muted" />
               </div>
               <p className="text-sm font-bold tracking-widest">Belum Ada Riwayat Transaksi</p>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL NOTA TRANSAKSI */}
      <div className="flex-1 bg-brand-bg p-12 lg:p-16 overflow-y-auto custom-scrollbar flex flex-col items-center justify-start relative z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--brand-accent-rgb)_0%,transparent_50%)] opacity-[0.02] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--brand-primary-rgb)_0%,transparent_50%)] opacity-[0.02] pointer-events-none"></div>
        
        {selectedTx ? (
          <div className="w-full max-w-6xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl border-2 border-brand-border rounded-[4rem] shadow-[0_50px_150px_-50px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col lg:flex-row min-h-[850px] group/main-card hover:border-brand-primary/20 transition-all duration-1000">
            
            {/* KIRI: RINGKASAN STATUS */}
            <div className="lg:w-[420px] bg-brand-bg/40 border-r-2 border-brand-border p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover/main-card:scale-150 transition-transform duration-[3000ms]"><Activity size={300} /></div>
              
              <div className="relative z-10">
                 <div className="w-24 h-24 bg-brand-card border-2 border-brand-border rounded-[2rem] flex items-center justify-center text-brand-primary mb-12 shadow-2xl group/receipt hover:rotate-12 transition-transform duration-500">
                    <Receipt size={48} className="group-hover/receipt:scale-110 transition-transform" />
                 </div>
                 <div className="flex items-center gap-4 mb-6">
                    <span className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-xl border border-brand-primary/20 tracking-widest shadow-sm">Data Terverifikasi</span>
                 </div>
                 <p className="text-[11px] font-bold text-brand-muted tracking-widest mb-6 opacity-60">Total Pembayaran</p>
                 <h3 className="text-7xl font-black tracking-tighter leading-none mb-10 text-brand-text shadow-black/10 drop-shadow-2xl group-hover/main-card:scale-105 transition-transform duration-700 origin-left">{formatIDR(selectedTx.total)}</h3>
                 
                  <div className="space-y-10">
                    <div className="flex flex-col gap-4">
                       <span className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50 flex items-center gap-3">
                          <ShieldCheck size={14} className="text-brand-primary" /> Status Transaksi
                       </span>
                       <div className={`flex items-center justify-between px-8 py-6 rounded-[2.5rem] border-2 transition-all duration-1000 ${selectedTx.status === 'void' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-2xl shadow-rose-500/10' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-2xl shadow-emerald-500/10'}`}>
                          <div className="flex items-center gap-4">
                             {selectedTx.status === 'voided' ? <XCircle size={24} className="animate-pulse" /> : <CheckCircle size={24} className="animate-bounce" />}
                             <span className="text-[12px] font-bold tracking-widest">{selectedTx.status === 'void' ? 'Dibatalkan' : 'Berhasil'}</span>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${selectedTx.status === 'void' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4">
                       <span className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50 flex items-center gap-3">
                          <Globe size={14} className="text-brand-primary" /> Metode Pembayaran
                       </span>
                       <div className="flex items-center gap-6 p-8 bg-brand-card/80 border-2 border-brand-border rounded-[2.5rem] shadow-xl group/pay-method hover:border-brand-primary/40 transition-all">
                          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-inner group-hover/pay-method:scale-110 transition-transform">
                             <CreditCard size={28} />
                          </div>
                          <div>
                             <p className="text-[12px] font-bold text-brand-text tracking-widest">{selectedTx.payment_method?.charAt(0).toUpperCase() + selectedTx.payment_method?.slice(1) || 'Tunai'}</p>
                             <p className="text-[9px] font-bold text-brand-muted tracking-widest mt-2 opacity-50">Sinkronisasi Lokal</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-12 border-t-2 border-brand-border relative z-10">
                 <p className="text-[10px] font-bold text-brand-muted tracking-widest mb-8 opacity-60">Tindakan Sistem</p>
                 <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={() => onPrintReceipt?.(selectedTx)}
                      className="flex flex-col items-center justify-center gap-4 py-8 bg-brand-primary text-white rounded-[2rem] text-[10px] font-bold tracking-widest shadow-[0_20px_40px_-10px_rgba(var(--brand-primary-rgb),0.5)] hover:bg-brand-secondary transition-all active:scale-90 group/btn-p"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover/btn-p:scale-110 transition-transform"><Printer size={22} /></div>
                      Cetak Struk
                    </button>
                    <button className="flex flex-col items-center justify-center gap-4 py-8 bg-brand-card border-2 border-brand-border text-brand-muted hover:text-brand-primary hover:border-brand-primary/40 rounded-[2rem] text-[10px] font-bold tracking-widest transition-all active:scale-90 group/btn-s">
                      <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center group-hover/btn-s:scale-110 transition-transform"><Share2 size={22} /></div>
                      Bagikan Nota
                    </button>
                    <button 
                      onClick={() => handleVoidTrigger(selectedTx)}
                      disabled={selectedTx.status === 'void'}
                      className={`col-span-2 flex items-center justify-center gap-6 py-8 rounded-[2.5rem] text-[11px] font-bold tracking-widest transition-all active:scale-95 border-2 shadow-2xl relative overflow-hidden group/void-btn
                        ${selectedTx.status === 'void' 
                          ? 'bg-brand-bg/50 text-brand-muted border-brand-border opacity-50 cursor-not-allowed' 
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white hover:border-rose-600 shadow-rose-500/10'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${selectedTx.status === 'voided' ? 'bg-brand-bg' : 'bg-rose-500/20 group-hover/void-btn:bg-white/20 group-hover/void-btn:rotate-180'}`}>
                         <Ban size={22} />
                      </div>
                      Batalkan Transaksi (Void)
                    </button>
                 </div>
              </div>
            </div>

            {/* KANAN: DETAIL BARANG */}
            <div className="flex-1 p-14 lg:p-20 flex flex-col relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--brand-primary-rgb)_0%,transparent_70%)] opacity-[0.01] pointer-events-none"></div>
               
               <div className="flex justify-between items-center mb-16 border-b-2 border-brand-border pb-12 relative z-10">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-brand-bg border-2 border-brand-border rounded-[1.5rem] flex items-center justify-center text-brand-primary shadow-inner">
                       <FileText size={32} />
                    </div>
                    <div>
                       <h4 className="text-lg font-bold tracking-tight mb-2">Detail Nota Belanja</h4>
                       <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-60">Data Transaksi Terverifikasi</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-bold text-brand-muted tracking-widest mb-2 opacity-50">Nomor Nota</span>
                     <div className="flex items-center gap-4 bg-brand-bg/80 border-2 border-brand-border px-8 py-4 rounded-[1.8rem] shadow-xl">
                        <Hash size={18} className="text-brand-primary" />
                        <span className="text-xl font-black tracking-[0.1em] text-brand-text">TX-{selectedTx.id}</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-16 mb-20 relative z-10">
                  <div className="flex items-center gap-6 group/meta">
                    <div className="w-14 h-14 bg-brand-bg border-2 border-brand-border rounded-2xl flex items-center justify-center text-brand-primary group-hover/meta:border-brand-primary/40 transition-all shadow-inner">
                       <Clock size={24} />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50">Waktu Transaksi</p>
                       <p className="text-lg font-bold tracking-tight text-brand-text group-hover/meta:text-brand-primary transition-colors">
                         {formatDateTime(selectedTx.created_at || selectedTx.date).date} <span className="text-brand-muted opacity-40 mx-2">|</span> {formatDateTime(selectedTx.created_at || selectedTx.date).time}
                       </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 justify-end group/meta-right text-right">
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50">Kasir Bertugas</p>
                       <p className="text-lg font-bold tracking-tight text-brand-text group-hover/meta-right:text-brand-primary transition-colors">
                         {selectedTx.cashier || 'Sistem Utama'}
                       </p>
                    </div>
                    <div className="w-14 h-14 bg-brand-bg border-2 border-brand-border rounded-2xl flex items-center justify-center text-brand-primary group-hover/meta-right:border-brand-primary/40 transition-all shadow-inner">
                       <Fingerprint size={24} />
                    </div>
                  </div>
               </div>

               <div className="flex-1 relative z-10 flex flex-col">
                  <div className="flex items-center justify-between mb-10 border-b-2 border-brand-border pb-6">
                     <p className="text-[11px] font-bold text-brand-muted tracking-widest opacity-60">Daftar Barang yang Dibeli</p>
                     <span className="px-4 py-1 bg-brand-bg border border-brand-border rounded-lg text-[9px] font-bold text-brand-muted tracking-widest">{selectedTx.items?.length || 0} Barang Terdeteksi</span>
                  </div>
                  
                  <div className="space-y-8 overflow-y-auto custom-scrollbar pr-10 flex-1 max-h-[450px]">
                    {selectedTx.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center group/item-row p-6 hover:bg-brand-bg/40 rounded-[2.5rem] border-2 border-transparent hover:border-brand-border transition-all duration-500 shadow-sm">
                        <div className="flex gap-8 items-center">
                          <div className="w-16 h-16 bg-brand-card border-2 border-brand-border text-brand-primary text-xl font-black rounded-[1.5rem] flex items-center justify-center shadow-xl group-hover/item-row:bg-brand-primary group-hover/item-row:text-white group-hover/item-row:scale-110 group-hover/item-row:-rotate-6 transition-all duration-500">
                            {Math.abs(item.qty)}
                          </div>
                          <div>
                            <p className="text-xl font-bold tracking-tight text-brand-text group-hover/item-row:text-brand-primary transition-colors duration-500 leading-none mb-3">{item.name}</p>
                            <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50 flex items-center gap-3">
                               <span className="text-brand-primary">Harga:</span> {formatIDR(item.price_at_transaction || item.price)} / Satuan
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                           <span className="text-2xl font-black tracking-tighter text-brand-text group-hover/item-row:text-brand-accent transition-colors duration-500">{formatIDR(Math.abs(item.qty * (item.price_at_transaction || item.price)))}</span>
                           <p className="text-[9px] font-bold text-brand-muted tracking-widest mt-1 opacity-40">Subtotal</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="mt-14 pt-12 border-t-4 border-brand-border space-y-6 relative z-10">
                  <div className="flex justify-between items-center text-[11px] font-bold tracking-widest text-brand-muted">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-brand-border"></div>
                       <span>Total Harga Kotor</span>
                    </div>
                    <span className="text-brand-text tracking-widest">{formatIDR(selectedTx.subtotal || selectedTx.total)}</span>
                  </div>
                  {selectedTx.discount > 0 && (
                    <div className="flex justify-between items-center text-[11px] font-bold tracking-widest text-rose-500 group/disc">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                         <span>Potongan Diskon</span>
                      </div>
                      <span className="tracking-widest bg-rose-500/10 px-4 py-1.5 rounded-xl border border-rose-500/20 shadow-sm animate-in slide-in-from-right-4">-{formatIDR(selectedTx.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-12 border-t-2 border-brand-border mt-10 bg-brand-bg/50 p-10 rounded-[3rem] shadow-inner relative overflow-hidden group/final">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12 group-hover/final:scale-125 transition-transform duration-[2000ms]"><ShieldCheck size={200} /></div>
                    <div className="relative z-10">
                       <span className="text-[12px] font-bold tracking-widest text-brand-muted mb-4 block opacity-50">Total Akhir (Neto)</span>
                       <span className="text-6xl font-black text-brand-accent tracking-tighter leading-none shadow-black/10 drop-shadow-2xl">{formatIDR(selectedTx.total)}</span>
                    </div>
                    <div className="flex flex-col items-end relative z-10">
                       <div className="w-16 h-16 bg-brand-accent/10 rounded-[1.8rem] flex items-center justify-center text-brand-accent border-2 border-brand-accent/20 shadow-xl group-hover/final:rotate-12 transition-transform mb-4">
                          <ShieldCheck size={32} />
                       </div>
                       <span className="text-[10px] font-bold tracking-widest text-emerald-500">Transaksi Terverifikasi</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-brand-muted animate-in fade-in duration-1000 scale-110">
            <div className="relative mb-14 group">
               <div className="absolute inset-0 bg-brand-primary blur-[100px] opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-1000"></div>
               <div className="w-56 h-56 bg-brand-card/40 backdrop-blur-xl border-4 border-dashed border-brand-border rounded-[5rem] flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:border-brand-primary/20 transition-all duration-700">
                  <ShieldAlert className="w-28 h-28 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-[1500ms]" />
               </div>
            </div>
            <h3 className="text-3xl font-black tracking-widest text-brand-text mb-6">Pilih Transaksi</h3>
            <p className="text-sm font-bold tracking-wider text-brand-muted opacity-40 max-w-lg text-center leading-relaxed">Silakan pilih salah satu transaksi di samping untuk melihat detail lengkapnya.</p>
          </div>
        )}
      </div>

      {/* MODAL OTORITAS ADMIN UNTUK VOID */}
      {authModal.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-brand-bg/90 backdrop-blur-2xl animate-in fade-in duration-700">
          <div className="bg-brand-card p-14 lg:p-20 rounded-[5rem] shadow-[0_50px_150px_-30px_rgba(0,0,0,0.6)] border-2 border-brand-border w-full max-w-xl relative animate-in zoom-in-95 duration-700 overflow-hidden group/modal">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.5)]"></div>
            
            <button onClick={() => setAuthModal({isOpen: false, trxId: null})} className="absolute top-10 right-10 w-14 h-14 bg-brand-bg border-2 border-brand-border rounded-2xl flex items-center justify-center text-brand-muted hover:text-rose-500 hover:border-rose-500/30 transition-all active:scale-90 shadow-xl group/close">
              <X size={32} className="group-hover/close:rotate-90 transition-transform duration-500" />
            </button>

            <div className="flex flex-col items-center text-center mb-14 relative z-10">
              <div className="w-28 h-28 bg-rose-500/10 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner border-2 border-rose-500/20 group-hover/modal:scale-110 group-hover/modal:rotate-12 transition-all duration-1000 relative">
                <div className="absolute inset-0 bg-rose-500 animate-ping opacity-10 rounded-[2.5rem]"></div>
                <Fingerprint size={56} className="relative z-10" />
              </div>
              <h3 className="text-4xl font-black tracking-tighter mb-4 text-brand-text">Otoritas <span className="text-rose-500">Admin</span></h3>
              <p className="text-[11px] text-brand-muted font-bold tracking-widest leading-relaxed max-w-sm mx-auto opacity-70">
                Pembatalan transaksi <span className="text-brand-text font-black px-3 py-1 bg-brand-bg border border-brand-border rounded-lg mx-2">TX-{authModal.trxId}</span> memerlukan PIN otoritas admin.
              </p>
            </div>

            <form onSubmit={handleAdminOverride} className="space-y-12 relative z-10">
              <div className="group/input-box relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 to-transparent blur-xl opacity-0 group-focus-within/input-box:opacity-100 transition-opacity duration-1000"></div>
                <Unlock className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-brand-muted group-focus-within/input-box:text-rose-500 transition-all duration-500" />
                <input 
                  type="password" 
                  autoFocus
                  placeholder="••••" 
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value)}
                  className="w-full bg-brand-bg/80 border-4 border-brand-border rounded-[3rem] px-12 py-10 text-center tracking-[1.5em] text-6xl font-black outline-none focus:border-rose-500/50 text-brand-text shadow-2xl transition-all placeholder:opacity-5 placeholder:text-brand-text"
                />
              </div>
              <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-8 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(244,63,94,0.6)] active:scale-95 tracking-widest text-sm transition-all duration-500 flex items-center justify-center gap-6 group/auth-btn">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover/auth-btn:rotate-12 transition-transform duration-500"><Lock size={26} /></div>
                Konfirmasi Pembatalan
              </button>
              <div className="flex items-center justify-center gap-4 py-6 px-10 bg-brand-bg/50 border-2 border-brand-border rounded-[2rem] opacity-40">
                 <ShieldAlert size={16} className="text-rose-500" />
                 <p className="text-[10px] font-bold text-brand-muted tracking-widest text-center">Setiap percobaan akses akan dicatat dalam log keamanan sistem.</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

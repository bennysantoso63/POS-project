import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, Banknote, Search, AlertCircle, 
  ArrowUpRight, ChevronRight, XCircle
} from 'lucide-react';

const Modal = ({ title, children, onClose, maxWidth = 'max-w-md' }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className={`bg-white dark:bg-[#1A2640] rounded-[2rem] w-full ${maxWidth} shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden transition-colors`}>
      <div className="px-6 py-5 border-b border-slate-100 dark:border-[#35577D]/30 flex justify-between items-center bg-slate-50 dark:bg-[#141E30] shrink-0 transition-colors">
        <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight">{title}</h3>
        {onClose && <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-[#243350] rounded-full transition-colors"><XCircle className="w-5 h-5"/></button>}
      </div>
      <div className="p-6 overflow-y-auto">{children}</div>
    </div>
  </div>
);

export default function RelationsView({ 
  customers = [], 
  onAddCustomer, 
  transactions = [], 
  onRecordPayment, 
  showToast 
}) {
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [search, setSearch] = useState('');
  const [paymentModal, setPaymentModal] = useState(null); 
  const [payAmount, setPayAmount] = useState('');

  // --- LOGIC: KALKULASI AR ---
  const customerData = useMemo(() => {
    return customers.map(c => {
      // Sisa hutang diambil dari balance DB. Jika balance < 0 maka itu piutang (uang di luar).
      const sisaUtang = c.balance < 0 ? Math.abs(c.balance) : 0;
      return { ...c, sisaUtang };
    }).filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.phone && c.phone.includes(search))
    ).sort((a, b) => b.sisaUtang - a.sisaUtang); 
  }, [customers, search]);

  const totalPiutangUsaha = customerData.reduce((sum, c) => sum + Math.max(0, c.sisaUtang), 0);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) return showToast("Nama pelanggan wajib diisi!", "error");
    await onAddCustomer({ name: newCustomer.name, phone: newCustomer.phone });
    setNewCustomer({ name: '', phone: '' });
    showToast("Pelanggan (Debitur) berhasil ditambahkan.", "success");
  };

  const submitPayment = (e) => {
    e.preventDefault();
    const amount = parseInt(payAmount);
    if (!amount || amount <= 0) return showToast("Nominal tidak valid", "error");
    if (amount > paymentModal.sisaUtang) return showToast("Nominal melebihi sisa hutang!", "error");

    onRecordPayment({
      customer_id: paymentModal.id,
      amount: amount,
      payment_method: 'cash',
      notes: 'Pelunasan Piutang via Buku Bon'
    });

    setPaymentModal(null);
    setPayAmount('');
    showToast(`Pelunasan Rp ${new Intl.NumberFormat('id-ID').format(amount)} berhasil dicatat!`, "success");
  };

  const getRFMBadge = (balance) => {
    const sisa = balance < 0 ? Math.abs(balance) : 0;
    if (sisa > 1000000) return { label: '👑 Donatur Emas', color: 'text-[#FFC05F] dark:text-[#D4A040]' };
    if (sisa > 200000) return { label: '🔥 Aktif', color: 'text-[#53D2DC] dark:text-[#38B2AC]' };
    return { label: '❄️ Pasif', color: 'text-slate-400 dark:text-[#64748b]' };
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#141E30] overflow-hidden animate-in fade-in duration-300 transition-colors">
      
      {/* HEADER */}
      <header className="px-6 md:px-10 py-6 bg-[#F0FAFA] dark:bg-[#1A2640] border-b border-slate-200 dark:border-[#35577D]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 shrink-0 transition-colors shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
             <Users className="w-8 h-8 text-[#FFC05F] dark:text-[#D4A040]"/> Relasi & Piutang
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#64748b] font-bold mt-1">Manajemen Pelanggan dan Kasbon (Accounts Receivable).</p>
        </div>
        
        {/* Working Capital AR Widget */}
        <div className="bg-[#FFC05F]/10 dark:bg-[#D4A040]/10 border border-[#FFC05F]/20 dark:border-[#D4A040]/20 p-4 rounded-2xl flex items-center gap-4 shadow-sm w-full md:w-auto transition-colors">
           <div className="w-12 h-12 bg-white dark:bg-[#243350] rounded-xl flex items-center justify-center border border-[#FFC05F]/20 dark:border-[#D4A040]/20 text-[#FFC05F] dark:text-[#D4A040] shrink-0 transition-colors">
              <ArrowUpRight className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-[#FFC05F] dark:text-[#D4A040] tracking-widest mb-0.5">Total Uang di Luar (Piutang)</p>
              <p className="text-2xl font-black text-slate-800 dark:text-[#D4A040] tracking-tighter">{formatRp(totalPiutangUsaha)}</p>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* KIRI: FORM TAMBAH PELANGGAN */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#1A2640] p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-[#35577D]/30 shadow-sm transition-colors">
               <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#FFC05F] dark:text-[#D4A040]"/> Tambah Pelanggan Baru
               </h3>
               <form onSubmit={handleAddCustomer} className="space-y-5">
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-widest mb-2">Nama Lengkap *</label>
                     <input required type="text" value={newCustomer.name} onChange={e=>setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-[#F0FAFA] dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#FFC05F] transition-colors" placeholder="Misal: Bp. Budi" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-widest mb-2">No. WhatsApp</label>
                     <input type="text" value={newCustomer.phone} onChange={e=>setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-[#F0FAFA] dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#FFC05F] transition-colors" placeholder="08..." />
                  </div>
                  <button type="submit" className="w-full py-4 mt-2 bg-slate-900 dark:bg-[#35577D] text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-xs tracking-widest uppercase hover:bg-black dark:hover:bg-[#1A2640]">
                     SIMPAN DATABASE
                  </button>
               </form>
            </div>

            <div className="bg-[#FFC05F]/10 dark:bg-[#D4A040]/10 border border-[#FFC05F]/20 dark:border-[#D4A040]/20 p-6 rounded-[2rem] flex items-start gap-4 transition-colors">
               <AlertCircle className="w-6 h-6 text-[#FFC05F] dark:text-[#D4A040] shrink-0" />
               <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                  Pelanggan yang terdaftar di sini dapat dipilih saat kasir melakukan metode pembayaran <strong className="text-[#FF826C] dark:text-[#E07060]">Bon / Kasbon</strong> di layar utama.
               </p>
            </div>
         </div>

         {/* KANAN: DAFTAR DEBITUR */}
         <div className="lg:col-span-2 flex flex-col h-full">
            <div className="bg-white dark:bg-[#1A2640] rounded-[2rem] border border-slate-200 dark:border-[#35577D]/30 shadow-sm flex flex-col flex-1 overflow-hidden transition-colors">
               
               <div className="p-6 border-b border-slate-100 dark:border-[#35577D]/30 bg-[#F0FAFA] dark:bg-[#141E30] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 transition-colors">
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Buku Pembantu Piutang (AR)</h3>
                  <div className="relative w-full sm:w-64">
                     <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                     <input type="text" placeholder="Cari nama debitur..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full bg-white dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#FFC05F] shadow-sm transition-colors" />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-[#F0FAFA] dark:bg-[#141E30] border-b border-slate-200 dark:border-[#35577D]/30 text-slate-500 dark:text-[#64748b] uppercase text-[10px] font-black tracking-widest sticky top-0 z-10 transition-colors">
                        <tr>
                           <th className="px-6 py-4">Nama Pelanggan</th>
                           <th className="px-6 py-4">Kontak</th>
                           <th className="px-6 py-4 text-right">Saldo Kasbon</th>
                           <th className="px-6 py-4 text-center">Tindakan</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-[#35577D]/30 transition-colors">
                        {customerData.map(c => {
                           const badge = getRFMBadge(c.balance);
                           return (
                           <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#243350]/50 transition-colors group">
                              <td className="px-6 py-5">
                                 <p className="font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
                                 <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${badge.color}`}>{badge.label}</p>
                              </td>
                              <td className="px-6 py-5 text-slate-500 dark:text-[#64748b] font-mono text-xs">{c.phone || '-'}</td>
                              <td className="px-6 py-5 text-right">
                                 {c.sisaUtang > 0 ? (
                                    <span className="font-black text-[#FF826C] dark:text-[#E07060] text-base">{formatRp(c.sisaUtang)}</span>
                                 ) : (
                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-lg">Lunas</span>
                                 )}
                              </td>
                              <td className="px-6 py-5 text-center">
                                 {c.sisaUtang > 0 ? (
                                    <button onClick={() => { setPaymentModal(c); setPayAmount(c.sisaUtang); }} className="px-4 py-2 bg-white dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 text-slate-700 dark:text-slate-300 hover:text-[#FFC05F] dark:hover:text-[#D4A040] hover:border-[#FFC05F] dark:hover:border-[#D4A040] font-black rounded-xl text-[10px] uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-1">
                                       Terima Bayar <ChevronRight className="w-3 h-3" />
                                    </button>
                                 ) : (
                                    <span className="text-slate-300 dark:text-[#64748b] text-xs font-bold">-</span>
                                 )}
                              </td>
                           </tr>
                        )})}
                        {customerData.length === 0 && (
                           <tr>
                              <td colSpan="4" className="px-6 py-12 text-center text-slate-400 dark:text-[#64748b]">
                                 <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                 <p className="font-bold text-sm">Tidak ada pelanggan ditemukan.</p>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>

      {/* PAYMENT MODAL */}
      {paymentModal && (
         <Modal title="Terima Pembayaran Piutang" onClose={() => setPaymentModal(null)}>
            <form onSubmit={submitPayment} className="space-y-6">
               
               <div className="bg-[#F0FAFA] dark:bg-[#141E30] p-5 rounded-2xl border border-slate-200 dark:border-[#35577D]/30 flex justify-between items-center transition-colors">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#64748b] mb-1">Debitur</p>
                     <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">{paymentModal.name}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#FF826C] dark:text-[#E07060] mb-1">Sisa Hutang</p>
                     <p className="font-black text-[#FF826C] dark:text-[#E07060] text-xl">{formatRp(paymentModal.sisaUtang)}</p>
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-widest mb-3">Nominal Dibayar (Kas Masuk) *</label>
                  <div className="relative">
                     <span className="absolute left-4 top-4 font-black text-slate-400">Rp</span>
                     <input type="number" required autoFocus min="1" max={paymentModal.sisaUtang} value={payAmount} onChange={e=>setPayAmount(e.target.value)} className="w-full bg-white dark:bg-[#243350] border border-slate-300 dark:border-[#35577D]/30 rounded-2xl pl-12 pr-6 py-4 text-2xl font-black text-slate-800 dark:text-slate-200 outline-none focus:border-[#53D2DC] transition-colors shadow-sm" />
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                     <button type="button" onClick={() => setPayAmount(paymentModal.sisaUtang)} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors">
                        Lunasi Semua
                     </button>
                  </div>
               </div>

               <div className="bg-[#53D2DC]/10 dark:bg-[#38B2AC]/10 p-4 rounded-xl border border-[#53D2DC]/20 dark:border-[#38B2AC]/20 flex items-start gap-3 transition-colors">
                  <Banknote className="w-5 h-5 text-[#53D2DC] dark:text-[#38B2AC] shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                     Pembayaran ini akan dicatat sebagai <strong className="font-black text-[#53D2DC] dark:text-[#38B2AC]">Kas Masuk</strong> pada hari ini dan akan mengurangi total Uang di Luar (Piutang Usaha) di Laporan Neraca Anda.
                  </p>
               </div>

               <button type="submit" className="w-full py-5 text-white font-black rounded-2xl shadow-xl shadow-[#53D2DC]/30 active:scale-95 transition-all text-sm tracking-widest uppercase bg-[#53D2DC] hover:bg-[#38B2AC]">
                  KONFIRMASI PELUNASAN
               </button>
            </form>
         </Modal>
      )}
    </div>
  );
}

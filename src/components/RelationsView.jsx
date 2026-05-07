import React, { useState, useMemo } from 'react';
import { 
  Users, Search, ArrowUpRight, Clock, Phone, 
  CreditCard, CheckCircle2, AlertCircle, TrendingUp,
  Filter, Download, Landmark, XCircle
} from 'lucide-react';

export default function RelationsView({ 
  customers = [], 
  transactions = [], 
  onRecordPayment, 
  onAddCustomer, 
  showToast,
  activeSession 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
    );
  }, [customers, searchQuery]);

  const totalPiutangGlobal = useMemo(() => {
    return customers.reduce((sum, p) => sum + (p.balance < 0 ? Math.abs(p.balance) : 0), 0);
  }, [customers]);

  const handlePayPiutang = async () => {
    if (!selectedCustomer || !payAmount || isNaN(payAmount)) return;
    
    if (!activeSession) {
      showToast("Buka Shift terlebih dahulu untuk menerima pembayaran", "error");
      return;
    }

    try {
      const amount = parseInt(payAmount);
      if (amount <= 0) return;

      await onRecordPayment({
        customer_id: selectedCustomer.id,
        amount: amount,
        payment_method: 'cash',
        notes: 'Pelunasan Piutang via CRM'
      });

      setPayAmount('');
      setSelectedCustomer(null);
      showToast("Pembayaran Piutang Berhasil");
    } catch (error) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50/50 w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Landmark className="w-8 h-8 text-indigo-600"/> MANAGEMENT PIUTANG
          </h1>
          <p className="text-slate-500 font-medium mt-1">Pantau & Kelola Hutang Pelanggan (CRM Financial)</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex items-center gap-4">
             <div className="p-3 bg-red-50 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-red-500"/>
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Piutang Berjalan</p>
                <p className="text-xl font-black text-red-600 tracking-tight">{formatIDR(totalPiutangGlobal)}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm p-8">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500"/> DAFTAR BON AKTIF
                 </h3>
                 <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari Pelanggan..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs focus:outline-none focus:border-blue-500 transition-all w-48 md:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
              </div>

              <div className="space-y-3">
                {filteredCustomers.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedCustomer(p)}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedCustomer?.id === p.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          {p.name?.charAt(0)}
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 uppercase tracking-tight">{p.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400">
                             <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {p.phone || '-'}</span>
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                       <p className={`text-lg font-black tracking-tighter ${p.balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatIDR(Math.abs(p.balance || 0))}</p>
                    </div>
                  </div>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="py-20 text-center opacity-20 flex flex-col items-center">
                    <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500"/>
                    <p className="font-black uppercase tracking-[0.2em]">Tidak Ada Data Pelanggan</p>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                 <CreditCard className="w-32 h-32"/>
              </div>
              
              <div className="relative z-10">
                <h3 className="font-black text-xl mb-2 tracking-tight">PEMBAYARAN BON</h3>
                <p className="text-slate-400 text-xs font-medium mb-8">Pilih pelanggan untuk mencatat pelunasan</p>

                {!selectedCustomer ? (
                  <div className="py-10 text-center border-2 border-dashed border-slate-700 rounded-3xl">
                     <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Pilih Data Pelanggan</p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                     <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pelanggan</p>
                        <p className="font-black text-lg">{selectedCustomer.name}</p>
                        <p className={`font-black text-xl mt-2 ${selectedCustomer.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatIDR(Math.abs(selectedCustomer.balance || 0))}</p>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Jumlah Bayar (IDR)</label>
                        <input 
                          type="number" 
                          className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 px-6 text-xl font-black focus:outline-none focus:border-indigo-500 transition-all text-white"
                          placeholder="Masukkan Nominal..."
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2 mt-2">
                           <button onClick={() => setPayAmount(Math.abs(selectedCustomer.balance || 0))} className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black border border-slate-700">BAYAR LUNAS</button>
                           <button onClick={() => setPayAmount(Math.abs((selectedCustomer.balance || 0) / 2))} className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black border border-slate-700">BAYAR 50%</button>
                        </div>
                     </div>

                     <button 
                       onClick={handlePayPiutang}
                       disabled={!payAmount || payAmount <= 0}
                       className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-5 rounded-3xl font-black text-lg shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                     >
                        SIMPAN PELUNASAN <CheckCircle2 className="w-6 h-6"/>
                     </button>
                     <button onClick={() => setSelectedCustomer(null)} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Batalkan</button>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

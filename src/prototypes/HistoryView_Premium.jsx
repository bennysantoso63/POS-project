import React, { useState, useMemo } from 'react';
import { 
  Search, Receipt, Printer, XCircle, 
  MessageSquare, Filter, History as HistoryIcon 
} from 'lucide-react';

export default function History({ 
  transactions = [], 
  currentUser, 
  onVoidTransaction, 
  onReprint,
  showToast 
}) {
  const [selectedTx, setSelectedTx] = useState(transactions[0] || null);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // --- LOGIC: FILTERING ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      let matchSearch = true;
      if (search) {
        const query = search.toLowerCase();
        matchSearch = tx.id.toLowerCase().includes(query) || tx.cashier?.toLowerCase().includes(query);
      }
      let matchDate = true;
      if (filterDate) {
        const txDatePart = tx.date.split(',')[0]; 
        const parts = txDatePart.split(/[\/\-.]/);
        if (parts.length >= 3) {
          const txDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          matchDate = txDateStr === filterDate;
        }
      }
      return matchSearch && matchDate;
    });
  }, [transactions, search, filterDate]);

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  const handleVoid = () => {
    if (selectedTx.status !== 'completed') return showToast("Transaksi belum sukses atau sudah divoid.", "error");
    if (currentUser?.role !== 'admin') return showToast("Otorisasi ditolak! Khusus Admin.", "error");
    if (window.confirm(`PERINGATAN AUDIT!\nBatalkan struk ${selectedTx.id} senilai ${formatRp(selectedTx.total)}?\nSistem akan membuat Jurnal Balik (Refund).`)) {
      onVoidTransaction(selectedTx);
    }
  };

  const handleSendEReceipt = () => {
    const text = `*${selectedTx.id}*\nTotal: ${formatRp(selectedTx.total)}\nTerima kasih telah berbelanja!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast("Membuka WhatsApp Web...", "success");
  };

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-300 transition-colors">
      
      {/* KIRI: DAFTAR TRANSAKSI */}
      <div className="w-1/3 max-w-sm bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-10 shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.02)] transition-colors">
         <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0 space-y-4 transition-colors">
            <h2 className="font-black text-slate-800 dark:text-slate-100 text-xl flex items-center gap-2">
               <HistoryIcon className="w-5 h-5 text-amber-600 dark:text-amber-500"/> Riwayat Transaksi
            </h2>
            <div className="flex gap-2">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Cari No. Struk..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors shadow-sm" />
               </div>
               <div className="relative w-10 h-10 shrink-0">
                  <input type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`absolute inset-0 flex items-center justify-center rounded-xl border transition-colors ${filterDate ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                     <Filter className="w-4 h-4" />
                  </div>
               </div>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredTransactions.map(tx => (
               <button 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)} 
                  className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 transition-colors ${selectedTx?.id === tx.id ? 'bg-amber-50 dark:bg-slate-800 border-l-4 border-l-amber-500 dark:border-l-amber-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}`}
               >
                  <div className="flex justify-between items-start mb-1.5">
                     <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate pr-2">{tx.id}</span>
                     <span className="font-black text-slate-800 dark:text-slate-100 whitespace-nowrap">{formatRp(Math.abs(tx.total))}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                     <span className="text-slate-500 dark:text-slate-400">{tx.date.split(', ')[1] || tx.date} • {tx.payment_method?.toUpperCase() || tx.method?.toUpperCase() || 'CASH'}</span>
                     
                     {/* Status Badges */}
                     {tx.status === 'voided' && <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded uppercase tracking-wider">VOID</span>}
                     {tx.type === 'refund' && <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded uppercase tracking-wider">REFUND</span>}
                     {tx.status === 'completed' && tx.type !== 'refund' && <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider">SUCCESS</span>}
                  </div>
               </button>
            ))}
         </div>
      </div>

      {/* KANAN: DETAIL STRUK (SPLIT-PANE) */}
      <div className="flex-1 bg-slate-100/50 dark:bg-slate-900/50 flex flex-col items-center p-6 md:p-10 overflow-y-auto custom-scrollbar relative transition-colors">
         {selectedTx ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 transition-colors">
               
               {/* Header Detail */}
               <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-start transition-colors">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Tagihan</p>
                     <h3 className="font-black text-4xl text-slate-800 dark:text-white tracking-tighter">{formatRp(Math.abs(selectedTx.total))}</h3>
                     <div className="flex items-center gap-2 mt-3">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${selectedTx.type === 'refund' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                           {selectedTx.status}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                           • {selectedTx.payment_method || selectedTx.method || 'CASH'}
                        </span>
                     </div>
                  </div>
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 shrink-0 transition-colors">
                     <Receipt className="w-6 h-6 text-amber-600 dark:text-amber-500"/>
                  </div>
               </div>
               
               {/* Metadata Grid */}
               <div className="px-8 py-6 space-y-6 flex-1">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                     <div><p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Receipt Number</p><p className="font-bold text-slate-800 dark:text-slate-200">{selectedTx.id}</p></div>
                     <div><p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Date & Time</p><p className="font-bold text-slate-800 dark:text-slate-200">{selectedTx.date}</p></div>
                     <div><p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Cashier Name</p><p className="font-bold text-slate-800 dark:text-slate-200">{selectedTx.cashier || 'Sistem'}</p></div>
                     <div><p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">POS Device</p><p className="font-bold text-slate-800 dark:text-slate-200">Main Terminal 1</p></div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">Purchased Items</p>
                     {selectedTx.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                           <div className="flex gap-3">
                              <span className="font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 w-6 h-6 flex items-center justify-center rounded-md text-xs transition-colors">{Math.abs(item.qty)}</span>
                              <div>
                                 <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                                 <p className="text-[10px] text-slate-500 dark:text-slate-400">@ {formatRp(item.price)}</p>
                              </div>
                           </div>
                           <span className="font-black text-slate-800 dark:text-slate-200">{formatRp(Math.abs(item.qty * item.price))}</span>
                        </div>
                     ))}
                  </div>

                  {/* Billing Pipeline Summary */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-sm transition-colors">
                     {selectedTx.subtotal !== undefined && <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium"><span>Subtotal</span><span>{formatRp(Math.abs(selectedTx.subtotal))}</span></div>}
                     {selectedTx.discount > 0 && <div className="flex justify-between text-red-500 dark:text-red-400 font-bold"><span>Discount</span><span>-{formatRp(Math.abs(selectedTx.discount))}</span></div>}
                     
                     <div className="flex justify-between font-black text-lg pt-3 border-t border-dashed border-slate-300 dark:border-slate-700">
                        <span className="text-slate-800 dark:text-slate-200">Grand Total</span>
                        <span className="text-amber-600 dark:text-amber-500">{formatRp(Math.abs(selectedTx.total))}</span>
                     </div>
                  </div>
               </div>

               {/* Actions */}
               <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 transition-colors">
                  <button onClick={() => onReprint(selectedTx)} className="py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm">
                     <Printer className="w-4 h-4"/> Print
                  </button>
                  <button onClick={handleSendEReceipt} className="py-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm">
                     <MessageSquare className="w-4 h-4"/> E-Receipt
                  </button>
                  
                  {selectedTx.status === 'completed' && selectedTx.type !== 'refund' ? (
                     <button onClick={handleVoid} className="py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm">
                        <XCircle className="w-4 h-4"/> Refund
                     </button>
                  ) : (
                     <button disabled className="py-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-black rounded-xl text-xs flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                        <XCircle className="w-4 h-4"/> Voided
                     </button>
                  )}
               </div>
            </div>
         ) : (
            <div className="text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center h-full opacity-60">
               <Receipt className="w-24 h-24 mb-6 text-slate-300 dark:text-slate-700" />
               <h3 className="text-xl font-black text-slate-600 dark:text-slate-400 mb-1">Tidak ada struk dipilih</h3>
               <p className="font-medium text-sm">Pilih transaksi dari daftar di sebelah kiri untuk melihat detail.</p>
            </div>
         )}
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  Search, Receipt, Printer, XCircle, 
  MessageSquare, Filter, AlertCircle, CheckCircle2,
  History as HistoryIcon
} from 'lucide-react';

export default function HistoryView({ 
  transactions = [], 
  currentUser, 
  onVoidTransaction, 
  onPrintReceipt,
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
        matchSearch = (tx.id || '').toString().toLowerCase().includes(query) || 
                      (tx.cashier || '').toLowerCase().includes(query);
      }
      
      let matchDate = true;
      if (filterDate) {
        // [KB] Normalisasi format tanggal dari DB (biasanya DD/MM/YYYY) ke YYYY-MM-DD
        const txDatePart = (tx.date || '').split(',')[0]; 
        const parts = txDatePart.split(/[\/\-.]/);
        if (parts.length >= 3) {
          const txDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          matchDate = txDateStr === filterDate;
        }
      }

      return matchSearch && matchDate;
    });
  }, [transactions, search, filterDate]);

  // --- RENDER HELPERS ---
  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  const handleVoid = () => {
    if (selectedTx.status === 'voided') {
      return showToast("Transaksi sudah divoid sebelumnya.", "error");
    }
    if (currentUser?.role !== 'admin') {
      return showToast("Otorisasi ditolak! Khusus Admin yang bisa melakukan Void.", "error");
    }
    if (window.confirm(`PERINGATAN AUDIT!\nBatalkan struk ${selectedTx.id} senilai ${formatRp(selectedTx.total)}?\nSistem akan mengembalikan stok barang secara otomatis.`)) {
      onVoidTransaction(selectedTx.id);
    }
  };

  const handleSendEReceipt = () => {
    const text = `*STRUK BELANJA - ${selectedTx.id}*\nTotal: ${formatRp(selectedTx.total)}\nMetode: ${selectedTx.payment_method?.toUpperCase()}\n\nTerima kasih telah berbelanja!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast("Membuka WhatsApp Web...", "success");
  };

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden animate-in fade-in duration-300">
      
      {/* KIRI: DAFTAR TRANSAKSI (SCROLLABLE LIST) */}
      <div className="w-1/3 max-w-sm bg-white border-r border-slate-200 flex flex-col h-full z-10 shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.02)]">
         <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0 space-y-4">
            <h2 className="font-black text-slate-800 text-xl flex items-center gap-2">
               <HistoryIcon className="w-5 h-5 text-blue-600"/> Riwayat
            </h2>
            <div className="flex gap-2">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="No. Struk / Kasir" value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" />
               </div>
               <div className="relative w-10 h-10 shrink-0">
                  <input type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`absolute inset-0 flex items-center justify-center rounded-xl border transition-colors ${filterDate ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
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
                  className={`w-full text-left p-4 border-b border-slate-100 transition-colors ${selectedTx?.id === tx.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
               >
                  <div className="flex justify-between items-start mb-1.5">
                     <span className="font-bold text-slate-800 text-sm truncate pr-2">TX-{tx.id}</span>
                     <span className="font-black text-slate-800 whitespace-nowrap">{formatRp(Math.abs(tx.total))}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                     <span className="text-slate-500">
                        {tx.date?.includes(',') ? tx.date.split(', ')[1] : tx.date} • {tx.payment_method?.toUpperCase() || 'CASH'}
                     </span>
                     
                     {/* Status Badges */}
                     {tx.status === 'voided' ? (
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded uppercase tracking-wider">VOID</span>
                     ) : (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-wider">SUCCESS</span>
                     )}
                  </div>
               </button>
            ))}
            {filteredTransactions.length === 0 && (
               <div className="p-12 text-center text-slate-400">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="text-xs font-black uppercase tracking-widest">No Records Found</p>
               </div>
            )}
         </div>
      </div>

      {/* KANAN: DETAIL STRUK (MOKA STYLE SPLIT-PANE) */}
      <div className="flex-1 bg-slate-100/50 flex flex-col items-center p-6 md:p-10 overflow-y-auto custom-scrollbar relative">
         {selectedTx ? (
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
               {/* Header Detail */}
               <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Transaction</p>
                     <h3 className="font-black text-4xl text-slate-800 tracking-tighter">{formatRp(Math.abs(selectedTx.total))}</h3>
                     <div className="flex items-center gap-2 mt-3">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${selectedTx.status === 'voided' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {selectedTx.status?.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                           • {selectedTx.payment_method || 'CASH'}
                        </span>
                     </div>
                  </div>
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                     <Receipt className="w-6 h-6 text-blue-600"/>
                  </div>
               </div>
               
               {/* Metadata Grid */}
               <div className="px-8 py-6 space-y-6 flex-1">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <div><p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Receipt Number</p><p className="font-bold text-slate-800">TX-{selectedTx.id}</p></div>
                     <div><p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Date & Time</p><p className="font-bold text-slate-800">{selectedTx.date}</p></div>
                     <div><p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Cashier Name</p><p className="font-bold text-slate-800">{selectedTx.cashier || 'System'}</p></div>
                     <div><p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">POS Terminal</p><p className="font-bold text-slate-800">Terminal-01</p></div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Purchased Items</p>
                     {selectedTx.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm group">
                           <div className="flex gap-3">
                              <span className="font-black text-slate-700 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-md text-[10px]">{Math.abs(item.qty)}</span>
                              <div>
                                 <p className="font-bold text-slate-800">{item.name}</p>
                                 <p className="text-[10px] text-slate-500">@ {formatRp(item.price_at_transaction || item.price)}</p>
                              </div>
                           </div>
                           <span className="font-black text-slate-800">{formatRp(Math.abs(item.qty * (item.price_at_transaction || item.price)))}</span>
                        </div>
                     ))}
                  </div>

                  {/* Billing Pipeline Summary */}
                  <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
                     {selectedTx.subtotal !== undefined && <div className="flex justify-between text-slate-500 font-medium"><span>Subtotal</span><span>{formatRp(Math.abs(selectedTx.subtotal))}</span></div>}
                     {selectedTx.discount > 0 && <div className="flex justify-between text-red-500 font-bold"><span>Discount</span><span>-{formatRp(Math.abs(selectedTx.discount))}</span></div>}
                     {selectedTx.tax > 0 && <div className="flex justify-between text-slate-500 font-medium"><span>Pajak PB1 (10%)</span><span>{formatRp(Math.abs(selectedTx.tax))}</span></div>}
                     {selectedTx.service > 0 && <div className="flex justify-between text-slate-500 font-medium"><span>Biaya Layanan (5%)</span><span>{formatRp(Math.abs(selectedTx.service))}</span></div>}
                     
                     <div className="flex justify-between font-black text-xl pt-3 border-t border-dashed border-slate-300 mt-2">
                        <span>Grand Total</span>
                        <span className="text-blue-600">{formatRp(Math.abs(selectedTx.total))}</span>
                     </div>
                  </div>
               </div>

               {/* Post Actions (Moka Style) */}
               <div className="p-5 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-3">
                  <button onClick={() => onPrintReceipt(selectedTx)} className="py-3.5 bg-white border border-slate-200 text-slate-700 font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm">
                     <Printer className="w-4 h-4"/> Cetak
                  </button>
                  <button onClick={handleSendEReceipt} className="py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all shadow-sm">
                     <MessageSquare className="w-4 h-4"/> WhatsApp
                  </button>
                  
                  {selectedTx.status !== 'voided' ? (
                     <button onClick={handleVoid} className="py-3.5 bg-red-50 border border-red-200 text-red-600 font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-all shadow-sm">
                        <XCircle className="w-4 h-4"/> Void/Batal
                     </button>
                  ) : (
                     <button disabled className="py-3.5 bg-slate-100 border border-slate-200 text-slate-400 font-black rounded-xl text-xs flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                        <XCircle className="w-4 h-4"/> Terhapus
                     </button>
                  )}
               </div>
            </div>
         ) : (
            <div className="text-slate-400 flex flex-col items-center justify-center h-full opacity-60">
               <Receipt className="w-24 h-24 mb-6 text-slate-300" />
               <h3 className="text-xl font-black text-slate-600 mb-1 tracking-tight">Audit Struk</h3>
               <p className="font-medium text-sm text-center">Pilih transaksi dari daftar di sebelah kiri<br/>untuk melihat rincian audit.</p>
            </div>
         )}
      </div>
    </div>
  );
}

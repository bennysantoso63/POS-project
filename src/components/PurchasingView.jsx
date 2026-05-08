import React, { useState, useMemo } from 'react';
import { 
  Truck, PackagePlus, Banknote, Search, 
  ArrowDownRight, ChevronRight, XCircle,
  Plus, AlertCircle, ShoppingCart, Trash2
} from 'lucide-react';

const Modal = ({ title, children, onClose, maxWidth = 'max-w-2xl' }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className={`bg-white dark:bg-[#1A2640] rounded-[2rem] w-full ${maxWidth} shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] transition-colors`}>
      <div className="px-6 py-5 border-b border-slate-100 dark:border-[#35577D]/30 flex justify-between items-center bg-slate-50 dark:bg-[#141E30] shrink-0 transition-colors">
        <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight">{title}</h3>
        {onClose && <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-[#243350] rounded-full transition-colors"><XCircle className="w-5 h-5"/></button>}
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  </div>
);

export default function PurchasingView({ 
  suppliers = [], 
  purchaseOrders = [], 
  products = [],
  onAddSupplier,
  onCreatePO,
  onReceivePO,
  onPayPO,
  showToast 
}) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('po_list'); 
  const [payModal, setPayModal] = useState(null); 
  const [payAmount, setPayAmount] = useState('');

  const [poSupplier, setPoSupplier] = useState('');
  const [poItems, setPoItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [poQty, setPoQty] = useState('');
  const [poCost, setPoCost] = useState('');

  // --- LOGIC: KALKULASI AP ---
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => 
      (po.id || '').toString().toLowerCase().includes(search.toLowerCase()) || 
      (po.supplier_name || '').toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
  }, [purchaseOrders, search]);

  const totalHutangUsaha = purchaseOrders.reduce((sum, po) => {
    if (po.status !== 'void' && po.status !== 'paid') {
      return sum + Math.max(0, (po.total_amount || 0) - (po.paid_amount || 0));
    }
    return sum;
  }, 0);

  const handleAddItemToPO = () => {
    if (!selectedProduct || !poQty || !poCost) return showToast("Lengkapi data barang!", "error");
    const prod = products.find(p => p.id === parseInt(selectedProduct));
    if (!prod) return;

    setPoItems(prev => [...prev, {
      product_id: prod.id,
      product_name: prod.name,
      qty: parseInt(poQty),
      unit_price: parseInt(poCost)
    }]);

    setSelectedProduct(''); setPoQty(''); setPoCost('');
  };

  const handleRemovePOItem = (idx) => {
    setPoItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitPO = (e) => {
    e.preventDefault();
    if (!poSupplier) return showToast("Pilih Supplier!", "error");
    if (poItems.length === 0) return showToast("Tambahkan minimal 1 barang!", "error");

    const supplierObj = suppliers.find(s => s.id === parseInt(poSupplier));
    const poData = {
      supplier_id: supplierObj.id,
      supplier_name: supplierObj.name,
      order_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(), 
      notes: "PO Otomatis",
      status: 'ordered',
      total_amount: poItems.reduce((s,i)=>s+(i.qty*i.unit_price),0),
      items: poItems
    };

    onCreatePO(poData);
    showToast("Purchase Order berhasil dibuat!", "success");
    setPoItems([]); setPoSupplier(''); setActiveTab('po_list');
  };

  const handleReceiveGoods = (poId) => {
    if (window.confirm("Konfirmasi barang telah diterima?\nStok dan HPP (Harga Modal) barang akan di-update otomatis oleh sistem.")) {
      onReceivePO(poId);
    }
  };

  const submitPayment = (e) => {
    e.preventDefault();
    const amount = parseInt(payAmount);
    const sisaHutang = (payModal.total_amount || 0) - (payModal.paid_amount || 0);

    if (!amount || amount <= 0) return showToast("Nominal tidak valid", "error");
    if (amount > sisaHutang) return showToast("Nominal melebihi sisa hutang!", "error");

    onPayPO(payModal.id, {
      amount: amount,
      payment_method: 'cash',
      notes: 'Pelunasan Hutang PO'
    });

    showToast(`Pembayaran Rp ${formatRp(amount)} berhasil dicatat!`, "success");
    setPayModal(null); setPayAmount('');
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#141E30] overflow-hidden animate-in fade-in duration-300 transition-colors">
      
      {/* HEADER */}
      <header className="px-6 md:px-10 py-6 bg-[#F0FAFA] dark:bg-[#1A2640] border-b border-slate-200 dark:border-[#35577D]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 shrink-0 transition-colors shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
             <Truck className="w-8 h-8 text-[#FFC05F] dark:text-[#D4A040]"/> Kulakan & Supplier
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#64748b] font-bold mt-1">Manajemen Purchase Order (PO) dan Hutang Usaha (AP).</p>
        </div>
        
        {/* Working Capital AP Widget */}
        <div className="bg-[#FF826C]/10 dark:bg-[#E07060]/10 border border-[#FF826C]/20 dark:border-[#E07060]/20 p-4 rounded-2xl flex items-center gap-4 shadow-sm w-full md:w-auto transition-colors">
           <div className="w-12 h-12 bg-white dark:bg-[#243350] rounded-xl flex items-center justify-center border border-[#FF826C]/20 dark:border-[#E07060]/20 text-[#FF826C] dark:text-[#E07060] shrink-0 transition-colors">
              <ArrowDownRight className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-[#FF826C] dark:text-[#E07060] tracking-widest mb-0.5">Total Hutang Usaha (AP)</p>
              <p className="text-2xl font-black text-slate-800 dark:text-[#E07060] tracking-tighter">{formatRp(totalHutangUsaha)}</p>
           </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="flex-1 p-6 md:p-10 overflow-hidden flex flex-col custom-scrollbar">
        
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 shrink-0 border-b border-slate-200 dark:border-[#35577D]/30 pb-4 transition-colors">
           <button onClick={() => setActiveTab('po_list')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'po_list' ? 'bg-[#3196E2] dark:bg-[#35577D] text-white shadow-lg' : 'bg-white dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 text-slate-500 dark:text-[#64748b] hover:bg-slate-50 dark:hover:bg-[#1A2640]'}`}>
              Daftar Tagihan (PO)
           </button>
           <button onClick={() => setActiveTab('new_po')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'new_po' ? 'bg-[#FFC05F] dark:bg-[#D4A040] text-white shadow-lg' : 'bg-white dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 text-slate-500 dark:text-[#64748b] hover:bg-slate-50 dark:hover:bg-[#1A2640]'}`}>
              <Plus className="w-4 h-4"/> Buat PO Baru
           </button>
        </div>

        {/* TAB 1: DAFTAR PO */}
        {activeTab === 'po_list' && (
          <div className="bg-white dark:bg-[#1A2640] rounded-[2rem] border border-slate-200 dark:border-[#35577D]/30 shadow-sm flex flex-col flex-1 overflow-hidden animate-in fade-in transition-colors">
             <div className="p-6 border-b border-slate-100 dark:border-[#35577D]/30 bg-[#F0FAFA] dark:bg-[#141E30] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 transition-colors">
                <div className="relative w-full sm:w-80">
                   <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Cari No. PO atau Nama Supplier..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full bg-white dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#3196E2] shadow-sm transition-colors" />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                   <thead className="bg-[#F0FAFA] dark:bg-[#141E30] border-b border-slate-200 dark:border-[#35577D]/30 text-slate-500 dark:text-[#64748b] uppercase text-[10px] font-black tracking-widest sticky top-0 z-10 transition-colors">
                      <tr>
                         <th className="px-6 py-4">No. PO & Tanggal</th>
                         <th className="px-6 py-4">Supplier</th>
                         <th className="px-6 py-4 text-right">Total & Sisa Hutang</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-[#35577D]/30 transition-colors">
                      {filteredPOs.map(po => {
                         const sisaHutang = (po.total_amount || 0) - (po.paid_amount || 0);
                         return (
                         <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-[#243350]/50 transition-colors group">
                            <td className="px-6 py-4">
                               <p className="font-bold text-slate-800 dark:text-slate-200">{po.id}</p>
                               <p className="text-[10px] text-slate-500 dark:text-[#64748b] font-medium">{new Date(po.order_date).toLocaleDateString('id-ID')}</p>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{po.supplier_name}</td>
                            <td className="px-6 py-4 text-right">
                               <p className="font-black text-slate-800 dark:text-slate-200">{formatRp(po.total_amount)}</p>
                               {sisaHutang > 0 && <p className="text-[10px] font-bold text-[#FF826C] dark:text-[#E07060] mt-1">Sisa: {formatRp(sisaHutang)}</p>}
                            </td>
                            <td className="px-6 py-4 text-center">
                               {po.status === 'ordered' && <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black text-[9px] uppercase tracking-widest rounded-lg">Menunggu Barang</span>}
                               {po.status === 'received' && <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-black text-[9px] uppercase tracking-widest rounded-lg">Barang Diterima</span>}
                               {po.status === 'partial' && <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-black text-[9px] uppercase tracking-widest rounded-lg">Dibayar Sebagian</span>}
                               {po.status === 'paid' && <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black text-[9px] uppercase tracking-widest rounded-lg">Lunas</span>}
                               {po.status === 'void' && <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[9px] uppercase tracking-widest rounded-lg">Batal</span>}
                            </td>
                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                               {po.status === 'ordered' && (
                                 <button onClick={() => handleReceiveGoods(po.id)} className="px-3 py-1.5 bg-blue-50 dark:bg-[#35577D]/20 text-blue-700 dark:text-[#38B2AC] hover:bg-blue-100 dark:hover:bg-[#35577D]/40 font-black rounded-lg text-[10px] uppercase tracking-wider transition-colors border border-blue-200 dark:border-[#35577D]/50">
                                    Terima Barang
                                 </button>
                               )}
                               {(po.status === 'received' || po.status === 'partial') && (
                                 <button onClick={() => { setPayModal(po); setPayAmount(sisaHutang); }} className="px-3 py-1.5 bg-white dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 text-slate-700 dark:text-slate-300 hover:border-[#38B2AC] hover:text-[#38B2AC] font-black rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-1">
                                    Bayar Hutang <ChevronRight className="w-3 h-3"/>
                                 </button>
                               )}
                            </td>
                         </tr>
                      )})}
                      {filteredPOs.length === 0 && (
                         <tr>
                            <td colSpan="5" className="px-6 py-16 text-center text-slate-400 dark:text-[#64748b]">
                               <PackagePlus className="w-12 h-12 mx-auto mb-4 opacity-20" />
                               <p className="font-bold text-sm">Belum ada riwayat Purchase Order.</p>
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* TAB 2: BUAT PO BARU */}
        {activeTab === 'new_po' && (
           <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden animate-in fade-in">
              
              {/* Form Input */}
              <div className="w-full md:w-1/3 bg-white dark:bg-[#1A2640] p-6 rounded-[2rem] border border-slate-200 dark:border-[#35577D]/30 shadow-sm flex flex-col overflow-y-auto custom-scrollbar transition-colors">
                 <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-6 flex items-center gap-2">
                    <PackagePlus className="w-5 h-5 text-[#FFC05F]"/> Draft Kulakan (PO)
                 </h3>
                 <div className="space-y-5">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-widest mb-2">Pilih Supplier *</label>
                       <select value={poSupplier} onChange={e=>setPoSupplier(e.target.value)} className="w-full bg-[#F0FAFA] dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#FFC05F] transition-colors cursor-pointer">
                          <option value="">-- Pilih Supplier --</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>

                    <div className="border-t border-slate-100 dark:border-[#35577D]/30 pt-5 mt-2 transition-colors">
                       <label className="block text-[10px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-widest mb-2">Pilih Barang *</label>
                       <select value={selectedProduct} onChange={e=>setSelectedProduct(e.target.value)} className="w-full bg-[#F0FAFA] dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#FFC05F] transition-colors cursor-pointer">
                          <option value="">-- Pilih Barang dari Master --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-widest mb-2">Qty Pesan *</label>
                          <input type="number" min="1" value={poQty} onChange={e=>setPoQty(e.target.value)} placeholder="0" className="w-full bg-[#F0FAFA] dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#FFC05F] transition-colors" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-widest mb-2">Harga Beli (HPP) *</label>
                          <input type="number" min="0" value={poCost} onChange={e=>setPoCost(e.target.value)} placeholder="Rp" className="w-full bg-[#F0FAFA] dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#FFC05F] transition-colors" />
                       </div>
                    </div>

                    <button type="button" onClick={handleAddItemToPO} className="w-full py-3 mt-2 bg-[#F0FAFA] dark:bg-[#35577D] text-[#FFC05F] dark:text-[#D4A040] font-black rounded-xl border border-[#FFC05F]/20 dark:border-[#35577D]/50 hover:bg-[#FFC05F]/10 dark:hover:bg-[#35577D]/70 active:scale-95 transition-all text-xs tracking-widest uppercase flex justify-center items-center gap-2">
                       <Plus className="w-4 h-4"/> Tambah ke List
                    </button>
                 </div>
              </div>

              {/* Review Cart PO */}
              <div className="flex-1 bg-white dark:bg-[#1A2640] p-6 rounded-[2rem] border border-slate-200 dark:border-[#35577D]/30 shadow-sm flex flex-col transition-colors">
                 <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-4">Review Purchase Order</h3>
                 
                 <div className="flex-1 overflow-y-auto bg-[#F0FAFA] dark:bg-[#141E30] rounded-2xl border border-slate-100 dark:border-[#35577D]/30 p-2 custom-scrollbar transition-colors">
                    {poItems.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#64748b] opacity-60">
                          <ShoppingCart className="w-12 h-12 mb-3" />
                          <p className="text-xs font-bold uppercase tracking-widest">List Kulakan Kosong</p>
                       </div>
                    ) : (
                       poItems.map((item, idx) => (
                          <div key={idx} className="bg-white dark:bg-[#243350] p-4 rounded-xl border border-slate-100 dark:border-[#35577D]/30 mb-2 flex justify-between items-center shadow-sm transition-colors">
                             <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.product_name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-[#64748b] mt-0.5">{item.qty} pcs @ {formatRp(item.unit_price)}</p>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="font-black text-slate-800 dark:text-slate-200">{formatRp(item.qty * item.unit_price)}</span>
                                <button onClick={() => handleRemovePOItem(idx)} className="p-1.5 text-[#FF826C] hover:bg-red-50 dark:hover:bg-[#E07060]/20 hover:text-[#E07060] rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>

                 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#35577D]/30 flex justify-between items-end transition-colors">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-widest mb-1">Total Tagihan PO</p>
                       <p className="text-3xl font-black text-[#FFC05F] dark:text-[#D4A040]">{formatRp(poItems.reduce((sum, item) => sum + (item.qty * item.unit_price), 0))}</p>
                    </div>
                    <button onClick={handleSubmitPO} disabled={poItems.length === 0} className="px-8 py-4 bg-[#FFC05F] dark:bg-[#D4A040] text-white font-black rounded-xl shadow-xl shadow-[#FFC05F]/30 active:scale-95 transition-all text-xs tracking-widest uppercase disabled:opacity-50 hover:bg-[#D4A040]">
                       SIMPAN & CETAK PO
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* PAYMENT MODAL (PELUNASAN PO) */}
      {payModal && (
         <Modal title="Pelunasan Tagihan Supplier" onClose={() => setPayModal(null)}>
            <form onSubmit={submitPayment} className="space-y-6">
               <div className="bg-[#F0FAFA] dark:bg-[#141E30] p-5 rounded-2xl border border-slate-200 dark:border-[#35577D]/30 flex justify-between items-center transition-colors">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#64748b] mb-1">Supplier</p>
                     <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">{payModal.supplier_name}</p>
                     <p className="text-[10px] text-slate-500 dark:text-[#64748b] mt-1">PO Ref: {payModal.id}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#FF826C] dark:text-[#E07060] mb-1">Sisa Tagihan (AP)</p>
                     <p className="font-black text-[#FF826C] dark:text-[#E07060] text-xl">{formatRp((payModal.total_amount || 0) - (payModal.paid_amount || 0))}</p>
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-widest mb-3">Nominal Dibayar (Kas Keluar) *</label>
                  <div className="relative">
                     <span className="absolute left-4 top-4 font-black text-slate-400">Rp</span>
                     <input type="number" required autoFocus min="1" max={(payModal.total_amount || 0) - (payModal.paid_amount || 0)} value={payAmount} onChange={e=>setPayAmount(e.target.value)} className="w-full bg-white dark:bg-[#243350] border border-slate-300 dark:border-[#35577D]/30 rounded-2xl pl-12 pr-6 py-4 text-2xl font-black text-slate-800 dark:text-slate-200 outline-none focus:border-[#FF826C] transition-colors shadow-sm" />
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                     <button type="button" onClick={() => setPayAmount((payModal.total_amount || 0) - (payModal.paid_amount || 0))} className="px-3 py-1.5 bg-[#FF826C]/10 dark:bg-[#E07060]/10 text-[#FF826C] dark:text-[#E07060] border border-[#FF826C]/20 dark:border-[#E07060]/20 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#FF826C]/20 transition-colors">
                        Lunasi Semua
                     </button>
                  </div>
               </div>

               <div className="bg-[#FFC05F]/10 dark:bg-[#D4A040]/10 p-4 rounded-xl border border-[#FFC05F]/20 dark:border-[#D4A040]/30 flex items-start gap-3 transition-colors">
                  <AlertCircle className="w-5 h-5 text-[#FFC05F] dark:text-[#D4A040] shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                     Pembayaran ini akan dicatat sebagai <strong className="font-black text-[#FF826C] dark:text-[#E07060]">Kas Keluar</strong> pada hari ini dan akan mengurangi saldo Kas Anda secara sistem.
                  </p>
               </div>

               <button type="submit" className="w-full py-5 text-white font-black rounded-2xl shadow-xl shadow-[#FF826C]/30 active:scale-95 transition-all text-sm tracking-widest uppercase bg-[#FF826C] hover:bg-[#E07060]">
                  KONFIRMASI BAYAR
               </button>
            </form>
         </Modal>
      )}
    </div>
  );
}

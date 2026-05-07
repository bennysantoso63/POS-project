import React, { useState, useMemo } from 'react';
import { 
  Truck, PackagePlus, Banknote, Search, 
  ArrowDownRight, CheckCircle2, ChevronRight, XCircle,
  Plus, Box, AlertCircle, ShoppingCart, Trash2
} from 'lucide-react';

const Modal = ({ title, children, onClose, maxWidth = 'max-w-2xl' }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className={`bg-white rounded-[2rem] w-full ${maxWidth} shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]`}>
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
        <h3 className="font-black text-slate-800 text-lg tracking-tight">{title}</h3>
        {onClose && <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><XCircle className="w-5 h-5"/></button>}
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
  const [activeTab, setActiveTab] = useState('po_list'); // 'po_list' or 'new_po'
  const [payModal, setPayModal] = useState(null); // Obj PO
  const [payAmount, setPayAmount] = useState('');

  // States for New PO
  const [poSupplier, setPoSupplier] = useState('');
  const [poItems, setPoItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [poQty, setPoQty] = useState('');
  const [poCost, setPoCost] = useState('');

  // --- LOGIC: KALKULASI AP (Accounts Payable) ---
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

  // --- HANDLERS: NEW PO ---
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
      items: poItems
    };

    onCreatePO(poData);
    setPoItems([]); setPoSupplier(''); setActiveTab('po_list');
  };

  // --- HANDLERS: ACTIONS ---
  const handleReceiveGoods = (poId) => {
    if (window.confirm("Konfirmasi barang telah diterima?\nStok dan HPP (Harga Modal) barang akan di-update otomatis oleh sistem.")) {
      onReceivePO(poId);
    }
  };

  const submitPayment = (e) => {
    e.preventDefault();
    const amount = parseInt(payAmount);
    const sisaHutang = payModal.total_amount - (payModal.paid_amount || 0);

    if (!amount || amount <= 0) return showToast("Nominal tidak valid", "error");
    if (amount > sisaHutang) return showToast("Nominal melebihi sisa hutang!", "error");

    onPayPO(payModal.id, {
      amount: amount,
      payment_method: 'cash',
      notes: 'Pelunasan Hutang PO'
    });

    setPayModal(null); setPayAmount('');
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden animate-in fade-in duration-300">
      
      {/* HEADER */}
      <header className="px-6 md:px-10 py-6 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 shrink-0 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <Truck className="w-8 h-8 text-blue-600"/> Kulakan & Supplier
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">Manajemen Purchase Order (PO) dan Hutang Usaha (Accounts Payable).</p>
        </div>
        
        {/* Working Capital AP Widget */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm w-full md:w-auto transition-all hover:shadow-md">
           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-red-100 text-red-500 shrink-0">
              <ArrowDownRight className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-0.5">Total Tagihan Belum Lunas</p>
              <p className="text-2xl font-black text-red-800 tracking-tighter">{formatRp(totalHutangUsaha)}</p>
           </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="flex-1 p-6 md:p-10 overflow-hidden flex flex-col content-start">
        
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 shrink-0 border-b border-slate-200 pb-4">
           <button onClick={() => setActiveTab('po_list')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'po_list' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              Daftar Tagihan (PO)
           </button>
           <button onClick={() => setActiveTab('new_po')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'new_po' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <Plus className="w-4 h-4"/> Buat PO Baru
           </button>
        </div>

        {/* TAB 1: DAFTAR PO */}
        {activeTab === 'po_list' && (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
             <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div className="relative w-full sm:w-80">
                   <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Cari No. PO atau Supplier..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:border-blue-500 shadow-sm" />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                      <tr>
                         <th className="px-6 py-4">Informasi PO</th>
                         <th className="px-6 py-4">Supplier</th>
                         <th className="px-6 py-4 text-right">Total Tagihan</th>
                         <th className="px-6 py-4 text-center">Status Barang</th>
                         <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredPOs.map(po => {
                         const sisaHutang = (po.total_amount || 0) - (po.paid_amount || 0);
                         return (
                         <tr key={po.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                               <p className="font-black text-slate-800">PO-{po.id}</p>
                               <p className="text-[10px] text-slate-500 font-bold uppercase">{new Date(po.order_date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</p>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">{po.supplier_name}</td>
                            <td className="px-6 py-4 text-right">
                               <p className="font-black text-slate-800">{formatRp(po.total_amount)}</p>
                               {sisaHutang > 0 && <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-tighter">Sisa: {formatRp(sisaHutang)}</p>}
                            </td>
                            <td className="px-6 py-4 text-center">
                               {po.status === 'ordered' && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 font-black text-[9px] uppercase tracking-widest rounded-lg">Diproses</span>}
                               {po.status === 'received' && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 font-black text-[9px] uppercase tracking-widest rounded-lg">Masuk Stok</span>}
                               {po.status === 'partial' && <span className="px-2.5 py-1 bg-orange-100 text-orange-700 font-black text-[9px] uppercase tracking-widest rounded-lg">Belum Lunas</span>}
                               {po.status === 'paid' && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-black text-[9px] uppercase tracking-widest rounded-lg">Lunas</span>}
                               {po.status === 'void' && <span className="px-2.5 py-1 bg-slate-200 text-slate-600 font-black text-[9px] uppercase tracking-widest rounded-lg">Batal</span>}
                            </td>
                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                               {po.status === 'ordered' && (
                                 <button onClick={() => handleReceiveGoods(po.id)} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md shadow-blue-500/20">
                                    Terima Barang
                                 </button>
                               )}
                               {(po.status === 'received' || po.status === 'partial') && sisaHutang > 0 && (
                                 <button onClick={() => { setPayModal(po); setPayAmount(sisaHutang); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1">
                                    Bayar <ChevronRight className="w-3 h-3"/>
                                 </button>
                               )}
                               {po.status === 'paid' && <span className="text-emerald-500"><CheckCircle2 className="w-5 h-5 mx-auto"/></span>}
                            </td>
                         </tr>
                      )})}
                      {filteredPOs.length === 0 && (
                         <tr>
                            <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                               <PackagePlus className="w-16 h-16 mx-auto mb-4 opacity-10" />
                               <p className="font-black text-xs uppercase tracking-widest">No PO Records</p>
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
           <div className="flex-1 flex gap-6 overflow-hidden animate-in fade-in slide-in-from-right-4">
              {/* Form Input */}
              <div className="w-[380px] bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-y-auto shrink-0">
                 <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                    <PackagePlus className="w-5 h-5 text-blue-500"/> Item Kulakan
                 </h3>
                 <div className="space-y-5">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Supplier *</label>
                       <select value={poSupplier} onChange={e=>setPoSupplier(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 transition-colors cursor-pointer">
                          <option value="">-- Pilih Supplier --</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>

                    <div className="border-t border-slate-100 pt-5">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Produk *</label>
                       <select value={selectedProduct} onChange={e=>setSelectedProduct(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 transition-colors cursor-pointer">
                          <option value="">-- Cari di Master Barang --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock_pcs})</option>)}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jumlah *</label>
                          <input type="number" min="1" value={poQty} onChange={e=>setPoQty(e.target.value)} placeholder="0" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 transition-colors" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">HPP (Modal) *</label>
                          <input type="number" min="0" value={poCost} onChange={e=>setPoCost(e.target.value)} placeholder="Rp" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 transition-colors" />
                       </div>
                    </div>

                    <button type="button" onClick={handleAddItemToPO} className="w-full py-4 mt-2 bg-slate-900 text-white font-black rounded-xl hover:bg-black active:scale-95 transition-all text-[10px] tracking-widest uppercase flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20">
                       <Plus className="w-4 h-4"/> Tambah ke Draft
                    </button>
                 </div>
              </div>

              {/* Review Cart PO */}
              <div className="flex-1 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                 <h3 className="font-black text-slate-800 text-lg mb-6">Pratinjau Order Pesanan</h3>
                 
                 <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-[1.5rem] border border-slate-100 p-4 custom-scrollbar">
                    {poItems.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-20">
                          <ShoppingCart className="w-20 h-20 mb-4" />
                          <p className="text-sm font-black uppercase tracking-widest">Belum ada barang dipilih</p>
                       </div>
                    ) : (
                       poItems.map((item, idx) => (
                          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 mb-3 flex justify-between items-center shadow-sm hover:border-blue-200 transition-colors group">
                             <div>
                                <p className="font-black text-slate-800 text-sm">{item.product_name}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">{item.qty} Unit x {formatRp(item.unit_price)}</p>
                             </div>
                             <div className="flex items-center gap-6">
                                <span className="font-black text-slate-800 text-lg">{formatRp(item.qty * item.unit_price)}</span>
                                <button onClick={() => handleRemovePOItem(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5"/></button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>

                 <div className="mt-8 pt-8 border-t border-slate-200 flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Estimasi Tagihan</p>
                       <p className="text-4xl font-black text-blue-600 tracking-tighter">{formatRp(poItems.reduce((sum, item) => sum + (item.qty * item.unit_price), 0))}</p>
                    </div>
                    <button onClick={handleSubmitPO} disabled={poItems.length === 0} className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/40 active:scale-95 transition-all text-sm tracking-widest uppercase disabled:opacity-50">
                       PROSES & CETAK PO
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* PAYMENT MODAL (PELUNASAN PO) */}
      {payModal && (
         <Modal title="Pelunasan Tagihan Supplier" onClose={() => setPayModal(null)} maxWidth="max-w-xl">
            <form onSubmit={submitPayment} className="space-y-6">
               <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex justify-between items-center">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nama Supplier</p>
                     <p className="font-black text-slate-800 text-lg leading-tight">{payModal.supplier_name}</p>
                     <p className="text-[10px] font-bold text-blue-500 mt-2 uppercase">Ref: PO-{payModal.id}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Sisa Hutang</p>
                     <p className="font-black text-red-600 text-2xl tracking-tighter">{formatRp(payModal.total_amount - (payModal.paid_amount || 0))}</p>
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nominal Bayar (Kas Keluar) *</label>
                  <div className="relative">
                     <span className="absolute left-14 top-5 font-black text-slate-400 text-lg">Rp</span>
                     <input type="number" required autoFocus min="1" max={payModal.total_amount - (payModal.paid_amount || 0)} value={payAmount} onChange={e=>setPayAmount(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-3xl pl-24 pr-8 py-5 text-3xl font-black outline-none focus:border-red-500 transition-all shadow-inner" />
                  </div>
                  
                  {/* Quick Auto-Fill */}
                  <div className="flex gap-2 mt-4">
                     <button type="button" onClick={() => setPayAmount(payModal.total_amount - (payModal.paid_amount || 0))} className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                        LUNASI SEMUA
                     </button>
                  </div>
               </div>

               <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-amber-900 leading-relaxed uppercase tracking-wide">
                     Pembayaran ini akan memotong <span className="text-red-600 font-black">Saldo Kas Tunai</span> Anda hari ini dan memperbarui status Hutang Usaha di Neraca.
                  </p>
               </div>

               <button type="submit" className="w-full py-6 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-500/40 active:scale-95 transition-all text-sm tracking-widest uppercase hover:bg-red-700">
                  KONFIRMASI PELUNASAN TAGIHAN
               </button>
            </form>
         </Modal>
      )}
    </div>
  );
}

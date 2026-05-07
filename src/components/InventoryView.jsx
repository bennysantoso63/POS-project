import React, { useState, useMemo, useCallback } from 'react';
import { 
  Package, Search, Plus, Trash2, Edit, Tag, 
  ArrowUpRight, ArrowDownRight, AlertCircle, Barcode,
  Filter, MoreVertical, Download, Upload, ClipboardCheck, 
  Zap, Info, TrendingUp, TrendingDown, RefreshCcw, Printer, XCircle, Scan,
  CheckCircle2, ShieldCheck, Target, Calculator, Box
} from 'lucide-react';

const Modal = ({ title, children, onClose, maxWidth = 'max-w-xl' }) => (
  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[500] flex items-center justify-center p-6 animate-in fade-in duration-300">
    <div className={`bg-white rounded-[3rem] w-full ${maxWidth} shadow-2xl flex flex-col animate-in zoom-in-95 border-[10px] border-slate-100`}>
      <div className="px-10 py-8 border-b-2 border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-[2.2rem]">
        <h3 className="font-black text-slate-900 text-2xl tracking-tight uppercase">{title}</h3>
        {onClose && <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl"><XCircle className="w-9 h-9"/></button>}
      </div>
      <div className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  </div>
);

export default function InventoryView({ 
  products, 
  transactions, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onStartOpname,
  formatIDR 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form State
  const [form, setForm] = useState({ name: '', sku: '', category: 'Umum', price: 0, price_wholesale: 0, cost_price: 0, stock_pcs: 0, unit: 'Pcs' });

  // Barcode Printer State
  const [printQty, setPrintQty] = useState(1);
  const [barcodeLabelSize, setBarcodeLabelSize] = useState('40x30');

  // Velocity Calculation (Sprint 11: Real-time DSI)
  const velocityData = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    
    return products.map(p => {
      let sales30d = 0;
      transactions.forEach(tx => {
        const txDateStr = tx.created_at || tx.date;
        if (txDateStr >= thirtyDaysAgoStr && tx.status !== 'void') {
           const item = tx.items?.find(i => (i.product_id || i.id) === p.id);
           if (item) sales30d += item.qty;
        }
      });
      
      const dailyVelocity = sales30d / 30;
      const dsi = dailyVelocity > 0 ? p.stock_pcs / dailyVelocity : 999;
      
      let status = 'normal';
      if (dsi < 15) status = 'fast';
      if (dsi > 90) status = 'slow';

      return { ...p, sales30d, dailyVelocity, dsi, status };
    });
  }, [products, transactions]);

  const filteredProducts = velocityData.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const handleOpenOpname = () => {
    // Sprint 11: Randomized Cycle Count (Select exactly 5 random products for audit)
    if (products.length < 5) {
      if (products.length > 0) {
        onStartOpname(products);
        return;
      }
      return alert("Belum ada produk untuk diaudit.");
    }
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    onStartOpname(selected);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (selectedProduct) {
      onUpdateProduct(selectedProduct.id, form);
    } else {
      onAddProduct(form);
    }
    setShowAddModal(false);
    setSelectedProduct(null);
    setForm({ name: '', sku: '', category: 'Umum', price: 0, price_wholesale: 0, cost_price: 0, stock_pcs: 0, unit: 'Pcs' });
  };

  const invStats = useMemo(() => {
    const totalItems = products.length;
    const lowStock = products.filter(p => p.stock_pcs <= 10).length;
    const totalValuation = products.reduce((a, b) => a + (b.stock_pcs * (b.cost_price || 0)), 0);
    return { totalItems, lowStock, totalValuation };
  }, [products]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50 overflow-hidden animate-in fade-in duration-500">
      <header className="px-10 py-10 bg-white border-b-2 border-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 z-10 shadow-sm shrink-0">
        <div className="flex-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
             <div className="p-4 bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-900/20">
               <Package className="w-8 h-8 text-white"/>
             </div>
             INVENTORY <span className="text-blue-600">COMMAND</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black mt-3 uppercase tracking-[0.3em] flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500"/> Stock Velocity & Cycle Counting Engine V11
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
           {[
             { label: 'TOTAL BARANG', val: invStats.totalItems, sub: 'SKU Terdaftar', color: 'blue', icon: Package },
             { label: 'STOK KRITIS', val: invStats.lowStock, sub: 'Butuh Restock', color: 'red', icon: AlertTriangle },
             { label: 'VALUASI STOK', val: formatIDR(invStats.totalValuation), sub: 'Estimasi Nilai HPP', color: 'emerald', icon: Box, hidden: 'sm' }
           ].map((s, i) => (
             <div key={i} className={`bg-white p-5 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-center gap-4 ${s.hidden === 'sm' ? 'hidden sm:flex' : ''}`}>
                <div className={`w-10 h-10 ${s.color === 'blue' ? 'bg-blue-50 text-blue-600' : s.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                   <s.icon className="w-5 h-5"/>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                   <p className={`text-sm font-black ${s.color === 'red' ? 'text-red-600' : 'text-slate-900'}`}>{s.val}</p>
                </div>
             </div>
           ))}
        </div>
      </header>

      <div className="p-10 border-b-2 border-slate-50 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
         <div className="flex flex-col md:flex-row items-center gap-6 max-w-7xl mx-auto">
            <div className="relative flex-1 w-full">
               <Search className="absolute left-6 top-5 w-6 h-6 text-slate-300" />
               <input 
                 type="text" 
                 placeholder="Cari Nama Barang, SKU, atau Scan Barcode..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] py-5 pl-16 pr-8 text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner" 
               />
               <div className="absolute right-6 top-4 p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Scan className="w-6 h-6" />
               </div>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
               <button 
                 onClick={handleOpenOpname}
                 className="flex-1 md:flex-none bg-white hover:bg-blue-50 text-blue-600 px-8 py-4 rounded-[1.5rem] font-black text-[10px] border-2 border-blue-100 transition-all uppercase tracking-widest flex items-center gap-3 active:scale-95 shadow-sm"
               >
                 <RefreshCcw className="w-4 h-4"/> Opname Acak
               </button>
               <button 
                 onClick={() => { setSelectedProduct(null); setForm({ name: '', sku: '', category: 'Umum', price: 0, price_wholesale: 0, cost_price: 0, stock_pcs: 0, unit: 'Pcs' }); setShowAddModal(true); }}
                 className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-[1.5rem] font-black text-[10px] shadow-2xl shadow-blue-500/30 transition-all uppercase tracking-widest flex items-center gap-3 active:scale-95"
               >
                 <Plus className="w-5 h-5"/> Tambah Item
               </button>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
         <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white rounded-[3rem] border-2 border-slate-50 p-8 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all group relative flex flex-col">
                 <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center border-4 border-white shadow-xl transition-transform group-hover:rotate-6">
                          <Package className="w-8 h-8 text-white"/>
                       </div>
                       <div>
                          <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none mb-2 uppercase group-hover:text-blue-600 transition-colors">{p.name}</h3>
                          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase flex items-center gap-2">
                             <Tag className="w-3 h-3 text-blue-500"/> {p.category} <span className="text-slate-200">|</span> SKU: {p.sku || '--'}
                          </p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setSelectedProduct(p); setForm(p); setShowBarcodeModal(true); }} className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all" title="Print Barcode"><Barcode className="w-5 h-5"/></button>
                       <button onClick={() => { setSelectedProduct(p); setForm(p); setShowAddModal(true); }} className="p-3 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"><Edit className="w-5 h-5"/></button>
                       <button onClick={() => onDeleteProduct(p.id || p)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-5 h-5"/></button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50/50 p-5 rounded-[2rem] border-2 border-slate-50 group-hover:bg-white group-hover:border-slate-100 transition-all">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Harga Jual</p>
                       <p className="text-xl font-black text-slate-900 tracking-tighter">{formatIDR(p.price || p.price_retail)}</p>
                    </div>
                    <div className="bg-blue-50/30 p-5 rounded-[2rem] border-2 border-blue-50/50 group-hover:bg-white group-hover:border-blue-100 transition-all">
                       <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Stok Tersedia</p>
                       <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-black tracking-tighter ${p.stock_pcs <= 10 ? 'text-red-600' : 'text-blue-600'}`}>{p.stock_pcs}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">{p.unit}</span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-auto pt-6 border-t-2 border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       {p.status === 'fast' ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border-2 border-emerald-100 animate-pulse">
                             <Zap className="w-4 h-4"/>
                             <span className="text-[9px] font-black uppercase tracking-widest">Fast Moving (DSI: {p.dsi === 999 ? '∞' : Math.round(p.dsi)}d)</span>
                          </div>
                       ) : p.status === 'slow' ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border-2 border-red-100">
                             <AlertCircle className="w-4 h-4"/>
                             <span className="text-[9px] font-black uppercase tracking-widest">Dead Stock (DSI: {p.dsi === 999 ? '∞' : Math.round(p.dsi)}d)</span>
                          </div>
                       ) : (
                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 rounded-xl border-2 border-slate-100">
                             <TrendingUp className="w-4 h-4"/>
                             <span className="text-[9px] font-black uppercase tracking-widest">Normal Velocity</span>
                          </div>
                       )}
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sales (30d)</p>
                       <p className="font-black text-slate-700 text-sm">{p.sales30d} Item</p>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Product Form Modal */}
      {showAddModal && (
        <Modal title={selectedProduct ? "Edit Produk" : "Tambah Produk Baru"} onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleSaveProduct} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Nama Produk *</label>
                   <input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 text-lg font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="Contoh: Jam Tangan Rolex Explorer..."/>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">SKU / Barcode</label>
                   <div className="relative">
                      <input value={form.sku} onChange={e=>setForm({...form, sku: e.target.value})} className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="Generate Otomatis..."/>
                      <Barcode className="absolute right-5 top-5 w-5 h-5 text-slate-300"/>
                   </div>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Kategori</label>
                   <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer shadow-inner">
                      <option value="Umum">UMUM</option>
                      <option value="Luxury">LUXURY</option>
                      <option value="Accessories">ACCESSORIES</option>
                      <option value="Sparepart">SPAREPART</option>
                   </select>
                </div>
                <div className="p-6 bg-blue-50/50 rounded-[2.5rem] border-4 border-blue-50 space-y-6 md:col-span-2">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-blue-400 mb-2 uppercase tracking-widest text-center">Harga Modal (HPP)</label>
                        <input type="number" required value={form.cost_price} onChange={e=>setForm({...form, cost_price: parseInt(e.target.value)||0})} className="w-full bg-white border-2 border-blue-100 rounded-xl px-5 py-3 text-center font-black text-lg text-slate-900 focus:border-blue-500 outline-none transition-all shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-emerald-500 mb-2 uppercase tracking-widest text-center">Harga Jual (Retail)</label>
                        <input type="number" required value={form.price || form.price_retail} onChange={e=>setForm({...form, price: parseInt(e.target.value)||0, price_retail: parseInt(e.target.value)||0})} className="w-full bg-white border-2 border-emerald-100 rounded-xl px-5 py-3 text-center font-black text-lg text-emerald-600 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-amber-500 mb-2 uppercase tracking-widest text-center">Harga Grosir</label>
                        <input type="number" required value={form.price_wholesale} onChange={e=>setForm({...form, price_wholesale: parseInt(e.target.value)||0})} className="w-full bg-white border-2 border-amber-100 rounded-xl px-5 py-3 text-center font-black text-lg text-amber-600 focus:border-amber-500 outline-none transition-all shadow-sm" />
                      </div>
                   </div>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Stok Awal</label>
                   <input type="number" required value={form.stock_pcs} onChange={e=>setForm({...form, stock_pcs: parseInt(e.target.value)||0})} className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Satuan Unit</label>
                   <input required value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})} className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="Pcs / Box / Set"/>
                </div>
             </div>
             <div className="pt-6">
                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-slate-900/30 hover:bg-black transition-all active:scale-[0.98] uppercase tracking-tighter flex items-center justify-center gap-4">
                   <Target className="w-7 h-7 text-blue-500"/> SIMPAN PERUBAHAN KATALOG
                </button>
             </div>
          </form>
        </Modal>
      )}

      {/* Barcode Printer Modal */}
      {showBarcodeModal && selectedProduct && (
        <Modal title="Barcode Label Generator" onClose={() => setShowBarcodeModal(false)} maxWidth="max-w-2xl">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Ukuran Label (Thermal)</label>
                    <select value={barcodeLabelSize} onChange={e=>setBarcodeLabelSize(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 outline-none focus:border-blue-500 cursor-pointer shadow-inner">
                       <option value="40x30">40mm x 30mm (Standard)</option>
                       <option value="50x30">50mm x 30mm (Wide)</option>
                       <option value="30x20">30mm x 20mm (Small)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Jumlah Label Dicetak</label>
                    <div className="flex items-center gap-4">
                       <button onClick={()=>setPrintQty(Math.max(1, printQty-1))} className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-400 hover:bg-slate-200 transition-all">-</button>
                       <input type="number" value={printQty} onChange={e=>setPrintQty(Math.max(1, parseInt(e.target.value)||1))} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 text-center font-black text-2xl text-slate-900 outline-none shadow-inner" />
                       <button onClick={()=>setPrintQty(printQty+1)} className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-400 hover:bg-slate-200 transition-all">+</button>
                    </div>
                 </div>
                 <button onClick={() => { alert('Perintah Cetak Dikirim ke Printer Thermal...'); setShowBarcodeModal(false); }} className="w-full bg-blue-600 text-white py-5 rounded-[1.8rem] font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest">
                    <Printer className="w-6 h-6"/> Cetak Barcode
                 </button>
              </div>
              
              {/* Preview Box */}
              <div className="flex flex-col items-center justify-center bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] p-8 shadow-inner">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Thermal Preview</p>
                 <div className="bg-white p-6 shadow-xl border border-slate-100 flex flex-col items-center gap-3 w-full max-w-[200px] animate-pulse">
                    <p className="text-[8px] font-black text-slate-900 truncate w-full text-center uppercase">{selectedProduct.name}</p>
                    <div className="w-full h-16 bg-slate-900 flex flex-col items-center justify-center gap-1">
                       <div className="flex gap-0.5">
                          {[...Array(20)].map((_, i) => <div key={i} className={`h-8 bg-white ${i % 3 === 0 ? 'w-1' : 'w-0.5'}`} style={{opacity: Math.random() > 0.2 ? 1 : 0}}></div>)}
                       </div>
                    </div>
                    <p className="text-[8px] font-black text-slate-900 tracking-[0.2em]">{selectedProduct.sku || '12345678'}</p>
                    <p className="text-[10px] font-black text-slate-900 mt-2">{formatIDR(selectedProduct.price || selectedProduct.price_retail)}</p>
                 </div>
                 <p className="text-[9px] text-slate-400 font-bold mt-8 italic text-center leading-relaxed">Label akan dicetak menggunakan DPI optimal sesuai setting driver printer.</p>
              </div>
           </div>
        </Modal>
      )}
    </div>
  );
}
  const velocityData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const salesMap = {};
    transactions.forEach(tx => {
      if (tx.status !== 'void' && (tx.created_at || tx.date) > thirtyDaysAgoStr) {
        tx.items?.forEach(item => {
          const pid = item.product_id || item.id;
          salesMap[pid] = (salesMap[pid] || 0) + (item.qty || 0);
        });
      }
    });

    return products.map(p => {
      const dailyAvg = (salesMap[p.id] || 0) / 30;
      const dsi = dailyAvg > 0 ? Math.round(p.stock_pcs / dailyAvg) : Infinity;
      let vLabel = ''; let vStyle = '';
      if (dsi === Infinity) { vLabel = 'Stok Mati'; vStyle = 'bg-slate-100 text-slate-500'; }
      else if (dsi <= 14) { vLabel = `${dsi} Hari ⚡`; vStyle = 'bg-emerald-100 text-emerald-700'; }
      else if (dsi <= 45) { vLabel = `${dsi} Hari 👍`; vStyle = 'bg-blue-100 text-blue-700'; }
      else { vLabel = `${dsi} Hari 🐢`; vStyle = 'bg-red-100 text-red-700'; }
      return { ...p, dsi, vLabel, vStyle };
    });
  }, [products, transactions]);

  const filteredProducts = useMemo(() => velocityData.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [velocityData, searchQuery]);

  const invStats = useMemo(() => {
    const totalItems = products.length;
    const lowStock = products.filter(p => p.stock_pcs <= 10).length;
    const totalValuation = products.reduce((a, b) => a + (b.stock_pcs * (b.cost_price || 0)), 0);
    return { totalItems, lowStock, totalValuation };
  }, [products]);

  return (
    <div className="p-6 md:p-10 bg-slate-50/50 h-full overflow-y-auto w-full pb-24 md:pb-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
        <div className="flex-1">
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
             <div className="p-3 bg-blue-600 rounded-[1.2rem] shadow-lg shadow-blue-500/30">
               <Package className="w-6 h-6 text-white"/>
             </div>
             INVENTORY <span className="text-blue-600">MASTER</span>
           </h1>
           <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Manajemen Stok & Katalog Produk Terintegrasi</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
           {[
             { label: 'TOTAL BARANG', val: invStats.totalItems, sub: 'SKU Terdaftar', color: 'blue', icon: Package },
             { label: 'STOK KRITIS', val: invStats.lowStock, sub: 'Butuh Restock', color: 'red', icon: AlertTriangle },
             { label: 'VALUASI STOK', val: formatIDR(invStats.totalValuation), sub: 'Estimasi Nilai HPP', color: 'emerald', icon: Box, hidden: 'sm' }
           ].map((s, i) => (
             <div key={i} className={`bg-white p-5 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-center gap-4 ${s.hidden === 'sm' ? 'hidden sm:flex' : ''}`}>
                <div className={`w-10 h-10 bg-${s.color}-50 text-${s.color}-600 rounded-xl flex items-center justify-center flex-shrink-0`}>
                   <s.icon className="w-5 h-5"/>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                   <p className={`text-sm font-black text-${s.color === 'red' ? 'red-600' : 'slate-900'}`}>{s.val}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-[2.2rem] border-2 border-slate-50 shadow-sm">
        <div className="relative flex-1 w-full max-w-lg">
           <input 
             type="text" 
             placeholder="Cari Nama Barang, SKU, atau Kode..." 
             value={searchQuery} 
             onChange={(e) => onSearchChange(e.target.value)} 
             className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all" 
           />
           <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
           <div className="absolute right-4 top-3.5 flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{filteredProducts.length} HASIL</span>
           </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button onClick={onStartOpname} className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] shadow-xl shadow-orange-500/20 transition-all active:scale-95 uppercase tracking-widest">
             <Filter className="w-4 h-4" /> Opname Acak
           </button>
           <button onClick={onShowSync} className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-slate-600 px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] border-2 border-slate-100 transition-all active:scale-95 uppercase tracking-widest">
             <UploadCloud className="w-4 h-4 text-blue-500" /> Import CSV
           </button>
           <button onClick={onAddProduct} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] shadow-xl shadow-blue-500/30 transition-all active:scale-95 uppercase tracking-widest">
             <PlusCircle className="w-4 h-4" /> Tambah Barang
           </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-xl overflow-hidden overflow-x-auto relative">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50 border-b-2 border-slate-50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Info Produk</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategori</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Harga Eceran</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Harga Partai</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">HPP (Modal)</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status Stok</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Velocity</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-50">
            {filteredProducts.map(prod => (
              <tr key={prod.id} className="hover:bg-blue-50/20 transition-all group">
                <td className="px-8 py-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 group-hover:bg-white group-hover:border-blue-200 transition-all">
                         <Box className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors"/>
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors uppercase tracking-tight">{prod.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 group-hover:border-blue-100 transition-all">{prod.sku || 'TANPA SKU'}</span>
                           {prod.stock_pcs <= 10 && <span className="bg-red-50 text-red-500 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse uppercase"><AlertTriangle className="w-2 h-2"/> Low</span>}
                        </div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-6">
                   <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black border-2 border-slate-200 uppercase tracking-wider">{prod.category || 'UMUM'}</span>
                </td>
                <td className="px-6 py-6 text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Retail</p>
                   <p className="font-black text-blue-600 text-base">{formatIDR(prod.price_retail)}</p>
                </td>
                <td className="px-6 py-6 text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Wholesale</p>
                   <p className="font-black text-indigo-600 text-base">{formatIDR(prod.price_wholesale)}</p>
                </td>
                <td className="px-6 py-6 text-right">
                   <p className="text-[9px] font-black text-red-300 uppercase mb-0.5 tracking-tighter">COGS</p>
                   <p className="font-black text-red-500 text-sm">{prod.cost_price ? formatIDR(prod.cost_price) : '--'}</p>
                </td>
                <td className="px-6 py-6">
                   <div className="flex flex-col items-center">
                      <div className="font-black text-slate-800 text-lg tracking-tighter">{prod.stock_pcs} <span className="text-[10px] font-bold text-slate-400 uppercase">Unit</span></div>
                      <div className="text-[9px] font-black text-slate-400 mt-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 group-hover:border-blue-100 transition-all">{getStockBreakdown(prod).toUpperCase()}</div>
                   </div>
                </td>
                <td className="px-6 py-6 text-center">
                   <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${prod.vStyle}`}>{prod.vLabel}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onPrintLabel(prod)} className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-2 border-slate-100 rounded-2xl shadow-sm transition-all hover:border-indigo-200 active:scale-90" title="Cetak Label"><Printer className="w-4 h-4" /></button>
                    <button onClick={() => onEditProduct(prod)} className="p-3 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-2 border-slate-100 rounded-2xl shadow-sm transition-all hover:border-blue-200 active:scale-90" title="Edit Barang"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteProduct(prod)} className="p-3 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border-2 border-slate-100 rounded-2xl shadow-sm transition-all hover:border-red-200 active:scale-90" title="Hapus Barang"><Trash className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7" className="p-20 text-center">
                   <div className="flex flex-col items-center opacity-20">
                      <Search className="w-16 h-16 mb-4"/>
                      <p className="text-xl font-black uppercase tracking-[0.5em]">Barang Tidak Ditemukan</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { 
  Package, Search, PlusCircle, Trash, Edit, 
  AlertTriangle, Box, Filter, UploadCloud, Printer, Package as PackageIcon
} from 'lucide-react';

export default function InventoryView({ 
  products, 
  transactions, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onStartOpname, 
  onShowSync, 
  onPrintLabel,
  formatIDR 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const getStockBreakdown = (prod) => {
    // Basic breakdown: stock_pcs is the master unit
    return `${prod.stock_pcs} PCS`;
  };

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
               <PackageIcon className="w-6 h-6 text-white"/>
             </div>
             INVENTORY <span className="text-blue-600">MASTER</span>
           </h1>
           <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Manajemen Stok & Katalog Produk Terintegrasi</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
           {[
             { label: 'TOTAL BARANG', val: invStats.totalItems, sub: 'SKU Terdaftar', color: 'blue', icon: PackageIcon },
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
             onChange={(e) => setSearchQuery(e.target.value)} 
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
           <button onClick={onShowSync || (() => {})} className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-slate-600 px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] border-2 border-slate-100 transition-all active:scale-95 uppercase tracking-widest">
             <UploadCloud className="w-4 h-4 text-blue-500" /> Import CSV
           </button>
           <button onClick={onAddProduct} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] shadow-xl shadow-blue-500/30 transition-all active:scale-95 uppercase tracking-widest">
             <PlusCircle className="w-4 h-4" /> Tambah Barang
           </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Informasi Produk</th>
              <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kategori</th>
              <th className="px-6 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Harga Jual</th>
              <th className="px-6 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Harga Grosir</th>
              <th className="px-6 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">HPP (Modal)</th>
              <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Posisi Stok</th>
              <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Velocity</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.map((prod) => (
              <tr key={prod.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-6">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all group-hover:scale-110 ${prod.stock_pcs <= 10 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        {prod.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <p className="font-black text-slate-900 text-sm tracking-tight">{prod.name}</p>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{prod.sku || 'No SKU'}</span>
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
                    <button onClick={() => (onPrintLabel ? onPrintLabel(prod) : alert('Printer Service Offline'))} className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-2 border-slate-100 rounded-2xl shadow-sm transition-all hover:border-indigo-200 active:scale-90" title="Cetak Label"><Printer className="w-4 h-4" /></button>
                    <button onClick={() => onUpdateProduct(prod.id, prod)} className="p-3 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-2 border-slate-100 rounded-2xl shadow-sm transition-all hover:border-blue-200 active:scale-90" title="Edit Barang"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteProduct(prod)} className="p-3 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border-2 border-slate-100 rounded-2xl shadow-sm transition-all hover:border-red-200 active:scale-90" title="Hapus Barang"><Trash className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="8" className="p-20 text-center">
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

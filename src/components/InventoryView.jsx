import React, { useState, useMemo } from 'react';
import { 
  Package, Search, Plus, Edit, Trash2, Filter, 
  ArrowUpDown, AlertTriangle, CheckCircle, ChevronDown,
  BarChart2, MoreVertical, Layers, Download, Scan, Printer,
  Eye, Tag, Database, Activity, Box, Zap, ShieldCheck, XCircle, ChevronRight, Globe, Workflow
} from 'lucide-react';
import CustomDropdown from './ui/CustomDropdown';

export default function InventoryView({ 
  products = [], 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onStartOpname, 
  formatIDR, 
  currentUser,
  onPrintLabel
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('name'); 

  const isAdmin = currentUser?.role === 'admin';

  // --- ANALISA DATA INVENTARIS ---
  const categories = ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];

  const inventoryStats = useMemo(() => {
    const totalValuation = products.reduce((acc, p) => acc + (p.stock_pcs * (p.cost_price || 0)), 0);
    const lowStockCount = products.filter(p => p.stock_pcs <= (p.low_stock_threshold || 10)).length;
    return {
      totalItems: products.length,
      totalValuation,
      lowStockCount,
      outOfStock: products.filter(p => p.stock_pcs <= 0).length
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                             p.sku?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'Semua' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stock') return b.stock_pcs - a.stock_pcs;
        if (sortBy === 'price') return b.price_retail - a.price_retail;
        return 0;
      });
  }, [products, search, categoryFilter, sortBy]);

  return (
    <div className="flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto custom-scrollbar bg-brand-bg text-brand-text font-sans h-full relative selection:bg-brand-primary/30 selection:text-white">
      
      {/* HEADER UTAMA INVENTARIS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 gap-10 relative z-10">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <span className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-2xl tracking-widest border border-brand-primary/20 shadow-sm">Katalog Barang</span>
             <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-2xl tracking-widest border border-emerald-500/20 shadow-sm">Sistem Aktif</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter flex items-center gap-6 leading-none">
             Stok <span className="text-brand-primary">Barang</span>
          </h1>
          <p className="text-brand-muted text-[11px] font-bold mt-5 tracking-widest opacity-60 leading-relaxed max-w-2xl">
            Pusat data produk dan manajemen stok untuk memudahkan pengelolaan barang di toko dan gudang Anda.
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
            <button 
              onClick={onStartOpname} 
              className="flex-1 xl:flex-none flex items-center justify-center gap-4 px-10 py-5 bg-brand-card/60 backdrop-blur-md text-brand-text rounded-[2rem] text-[11px] font-bold tracking-widest hover:bg-brand-bg transition-all border-2 border-brand-border shadow-xl shadow-black/5 active:scale-95 group"
            >
              <Workflow className="w-5 h-5 text-brand-primary group-hover:rotate-180 transition-transform duration-700" /> Cek Stok (Opname)
            </button>
            <button 
              onClick={onAddProduct} 
              className="flex-1 xl:flex-none flex items-center justify-center gap-4 px-10 py-5 bg-brand-primary text-white rounded-[2rem] text-[11px] font-bold tracking-widest hover:bg-brand-secondary transition-all shadow-[0_24px_48px_-12px_rgba(var(--brand-primary-rgb),0.5)] active:scale-95 group"
            >
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                 <Plus className="w-5 h-5" /> 
              </div>
              Tambah Barang Baru
            </button>
          </div>
        )}
      </div>

      {/* RINGKASAN ANALISA STOK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 relative z-10">
        {[
          { label: 'Total Jenis Produk', value: inventoryStats.totalItems, icon: Package, color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' },
          { label: 'Perlu Stok Ulang', value: inventoryStats.lowStockCount, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
          { label: 'Total Aset Barang', value: formatIDR(inventoryStats.totalValuation), icon: Activity, color: 'text-brand-accent', bg: 'bg-brand-accent/10', border: 'border-brand-accent/20', isAdminOnly: true },
          { label: 'Barang Kosong', value: inventoryStats.outOfStock, icon: Trash2, color: 'text-brand-muted', bg: 'bg-brand-card/40', border: 'border-brand-border/40' },
        ].filter(s => !s.isAdminOnly || isAdmin).map((stat, idx) => (
          <div key={idx} className="bg-brand-card/60 backdrop-blur-md border border-brand-border p-10 rounded-[3.5rem] shadow-2xl shadow-black/5 flex items-center gap-8 group hover:-translate-y-2 transition-all">
            <div className={`w-20 h-20 rounded-[2rem] ${stat.bg} ${stat.color} flex items-center justify-center border ${stat.border} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
              <stat.icon className="w-9 h-9" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted tracking-widest mb-3 leading-none opacity-60">{stat.label}</p>
              <h3 className="text-3xl font-black tracking-tighter leading-none">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* MESIN PENCARIAN & FILTER */}
      <div className="bg-brand-card/40 backdrop-blur-xl border border-brand-border p-6 rounded-[3rem] mb-12 shadow-2xl shadow-black/5 flex flex-col lg:flex-row gap-6 items-center relative z-40 overflow-visible">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-muted group-focus-within:text-brand-primary transition-all duration-500" />
          <input 
            type="text" 
            placeholder="Cari nama barang atau kode (SKU)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 pl-20 pr-8 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-sm placeholder:text-brand-text/30 hover:bg-white/80 dark:hover:bg-white/20 tracking-wider"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
          <CustomDropdown 
            value={categoryFilter} 
            onChange={setCategoryFilter} 
            options={categories} 
            label="Kategori"
            icon={<Filter className="w-4 h-4" />}
          />

          <CustomDropdown 
            value={sortBy} 
            onChange={setSortBy} 
            options={[
              { value: 'name', label: 'Urutkan: Nama' },
              { value: 'stock', label: 'Urutkan: Stok' },
              { value: 'price', label: 'Urutkan: Harga Jual' }
            ]} 
            label="Urutan"
            icon={<ArrowUpDown className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* DATA PRODUK & STOK */}
      <div className="bg-brand-card/60 backdrop-blur-2xl border border-brand-border rounded-[4rem] shadow-2xl shadow-black/5 overflow-hidden group/table relative z-10">
        <div className="overflow-x-auto custom-scrollbar relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg/50 text-brand-muted border-b border-brand-border">
                <th className="px-12 py-10 text-[10px] font-bold tracking-widest">Detail Barang</th>
                <th className="px-10 py-10 text-[10px] font-bold tracking-widest text-center">Status Stok</th>
                <th className="px-10 py-10 text-[10px] font-bold tracking-widest text-right">Harga Jual</th>
                {isAdmin && <th className="px-10 py-10 text-[10px] font-bold tracking-widest text-right">Harga Beli</th>}
                <th className="px-12 py-10 text-[10px] font-bold tracking-widest text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {filteredProducts.map((p) => {
                const isCritical = p.stock_pcs <= (p.low_stock_threshold || 10);
                const isOut = p.stock_pcs <= 0;

                return (
                  <tr key={p.id} className="hover:bg-brand-primary/5 transition-all group/row">
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-8">
                        <div className={`w-16 h-16 rounded-[1.8rem] border-2 flex items-center justify-center group-hover/row:scale-110 group-hover/row:rotate-6 transition-all duration-500 shadow-inner ${isOut ? 'bg-brand-bg border-brand-border text-brand-muted' : isCritical ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'}`}>
                          <Box className="w-8 h-8" />
                        </div>
                        <div>
                          <p className={`font-bold text-lg tracking-tight transition-colors leading-none ${isOut ? 'text-brand-muted italic' : 'text-brand-text group-hover/row:text-brand-primary'}`}>{p.name}</p>
                          <div className="flex items-center gap-4 mt-4">
                             <div className="flex items-center gap-2 px-3 py-1 bg-brand-bg border border-brand-border rounded-lg shadow-sm">
                                <Tag size={12} className="text-brand-primary opacity-60" /> 
                                <span className="text-[10px] font-bold text-brand-muted tracking-wider">{p.sku}</span>
                             </div>
                             <span className="w-1.5 h-1.5 rounded-full bg-brand-border" />
                             <span className="text-[10px] font-bold text-brand-primary tracking-widest opacity-80">{p.category}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className={`px-6 py-3 rounded-2xl text-sm font-bold tracking-widest border-2 transition-all shadow-xl shadow-black/5 ${isOut ? 'bg-brand-bg border-brand-border text-brand-muted opacity-40' : isCritical ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 animate-pulse' : 'bg-brand-bg border-brand-border text-brand-text group-hover/row:border-brand-primary/40'}`}>
                          {p.stock_pcs} <span className="text-[10px] opacity-60 ml-1">{p.unit || 'Pcs'}</span>
                        </div>
                        {isCritical && !isOut && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                             <AlertTriangle className="w-3 h-3 text-rose-500" />
                             <span className="text-[8px] font-bold text-rose-500 tracking-widest">Stok Menipis</span>
                          </div>
                        )}
                        {isOut && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-brand-muted/10 rounded-full border border-brand-border">
                             <XCircle className="w-3 h-3 text-brand-muted" />
                             <span className="text-[8px] font-bold text-brand-muted tracking-widest">Stok Habis</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                       <p className="text-[9px] font-bold text-brand-muted tracking-widest mb-2 opacity-50">Harga Jual</p>
                       <p className="font-black text-xl text-brand-accent tracking-tighter leading-none group-hover/row:scale-110 transition-transform origin-right">{formatIDR(p.price_retail)}</p>
                    </td>
                    {isAdmin && (
                      <td className="px-10 py-8 text-right">
                        <p className="text-[9px] font-bold text-brand-muted tracking-widest mb-2 opacity-50">Harga Beli</p>
                        <p className="font-black text-base text-brand-muted tracking-tighter leading-none opacity-60">{formatIDR(p.cost_price || 0)}</p>
                      </td>
                    )}
                    <td className="px-12 py-8">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => onPrintLabel?.(p)}
                          className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border text-brand-muted hover:text-brand-primary hover:border-brand-primary/40 transition-all shadow-sm flex items-center justify-center hover:shadow-xl active:scale-90"
                          title="Generate/Cetak Barcode"
                        >
                          <Barcode className="w-5 h-5" />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => onUpdateProduct(p.id, p)}
                              className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border text-brand-muted hover:text-brand-primary hover:border-brand-primary/40 transition-all shadow-sm flex items-center justify-center hover:shadow-xl active:scale-90"
                              title="Ubah Data Barang"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => onDeleteProduct(p)}
                              className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border text-brand-muted hover:text-rose-500 hover:border-rose-500/40 transition-all shadow-sm flex items-center justify-center hover:shadow-xl active:scale-90"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

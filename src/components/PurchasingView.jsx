import React, { useState, useMemo } from 'react';
import { formatRp } from '../utils/formatters';
import { 
  Truck, PackagePlus, Banknote, Search, 
  ArrowDownRight, ChevronRight, XCircle,
  Plus, AlertCircle, ShoppingCart, Trash2,
  Calendar, FileText, CheckCircle2, Wallet,
  ArrowRight, ShieldCheck, Filter, Globe, Activity, Zap, Box, Tag, Calculator,
  ChevronDown, Layers, Cpu, Network, Database, History, Share2, MoreVertical,
  Briefcase, Unlock, Lock, Fingerprint, ShieldAlert, ArrowUpRight
} from 'lucide-react';

const Modal = ({ title, children, onClose, maxWidth = 'max-w-2xl' }) => (
  <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-3xl z-[2000] flex items-center justify-center p-10 animate-in fade-in duration-700">
    <div className={`bg-brand-card rounded-[5rem] w-full ${maxWidth} shadow-[0_100px_200px_-50px_rgba(0,0,0,0.6)] border-2 border-brand-border flex flex-col animate-in zoom-in-95 duration-700 overflow-hidden max-h-[92vh] relative group/modal`}>
      <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.5)]"></div>
      <div className="px-14 py-12 border-b-2 border-brand-border flex justify-between items-center bg-brand-bg/40 shrink-0 relative z-10">
        <div>
           <h3 className="font-bold text-brand-text text-3xl tracking-tighter leading-none">{title}</h3>
           <p className="text-[10px] font-bold text-brand-muted tracking-widest mt-3 opacity-60">Otorisasi Sistem • Level-1</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="w-16 h-16 bg-brand-bg border-2 border-brand-border flex items-center justify-center text-brand-muted hover:text-rose-500 rounded-[1.8rem] transition-all shadow-xl active:scale-90 hover:border-rose-500/40">
            <XCircle className="w-8 h-8"/>
          </button>
        )}
      </div>
      <div className="p-14 overflow-y-auto custom-scrollbar relative z-10 bg-brand-card/20">{children}</div>
    </div>
  </div>
);

import CustomDropdown from './ui/CustomDropdown';
import { useNotify } from '../hooks/useNotify';

export default function PurchasingView({ 
  suppliers = [], 
  purchaseOrders = [], 
  products = [],
  onCreatePO,
  onReceivePO,
  onPayPO
}) {
  const { notifySuccess, notifyError } = useNotify();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('po_list'); 
  const [payModal, setPayModal] = useState(null); 
  const [payAmount, setPayAmount] = useState('');

  const [poSupplier, setPoSupplier] = useState('');
  const [poItems, setPoItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [poQty, setPoQty] = useState('');
  const [poCost, setPoCost] = useState('');

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
    if (!selectedProduct || !poQty || !poCost) {
      notifyError('Data barang belum lengkap!');
      return;
    }
    const prod = products.find(p => p.id === parseInt(selectedProduct));
    if (!prod) return;

    setPoItems(prev => [...prev, {
      product_id: prod.id,
      product_name: prod.name,
      qty: parseInt(poQty) || 0,
      unit_price: parseInt(String(poCost).replace(/\D/g, '')) || 0
    }]);

    setSelectedProduct(''); setPoQty(''); setPoCost('');
  };

  const handleRemovePOItem = (idx) => {
    setPoItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitPO = (e) => {
    e.preventDefault();
    if (!poSupplier) return notifyError("Pilih supplier terlebih dahulu!");
    if (poItems.length === 0) return notifyError("Input minimal 1 barang!");

    const supplierObj = suppliers.find(s => s.id === parseInt(poSupplier));
    const poData = {
      supplier_id: supplierObj.id,
      supplier_name: supplierObj.name,
      order_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(), 
      notes: "Pesanan Stok Otomatis",
      status: 'ordered',
      total_amount: poItems.reduce((s,i)=>s+(i.qty*i.unit_price),0),
      items: poItems
    };

    onCreatePO(poData);
    notifySuccess("Pesanan berhasil diproses!");
    setPoItems([]); setPoSupplier(''); setActiveTab('po_list');
  };

  const handleReceiveGoods = (poId) => {
    if (window.confirm("Konfirmasi Terima Barang? \nStok barang akan otomatis bertambah ke sistem.")) {
      onReceivePO(poId);
    }
  };

  const submitPayment = (e) => {
    e.preventDefault();
    const amount = parseInt(String(payAmount).replace(/\D/g, ''));
    const sisaHutang = (payModal.total_amount || 0) - (payModal.paid_amount || 0);

    if (!amount || amount <= 0) return notifyError("Jumlah pembayaran tidak valid");
    if (amount > sisaHutang) return notifyError("Pembayaran melebihi sisa hutang");

    onPayPO(payModal.id, {
      amount: amount,
      payment_method: 'cash',
      notes: 'Pembayaran Hutang Supplier'
    });

    notifySuccess(`Pembayaran ${formatRp(amount)} berhasil!`);
    setPayModal(null); setPayAmount('');
  };


  return (
    <div className="flex flex-col h-full w-full bg-brand-bg text-brand-text font-sans overflow-hidden animate-in fade-in duration-700 transition-colors relative">
      
      {/* HEADER MANAJEMEN KULAKAN */}
      <header className="px-14 md:px-20 py-16 bg-brand-bg border-b-2 border-brand-border flex flex-col lg:flex-row justify-between items-start lg:items-end gap-14 z-10 shrink-0 transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/5 blur-[150px] pointer-events-none"></div>
        <div className="absolute -left-32 -top-32 opacity-[0.03] text-brand-primary pointer-events-none">
           <Network className="w-[500px] h-[500px]" />
        </div>

        <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-8 mb-8">
             <div className="w-20 h-20 bg-brand-primary rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_20px_50px_-10px_rgba(var(--brand-primary-rgb),0.5)] relative group overflow-hidden border-2 border-white/10">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700"></div>
                <Truck className="w-10 h-10 relative z-10 group-hover:rotate-12 transition-transform duration-500" />
             </div>
             <div>
                <h1 className="text-6xl font-bold tracking-tighter leading-none mb-3">
                   Manajemen <span className="text-brand-primary">Kulakan</span>
                </h1>
                <p className="text-[11px] font-bold text-brand-muted tracking-widest opacity-50 ml-1 leading-none">Data Suplai Barang • Analisa Hutang • Buku Supplier</p>
             </div>
          </div>
        </div>
        
        {/* MONITOR HUTANG USAHA */}
        <div className="bg-brand-card/80 backdrop-blur-xl p-10 rounded-[4rem] border-2 border-brand-border flex items-center gap-10 shadow-2xl w-full lg:w-auto transition-all hover:border-rose-500/40 group relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700">
           <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 blur-[80px] pointer-events-none group-hover:bg-rose-500/10 transition-colors"></div>
           <div className="w-24 h-24 bg-rose-500/10 rounded-[2.2rem] flex items-center justify-center border-2 border-rose-500/20 text-rose-500 shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all shadow-inner">
              <ArrowDownRight className="w-12 h-12" />
           </div>
           <div className="relative z-10">
              <p className="text-[11px] font-bold text-rose-500 tracking-widest mb-4 opacity-70">Total Hutang ke Supplier</p>
              <p className="text-5xl font-bold tracking-tighter leading-none group-hover:text-rose-500 transition-colors tabular-nums">{formatRp(totalHutangUsaha)}</p>
           </div>
        </div>
      </header>

      {/* TAMPILAN OPERASIONAL */}
      <div className="flex-1 p-14 lg:p-20 overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar relative">
        
        {/* NAVIGASI TAB */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 shrink-0 gap-10">
           <div className="flex bg-brand-card/60 backdrop-blur-2xl p-3 rounded-[3rem] border-2 border-brand-border shadow-2xl w-full md:w-auto scale-110 ml-4">
              <button 
                onClick={() => setActiveTab('po_list')} 
                className={`flex-1 md:flex-none px-14 py-6 rounded-[2.5rem] font-bold text-[11px] tracking-widest transition-all duration-500 flex items-center justify-center gap-6 ${activeTab === 'po_list' ? 'bg-brand-primary text-white shadow-[0_20px_40px_-10px_rgba(var(--brand-primary-rgb),0.5)] border-2 border-white/10' : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg/50'}`}
              >
                <FileText size={20} /> Daftar Pesanan
              </button>
              <button 
                onClick={() => setActiveTab('new_po')} 
                className={`flex-1 md:flex-none px-14 py-6 rounded-[2.5rem] font-bold text-[11px] tracking-widest transition-all duration-500 flex items-center justify-center gap-6 ${activeTab === 'new_po' ? 'bg-brand-accent text-white shadow-[0_20px_40px_-10px_rgba(var(--brand-accent-rgb),0.5)] border-2 border-white/10' : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg/50'}`}
              >
                <PackagePlus size={20} /> Beli Stok
              </button>
           </div>
           
           {activeTab === 'po_list' && (
             <div className="relative w-full md:w-[450px] group">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-muted group-focus-within:text-brand-primary transition-all duration-500" />
                  <input 
                    type="text" 
                    placeholder="Cari nomor pesanan / supplier..." 
                    value={search} 
                    onChange={(e)=>setSearch(e.target.value)} 
                    className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 pl-20 pr-10 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-sm placeholder:text-brand-text/30 hover:bg-white/80 dark:hover:bg-white/20 tracking-wider" 
                  />
             </div>
           )}
        </div>

        {/* TAB 1: DAFTAR PESANAN */}
        {activeTab === 'po_list' && (
          <div className="bg-brand-card/60 backdrop-blur-2xl rounded-[5rem] border-2 border-brand-border shadow-2xl flex flex-col flex-1 overflow-hidden animate-in fade-in duration-1000 relative group">
             <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4">
                <table className="w-full text-left border-separate border-spacing-y-4">
                   <thead className="text-brand-muted text-[10px] font-bold tracking-widest sticky top-0 z-50 bg-brand-card/80 backdrop-blur-xl">
                      <tr>
                         <th className="px-12 py-10 rounded-l-[2rem]">No. Referensi</th>
                         <th className="px-12 py-10">Nama Supplier</th>
                         <th className="px-12 py-10 text-right">Total Harga</th>
                         <th className="px-12 py-10 text-center">Status Barang</th>
                         <th className="px-12 py-10 text-center rounded-r-[2rem]">Aksi</th>
                      </tr>
                   </thead>
                   <tbody className="before:block before:h-4">
                      {filteredPOs.map(po => {
                         const sisaHutang = (po.total_amount || 0) - (po.paid_amount || 0);
                         return (
                         <tr key={po.id} className="group/row transition-all duration-500 hover:translate-x-2">
                            <td className="px-12 py-10 bg-brand-bg/40 rounded-l-[3.5rem] border-y-2 border-l-2 border-brand-border group-hover/row:border-brand-primary/30 transition-colors">
                               <p className="font-black text-brand-text text-xl tracking-tighter group-hover/row:text-brand-primary transition-colors tabular-nums">#{po.id}</p>
                               <div className="flex items-center gap-3 mt-3">
                                  <Calendar size={12} className="text-brand-muted opacity-40" />
                                  <p className="text-[10px] font-bold text-brand-muted tracking-wider opacity-60">{new Date(po.order_date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</p>
                               </div>
                            </td>
                            <td className="px-12 py-10 bg-brand-bg/40 border-y-2 border-brand-border group-hover/row:border-brand-primary/30 transition-colors">
                               <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 bg-brand-card rounded-2xl flex items-center justify-center border-2 border-brand-border group-hover/row:border-brand-primary/20 transition-all shadow-inner relative overflow-hidden">
                                     <Truck size={24} className="text-brand-muted group-hover/row:text-brand-primary relative z-10 transition-transform group-hover/row:rotate-12" />
                                  </div>
                                  <div>
                                     <span className="font-bold text-brand-text text-xl tracking-tight leading-none block mb-2">{po.supplier_name}</span>
                                     <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                                        <p className="text-[9px] font-bold text-brand-muted tracking-widest opacity-50">Supplier Terverifikasi</p>
                                     </div>
                                  </div>
                                </div>
                            </td>
                            <td className="px-12 py-10 bg-brand-bg/40 border-y-2 border-brand-border group-hover/row:border-brand-primary/30 transition-colors text-right">
                               <p className="font-black text-brand-text text-2xl tracking-tighter leading-none tabular-nums">{formatRp(po.total_amount)}</p>
                               {sisaHutang > 0 && (
                                 <div className="inline-flex items-center gap-3 text-[10px] font-bold text-rose-500 mt-3 tracking-widest px-4 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20 shadow-xl">
                                    <AlertCircle size={14} /> Hutang: {formatRp(sisaHutang)}
                                 </div>
                               )}
                            </td>
                            <td className="px-12 py-10 bg-brand-bg/40 border-y-2 border-brand-border group-hover/row:border-brand-primary/30 transition-colors text-center">
                               {po.status === 'ordered' && <span className="px-6 py-3 bg-amber-500/10 text-amber-500 border-2 border-amber-500/20 font-bold text-[10px] tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3"><History size={14}/> Dikirim</span>}
                               {po.status === 'received' && <span className="px-6 py-3 bg-brand-primary/10 text-brand-primary border-2 border-brand-primary/20 font-bold text-[10px] tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3"><CheckCircle2 size={14}/> Diterima</span>}
                               {po.status === 'paid' && <span className="px-6 py-3 bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 font-bold text-[10px] tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 shadow-emerald-500/20"><ShieldCheck size={14}/> Lunas</span>}
                               {po.status === 'void' && <span className="px-6 py-3 bg-brand-muted/10 text-brand-muted border-2 border-brand-border font-bold text-[10px] tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 opacity-50"><XCircle size={14}/> Dibatalkan</span>}
                            </td>
                            <td className="px-12 py-10 bg-brand-bg/40 rounded-r-[3.5rem] border-y-2 border-r-2 border-brand-border group-hover/row:border-brand-primary/30 transition-colors">
                               <div className="flex justify-center gap-4">
                                  {po.status === 'ordered' && (
                                    <button 
                                      onClick={() => handleReceiveGoods(po.id)} 
                                      className="px-8 py-4 bg-brand-primary text-white hover:bg-brand-secondary font-bold rounded-2xl text-[10px] tracking-widest transition-all shadow-[0_20px_40px_-10px_rgba(var(--brand-primary-rgb),0.5)] active:scale-95 flex items-center gap-4 group/btn border-2 border-white/10"
                                    >
                                       <Box size={18} /> Terima Barang
                                    </button>
                                  )}
                                  {(po.status === 'received' || po.status === 'partial') && (
                                    <button 
                                      onClick={() => { setPayModal(po); setPayAmount(sisaHutang); }} 
                                      className="px-8 py-4 bg-brand-bg border-2 border-brand-border text-brand-text hover:border-brand-accent hover:text-brand-accent font-bold rounded-2xl text-[10px] tracking-widest transition-all flex items-center gap-4 group/btn active:scale-95"
                                    >
                                       <Wallet size={18} /> Bayar Hutang <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                                    </button>
                                  )}
                               </div>
                            </td>
                         </tr>
                      )})}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* TAB 2: INPUT PESANAN BARU */}
        {activeTab === 'new_po' && (
           <div className="flex-1 flex flex-col lg:flex-row gap-14 overflow-visible animate-in slide-in-from-right-12 duration-1000">
              
              {/* MODUL DRAFT */}
              <div className="w-full lg:w-[550px] bg-brand-card/60 backdrop-blur-2xl p-14 rounded-[5rem] border-2 border-brand-border shadow-2xl flex flex-col relative group/draft">
                 <div className="flex items-center gap-8 mb-16 relative z-10">
                    <div className="w-20 h-20 bg-brand-accent/10 text-brand-accent rounded-[2.2rem] flex items-center justify-center border-2 border-brand-accent/20 shadow-inner group">
                       <PackagePlus size={40} className="relative z-10" />
                    </div>
                    <div>
                       <h3 className="font-bold text-brand-text text-3xl tracking-tighter leading-none">Input Pesanan Baru</h3>
                       <p className="text-[11px] font-bold text-brand-muted tracking-widest mt-3 opacity-50">Proses Pembelian Stok Barang</p>
                    </div>
                 </div>

                 <div className="space-y-12 relative z-10">
                    <div className="space-y-5">
                       <label className="text-[11px] font-bold text-brand-muted tracking-widest ml-4 opacity-70">Pilih Supplier</label>
                       <CustomDropdown 
                           value={poSupplier} 
                           onChange={setPoSupplier} 
                           options={suppliers.map(s => ({ value: s.id, label: s.name }))} 
                           placeholder="-- Pilih Supplier --"
                           icon={<Truck className="w-6 h-6" />}
                        />
                    </div>

                    <div className="border-t-2 border-brand-border pt-12 space-y-5">
                       <label className="text-[11px] font-bold text-brand-muted tracking-widest ml-4 opacity-70">Pilih Produk</label>
                       <CustomDropdown 
                          value={selectedProduct} 
                          onChange={setSelectedProduct} 
                          options={products.map(p => ({ value: p.id, label: p.name }))} 
                          placeholder="-- Pilih dari Katalog --"
                          icon={<Tag className="w-6 h-6" />}
                       />
                    </div>

                    <div className="flex flex-col gap-8">
                       <div className="space-y-5">
                          <label className="text-[11px] font-bold text-brand-muted tracking-widest ml-4 opacity-70">Jumlah Unit</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={poQty} 
                            onChange={e=>setPoQty(e.target.value)} 
                            placeholder="0" 
                            className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 px-8 text-2xl font-black text-brand-text outline-none focus:border-brand-primary transition-all text-center tracking-tighter shadow-sm" 
                          />
                       </div>
                       <div className="space-y-5">
                          <label className="text-[11px] font-bold text-brand-muted tracking-widest ml-4 opacity-70">Harga Beli (HPP)</label>
                          <div className="relative">
                             <input 
                               type="text" 
                               value={poCost} 
                               onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setPoCost(val ? parseInt(val).toLocaleString('id-ID') : '');
                               }} 
                               placeholder="0" 
                               className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 pl-14 pr-10 text-2xl font-black text-brand-text outline-none focus:border-brand-primary transition-all text-right tracking-tighter shadow-sm tabular-nums" 
                             />
                             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-muted font-bold text-sm opacity-40">Rp</span>
                          </div>
                       </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleAddItemToPO} 
                      className="w-full py-8 bg-brand-accent text-white font-bold rounded-[2.8rem] hover:bg-brand-accent/90 shadow-[0_25px_50px_-10px_rgba(var(--brand-accent-rgb),0.5)] active:scale-95 transition-all text-[12px] tracking-widest flex justify-center items-center gap-6 group/add border-2 border-white/10"
                    >
                       <Plus size={24} /> Tambah ke Daftar
                    </button>
                 </div>
              </div>

              {/* VISUALISASI DAFTAR BARANG */}
              <div className="flex-1 bg-brand-card/40 backdrop-blur-xl p-14 rounded-[5rem] border-2 border-brand-border shadow-2xl flex flex-col overflow-hidden relative group/vis">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 relative z-10 gap-8">
                    <div>
                       <h3 className="font-bold text-brand-text text-4xl tracking-tighter leading-none">Daftar Barang</h3>
                       <p className="text-[11px] font-bold text-brand-muted tracking-widest mt-4 opacity-50 ml-1">Rincian barang yang akan dibeli</p>
                    </div>
                    <div className="px-8 py-4 bg-brand-bg/80 backdrop-blur-md border-2 border-brand-border rounded-[2rem] text-[11px] font-bold text-brand-primary tracking-widest shadow-xl">
                       {poItems.length} Barang Terpilih
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto bg-brand-bg/40 backdrop-blur-xl rounded-[4rem] border-2 border-brand-border p-10 custom-scrollbar relative z-10 shadow-inner">
                    {poItems.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center opacity-30 gap-8">
                          <ShoppingCart size={56} className="text-brand-muted" />
                          <p className="text-lg font-bold tracking-widest text-brand-muted">Daftar Kosong</p>
                       </div>
                    ) : (
                       <div className="space-y-6">
                          {poItems.map((item, idx) => (
                             <div key={idx} className="bg-brand-card/80 backdrop-blur-md p-10 rounded-[3.5rem] border-2 border-brand-border flex justify-between items-center shadow-2xl hover:border-brand-accent/40 transition-all group/item">
                                <div className="flex items-center gap-8">
                                   <Box size={28} className="text-brand-muted group-hover/item:text-brand-accent transition-transform" />
                                   <div>
                                      <p className="font-bold text-brand-text text-2xl tracking-tighter group-hover/item:text-brand-accent transition-colors leading-none mb-3">{item.product_name}</p>
                                      <div className="flex items-center gap-4">
                                         <span className="text-[10px] font-bold text-brand-muted tracking-widest bg-brand-bg px-4 py-2 rounded-xl border border-brand-border shadow-sm tabular-nums">{item.qty} Unit</span>
                                         <span className="text-[10px] font-bold text-brand-muted tracking-widest opacity-40 tabular-nums">@ {formatRp(item.unit_price)}</span>
                                      </div>
                                   </div>
                                </div>
                                <button onClick={() => handleRemovePOItem(idx)} aria-label="Hapus Item" className="text-brand-muted hover:text-rose-500 transition-colors">
                                   <Trash2 size={24}/>
                                </button>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

                 <div className="mt-16 pt-16 border-t-4 border-brand-border flex flex-col xl:flex-row justify-between items-end gap-14 relative z-10">
                    <div className="text-right xl:text-left w-full xl:w-auto">
                       <p className="text-[12px] font-bold text-brand-muted tracking-widest mb-6 opacity-60 ml-2">Total Harga Pembelian</p>
                       <p className="text-8xl font-black text-brand-accent tracking-tighter leading-none tabular-nums">
                          {formatRp(poItems.reduce((sum, item) => sum + (item.qty * item.unit_price), 0))}
                       </p>
                    </div>
                    <button 
                      onClick={handleSubmitPO} 
                      disabled={poItems.length === 0} 
                      className="w-full xl:w-auto px-20 py-10 bg-brand-accent text-white font-bold rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(var(--brand-accent-rgb),0.6)] active:scale-95 transition-all text-sm tracking-widest flex items-center justify-center gap-8 group/submit hover:-translate-y-4 border-4 border-white/20 relative overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                       <span className="relative z-10">Proses Kulakan</span> 
                       <ArrowUpRight size={32} className="relative z-10" />
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* MODAL PEMBAYARAN HUTANG */}
      {payModal && (
         <Modal title="Bayar Hutang Supplier" onClose={() => setPayModal(null)} maxWidth="max-w-2xl">
            <form onSubmit={submitPayment} className="space-y-16">
               <div className="bg-brand-bg/80 backdrop-blur-xl p-14 rounded-[4rem] border-2 border-brand-border flex flex-col gap-12 relative overflow-hidden group/pay shadow-inner">
                  <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-10">
                     <div>
                        <p className="text-[11px] font-bold tracking-widest text-brand-muted mb-6 opacity-60">Supplier</p>
                        <p className="font-bold text-brand-text text-4xl tracking-tighter leading-none mb-6">{payModal.supplier_name}</p>
                        <div className="inline-flex items-center gap-4 bg-brand-primary/10 px-6 py-3 rounded-2xl border-2 border-brand-primary/20">
                           <Activity size={18} className="text-brand-primary animate-pulse" />
                           <span className="text-[10px] font-bold text-brand-primary tracking-widest">No: {payModal.id}</span>
                        </div>
                     </div>
                     <div className="text-right w-full md:w-auto">
                        <p className="text-[11px] font-bold tracking-widest text-rose-500 mb-6 opacity-70">Sisa Hutang</p>
                        <p className="font-black text-rose-500 text-6xl tracking-tighter leading-none tabular-nums">{formatRp((payModal.total_amount || 0) - (payModal.paid_amount || 0))}</p>
                     </div>
                  </div>
               </div>

                <div className="space-y-10">
                   <label className="text-[12px] font-bold text-brand-muted tracking-widest block text-center opacity-60">Jumlah Pembayaran (Rp)</label>
                   <div className="relative">
                      <input 
                        type="text" 
                        required 
                        autoFocus 
                        value={payAmount} 
                        onChange={e => {
                           const val = e.target.value.replace(/\D/g, '');
                           const maxVal = (payModal.total_amount || 0) - (payModal.paid_amount || 0);
                           const numVal = Math.min(parseInt(val || '0'), maxVal);
                           setPayAmount(numVal ? numVal.toLocaleString('id-ID') : '');
                        }} 
                        className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-4 border-brand-border/50 rounded-[4rem] px-14 py-12 text-7xl font-black text-brand-text outline-none focus:border-rose-500 transition-all shadow-sm text-right tracking-tighter tabular-nums" 
                        placeholder="0"
                      />
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-brand-muted font-bold text-2xl opacity-20">Rp</span>
                   </div>
                   <div className="flex justify-center">
                      <button 
                        type="button" 
                        onClick={() => setPayAmount(((payModal.total_amount || 0) - (payModal.paid_amount || 0)).toLocaleString('id-ID'))} 
                        className="px-14 py-6 bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 rounded-[2rem] text-[11px] font-bold tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-2xl active:scale-95"
                      >
                         Bayar Lunas <ChevronRight size={18} className="inline-block ml-2" />
                      </button>
                   </div>
                </div>

               <div className="bg-amber-500/5 p-10 rounded-[3.5rem] border-2 border-amber-500/20 flex items-start gap-8 backdrop-blur-md">
                  <ShieldAlert className="w-12 h-12 text-amber-500 shrink-0 mt-1 animate-pulse" />
                  <div>
                     <p className="text-[12px] font-bold text-amber-600 tracking-widest mb-4">Peringatan Keuangan</p>
                     <p className="text-[15px] font-bold text-brand-text leading-loose tracking-tighter opacity-80">
                        Transaksi ini akan mencatat <span className="text-rose-500 font-bold">pengeluaran modal</span>. Data pembayaran akan langsung disinkronkan ke buku besar.
                     </p>
                  </div>
               </div>

               <button 
                 type="submit" 
                 className="w-full py-10 text-white font-bold rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(244,63,94,0.6)] active:scale-95 transition-all text-sm tracking-widest bg-rose-500 hover:bg-rose-600 flex items-center justify-center gap-8 group/auth border-4 border-white/20 relative overflow-hidden"
               >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                  <Fingerprint size={32} className="relative z-10" /> 
                  <span className="relative z-10">Proses Pembayaran</span>
               </button>
            </form>
         </Modal>
      )}
    </div>
  );
}

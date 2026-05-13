import React, { useState, useCallback } from 'react';
import { 
  Scan, Barcode, Minus, Plus, 
  CheckCircle2, ClipboardCheck, Calendar,
  AlertTriangle, ArrowRight, X, Layers,
  ChevronRight, RefreshCcw, History,
  ShieldCheck, Database, Boxes, Timer,
  Search, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import toast from 'react-hot-toast';

export default function CycleCountView({ products, onApplyAdjustments, cycleCountHistory = [], preSelected = null }) {
  const [ccItems, setCcItems] = useState(Array.isArray(preSelected) ? preSelected.map(p => ({ ...p, physicalStock: '' })) : []);
  const [isCounting, setIsCounting] = useState(Array.isArray(preSelected) && preSelected.length > 0);
  const [showScanner, setShowScanner] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [adjustments, setAdjustments] = useState([]);

  // Reset if preSelected changes (e.g. user triggers another random opname)
  React.useEffect(() => {
    if (Array.isArray(preSelected)) {
      setCcItems(preSelected.map(p => ({ ...p, physicalStock: '' })));
      setIsCounting(preSelected.length > 0);
      setShowSummary(false);
    }
  }, [preSelected]);

  const startCount = () => {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10).map(p => ({ ...p, physicalStock: '' }));
    setCcItems(selected);
    setIsCounting(true);
    setShowSummary(false);
  };

  const handleReview = () => {
    const adjs = [];
    ccItems.forEach(item => {
      if (item.physicalStock !== '') {
        const phys = parseInt(item.physicalStock, 10);
        const diff = phys - item.stock_pcs;
        adjs.push({ id: item.id, name: item.name, sku: item.sku, oldStock: item.stock_pcs, newStock: phys, diff });
      }
    });
    setAdjustments(adjs);
    setShowSummary(true);
  };

  const handleApply = () => {
    onApplyAdjustments(adjustments);
    setIsCounting(false);
    setShowSummary(false);
  };

  const handleBarcodeScan = useCallback((sku) => {
    const prodIndex = ccItems.findIndex(p => p.sku && p.sku.toLowerCase() === sku.toLowerCase());
    if (prodIndex !== -1) {
      setCcItems(prev => prev.map((item, idx) => {
        if (idx === prodIndex) {
          const currentVal = parseInt(item.physicalStock || '0', 10);
          return { ...item, physicalStock: String(currentVal + 1) };
        }
        return item;
      }));
      toast.success(`[Scanner] Ditemukan: ${ccItems[prodIndex].name} (+1)`, {
        style: {
          background: 'rgba(var(--brand-primary-rgb), 0.1)',
          color: 'var(--brand-primary)',
          border: '1px solid rgba(var(--brand-primary-rgb), 0.2)',
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.05em'
        }
      });
    } else {
      toast.error(`SKU ${sku} tidak ada dalam daftar opname saat ini!`, {
        style: {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.05em'
        }
      });
    }
  }, [ccItems]);

  if (showSummary) {
    return (
      <div className="flex-1 p-8 md:p-16 bg-brand-bg text-brand-text font-sans h-full overflow-y-auto custom-scrollbar transition-colors relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-accent/5 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto bg-brand-card rounded-[4rem] shadow-2xl border border-brand-border p-12 lg:p-20 animate-in zoom-in-95 duration-500 relative z-10">
           <div className="flex items-center gap-8 mb-16 border-b border-brand-border pb-12">
              <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-[2rem] flex items-center justify-center shadow-inner relative group">
                 <div className="absolute inset-0 bg-brand-primary/20 rounded-[2rem] animate-ping opacity-20"></div>
                 <ClipboardCheck className="w-10 h-10 relative z-10" />
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter leading-none mb-3">Selisih <span className="text-brand-primary">Stok</span></h3>
                <p className="text-[10px] font-bold text-brand-muted tracking-wider">Periksa kembali selisih stok sebelum disimpan ke database</p>
              </div>
           </div>

           <div className="space-y-6 mb-16 max-h-[45vh] overflow-y-auto pr-6 custom-scrollbar">
              {adjustments.map(adj => {
                 const hasDiff = adj.diff !== 0;
                 return (
                  <div key={adj.id} className={`flex flex-col lg:flex-row justify-between items-start lg:items-center p-8 rounded-[2.5rem] border transition-all group ${hasDiff ? 'bg-rose-500/5 border-rose-500/20' : 'bg-brand-bg/50 border-brand-border hover:border-brand-primary/30'}`}>
                    <div className="mb-6 lg:mb-0">
                       <p className="font-bold text-brand-text text-xl tracking-tighter group-hover:text-brand-primary transition-colors leading-none mb-2">{adj.name}</p>
                       <p className="text-[10px] font-bold text-brand-muted tracking-widest font-mono opacity-60">SKU: {adj.sku}</p>
                    </div>
                    <div className="flex gap-8 items-center w-full lg:w-auto bg-brand-card/50 p-6 rounded-[2rem] border border-brand-border/50">
                       <div className="text-center">
                          <span className="block text-[8px] font-bold text-brand-muted tracking-widest mb-2">Sistem</span>
                          <span className="text-lg font-bold opacity-40">{adj.oldStock}</span>
                       </div>
                       <div className="w-px h-8 bg-brand-border"></div>
                       <div className="text-center">
                          <span className="block text-[8px] font-bold text-brand-muted tracking-widest mb-2">Fisik</span>
                          <span className="text-lg font-bold">{adj.newStock}</span>
                       </div>
                       <div className={`text-center min-w-[100px] py-3 rounded-2xl border ${adj.diff === 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : adj.diff < 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.1)]'}`}>
                          <span className="block text-[8px] font-bold tracking-widest mb-1 opacity-80">Selisih</span>
                          <span className="text-sm font-bold tracking-widest">{adj.diff > 0 ? `+${adj.diff}` : adj.diff}</span>
                       </div>
                    </div>
                  </div>
                 );
              })}
              {adjustments.length === 0 && (
                <div className="text-center py-24 border-2 border-dashed border-brand-border rounded-[3rem] opacity-20">
                   <AlertTriangle className="w-16 h-16 mx-auto mb-6" />
                   <p className="text-xs font-bold tracking-widest">Tidak Ada Selisih Stok</p>
                </div>
              )}
           </div>
           
           <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-brand-border">
              <button onClick={() => setShowSummary(false)} className="w-full sm:w-1/3 py-6 bg-brand-bg border border-brand-border text-brand-muted font-bold rounded-[2rem] hover:text-brand-text transition-all tracking-widest text-[10px] active:scale-95">Batalkan</button>
              <button disabled={adjustments.length === 0} onClick={handleApply} className="flex-1 py-6 bg-brand-primary text-white font-bold rounded-[2rem] shadow-2xl shadow-brand-primary/40 active:scale-95 disabled:opacity-30 transition-all tracking-widest text-[10px] flex items-center justify-center gap-4">Simpan Perubahan <ArrowRight size={20}/></button>
           </div>
        </div>
      </div>
    );
  }

  if (!isCounting) {
    return (
      <div className="flex-1 p-8 md:p-16 bg-brand-bg text-brand-text font-sans h-full overflow-y-auto custom-scrollbar flex flex-col items-center transition-colors relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-accent/5 pointer-events-none"></div>
        
        <div className="bg-brand-card p-12 md:p-20 rounded-[4.5rem] shadow-2xl border border-brand-border max-w-2xl w-full text-center animate-in zoom-in-95 duration-500 relative z-10 overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary to-brand-accent"></div>
           
           <div className="w-28 h-28 bg-brand-primary/10 text-brand-primary rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-brand-primary/10 relative group">
              <Scan className="w-14 h-14 group-hover:scale-110 transition-transform" />
           </div>
           
           <h3 className="text-4xl font-black tracking-tighter mb-6 leading-none">Stok <span className="text-brand-primary">Opname</span></h3>
           <p className="text-[10px] text-brand-muted font-bold mb-12 leading-relaxed max-w-sm mx-auto tracking-wider opacity-70">
             Sistem akan memilih <span className="text-brand-text">10 barang secara acak</span> untuk Anda cek jumlah fisiknya hari ini.
           </p>
           
           <button onClick={startCount} className="w-full bg-brand-primary text-white font-bold py-7 px-12 rounded-[2.5rem] shadow-2xl shadow-brand-primary/40 transition-all active:scale-95 tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-brand-secondary">
             Mulai Opname Sekarang <ArrowRight size={22}/>
           </button>
           
           <div className="mt-20 border-t border-brand-border pt-12 w-full text-left">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h4 className="font-bold text-brand-text tracking-wider flex items-center gap-4 text-xs">
                    <History className="w-6 h-6 text-brand-primary"/> Riwayat Opname
                  </h4>
                  <p className="text-[8px] font-bold text-brand-muted tracking-widest mt-1">Catatan Pengecekan Sebelumnya</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-bg rounded-xl border border-brand-border shadow-inner">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[8px] font-bold text-brand-muted tracking-widest">Sistem Aktif</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {cycleCountHistory.length === 0 ? (
                   <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-[3rem] bg-brand-bg/30">
                      <p className="text-[9px] font-bold text-brand-muted tracking-widest italic opacity-40">Belum ada riwayat opname</p>
                   </div>
                ) : (
                   cycleCountHistory.slice(0, 5).map(history => (
                      <div key={history.id} className="flex justify-between items-center p-8 bg-brand-bg border border-brand-border rounded-[2.5rem] hover:border-brand-primary/40 transition-all group shadow-sm hover:shadow-xl">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-brand-card rounded-2xl flex items-center justify-center border border-brand-border group-hover:scale-110 group-hover:border-brand-primary/30 transition-all shadow-inner">
                               <ClipboardCheck className="w-7 h-7 text-brand-primary opacity-60 group-hover:opacity-100 transition-opacity"/>
                            </div>
                            <div>
                               <p className="font-bold text-base text-brand-text tracking-tighter leading-none mb-2">{history.date}</p>
                               <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-bold text-brand-muted tracking-widest font-mono">ID: {history.id}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-brand-text tracking-widest mb-2">{history.itemsCounted} barang dicek</p>
                            <div className={`inline-flex items-center gap-2 text-[8px] font-bold px-4 py-1.5 rounded-xl border tracking-wider shadow-sm ${history.totalDiscrepancy === 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                               <Activity size={10} /> Selisih: {history.totalDiscrepancy}
                            </div>
                         </div>
                      </div>
                   ))
                )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  const progress = ccItems.filter(i => i.physicalStock !== '').length;

  return (
    <div className="flex-1 p-8 md:p-16 bg-brand-bg text-brand-text font-sans h-full overflow-y-auto custom-scrollbar transition-colors relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-accent/5 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto bg-brand-card rounded-[4.5rem] shadow-2xl border border-brand-border p-12 lg:p-16 animate-in slide-in-from-bottom-12 duration-700 relative z-10">
        
        {/* ENHANCED PROGRESS NAVIGATOR */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-16 gap-10">
          <div>
            <div className="flex items-center gap-6 mb-4">
              <h3 className="text-5xl font-black tracking-tighter leading-none">Proses <span className="text-brand-primary">Opname</span></h3>
              <button onClick={() => setShowScanner(!showScanner)} className={`w-14 h-14 rounded-2xl border-2 transition-all active:scale-90 flex items-center justify-center ${showScanner ? 'bg-brand-primary text-white border-brand-primary shadow-2xl shadow-brand-primary/40' : 'bg-brand-bg border-brand-border text-brand-muted hover:border-brand-primary/50 hover:text-brand-primary shadow-inner'}`} title="Toggle Scanner Hub">
                 <Barcode className="w-6 h-6" />
              </button>
            </div>
            <p className="text-[10px] font-bold text-brand-muted tracking-wider ml-1 opacity-60">Masukkan jumlah fisik barang atau gunakan barcode scanner.</p>
          </div>
          
          <div className="bg-brand-bg/80 backdrop-blur-sm border border-brand-border rounded-[2rem] p-4 flex items-center gap-6 pl-8 shadow-inner group/progress">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-brand-muted tracking-widest mb-1 opacity-60 group-hover/progress:text-brand-primary transition-colors">Proses Pengecekan</span>
                <span className="text-xl font-black tracking-tighter">{progress} <span className="text-brand-muted opacity-20 mx-1">/</span> {ccItems.length}</span>
             </div>
             <div className="w-32 h-2.5 bg-brand-border rounded-full overflow-hidden shadow-inner">
                <div className="bg-brand-primary h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.6)]" style={{ width: `${(progress / ccItems.length) * 100}%` }}></div>
             </div>
          </div>
        </div>

        {showScanner && (
          <div className="mb-16 animate-in slide-in-from-top-10 duration-700">
             <div className="p-1.5 bg-gradient-to-br from-brand-primary/40 to-brand-accent/40 rounded-[2.5rem] shadow-2xl">
                <div className="bg-brand-card rounded-[2.3rem] overflow-hidden">
                   <BarcodeScanner onScan={handleBarcodeScan} compact={false} />
                </div>
             </div>
             <p className="text-[9px] font-bold text-brand-primary text-center mt-6 tracking-widest animate-pulse">Scanner Aktif • Arahkan Barcode Barang ke Kamera</p>
          </div>
        )}

        {/* HIGH-DENSITY AUDIT LIST */}
        <div className="space-y-6 mb-16 max-h-[50vh] overflow-y-auto pr-6 custom-scrollbar">
          {ccItems.map(item => (
            <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-brand-bg border border-brand-border rounded-[3rem] gap-8 hover:border-brand-primary/40 transition-all group shadow-sm hover:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex-1">
                <p className="font-bold text-brand-text text-2xl tracking-tighter group-hover:text-brand-primary transition-colors leading-none mb-4">{item.name}</p>
                <div className="flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-3 bg-brand-card px-4 py-2 rounded-2xl border border-brand-border shadow-inner">
                      <Barcode size={14} className="text-brand-muted opacity-40" />
                      <span className="text-[10px] font-bold text-brand-muted tracking-widest font-mono">{item.sku}</span>
                   </div>
                   <div className="flex items-center gap-3 bg-brand-primary/5 px-4 py-2 rounded-2xl border border-brand-primary/10 shadow-sm">
                      <Boxes size={14} className="text-brand-primary" />
                      <span className="text-[10px] font-bold text-brand-primary tracking-wider">Stok Sistem: {item.stock_pcs} barang</span>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center bg-brand-card p-2 rounded-[2.2rem] border border-brand-border shadow-inner w-full md:w-auto self-stretch md:self-center">
                 <button onClick={() => setCcItems(prev => prev.map(i => i.id === item.id ? {...i, physicalStock: String(Math.max(0, parseInt(i.physicalStock||'0',10)-1))} : i))} className="w-16 h-16 bg-brand-bg text-brand-muted hover:text-brand-text hover:bg-brand-border rounded-[1.5rem] flex items-center justify-center transition-all active:scale-90 shadow-sm border border-transparent hover:border-brand-border/50">
                   <Minus className="w-6 h-6"/>
                 </button>
                 <div className="relative group/val">
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={item.physicalStock} 
                      onChange={(e) => setCcItems(prev => prev.map(i => i.id === item.id ? {...i, physicalStock: e.target.value} : i))} 
                      className="w-28 bg-transparent text-center font-black text-brand-text text-4xl focus:outline-none appearance-none tracking-tighter" 
                    />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-primary/20 rounded-full scale-x-0 group-focus-within/val:scale-x-100 transition-transform"></div>
                 </div>
                 <button onClick={() => setCcItems(prev => prev.map(i => i.id === item.id ? {...i, physicalStock: String(parseInt(i.physicalStock||'0',10)+1)} : i))} className="w-16 h-16 bg-brand-bg text-brand-primary hover:text-white hover:bg-brand-primary rounded-[1.5rem] flex items-center justify-center transition-all active:scale-90 shadow-2xl shadow-brand-primary/10 border border-transparent hover:border-brand-primary">
                   <Plus className="w-6 h-6"/>
                 </button>
              </div>
            </div>
          ))}
        </div>

        {/* FISCAL ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-brand-border">
           <button onClick={() => setIsCounting(false)} className="w-full sm:w-1/3 py-7 bg-brand-bg border border-brand-border text-brand-muted font-bold rounded-[2.5rem] hover:text-rose-500 hover:border-rose-500/30 transition-all tracking-widest text-[10px] active:scale-95 shadow-sm">Tutup Opname</button>
           <button 
             disabled={progress < ccItems.length} 
             onClick={handleReview} 
             className="flex-1 py-7 bg-brand-primary text-white font-bold rounded-[2.5rem] hover:bg-brand-secondary disabled:opacity-30 transition-all active:scale-95 shadow-2xl shadow-brand-primary/40 tracking-widest text-[10px] flex items-center justify-center gap-4 group"
           >
             Cek Hasil Opname <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
}

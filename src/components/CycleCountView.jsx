import React, { useState, useCallback } from 'react';
import { Scan, Barcode, Minus, Plus, CheckCircle2, ClipboardCheck, Calendar } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import toast from 'react-hot-toast';

export default function CycleCountView({ products, onApplyAdjustments, cycleCountHistory = [], preSelected = null }) {
  const [ccItems, setCcItems] = useState(preSelected ? preSelected.map(p => ({ ...p, physicalStock: '' })) : []);
  const [isCounting, setIsCounting] = useState(!!preSelected);
  const [showScanner, setShowScanner] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [adjustments, setAdjustments] = useState([]);

  // Reset if preSelected changes (e.g. user triggers another random opname)
  React.useEffect(() => {
    if (preSelected) {
      setCcItems(preSelected.map(p => ({ ...p, physicalStock: '' })));
      setIsCounting(true);
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
      toast.success(`[Scanner] Fisik ${ccItems[prodIndex].name} +1`);
    } else {
      toast.error(`SKU ${sku} tidak ada dalam daftar opname ini!`);
    }
  }, [ccItems]);

  if (showSummary) {
    return (
      <div className="p-4 md:p-8 h-full bg-slate-50 overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 md:p-8 animate-in zoom-in-95">
           <h3 className="text-2xl font-black text-slate-800 mb-2">Ringkasan Selisih Stok</h3>
           <p className="text-sm text-slate-500 mb-6">Harap tinjau kembali hasil hitung fisik sebelum disimpan ke database.</p>

           <div className="space-y-3 mb-8">
              {adjustments.map(adj => (
                 <div key={adj.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                       <p className="font-bold text-sm text-slate-800">{adj.name}</p>
                       <p className="text-[10px] font-mono text-slate-500">{adj.sku}</p>
                    </div>
                    <div className="flex gap-4 text-sm font-bold text-slate-600 items-center">
                       <div className="text-center w-12">
                          <span className="block text-[9px] text-slate-400 uppercase">Sistem</span>
                          {adj.oldStock}
                       </div>
                       <div className="text-center w-12">
                          <span className="block text-[9px] text-slate-400 uppercase">Fisik</span>
                          {adj.newStock}
                       </div>
                       <div className={`text-center w-16 rounded-lg px-2 py-1.5 border ${adj.diff === 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : adj.diff < 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                          <span className="block text-[8px] uppercase opacity-80 mb-0.5">Selisih</span>
                          {adj.diff > 0 ? `+${adj.diff}` : adj.diff}
                       </div>
                    </div>
                 </div>
              ))}
              {adjustments.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">Tidak ada barang yang dihitung.</p>}
           </div>
           
           <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setShowSummary(false)} className="w-full sm:w-1/3 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Kembali Edit</button>
              <button disabled={adjustments.length === 0} onClick={handleApply} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 transition-all">KONFIRMASI & SIMPAN</button>
           </div>
        </div>
      </div>
    );
  }

  if (!isCounting) {
    return (
      <div className="p-4 md:p-8 h-full bg-slate-50 flex items-start justify-center overflow-y-auto">
        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 max-w-lg w-full text-center animate-in zoom-in-95">
           <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><Scan className="w-10 h-10" /></div>
           <h3 className="text-2xl font-black text-slate-800 mb-3">Stok Opname Nyicil</h3>
           <p className="text-sm text-slate-500 mb-8 leading-relaxed">Sistem akan memilihkan 10 produk secara acak untuk Anda hitung fisiknya hari ini untuk meminimalisir fraud.</p>
           <button onClick={startCount} className="w-full bg-blue-600 text-white font-bold py-4 px-10 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-transform active:scale-95">Mulai Cek Stok Hari Ini</button>
           
           <div className="mt-12 border-t border-slate-100 pt-8 w-full text-left">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500"/> Riwayat Opname Terakhir</h4>
              <div className="space-y-3">
                {cycleCountHistory.length === 0 ? (
                   <p className="text-sm text-slate-400 text-center py-4">Belum ada riwayat opname.</p>
                ) : (
                   cycleCountHistory.slice(0, 5).map(history => (
                      <div key={history.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200"><ClipboardCheck className="w-5 h-5 text-emerald-500"/></div>
                            <div>
                               <p className="font-bold text-sm text-slate-800">{history.date}</p>
                               <p className="text-[10px] text-slate-500 font-mono mt-0.5">{history.id}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-bold text-slate-600">{history.itemsCounted} Item Dicek</p>
                            <p className={`text-[10px] font-bold mt-0.5 ${history.totalDiscrepancy === 0 ? 'text-emerald-500' : 'text-red-500'}`}>Selisih: {history.totalDiscrepancy}</p>
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
    <div className="p-4 md:p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 md:p-8 animate-in slide-in-from-bottom-8">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              Input Fisik Barang
              <button onClick={() => setShowScanner(!showScanner)} className={`p-2 rounded-lg border transition-colors ${showScanner ? 'bg-indigo-100 border-indigo-300 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`} title="Scan Barcode untuk Menambah Jumlah Fisik">
                 <Barcode className="w-4 h-4" />
              </button>
            </h3>
            <p className="text-sm text-slate-500 mt-1">Hitung barang di rak, ketik angkanya, atau gunakan scanner.</p>
          </div>
          <span className="text-sm font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">Progres: {progress} / {ccItems.length}</span>
        </div>
        
        <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
          <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${(progress / ccItems.length) * 100}%` }}></div>
        </div>

        {showScanner && (
          <div className="mb-6 animate-in slide-in-from-top-4">
             <BarcodeScanner onScan={handleBarcodeScan} compact={false} />
          </div>
        )}

        <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2">
          {ccItems.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-2xl gap-4 hover:border-blue-300 transition-colors">
              <div>
                <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">{item.sku}</span>
                   <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">Sistem: {item.stock_pcs} Pcs</span>
                </div>
              </div>
              <div className="relative w-full sm:w-40 shrink-0 flex items-center">
                 <button onClick={() => setCcItems(prev => prev.map(i => i.id === item.id ? {...i, physicalStock: String(Math.max(0, parseInt(i.physicalStock||'0',10)-1))} : i))} className="w-10 h-12 bg-slate-200 text-slate-600 rounded-l-xl font-bold flex justify-center items-center hover:bg-slate-300 border-y-2 border-l-2 border-slate-300"><Minus className="w-4 h-4"/></button>
                 <input type="number" placeholder="Fisik" value={item.physicalStock} onChange={(e) => setCcItems(prev => prev.map(i => i.id === item.id ? {...i, physicalStock: e.target.value} : i))} className="w-full bg-white border-y-2 border-slate-300 px-2 py-3 text-center font-black text-slate-800 text-lg focus:outline-none shadow-inner" />
                 <button onClick={() => setCcItems(prev => prev.map(i => i.id === item.id ? {...i, physicalStock: String(parseInt(i.physicalStock||'0',10)+1)} : i))} className="w-10 h-12 bg-slate-200 text-slate-600 rounded-r-xl font-bold flex justify-center items-center hover:bg-slate-300 border-y-2 border-r-2 border-slate-300"><Plus className="w-4 h-4"/></button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
           <button onClick={() => setIsCounting(false)} className="w-full sm:w-1/3 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Batal</button>
           <button disabled={progress < ccItems.length} onClick={handleReview} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-transform active:scale-95 shadow-lg shadow-blue-600/30">SELESAI & TINJAU SELISIH</button>
        </div>
      </div>
    </div>
  );
}

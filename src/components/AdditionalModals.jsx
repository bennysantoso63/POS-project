import React from 'react';
import { 
  XCircle, Download, CheckCircle2, 
  Printer, PlayCircle, Clock, Calendar, 
  FileText, ArrowRight, X, ChevronRight
} from 'lucide-react';
import CustomDropdown from './ui/CustomDropdown';

export function ExportModal({ show, filter, onFilterChange, customRange, onCustomRangeChange, onExport, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-brand-card rounded-[3rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-300 border border-brand-border">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
              <Download className="w-7 h-7" />
           </div>
           <div>
             <h3 className="text-2xl font-black text-brand-text tracking-tight">Ekspor Laporan</h3>
             <p className="text-[10px] font-bold text-brand-muted tracking-widest mt-0.5">Generator File Excel (.XLSX)</p>
           </div>
        </div>

        <div className="space-y-6 mb-10">
            <div className="relative z-50">
              <label className="text-[10px] font-bold text-brand-muted tracking-widest mb-3 ml-1 flex items-center gap-2"><Calendar className="w-3 h-3"/> Rentang Waktu</label>
              <CustomDropdown 
                value={filter} 
                onChange={onFilterChange} 
                options={[
                  { value: 'today', label: 'Hari Ini' },
                  { value: 'this_month', label: 'Bulan Ini' },
                  { value: 'this_year', label: 'Tahun Ini' },
                  { value: 'custom', label: 'Tanggal Khusus (Custom)' }
                ]} 
                label="Pilih Rentang"
                icon={<ChevronRight className="w-4 h-4" />}
              />
            </div>
           
           {filter === 'custom' && (
             <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
               <div className="space-y-2">
                 <label className="text-[9px] font-bold text-brand-muted tracking-widest ml-1">Mulai</label>
                 <input type="date" value={customRange.start} onChange={e => onCustomRangeChange({...customRange, start: e.target.value})} className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-[11px] font-bold text-brand-text outline-none focus:border-brand-primary" />
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-bold text-brand-muted tracking-widest ml-1">Selesai</label>
                 <input type="date" value={customRange.end} onChange={e => onCustomRangeChange({...customRange, end: e.target.value})} className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-[11px] font-bold text-brand-text outline-none focus:border-brand-primary" />
               </div>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button onClick={onExport} className="w-full py-5 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-xl shadow-brand-primary/30 transition-all active:scale-95 tracking-widest text-[10px] flex items-center justify-center gap-3">Unduh Excel <ArrowRight size={16}/></button>
          <button onClick={onClose} className="w-full py-5 bg-brand-bg border border-brand-border text-brand-muted font-bold rounded-2xl hover:text-rose-500 transition-all tracking-widest text-[10px]">Tutup Jendela</button>
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({ show, receipt, settings, onPrint, onClose, formatIDR }) {
  if (!show || !receipt) return null;
  const data = receipt.data || receipt;
  const type = receipt.type || (data.po_number ? 'po' : 'transaction');

  const storeName = settings?.store_name || 'TOKO POS';
  const storeAddress = settings?.store_address || '';
  const storePhone = settings?.store_phone || '';
  const receiptFooter = settings?.receipt_footer || 'Terima Kasih Atas Kunjungan Anda.';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-brand-card rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] w-full max-w-sm p-10 animate-in zoom-in-95 duration-300 text-center relative overflow-hidden border border-brand-border">
        
        <div className="flex items-center justify-center mb-8">
           <div className="w-16 h-1 bg-brand-border rounded-full" />
        </div>
        
        {/* Paper Receipt Simulation */}
        <div className="bg-[#f9f9f9] text-[#1a1a1a] text-left font-mono text-[10px] p-8 border border-brand-border shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] mb-10 rounded-2xl overflow-hidden relative selection:bg-brand-primary/20">
           {/* Decorative Receipt Cut */}
           <div className="absolute -top-1 left-0 w-full h-2 bg-[radial-gradient(circle,transparent_4px,#f9f9f9_4px)] bg-[length:12px_12px] transform rotate-180" />
           
           <div className="text-center mb-6 pb-6 border-b border-dashed border-black/10">
             <h2 className="font-bold text-sm uppercase mb-1 tracking-tighter">{storeName}</h2>
             <p className="text-[9px] opacity-70 leading-relaxed px-4">{storeAddress}</p>
             {storePhone && <p className="text-[9px] opacity-70">Telp: {storePhone}</p>}
           </div>

           {type === 'transaction' && (
             <>
               <div className="border-b border-dashed border-black/10 mb-4 pb-3 space-y-0.5">
                  <div className="flex justify-between"><span>NO:</span><span className="font-bold">{data.id || 'TX-NEW'}</span></div>
                  <div className="flex justify-between"><span>TGL:</span><span>{data.created_at || new Date().toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>KASIR:</span><span className="font-bold uppercase">{data.user_name || 'Kasir'}</span></div>
               </div>
               <div className="border-b border-dashed border-black/10 mb-4 pb-3 space-y-2">
                  {(data.items || []).map((item, idx) => (
                    <div key={idx}>
                       <div className="font-bold tracking-tighter">{item.name}</div>
                       <div className="flex justify-between opacity-80">
                          <span>{item.qty} {item.unitType || 'Pcs'} x {formatIDR(item.price || item.unit_price).replace('Rp', '')}</span>
                          <span className="font-bold">{formatIDR(item.qty * (item.price || item.unit_price)).replace('Rp', '')}</span>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-sm border-b border-black/5 pb-1"><span>TOTAL</span><span>{formatIDR(data.total)}</span></div>
                  <div className="flex justify-between opacity-80 pt-1"><span>TUNAI</span><span>{formatIDR(data.amountPaid || data.total)}</span></div>
                  <div className="flex justify-between border-t border-dashed border-black/20 pt-2 font-bold"><span>KEMBALI</span><span>{formatIDR(data.changeAmount || 0)}</span></div>
               </div>
             </>
           )}

           {type === 'po' && (
             <>
               <div className="text-center mb-3 font-bold border-2 border-black py-1.5 text-[11px] tracking-widest">SURAT PESANAN</div>
               <div className="border-b border-dashed border-black/10 mb-4 pb-3 space-y-0.5">
                  <div className="flex justify-between"><span>NO PO:</span><span className="font-bold">{data.po_number}</span></div>
                  <div className="flex justify-between"><span>TGL:</span><span>{data.created_at}</span></div>
                  <div className="flex justify-between"><span>SUPPLIER:</span><span className="font-bold uppercase truncate">{data.supplier_name}</span></div>
               </div>
               <div className="border-b border-dashed border-black/10 mb-4 pb-3 space-y-1.5">
                  {(data.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                       <span className="truncate pr-4">{item.qty}x {item.name}</span>
                       <span className="shrink-0 font-bold">{formatIDR(item.qty * item.cost_price).replace('Rp', '')}</span>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between font-bold text-sm"><span>EST. TOTAL</span><span>{formatIDR(data.total_cost)}</span></div>
             </>
           )}

           {type === 'shift_report' && (
             <>
               <div className="text-center mb-3 font-bold border-2 border-black py-1.5 text-[11px] tracking-widest">X-REPORT SHIFT</div>
               <div className="border-b border-dashed border-black/10 mb-4 pb-3 space-y-0.5 opacity-80">
                  <div className="flex justify-between"><span>ID SESI:</span><span className="font-bold">{data.id}</span></div>
                  <div className="flex justify-between"><span>KASIR:</span><span className="font-bold uppercase">{data.user_name || data.user}</span></div>
                  <div className="flex justify-between"><span>BUKA:</span><span>{data.opened_at}</span></div>
                  <div className="flex justify-between"><span>TUTUP:</span><span>{data.closed_at || new Date().toLocaleString()}</span></div>
               </div>
               <div className="border-b border-dashed border-black/10 mb-4 pb-3 space-y-1.5">
                  <div className="flex justify-between"><span>MODAL AWAL:</span><span>{formatIDR(data.opening_cash).replace('Rp', '')}</span></div>
                  <div className="flex justify-between font-bold text-blue-800"><span>EKSPEKTASI:</span><span>{formatIDR(data.expected_cash).replace('Rp', '')}</span></div>
                  <div className="flex justify-between font-bold text-indigo-800"><span>FISIK LACI:</span><span>{formatIDR(data.closing_cash).replace('Rp', '')}</span></div>
               </div>
               <div className={`text-center font-bold p-3 rounded-lg border-2 ${data.selisih < 0 ? 'bg-black text-white border-black' : 'bg-white text-black border-black/20'}`}>
                  SELISIH: {formatIDR(data.selisih)}
               </div>
             </>
           )}

           <div className="text-center mt-8 pt-6 border-t border-dashed border-black/10 text-[8px] opacity-40 italic">
             {type === 'barcode' ? 'Label Barcode Produk' : type === 'transaction' ? receiptFooter : 'Dokumen Digital Ling-Ling POS'}
           </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => onPrint(receipt)} className="w-full py-5 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/30 transition-all active:scale-95 tracking-widest text-xs"><Printer className="w-5 h-5" /> Cetak Struk Fisik</button>
          <button onClick={onClose} className="w-full py-5 bg-brand-bg border border-brand-border text-brand-muted font-bold rounded-2xl hover:text-brand-text transition-all tracking-widest text-[10px]">Kembali ke POS</button>
        </div>
      </div>
    </div>
  );
}

export function DraftModal({ show, drafts, onRestore, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-brand-card rounded-[3rem] shadow-2xl w-full max-w-lg p-10 animate-in zoom-in-95 duration-300 border border-brand-border">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
              <Clock className="w-7 h-7" />
           </div>
           <div>
             <h3 className="text-2xl font-black text-brand-text tracking-tight">Pesanan Tertunda</h3>
             <p className="text-[10px] font-bold text-brand-muted tracking-widest mt-0.5">Manajemen Antrean Draft</p>
           </div>
        </div>

        <div className="space-y-3 mb-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
           {drafts.map(d => (
              <div key={d.id} className="flex justify-between items-center bg-brand-bg border border-brand-border p-6 rounded-[2rem] hover:border-amber-500/40 transition-all group shadow-sm">
                 <div>
                    <div className="font-bold text-brand-text text-sm tracking-tight">{d.id}</div>
                    <div className="text-[9px] font-bold text-brand-muted tracking-widest mt-1 flex items-center gap-2">
                       <span className="text-amber-500">{d.time}</span>
                       <span className="w-1 h-1 bg-brand-border rounded-full" />
                       <span>{d.cart.length} Item</span>
                       <span className="w-1 h-1 bg-brand-border rounded-full" />
                       <span className="text-brand-primary">{d.txTier}</span>
                    </div>
                 </div>
                 <button onClick={() => onRestore(d)} className="bg-brand-card hover:bg-amber-500 text-brand-muted hover:text-white p-4 rounded-2xl border border-brand-border hover:border-amber-600 transition-all shadow-sm active:scale-95 group">
                    <PlayCircle className="w-6 h-6 transition-transform group-hover:scale-110"/>
                 </button>
              </div>
           ))}
           {drafts.length === 0 && (
             <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-[2.5rem] opacity-40">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p className="text-[10px] font-bold tracking-widest">Antrean Draft Kosong</p>
             </div>
           )}
        </div>
        
        <button onClick={onClose} className="w-full py-5 bg-brand-bg border border-brand-border text-brand-muted font-bold rounded-2xl hover:bg-brand-card transition-all tracking-widest text-xs">Tutup</button>
      </div>
    </div>
  );
}

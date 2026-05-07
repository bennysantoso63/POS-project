import React from 'react';
import { 
  XCircle, Download, CheckCircle2, 
  Printer, PlayCircle, Clock 
} from 'lucide-react';

export function ExportModal({ show, filter, onFilterChange, customRange, onCustomRangeChange, onExport, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Download className="w-6 h-6 text-emerald-500" /> Ekspor Data POS</h3>
        <div className="space-y-4 mb-8">
           <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rentang Waktu Laporan</label><select value={filter} onChange={(e) => onFilterChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"><option value="today">HARI INI</option><option value="this_month">BULAN INI</option><option value="this_year">TAHUN INI</option><option value="custom">TANGGAL KHUSUS</option></select></div>
           {filter === 'custom' && (<div className="grid grid-cols-2 gap-3"><input type="date" value={customRange.start} onChange={e => onCustomRangeChange({...customRange, start: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /><input type="date" value={customRange.end} onChange={e => onCustomRangeChange({...customRange, end: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /></div>)}
        </div>
        <div className="grid grid-cols-2 gap-3"><button onClick={onClose} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl">BATAL</button><button onClick={onExport} className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30">UNDUH .CSV</button></div>
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in duration-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-500"></div>
        
        {/* Paper Receipt Simulation */}
        <div className="bg-white text-black text-left font-mono text-[10px] p-6 border border-slate-200 shadow-inner mb-8 rounded-lg overflow-hidden relative">
           <div className="text-center mb-4 pb-4 border-b border-dashed border-slate-300">
             <h2 className="font-bold text-sm uppercase mb-1">{storeName}</h2>
             <p className="text-[9px] text-slate-500">{storeAddress}</p>
             {storePhone && <p className="text-[9px] text-slate-500">Telp: {storePhone}</p>}
           </div>

           {type === 'transaction' && (
             <>
               <div className="border-b border-dashed border-slate-300 mb-3 pb-2">
                  <div className="flex justify-between"><span>NO:</span><span>{data.id || 'TX-NEW'}</span></div>
                  <div className="flex justify-between"><span>TGL:</span><span>{data.created_at || new Date().toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>KASIR:</span><span>{data.user_name || 'Kasir'}</span></div>
               </div>
               <div className="border-b border-dashed border-slate-300 mb-3 pb-2 space-y-1">
                  {(data.items || []).map((item, idx) => (
                    <div key={idx}>
                       <div className="font-bold uppercase">{item.name}</div>
                       <div className="flex justify-between">
                          <span>{item.qty} {item.unitType || 'Pcs'} x {formatIDR(item.price || item.unit_price).replace('Rp', '')}</span>
                          <span>{formatIDR(item.qty * (item.price || item.unit_price)).replace('Rp', '')}</span>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="space-y-1">
                  <div className="flex justify-between font-bold text-xs"><span>TOTAL</span><span>{formatIDR(data.total)}</span></div>
                  <div className="flex justify-between"><span>TUNAI</span><span>{formatIDR(data.amountPaid || data.total)}</span></div>
                  <div className="flex justify-between border-t border-dashed border-slate-300 pt-1"><span>KEMBALI</span><span>{formatIDR(data.changeAmount || 0)}</span></div>
               </div>
             </>
           )}

           {type === 'po' && (
             <>
               <div className="text-center mb-2 font-black border border-black py-1 text-xs">SURAT PESANAN (PO)</div>
               <div className="border-b border-dashed border-slate-300 mb-3 pb-2 space-y-0.5">
                  <div className="flex justify-between"><span>NO PO:</span><span>{data.po_number}</span></div>
                  <div className="flex justify-between"><span>TGL:</span><span>{data.created_at}</span></div>
                  <div className="flex justify-between"><span>SUPPLIER:</span><span className="font-bold truncate w-24 text-right">{data.supplier_name}</span></div>
               </div>
               <div className="border-b border-dashed border-slate-300 mb-3 pb-2 space-y-1">
                  {(data.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                       <span className="truncate pr-2">{item.qty}x {item.name}</span>
                       <span className="shrink-0">{formatIDR(item.qty * item.cost_price).replace('Rp', '')}</span>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between font-bold text-xs"><span>TOTAL EST.</span><span>{formatIDR(data.total_cost)}</span></div>
             </>
           )}

           {type === 'shift_report' && (
             <>
               <div className="text-center mb-2 font-black border border-black py-1 text-xs">X-REPORT SHIFT</div>
               <div className="border-b border-dashed border-slate-300 mb-3 pb-2 space-y-0.5">
                  <div className="flex justify-between"><span>ID SESI:</span><span>{data.id}</span></div>
                  <div className="flex justify-between"><span>KASIR:</span><span>{data.user_name || data.user}</span></div>
                  <div className="flex justify-between"><span>BUKA:</span><span>{data.opened_at}</span></div>
                  <div className="flex justify-between"><span>TUTUP:</span><span>{data.closed_at || new Date().toLocaleString()}</span></div>
               </div>
               <div className="border-b border-dashed border-slate-300 mb-3 pb-2 space-y-1">
                  <div className="flex justify-between"><span>MODAL AWAL:</span><span>{formatIDR(data.opening_cash).replace('Rp', '')}</span></div>
                  <div className="flex justify-between font-bold"><span>EKSPEKTASI:</span><span>{formatIDR(data.expected_cash).replace('Rp', '')}</span></div>
                  <div className="flex justify-between font-bold text-blue-600"><span>FISIK LACI:</span><span>{formatIDR(data.closing_cash).replace('Rp', '')}</span></div>
               </div>
               <div className={`text-center font-black p-2 mt-2 ${data.selisih < 0 ? 'bg-black text-white' : 'bg-slate-100 text-slate-800'}`}>
                  SELISIH: {formatIDR(data.selisih)}
               </div>
             </>
           )}

             {type === 'barcode' && (
               <div className="text-center pt-2">
                 <p className="text-[10px] font-bold mb-1 truncate leading-tight uppercase">{data.name}</p>
                 <div className="border border-black h-12 mb-1 flex items-center justify-center mx-auto max-w-[200px] bg-[repeating-linear-gradient(90deg,#000,#000_3px,transparent_3px,transparent_5px,#000_5px,#000_6px,transparent_6px,transparent_10px)]">
                 </div>
                 <p className="text-[11px] font-mono font-black">{data.sku}</p>
                 <p className="text-sm font-black mt-2">{formatIDR(data.price)}</p>
               </div>
             )}

             <div className="text-center mt-6 pt-4 border-t border-dashed border-slate-300 text-[8px] text-slate-400">
               {type === 'barcode' ? 'Label Barcode Produk' : type === 'transaction' ? receiptFooter : 'Dokumen Internal POS Mandiri'}
             </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => onPrint(receipt)} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all active:scale-95"><Printer className="w-5 h-5" /> CETAK KE HARDWARE</button>
          <button onClick={onClose} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">Tutup Jendela</button>
        </div>
      </div>
    </div>
  );
}

export function DraftModal({ show, drafts, onRestore, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200">
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Clock className="w-6 h-6 text-amber-500" /> Pesanan Tertunda (Draft)</h3>
        <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2">
           {drafts.map(d => (
              <div key={d.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors group">
                 <div><div className="font-bold text-slate-800 text-sm">{d.id}</div><div className="text-[10px] text-slate-500">{d.time} • {d.cart.length} item • {d.txTier.toUpperCase()}</div></div>
                 <button onClick={() => onRestore(d)} className="bg-white group-hover:bg-amber-500 group-hover:text-white text-slate-400 p-3 rounded-xl border border-slate-200 group-hover:border-amber-600 transition-all shadow-sm"><PlayCircle className="w-5 h-5"/></button>
              </div>
           ))}
           {drafts.length === 0 && <div className="text-center py-10 text-slate-400 italic">Tidak ada draft pesanan</div>}
        </div>
        <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">TUTUP</button>
      </div>
    </div>
  );
}

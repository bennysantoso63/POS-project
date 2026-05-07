import React from 'react';
import { 
  XCircle, Save, Trash, AlertCircle, 
  UploadCloud, FileText, Download, CheckCircle2 
} from 'lucide-react';

export function ProductModal({ show, editing, form, onChange, onSave, onClose, formatIDR }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-black text-slate-800">{editing ? 'Edit Data Barang' : 'Tambah Barang Baru'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500"><XCircle className="w-6 h-6" /></button>
        </div>
        <form onSubmit={onSave} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SKU / Kode Barang</label><input type="text" value={form.sku} onChange={e => onChange({...form, sku: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500" placeholder="Contoh: BRG-001" /></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Produk</label><input type="text" required value={form.name} onChange={e => onChange({...form, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500" placeholder="Masukkan nama barang..." /></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori</label><select value={form.category} onChange={e => onChange({...form, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500"><option>Makanan</option><option>Minuman</option><option>Snack</option><option>Kebutuhan Rumah</option><option>Lainnya</option></select></div>
          </div>
          <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                 <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hrg Eceran</label><input type="text" required value={form.price_retail} onChange={e => onChange({...form, price_retail: e.target.value})} className="w-full bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 text-sm font-black text-blue-600" placeholder="0" /></div>
                 <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hrg Partai</label><input type="text" required value={form.price_wholesale} onChange={e => onChange({...form, price_wholesale: e.target.value})} className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 text-sm font-black text-indigo-600" placeholder="0" /></div>
                 <div><label className="block text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Hrg Modal (HPP)</label><input type="text" required value={form.cost_price || ''} onChange={e => onChange({...form, cost_price: e.target.value})} className="w-full bg-red-50/50 border border-red-100 rounded-xl px-4 py-3 text-sm font-black text-red-600" placeholder="0" /></div>
              </div>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stok (Pcs)</label><input type="text" required value={form.stock_pcs} onChange={e => onChange({...form, stock_pcs: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="0" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Isi per Box</label><input type="text" value={form.uom_box_multiplier} onChange={e => onChange({...form, uom_box_multiplier: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="0" /></div>
             </div>
             <div className="pt-4 flex justify-end"><button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"><Save className="w-5 h-5"/> {editing ? 'SIMPAN PERUBAHAN' : 'TAMBAHKAN PRODUK'}</button></div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomerModal({ show, editing, form, onChange, onSave, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-xl font-black text-slate-800">{editing ? 'Edit Pelanggan' : 'Daftar Pelanggan'}</h3><button onClick={onClose} className="text-slate-400 hover:text-red-500"><XCircle className="w-6 h-6" /></button></div>
        <form onSubmit={onSave} className="p-8 space-y-5">
           <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label><input type="text" required value={form.name} onChange={e => onChange({...form, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" /></div>
           <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Telepon / WA</label><input type="text" required value={form.phone} onChange={e => onChange({...form, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" /></div>
           <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tier Harga Default</label><select value={form.default_tier} onChange={e => onChange({...form, default_tier: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"><option value="eceran">ECERAN</option><option value="partai">PARTAI (GROSIR)</option></select></div>
           <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-xl transition-all">SIMPAN DATA PELANGGAN</button>
        </form>
      </div>
    </div>
  );
}

export function ConfirmModal({ show, title, message, onConfirm, onCancel, type = 'danger' }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in duration-200 text-center">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}><AlertCircle className="w-8 h-8" /></div>
        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-8">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">BATAL</button>
          <button onClick={onConfirm} className={`py-3 text-white font-bold rounded-xl transition-all ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>YA, LANJUTKAN</button>
        </div>
      </div>
    </div>
  );
}

export function SyncModal({ show, onSync, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 mx-auto rounded-2xl flex items-center justify-center mb-6"><UploadCloud className="w-8 h-8" /></div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Sinkronisasi Data Produk</h3>
        <p className="text-slate-500 text-sm mb-8">Pilih file CSV hasil ekspor dari server pusat untuk memperbarui katalog barang dan harga.</p>
        <label className="block w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all mb-4">
          <input type="file" accept=".csv" onChange={onSync} className="hidden" />
          <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-blue-600"><FileText className="w-8 h-8 mb-1"/><span className="text-xs font-bold uppercase tracking-widest">Pilih File .CSV</span></div>
        </label>
        <button onClick={onClose} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600">BATAL</button>
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose, maxWidth = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-[2rem] w-full ${maxWidth} shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden`}>
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-black text-slate-800 text-lg tracking-tight">{title}</h3>
          {onClose && (
            <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
              <XCircle className="w-5 h-5"/>
            </button>
          )}
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

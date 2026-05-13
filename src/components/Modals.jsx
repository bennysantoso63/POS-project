import React from 'react';
import { 
  XCircle, Save, Trash, AlertCircle, 
  UploadCloud, FileText, Download, CheckCircle2,
  Box, User, ShieldAlert, Database, Plus, X, Filter, ChevronRight
} from 'lucide-react';
import CustomDropdown from './ui/CustomDropdown';

export function ProductModal({ show, editing, form, onChange, onSave, onClose, formatIDR }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-brand-card rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-brand-border">
        
        {/* MODAL HEADER */}
        <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                <Box className="w-6 h-6" />
             </div>
             <div>
               <h3 className="text-xl font-black text-brand-text tracking-tight">{editing ? 'Edit Master Produk' : 'Registrasi Produk Baru'}</h3>
               <p className="text-[10px] font-bold text-brand-muted tracking-widest mt-0.5">Database Inventory Ling-Ling</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-brand-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all group">
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={onSave} className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-2.5 ml-1">SKU / Kode Barang</label>
              <input type="text" value={form.sku} onChange={e => onChange({...form, sku: e.target.value})} className="w-full bg-brand-bg border border-brand-border rounded-2xl px-5 py-4 text-sm font-bold text-brand-text focus:border-brand-primary outline-none transition-all shadow-inner" placeholder="Pindai atau ketik SKU..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-2.5 ml-1">Nama Produk Utama</label>
              <input type="text" required value={form.name} onChange={e => onChange({...form, name: e.target.value})} className="w-full bg-brand-bg border border-brand-border rounded-2xl px-5 py-4 text-sm font-bold text-brand-text focus:border-brand-primary outline-none transition-all shadow-inner" placeholder="Masukkan nama barang..." />
            </div>
            <div className="relative z-50">
              <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-2.5 ml-1">Klasifikasi Kategori</label>
              <CustomDropdown 
                value={form.category} 
                onChange={val => onChange({...form, category: val})} 
                options={['Makanan', 'Minuman', 'Snack', 'Kebutuhan Rumah', 'Lainnya']} 
                label="Kategori"
                icon={<Filter className="w-4 h-4" />}
              />
            </div>
          </div>

          <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                 <div className="bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10 relative">
                    <label className="block text-[9px] font-bold text-brand-primary tracking-widest mb-2 ml-1">Harga Jual (Retail)</label>
                    <div className="flex items-center gap-3">
                       <span className="text-brand-primary font-black text-xs opacity-40">Rp</span>
                       <input 
                         type="text" 
                         required 
                         value={form.price_retail} 
                         onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            onChange({...form, price_retail: val ? parseInt(val).toLocaleString('id-ID') : ''});
                         }} 
                         className="w-full bg-transparent text-xl font-bold text-brand-primary outline-none tabular-nums" 
                         placeholder="0" 
                       />
                    </div>
                 </div>
                 <div className="bg-brand-secondary/5 p-4 rounded-2xl border border-brand-secondary/10 relative">
                    <label className="block text-[9px] font-bold text-brand-secondary tracking-widest mb-2 ml-1">Harga Jual (Grosir)</label>
                    <div className="flex items-center gap-3">
                       <span className="text-brand-secondary font-black text-xs opacity-40">Rp</span>
                       <input 
                         type="text" 
                         required 
                         value={form.price_wholesale} 
                         onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            onChange({...form, price_wholesale: val ? parseInt(val).toLocaleString('id-ID') : ''});
                         }} 
                         className="w-full bg-transparent text-xl font-bold text-brand-secondary outline-none tabular-nums" 
                         placeholder="0" 
                       />
                    </div>
                 </div>
                 <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 relative">
                    <label className="block text-[9px] font-bold text-rose-500 tracking-widest mb-2 ml-1">HPP (Modal Dasar)</label>
                    <div className="flex items-center gap-3">
                       <span className="text-rose-500 font-black text-xs opacity-40">Rp</span>
                       <input 
                         type="text" 
                         required 
                         value={form.cost_price || ''} 
                         onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            onChange({...form, cost_price: val ? parseInt(val).toLocaleString('id-ID') : ''});
                         }} 
                         className="w-full bg-transparent text-xl font-bold text-rose-500 outline-none tabular-nums" 
                         placeholder="0" 
                       />
                    </div>
                 </div>
              </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-2 ml-1">Stok (Pcs)</label>
                  <input type="text" required value={form.stock_pcs} onChange={e => onChange({...form, stock_pcs: e.target.value})} className="w-full bg-brand-bg border border-brand-border rounded-xl px-5 py-4 text-sm font-bold text-brand-text outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-2 ml-1">Multiplier Box</label>
                  <input type="text" value={form.uom_box_multiplier} onChange={e => onChange({...form, uom_box_multiplier: e.target.value})} className="w-full bg-brand-bg border border-brand-border rounded-xl px-5 py-4 text-sm font-bold text-brand-text outline-none" placeholder="0" />
                </div>
             </div>
          </div>
          
          <div className="md:col-span-2 pt-4 border-t border-brand-border mt-4 flex justify-end">
            <button type="submit" className="w-full md:w-auto px-12 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-5 rounded-2xl shadow-2xl shadow-brand-primary/30 transition-all flex items-center justify-center gap-3 tracking-widest text-xs active:scale-95">
              <Save className="w-5 h-5"/> {editing ? 'Update Database' : 'Daftarkan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomerModal({ show, editing, form, onChange, onSave, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-brand-card rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-brand-border">
        <div className="p-10 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                 <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-brand-text tracking-tight">{editing ? 'Edit CRM' : 'Pelanggan Baru'}</h3>
           </div>
           <button onClick={onClose} className="p-2 text-brand-muted hover:text-rose-500 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={onSave} className="p-10 space-y-8">
           <div>
             <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-3 ml-1">Identitas Lengkap</label>
             <input type="text" required value={form.name} onChange={e => onChange({...form, name: e.target.value})} className="w-full bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-sm font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-inner" placeholder="Nama Pelanggan..." />
           </div>
           <div>
             <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-3 ml-1">Kontak WhatsApp</label>
             <input type="text" required value={form.phone} onChange={e => onChange({...form, phone: e.target.value})} className="w-full bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-sm font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-inner" placeholder="08xxxx..." />
           </div>
           <div className="relative z-50">
             <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-3 ml-1">Kategori Pelanggan</label>
             <CustomDropdown 
               value={form.default_tier} 
               onChange={val => onChange({...form, default_tier: val})} 
               options={[
                 { value: 'eceran', label: 'Eceran (Retail)' },
                 { value: 'partai', label: 'Partai (Wholesale)' }
               ]} 
               label="Tier Pelanggan"
               icon={<ChevronRight className="w-4 h-4" />}
             />
           </div>
           <button type="submit" className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-6 rounded-[2rem] shadow-2xl shadow-brand-primary/30 transition-all tracking-widest text-xs active:scale-95">Simpan Data CRM</button>
        </form>
      </div>
    </div>
  );
}

export function ConfirmModal({ show, title, message, onConfirm, onCancel, type = 'danger' }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-brand-card rounded-[3rem] shadow-2xl w-full max-w-sm p-10 animate-in zoom-in-95 duration-300 text-center border border-brand-border relative overflow-hidden">
        {/* Dekorasi Latar */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${type === 'danger' ? 'bg-rose-500' : 'bg-brand-primary'}`} />
        
        <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl ${type === 'danger' ? 'bg-rose-500/10 text-rose-500 shadow-rose-500/20' : 'bg-brand-primary/10 text-brand-primary shadow-brand-primary/20'}`}>
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-brand-text mb-4 tracking-tight">{title}</h3>
        <p className="text-brand-muted text-xs font-bold leading-relaxed mb-10 px-4">{message}</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className={`w-full py-5 text-white font-bold rounded-2xl transition-all shadow-xl tracking-widest text-[10px] active:scale-95 ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' : 'bg-brand-primary hover:bg-brand-secondary shadow-brand-primary/30'}`}>Konfirmasi Tindakan</button>
          <button onClick={onCancel} className="w-full py-5 bg-brand-bg border border-brand-border text-brand-muted font-bold rounded-2xl hover:bg-brand-card transition-all tracking-widest text-[10px]">Batalkan</button>
        </div>
      </div>
    </div>
  );
}

export function SyncModal({ show, onSync, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-brand-card rounded-[3rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-300 text-center border border-brand-border">
        <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary mx-auto rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-brand-primary/10">
          <Database className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-brand-text mb-4 tracking-tight">Impor Database Master</h3>
        <p className="text-brand-muted text-xs font-bold mb-10 leading-relaxed px-2">Unggah file CSV manifest untuk memperbarui seluruh katalog barang, harga, dan SKU secara massal.</p>
        
        <label className="block w-full py-10 bg-brand-bg border-4 border-dashed border-brand-border rounded-[2.5rem] cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all mb-8 group">
          <input type="file" accept=".csv" onChange={onSync} className="hidden" />
          <div className="flex flex-col items-center gap-4">
             <div className="p-4 bg-brand-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-brand-primary"/>
             </div>
             <span className="text-[10px] font-bold tracking-widest text-brand-muted group-hover:text-brand-primary transition-colors">Klik untuk Pilih .CSV</span>
          </div>
        </label>
        
        <button onClick={onClose} className="w-full py-5 bg-brand-bg border border-brand-border text-brand-muted font-bold rounded-2xl hover:text-rose-500 transition-all tracking-widest text-[10px]">Batal</button>
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose, maxWidth = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className={`bg-brand-card rounded-[3rem] w-full ${maxWidth} shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-brand-border`}>
        <div className="px-10 py-8 border-b border-brand-border flex justify-between items-center bg-brand-bg/50 shrink-0">
          <h3 className="font-black text-brand-text text-xl tracking-tight">{title}</h3>
          {onClose && (
            <button type="button" onClick={onClose} className="p-3 text-brand-muted hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-all">
              <X className="w-6 h-6"/>
            </button>
          )}
        </div>
        <div className="p-10 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}

import React from 'react';
import { Settings, Save, Store, MapPin, Phone, Zap, Tag, UploadCloud, RefreshCcw, Info } from 'lucide-react';

export default function SettingsView({ 
  config, 
  onConfigChange, 
  onSave 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(e);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-y-auto">
      <header className="px-6 py-5 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2"><Settings className="w-6 h-6 text-slate-600"/> Pengaturan Sistem</h1>
        <p className="text-[10px] text-slate-500 font-bold mt-0.5">Konfigurasi Identitas Toko dan Tampilan Struk Cetak</p>
      </header>

      <div className="p-6 max-w-3xl mx-auto w-full animate-in slide-in-from-bottom-4">
         <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
               <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2 mb-4">Informasi Utama Toko</h3>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-600 mb-1.5">Nama Toko *</label>
                     <input required value={config.name} onChange={e=>onConfigChange({...config, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-blue-500 outline-none transition-colors" placeholder="Cth: Toko Sinar Jaya"/>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-600 mb-1.5">Nomor Telepon / WhatsApp</label>
                     <input value={config.phone} onChange={e=>onConfigChange({...config, phone: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-blue-500 outline-none transition-colors" placeholder="Cth: 0812-3456-7890"/>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-600 mb-1.5">Alamat Lengkap</label>
                     <textarea rows="3" value={config.address} onChange={e=>onConfigChange({...config, address: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-blue-500 outline-none resize-none transition-colors" placeholder="Cth: Jl. Raya Kedung Baruk No. 12, Surabaya"/>
                  </div>
               </div>

               <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2 pt-4 mb-4">Pengaturan Cetak Struk</h3>
               
               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Pesan Footer Struk</label>
                  <textarea rows="2" value={config.receiptFooter} onChange={e=>onConfigChange({...config, receiptFooter: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-blue-500 outline-none resize-none transition-colors" placeholder="Cth: Terima Kasih Atas Kunjungan Anda."/>
                  <p className="text-[10px] text-slate-400 mt-1">Pesan ini akan muncul di bagian paling bawah pada struk transaksi kasir.</p>
               </div>

               <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2 pt-4 mb-4 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-amber-500 fill-current"/> Konfigurasi Fiskal UMKM
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-600 mb-1.5">Tipe Badan Usaha</label>
                     <select value={config.tax_type || 'OP'} onChange={e=>onConfigChange({...config, tax_type: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-blue-500 outline-none appearance-none cursor-pointer transition-colors">
                        <option value="OP">Orang Pribadi (Individual)</option>
                        <option value="CV">CV (Persekutuan Komanditer)</option>
                        <option value="PT">PT (Perseroan Terbatas)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-600 mb-1.5">Tahun Pertama PPh 0.5%</label>
                     <input type="number" value={config.tax_start_year || new Date().getFullYear()} onChange={e=>onConfigChange({...config, tax_start_year: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-blue-500 outline-none transition-colors" placeholder="Cth: 2024"/>
                  </div>
               </div>
               <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    Sesuai PP 55/2022, durasi tarif 0.5% berbeda tiap tipe: <strong>OP (7 Thn)</strong>, <strong>CV (4 Thn)</strong>, <strong>PT (3 Thn)</strong>. 
                    Sistem akan melacak masa berlaku ini secara otomatis di menu Akuntansi.
                  </p>
               </div>
            </div>

            {/* SPRINT 12: Cloud Sync Integration */}
            <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 border-t border-slate-100">
               <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                 <UploadCloud className="w-5 h-5 text-blue-500"/> Sinkronisasi Cloud (Mandiri Sync)
               </h3>
               <p className="text-xs text-slate-500 font-medium leading-relaxed">
                 Hubungkan database lokal Anda dengan server pusat untuk cadangan data otomatis dan sinkronisasi stok antar cabang.
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => window.api.syncCloud({ direction: 'push' }).then(() => alert('Push Data Berhasil!'))}
                    className="flex items-center justify-center gap-3 p-4 bg-white border-2 border-blue-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                     <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5"/>
                     </div>
                     <div className="text-left">
                        <p className="text-[10px] font-black text-blue-600 uppercase">Push ke Cloud</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Kirim data lokal ke server</p>
                     </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => window.api.syncCloud({ direction: 'pull' }).then(() => alert('Pull Data Berhasil!'))}
                    className="flex items-center justify-center gap-3 p-4 bg-white border-2 border-emerald-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                     <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <RefreshCcw className="w-5 h-5"/>
                     </div>
                     <div className="text-left">
                        <p className="text-[10px] font-black text-emerald-600 uppercase">Pull dari Cloud</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Ambil update data terbaru</p>
                     </div>
                  </button>
               </div>
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
               <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-2">
                  <Save className="w-5 h-5"/> SIMPAN PERUBAHAN
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}

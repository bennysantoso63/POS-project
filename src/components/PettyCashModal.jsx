import React, { useState } from 'react';
import { Wallet, X, AlertCircle, Save, ArrowDownCircle, ChevronRight } from 'lucide-react';
import CustomDropdown from './ui/CustomDropdown';

export default function PettyCashModal({ show, onSubmit, onClose }) {
  const [pcAmount, setPcAmount] = useState('');
  const [pcDesc, setPcDesc] = useState('');
  const [pcCategory, setPcCategory] = useState('OPEX');

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-brand-card rounded-[2.5rem] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.1)] border border-brand-border flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-brand-border flex justify-between items-center bg-brand-bg/30 rounded-t-[2.5rem]">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center">
                <ArrowDownCircle className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-bold text-brand-text tracking-tight text-lg">Kas Keluar</h3>
                <p className="text-[9px] font-bold text-brand-muted tracking-widest mt-0.5">Petty Cash Management</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-xl text-brand-muted hover:text-rose-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            const amount = parseInt(pcAmount.replace(/\D/g,'') || '0', 10);
            onSubmit({ amount, description: pcDesc, category: pcCategory });
            setPcAmount('');
            setPcDesc('');
            setPcCategory('OPEX');
          }}>
            <div className="flex items-start gap-4 p-4 bg-brand-bg rounded-2xl border border-brand-border mb-8">
               <AlertCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold text-brand-muted leading-relaxed tracking-widest">
                 Catat pengeluaran uang laci. Saldo sistem akan otomatis dikurangi untuk menghindari selisih saat eod.
               </p>
            </div>

            <div className="space-y-6 mb-10">
              <div className="group">
                <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-2 ml-1 group-focus-within:text-brand-primary transition-colors">Nominal Keluar (IDR) *</label>
                <div className="relative">
                   <input 
                     autoFocus 
                     required 
                     type="text" 
                     value={pcAmount} 
                     onChange={(e) => setPcAmount(e.target.value.replace(/\D/g, '') ? parseInt(e.target.value.replace(/\D/g, '')).toLocaleString('id-ID') : '')} 
                     className="w-full bg-brand-bg border border-brand-border rounded-2xl py-5 px-6 text-right font-black text-brand-text text-xl focus:border-brand-primary outline-none transition-all shadow-inner placeholder:opacity-20" 
                     placeholder="0" 
                   />
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-muted font-bold text-sm opacity-40">Rp</span>
                </div>
              </div>

              <div className="relative z-50">
                <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-2 ml-1">Kategori Alokasi *</label>
                <CustomDropdown 
                  value={pcCategory} 
                  onChange={setPcCategory} 
                  options={[
                    { value: 'OPEX', label: 'Operasional (Gaji, Listrik, Sampah)' },
                    { value: 'PRIVE', label: 'Prive (Keuntungan Pribadi)' },
                    { value: 'NON_DEDUCTIBLE', label: 'Lainnya (Sumbangan / Non-Pajak)' }
                  ]} 
                  label="Pilih Alokasi"
                  icon={<ChevronRight className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-2 ml-1">Keterangan / Tujuan *</label>
                <input 
                  required 
                  type="text" 
                  value={pcDesc} 
                  onChange={(e) => setPcDesc(e.target.value)} 
                  className="w-full bg-brand-bg border border-brand-border rounded-2xl py-4 px-6 text-xs font-bold text-brand-text focus:border-brand-primary outline-none transition-all shadow-inner placeholder:text-brand-muted/30" 
                  placeholder="Cth: Bayar tagihan internet" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-5 bg-brand-primary text-white font-bold text-xs rounded-2xl hover:bg-brand-secondary shadow-xl shadow-brand-primary/30 transition-all active:scale-95 tracking-widest flex items-center justify-center gap-3"
            >
              <Save size={16} /> Simpan Pencatatan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

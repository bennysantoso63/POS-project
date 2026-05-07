import React, { useState } from 'react';

export default function PettyCashModal({ show, onSubmit, onClose }) {
  const [pcAmount, setPcAmount] = useState('');
  const [pcDesc, setPcDesc] = useState('');
  const [pcCategory, setPcCategory] = useState('OPEX');

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
          <h3 className="font-bold text-slate-800 text-lg">Pengeluaran Kasir (Kas Kecil)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500">×</button>
        </div>
        <div className="p-6">
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            const amount = parseInt(pcAmount.replace(/\D/g,'') || '0', 10);
            onSubmit({ amount, description: pcDesc, category: pcCategory });
            setPcAmount('');
            setPcDesc('');
            setPcCategory('OPEX');
          }}>
            <p className="text-sm text-slate-500 mb-4">Catat pengeluaran uang laci. Uang laci sistem akan otomatis dikurangi agar tidak selisih saat EOD.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nominal Kas Keluar (Rp) *</label>
                <input autoFocus required type="text" value={pcAmount} onChange={(e) => setPcAmount(e.target.value.replace(/\D/g, '') ? parseInt(e.target.value.replace(/\D/g, '')).toLocaleString('id-ID') : '')} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-right font-black text-slate-800 focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kategori Pajak (Penting!) *</label>
                <select value={pcCategory} onChange={e=>setPcCategory(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm">
                   <option value="OPEX">Biaya Operasional Toko (Gaji, Listrik, dll)</option>
                   <option value="PRIVE">Prive (Ambil Keuntungan Pribadi)</option>
                   <option value="NON_DEDUCTIBLE">Sumbangan / Biaya Lain (Non-Deductible)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Keterangan / Tujuan *</label>
                <input required type="text" value={pcDesc} onChange={(e) => setPcDesc(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="Cth: Bayar uang sampah" />
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-slate-800 text-white font-black text-lg rounded-xl hover:bg-slate-900 shadow-md transition-transform active:scale-95">CATAT PENGELUARAN</button>
          </form>
        </div>
      </div>
    </div>
  );
}

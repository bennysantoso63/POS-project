import React, { useState } from 'react';
import { Wifi, Server, Lock, Loader2 } from 'lucide-react';

export default function SessionOverlay({ 
  currentUser, 
  onLogin, 
  activeSession, 
  showOpenShiftModal, 
  onOpenShift, 
  showCloseShiftModal, 
  onCloseShift,
  isLoading,
  storeConfig
}) {
  const [loginPin, setLoginPin] = useState('');
  const [shiftInputCash, setShiftInputCash] = useState('');

  const formatIDR = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-[100] flex bg-slate-950 items-center justify-center selection:bg-blue-100">
        <div className="absolute top-6 left-6 flex items-center text-emerald-400 text-xs font-bold bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800"><Wifi className="w-3 h-3 mr-2 animate-pulse" /> Terhubung ke Jaringan Lokal</div>
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col items-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner"><Server className="w-8 h-8"/></div>
          <h1 className="text-2xl font-black text-slate-800 mb-1">POS Jaringan</h1>
          <p className="text-sm text-slate-500 mb-8 text-center">Akses Server: {storeConfig.serverIp}</p>
          <form onSubmit={(e) => { e.preventDefault(); onLogin(loginPin); setLoginPin(''); }} className="w-full">
            <input type="password" autoFocus required value={loginPin} onChange={e => setLoginPin(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-black focus:outline-none focus:border-blue-500 mb-6" placeholder="••••" maxLength="4" />
            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all">MASUK SISTEM</button>
            <p className="text-center text-[10px] text-slate-400 mt-4">Admin: admin/admin123 | Kasir: kasir1/1111</p>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="font-bold tracking-widest animate-pulse">SINKRONISASI DATABASE...</p>
      </div>
    );
  }

  return (
    <>
      {showOpenShiftModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Wifi className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Buka Shift Laci</h2>
            <p className="text-slate-500 text-sm mb-8">Masukkan jumlah modal uang tunai yang ada di laci saat ini.</p>
            <form onSubmit={(e) => { e.preventDefault(); onOpenShift(shiftInputCash); setShiftInputCash(''); }}>
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Modal Tunai Awal (IDR)</label>
                <input type="text" autoFocus required value={shiftInputCash} onChange={e => setShiftInputCash(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 text-2xl font-black text-slate-800 focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all">BUKA KASIR SEKARANG</button>
            </form>
          </div>
        </div>
      )}

      {showCloseShiftModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6"><Lock className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Tutup Shift & Laci</h2>
            <p className="text-slate-500 text-sm mb-8">Hitung uang fisik di laci dan masukkan di bawah ini untuk audit.</p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
              <div className="flex justify-between text-xs mb-1"><span>Ekspektasi Sistem:</span><span className="font-bold">{formatIDR(activeSession?.expected_cash || 0)}</span></div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onCloseShift(shiftInputCash); setShiftInputCash(''); }}>
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Uang Fisik di Laci (IDR)</label>
                <input type="text" autoFocus required value={shiftInputCash} onChange={e => setShiftInputCash(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-4 text-2xl font-black text-slate-800 focus:outline-none focus:border-amber-500" placeholder="0" />
              </div>
              <button type="submit" className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-lg shadow-amber-500/30 transition-all">HITUNG & TUTUP SHIFT</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

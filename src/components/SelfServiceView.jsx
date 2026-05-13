import React, { useState, useEffect, useRef } from 'react';
import { Camera, ShoppingCart, Sparkles, AlertCircle, CheckCircle2, ChevronRight, ScanLine } from 'lucide-react';

export default function SelfServiceView({ 
  onCheckout = (total) => console.log("Checkout:", total),
  onBack = () => console.log("Back to main")
}) {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lingLingMessage, setLingLingMessage] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const inputRef = useRef(null);

  // Simulasi In-Memory Database SQLite (Disesuaikan untuk demo)
  const localDB = [
    { barcode: '8991234567890', name: 'Dupa Cendana Premium', price: 25000, stock: 50 },
    { barcode: '8991234500045', name: 'Lilin Teratai Merah', price: 40000, stock: 8 },
    { barcode: '8999876543210', name: 'Kertas Kimcoa Emas', price: 15000, stock: 120 }
  ];

  // Fokuskan input selalu ke hidden field untuk menangkap ketikan scanner
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [cart, lingLingMessage]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleProcessBarcode = (scannedCode) => {
    setLingLingMessage(null);
    
    // Logika Deterministik 1: Pencarian Tepat (Exact Match)
    const exactMatch = localDB.find(p => p.barcode === scannedCode);
    if (exactMatch) {
      addToCart(exactMatch);
      setBarcodeInput('');
      return;
    }

    // Logika Deterministik 2: Ling-Ling AI Apriori Fallback (Barcode Rusak)
    if (scannedCode.length > 3) {
      const partialMatches = localDB.filter(p => p.barcode.endsWith(scannedCode.slice(-3)) || p.barcode.startsWith(scannedCode.slice(0, 3)));
      
      if (partialMatches.length > 0) {
        setLingLingMessage({
          type: 'suggestion',
          text: `Pemindaian terputus ("${scannedCode}"). Berdasarkan histori, apakah ini ${partialMatches[0].name}?`,
          suggestion: partialMatches[0]
        });
        return;
      }
    }

    setLingLingMessage({
      type: 'error',
      text: `Barcode ${scannedCode} tidak ditemukan di gudang data lokal. Mohon periksa kembali.`
    });
    setBarcodeInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (barcodeInput.trim() !== '') {
        handleProcessBarcode(barcodeInput);
      }
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.barcode === product.barcode);
      if (existing) {
        return prev.map(item => item.barcode === product.barcode ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    
    // Notifikasi Burn-Rate Lembut dari Ling-Ling
    if (product.stock <= 10) {
      setLingLingMessage({
        type: 'warning',
        text: `Stok ${product.name} tersisa ${product.stock} unit. Mendekati batas aman untuk minggu ini.`
      });
    }
  };

  const acceptLingLingSuggestion = () => {
    if (lingLingMessage?.suggestion) {
      addToCart(lingLingMessage.suggestion);
      setLingLingMessage(null);
      setBarcodeInput('');
    }
  };

  const totalBelanja = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans selection:bg-blue-500/30 transition-colors">
      
      {/* Kolom Kiri: Scanner Hub (60%) */}
      <div className="w-[60%] border-r border-slate-800 p-8 flex flex-col relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-light text-white tracking-wide">POS <span className="font-semibold text-blue-500">Mandiri</span></h1>
            <p className="text-slate-500 text-sm mt-1">Edge Vision Scanner • Offline Mode</p>
          </div>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-all text-xs uppercase font-black tracking-widest">
              Keluar
            </button>
            <div className={`px-4 py-2 rounded-full border ${isScanning ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-400'} flex items-center gap-2 text-sm`}>
              <ScanLine size={16} className={isScanning ? "animate-pulse" : ""} />
              {isScanning ? 'Kamera Aktif' : 'Kamera Siaga'}
            </div>
          </div>
        </div>

        {/* Input Tersembunyi untuk Scanner Fisik */}
        <input 
          ref={inputRef}
          type="text" 
          className="absolute opacity-0 top-0 left-0" 
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        {/* Area Viewport Kamera (Simulasi UI) */}
        <div className="flex-1 bg-slate-800 rounded-3xl border border-slate-800 flex items-center justify-center relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent z-10" />
          
          {/* Region of Interest (ROI) Reticle */}
          <div className="w-80 h-40 border-2 border-blue-500/30 rounded-[2rem] relative z-20 flex items-center justify-center bg-white/5 backdrop-blur-[2px]">
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl" />
            <div className="w-full h-[2px] bg-red-500/60 animate-scan-line shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
          </div>

          <p className="absolute bottom-8 text-blue-500 text-xs font-black uppercase tracking-[0.3em] z-20 animate-pulse">Scanning Enabled</p>
        </div>

        {/* Input Manual Fallback */}
        <div className="mt-8">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Input Manual / Hasil Scan Terakhir</label>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={barcodeInput}
              readOnly
              placeholder="Menunggu input scanner..." 
              className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-6 py-5 text-white font-mono text-xl shadow-inner focus:outline-none focus:border-blue-500 transition-all"
            />
            <button 
              onClick={() => handleProcessBarcode(barcodeInput)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/10"
            >
              Proses
            </button>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Keranjang & Ling-Ling Nudge (40%) */}
      <div className="w-[40%] bg-slate-900 flex flex-col relative">
        
        {/* Ling-Ling AI Dynamic Nudge */}
        <div className="h-48 border-b border-slate-800 p-8 flex items-center justify-center">
          {lingLingMessage ? (
            <div className={`w-full p-6 rounded-[2rem] flex items-start gap-5 border animate-in slide-in-from-top-4 duration-500 ${
              lingLingMessage.type === 'suggestion' ? 'bg-blue-500/5 border-blue-500/20' :
              lingLingMessage.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
              'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="p-3 bg-white/5 rounded-2xl">
                {lingLingMessage.type === 'suggestion' && <Sparkles size={24} className="text-blue-500" />}
                {lingLingMessage.type === 'warning' && <AlertCircle size={24} className="text-amber-500" />}
                {lingLingMessage.type === 'error' && <AlertCircle size={24} className="text-red-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-100 leading-relaxed">{lingLingMessage.text}</p>
                {lingLingMessage.type === 'suggestion' && (
                  <div className="mt-4 flex gap-3">
                    <button onClick={acceptLingLingSuggestion} className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-blue-500 transition-all active:scale-95">
                      Ya, Masukkan
                    </button>
                    <button onClick={() => { setLingLingMessage(null); setBarcodeInput(''); }} className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all">
                      Abaikan
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center opacity-40">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ling-Ling AI Siap Membantu</p>
            </div>
          )}
        </div>

        {/* Daftar Keranjang */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6">
              <ShoppingCart size={80} strokeWidth={1} className="opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">Keranjang Kosong</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={index} className="bg-slate-800/50 p-5 rounded-[1.5rem] flex justify-between items-center border border-slate-800/50 hover:border-slate-700 transition-all animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-black text-blue-500">
                    {item.qty}x
                  </div>
                  <div>
                    <p className="font-bold text-slate-100 text-sm uppercase tracking-tight">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{item.barcode}</p>
                  </div>
                </div>
                <p className="font-black text-white text-lg tracking-tighter">{formatRupiah(item.price * item.qty)}</p>
              </div>
            ))
          )}
        </div>

        {/* Panel Total & Pembayaran */}
        <div className="bg-slate-800 border-t border-slate-800 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-8">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Tagihan</p>
            <h2 className="text-4xl font-black text-blue-500 tracking-tighter">{formatRupiah(totalBelanja)}</h2>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => onCheckout(totalBelanja)}
            className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all text-sm ${
              cart.length > 0 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/20 active:scale-95' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            BAYAR SEKARANG <ChevronRight size={20} />
          </button>
        </div>

      </div>

      <style jsx>{`
        @keyframes scan-line {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        .animate-scan-line {
          position: absolute;
          width: 100%;
          animation: scan-line 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingCart, History as HistoryIcon, Users, Truck, BrainCircuit, 
  Settings as SettingsIcon, Moon, Sun, User, LogOut, ShieldAlert,
  Search, Package, Receipt, Banknote, CreditCard, Send, Lock, Flame, 
  Store, Plus, Minus, ChevronRight, AlertCircle, XCircle, PackagePlus,
  TrendingUp, ArrowUpRight, ArrowDownRight, Trash2, Printer, MessageSquare,
  UserCheck
} from 'lucide-react';

const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

/**
 * [MASTER BLUEPRINT] POS MANDIRI ENTERPRISE - MEGA INTEGRATION
 * Deskripsi: Versi terintegrasi penuh dari POS, Analytics, dan Ling-Ling AI.
 * Lokasi: src/prototypes/App_Mega_Integrated.jsx
 */

// ==========================================
// 1. KECERDASAN BUATAN LOKAL (ZERO-API LLM)
// ==========================================
const LocalLingLingEngine = {
  process: (text, db, rfmData, aprioriData, burnRateData) => {
    const query = text.toLowerCase();
    
    if (query.includes('kasbon') || query.includes('hutang') || query.includes('piutang')) {
      if (query.includes('vihara')) {
        const vihara = db.customers.find(c => c.name.toLowerCase().includes('vihara'));
        if (vihara && vihara.sisaUtang > 0) return `Sisa kasbon ${vihara.name} saat ini Rp ${formatRp(vihara.sisaUtang)}. Ini sudah mendekati hari perayaan, Bos, mungkin bisa ditagih halus.`;
        return "Vihara Dharma Metta tidak memiliki tunggakan aktif saat ini, Bos. Lunas!";
      }
      const totalKasbon = db.customers.reduce((sum, c) => sum + (c.sisaUtang || 0), 0);
      return `Total uang kita yang di luar (Kasbon) adalah Rp ${formatRp(totalKasbon)}. Ada ${db.customers.filter(c => c.sisaUtang > 0).length} donatur yang belum lunas.`;
    }

    if (query.includes('donatur') || query.includes('vip') || query.includes('paling banyak')) {
      const topCustomer = rfmData[0];
      if (!topCustomer) return "Belum ada data donatur yang cukup, Bos.";
      return `Donatur terbesar kita saat ini adalah ${topCustomer.name} dengan total belanja Rp ${formatRp(topCustomer.totalSpent)} (${topCustomer.badge}). Jangan lupa kasih diskon khusus kalau beliau datang!`;
    }

    if (query.includes('promo') || query.includes('bundling') || query.includes('saran')) {
      if (aprioriData.length === 0) return "Sistem masih mengumpulkan data struk untuk membuat saran promo yang akurat, Bos.";
      const bestRule = aprioriData[0];
      return `Berdasarkan algoritma Apriori saya dari data struk, ${Math.round(bestRule.confidence)}% umat yang beli ${bestRule.primary} pasti beli ${bestRule.secondary}. Saran saya: Buat paket bundling untuk kedua barang ini!`;
    }

    if (query.includes('habis') || query.includes('kritis') || query.includes('stok')) {
      if (burnRateData.length === 0) return "Stok barang harian (Dupa/Minyak) masih sangat aman, Bos. Belum ada yang kritis.";
      const names = burnRateData.map(b => `${b.name} (sisa ${b.daysLeft} hari)`).join(', ');
      return `Awas Bos! Prediksi saya barang ini akan habis dalam waktu dekat: ${names}. Segera hubungi supplier untuk kulakan.`;
    }

    if (query.includes('omzet') || query.includes('pendapatan') || query.includes('uang')) {
      const totalOmzet = db.transactions.reduce((sum, tx) => sum + tx.total, 0);
      return `Total omzet kotor dari ${db.transactions.length} transaksi adalah Rp ${formatRp(totalOmzet)}. Ingat, ini belum dikurangi HPP (Modal) ya, Bos.`;
    }

    return "Maaf Bos, Ling-Ling kurang tanggap. Coba tanya soal 'kasbon vihara', 'siapa donatur terbesar', 'saran promo', 'stok kritis', atau 'omzet'.";
  }
};

// ==========================================
// 2. MODUL KASIR (POS VIEW)
// ==========================================
const PosCashier = ({ db, aprioriRules, showToast }) => {
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  const selectedCustomer = db.customers.find(c => c.id === parseInt(selectedCustomerId));

  const lunarInsight = useMemo(() => {
    if (!selectedCustomer) return null;
    return `Lusa sudah Cap Go (Tgl 15 Lunar)! ${selectedCustomer.name} bulan lalu rutin beli Lilin. Tawarkan sekarang sekalian agar tidak bolak-balik.`;
  }, [selectedCustomer]);

  const aprioriSuggestion = useMemo(() => {
    if (cart.length === 0 || aprioriRules.length === 0) return null;
    const lastItem = cart[cart.length - 1].name;
    const rule = aprioriRules.find(r => r.primary === lastItem);
    if (rule) return `💡 Insight: ${Math.round(rule.confidence)}% umat yang beli ${lastItem} juga butuh ${rule.secondary}. Tawarkan sekarang!`;
    return null;
  }, [cart, aprioriRules]);

  const handleAddToCart = (p) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === p.id);
      if (exist) return prev.map(i => i.id === p.id ? {...i, qty: i.qty + 1} : i);
      return [...prev, {...p, qty: 1}];
    });
  };

  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-300">
      <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto custom-scrollbar">
        {/* Header Search & Customer */}
        <header className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors gap-4">
           <div className="relative w-full xl:max-w-md">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Cari dupa, kertas, lilin..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors" />
           </div>
           <div className="flex items-center gap-3 w-full xl:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest shrink-0">Pelanggan:</span>
              <select value={selectedCustomerId} onChange={e=>setSelectedCustomerId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-amber-500 text-amber-600 dark:text-amber-500 transition-colors cursor-pointer appearance-none">
                <option value="">-- Umum / Walk-in --</option>
                {db.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
        </header>

        {/* AI Nudges */}
        {lunarInsight && (
          <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900 border border-purple-200 dark:border-purple-800/50 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 shadow-sm transition-colors">
            <div className="p-3 bg-purple-100 dark:bg-purple-800/50 rounded-2xl shrink-0"><Moon className="w-6 h-6 text-purple-600 dark:text-purple-300"/></div>
            <p className="text-sm font-bold text-purple-900 dark:text-purple-200 leading-relaxed"><strong className="font-black">Ling-Ling berbisik:</strong> {lunarInsight}</p>
          </div>
        )}
        {aprioriSuggestion && (
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900 border border-blue-200 dark:border-blue-800/50 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 shadow-sm transition-colors">
            <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-2xl shrink-0"><TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-300"/></div>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-200 leading-relaxed">{aprioriSuggestion}</p>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-5">
          {db.products.map(p => (
            <button key={p.id} onClick={() => handleAddToCart(p)} className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 text-left flex flex-col h-40 hover:shadow-xl hover:-translate-y-1 hover:border-amber-400 dark:hover:border-amber-500 active:scale-95 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors z-10">{p.name}</h3>
              <div className="mt-auto flex justify-between items-end w-full z-10">
                  <span className="font-black text-amber-600 dark:text-amber-500 text-lg">{formatRp(p.price)}</span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Stok: {p.stock_pcs}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Keranjang Panel */}
      <div className="w-[380px] bg-white dark:bg-slate-900 flex flex-col shadow-2xl shrink-0 border-l border-slate-200 dark:border-slate-800 transition-colors z-20">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0 transition-colors">
          <h2 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 text-lg"><ShoppingCart className="w-6 h-6 text-amber-500"/> Keranjang Belanja</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30 dark:bg-slate-950/30 custom-scrollbar space-y-3 transition-colors">
          {cart.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 transition-colors">
              <div className="flex justify-between items-start font-bold text-sm text-slate-800 dark:text-slate-200">
                <span className="truncate pr-3">{item.name}</span>
                <span className="text-amber-600 dark:text-amber-500">{formatRp(item.qty * item.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{formatRp(item.price)}/item</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                   <button onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, qty: i.qty-1} : i).filter(i=>i.qty>0))} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg font-black text-slate-600 dark:text-slate-200 hover:text-red-500 shadow-sm transition-colors"><Minus className="w-4 h-4"/></button>
                   <span className="w-8 text-center text-sm font-black dark:text-slate-200">{item.qty}</span>
                   <button onClick={() => handleAddToCart(item)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg font-black text-slate-600 dark:text-slate-200 hover:text-emerald-500 shadow-sm transition-colors"><Plus className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col justify-center items-center text-slate-400 dark:text-slate-600 opacity-60">
              <Package className="w-16 h-16 mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Belum ada barang</p>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 transition-colors">
          <div className="flex justify-between items-end mb-6">
            <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Tagihan</span>
            <span className="text-4xl font-black text-amber-600 dark:text-amber-500 tracking-tighter">{formatRp(grandTotal)}</span>
          </div>
          <button disabled={cart.length === 0} onClick={() => { setCart([]); setSelectedCustomerId(''); showToast("Transaksi Berhasil Disimpan", "success"); }} className="w-full py-5 bg-amber-500 hover:bg-amber-400 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 tracking-widest uppercase text-sm transition-all flex justify-center items-center gap-2">
            Proses Pembayaran <ChevronRight className="w-5 h-5"/>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MODUL LING-LING AI & DASHBOARD
// ==========================================
const IntelligenceDashboard = ({ db, rfmSegments, aprioriRules, burnRateAlerts }) => {
  const [chatHistory, setChatHistory] = useState([
    { sender: 'lingling', text: 'Amituofo, Bos. Saya Ling-Ling, asisten AI lokal Anda. Semua data toko sudah saya pelajari. Ada yang mau ditanyakan soal omzet, stok kritis, atau kasbon umat?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [chatHistory, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = LocalLingLingEngine.process(userText, db, rfmSegments, aprioriRules, burnRateAlerts);
      setChatHistory(prev => [...prev, { sender: 'lingling', text: aiResponse }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500 animate-in fade-in">
      
      {/* Panel Kiri: Analytics Widgets */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar border-r border-slate-200 dark:border-slate-800">
        <header className="mb-10">
          <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
             <Lock className="w-3.5 h-3.5"/> Owner Access Only
          </p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
            <BrainCircuit className="w-10 h-10 text-amber-500"/> Dharma Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-base font-medium">Intelijen Ritel Edge-AI Khusus Toko Alat Sembahyang (Zero-API).</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Burn Rate Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
             <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-6 flex items-center gap-2">
                <Flame className="w-5 h-5"/> Burn-Rate Predictor
             </h3>
             <div className="space-y-4">
               {burnRateAlerts.map(p => (
                 <div key={p.id} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">{p.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Sisa Stok: {p.stock_pcs} {p.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-red-500 dark:text-red-400 tracking-tighter">{p.daysLeft}</p>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">Hari Habis</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>

          {/* RFM Matrix Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
             <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-6 flex items-center gap-2">
                <UserCheck className="w-5 h-5"/> Matriks RFM Umat
             </h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead>
                   <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest">
                     <th className="pb-4">Nama Umat / Vihara</th>
                     <th className="pb-4">Total Belanja</th>
                     <th className="pb-4">Segmen AI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {rfmSegments.map((c, i) => (
                     <tr key={i}>
                       <td className="py-5 font-bold text-slate-700 dark:text-slate-200">{c.name}</td>
                       <td className="py-5 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold">{formatRp(c.totalSpent)}</td>
                       <td className="py-5">
                         <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${c.color}`}>{c.badge}</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>

      {/* Panel Kanan: Ling-Ling Chat */}
      <div className="w-full lg:w-[450px] bg-white dark:bg-slate-900 flex flex-col shrink-0 shadow-2xl z-20 border-l border-slate-200 dark:border-slate-800 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md shrink-0 transition-colors">
          <h2 className="font-black text-amber-600 dark:text-amber-500 flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center"><BrainCircuit className="w-6 h-6"/></div>
            Asisten Ling-Ling
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-14">Local RAG Engine v2.0 • Data Secure</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-4 text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-amber-500 dark:bg-amber-600 text-white rounded-[1.5rem] rounded-tr-sm shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-[1.5rem] rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-sm'
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 uppercase font-black tracking-widest px-2">
                {msg.sender === 'user' ? 'Owner' : 'Ling-Ling'}
              </span>
            </div>
          ))}
          {isTyping && (
             <div className="flex items-start animate-in fade-in">
               <div className="p-5 bg-white dark:bg-slate-800 rounded-[1.5rem] rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-sm flex gap-1.5">
                 <span className="w-2 h-2 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                 <span className="w-2 h-2 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
               </div>
             </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0 transition-colors">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input 
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              placeholder="Tanya soal promo, stok, atau kasbon..." 
              disabled={isTyping}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-full py-4 pl-6 pr-14 text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner disabled:opacity-50"
            />
            <button type="submit" disabled={!chatInput.trim() || isTyping} className="absolute right-2 p-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 dark:hover:bg-amber-400 disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 transition-all shadow-md">
              <Send className="w-4 h-4"/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN APP SHELL (CONTROL CENTER)
// ==========================================
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [role, setRole] = useState('admin'); // 'admin' | 'kasir'
  const [tab, setTab] = useState('cashier');
  const [toast, setToast] = useState(null);

  const showToastMsg = (msg, type) => { setToast({msg, type}); setTimeout(() => setToast(null), 3000); };

  // DUMMY DATABASE (SEMBAHYANG DOMAIN)
  const dbContext = useMemo(() => ({
    products: [
      { id: 1, name: 'Hio / Dupa Wangi Melati 3 Jam', category: 'Harian', stock_pcs: 12, unit: 'bungkus', price: 15000 },
      { id: 2, name: 'Kertas Kim Cua Teratai Emas', category: 'Event', stock_pcs: 50, unit: 'pak', price: 25000 },
      { id: 3, name: 'Minyak Pelita Merah 2L', category: 'Harian', stock_pcs: 5, unit: 'jerigen', price: 45000 },
      { id: 4, name: 'Lilin Nanas Merah', category: 'Harian', stock_pcs: 100, unit: 'pasang', price: 12000 },
    ],
    customers: [
      { id: 101, name: 'Vihara Dharma Metta', phone: '0811...', sisaUtang: 1500000 },
      { id: 102, name: 'Koh Budi', phone: '0822...', sisaUtang: 0 },
      { id: 103, name: 'Ci Ling-Ling', phone: '0833...', sisaUtang: 0 },
    ],
    transactions: [
      { id: 'TX-01', customerId: 102, total: 60000, date: '08/05/2026', items: [{name: 'Hio / Dupa Wangi Melati 3 Jam', qty: 4}] },
      { id: 'TX-02', customerId: 103, total: 250000, date: '08/05/2026', items: [{name: 'Kertas Kim Cua Teratai Emas', qty: 10}, {name: 'Lilin Nanas Merah', qty: 2}] },
      { id: 'TX-03', customerId: 101, total: 450000, date: '07/05/2026', items: [{name: 'Minyak Pelita Merah 2L', qty: 10}] },
    ]
  }), []);

  // DATA PIPELINE: RFM, Apriori, Burn Rate
  const pipelineData = useMemo(() => {
    const rfm = dbContext.customers.map(c => {
      const txs = dbContext.transactions.filter(t => t.customerId === c.id);
      const totalSpent = txs.reduce((sum, t) => sum + t.total, 0);
      let badge = '❄️ Umat Pasif', color = 'text-slate-500 bg-slate-100 border-slate-300 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
      if (totalSpent > 1000000) { badge = '👑 Donatur Emas'; color = 'text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-500 dark:bg-amber-900/30 dark:border-amber-700/50'; }
      else if (totalSpent > 200000) { badge = '🔥 Umat Aktif'; color = 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-500 dark:bg-emerald-900/30 dark:border-emerald-700/50'; }
      return { ...c, totalSpent, badge, color };
    }).sort((a,b) => b.totalSpent - a.totalSpent);

    const apriori = [{ primary: 'Kertas Kim Cua Teratai Emas', secondary: 'Lilin Nanas Merah', confidence: 85 }];
    const burnRate = dbContext.products
      .filter(p => p.stock_pcs < 20 && p.category === 'Harian')
      .map(p => ({ ...p, daysLeft: Math.floor(p.stock_pcs / 3) }))
      .sort((a,b) => a.daysLeft - b.daysLeft);

    return { rfm, apriori, burnRate };
  }, [dbContext]);

  const menuItems = [
    { id: 'cashier', icon: ShoppingCart, label: 'POS', roles: ['admin', 'kasir'] },
    { id: 'history', icon: HistoryIcon, label: 'Log', roles: ['admin', 'kasir'] },
    { id: 'piutang', icon: Users, label: 'Piutang', roles: ['admin'] },
    { id: 'supplier', icon: Truck, label: 'Supplier', roles: ['admin'] },
    { id: 'intelligence', icon: BrainCircuit, label: 'Dharma AI', roles: ['admin'] },
    { id: 'settings', icon: SettingsIcon, label: 'Set', roles: ['admin'] },
  ];

  const activeMenu = menuItems.filter(m => m.roles.includes(role));

  return (
    <div className={`flex h-screen overflow-hidden font-sans antialiased transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      
      {/* SIDEBAR */}
      <nav className="hidden lg:flex w-28 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col items-center py-8 shrink-0 z-[600] transition-colors shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white mb-10 shadow-lg shadow-amber-500/30">
          <Store className="w-7 h-7"/>
        </div>
        
        <div className="flex flex-col gap-6 flex-1 w-full px-4">
          {activeMenu.map(m => {
            const Icon = m.icon;
            return (
              <button key={m.id} onClick={() => setTab(m.id)} className={`w-full py-4 rounded-2xl transition-all flex flex-col items-center gap-1.5 group ${tab === m.id ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-xl shadow-amber-500/20 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                <Icon className={`w-6 h-6 ${tab === m.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* CONTROLS */}
        <div className="mt-auto flex flex-col items-center gap-6 w-full px-4 border-t border-slate-100 dark:border-slate-800 pt-8">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md">
              {isDarkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5 text-indigo-600"/>}
           </button>

           <div className="w-full flex flex-col items-center gap-2">
             <div className={`p-2.5 rounded-2xl border w-full flex flex-col items-center text-center transition-colors shadow-sm ${role === 'admin' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-500' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}>
               <User className="w-5 h-5 mb-1"/>
               <span className="text-[9px] font-black uppercase tracking-wider">{role}</span>
             </div>
             <button onClick={() => setRole(role === 'admin' ? 'kasir' : 'admin')} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors uppercase tracking-widest mt-1">
               Ganti Role
             </button>
           </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-950 lg:dark:bg-slate-900 lg:rounded-l-[4rem] shadow-[-20px_0_60px_rgba(0,0,0,0.05)] dark:shadow-[-20px_0_80px_rgba(0,0,0,0.5)] overflow-hidden relative border-l border-slate-200 dark:border-slate-800 h-full transition-colors duration-500">
        
        {tab === 'cashier' && <PosCashier db={dbContext} aprioriRules={pipelineData.apriori} showToast={showToastMsg}/>}

        {tab === 'intelligence' && (
           role === 'admin' ? (
             <IntelligenceDashboard db={dbContext} rfmSegments={pipelineData.rfm} aprioriRules={pipelineData.apriori} burnRateAlerts={pipelineData.burnRate} />
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 animate-in fade-in zoom-in-95 transition-all duration-300">
                <div className="w-28 h-28 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-red-500/10 dark:shadow-red-500/20 rotate-12">
                  <ShieldAlert className="w-12 h-12 text-red-500 dark:text-red-500 -rotate-12"/>
                </div>
                <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter mb-4">Akses Ditolak</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mb-8 text-lg leading-relaxed">
                  Maaf Kasir, Modul <strong>Dharma AI & Ling-Ling</strong> berisi rahasia dapur finansial. Hanya <strong>OWNER/ADMIN</strong> yang memegang kuncinya.
                </p>
                <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-sm">
                  Gunakan "Ganti Role" di menu kiri untuk simulasi.
                </div>
             </div>
           )
        )}

        {(tab === 'history' || tab === 'piutang' || tab === 'supplier' || tab === 'settings') && (
           <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-900 animate-in fade-in transition-colors">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center mb-6">
                <SettingsIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 animate-spin-slow"/>
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-200 tracking-tighter mb-2 italic">Module Hidden</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">Klik tab <strong>Dharma AI</strong> atau <strong>POS</strong> untuk melihat hasil Redesign UI yang interaktif.</p>
           </div>
        )}
      </main>

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full shadow-2xl z-[9999] flex items-center gap-3 font-bold text-sm border animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-600 dark:bg-red-900 text-white border-red-500' : 'bg-slate-800 dark:bg-slate-950 text-white border-slate-700 dark:border-slate-800'}`}>
          <span className="truncate tracking-wide">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

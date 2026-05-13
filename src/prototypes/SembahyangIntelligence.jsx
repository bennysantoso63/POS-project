/**
 * PROTOTYPE: Sembahyang Intelligence + Ling-Ling Chat
 * Source: Roadmap Fase B & C (Edge-AI & Agentic Brain)
 * Status: Belum diintegrasikan — kumpulan referensi
 * 
 * Fitur:
 * 1. Local NLP Engine (Ling-Ling Chat — Zero-API)
 * 2. Burn-Rate Predictor (Stok Habis Prediksi)
 * 3. RFM Matrix (Donator Segmentation)
 * 4. RBAC Guard (Owner Only Access)
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BrainCircuit, TrendingUp, AlertTriangle, Target, MessageSquare, 
  Send, UserCheck, Flame, Moon, Lock, User, ShieldAlert
} from 'lucide-react';

import { formatRp } from '../utils/formatters';

// ==========================================
// 1. ZERO-API LOCAL NLP ENGINE (LING-LING CHAT)
// ==========================================
const LocalLingLingEngine = {
  process: (text, db) => {
    const query = text.toLowerCase();
    
    // Intent 1: Cek Piutang / Kasbon
    if (query.includes('kasbon') || query.includes('hutang') || query.includes('piutang')) {
      if (query.includes('vihara')) {
        const vihara = db.customers.find(c => c.name.toLowerCase().includes('vihara'));
        if (vihara && vihara.sisaUtang > 0) {
          return `Sisa kasbon ${vihara.name} saat ini adalah ${formatRp(vihara.sisaUtang)}. Ingat bos, ini sudah mendekati bulan Waisak, mungkin bisa ditagih halus.`;
        }
        return "Saat ini Vihara tidak memiliki kasbon/tunggakan aktif, Bos.";
      }
      const totalKasbon = db.customers.reduce((sum, c) => sum + (c.sisaUtang || 0), 0);
      return `Total uang kita yang nyangkut di luar (Kasbon) adalah ${formatRp(totalKasbon)}. Ada ${db.customers.filter(c => c.sisaUtang > 0).length} pelanggan yang belum lunas.`;
    }

    // Intent 2: Cek Produk Laku
    if (query.includes('laku') || query.includes('terlaris') || query.includes('best seller')) {
      const sales = {};
      db.transactions.forEach(tx => {
        if (tx.items) {
          tx.items.forEach(item => {
            sales[item.name] = (sales[item.name] || 0) + (item.qty || 1);
          });
        }
      });
      const topItems = Object.entries(sales).sort((a,b) => b[1] - a[1]).slice(0, 2);
      if (topItems.length === 0) return "Belum ada data penjualan yang cukup, Bos.";
      return `Barang paling laku saat ini adalah ${topItems[0][0]} (${topItems[0][1]} pcs) dan ${topItems[1]?.[0] || '-'} (${topItems[1]?.[1] || 0} pcs). Pastikan stoknya aman ya!`;
    }

    // Intent 3: Omzet / Pendapatan
    if (query.includes('omzet') || query.includes('pendapatan') || query.includes('uang masuk')) {
      const totalOmzet = db.transactions.reduce((sum, tx) => sum + (tx.total || 0), 0);
      return `Total omzet kotor kita dari ${db.transactions.length} transaksi adalah ${formatRp(totalOmzet)}. Ini belum dikurangi HPP (Modal) ya, Bos.`;
    }

    // Intent 4: Stok rendah
    if (query.includes('stok') || query.includes('habis') || query.includes('sisa')) {
      const lowStock = db.products.filter(p => p.stock_pcs < 20);
      if (lowStock.length === 0) return "Semua stok aman, Bos. Tidak ada yang di bawah 20 unit.";
      const list = lowStock.map(p => `${p.name} (sisa ${p.stock_pcs})`).join(', ');
      return `Perhatian! Ada ${lowStock.length} barang stok tipis: ${list}. Segera restock, Bos!`;
    }

    // Fallback
    return "Maaf Bos, Ling-Ling kurang paham pertanyaannya. Coba tanya soal 'kasbon', 'barang paling laku', 'omzet', atau 'stok habis'.";
  }
};


// ==========================================
// 2. DASHBOARD INTELIJEN & LING-LING CHAT
// ==========================================
export default function SembahyangIntelligence({ db, isAdmin = true }) {

  // --- RBAC GUARD ---
  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-100">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-10 h-10 text-red-600"/>
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 font-medium max-w-md">
          Modul <strong>Dharma AI & Asisten Ling-Ling</strong> berisi data rahasia finansial. 
          Hanya akun dengan level akses <strong>OWNER/ADMIN</strong> yang dapat membuka ruangan ini.
        </p>
      </div>
    );
  }

  const [chatHistory, setChatHistory] = useState([
    { sender: 'lingling', text: 'Amituofo, Bos. Saya Ling-Ling, asisten AI lokal Anda. Semua data toko sudah saya baca. Ada yang mau ditanyakan soal omzet, stok, atau kasbon umat?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      const aiResponse = LocalLingLingEngine.process(userMsg.text, db);
      setChatHistory(prev => [...prev, { sender: 'lingling', text: aiResponse }]);
    }, 600);
  };

  // --- LOCAL MATH: RFM MATRIX ---
  const rfmSegments = useMemo(() => {
    if (!db.customers) return [];
    return db.customers.map(c => {
      const txs = db.transactions.filter(t => t.customerId === c.id);
      const totalSpent = txs.reduce((sum, t) => sum + (t.total || 0), 0);
      
      let badge = '❄️ Pelanggan Pasif';
      let color = 'text-slate-500 bg-slate-100 border-slate-300';
      if (totalSpent > 1000000) { badge = '👑 Donatur Emas'; color = 'text-amber-700 bg-amber-100 border-amber-300'; }
      else if (totalSpent > 200000) { badge = '🔥 Pelanggan Aktif'; color = 'text-emerald-700 bg-emerald-100 border-emerald-300'; }

      return { ...c, totalSpent, txCount: txs.length, badge, color };
    }).sort((a,b) => b.totalSpent - a.totalSpent);
  }, [db.transactions, db.customers]);

  // --- LOCAL MATH: BURN-RATE PREDICTOR ---
  const burnRateAlerts = useMemo(() => {
    if (!db.products) return [];
    return db.products
      .filter(p => p.stock_pcs < 20)
      .map(p => ({
        ...p,
        daysLeft: Math.max(1, Math.floor(p.stock_pcs / 3)),
      }));
  }, [db.products]);

  return (
    <div className="flex h-full w-full bg-slate-950 overflow-hidden text-slate-200">
      
      {/* LEFT PANEL: ANALYTICS */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar border-r border-slate-800">
        <header className="mb-10">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
             <Lock className="w-3 h-3"/> Owner Access Only
          </p>
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
            <Moon className="w-8 h-8 text-amber-500"/> Dharma Analytics
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">Intelijen Ritel Edge-AI Khusus Toko Alat Sembahyang (Zero-API).</p>
        </header>

        <div className="space-y-6">
          {/* WIDGET: BURN RATE */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
             <h3 className="text-sm font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4"/> Burn-Rate Predictor
             </h3>
             {burnRateAlerts.length > 0 ? (
               <div className="space-y-3">
                 {burnRateAlerts.map(p => (
                   <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Sisa Stok: {p.stock_pcs}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-red-400">{p.daysLeft}</p>
                        <p className="text-[9px] uppercase tracking-widest text-slate-500">Hari Lagi Habis</p>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-slate-500">Semua stok aman (di atas 20 unit).</p>
             )}
          </div>

          {/* WIDGET: RFM MATRIX */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
             <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4"/> Matriks RFM Pelanggan
             </h3>
             {rfmSegments.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead>
                     <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-widest">
                       <th className="pb-3">Nama Pelanggan / Institusi</th>
                       <th className="pb-3">Total Belanja</th>
                       <th className="pb-3">Segmen AI</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800">
                     {rfmSegments.map(c => (
                       <tr key={c.id}>
                         <td className="py-4 font-bold text-slate-200">{c.name}</td>
                         <td className="py-4 text-emerald-400 font-mono text-xs">{formatRp(c.totalSpent)}</td>
                         <td className="py-4">
                           <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${c.color}`}>
                             {c.badge}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <p className="text-sm text-slate-500">Belum ada data pelanggan.</p>
             )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: LING-LING CHAT (LOCAL LLM ILLUSION) */}
      <div className="w-full lg:w-[450px] bg-slate-900 flex flex-col shrink-0 shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800 bg-slate-950 shrink-0">
          <h2 className="font-black text-amber-500 flex items-center gap-2 text-lg">
            <BrainCircuit className="w-6 h-6"/> Asisten Ling-Ling
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Local RAG Engine v1.0 • Privacy Secure</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-900">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-amber-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                  : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700 shadow-md'
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 uppercase font-bold">
                {msg.sender === 'user' ? 'Owner' : 'Ling-Ling'}
              </span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input 
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              placeholder="Tanya soal kasbon, omzet, barang laku..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-4 pr-12 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim()}
              className="absolute right-2 p-2 bg-amber-500 text-slate-900 rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
            >
              <Send className="w-4 h-4"/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, Flame, Users, AlertCircle } from 'lucide-react';

export default function LingLingChat({ transactions = [], products = [], customers = [] }) {
  const [messages, setMessages] = useState([
    { role: 'lingling', text: 'Amituofo, Bos. Saya Ling-Ling. Data omzet, stok dupa, dan kasbon vihara sudah saya rangkum. Ada yang ingin ditanyakan?' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  
  // Analytics States
  const [rfmData, setRfmData] = useState([]);
  const [burnRateData, setBurnRateData] = useState([]);
  const [aprioriData, setAprioriData] = useState([]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load Intelligence Data on Mount
  useEffect(() => {
    const loadIntelligence = async () => {
      if (window.api && window.api.getSembahyangRFM) {
        try {
          const [rfm, burn, apriori] = await Promise.all([
            window.api.getSembahyangRFM(),
            window.api.getSembahyangBurnRate(),
            window.api.getSembahyangApriori()
          ]);
          setRfmData(rfm || []);
          setBurnRateData(burn || []);
          setAprioriData(apriori || []);
        } catch (error) {
          console.error("Failed to load intelligence data", error);
        }
      }
    };
    loadIntelligence();
  }, []);

  const onSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || typing) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setTyping(true);

    if (window.api && window.api.askLingLing) {
        try {
            const res = await window.api.askLingLing(userMsg);
            setMessages(prev => [...prev, { role: 'lingling', text: res }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'lingling', text: 'Maaf Bos, terjadi kesalahan saat menghubungi database.' }]);
        }
    } else {
        // Fallback Simulasi
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'lingling', text: 'Bos, saya sedang dalam mode simulasi. Di versi desktop, saya akan menjawab data kasbon asli dari SQLite.' }]);
            setTyping(false);
        }, 800);
        return;
    }
    setTyping(false);
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#141E30] transition-colors duration-500 overflow-hidden">
      
      {/* LEFT PANEL: ANALYTICS DASHBOARD */}
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar border-r border-slate-200 dark:border-[#35577D]/30 transition-colors">
         <header className="mb-10">
            <div className="flex items-center gap-2 mb-2">
               <span className="px-2.5 py-1 bg-[#53D2DC]/10 dark:bg-[#38B2AC]/10 text-[#53D2DC] dark:text-[#38B2AC] text-[9px] font-black uppercase rounded-lg tracking-widest flex items-center gap-1 border border-[#53D2DC]/20 dark:border-[#38B2AC]/20 transition-colors">
                 <Lock className="w-2.5 h-2.5"/> Secure Local AI
               </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Dharma Intelligence</h1>
            <p className="text-slate-500 dark:text-[#64748b] mt-2 font-bold uppercase text-[10px] tracking-widest">Kecerdasan Buatan Ling-Ling membaca pola bisnis Anda.</p>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Burn Rate Predictor */}
            <div className="bg-[#F0FAFA] dark:bg-[#243350] p-6 rounded-[2rem] border border-slate-100 dark:border-[#35577D]/30 shadow-sm transition-colors">
               <h3 className="text-[10px] font-black uppercase text-[#FF826C] dark:text-[#E07060] mb-4 flex items-center gap-2 tracking-widest">
                 <Flame className="w-4 h-4"/> Burn Rate Radar
               </h3>
               {burnRateData.length > 0 ? (
                 <div className="space-y-4">
                    {burnRateData.slice(0, 2).map(p => (
                      <div key={p.id}>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{p.name}</p>
                        <p className="text-2xl font-black text-[#FF826C] dark:text-[#E07060] tracking-tighter mt-1">{p.daysLeft} Hari Lagi Habis</p>
                      </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-sm font-bold text-slate-400 dark:text-[#64748b]">Semua stok kategori Harian aman, Bos.</p>
               )}
            </div>

            {/* RFM Insights */}
            <div className="bg-[#F0FAFA] dark:bg-[#243350] p-6 rounded-[2rem] border border-slate-100 dark:border-[#35577D]/30 shadow-sm transition-colors">
               <h3 className="text-[10px] font-black uppercase text-[#3196E2] dark:text-[#38B2AC] mb-4 flex items-center gap-2 tracking-widest">
                 <Users className="w-4 h-4"/> Umat Terloyal (RFM)
               </h3>
               {rfmData.length > 0 ? (
                 <div className="space-y-4">
                    {rfmData.slice(0, 2).map(c => (
                      <div key={c.id}>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{c.name}</p>
                        <p className="text-2xl font-black text-[#FFC05F] dark:text-[#D4A040] tracking-tighter mt-1">{c.badge}</p>
                      </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-sm font-bold text-slate-400 dark:text-[#64748b]">Belum ada data pelanggan yang cukup, Bos.</p>
               )}
            </div>

            {/* Apriori Nudge */}
            <div className="md:col-span-2 bg-[#F0FAFA] dark:bg-[#243350] p-6 rounded-[2rem] border border-slate-100 dark:border-[#35577D]/30 shadow-sm transition-colors">
               <h3 className="text-[10px] font-black uppercase text-[#53D2DC] dark:text-[#38B2AC] mb-4 flex items-center gap-2 tracking-widest">
                 <AlertCircle className="w-4 h-4"/> Rekomendasi Bundling (Apriori)
               </h3>
               {aprioriData.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {aprioriData.map((rule, i) => (
                      <div key={i} className="bg-white dark:bg-[#1A2640] p-4 rounded-2xl border border-slate-100 dark:border-[#35577D]/20">
                         <p className="text-[9px] font-black text-slate-400 dark:text-[#64748b] uppercase tracking-tighter">Beli {rule.primary}, sarankan:</p>
                         <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{rule.secondary}</p>
                         <p className="text-[10px] font-black text-[#53D2DC] mt-1">{Math.floor(rule.confidence)}% Relevan</p>
                      </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-sm font-bold text-slate-400 dark:text-[#64748b]">Belum menemukan pola belanja yang signifikan, Bos.</p>
               )}
            </div>
         </div>
      </div>

      {/* RIGHT PANEL: CHAT INTERFACE */}
      <div className="w-[450px] flex flex-col bg-white dark:bg-[#1A2640] shadow-2xl transition-colors border-l border-slate-100 dark:border-[#35577D]/20">
         <div className="p-6 border-b border-slate-100 dark:border-[#35577D]/30 bg-[#F0FAFA] dark:bg-[#141E30] flex items-center gap-3 transition-colors">
            <div className="w-10 h-10 bg-[#FFC05F] dark:bg-[#D4A040] rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-[#FFC05F]/20">L</div>
            <div>
               <h2 className="font-black text-slate-800 dark:text-white leading-tight">Asisten Ling-Ling</h2>
               <p className="text-[10px] text-[#FFC05F] dark:text-[#D4A040] font-black uppercase tracking-widest">Enterprise AI v3.0</p>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white dark:bg-[#1A2640] transition-colors">
            {messages.map((m, i) => (
               <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-4 text-sm font-medium leading-relaxed transition-colors ${m.role === 'user' ? 'bg-[#3196E2] dark:bg-[#35577D] text-white rounded-2xl rounded-tr-none shadow-md shadow-[#3196E2]/10' : 'bg-[#F0FAFA] dark:bg-[#243350] text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none border border-slate-100 dark:border-[#35577D]/30 shadow-sm'}`}>
                     {m.text}
                  </div>
                  <span className="text-[9px] font-black text-slate-400 dark:text-[#64748b] mt-2 uppercase tracking-widest">{m.role === 'user' ? 'Bos' : 'Ling-Ling'}</span>
               </div>
            ))}
            {typing && (
              <div className="flex items-center gap-2 text-[10px] font-black text-[#53D2DC] dark:text-[#38B2AC] animate-pulse uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-[#53D2DC] dark:bg-[#38B2AC] rounded-full"></span>
                Ling-Ling sedang berpikir...
              </div>
            )}
            <div ref={chatEndRef} />
         </div>

         <form onSubmit={onSend} className="p-6 border-t border-slate-100 dark:border-[#35577D]/30 bg-[#F0FAFA] dark:bg-[#141E30] transition-colors">
            <div className="relative">
               <input 
                 value={input} 
                 onChange={e=>setInput(e.target.value)} 
                 type="text" 
                 placeholder="Tanya soal kasbon, omzet, atau stok..." 
                 className="w-full bg-white dark:bg-[#243350] border border-slate-200 dark:border-[#35577D]/30 rounded-2xl py-4 pl-5 pr-14 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-[#53D2DC] dark:focus:border-[#38B2AC] transition-all shadow-inner" 
               />
               <button 
                 type="submit" 
                 disabled={!input.trim() || typing} 
                 className="absolute right-2 top-2 p-3 bg-[#53D2DC] dark:bg-[#38B2AC] text-white rounded-xl hover:bg-[#38B2AC] transition-all shadow-lg shadow-[#53D2DC]/20 disabled:opacity-50 active:scale-95"
               >
                 <Send className="w-5 h-5"/>
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}

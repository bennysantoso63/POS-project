import React, { useState, useEffect } from 'react';
import { 
  Lock, ChevronRight, Store, ShieldCheck, Cpu, 
  Fingerprint, Activity, Zap, Globe, ShieldAlert,
  Dna, Network, Database, Layers, Shield, Power,
  ChevronDown, ArrowRight, Key
} from 'lucide-react';

export default function LoginView({ onLogin, error: externalError }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    setIsMounting(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('PIN Salah / Kurang dari 4 Digit');
      triggerShake();
      return;
    }
    onLogin(pin);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  useEffect(() => {
    if (externalError) triggerShake();
  }, [externalError]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-bg font-sans selection:bg-brand-primary/30 transition-colors duration-1000 relative overflow-hidden">
      
      {/* STELLAR BACKGROUND ARCHITECTURE (HIGH-FIDELITY) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-brand-primary/10 rounded-full blur-[250px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-brand-accent/10 rounded-full blur-[250px]" />
        
        {/* NEURAL GRID OVERLAY */}
        <div className="absolute inset-0 opacity-[0.05] animate-[fade-in_3s_ease-out]">
           <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                 <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1"/>
                 </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
           </svg>
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] animate-pulse">
           <Network className="w-full h-full scale-150 rotate-12" />
        </div>
      </div>

      <div className={`w-full max-w-lg p-1 bg-brand-card/20 backdrop-blur-[100px] rounded-[3rem] border-2 border-brand-border/30 shadow-[0_50px_100px_-25px_rgba(0,0,0,0.8)] transition-all duration-[2000ms] relative z-10 overflow-hidden ${isMounting ? 'opacity-0 translate-y-10 scale-95' : 'opacity-100 translate-y-0 scale-100'} ${isShaking ? 'animate-shake' : ''} group/master`}>
        
        {/* MULTI-LAYERED CARD ARCHITECTURE */}
        <div className="bg-brand-card/60 rounded-[2.8rem] border-2 border-white/5 p-4 md:p-6 relative overflow-hidden">
           
           {/* DECORATIVE NEURAL OVERLAY */}
           <div className="absolute -top-32 -right-32 opacity-[0.02] text-brand-primary group-hover/master:scale-110 transition-transform duration-1000 transform-gpu pointer-events-none">
              <Cpu size={600} className="animate-spin-slow" />
           </div>
           
           <div className="absolute -bottom-32 -left-32 opacity-[0.02] text-brand-accent group-hover/master:scale-110 transition-transform duration-1000 transform-gpu pointer-events-none">
              <Dna size={600} className="animate-pulse" />
           </div>

           <div className="flex flex-col items-center mb-6 relative z-10">
             <div className="relative group mb-4">
                <div className="absolute inset-0 bg-brand-primary blur-3xl opacity-20 group-hover:opacity-60 transition-opacity duration-1000"></div>
                <div className="w-16 h-16 bg-brand-primary text-white rounded-[1.2rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(var(--brand-primary-rgb),0.6)] relative z-10 transition-all duration-1000 hover:scale-110 active:scale-90 group-hover:rotate-[360deg] border-2 border-white/20">
                   <Fingerprint size={32} className="transition-all duration-700" />
                </div>
                
                {/* STATUS RING */}
                <div className="absolute -inset-6 border-4 border-dashed border-brand-primary/20 rounded-[5rem] animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
             </div>
             
             <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-text tracking-tight leading-none mb-2">
                  Login <span className="text-brand-primary block mt-1 drop-shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.4)]">Kasir</span>
                </h1>
                
                <div className="flex flex-col items-center gap-4 mt-4">
                   <div className="flex items-center gap-3 bg-brand-bg/80 backdrop-blur-xl px-4 py-1.5 rounded-[2rem] border-2 border-brand-border shadow-xl relative overflow-hidden group/status">
                      <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
                      <div className="flex gap-1.5 relative z-10">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-150 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                      </div>
                      <span className="text-[8px] font-bold text-brand-text tracking-widest relative z-10 ml-0.5">Sistem Terverifikasi • v4.2.0</span>
                   </div>
                   
                   <p className="text-[8px] font-bold text-brand-muted tracking-widest opacity-40">Koneksi Aman</p>
                </div>
             </div>
           </div>

           <form onSubmit={handleSubmit} className="space-y-8 relative z-10 w-full max-w-sm mx-auto">
             <div className="relative group/field">
               <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-4 text-center opacity-40 group-focus-within/field:opacity-100 transition-opacity duration-700">Masukkan PIN Anda</label>
               
               <div className="relative group/input flex justify-center">
                  <input 
                    type="password" 
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                    placeholder="••••" 
                    maxLength={6}
                    className="w-full bg-transparent border-b-2 border-brand-border pb-4 text-brand-text text-center tracking-[1em] text-5xl font-black focus:outline-none focus:border-brand-primary transition-all duration-1000 placeholder:opacity-[0.03] group-hover/input:border-brand-muted/40 selection:bg-brand-primary/20"
                    autoFocus
                  />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[4px] bg-brand-primary transition-all duration-[1500ms] ease-out group-focus-within/input:w-full shadow-[0_0_40px_rgba(var(--brand-primary-rgb),0.8)]"></div>
                  
                  {/* INPUT GLOW */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-brand-primary/10 blur-[60px] opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
               </div>
             </div>

             {(error || externalError) && (
               <div className="p-10 rounded-[3rem] bg-rose-500/5 border-2 border-rose-500/20 animate-in slide-in-from-top-8 duration-700 backdrop-blur-md">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20 shrink-0 shadow-lg">
                       <ShieldAlert className="w-7 h-7" />
                    </div>
                    <p className="text-rose-500 text-[11px] font-bold tracking-widest leading-relaxed">
                      {error || externalError}
                    </p>
                 </div>
               </div>
             )}

             <div className="space-y-10">
               <button 
                 type="submit"
                 disabled={pin.length < 4}
                 className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-20 disabled:grayscale text-white font-bold rounded-[2rem] transition-all duration-700 flex items-center justify-center gap-6 tracking-widest text-xs shadow-[0_20px_40px_-10px_rgba(var(--brand-primary-rgb),0.6)] active:scale-95 group hover:-translate-y-1 border-2 border-white/20 relative overflow-hidden"
               >
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                 <span className="relative z-10 ml-10">Masuk Sekarang</span>
                 <ArrowRight size={32} className="relative z-10 group-hover:translate-x-4 transition-transform duration-700" />
               </button>
               
               <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-30 mt-16 transition-opacity duration-1000 hover:opacity-60">
                  <div className="flex items-center gap-3">
                     <Globe size={18} className="text-brand-muted" />
                     <span className="text-[10px] font-bold tracking-widest">Mode Offline Aktif</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-border"></div>
                  <div className="flex items-center gap-3">
                     <Zap size={18} className="text-brand-primary" />
                     <span className="text-[10px] font-bold tracking-widest">Respon Cepat</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-border"></div>
                  <div className="flex items-center gap-3">
                     <ShieldCheck size={18} className="text-emerald-500" />
                     <span className="text-[10px] font-bold tracking-widest">Data Terlindungi</span>
                  </div>
               </div>
             </div>
           </form>
        </div>
        
        {/* MASTER ARCHIVE FOOTER */}
        <div className="p-12 text-center relative z-10">
          <div className="flex items-center justify-center gap-8 mb-4">
             <div className="h-[1px] w-12 bg-brand-border"></div>
             <p className="text-[10px] text-brand-muted font-bold tracking-widest opacity-40">Sistem POS Utama</p>
             <div className="h-[1px] w-12 bg-brand-border"></div>
          </div>
          <p className="text-[11px] text-brand-muted font-bold tracking-widest opacity-20 hover:opacity-50 transition-opacity duration-1000 cursor-default">
             Sistem Kasir Terintegrasi • Mode Mandiri • 2024
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-15px); }
          20%, 40%, 60%, 80% { transform: translateX(15px); }
        }
        .animate-shake { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-spin-slow { animation: spin 12s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 0.05; }
        }
        :root {
          --brand-primary-rgb: 79, 70, 229;
          --brand-accent-rgb: 244, 63, 94;
        }
      `}</style>
    </div>
  );
}

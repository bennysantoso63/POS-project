import React, { useMemo } from 'react';
import { 
  Activity, UserCircle, ArrowRightLeft, Clock, 
  Lock, ShieldCheck, UserCheck, AlertCircle, 
  Search, Filter, ChevronRight, CheckCircle2,
  Terminal, Shield
} from 'lucide-react';

export default function MonitorView({ 
  sessions = [], 
  movements = [], 
  subTab, 
  onSubTabChange, 
  formatIDR 
}) {
  const sessionStats = useMemo(() => {
    const active = sessions.filter(s => s.status === 'active').length;
    const totalExpected = sessions.reduce((a, b) => a + (b.expected_cash || 0), 0);
    return { active, totalExpected };
  }, [sessions]);

  return (
    <div className="flex-1 p-6 md:p-10 bg-brand-bg text-brand-text font-sans h-full overflow-y-auto custom-scrollbar transition-colors duration-500">
      
      {/* HEADER & NAVIGATION HUB */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
        <div className="flex-1">
           <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-4">
             <div className="p-3.5 bg-brand-primary text-white rounded-2xl shadow-2xl shadow-brand-primary/40 animate-pulse">
               <Terminal className="w-7 h-7"/>
             </div>
             Monitor <span className="text-brand-primary">Operasional</span>
           </h1>
           <p className="text-brand-muted font-bold text-[10px] mt-3 tracking-widest flex items-center gap-2">
             <Shield className="w-3.5 h-3.5 text-brand-primary"/> Pusat Audit Operasional Realtime
           </p>
        </div>

        <div className="flex bg-brand-card p-2 rounded-[2rem] border border-brand-border shadow-sm w-full lg:w-auto transition-all">
          {[
            { id: 'sessions', label: 'Sesi Shift', icon: UserCheck },
            { id: 'audit', label: 'Audit Inventaris', icon: ArrowRightLeft }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => onSubTabChange(tab.id)} 
              className={`flex-1 lg:flex-none px-8 py-4 text-[10px] font-bold rounded-2xl transition-all flex items-center justify-center gap-3 tracking-widest whitespace-nowrap ${subTab === tab.id ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-[1.02] z-10' : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg'}`}
            >
              <tab.icon className="w-4 h-4"/>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'sessions' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          {/* TOP CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { label: 'Shift Aktif', val: sessionStats.active, sub: 'Kasir Bertugas', color: 'brand-primary', icon: Activity },
               { label: 'Ekspektasi Laci', val: formatIDR(sessionStats.totalExpected), sub: 'Semua Sesi Aktif', color: 'brand-accent', icon: ShieldCheck }
             ].map((s, i) => (
               <div key={i} className="bg-brand-card p-8 rounded-[2.5rem] border border-brand-border shadow-sm flex items-center gap-6 group hover:border-brand-primary/30 transition-all">
                  <div className={`w-14 h-14 bg-brand-bg border border-brand-border rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                     <s.icon className={`w-7 h-7 text-brand-primary`}/>
                  </div>
                  <div>
                     <p className="text-[9px] font-bold text-brand-muted tracking-widest mb-1">{s.label}</p>
                     <p className="text-xl font-bold text-brand-text tracking-tight">{s.val}</p>
                  </div>
               </div>
             ))}
          </div>

          {/* TABLE SESSIONS */}
          <div className="bg-brand-card rounded-[3rem] border border-brand-border shadow-sm overflow-hidden overflow-x-auto">
            <div className="p-10 border-b border-brand-border bg-brand-bg/30 flex justify-between items-center">
               <h3 className="font-bold text-brand-text flex items-center gap-4 tracking-tight"><UserCircle className="w-7 h-7 text-brand-primary"/> Daftar Sesi Shift Kasir</h3>
               <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-5 py-2 rounded-full border border-brand-primary/20 tracking-widest">{sessions.length} Sesi Tercatat</span>
            </div>
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-brand-bg/20 border-b border-brand-border">
                  <th className="px-10 py-8 text-[10px] font-bold text-brand-muted tracking-widest">ID Sesi / Kasir</th>
                  <th className="px-8 py-8 text-[10px] font-bold text-brand-muted tracking-widest">Waktu Operasional</th>
                  <th className="px-8 py-8 text-[10px] font-bold text-brand-muted tracking-widest text-right">Modal Awal</th>
                  <th className="px-8 py-8 text-[10px] font-bold text-brand-primary tracking-widest text-right">Ekspektasi Laci</th>
                  <th className="px-10 py-8 text-[10px] font-bold text-brand-muted tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-brand-primary/[0.02] transition-all group">
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-brand-bg border border-brand-border rounded-2xl flex items-center justify-center group-hover:bg-brand-card transition-all">
                             <UserCircle className="w-7 h-7 text-brand-muted group-hover:text-brand-primary transition-colors"/>
                          </div>
                          <div>
                            <div className="font-bold text-brand-text text-sm tracking-tight">Sesi-{s.id}</div>
                            <div className="text-[10px] font-bold text-brand-primary tracking-widest mt-1">{s.user_name}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-8">
                       <div className="space-y-2">
                          <div className="flex items-center text-[10px] font-bold text-emerald-500 tracking-tighter bg-emerald-500/10 w-fit px-3 py-1 rounded-lg border border-emerald-500/20"><Clock className="w-3.5 h-3.5 mr-2"/> Buka: {s.opened_at}</div>
                          {s.closed_at ? (
                            <div className="flex items-center text-[10px] font-bold text-brand-muted tracking-tighter bg-brand-bg w-fit px-3 py-1 rounded-lg border border-brand-border"><Lock className="w-3.5 h-3.5 mr-2"/> Tutup: {s.closed_at}</div>
                          ) : (
                            <div className="text-[10px] font-bold text-brand-accent italic flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-accent/10 w-fit animate-pulse border border-brand-accent/20"><Activity className="w-3 h-3"/> Shift Aktif</div>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                       <p className="font-bold text-brand-muted text-base tracking-tighter">{formatIDR(s.opening_cash)}</p>
                    </td>
                    <td className="px-8 py-8 text-right">
                       <p className="font-bold text-brand-primary text-xl tracking-tighter">{formatIDR(s.expected_cash)}</p>
                       {s.status === 'closed' && (
                         <div className={`inline-flex items-center gap-2 text-[9px] font-bold px-3 py-1 rounded-full mt-2 border ${s.expected_cash === s.closing_cash ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} tracking-widest`}>
                            {s.expected_cash === s.closing_cash ? <CheckCircle2 className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>}
                            Fisik Laci: {formatIDR(s.closing_cash)}
                         </div>
                       )}
                    </td>
                    <td className="px-10 py-8 text-center">
                      {s.status === 'active' ? (
                        <span className="bg-brand-primary text-white text-[9px] font-bold px-5 py-2.5 rounded-xl shadow-xl shadow-brand-primary/30 tracking-widest border border-brand-primary/50 transition-all hover:scale-105 inline-block">Bertugas</span>
                      ) : (
                        <span className="bg-brand-bg text-brand-muted text-[9px] font-bold px-5 py-2.5 rounded-xl tracking-widest border border-brand-border inline-block">Offline</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'audit' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-brand-card rounded-[3rem] border border-brand-border shadow-sm overflow-hidden overflow-x-auto">
            <div className="p-10 border-b border-brand-border bg-brand-bg/30 flex justify-between items-center">
               <h3 className="font-bold text-brand-text flex items-center gap-4 tracking-tight"><ArrowRightLeft className="w-7 h-7 text-brand-primary"/> Buku Besar Pergerakan Stok</h3>
               <div className="flex items-center gap-3 bg-brand-bg px-5 py-3 rounded-2xl border border-brand-border shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-emerald-500"/>
                  <span className="text-[10px] font-bold text-brand-muted tracking-widest">Jalur Audit Terlindungi</span>
               </div>
            </div>
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-brand-bg/20 border-b border-brand-border">
                  <th className="px-10 py-8 text-[10px] font-bold text-brand-muted tracking-widest">Waktu & Petugas</th>
                  <th className="px-8 py-8 text-[10px] font-bold text-brand-muted tracking-widest">Entitas Produk</th>
                  <th className="px-8 py-8 text-[10px] font-bold text-brand-muted tracking-widest">Alasan / Trigger</th>
                  <th className="px-10 py-8 text-[10px] font-bold text-brand-muted tracking-widest text-right">Mutasi (Pcs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-brand-primary/[0.02] transition-all group">
                    <td className="px-10 py-8">
                       <div className="space-y-2">
                          <p className="text-[11px] font-bold text-brand-text tracking-tight">{m.created_at}</p>
                          <span className="inline-flex items-center gap-2 bg-brand-bg text-brand-muted px-3 py-1 rounded-lg text-[9px] font-bold border border-brand-border tracking-widest transition-colors group-hover:text-brand-primary">
                             <UserCircle className="w-3 h-3 opacity-50"/> {m.user_name}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-bg border border-brand-border rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                             <Activity className="w-6 h-6 text-brand-muted group-hover:text-brand-primary"/>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-brand-text tracking-tight">{m.product_name}</p>
                            <p className="text-[10px] font-bold text-brand-primary font-mono tracking-widest mt-1 opacity-70">{m.sku || 'N/A'}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-8">
                       <span className="text-[10px] font-bold text-brand-text bg-brand-bg px-4 py-2 rounded-xl border border-brand-border tracking-widest transition-colors">{m.reason}</span>
                    </td>
                    <td className="px-10 py-8 text-right">
                       <span className={`inline-flex items-center gap-3 font-bold text-base px-6 py-3 rounded-2xl border-2 transition-all group-hover:scale-110 ${m.delta > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'}`}>
                          {m.delta > 0 ? `+${m.delta}` : m.delta} pcs
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

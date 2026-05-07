import React, { useMemo } from 'react';
import { 
  Activity, UserCircle, ArrowRightLeft, Clock, 
  Lock, ShieldCheck, UserCheck, AlertCircle, 
  Search, Filter, ChevronRight, CheckCircle2
} from 'lucide-react';

export default function MonitorView({ 
  sessions, 
  movements, 
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
    <div className="p-6 md:p-10 bg-slate-50/50 h-full overflow-y-auto w-full pb-24 md:pb-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
        <div className="flex-1">
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
             <div className="p-3 bg-indigo-600 rounded-[1.2rem] shadow-lg shadow-indigo-500/30">
               <Activity className="w-6 h-6 text-white"/>
             </div>
             OPERATIONAL <span className="text-indigo-600">COMMAND</span>
           </h1>
           <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
             <ShieldCheck className="w-3 h-3 text-emerald-500"/> Audit Trail & Pengawasan Shift Kasir Realtime
           </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border-2 border-slate-100 shadow-inner w-full lg:w-auto">
          {[
            { id: 'sessions', label: 'SESI KASIR', icon: UserCheck },
            { id: 'audit', label: 'AUDIT STOK', icon: ArrowRightLeft }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => onSubTabChange(tab.id)} 
              className={`flex-1 lg:flex-none px-6 py-3 text-[10px] font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest whitespace-nowrap ${subTab === tab.id ? 'bg-white text-indigo-600 shadow-md border-2 border-slate-50 scale-105 z-10' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon className="w-4 h-4"/>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'sessions' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { label: 'SHIFT AKTIF', val: sessionStats.active, sub: 'Kasir On-Duty', color: 'emerald', icon: Activity },
               { label: 'TOTAL ESTIMASI LACI', val: formatIDR(sessionStats.totalExpected), sub: 'Dari Semua Sesi', color: 'indigo', icon: UserCircle }
             ].map((s, i) => (
               <div key={i} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm flex items-center gap-5">
                  <div className={`w-12 h-12 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center flex-shrink-0 border border-${s.color}-100`}>
                     <s.icon className="w-6 h-6"/>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                     <p className="text-lg font-black text-slate-900 tracking-tight">{s.val}</p>
                  </div>
               </div>
             ))}
          </div>

          <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-xl overflow-hidden overflow-x-auto relative">
            <div className="p-8 border-b-2 border-slate-50 bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight"><UserCircle className="w-6 h-6 text-indigo-500"/> Daftar Sesi Shift Kasir</h3>
               <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest">{sessions.length} TOTAL SESI</span>
            </div>
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-white border-b-2 border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID Sesi / Kasir</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Waktu Operasional</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Modal Awal</th>
                  <th className="px-6 py-6 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] text-right">Ekspektasi Laci</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status Operasi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 group-hover:bg-white transition-all">
                             <UserCircle className="w-6 h-6 text-slate-300 group-hover:text-indigo-500"/>
                          </div>
                          <div>
                            <div className="font-black text-slate-800 text-sm uppercase tracking-tight">SES-{s.id}</div>
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">{s.user_name}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="space-y-1.5">
                          <div className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 w-fit px-2 py-0.5 rounded"><Clock className="w-3 h-3 mr-1.5"/> Buka: {s.opened_at}</div>
                          {s.closed_at ? (
                            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 w-fit px-2 py-0.5 rounded"><Lock className="w-3 h-3 mr-1.5"/> Tutup: {s.closed_at}</div>
                          ) : (
                            <div className="text-[9px] font-black text-blue-500 italic flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 w-fit animate-pulse uppercase"><Activity className="w-2.5 h-2.5"/> Sedang Berjalan</div>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <p className="font-black text-slate-600 text-base tracking-tighter">{formatIDR(s.opening_cash)}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <p className="font-black text-indigo-600 text-lg tracking-tighter">{formatIDR(s.expected_cash)}</p>
                       {s.status === 'closed' && (
                         <div className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded mt-1.5 border ${s.expected_cash === s.closing_cash ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'} uppercase tracking-widest`}>
                            {s.expected_cash === s.closing_cash ? <CheckCircle2 className="w-2.5 h-2.5"/> : <AlertCircle className="w-2.5 h-2.5"/>}
                            Fisik: {formatIDR(s.closing_cash)}
                         </div>
                       )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      {s.status === 'active' ? (
                        <span className="bg-blue-600 text-white text-[9px] font-black px-4 py-2 rounded-xl shadow-lg shadow-blue-500/30 uppercase tracking-widest border-2 border-blue-400">Kasir Aktif</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border-2 border-slate-200">Sesi Tutup</span>
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
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-xl overflow-hidden overflow-x-auto relative">
            <div className="p-8 border-b-2 border-slate-50 bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight"><ArrowRightLeft className="w-6 h-6 text-indigo-500"/> Buku Besar Pergerakan Stok</h3>
               <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border-2 border-slate-50">
                  <ShieldCheck className="w-5 h-5 text-emerald-500"/>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Trail Protected (Immutable)</span>
               </div>
            </div>
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-white border-b-2 border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Waktu & Petugas</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Info Barang</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alasan / Trigger</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Mutasi (Pcs)</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                       <div className="space-y-1.5">
                          <p className="text-[11px] font-black text-slate-800 tracking-tight">{m.created_at}</p>
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg text-[9px] font-black border border-slate-200 uppercase tracking-widest">
                             <UserCircle className="w-2.5 h-2.5 opacity-50"/> {m.user_name}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-white transition-all">
                             <Activity className="w-5 h-5 text-slate-300 group-hover:text-indigo-400"/>
                          </div>
                          <div>
                            <p className="font-black text-xs text-slate-800 uppercase tracking-tight">{m.product_name}</p>
                            <p className="text-[9px] font-black text-slate-400 font-mono tracking-widest mt-0.5">{m.sku || 'N/A'}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-tighter">{m.reason}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className={`inline-flex items-center gap-2 font-black text-sm px-4 py-2 rounded-2xl border-2 transition-all group-hover:scale-110 ${m.delta > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-lg shadow-emerald-500/10' : 'bg-red-50 text-red-600 border-red-100 shadow-lg shadow-red-500/10'}`}>
                          {m.delta > 0 ? `+${m.delta}` : m.delta} PCS
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

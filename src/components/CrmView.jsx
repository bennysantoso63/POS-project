import React, { useMemo } from 'react';
import { 
  Users, PlusCircle, Phone, Edit, Trash, 
  UserCheck, TrendingUp, Wallet, Star,
  Search, Filter, MoreVertical, Calendar
} from 'lucide-react';

export default function CrmView({ 
  customers, 
  onAddCustomer, 
  onEditCustomer, 
  onDeleteCustomer, 
  formatIDR 
}) {
  const crmStats = useMemo(() => {
    const total = customers.length;
    const totalSpent = customers.reduce((a, b) => a + (b.total_spent || 0), 0);
    const topTierCount = customers.filter(c => c.default_tier === 'partai').length;
    return { total, totalSpent, topTierCount };
  }, [customers]);

  return (
    <div className="p-6 md:p-10 bg-slate-50/50 h-full overflow-y-auto w-full pb-24 md:pb-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
        <div className="flex-1">
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
             <div className="p-3 bg-blue-600 rounded-[1.2rem] shadow-lg shadow-blue-500/30">
               <Users className="w-6 h-6 text-white"/>
             </div>
             CRM <span className="text-blue-600">HUB</span>
           </h1>
           <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
             <UserCheck className="w-3 h-3 text-emerald-500"/> Manajemen Basis Data Pelanggan & Loyalty
           </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
           {[
             { label: 'PELANGGAN', val: crmStats.total, sub: 'Orang Terdaftar', color: 'blue', icon: Users },
             { label: 'TOP TIER', val: crmStats.topTierCount, sub: 'Harga Partai', color: 'indigo', icon: Star },
             { label: 'TOTAL NILAI', val: formatIDR(crmStats.totalSpent), sub: 'All-Time Sales', color: 'emerald', icon: Wallet, hidden: 'sm' }
           ].map((s, i) => (
             <div key={i} className={`bg-white p-5 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-center gap-4 ${s.hidden === 'sm' ? 'hidden sm:flex' : ''}`}>
                <div className={`w-10 h-10 bg-${s.color}-50 text-${s.color}-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-${s.color}-100`}>
                   <s.icon className="w-5 h-5"/>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                   <p className="text-sm font-black text-slate-900">{s.val}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-[2.2rem] border-2 border-slate-50 shadow-sm">
        <div className="relative flex-1 w-full max-w-lg">
           <input 
             type="text" 
             placeholder="Cari Nama Pelanggan atau No. HP..." 
             className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all" 
           />
           <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
        </div>
        
        <button onClick={onAddCustomer} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] shadow-xl shadow-blue-500/30 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2">
          <PlusCircle className="w-4 h-4" /> Daftarkan Pelanggan Baru
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b-2 border-slate-50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Profil</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kontak</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status Tier</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Loyalty Value</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Opsi</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-50">
            {customers.map(cust => (
              <tr key={cust.id} className="hover:bg-blue-50/20 transition-all group">
                <td className="px-8 py-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 group-hover:bg-white group-hover:border-blue-200 transition-all">
                         <span className="text-xl font-black text-slate-300 group-hover:text-blue-500 uppercase">{cust.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors uppercase tracking-tight">{cust.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-2.5 h-2.5"/> Gabung: {cust.join_date}</span>
                        </div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-6">
                   <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit">
                      <Phone className="w-3.5 h-3.5 text-blue-500 opacity-70"/> 
                      <span className="text-xs font-black">{cust.phone}</span>
                   </div>
                </td>
                <td className="px-6 py-6 text-center">
                   <span className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-full border-2 tracking-widest ${cust.default_tier === 'partai' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                      {cust.default_tier}
                   </span>
                </td>
                <td className="px-6 py-6 text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Total Belanja</p>
                   <p className="font-black text-emerald-600 text-base">{formatIDR(cust.total_spent)}</p>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-all">
                    <button onClick={() => onEditCustomer(cust)} className="p-3 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-2 border-slate-100 rounded-2xl shadow-sm transition-all hover:border-blue-200 active:scale-90" title="Edit Data"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteCustomer(cust)} className="p-3 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border-2 border-slate-100 rounded-2xl shadow-sm transition-all hover:border-red-200 active:scale-90" title="Hapus"><Trash className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="5" className="p-20 text-center">
                   <div className="flex flex-col items-center opacity-20">
                      <Users className="w-16 h-16 mb-4"/>
                      <p className="text-xl font-black uppercase tracking-[0.5em]">Belum Ada Pelanggan</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

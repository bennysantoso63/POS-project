import { 
  LayoutDashboard, ShoppingCart, Users, Package, Activity, 
  ReceiptText, Settings, LogOut, Store, Truck, Scan, Wallet, Landmark, CreditCard, BrainCircuit
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, isAdmin, currentUser, activeSession, onLogout, onCloseShift, onOpenPettyCash }) {
  const navItems = [
    ...(isAdmin ? [{ id: 'dashboard', icon: LayoutDashboard, label: 'Dasbor' }] : []),
    { id: 'cashier', icon: ShoppingCart, label: 'Kasir' },
    ...(isAdmin ? [{ id: 'accounting', icon: Landmark, label: 'Akuntansi' }] : []),
    ...(isAdmin ? [{ id: 'purchasing', icon: Truck, label: 'Kulakan' }] : []),
    ...(isAdmin ? [{ id: 'crm', icon: Users, label: 'Pelanggan' }] : []),
    ...(isAdmin ? [{ id: 'piutang', icon: CreditCard, label: 'Buku Bon' }] : []),

    ...(isAdmin ? [{ id: 'inventory', icon: Package, label: 'Data Induk' }] : []),
    ...(isAdmin ? [{ id: 'cycle_count', icon: Scan, label: 'Opname' }] : []),
    ...(isAdmin ? [{ id: 'monitoring', icon: Activity, label: 'Monitor' }] : []),
     { id: 'history', icon: ReceiptText, label: 'Riwayat' },
     ...(isAdmin ? [{ id: 'intelligence', icon: BrainCircuit, label: 'Ling-Ling' }] : [])

   ];

  return (
    <nav className="hidden md:flex w-24 bg-slate-900 border-r border-slate-800 flex-col items-center py-8 shrink-0 z-20 shadow-2xl relative">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-600/40 relative">
         <Store className="w-7 h-7" />
         <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
      </div>
      <div className="text-[10px] text-emerald-400 font-bold mb-8 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">LAN OK</div>
      
      <div className="flex flex-col gap-4 w-full px-4 flex-1 overflow-y-auto hide-scrollbar">
        {navItems.map(menu => (
          <button key={menu.id} onClick={() => onTabChange(menu.id)} title={menu.label} className={`p-3.5 rounded-2xl transition-all flex flex-col items-center justify-center gap-1.5 ${activeTab === menu.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <menu.icon className={`w-6 h-6`} />
            <span className="text-[9px] font-bold text-center leading-none">{menu.label.replace(' ', '\n')}</span>
          </button>
        ))}
      </div>
      <div className="w-full px-4 mt-auto space-y-3 pt-4 border-t border-slate-800">
         {activeSession && <button onClick={onOpenPettyCash} title="Kas Keluar (Petty Cash)" className="w-full py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold shadow-sm hover:bg-slate-700 transition-colors border border-slate-700 flex flex-col items-center"><Wallet className="w-4 h-4 mb-1"/> Kas Keluar</button>}
         {isAdmin && <button onClick={() => onTabChange('settings')} title="Pengaturan Sistem" className={`w-full p-2.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Settings className="w-5 h-5" /><span className="text-[9px] font-bold">Setting</span></button>}
         <div className="pt-2 w-full flex flex-col items-center">
            <div className="text-[10px] text-slate-500 font-bold mb-3 truncate w-full text-center">{currentUser?.username?.split(' ')[0]}</div>
            {activeSession ? (
               <button onClick={onCloseShift} title="Tutup Shift Laci" className={`w-full py-2 rounded-xl transition-all flex items-center justify-center bg-amber-500 text-slate-900 font-bold text-xs shadow-md hover:bg-amber-400`}>EOD</button>
            ) : (
               <button onClick={onLogout} title="Keluar" className={`w-12 h-12 rounded-full transition-all flex items-center justify-center bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white shadow-md`}><LogOut className="w-5 h-5 ml-1" /></button>
            )}
         </div>
      </div>
    </nav>
  );
}

import { 
  LayoutDashboard, ShoppingCart, Users, Package, Activity, 
  ReceiptText, Settings, LogOut, Store, Truck, Scan, Wallet, Landmark, CreditCard, BrainCircuit,
  Sun, Moon, Power, ShieldCheck, Zap, RefreshCw, Tablet
} from 'lucide-react';
import avatarLingLing from '../assets/lingling.png';

import { useAuth } from '../contexts/AuthContext';
import { useSessionStore } from '../store/useSessionStore';
import useUIStore from '../store/useUIStore';

export default function Sidebar() {
  const { activeView: activeTab, setActiveView: onTabChange, isDarkMode, toggleDarkMode } = useUIStore();
  const { currentUser, logout, isOwner, isManager } = useAuth();
  const { activeSession } = useSessionStore();

  // Temporary handlers (will be unified later if needed)
  const onOpenPettyCash = () => {
    // Logic for Petty Cash
  };
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dasbor', show: true },
    { id: 'cashier', icon: ShoppingCart, label: 'Kasir', show: true },
    { id: 'self_service', icon: Tablet, label: 'Kasir Mandiri', show: true },
    { id: 'accounting', icon: Landmark, label: 'Finansial', show: isOwner || isManager },
    { id: 'purchasing', icon: Truck, label: 'Kulakan', show: isOwner || isManager },
    { id: 'crm', icon: Users, label: 'Pelanggan', show: isOwner || isManager },
    { id: 'piutang', icon: CreditCard, label: 'Buku Bon', show: isOwner || isManager },
    { id: 'inventory', icon: Package, label: 'Produk', show: true },
    { id: 'cycle_count', icon: Scan, label: 'Opname', show: isOwner || isManager },
    { id: 'sync', icon: RefreshCw, label: 'Sync', show: isOwner || isManager },
    { id: 'monitoring', icon: Activity, label: 'Realtime', show: isOwner || isManager },
    { id: 'history', icon: ReceiptText, label: 'Arsip', show: true },
    { id: 'intelligence', image: avatarLingLing, label: 'Ling-Ling', show: isOwner || isManager }
  ].filter(item => item.show);

  return (
    <nav className="hidden lg:flex w-24 bg-brand-card/30 backdrop-blur-3xl flex-col items-center py-10 shrink-0 z-[600] border-r border-brand-border/40 transition-all duration-1000 relative">
      
      {/* BRANDING NODE */}
      <div className="mb-6 relative group">
         <div className="absolute inset-0 bg-brand-primary blur-2xl opacity-10 group-hover:opacity-30 transition-opacity"></div>
         <div className="w-14 h-14 bg-brand-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl relative z-10 group-hover:rotate-12 transition-transform">
            <Zap size={28} />
         </div>
      </div>

      {/* NEURAL NAVIGATION SPINE */}
      <div className="flex flex-col gap-1.5 flex-1 w-full px-3 overflow-y-auto hide-scrollbar">
        {navItems.map(menu => (
          <button 
            key={menu.id} 
            onClick={() => onTabChange(menu.id)} 
            className={`w-full py-2.5 rounded-2xl transition-all duration-500 flex flex-col items-center gap-2 group relative border ${
              activeTab === menu.id 
                ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-[inset_0_0_20px_rgba(var(--brand-primary-rgb),0.1)]' 
                : 'border-transparent text-brand-muted hover:text-brand-text hover:bg-brand-bg/50 hover:border-brand-border/50'
            }`}
          >
            {menu.image ? (
              <div className={`w-8 h-8 rounded-xl overflow-hidden border-2 ${activeTab === menu.id ? 'border-brand-primary shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.4)]' : 'border-brand-border'} transition-all duration-500 group-hover:scale-110`}>
                <img src={menu.image} alt={menu.label} className="w-full h-full object-cover" />
              </div>
            ) : (
              <menu.icon className={`w-6 h-6 transition-all duration-500 ${activeTab === menu.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.5)]' : 'group-hover:scale-110 group-hover:text-brand-text'}`} />
            )}
            
            <span className={`text-[8px] font-bold tracking-widest text-center leading-tight transition-colors duration-500 ${activeTab === menu.id ? 'text-brand-primary' : 'opacity-60'}`}>
              {menu.label}
            </span>

            {activeTab === menu.id && (
              <div className="absolute w-1.5 h-10 bg-brand-primary rounded-r-full left-0 top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.6)] animate-in slide-in-from-left-full duration-500" />
            )}
          </button>
        ))}
      </div>

      {/* CORE UTILITY CLUSTER */}
      <div className="mt-auto flex flex-col items-center gap-2 w-full px-3 pt-4 border-t border-brand-border/30">
         {activeSession && (
           <button onClick={onOpenPettyCash} className="w-full py-2.5 rounded-2xl bg-brand-bg/50 border border-brand-border text-brand-muted hover:text-brand-secondary hover:border-brand-secondary/40 transition-all shadow-inner group" title="Kas Keluar (Petty Cash)">
             <Wallet className="w-6 h-6 group-hover:scale-110 transition-transform"/>
           </button>
         )}
         
         {(isOwner || isManager) && (
           <button 
             onClick={() => onTabChange('settings')} 
             className={`w-full py-2.5 rounded-2xl transition-all duration-500 flex flex-col items-center gap-2 border ${
               activeTab === 'settings' 
                 ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-[inset_0_0_20px_rgba(var(--brand-primary-rgb),0.1)]' 
                 : 'border-transparent text-brand-muted hover:text-brand-text hover:bg-brand-bg/50 hover:border-brand-border/50'
            }`}
          >
            <Settings className={`w-6 h-6 transition-transform duration-1000 ${activeTab === 'settings' ? 'rotate-[360deg] scale-110 drop-shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.5)]' : 'group-hover:scale-110 group-hover:text-brand-text'}`} />
            <span className={`text-[8px] font-bold tracking-widest text-center leading-tight transition-colors duration-500 ${activeTab === 'settings' ? 'text-brand-primary' : 'opacity-60'}`}>
              Setelan
            </span>
          </button>
         )}

          <div className="w-full flex flex-col items-center gap-3 mt-4">
            <button 
              onClick={logout} 
              className="w-full py-2.5 rounded-2xl text-brand-muted hover:text-brand-primary hover:bg-brand-primary/5 transition-all flex flex-col items-center gap-2 group"
               title="Logout Session"
            >
              <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[8px] font-bold tracking-widest opacity-40">Keluar</span>
            </button>
            
            <button 
              onClick={() => window.api?.quitApp()} 
              className="w-full py-2.5 rounded-2xl text-brand-muted/40 hover:text-rose-500 hover:bg-rose-500/5 transition-all flex flex-col items-center gap-2 group"
               title="Decommission Terminal"
            >
              <Power className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold tracking-widest opacity-40">Matikan</span>
            </button>
          </div>
      </div>
      
      <style>{`
        :root {
          --brand-primary-rgb: 79, 70, 229;
        }
      `}</style>
    </nav>
  );
}

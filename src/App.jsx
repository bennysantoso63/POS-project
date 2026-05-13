import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { HardDrive } from 'lucide-react';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TransactionProvider, useTransactionContext } from './contexts/TransactionContext';

// Hooks
import { usePosData } from './hooks/usePosData';
import { useSembahyang } from './hooks/useSembahyang';

// Components
import Sidebar from './components/Sidebar';
import CockpitLayout from './components/CockpitLayout';
import CashierView from './components/CashierView';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import HistoryView from './components/HistoryView';
import CrmView from './components/CrmView';
import AccountingView from './components/AccountingView';
import IntelligenceView from './components/IntelligenceView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import { ReceiptModal } from './components/AdditionalModals';
import useUIStore from './store/useUIStore';

const AccessGuard = ({ canAccess, children, message = "Akses Ditolak" }) => {
  if (!canAccess) return <div className="p-12 text-center text-brand-text/60 italic">{message}</div>;
  return children;
};

// --- APP CONTENT (The Real Shell) ---
function AppContent({ fetchData, posData }) {
  const { 
    currentUser, needsSetup, login, logout, isOwner, isManager, role, isLoading: authLoading 
  } = useAuth();

  const { 
    cart, setCart, selectedCustomerId, setSelectedCustomerId, 
    receiptToPrint, setReceiptToPrint, handleCheckout, handleHoldBill, handleRestoreBill 
  } = useTransactionContext();

  const { 
    activeView, setActiveView, isDarkMode, toggleDarkMode 
  } = useUIStore();

  const { rfmData, aprioriRules, burnRate, bigBangData } = useSembahyang();
  const [setupForm, setSetupForm] = useState({ username: '', pin: '' });

  const { products, customers, transactions, settings, categories } = posData;

  const formatIDR = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#141E30] text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#141E30] text-white">
        <div className="bg-brand-card/10 p-12 rounded-[2rem] border border-brand-border flex flex-col items-center">
          <HardDrive className="w-12 h-12 mb-4 text-cyan-400"/>
          <h2 className="text-2xl font-bold mb-8">Setup Administrator</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const res = await window.api?.setupAdmin(setupForm);
            if (res?.success) { toast.success("Admin Berhasil Dibuat"); window.location.reload(); }
          }} className="space-y-4 w-64">
            <input type="text" placeholder="Username" required className="w-full p-3 rounded-xl bg-white/5 border border-white/10" onChange={e=>setSetupForm({...setupForm, username: e.target.value})} />
            <input type="password" placeholder="PIN (4 Digit)" maxLength="4" required className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xl tracking-widest" onChange={e=>setSetupForm({...setupForm, pin: e.target.value})} />
            <button type="submit" className="w-full py-3 bg-cyan-600 rounded-xl font-bold">Inisialisasi</button>
          </form>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={(pin) => login(pin)} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'cashier':      
        return (
          <CashierView 
            products={products} categories={categories} customers={customers} settings={settings} 
            cart={cart} setCart={setCart} selectedCustomerId={selectedCustomerId} setSelectedCustomerId={setSelectedCustomerId}
            onCheckout={handleCheckout} onHoldBill={handleHoldBill} onRestoreBill={handleRestoreBill}
          />
        );
      case 'dashboard':    return <DashboardView transactions={transactions} products={products} formatIDR={formatIDR} />;
      case 'inventory':    return <InventoryView products={products} categories={categories} />;
      case 'history':      return <HistoryView transactions={transactions} />;
      case 'crm':          return <CrmView customers={customers} />;
      case 'accounting':   
        return (
          <AccessGuard canAccess={isOwner || isManager} message="Modul Akuntansi hanya untuk Owner atau Manager.">
             <AccountingView transactions={transactions} />
          </AccessGuard>
        );
      case 'intelligence': 
        return (
          <AccessGuard canAccess={isOwner || isManager} message="Intel Ling-Ling hanya tersedia untuk level Manager ke atas.">
            <IntelligenceView rfmData={rfmData} aprioriRules={aprioriRules} burnRate={burnRate} bigBangData={bigBangData} />
          </AccessGuard>
        );
      case 'settings':     return <SettingsView settings={settings} />;
      default:             return <CashierView products={products} categories={categories} customers={customers} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-brand-bg text-brand-text flex overflow-hidden font-sans">
      <CockpitLayout userRole={role} terminalName={settings?.store_name || 'LING-LING POS'} onTabChange={setActiveView}>
        <Sidebar 
            activeTab={activeView} onTabChange={setActiveView} 
            currentUser={currentUser} onLogout={logout} 
            isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} 
            isOwner={isOwner} isManager={isManager} 
        />
        <main className="flex-1 overflow-hidden relative">
          {renderContent()}
        </main>
      </CockpitLayout>

      <ReceiptModal 
        show={!!receiptToPrint} receipt={receiptToPrint} settings={settings} 
        onPrint={(r) => { window.api?.printReceipt(r.data || r); setReceiptToPrint(null); }} 
        onClose={() => setReceiptToPrint(null)} 
      />
      
      <Toaster position="top-right" />
    </div>
  );
}

// --- ROOT APP ---
export default function App() {
  const posData = usePosData();
  const { fetchData, isLoading: posLoading } = posData;

  if (posLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#141E30] text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <TransactionProvider fetchData={fetchData}>
        <AppContent fetchData={fetchData} posData={posData} />
      </TransactionProvider>
    </AuthProvider>
  );
}

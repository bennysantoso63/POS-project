import React, { useState, useEffect, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { usePosData } from './hooks/usePosData';
import { useSembahyang } from './hooks/useSembahyang';

// Components
import Sidebar from './components/Sidebar';
import SessionOverlay from './components/SessionOverlay';
import CashierView from './components/CashierView';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import HistoryView from './components/HistoryView';
import CrmView from './components/CrmView';
import AccountingView from './components/AccountingView';
import IntelligenceView from './components/IntelligenceView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import CockpitLayout from './components/CockpitLayout';

export default function App() {
  const { 
    products, customers, transactions, sessions, settings, 
    categories, heldBills, expenses, isLoading, fetchData 
  } = usePosData();

  const { rfmData, aprioriRules, burnRate, bigBangData } = useSembahyang();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('cashier');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const isOwner   = useMemo(() => currentUser?.role === 'owner', [currentUser]);
  const isManager = useMemo(() => currentUser?.role === 'manager' || currentUser?.role === 'admin', [currentUser]);

  useEffect(() => {
    const html = window.document.documentElement;
    if (isDarkMode) html.classList.add('dark');
    else html.classList.remove('dark');
  }, [isDarkMode]);

  const handleLogin = async (pin) => {
    const res = await window.api?.login(pin);
    if (res?.success) {
      setCurrentUser(res.user);
      fetchData();
      setActiveTab(res.user.role === 'cashier' ? 'cashier' : 'dashboard');
      toast.success(`Selamat datang, ${res.user.username}`);
    } else {
      toast.error(res.error || "PIN Salah!");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#141E30] text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'cashier':      return <CashierView products={products} categories={categories} customers={customers} />;
      case 'dashboard':    return <DashboardView transactions={transactions} products={products} />;
      case 'inventory':    return <InventoryView products={products} />;
      case 'history':      return <HistoryView transactions={transactions} />;
      case 'crm':          return <CrmView customers={customers} />;
      case 'accounting':   return (isOwner || isManager) ? <AccountingView transactions={transactions} expenses={expenses} /> : <div className="p-8">Akses Ditolak</div>;
      case 'intelligence': return (isOwner || isManager) ? <IntelligenceView rfmData={rfmData} aprioriRules={aprioriRules} burnRate={burnRate} bigBangData={bigBangData} /> : <div className="p-8">Akses Ditolak</div>;
      case 'settings':     return <SettingsView settings={settings} />;
      default:             return <CashierView products={products} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-brand-bg text-brand-text flex overflow-hidden">
      <CockpitLayout 
        userRole={currentUser.role.toUpperCase()} 
        terminalName={settings?.store_name || 'LING-LING POS'}
        onTabChange={setActiveTab}
      >
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} currentUser={currentUser} onLogout={() => setCurrentUser(null)} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} isOwner={isOwner} isManager={isManager} />
        <main className="flex-1 overflow-hidden relative">
          {renderContent()}
        </main>
      </CockpitLayout>
      <Toaster position="top-right" />
    </div>
  );
}

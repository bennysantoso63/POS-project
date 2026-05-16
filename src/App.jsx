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
import PurchasingView from './components/PurchasingView';
import RelationsView from './components/RelationsView';
import CycleCountView from './components/CycleCountView';
import SyncView from './components/SyncView';
import MonitorView from './components/MonitorView';
import PettyCashModal from './components/PettyCashModal';
import useUIStore from './store/useUIStore';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{color:'white',background:'#141E30',padding:'20px',height:'100vh'}}>
          <h2>ERROR:</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}


const AccessGuard = ({ canAccess, children, message = "Akses Ditolak" }) => {
  if (!canAccess) return <div className="p-12 text-center text-brand-text/60 italic">{message}</div>;
  return children;
};

// --- APP CONTENT (The Real Shell) ---
function AppContent({ fetchData, posData }) {
  console.log('[APPCONTENT] Rendered, currentUser:', JSON.stringify(useAuth().currentUser));
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
  const [showPettyCash, setShowPettyCash] = useState(false);
  const [monitoringSubTab, setMonitoringSubTab] = useState('sessions');

  const { products, customers, transactions, settings, categories, sessions, movements } = posData;

  const handleCreatePO = async (data) => {
    const res = await window.api?.createPO?.(data);
    if (res?.success) { toast.success("PO Berhasil Dibuat"); fetchData(); }
    else toast.error(res?.error || "Gagal membuat PO");
  };

  const handleReceivePO = async (id, items) => {
    const res = await window.api?.receivePO?.(id, items);
    if (res?.success) { toast.success("Barang Diterima"); fetchData(); }
    else toast.error(res?.error || "Gagal menerima barang");
  };

  const handlePayPO = async (id, amount) => {
    const { activeSession } = useSessionStore.getState();
    const res = await window.api?.payPO?.(id, amount, activeSession?.id);
    if (res?.success) { toast.success("Pembayaran Dicatat"); fetchData(); }
    else toast.error(res?.error || "Gagal mencatat pembayaran");
  };

  const handlePettyCash = async (data) => {
    const { activeSession } = useSessionStore.getState();
    const res = await window.api?.recordExpense?.({ ...data, cashier_session_id: activeSession?.id });
    if (res?.success) { toast.success("Kas Keluar Dicatat"); fetchData(); }
    else toast.error(res?.error || "Gagal mencatat kas keluar");
    setShowPettyCash(false);
  };

  const handleRecordCustomerPayment = async (data) => {
    const { activeSession } = useSessionStore.getState();
    const res = await window.api?.recordPayment?.(data.customer_id, data, activeSession?.id);
    if (res?.success) { toast.success("Pembayaran Piutang Berhasil"); fetchData(); }
    else toast.error(res?.error || "Gagal mencatat pembayaran");
  };

  const handleAddCustomer = async (data) => {
    const res = await window.api?.addCustomer?.(data);
    if (res?.success) { toast.success("Pelanggan Ditambahkan"); fetchData(); }
    else toast.error(res?.error || "Gagal menambah pelanggan");
  };

  const handleApplyAdjustments = async (items) => {
    const res = await window.api?.applyAdjustments?.(items, currentUser?.username);
    if (res?.success) { toast.success("Stok Berhasil Disesuaikan"); fetchData(); }
    else toast.error(res?.error || "Gagal menyesuaikan stok");
  };

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
            formatIDR={formatIDR}
          />
        );
      case 'dashboard':    return <DashboardView transactions={transactions} products={products} formatIDR={formatIDR} />;
      case 'inventory':    return <InventoryView products={products} categories={categories} formatIDR={formatIDR} />;
      case 'history':      return <HistoryView transactions={transactions} formatIDR={formatIDR} />;
      case 'crm':          return <CrmView customers={customers} formatIDR={formatIDR} />;
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
      case 'settings':     return <SettingsView settings={settings} formatIDR={formatIDR} />;
      case 'purchasing':
        return (
          <AccessGuard canAccess={isOwner || isManager}
            message="Modul Kulakan hanya untuk Owner atau Manager.">
            <PurchasingView
              products={products}
              suppliers={posData.suppliers || []}
              purchaseOrders={posData.purchaseOrders || []}
              onCreatePO={handleCreatePO}
              onReceivePO={handleReceivePO}
              onPayPO={handlePayPO}
            />
          </AccessGuard>
        );

      case 'piutang':
        return (
          <AccessGuard canAccess={isOwner || isManager}
            message="Modul Piutang hanya untuk Owner atau Manager.">
            <RelationsView
              customers={customers}
              transactions={transactions}
              onRecordPayment={handleRecordCustomerPayment}
              onAddCustomer={handleAddCustomer}
              showToast={toast}
              formatIDR={formatIDR}
            />
          </AccessGuard>
        );

      case 'cycle_count':
        return (
          <AccessGuard canAccess={isOwner || isManager}
            message="Modul Opname hanya untuk Owner atau Manager.">
            <CycleCountView
              products={products}
              onApplyAdjustments={handleApplyAdjustments}
            />
          </AccessGuard>
        );

      case 'sync':
        return (
          <AccessGuard canAccess={isOwner || isManager}
            message="Modul Sinkronisasi hanya untuk Owner atau Manager.">
            <SyncView />
          </AccessGuard>
        );

      case 'monitoring':
        return (
          <AccessGuard canAccess={isOwner || isManager}
            message="Modul Monitor hanya untuk Owner atau Manager.">
            <MonitorView
              sessions={sessions}
              movements={movements}
              subTab={monitoringSubTab}
              onSubTabChange={setMonitoringSubTab}
              formatIDR={formatIDR}
            />
          </AccessGuard>
        );
      default:             return <CashierView products={products} categories={categories} customers={customers} formatIDR={formatIDR} />;
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
            onOpenPettyCash={() => setShowPettyCash(true)}
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
      
      <PettyCashModal
        show={showPettyCash}
        onSubmit={handlePettyCash}
        onClose={() => setShowPettyCash(false)}
      />
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
        <ErrorBoundary>
          <AppContent fetchData={fetchData} posData={posData} />
        </ErrorBoundary>
      </TransactionProvider>
    </AuthProvider>
  );
}

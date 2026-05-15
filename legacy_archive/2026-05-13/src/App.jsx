import React, { useState, useEffect, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { 
  HardDrive, Activity, Moon, Sun
} from 'lucide-react';
import { exportTransactionsToExcel } from './utils/exportUtils';
// Stores & Hooks
import { useSessionStore } from './store/useSessionStore';
import { usePosData } from './hooks/usePosData';

// Components
import Sidebar from './components/Sidebar';
import SessionOverlay from './components/SessionOverlay';
import CashierView from './components/CashierView';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import HistoryView from './components/HistoryView';
import CrmView from './components/CrmView';
import MonitorView from './components/MonitorView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import BarcodePrintModal from './components/BarcodePrintModal';
import CockpitLayout from './components/CockpitLayout';

// Modals
import { ProductModal, CustomerModal, SyncModal } from './components/Modals';
import { ReceiptModal, ExportModal } from './components/AdditionalModals';

// New Feature Components
import PurchasingView from './components/PurchasingView';
import CycleCountView from './components/CycleCountView';
import AccountingView from './components/AccountingView';
import RelationsView from './components/RelationsView';
import PettyCashModal from './components/PettyCashModal';
import IntelligenceView from './components/IntelligenceView';
import SyncView from './components/SyncView';
import { useSembahyang } from './hooks/useSembahyang';
import { AccessDenied } from './components/ui/AccessDenied';
import DevConsole from './components/DevConsole';

export default function App() {
  const { 
    products, customers, transactions, sessions, movements, settings, 
    suppliers, purchaseOrders, categories, heldBills, expenses, aprioriRules, isLoading, fetchData, stats 
  } = usePosData();

  const { rfmData, aprioriRules: sembahyangApriori, burnRate, bigBangData } = useSembahyang();

  const { activeSession, setSession, clearSession } = useSessionStore();
  const [opnameSelection, setOpnameSelection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('cashier');
  const [monitorTab, setMonitorTab] = useState('sessions');
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ username: '', pin: '' });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return true; // Force Dark Mode as requested
  });

  // --- RBAC LOGIC (3-Tier) ---
  const isOwner   = useMemo(() => currentUser?.role === 'owner', [currentUser]);
  const isManager = useMemo(() => currentUser?.role === 'manager' || currentUser?.role === 'admin', [currentUser]);
  const isKasir   = useMemo(() => currentUser?.role === 'cashier', [currentUser]);
  
  const canViewIntelligence = isOwner || isManager;
  const canViewAccounting   = isOwner || isManager;
  const canViewSettings     = isOwner || isManager;
  const canEditSettings     = isOwner;
  const canVoidTransaction  = isOwner || isManager;
  const canViewDashboardFull= isOwner;
  const canManageUsers      = isOwner;
  const canManagePurchasing = isOwner || isManager;
  const canManageReceivables= isOwner || isManager;
  const canDoOpname         = isOwner || isManager;

  // Lifting State Up: Cart & Customer (with LocalStorage Recovery)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('lingling_active_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    return localStorage.getItem('lingling_active_customer') || '';
  });

  useEffect(() => {
    localStorage.setItem('lingling_active_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('lingling_active_customer', selectedCustomerId);
  }, [selectedCustomerId]);
  
  // Export State
  const [exportFilter, setExportFilter] = useState('this_month');
  const [exportRange, setExportRange] = useState({ start: '', end: '' });
  
  useEffect(() => {
    const html = window.document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      window.document.title = "🌙 LING-LING POS (DARK)";
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      window.document.title = "☀️ LING-LING POS (LIGHT)";
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- AUTO-LOGOUT ENGINE (15m Inactivity) with THROTTLE ---
  useEffect(() => {
    if (!currentUser) return;

    let timeout;
    let lastReset = 0;

    const resetTimer = () => {
      // Throttle: Hanya eksekusi reset jika sudah lewat 5 detik dari reset terakhir
      const now = Date.now();
      if (now - lastReset < 5000) return; 
      
      lastReset = now;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        setCurrentUser(null);
        clearSession();
        toast("Session Expired: Security Auto-Lock Engaged", { icon: '🔒' });
      }, 15 * 60 * 1000); // 15 Minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer(); // Inisialisasi pertama

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [currentUser]);

  // Settings local state for real-time editing
  const [localSettings, setLocalSettings] = useState({
    name: '', slogan: '', phone: '', address: '', receiptFooter: '',
    tax_type: 'OP', tax_start_year: '2024', tax_rate: 0.5,
    business_type: 'retail'
  });

  useEffect(() => {
    const checkSetup = async () => {
      const res = await window.api?.checkSetup();
      setNeedsSetup(res);
    };
    checkSetup();
  }, []);

  useEffect(() => {
    if (settings) {
        setLocalSettings({
          name: settings.store_name || '',
          slogan: settings.store_slogan || '',
          phone: settings.store_phone || '',
          address: settings.store_address || '',
          receiptFooter: settings.receipt_footer || '',
          tax_type: settings.tax_type || 'OP',
          tax_start_year: settings.tax_start_year || '2024',
          tax_rate: settings.tax_rate || 0.5,
          business_type: settings.business_type || 'retail'
        });
    }
  }, [settings]);

  // Modals visibility
  const [modals, setModals] = useState({ 
    product: false, customer: false, sync: false, export: false, 
    draft: false, openShift: false, closeShift: false, pettyCash: false,
    confirmDelete: null, confirmDeleteCust: null 
  });
  const [forms, setForms] = useState({ 
    product: { sku: '', name: '', category: 'Makanan', stock_pcs: '', price_retail: '', price_wholesale: '', uom_box_multiplier: '' }, 
    customer: { name: '', phone: '', default_tier: 'eceran' } 
  });
  const [editing, setEditing] = useState({ product: null, customer: null });

  const formatIDR = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  // --- AUTH LOGIC ---
  const handleLogin = async (inputPin) => {
    setLoginError('');
    const res = await window.api?.login(inputPin);
    if (res?.success) {
      setCurrentUser(res.user);
      // Ensure data is fresh for the logged in user
      fetchData(); 
      
      if (res.user.role === 'admin' || res.user.role === 'owner' || res.user.role === 'manager') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('cashier');
      }
      toast.success(`Selamat datang, ${res.user.username}`);
    } else {
      setLoginError(res.error || "PIN Salah!");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      setCurrentUser(null);
      setCart([]);
      setSelectedCustomerId('');
      clearSession();
    }
  };

  const handleOpenShift = async (cash) => {
    const val = parseInt(cash.replace(/\D/g, '') || '0');
    const res = await window.api?.openSession(val);
    if (res?.success) { 
      setSession({ 
        id: res.id, 
        user_name: currentUser.username, 
        opening_cash: val, 
        expected_cash: val 
      }); 
      setModals({...modals, openShift: false});
      toast.success("Sesi dibuka"); 
      fetchData(); 
    } else {
      toast.error(res.error || "Gagal membuka sesi");
    }
  };

  const handleCloseShift = async (cash) => {
    const laciFisik = parseInt(cash.replace(/\D/g, '') || '0');
    const res = await window.api?.closeSession({ 
      sessionId: activeSession.id, 
      closingCash: laciFisik,
      notes: `Tutup oleh ${currentUser.username}`
    });
    if (res?.success) { 
      setReceiptToPrint({ 
        type: 'shift_report', 
        data: res // Menggunakan objek lengkap dari backend
      });
      clearSession(); 
      setCurrentUser(null); 
      setModals({...modals, closeShift: false}); 
      toast.success("Sesi ditutup"); 
      fetchData();
    } else {
      toast.error(res.error || "Gagal menutup sesi");
    }
  };

  // --- FEATURES HANDLERS ---
  const handleCheckout = async (txData) => {
    if (!activeSession && !isManager && !isOwner) return toast.error("Buka sesi dulu!");
    
    const res = await window.api?.processCheckout({
      ...txData,
      cashier_session_id: activeSession?.id || null,
      userName: currentUser.username
    });
    
    if (res?.success) {
      if (txData.payment_method === 'receivable') {
        await window.api?.createReceivable({
          transaction_id: res.txId,
          customer_id: txData.customer_id,
          amount: txData.total,
          due_date: txData.due_date,
          notes: `Bon dari Transaksi TX-${res.txId}`
        });
        toast.success("Piutang dicatat");
      }
      
      setReceiptToPrint({ 
        type: 'transaction', 
        data: { 
          id: `TX-${res.txId}`, 
          total: txData.total, 
          amountPaid: txData.paid_amount, 
          changeAmount: txData.change_amount, 
          items: txData.items, 
          created_at: new Date().toLocaleString(),
          payment_method: txData.payment_method
        } 
      });
      
      toast.success("Transaksi Berhasil"); 
      fetchData();
    } else {
      toast.error(res.error || "Gagal memproses transaksi");
    }
  };

  const handleRestoreBill = async (id) => {
    return await window.api?.restoreBill(id);
  };

  const handleHoldBill = async (cart, total) => {
    if (cart.length === 0) return;
    const label = prompt("Label Antrian:", `Antrian ${new Date().toLocaleTimeString()}`);
    if (!label) return;

    const res = await window.api?.holdBill({
      label,
      cartItems: cart
    });

    if (res?.success) {
      toast.success("Antrian disimpan");
      fetchData();
    } else {
      toast.error("Gagal menyimpan antrian");
    }
  };

  const handleAddSupplier = async (data) => {
    const res = await window.api?.createSupplier(data);
    if (res?.success) { toast.success("Supplier ditambahkan"); fetchData(); }
  };

  const handleCreatePO = async (data) => {
    const res = await window.api?.createPurchaseOrder(data);
    if (res?.success) { 
      setReceiptToPrint({ type: 'po', data: { ...data, id: res.id, po_number: data.poNumber, created_at: new Date().toLocaleString() } });
      toast.success("PO diterbitkan"); fetchData(); 
    }
  };

  const handleReceivePO = async (poId) => {
    const res = await window.api?.receivePurchaseOrder(poId);
    if (res?.success) { toast.success("Barang diterima & Stok diupdate"); fetchData(); }
  };

  const handlePettyCashSubmit = async (data) => {
    const res = await window.api?.createExpense({ 
      amount: data.amount,
      category: data.category || 'opex', // 'opex' | 'non_deductible' | 'prive'
      description: data.description,
      payment_method: data.payment_method || 'cash',
      cashier_session_id: activeSession?.id
    });
    if (res?.success) { 
      setModals({...modals, pettyCash: false});
      toast.success("Pengeluaran dicatat"); 
      fetchData(); 
    } else {
      toast.error(res.error || "Gagal mencatat pengeluaran");
    }
  };

  const handleApplyAdjustments = async (adjustments) => {
    const res = await window.api?.adjustStock(adjustments.map(a => ({ ...a, userName: currentUser.username })));
    if (res?.success) { toast.success("Stok Opname disimpan"); fetchData(); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await window.api?.invoke('api-save-settings', { data: localSettings, userId: currentUser.id });
      setSettings(localSettings);
      toast.success('Pengaturan berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan.');
    }
  };

  const handleExport = () => {
    const success = exportTransactionsToExcel(transactions, exportFilter);
    if (success) {
      setModals({...modals, export: false});
      toast.success("Laporan Excel berhasil diunduh!");
    } else {
      toast.error("Gagal membuat file Excel atau data kosong.");
    }
  };

  if (isLoading) {
    return (
      <div 
        style={{ minHeight: '100vh', backgroundColor: '#141E30' }}
        className="h-screen w-screen flex items-center justify-center bg-[#141E30]"
      >
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div 
        style={{ minHeight: '100vh', backgroundColor: '#141E30', color: '#ffffff' }}
        className="h-screen w-screen flex items-center justify-center bg-[#141E30] relative font-sans overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-primary/20 via-brand-bg to-brand-bg" />
        <div className="bg-brand-card/10 backdrop-blur-2xl p-12 rounded-[4rem] shadow-2xl w-full max-w-md flex flex-col items-center animate-in zoom-in-95 duration-500 border border-brand-border relative z-10">
          <div className="w-24 h-24 bg-brand-primary text-white rounded-3xl flex items-center justify-center mb-8 shadow-xl">
             <HardDrive className="w-12 h-12"/>
          </div>
          <h2 className="text-3xl font-bold text-brand-text mb-2 text-center tracking-tighter">Setup Awal</h2>
          <p className="text-xs text-brand-primary mb-8 font-bold text-center opacity-60">Daftarkan akun administrator pertama Anda</p>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const res = await window.api?.setupAdmin(setupForm);
            if (res?.success) {
              toast.success("Admin berhasil dibuat!");
              setNeedsSetup(false);
            } else {
              toast.error(res.error || "Gagal membuat admin");
            }
          }} className="w-full space-y-4">
            <input type="text" placeholder="Admin Username" required value={setupForm.username} onChange={e=>setSetupForm({...setupForm, username: e.target.value})} className="w-full bg-brand-bg/5 border border-brand-border rounded-2xl px-6 py-4 text-brand-text font-bold outline-none focus:border-brand-primary transition-all" />
            <input type="password" placeholder="Admin PIN (4 Digit)" required maxLength="4" value={setupForm.pin} onChange={e=>setSetupForm({...setupForm, pin: e.target.value.replace(/\D/g,'')})} className="w-full bg-brand-bg/5 border border-brand-border rounded-2xl px-6 py-4 text-brand-text font-bold text-center text-2xl tracking-[0.5em] outline-none focus:border-brand-primary transition-all" />
            <button type="submit" className="w-full py-4 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20">Mulai Sistem</button>
          </form>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#141E30' }}>
        <LoginView onLogin={handleLogin} error={loginError} />
        <Toaster position="top-right" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'cashier': return (
        <CashierView 
          products={products} 
          categories={categories}
          customers={customers} 
          heldBills={heldBills}
          settings={settings}
          activeSession={activeSession} 
          onCheckout={handleCheckout}
          onHoldBill={handleHoldBill}
          onRestoreBill={handleRestoreBill}
          onOpenShift={() => setModals({...modals, openShift: true})}
          showToast={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
          cart={cart}
          setCart={setCart}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          aprioriRules={aprioriRules}
          formatIDR={formatIDR}
        />
      );
      case 'dashboard': return <DashboardView transactions={transactions} products={products} formatIDR={formatIDR} onExport={() => setModals({...modals, export: true})} showFullFinancials={canViewDashboardFull} />;
      case 'accounting': 
        if (!canViewAccounting) return <AccessDenied message="Modul Akuntansi hanya untuk Owner atau Manager." />;
        return <AccountingView transactions={transactions} expenses={expenses} products={products} settings={settings} />;
      case 'inventory': return (
        <InventoryView 
          products={products} 
          transactions={transactions} 
          onAddProduct={async (data) => { await window.api?.addProduct(data); fetchData(); }} 
          onUpdateProduct={async (id, data) => { await window.api?.updateProduct(id, data, currentUser.id); fetchData(); }} 
          onDeleteProduct={async (p) => { if(confirm('Hapus produk ini?')) { await window.api?.deleteProduct(p.id || p); fetchData(); } }} 
          onStartOpname={(selected) => { 
            setOpnameSelection(Array.isArray(selected) ? selected : null); 
            setActiveTab('cycle_count'); 
          }} 
          onPrintLabel={(p) => setBarcodeProduct(p)}
          formatIDR={formatIDR} 
          currentUser={currentUser}
        />
      );
      case 'purchasing': 
        if (!canManagePurchasing) return <AccessDenied message="Akses ditolak." />;
        return (
        <PurchasingView 
          products={products} 
          suppliers={suppliers} 
          purchaseOrders={purchaseOrders} 
          onAddSupplier={handleAddSupplier} 
          onCreatePO={handleCreatePO} 
          onReceivePO={handleReceivePO} 
          onPayPO={async (id, data) => { await window.api?.payPurchaseOrder(id, { ...data, sessionId: activeSession?.id }); fetchData(); }}
          showToast={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
        />
      );
      case 'cycle_count': 
        if (!canDoOpname) return <AccessDenied message="Akses ditolak." />;
        return <CycleCountView products={products} onApplyAdjustments={handleApplyAdjustments} cycleCountHistory={[]} preSelected={opnameSelection} />;
      case 'crm': return <CrmView customers={customers} onAddCustomer={() => setModals({...modals, customer: true})} onEditCustomer={(c) => { setEditing({...editing, customer: c}); setForms({...forms, customer: c}); setModals({...modals, customer: true}); }} onDeleteCustomer={(c) => setModals({...modals, confirmDeleteCust: c})} formatIDR={formatIDR} />;
      case 'piutang': return (
        <RelationsView 
          customers={customers} 
          transactions={transactions} 
          onRecordPayment={async (data) => { await window.api?.recordPayment({ ...data, sessionId: activeSession?.id }); fetchData(); }} 
          onAddCustomer={async (data) => { await window.api?.addCustomer(data); fetchData(); }}
          showToast={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
          formatIDR={formatIDR}
        />
      );
      case 'history': return (
        <HistoryView 
          transactions={transactions} 
          onPrintReceipt={(tx) => setReceiptToPrint({ type: 'transaction', data: tx })} 
          onVoidTransaction={async (id, supervisorId) => { await window.api?.voidTransaction(id, supervisorId); fetchData(); }} 
          currentUser={currentUser} 
          showToast={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
        />
      );
      case 'sync': return (isOwner || isManager) ? <SyncView /> : <AccessDenied />;
      case 'monitoring': return <MonitorView sessions={sessions} movements={movements} subTab={monitorTab} onSubTabChange={setMonitorTab} formatIDR={formatIDR} />;
      case 'intelligence': return canViewIntelligence ? <IntelligenceView 
        currentUser={currentUser}
        transactions={transactions} 
        products={products} 
        customers={customers} 
        rfmData={rfmData} 
        aprioriRules={sembahyangApriori} 
        burnRate={burnRate} 
        bigBangData={bigBangData}
        formatIDR={formatIDR}
      /> : <AccessDenied />;

      case 'settings': 
        if (!canViewSettings) return <AccessDenied message="Akses ditolak." />;
        return <SettingsView config={localSettings} onConfigChange={setLocalSettings} onSave={handleSaveSettings} currentUser={currentUser} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} isOwner={isOwner} canEdit={canEditSettings} />;

      default: return (
        <CashierView 
          products={products} 
          categories={categories}
          customers={customers} 
          heldBills={heldBills}
          settings={settings}
          activeSession={activeSession} 
          onCheckout={handleCheckout}
          onHoldBill={handleHoldBill}
          onRestoreBill={handleRestoreBill}
          onOpenShift={() => setModals({...modals, openShift: true})}
          showToast={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
          cart={cart}
          setCart={setCart}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          aprioriRules={aprioriRules}
          formatIDR={formatIDR}
        />

      );
    }
  };

  return (
    <>
      <CockpitLayout 
        userRole={currentUser?.role === 'owner' ? 'OWNER' : 'CASHIER'} 
        terminalName={settings?.store_name || 'LING-LING POS'} 
        onTabChange={setActiveTab}
      >
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isOwner={isOwner}
          isManager={isManager}
          isKasir={isKasir}
          currentUser={currentUser} 
          activeSession={activeSession} 
          onLogout={handleLogout} 
          onCloseShift={() => setModals({...modals, closeShift: true})} 
          onOpenPettyCash={() => setModals({...modals, pettyCash: true})} 
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        
        <main className="flex-1 overflow-hidden transition-all duration-500 relative h-full bg-brand-bg">
          {renderContent()}
        </main>
      </CockpitLayout>

      <SessionOverlay 
        currentUser={currentUser} 
        onLogin={() => {}} 
        activeSession={activeSession} 
        showOpenShiftModal={modals.openShift} 
        onOpenShift={handleOpenShift} 
        showCloseShiftModal={modals.closeShift} 
        onCloseShift={handleCloseShift} 
        isLoading={isLoading} 
        storeConfig={{ serverIp: settings.server_ip || '127.0.0.1' }} 
        isSembahyangMode={settings?.business_type === 'sembahyang'}
      />
      <PettyCashModal show={modals.pettyCash} onSubmit={handlePettyCashSubmit} onClose={() => setModals({...modals, pettyCash: false})} />
      <ProductModal 
        show={modals.product} 
        editing={editing.product} 
        form={forms.product} 
        onChange={(f) => setForms({...forms, product: f})} 
        onSave={async (e) => { 
          e.preventDefault(); 
          const cleanForm = {
            ...forms.product,
            price_retail: parseInt(String(forms.product.price_retail).replace(/\D/g, '')) || 0,
            price_wholesale: parseInt(String(forms.product.price_wholesale).replace(/\D/g, '')) || 0,
            cost_price: parseInt(String(forms.product.cost_price).replace(/\D/g, '')) || 0,
            stock_pcs: parseInt(String(forms.product.stock_pcs).replace(/\D/g, '')) || 0
          };
          if (editing.product) {
            await window.api?.updateProduct(editing.product.id, cleanForm);
          } else {
            await window.api?.addProduct(cleanForm);
          }
          setModals({...modals, product: false}); 
          fetchData(); 
        }} 
        onClose={() => setModals({...modals, product: false})} 
        formatIDR={formatIDR} 
      />
      <CustomerModal 
        show={modals.customer} 
        editing={editing.customer} 
        form={forms.customer} 
        onChange={(f) => setForms({...forms, customer: f})} 
        onSave={async (e) => { 
          e.preventDefault(); 
          await window.api?.addCustomer(forms.customer); 
          setModals({...modals, customer: false}); 
          fetchData(); 
        }} 
        onClose={() => setModals({...modals, customer: false})} 
      />
      <SyncModal show={modals.sync} onSync={async (e) => { const reader = new FileReader(); reader.onload = async (ev) => { await window.api?.importCsv(ev.target.result); setModals({...modals, sync: false}); fetchData(); }; reader.readAsText(e.target.files[0]); }} onClose={() => setModals({...modals, sync: false})} />
      <ExportModal 
        show={modals.export} 
        filter={exportFilter} 
        onFilterChange={setExportFilter} 
        customRange={exportRange} 
        onCustomRangeChange={setExportRange} 
        onExport={handleExport} 
        onClose={() => setModals({...modals, export: false})} 
      />
      <ReceiptModal show={!!receiptToPrint} receipt={receiptToPrint} settings={settings} onPrint={(r) => { window.api?.printReceipt(r.data || r); setReceiptToPrint(null); }} onClose={() => setReceiptToPrint(null)} formatIDR={formatIDR} />
      <Toaster position="top-right" />
      <DevConsole />
    </>
  );
}

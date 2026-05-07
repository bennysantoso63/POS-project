import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { 
  HardDrive, Activity 
} from 'lucide-react';

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

// Modals
import { ProductModal, CustomerModal, SyncModal } from './components/Modals';
import { ReceiptModal } from './components/AdditionalModals';

// New Feature Components
import PurchasingView from './components/PurchasingView';
import CycleCountView from './components/CycleCountView';
import AccountingView from './components/AccountingView';
import RelationsView from './components/RelationsView';
import PettyCashModal from './components/PettyCashModal';

export default function App() {
  const { 
    products, customers, transactions, sessions, movements, settings, 
    suppliers, purchaseOrders, categories, heldBills, expenses, isLoading, fetchData, stats 
  } = usePosData();

  const { activeSession, setSession, clearSession } = useSessionStore();
  const [opnameSelection, setOpnameSelection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('cashier');
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [pin, setPin] = useState('');
  
  // Settings local state for real-time editing
  const [localSettings, setLocalSettings] = useState({
    name: '', slogan: '', phone: '', address: '', receiptFooter: '',
    tax_type: 'OP', tax_start_year: '2024'
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        name: settings.store_name || '',
        slogan: settings.store_slogan || '',
        phone: settings.store_phone || '',
        address: settings.store_address || '',
        receiptFooter: settings.receipt_footer || '',
        tax_type: settings.tax_type || 'OP',
        tax_start_year: settings.tax_start_year || '2024'
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
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!pin) return;
    
    const res = await window.electronAPI.login(pin);
    if (res.success) {
      setCurrentUser(res.user);
      if (res.user.role === 'admin') setActiveTab('dashboard');
      toast.success(`Selamat datang, ${res.user.username}`);
      setPin('');
    } else {
      toast.error(res.error || "PIN Salah!");
      setPin('');
    }
  };

  const handleOpenShift = async (cash) => {
    const val = parseInt(cash.replace(/\D/g, '') || '0');
    const res = await window.electronAPI.openSession(val);
    if (res.success) { 
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
    const res = await window.electronAPI.closeSession({ 
      sessionId: activeSession.id, 
      closingCash: laciFisik,
      notes: `Tutup oleh ${currentUser.username}`
    });
    if (res.success) { 
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
    if (!activeSession && currentUser.role !== 'admin') return toast.error("Buka sesi dulu!");
    
    // [KB] Jika metode adalah piutang, panggil API createReceivable setelah transaksi sukses
    const res = await window.electronAPI.createTransaction({
      ...txData,
      cashier_session_id: activeSession?.id || null,
      userName: currentUser.username
    });

    if (res.success) {
      if (txData.payment_method === 'receivable') {
        await window.electronAPI.createReceivable({
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
    return await window.electronAPI.restoreBill(id);
  };

  const handleHoldBill = async (cart, total) => {
    if (cart.length === 0) return;
    const label = prompt("Label Antrian:", `Antrian ${new Date().toLocaleTimeString()}`);
    if (!label) return;

    const res = await window.electronAPI.holdBill({
      label,
      cartItems: cart
    });

    if (res.success) {
      toast.success("Antrian disimpan");
      fetchData();
    } else {
      toast.error("Gagal menyimpan antrian");
    }
  };

  const handleAddSupplier = async (data) => {
    const res = await window.electronAPI.createSupplier(data);
    if (res.success) { toast.success("Supplier ditambahkan"); fetchData(); }
  };

  const handleCreatePO = async (data) => {
    const res = await window.electronAPI.createPurchaseOrder(data);
    if (res.success) { 
      setReceiptToPrint({ type: 'po', data: { ...data, id: res.id, po_number: data.poNumber, created_at: new Date().toLocaleString() } });
      toast.success("PO diterbitkan"); fetchData(); 
    }
  };

  const handleReceivePO = async (poId) => {
    const res = await window.electronAPI.receivePurchaseOrder(poId);
    if (res.success) { toast.success("Barang diterima & Stok diupdate"); fetchData(); }
  };

  const handlePettyCashSubmit = async (data) => {
    const res = await window.electronAPI.createExpense({ 
      amount: data.amount,
      category: data.category || 'opex', // 'opex' | 'non_deductible' | 'prive'
      description: data.description,
      payment_method: data.payment_method || 'cash',
      cashier_session_id: activeSession?.id
    });
    if (res.success) { 
      setModals({...modals, pettyCash: false});
      toast.success("Pengeluaran dicatat"); 
      fetchData(); 
    } else {
      toast.error(res.error || "Gagal mencatat pengeluaran");
    }
  };

  const handleApplyAdjustments = async (adjustments) => {
    const res = await window.electronAPI.adjustStock(adjustments.map(a => ({ ...a, userName: currentUser.username })));
    if (res.success) { toast.success("Stok Opname disimpan"); fetchData(); }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    const res = await window.electronAPI.updateSettings({
       store_name: localSettings.name,
       store_slogan: localSettings.slogan,
       store_phone: localSettings.phone,
       store_address: localSettings.address,
       receipt_footer: localSettings.receiptFooter,
       tax_type: localSettings.tax_type,
       tax_start_year: localSettings.tax_start_year
    });
    if (res.success) {
      toast.success("Pengaturan disimpan");
      fetchData();
    }
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center relative font-sans overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600/20 via-slate-950 to-slate-950" />
        <div className="bg-white/10 backdrop-blur-2xl p-12 rounded-[4rem] shadow-2xl w-full max-w-md flex flex-col items-center animate-in zoom-in-95 duration-500 border border-white/10 relative z-10">
          <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-blue-700 text-white rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/40 border-2 border-white/20">
             <HardDrive className="w-14 h-14"/>
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">POS <span className="text-indigo-500 font-black">MANDIRI</span></h1>
          <p className="text-[10px] font-black text-indigo-300 mb-12 tracking-[0.5em] uppercase opacity-80">Enterprise Deployment v2.4</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-8">
            <div className="relative group">
               <input 
                 type="password" 
                 autoFocus 
                 required 
                 value={pin} 
                 onChange={e=>setPin(e.target.value.replace(/\D/g,''))} 
                 className="w-full bg-white/5 border-2 border-white/10 text-white rounded-[2rem] py-6 text-center text-5xl font-black outline-none tracking-[0.5em] shadow-inner focus:border-indigo-400 focus:bg-white/10 transition-all backdrop-blur-md placeholder:text-white/10" 
                 placeholder="••••" 
                 maxLength="4" 
               />
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 rounded-full border border-indigo-400 shadow-lg">
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Enter Security PIN</span>
               </div>
            </div>
            
            <button type="submit" className="w-full py-6 bg-indigo-600 text-white font-black text-xl rounded-[2rem] hover:bg-indigo-500 active:scale-95 transition-all shadow-2xl shadow-indigo-600/30 border-t border-white/20">
              MASUK SISTEM
            </button>
            
            <div className="grid grid-cols-2 gap-4 text-center">
               <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Admin Access</p>
                  <p className="text-xs font-black text-white">PIN: 1234</p>
               </div>
               <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Cashier Access</p>
                  <p className="text-xs font-black text-white">PIN: 1111</p>
               </div>
            </div>
          </form>
          
          <div className="mt-12 flex items-center gap-2 opacity-30 group cursor-default">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Atomic Sync Service Running</span>
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
    );
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
        />
      );
      case 'dashboard': return <DashboardView transactions={transactions} products={products} formatIDR={formatIDR} onExport={() => setModals({...modals, export: true})} />;
      case 'accounting': return <AccountingView transactions={transactions} expenses={expenses} products={products} settings={settings} />;
      case 'inventory': return (
        <InventoryView 
          products={products} 
          transactions={transactions} 
          onAddProduct={async (data) => { await window.electronAPI.addProduct(data); fetchData(); }} 
          onUpdateProduct={async (id, data) => { await window.electronAPI.updateProduct(id, data); fetchData(); }} 
          onDeleteProduct={async (p) => { if(confirm('Hapus produk ini?')) { await window.electronAPI.deleteProduct(p.id || p); fetchData(); } }} 
          onStartOpname={(selected) => { setOpnameSelection(selected); setActiveTab('cycle_count'); }} 
          formatIDR={formatIDR} 
        />
      );
      case 'purchasing': return (
        <PurchasingView 
          products={products} 
          suppliers={suppliers} 
          purchaseOrders={purchaseOrders} 
          onAddSupplier={handleAddSupplier} 
          onCreatePO={handleCreatePO} 
          onReceivePO={handleReceivePO} 
          onPayPO={async (id, data) => { await window.electronAPI.recordPurchasePayment(id, data, activeSession?.id); fetchData(); }}
          showToast={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
        />
      );
      case 'cycle_count': return <CycleCountView products={products} onApplyAdjustments={handleApplyAdjustments} cycleCountHistory={[]} preSelected={opnameSelection} />;
      case 'crm': return <CrmView customers={customers} onAddCustomer={() => setModals({...modals, customer: true})} onEditCustomer={(c) => { setEditing({...editing, customer: c}); setForms({...forms, customer: c}); setModals({...modals, customer: true}); }} onDeleteCustomer={(c) => setModals({...modals, confirmDeleteCust: c})} formatIDR={formatIDR} />;
      case 'piutang': return (
        <RelationsView 
          customers={customers} 
          transactions={transactions} 
          onRecordPayment={async (data) => { await window.electronAPI.recordReceivablePayment(data.customer_id, { amount: data.amount, payment_method: data.payment_method, notes: data.notes }, activeSession?.id); fetchData(); }} 
          onAddCustomer={async (data) => { await window.electronAPI.addCustomer(data); fetchData(); }}
          showToast={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
        />
      );
      case 'history': return (
        <HistoryView 
          transactions={transactions} 
          onPrintReceipt={(tx) => setReceiptToPrint({ type: 'transaction', data: tx })} 
          onVoidTransaction={async (id) => { await window.electronAPI.voidTransaction(id); fetchData(); }} 
          currentUser={currentUser} 
          showToast={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
        />
      );
      case 'monitoring': return <MonitorView sessions={sessions} movements={movements} subTab="sessions" onSubTabChange={() => {}} formatIDR={formatIDR} />;
      case 'settings': return <SettingsView config={localSettings} onConfigChange={setLocalSettings} onSave={handleSaveSettings} />;
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
        />
      );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isAdmin={currentUser?.role === 'admin'} 
        currentUser={currentUser} 
        activeSession={activeSession} 
        onLogout={() => { setCurrentUser(null); setPin(''); }} 
        onCloseShift={() => setModals({...modals, closeShift: true})} 
        onOpenPettyCash={() => setModals({...modals, pettyCash: true})} 
      />
      
      <main className="flex-1 overflow-hidden bg-slate-50 relative rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/5">
        <div className="absolute top-4 right-8 z-50 flex items-center gap-4">
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${activeSession ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
              <Activity className={`w-3 h-3 ${activeSession ? 'animate-pulse' : ''}`}/>
              {activeSession ? `Shift Aktif: ${activeSession.user_name}` : 'Shift Closed'}
           </div>
        </div>

        {renderContent()}
      </main>

      <SessionOverlay currentUser={currentUser} onLogin={() => {}} activeSession={activeSession} showOpenShiftModal={modals.openShift} onOpenShift={handleOpenShift} showCloseShiftModal={modals.closeShift} onCloseShift={handleCloseShift} isLoading={isLoading} storeConfig={{ serverIp: settings.server_ip || '127.0.0.1' }} />
      <PettyCashModal show={modals.pettyCash} onSubmit={handlePettyCashSubmit} onClose={() => setModals({...modals, pettyCash: false})} />
      <ProductModal 
        show={modals.product} 
        editing={editing.product} 
        form={forms.product} 
        onChange={(f) => setForms({...forms, product: f})} 
        onSave={async (e) => { 
          e.preventDefault(); 
          if (editing.product) {
            await window.electronAPI.updateProduct({ ...forms.product, id: editing.product.id });
          } else {
            await window.electronAPI.addProduct(forms.product);
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
          await window.electronAPI.createCustomer(forms.customer); 
          setModals({...modals, customer: false}); 
          fetchData(); 
        }} 
        onClose={() => setModals({...modals, customer: false})} 
      />
      <SyncModal show={modals.sync} onSync={async (e) => { const reader = new FileReader(); reader.onload = async (ev) => { await window.electronAPI.importCsv(ev.target.result); setModals({...modals, sync: false}); fetchData(); }; reader.readAsText(e.target.files[0]); }} onClose={() => setModals({...modals, sync: false})} />
      <ReceiptModal show={!!receiptToPrint} receipt={receiptToPrint} settings={settings} onPrint={(r) => { window.electronAPI.printReceipt(r.data || r); setReceiptToPrint(null); }} onClose={() => setReceiptToPrint(null)} formatIDR={formatIDR} />
      <Toaster position="top-right" />
    </div>
  );
}

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, Minus, Trash2, Receipt, 
  Banknote, CreditCard, Users, PauseCircle, Package, 
  XCircle, AlertCircle, Barcode,
  ShoppingCart, Lock, Printer, Zap, Moon, TrendingUp,
  ChevronRight, QrCode, ArrowRight, Wallet, Sparkles, Filter, Globe, Activity, ShieldCheck, Box, ChevronDown, CheckCircle2,
  Workflow, Calendar
} from 'lucide-react';

import BarcodeScanner from './BarcodeScanner';
import toast from 'react-hot-toast';
import { useLunar } from '../hooks/useLunar';
import { useAuth } from '../contexts/AuthContext';
import useAnalyticsStore from '../store/useAnalyticsStore';
import { useTransactionContext } from '../contexts/TransactionContext';
import { useNotify } from '../hooks/useNotify';

import CustomDropdown from './ui/CustomDropdown';

export default function CashierView({ 
  products = [], 
  categories = [], 
  customers = [], 
  heldBills = [],
  settings = {},
  activeSession,
  onOpenShift,
  aprioriRules = [],
  formatIDR
}) {
  const { notifySuccess, notifyError, notifyInfo } = useNotify();
  const { currentUser } = useAuth();
  const { 
    cart, setCart, selectedCustomerId, setSelectedCustomerId,
    handleCheckout, handleHoldBill, handleRestoreBill
  } = useTransactionContext();
  const lunarInfo = useLunar();
  const isSembahyangMode = settings?.business_type === 'sembahyang';

  // =========================================================================
  // 🌙 SISTEM PENGINGAT HARI RAYA (Lunar Event Engine)
  // =========================================================================
  const getUpcomingLunarEvent = () => {
    if (!lunarInfo) return null;
    if (lunarInfo.isSembahyangDay && lunarInfo.currentEventName) {
      return { name: lunarInfo.currentEventName, daysLeft: 0 };
    }
    if (lunarInfo.nextEventName && lunarInfo.daysToNextEvent !== undefined) {
      return { name: lunarInfo.nextEventName, daysLeft: lunarInfo.daysToNextEvent };
    }
    return null;
  };


  // --- STATES ---
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [paidAmount, setPaidAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [applyTax, setApplyTax] = useState(false);
  const [applyService, setApplyService] = useState(false);

  const searchRef = useRef(null);

  // --- SHORTCUT KEYBOARD & SCANNER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'f2') {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if (e.key === 'Enter' && document.activeElement === searchRef.current) {
        const query = search.trim();
        if (!query) return;

        const exactMatch = products.find(p => 
          p.sku?.toLowerCase() === query.toLowerCase() || 
          p.barcode?.toLowerCase() === query.toLowerCase()
        );

        if (exactMatch) {
          handleAddToCart(exactMatch);
          setSearch(''); 
          notifySuccess(`Sistem: ${exactMatch.name} ditambahkan.`);
          return;
        }

        const results = products.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase())
        );
        if (results.length === 1) {
          handleAddToCart(results[0]);
          setSearch('');
          notifySuccess(`Produk ditambahkan: ${results[0].name}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [search, products, cart]);

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, [activeSession]);

  // =========================================================================
  // 🧠 SARAN AI: REKOMENDASI PENJUALAN
  // =========================================================================
  const lunarInsight = useMemo(() => {
    if (!selectedCustomerId || !customers?.length) return null;
    const customer = customers.find(c => c.id === parseInt(selectedCustomerId, 10));
    if (!customer) return null;

    const lunarEvent = getUpcomingLunarEvent();
    if (!lunarEvent) return null; 

    const timeText = lunarEvent.daysLeft === 0 ? "Hari ini" : lunarEvent.daysLeft === 1 ? "Besok" : "Lusa";
    return `${timeText} perayaan ${lunarEvent.name}! ${customer.name} biasanya butuh perlengkapan ekstra. Tawarkan sekarang?`;
  }, [selectedCustomerId, customers]);


  const aprioriSuggestion = useMemo(() => {
    if (cart.length === 0 || !aprioriRules?.length) return null;
    const lastItem = cart[cart.length - 1].name;
    const rule = aprioriRules.find(r => r.primary === lastItem);
    if (rule) {
      return `Saran Statis: Pelanggan yang beli ${lastItem} biasanya juga beli ${rule.secondary}. (Keyakinan: ${Math.round(rule.confidence)}%)`;
    }
    return null;
  }, [cart, aprioriRules]);

  // 🤖 LING-LING DATA SCIENCE: DYNAMIC RECOMMENDATIONS
  const [dsRecommendations, setDsRecommendations] = useState([]);

  useEffect(() => {
    if (cart.length === 0) {
      setDsRecommendations([]);
      return;
    }

    const fetchDsSuggestions = async () => {
      try {
        const barcodes = cart.map(item => item.barcode).filter(Boolean);
        if (barcodes.length > 0) {
          const suggestions = await window.api?.ds.getRecommendations(barcodes);
          setDsRecommendations(suggestions || []);
        }
      } catch (err) {
        console.error("Gagal mengambil rekomendasi DS:", err);
      }
    };

    fetchDsSuggestions();
  }, [cart.length]);
  
  // =========================================================================
  // 🚀 T6: APRIORI SMART BUNDLING ENGINE
  // =========================================================================
  const [activeBundling, setActiveBundling] = useState(null);
  
  useEffect(() => {
    if (!isSembahyangMode || cart.length === 0) {
      setActiveBundling(null);
      return;
    }
    
    const lastItem = cart[cart.length - 1];
    // Hanya picu jika item baru saja ditambahkan (qty === 1)
    if (lastItem.qty === 1) {
      const fetchSuggestion = async () => {
        try {
          const suggestion = await window.api?.sembahyang.getBundlingSuggestion(lastItem.id);
          if (suggestion) {
            setActiveBundling({
              primary: lastItem.name,
              secondary: suggestion.name,
              secondaryId: suggestion.id,
              confidence: Math.round(suggestion.confidence_pct),
              suggestion: suggestion
            });
            // Auto hide after 10 seconds
            setTimeout(() => setActiveBundling(null), 10000);
          }
        } catch (e) {
          console.error("Gagal mengambil saran bundling", e);
        }
      };
      fetchSuggestion();
    }
  }, [cart.length, isSembahyangMode]);


  // --- LOGIC: FILTER PRODUK ---
  const filteredProducts = useMemo(() => {
    if (search.trim() !== '') {
      const query = search.toLowerCase();
      return products.filter(p => 
        p.name?.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query)
      );
    }
    return products.filter(p => 
      activeCategory === 'Semua' || p.category === activeCategory
    );
  }, [products, search, activeCategory]);

  const activeCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // --- LOGIC: PERHITUNGAN TOTAL ---
  const billMetrics = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const price = activeCustomer?.default_tier === 'partai' 
        ? (item.price_wholesale || item.price_retail) 
        : item.price_retail;
      return sum + (price * item.qty);
    }, 0);
    
    let discountAmt = 0;
    if (discountType === 'percent') discountAmt = (subtotal * discountValue) / 100;
    if (discountType === 'nominal') discountAmt = discountValue;
    
    const afterDiscount = Math.max(0, subtotal - discountAmt);
    const taxAmt = applyTax ? afterDiscount * 0.10 : 0; 
    const serviceAmt = applyService ? afterDiscount * 0.05 : 0; 
    
    let grandTotal = afterDiscount + taxAmt + serviceAmt;
    
    const roundingMode = settings.rounding_mode || 'none';
    if (roundingMode === 'hundreds') grandTotal = Math.ceil(grandTotal / 100) * 100;
    else if (roundingMode === 'five_hundreds') grandTotal = Math.ceil(grandTotal / 500) * 500;
    else if (roundingMode === 'thousands') grandTotal = Math.ceil(grandTotal / 1000) * 1000;

    return { subtotal, discountAmt, taxAmt, serviceAmt, grandTotal };
  }, [cart, discountType, discountValue, applyTax, applyService, settings.rounding_mode, activeCustomer]);

  // --- LOGIC: KERANJANG BELANJA ---
  const handleAddToCart = (prod) => {
    if (prod.stock_pcs <= 0) return notifyError('Stok Habis!');

    setCart(prev => {
      const existing = prev.find(i => i.id === prod.id);
      if (existing) {
        if (existing.qty >= prod.stock_pcs) { 
          notifyError(`Stok ${prod.name} sudah maksimal.`); 
          return prev; 
        }
        return prev.map(i => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...prod, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        const stock = products.find(p => p.id === id)?.stock_pcs || 0;
        if (newQty > stock) { 
          notifyError("Melebihi stok yang ada!"); 
          return item; 
        }
        return { ...item, qty: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const getQuickCashSuggestions = () => {
    const total = billMetrics.grandTotal;
    if (total <= 0) return [];
    
    const suggestions = new Set([total]); 
    const denominations = [2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];

    denominations.forEach(d => {
        const suggestion = Math.ceil(total / d) * d;
        if (suggestion > total && suggestion <= total * 2) {
            suggestions.add(suggestion);
        }
    });

    return [...suggestions].sort((a,b)=>a-b).slice(0, 4);
  };

  const handleProcessHold = () => {
    if (cart.length === 0) {
      notifyError('Keranjang kosong, tunda pesanan dibatalkan.');
      return;
    }
    if (heldBills.length >= 10) {
      notifyError('Daftar tunggu penuh (Maks 10).');
      return;
    }

    const label = prompt("Masukkan Nama Antrian:", `Antrian-${Date.now().toString().slice(-4)}`);
    if (!label) return;
    handleHoldBill(cart, billMetrics.grandTotal);
    setDiscountType('none'); setDiscountValue(0); setApplyTax(false); setApplyService(false);
  };

  const handleProcessCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    let paid = billMetrics.grandTotal;
    if (paymentMethod === 'cash') {
      paid = parseInt(paidAmount) || 0;
      if (paid < billMetrics.grandTotal) return notifyError("Uang tidak cukup!");
    } else if (paymentMethod === 'receivable') {
      paid = 0; 
      if (!selectedCustomerId) return notifyError("Pilih nama pelanggan untuk hutang!");
      if (!dueDate) return notifyError("Tentukan tanggal jatuh tempo!");
    }

    const txData = {
      subtotal: billMetrics.subtotal,
      discount: billMetrics.discountAmt,
      tax: billMetrics.taxAmt,
      service: billMetrics.serviceAmt,
      total: billMetrics.grandTotal,
      amountPaid: paid,
      changeAmount: Math.max(0, paid - billMetrics.grandTotal),
      paymentMethod: paymentMethod,
      customerId: paymentMethod === 'receivable' ? selectedCustomerId : null,
      dueDate: paymentMethod === 'receivable' ? dueDate : null,
      sessionId: activeSession?.id || null,
      items: cart.map(i => ({
        product_id: i.id,
        name: i.name,
        qty: i.qty,
        price_at_transaction: activeCustomer?.default_tier === 'partai' ? (i.price_wholesale || i.price_retail) : i.price_retail
      }))
    };

    handleCheckout(txData);
    
    // 🚀 TAHAP 2: Invalidate Analytics Cache
    useAnalyticsStore.getState().invalidateStats();

    setCart([]); setDiscountType('none'); setDiscountValue(0); setApplyTax(false); setApplyService(false);
    setShowChargeModal(false); setPaidAmount(''); setSelectedCustomerId(''); setDueDate('');
  };

  return (
    <div className="flex h-full w-full bg-brand-bg text-brand-text font-sans overflow-hidden relative selection:bg-brand-primary/30 selection:text-white">
      
      {/* KOLOM 1: NAVIGASI KATEGORI */}
      <div className="w-36 bg-brand-bg border-r-2 border-brand-border flex flex-col items-center py-12 gap-10 shrink-0 overflow-y-auto custom-scrollbar relative z-30">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-bg via-brand-bg to-transparent pointer-events-none z-10"></div>
        
        <button 
          onClick={() => setActiveCategory('Semua')} 
          className={`flex flex-col items-center justify-center w-20 h-24 rounded-2xl transition-all relative group z-20 ${activeCategory === 'Semua' ? 'bg-brand-primary text-white shadow-[0_15px_30px_-5px_rgba(var(--brand-primary-rgb),0.4)] scale-105' : 'bg-brand-card/40 backdrop-blur-md text-brand-muted hover:text-brand-text border-2 border-brand-border hover:border-brand-primary/30 shadow-md'}`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${activeCategory === 'Semua' ? 'bg-white/20' : 'bg-brand-bg border border-brand-border'}`}>
               <Package size={20}/>
            </div>
            <span className="text-[9px] font-black tracking-widest opacity-80">Semua</span>
            {activeCategory === 'Semua' && (
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-in zoom-in duration-300" />
            )}
        </button>
        
        {categories.map((cat, idx) => {
            const catName = typeof cat === 'string' ? cat : cat?.name;
            const catId = typeof cat === 'string' ? `cat-${idx}` : cat?.id;
            
            return (
              <button 
                key={catId} 
                onClick={() => setActiveCategory(catName)} 
                className={`flex flex-col items-center justify-center w-20 h-24 rounded-2xl transition-all relative group z-20 ${activeCategory === catName ? 'bg-brand-primary text-white shadow-[0_15px_30px_-5px_rgba(var(--brand-primary-rgb),0.4)] scale-105' : 'bg-brand-card/40 backdrop-blur-md text-brand-muted hover:text-brand-text border-2 border-brand-border hover:border-brand-primary/30 shadow-md'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${activeCategory === catName ? 'bg-white/20' : 'bg-brand-bg border border-brand-border'}`}>
                   <Package size={20}/>
                </div>
                <span className="text-[8px] font-black tracking-tight text-center leading-tight px-1 line-clamp-2 opacity-80">{catName}</span>
                {activeCategory === catName && (
                   <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-in zoom-in duration-300" />
                )}
              </button>
            )
        })}

        {heldBills.length > 0 && (
            <div className="mt-auto border-t-2 border-brand-border w-full pt-10 flex flex-col items-center relative z-20">
              <button className="relative p-7 bg-brand-accent/10 text-brand-accent rounded-[2.5rem] hover:bg-brand-accent/20 transition-all group shadow-xl border-2 border-brand-accent/30 active:scale-90">
                  <PauseCircle size={32} />
                  <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center border-4 border-brand-bg shadow-2xl animate-bounce">
                    {heldBills.length}
                  </span>
                  
                  <div className="absolute bottom-0 left-24 w-80 bg-brand-card/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border-2 border-brand-border opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-[100] p-8 translate-x-10 group-hover:translate-x-4">
                    <div className="flex items-center gap-4 mb-8 border-b-2 border-brand-border pb-6">
                       <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
                          <PauseCircle size={24} />
                       </div>
                        <div>
                          <h4 className="text-[11px] font-bold tracking-wider text-brand-text leading-none mb-2">Daftar Tunggu</h4>
                          <p className="text-[9px] font-bold text-brand-muted tracking-widest opacity-50">Pesanan yang Ditunda</p>
                       </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-3">
                      {heldBills.map(b => (
                          <div key={b.id} onClick={async () => {
                            const restoredCart = await onRestoreBill(b.id);
                            setCart(restoredCart);
                            notifySuccess("Pesanan berhasil dipulihkan.");
                          }} className="p-5 bg-brand-bg/50 hover:bg-brand-accent/10 rounded-2xl cursor-pointer transition-all text-left group/item flex items-center justify-between border-2 border-transparent hover:border-brand-accent/30 shadow-sm">
                            <div>
                               <p className="text-xs font-bold text-brand-text group-hover/item:text-brand-accent tracking-tight">{b.label}</p>
                              <p className="text-[10px] font-bold text-brand-muted tracking-widest mt-2 flex items-center gap-2">
                                <Activity size={10} /> {new Date(b.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="w-10 h-10 bg-brand-card rounded-xl flex items-center justify-center group-hover/item:bg-brand-accent group-hover/item:text-white transition-all shadow-inner">
                               <ArrowRight size={18} />
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
              </button>
               <span className="text-[10px] font-bold text-brand-accent mt-4 tracking-widest opacity-60">Antrian</span>
            </div>
        )}
      </div>

      {/* KOLOM 2: CARI PRODUK */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* === FITUR 2: LUNAR WHISPER BANNER === */}
        {isSembahyangMode && (
          <div className={`px-12 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-center transition-all duration-700 animate-in slide-in-from-top-full ${
            lunarInfo.isSembahyangDay 
              ? 'bg-rose-600 text-white shadow-[0_10px_30px_rgba(225,29,72,0.3)]' 
              : 'bg-brand-primary/10 text-brand-primary border-b border-brand-primary/20'
          }`}>
            {lunarInfo.isSembahyangDay 
              ? `🔥 Hari ini ${lunarInfo.currentEventName} (${lunarInfo.lunarDateStr}) - Volume transaksi diprediksi tinggi!`
              : `🌙 ${lunarInfo.lunarDateStr} • ${lunarInfo.daysToNextEvent} Hari menuju ${lunarInfo.nextEventName}`
            }
          </div>
        )}

        <header className="px-12 py-10 bg-brand-bg/40 backdrop-blur-xl flex flex-col gap-8 z-20 shrink-0 border-b-2 border-brand-border shadow-sm relative">
          <div className="absolute top-0 right-0 p-24 opacity-[0.02] pointer-events-none group-hover:scale-150 transition-transform duration-1000 rotate-12">
             <Activity size={200} className="text-brand-primary" />
          </div>

          <div className="flex flex-col gap-3 relative z-10">
             <span className="text-[9px] font-black text-brand-primary tracking-wider ml-2 opacity-60 flex items-center gap-3">
                <Search size={12} /> Cari Produk atau Barcode
             </span>
             <div className="relative group w-full">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-primary/60 group-focus-within:text-brand-primary transition-all duration-500" />
                <input 
                  ref={searchRef} 
                  type="text" 
                  placeholder="Scan barcode atau ketik nama produk di sini..." 
                  value={search} 
                  onChange={(e)=>setSearch(e.target.value)} 
                  className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2.5rem] py-6 pl-20 pr-24 text-sm font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-xl placeholder:text-brand-text/30 hover:bg-white/80 dark:hover:bg-white/20 tracking-wider" 
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                   <div className="px-4 py-2 bg-brand-bg border-2 border-brand-border rounded-xl text-[10px] font-black text-brand-muted tracking-widest shadow-sm">F2</div>
                   <Barcode className="w-8 h-8 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
             <span className="text-[9px] font-black text-brand-primary tracking-wider ml-2 opacity-60 flex items-center gap-3">
                <Users size={12} /> Identitas Pelanggan (CRM)
             </span>
             <CustomDropdown 
               value={selectedCustomerId} 
               onChange={setSelectedCustomerId} 
               options={customers.map(c => ({ value: c.id, label: c.name }))} 
               placeholder="-- Pilih Pelanggan (Umum) --"
               icon={<Users size={20} />}
             />
          </div>
        </header>

        {/* ALIRAN SARAN AI */}
        <div className="flex flex-col gap-6 py-8 px-12 shrink-0 bg-brand-bg/20">
          {lunarInsight && (
            <div className="p-6 bg-brand-accent/10 border-2 border-brand-accent/20 rounded-[3rem] flex items-center gap-8 animate-in slide-in-from-top-8 duration-1000 shadow-2xl shadow-brand-accent/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-1000 group-hover:scale-150 rotate-12"><Moon size={100} /></div>
              <div className="w-16 h-16 bg-brand-card rounded-[1.8rem] shrink-0 shadow-inner flex items-center justify-center border-2 border-brand-accent/30 group-hover:scale-110 transition-transform">
                 <Moon className="w-8 h-8 text-brand-accent"/>
              </div>
              <div className="flex-1 relative z-10">
                 <div className="flex items-center gap-3 mb-2">
                     <span className="px-3 py-1 bg-brand-accent/20 text-brand-accent text-[9px] font-bold rounded-lg tracking-widest border border-brand-accent/30">Saran Hari Raya</span>
                  </div>
                  <p className="text-sm font-bold text-brand-text tracking-tight leading-relaxed">{lunarInsight}</p>
              </div>
              <button className="relative z-10 px-8 py-4 bg-brand-accent text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_15px_30px_-10px_rgba(var(--brand-accent-rgb),0.5)] active:scale-95 transition-all hover:bg-brand-secondary">Gunakan Saran</button>
            </div>
          )}

          {/* 🚀 DYNAMIC AI RECOMMENDATIONS (LING-LING ENGINE) */}
          {dsRecommendations.map((rec, idx) => (
            <div key={`ds-rec-${idx}`} className="p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[3rem] flex items-center gap-8 animate-in slide-in-from-right-8 duration-500 shadow-2xl shadow-emerald-500/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-1000 group-hover:rotate-45 group-hover:scale-150"><Zap size={100} className="text-emerald-500" /></div>
              <div className="w-16 h-16 bg-brand-card rounded-[1.8rem] shrink-0 shadow-inner flex items-center justify-center border-2 border-emerald-500/30 group-hover:scale-110 transition-transform">
                 <Zap className="w-8 h-8 text-emerald-500"/>
              </div>
              <div className="flex-1 relative z-10">
                 <div className="flex items-center gap-3 mb-2">
                     <span className="px-3 py-1 bg-emerald-500/20 text-emerald-500 text-[9px] font-bold rounded-lg tracking-widest border border-emerald-500/20">Saran Cerdas Ling-Ling</span>
                  </div>
                  <p className="text-sm font-bold text-brand-text tracking-tight leading-relaxed">
                    Beli <span className="text-emerald-500">{rec.name}</span> juga? Produk ini dibeli bersamaan sebanyak <span className="font-black">{rec.frequency}x</span>.
                  </p>
              </div>
              <button 
                onClick={() => {
                  const prod = products.find(p => p.barcode === rec.product_barcode);
                  if (prod) handleAddToCart(prod);
                }}
                className="relative z-10 px-8 py-4 bg-emerald-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all hover:bg-emerald-600"
              >
                Tambah
              </button>
            </div>
          ))}

          {aprioriSuggestion && (
            <div className="p-6 bg-brand-primary/10 border-2 border-brand-primary/20 rounded-[3rem] flex items-center gap-8 animate-in slide-in-from-top-8 duration-1000 shadow-2xl shadow-brand-primary/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-1000 group-hover:rotate-45 group-hover:scale-150"><Sparkles size={100} /></div>
              <div className="w-16 h-16 bg-brand-card rounded-[1.8rem] shrink-0 shadow-inner flex items-center justify-center border-2 border-brand-primary/30 group-hover:scale-110 transition-transform">
                 <Sparkles className="w-8 h-8 text-brand-primary"/>
              </div>
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-2">
                     <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary text-[9px] font-bold rounded-lg tracking-widest border border-brand-primary/20">Rekomendasi Tambahan</span>
                  </div>
                  <p className="text-sm font-bold text-brand-text tracking-tight leading-relaxed">{aprioriSuggestion}</p>
              </div>
            </div>
          )}

          {activeBundling && (
            <div className="p-6 bg-brand-primary border-2 border-white/20 rounded-[3rem] flex items-center gap-8 animate-in slide-in-from-right-8 duration-1000 shadow-2xl shadow-brand-primary/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-all duration-1000 group-hover:rotate-45 group-hover:scale-150"><Zap size={100} className="text-white" /></div>
              <div className="w-16 h-16 bg-white/20 rounded-[1.8rem] shrink-0 shadow-inner flex items-center justify-center border-2 border-white/30 group-hover:scale-110 transition-transform">
                 <Sparkles className="w-8 h-8 text-white"/>
              </div>
              <div className="flex-1 relative z-10">
                 <div className="flex items-center gap-3 mb-2">
                     <span className="px-3 py-1 bg-white/20 text-white text-[9px] font-bold rounded-lg tracking-widest border border-white/30">Smart Bundling ({activeBundling.confidence}%)</span>
                  </div>
                  <p className="text-sm font-bold text-white tracking-tight leading-relaxed">
                    Pembeli <span className="underline decoration-white/30">{activeBundling.primary}</span> biasanya juga mengambil <span className="text-brand-accent font-black">{activeBundling.secondary}</span>. Tawarkan sekarang?
                  </p>
              </div>
              <button 
                onClick={() => {
                  const prod = products.find(p => p.id === activeBundling.secondaryId);
                  if (prod) handleAddToCart(prod);
                  setActiveBundling(null);
                }}
                className="relative z-10 px-8 py-4 bg-white text-brand-primary rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all hover:bg-brand-accent hover:text-white"
              >
                Tambah Ke Keranjang
              </button>
              <button onClick={() => setActiveBundling(null)} className="p-2 text-white/60 hover:text-white transition-colors relative z-10">
                 <XCircle size={20} />
              </button>
            </div>
          )}
        </div>

        {/* GRID PRODUK */}
        <div className="flex-1 overflow-y-auto p-12 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10 content-start custom-scrollbar relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--brand-primary-rgb)_0%,transparent_40%)] opacity-[0.03] pointer-events-none"></div>
          {filteredProducts.map(p => {
            const inCart = cart.find(i => i.id === p.id)?.qty || 0;
            const available = p.stock_pcs - inCart;
            const isLowStock = available <= (settings.low_stock_threshold || 10);
            const isOutOfStock = available <= 0;

            return (
              <button 
                key={p.id} 
                onClick={() => handleAddToCart(p)} 
                disabled={isOutOfStock}
                className={`bg-brand-card/60 backdrop-blur-md rounded-[4rem] p-10 border-2 text-left flex flex-col h-72 relative overflow-hidden transition-all shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)]
                  ${isOutOfStock 
                    ? 'opacity-40 grayscale cursor-not-allowed border-brand-border bg-brand-bg/50' 
                    : 'border-transparent hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] hover:border-brand-primary hover:-translate-y-3 active:scale-95 group'}`
                }>
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-0 group-hover:opacity-10 group-hover:scale-150 transition-all duration-1000 bg-brand-primary"></div>
                
                {isLowStock && !isOutOfStock && (
                   <div className="absolute top-8 right-8">
                      <div className="flex h-4 w-4 relative">
                         <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></div>
                         <div className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
                      </div>
                   </div>
                )}
                
                <div className="mb-6 z-10 flex items-center justify-between">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isOutOfStock ? 'bg-brand-bg border-brand-border text-brand-muted' : 'bg-brand-bg border-brand-border text-brand-primary group-hover:bg-brand-primary group-hover:text-white shadow-inner'}`}>
                      <Box size={24} />
                   </div>
                   {!isOutOfStock && (
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] opacity-40 leading-none mb-1">Stok</span>
                         <span className={`text-sm font-black tracking-tight ${isLowStock ? 'text-rose-500' : 'text-brand-text'}`}>{available}</span>
                      </div>
                   )}
                </div>

                <h3 className={`font-bold text-lg tracking-tight line-clamp-2 leading-none mb-6 z-10 transition-all duration-500 ${isOutOfStock ? 'text-brand-muted italic' : 'text-brand-text group-hover:text-brand-primary group-hover:translate-x-1'}`}>
                   {p.name}
                </h3>
                
                <div className="mt-auto flex items-end justify-between z-10 w-full relative">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-2 opacity-50 flex items-center gap-1.5">
                           Harga
                           {activeCustomer?.default_tier === 'partai' && p.price_wholesale > 0 && (
                             <span className="text-[8px] text-amber-500 font-bold tracking-normal uppercase">(Grosir)</span>
                           )}
                        </span>
                       <span className={`font-black text-3xl tracking-tighter leading-none ${isOutOfStock ? 'text-brand-muted' : 'text-brand-accent group-hover:scale-110 transition-transform origin-left'}`}>
                          {formatIDR(activeCustomer?.default_tier === 'partai' ? (p.price_wholesale || p.price_retail) : p.price_retail)}
                       </span>
                    </div>
                    {!isOutOfStock && (
                       <div className="w-14 h-14 bg-brand-primary text-white rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 shadow-2xl shadow-brand-primary/60 scale-0 group-hover:scale-100 duration-500 active:scale-90">
                          <Plus size={28} />
                       </div>
                    )}
                </div>
                
                {isOutOfStock && (
                   <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <span className="px-6 py-2 bg-brand-bg/80 border-2 border-brand-border text-brand-muted text-[10px] font-black uppercase tracking-[0.5em] rounded-full backdrop-blur-sm -rotate-12 border-dashed">Stok Habis</span>
                   </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* KOLOM 3: DAFTAR BELANJA (Manifest) */}
      <div className="w-full lg:w-[400px] xl:w-[500px] bg-brand-card/80 backdrop-blur-3xl flex flex-col shadow-[0_0_150px_-20px_rgba(0,0,0,0.4)] shrink-0 z-40 border-l-2 border-brand-border transition-all">
        <div className="p-12 border-b-2 border-brand-border flex justify-between items-center bg-brand-card shrink-0 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none"><Workflow size={200} /></div>
          <div className="flex items-center gap-6 relative z-10">
             <div className="w-16 h-16 bg-brand-primary rounded-[1.8rem] flex items-center justify-center shadow-[0_15px_30px_-5px_rgba(var(--brand-primary-rgb),0.5)] border-2 border-white/10 group">
                <ShoppingCart size={32} className="text-white group-hover:scale-110 transition-transform duration-500"/>
             </div>
             <div>
                <h2 className="font-black text-3xl text-brand-text tracking-tighter leading-none mb-3">Daftar Belanja</h2>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-60">{cart.length} Jenis Produk Terpilih</p>
                   {activeCustomer && (
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ml-2 ${
                        activeCustomer.default_tier === 'partai' 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                          : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                      }`}>
                        {activeCustomer.default_tier === 'partai' ? 'Harga Grosir (Partai)' : 'Harga Eceran'}
                      </span>
                    )}
                </div>
             </div>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} aria-label="Bersihkan Keranjang" className="w-16 h-16 flex items-center justify-center bg-brand-bg border-2 border-brand-border hover:bg-rose-500/10 text-brand-muted hover:text-rose-500 hover:border-rose-500/30 rounded-[1.8rem] transition-all active:scale-90 shadow-xl group/trash relative z-10">
               <Trash2 size={24} className="group-hover/trash:rotate-12 transition-transform" />
            </button>
          )}
        </div>
        
        {/* LIST BARANG DALAM KERANJANG */}
        <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar bg-brand-bg/10 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none">
             <Globe size={400} />
          </div>
          {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-10 scale-110">
                <div className="w-32 h-32 bg-brand-bg rounded-[3rem] border-4 border-dashed border-brand-border flex items-center justify-center mb-10">
                   <ShoppingCart size={60} className="text-brand-muted" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.6em] text-brand-text">Belum Ada Barang</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] mt-4 text-brand-muted">Scan barcode produk untuk memulai</p>
             </div>
          ) : cart.map(item => (
            <div key={item.id} className="bg-brand-card/60 backdrop-blur-md rounded-[3.5rem] p-8 border-2 border-brand-border shadow-2xl shadow-black/5 flex flex-col gap-8 transition-all hover:border-brand-primary/40 group/cart-item relative overflow-hidden animate-in slide-in-from-right-8 duration-500">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover/cart-item:scale-150 transition-transform duration-1000 rotate-12"><Activity size={100} /></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex-1 pr-6">
                   <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[9px] font-bold rounded-lg border border-brand-primary/20 tracking-widest">{item.category || 'Barang'}</span>
                   </div>
                   <p className="font-bold text-lg text-brand-text tracking-tight line-clamp-2 leading-none group-hover/cart-item:text-brand-primary transition-colors flex items-center gap-3">
                      {item.name}
                      {isSembahyangMode && item.is_anchor_item === 1 && (
                        <span className="bg-brand-primary/10 text-brand-primary text-[8px] px-2 py-0.5 rounded-full border border-brand-primary/30 flex items-center gap-1.5" title="Barang Jangkar Utama">
                           <ShieldCheck size={10} /> KVI
                        </span>
                      )}
                   </p>
                   {isSembahyangMode && item.is_anchor_item === 1 && billMetrics.discountAmt > 0 && (
                      <p className="text-[8px] text-rose-500 font-black mt-3 animate-pulse tracking-widest uppercase">
                        ⚠️ Margin KVI Ketat • Hindari Diskon Tambahan
                      </p>
                   )}
                   <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-4 opacity-50 flex items-center gap-3">
                     <span className="text-brand-primary font-black">
                       @ {formatIDR(activeCustomer?.default_tier === 'partai' ? (item.price_wholesale || item.price_retail) : item.price_retail)}
                       {activeCustomer?.default_tier === 'partai' && item.price_wholesale > 0 && (
                         <span className="text-[8px] text-amber-500 font-bold ml-2">(Grosir)</span>
                       )}
                     </span>
                     <span className="w-1.5 h-1.5 rounded-full bg-brand-border"></span>
                     <span>SKU: {item.sku}</span>
                   </p>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-2 opacity-50">Total Baris</span>
                   <p className="font-black text-brand-text text-2xl tracking-tighter group-hover/cart-item:text-brand-accent transition-all duration-500">
                     {formatIDR(item.qty * (activeCustomer?.default_tier === 'partai' ? (item.price_wholesale || item.price_retail) : item.price_retail))}
                   </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center relative z-10 border-t-2 border-brand-border pt-6">
                <div className="flex items-center gap-3 bg-brand-bg/50 border-2 border-brand-border rounded-[2rem] p-2 shadow-inner">
                  <button onClick={() => updateQty(item.id, -1)} className="w-12 h-12 bg-brand-card rounded-2xl flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-brand-muted shadow-xl transition-all active:scale-90 border-2 border-brand-border shadow-black/5"><Minus size={18}/></button>
                  <span className="w-16 text-center font-bold text-2xl text-brand-text tracking-tighter">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-12 h-12 bg-brand-card rounded-2xl flex items-center justify-center hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 text-brand-muted shadow-xl transition-all active:scale-90 border-2 border-brand-border shadow-black/5"><Plus size={18}/></button>
                </div>
                <button onClick={() => updateQty(item.id, -item.qty)} aria-label="Hapus" className="w-12 h-12 flex items-center justify-center text-brand-muted hover:text-rose-500 transition-all opacity-0 group-hover/cart-item:opacity-100 hover:bg-rose-500/10 rounded-2xl border-2 border-transparent hover:border-rose-500/30">
                   <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}

          {aprioriRules?.length > 0 && cart.length > 0 && (() => {
            const cartIds = cart.map(i => i.id);
            const suggestions = aprioriRules.filter(r =>
              cartIds.includes(r.item_a_id) && !cartIds.includes(r.item_b_id)
            ).slice(0, 3);

            if (!suggestions.length) return null;
            return (
              <div className="mt-3 p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                <p className="text-[8px] font-black text-brand-primary tracking-[0.2em] uppercase mb-2">
                  ✨ Sering Dibeli Bersama
                </p>
                {suggestions.map((s, i) => (
                  <p key={i} className="text-[10px] text-brand-muted mb-1">
                    + {s.item_b_name}
                  </p>
                ))}
              </div>
            );
          })()}
        </div>
        
        {/* PANEL PEMBAYARAN */}
        <div className="p-12 bg-brand-card/90 backdrop-blur-3xl border-t-2 border-brand-border shrink-0 shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.3)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"></div>
          
          <div className="space-y-6 mb-12">
            <div className="flex justify-between items-center text-[11px] font-bold tracking-widest text-brand-muted group">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-muted group-hover:bg-brand-primary transition-colors"></div>
                  <span>Total Harga Barang</span>
               </div>
               <span className="text-brand-text tracking-widest">{formatIDR(billMetrics.subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center group/disc">
                <button onClick={() => {
                  const val = prompt("Masukkan Diskon (contoh: 5000 atau 10%):");
                  if(!val) return;
                  if(val.includes('%')) { setDiscountType('percent'); setDiscountValue(parseFloat(val)); }
                  else { setDiscountType('nominal'); setDiscountValue(parseFloat(val)); }
                }} className="text-[11px] font-bold tracking-widest text-brand-primary hover:text-brand-secondary transition-all flex items-center gap-4 group/btn">
                  <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center group-hover/btn:rotate-90 transition-transform">
                     <Plus size={16} />
                  </div>
                  Tambah Diskon Toko
                </button>
                {billMetrics.discountAmt > 0 && <span className="text-rose-500 font-black text-sm tracking-widest bg-rose-500/10 px-4 py-1.5 rounded-xl border border-rose-500/20 shadow-sm animate-in slide-in-from-right-4">-{formatIDR(billMetrics.discountAmt)}</span>}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-brand-border/30">
                <label className="flex items-center gap-5 cursor-pointer group">
                  <div className={`w-14 h-8 rounded-full p-1.5 transition-all duration-500 shadow-inner ${applyTax ? 'bg-brand-primary shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.5)]' : 'bg-brand-bg border-2 border-brand-border'}`}>
                     <div className={`w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${applyTax ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" checked={applyTax} onChange={e=>setApplyTax(e.target.checked)} className="hidden" />
                  <div className="flex flex-col">
                     <span className="text-[11px] font-bold tracking-widest text-brand-muted group-hover:text-brand-primary transition-colors leading-none mb-1">Pajak (PPN 10%)</span>
                     <span className="text-[9px] font-bold text-brand-muted opacity-40 tracking-widest leading-none">Pajak Aktif</span>
                  </div>
                </label>
                {applyTax && <span className="text-brand-text font-black text-sm tracking-widest bg-brand-primary/10 px-4 py-1.5 rounded-xl border border-brand-primary/20 shadow-sm animate-in zoom-in-95">+{formatIDR(billMetrics.taxAmt)}</span>}
            </div>
          </div>

          <div className="flex justify-between items-end mb-12 p-10 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-[3rem] border-2 border-brand-primary/20 shadow-inner relative overflow-hidden group/total hover:border-brand-primary/40 transition-all duration-700">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--brand-primary-rgb)_0%,transparent_50%)] opacity-10"></div>
            <div className="flex flex-col relative z-10">
               <span className="text-[11px] font-bold tracking-widest text-brand-muted mb-4 opacity-50 flex items-center gap-3">
                  <Activity size={12} className="text-brand-primary" /> Total Bayar
               </span>
               <span className={`text-6xl font-black tracking-tighter leading-none transition-all duration-700 origin-left ${billMetrics.grandTotal > 0 ? 'text-brand-accent drop-shadow-[0_0_30px_rgba(var(--brand-accent-rgb),0.4)] scale-105' : 'text-brand-text opacity-40'}`}>
                  {formatIDR(billMetrics.grandTotal)}
               </span>
            </div>
            <div className="flex flex-col items-end relative z-10">
               <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center border-2 transition-all duration-700 mb-4 ${billMetrics.grandTotal > 0 ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/30 rotate-12 scale-110 shadow-xl' : 'bg-brand-bg text-brand-muted border-brand-border opacity-30'}`}>
                  <Zap size={32} className={billMetrics.grandTotal > 0 ? 'animate-pulse' : ''} />
               </div>
               <span className="text-[9px] font-black tracking-widest text-brand-muted opacity-40">Status: {billMetrics.grandTotal > 0 ? 'Siap Bayar' : 'Kosong'}</span>
            </div>
          </div>

          {/* METODE PEMBAYARAN */}
          <div className="grid grid-cols-3 gap-6 relative z-10">
             {[
               { id: 'cash', label: 'Uang Tunai', icon: Banknote, primary: true },
               { id: 'transfer', label: 'Transfer', icon: CreditCard },
               { id: 'qris_manual', label: 'Scan QRIS', icon: QrCode }
             ].map(method => (
               <button 
                  key={method.id}
                  disabled={cart.length === 0} 
                  onClick={() => { setPaymentMethod(method.id); setShowChargeModal(true); }} 
                  className={`group/btn w-full py-8 px-6 rounded-[2.5rem] flex flex-col justify-center items-center gap-4 transition-all duration-500 border-2 active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale relative overflow-hidden shadow-2xl shadow-black/5
                    ${method.primary 
                      ? 'bg-brand-primary border-brand-primary/20 text-white shadow-brand-primary/40 hover:bg-brand-secondary hover:-translate-y-2' 
                      : 'bg-brand-card border-brand-border text-brand-primary hover:border-brand-primary/50 hover:bg-brand-primary/5 hover:-translate-y-2 shadow-inner'}`}
                >
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${method.primary ? 'bg-white/20 shadow-inner group-hover/btn:scale-110' : 'bg-brand-bg/80 border border-brand-border text-brand-primary shadow-sm group-hover/btn:scale-110 group-hover/btn:bg-brand-primary group-hover/btn:text-white transition-colors'}`}>
                      <method.icon size={28}/>
                   </div>
                   <span className="text-[10px] font-bold tracking-wider opacity-80">{method.label}</span>
                   <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 transition-all duration-500 group-hover/btn:w-1/2 ${method.primary ? 'bg-white/30' : 'bg-brand-primary/30'}`}></div>
                </button>
             ))}
          </div>
          
          <button 
            disabled={cart.length === 0}
            onClick={handleProcessHold}
            className="w-full mt-10 py-5 text-[10px] font-bold tracking-widest text-brand-muted hover:text-brand-accent transition-all flex items-center justify-center gap-4 opacity-30 hover:opacity-100 hover:bg-brand-bg rounded-[2rem] border-2 border-transparent hover:border-brand-border shadow-black/5 active:scale-95 group/hold"
          >
             <PauseCircle size={20} className="group-hover/hold:rotate-180 transition-transform duration-700" /> Tunda Pesanan (Antrian)
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI PEMBAYARAN */}
      {showChargeModal && (
        <Modal title="Konfirmasi Pembayaran" onClose={() => setShowChargeModal(false)} maxWidth="max-w-3xl" show={showChargeModal}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--brand-primary-rgb)_0%,transparent_30%)] opacity-10 pointer-events-none"></div>
          <form onSubmit={handleProcessCheckout} className="space-y-12 p-4 relative z-10">
              <div className="text-center bg-brand-bg/80 backdrop-blur-md p-14 rounded-[4rem] border-2 border-brand-border shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-accent/5 pointer-events-none"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-b-full"></div>
                <p className="text-[11px] font-bold tracking-widest text-brand-muted mb-6 flex items-center justify-center gap-3">
                   <ShieldCheck size={14} className="text-brand-primary" /> Total yang Harus Dibayar
                </p>
                <p className="text-8xl font-black text-brand-text tracking-tighter leading-none group-hover:scale-105 transition-transform duration-1000 shadow-black/10 drop-shadow-2xl">{formatIDR(billMetrics.grandTotal)}</p>
                <div className="mt-8 flex justify-center gap-3">
                   <span className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary text-[9px] font-bold rounded-lg border border-brand-primary/20 tracking-widest">Sistem Aktif</span>
                   <span className="px-4 py-1.5 bg-brand-accent/10 text-brand-accent text-[9px] font-bold rounded-lg border border-brand-accent/20 tracking-widest">Transaksi Aman</span>
                </div>
              </div>
              
              <div>
                <p className="text-[11px] font-bold tracking-widest text-brand-muted mb-8 ml-2 opacity-60">Pilih Metode Pembayaran</p>
                <div className="grid grid-cols-4 gap-6">
                    {[
                      {id: 'cash', label: 'Uang Tunai', icon: Banknote},
                      {id: 'transfer', label: 'Transfer Bank', icon: CreditCard},
                      {id: 'qris_manual', label: 'Scan QRIS', icon: QrCode},
                      {id: 'receivable', label: 'Hutang / Bon', icon: Users, accent: 'rose-500'}
                    ].map(method => (
                      <button 
                        key={method.id}
                        type="button" 
                        onClick={() => { setPaymentMethod(method.id); setPaidAmount(''); }} 
                        className={`group/meth py-10 rounded-[3rem] text-[10px] font-bold border-2 flex flex-col items-center justify-center gap-5 transition-all duration-500 tracking-widest relative overflow-hidden shadow-xl
                          ${paymentMethod === method.id 
                            ? `bg-brand-card text-brand-primary border-brand-primary shadow-brand-primary/10 scale-105 z-10` 
                            : 'bg-brand-bg/50 text-brand-muted border-brand-border hover:border-brand-primary/40 hover:bg-brand-primary/5 shadow-black/5'}`}
                      >
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 ${paymentMethod === method.id ? 'bg-brand-primary/10 text-brand-primary group-hover/meth:scale-110' : 'bg-brand-card text-brand-muted group-hover/meth:text-brand-primary group-hover/meth:scale-110'}`}>
                            <method.icon size={28}/>
                         </div>
                         {method.label}
                         {paymentMethod === method.id && (
                            <div className="absolute top-4 right-4 animate-pulse">
                               <CheckCircle2 size={16} className="text-brand-primary" />
                            </div>
                         )}
                         <div className={`absolute bottom-0 left-0 w-full h-1 bg-brand-primary transition-all duration-500 ${paymentMethod === method.id ? 'opacity-100' : 'opacity-0 translate-y-1'}`}></div>
                      </button>
                    ))}
                </div>
              </div>

              <div className="min-h-[250px] relative">
                {paymentMethod === 'cash' && (
                    <div className="animate-in fade-in slide-in-from-bottom-12 duration-700">
                      <div className="flex gap-5 overflow-x-auto pb-8 custom-scrollbar mb-8 px-2">
                          {getQuickCashSuggestions().map((val, idx) => (
                            <button 
                              type="button" 
                              key={idx} 
                              onClick={() => setPaidAmount(val.toString())} 
                              className="flex-shrink-0 px-10 py-6 bg-brand-card/80 backdrop-blur-md text-brand-text font-bold border-2 border-brand-border rounded-[2rem] hover:border-brand-primary hover:text-brand-primary hover:-translate-y-2 whitespace-nowrap text-[11px] shadow-2xl shadow-black/5 transition-all active:scale-95 tracking-widest flex items-center gap-4 group/suggest"
                            >
                                <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary group-hover/suggest:bg-brand-primary group-hover/suggest:text-white transition-colors">
                                   <Banknote size={18} />
                                </div>
                                {val === billMetrics.grandTotal ? 'Uang Pas' : formatIDR(val)}
                            </button>
                          ))}
                      </div>
                      <div className="group/input">
                          <label className="block text-[11px] font-bold text-brand-muted tracking-widest mb-6 ml-2 group-focus-within/input:text-brand-primary transition-colors opacity-60">Jumlah Uang yang Diterima (Rp)</label>
                           <div className="relative">
                              <input 
                                type="text" 
                                required 
                                value={paidAmount} 
                                onChange={e => {
                                   const val = e.target.value.replace(/\D/g, '');
                                   setPaidAmount(val ? parseInt(val).toLocaleString('id-ID') : '');
                                }} 
                                className="w-full bg-brand-bg/80 backdrop-blur-md border-2 border-brand-border rounded-[4rem] px-14 py-10 text-right font-black text-6xl outline-none focus:border-brand-primary text-brand-text shadow-2xl shadow-black/10 tracking-tighter placeholder:opacity-5 transition-all" 
                                placeholder="0" 
                              />
                              <div className="absolute left-14 top-1/2 -translate-y-1/2 flex items-center gap-6">
                                 <span className="text-3xl font-black text-brand-muted opacity-20">RP</span>
                                 <div className="w-1.5 h-16 bg-brand-border rounded-full opacity-30"></div>
                              </div>
                           </div>
                      </div>
                      {parseInt(paidAmount.replace(/\D/g, '')) > billMetrics.grandTotal && (
                          <div className="mt-12 p-10 bg-emerald-500/10 rounded-[4rem] border-2 border-emerald-500/20 flex justify-between items-center text-emerald-600 animate-in zoom-in-95 shadow-2xl shadow-emerald-500/5 relative overflow-hidden group/change">
                            <div className="flex items-center gap-8 relative z-10">
                               <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 group-hover/change:rotate-12 transition-transform duration-700">
                                  <Receipt size={36}/>
                                </div>
                               <div>
                                  <p className="text-[11px] font-bold tracking-widest mb-2 leading-none">Uang Kembali (Kembalian)</p>
                                  <p className="text-[10px] font-bold tracking-widest opacity-60 flex items-center gap-2">
                                     <Activity size={10} /> Berikan ke Pelanggan
                                  </p>
                               </div>
                            </div>
                            <span className="font-black text-5xl tracking-tighter leading-none relative z-10 shadow-emerald-500/10 drop-shadow-xl">{formatIDR(parseInt(paidAmount.replace(/\D/g, '')) - billMetrics.grandTotal)}</span>
                          </div>
                      )}
                    </div>
                )}

                {paymentMethod === 'receivable' && (
                    <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 space-y-10">
                      <div className="bg-rose-500/10 border-2 border-rose-500/20 p-10 rounded-[4rem] flex items-center gap-10 shadow-2xl shadow-rose-500/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-16 opacity-10 rotate-12"><AlertCircle size={150} /></div>
                        <div className="w-20 h-20 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-500/40 shrink-0 relative z-10">
                           <AlertCircle size={40} />
                        </div>
                        <div className="relative z-10">
                           <p className="text-[11px] font-bold tracking-widest text-rose-600 mb-3 leading-none">Peringatan Hutang / Bon</p>
                           <p className="text-sm font-semibold text-brand-text leading-relaxed tracking-tight opacity-80">
                             Transaksi ini akan dicatat sebagai <strong>Hutang Pelanggan</strong>. Pastikan profil pelanggan sudah benar dan tanggal jatuh tempo sudah ditentukan.
                           </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group/debtor">
                            <label className="block text-[11px] font-black text-brand-muted uppercase tracking-[0.3em] mb-6 ml-2 group-focus-within/debtor:text-brand-accent transition-colors opacity-60">Pilih Nama Pelanggan *</label>
                            <CustomDropdown 
                              value={selectedCustomerId} 
                              onChange={setSelectedCustomerId} 
                              options={customers.map(c => ({ value: c.id, label: `${c.name} (ID: ${c.id.toString().padStart(4, '0')})` }))} 
                              placeholder="-- Pilih Pelanggan --"
                              icon={<Users size={22} />}
                            />
                        </div>
                        <div className="group/date">
                            <label className="block text-[11px] font-black text-brand-muted uppercase tracking-[0.3em] mb-6 ml-2 group-focus-within/date:text-brand-accent transition-colors opacity-60">Tanggal Jatuh Tempo *</label>
                            <div className="relative">
                               <input 
                                 type="date" 
                                 required 
                                 value={dueDate} 
                                 onChange={e=>setDueDate(e.target.value)} 
                                 className="w-full bg-brand-card/80 border-2 border-brand-border rounded-[2.5rem] px-8 py-6 font-black outline-none focus:border-brand-accent text-brand-text shadow-xl shadow-black/5 transition-all text-[11px] tracking-widest pl-16" 
                               />
                               <Calendar size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within/date:text-brand-accent transition-colors pointer-events-none" />
                            </div>
                        </div>
                      </div>
                    </div>
                )}

                {(paymentMethod === 'transfer' || paymentMethod === 'qris_manual') && (
                    <div className="h-full flex items-center justify-center text-center p-16 bg-brand-bg/80 backdrop-blur-md rounded-[5rem] border-4 border-dashed border-brand-border animate-in zoom-in-95 group relative overflow-hidden">
                      <div className="max-w-lg relative z-10">
                        <div className="w-28 h-28 bg-brand-card rounded-full border-2 border-brand-border flex items-center justify-center mx-auto mb-10 shadow-2xl group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-[1500ms]">
                           <QrCode size={48} className="text-brand-primary opacity-60 group-hover:opacity-100 transition-opacity"/>
                        </div>
                        <h4 className="text-[12px] font-bold tracking-widest text-brand-text mb-6">Pembayaran Digital / QRIS</h4>
                        <p className="text-xs font-bold text-brand-muted leading-loose tracking-widest opacity-60">Pastikan pembayaran sudah berhasil masuk ke rekening atau saldo toko sebelum menekan tombol konfirmasi di bawah.</p>
                      </div>
                    </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full py-8 mt-12 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(var(--brand-primary-rgb),0.6)] active:scale-95 transition-all duration-500 text-sm tracking-widest flex items-center justify-center gap-6 group/auth"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover/auth:rotate-12 transition-transform duration-500">
                   <Lock size={26} />
                </div>
                Proses Transaksi & Cetak Struk
              </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

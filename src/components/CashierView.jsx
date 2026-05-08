import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, Minus, Trash2, Receipt, 
  Banknote, CreditCard, Users, PauseCircle, Package, 
  Coffee, Utensils, XCircle, AlertCircle, Barcode,
  ShoppingCart, Lock, Printer, Zap
} from 'lucide-react';
import { Modal } from './Modals';

export default function CashierView({ 
  products = [], 
  categories = [], 
  customers = [], 
  heldBills = [],
  settings = {},
  activeSession,
  onCheckout, 
  onHoldBill, 
  onRestoreBill,
  onOpenShift,
  showToast 
}) {
  // --- STATES ---
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  
  // Checkout & Payment States
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, transfer, qris_manual, receivable
  const [paidAmount, setPaidAmount] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Billing Pipeline States
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [applyTax, setApplyTax] = useState(false);
  const [applyService, setApplyService] = useState(false);

  const searchRef = useRef(null);

  // Auto-focus search saat mount
  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, [activeSession]);

  // --- LOGIC: FILTER PRODUCTS ---
  const filteredProducts = useMemo(() => {
    if (search.trim() !== '') {
      const query = search.toLowerCase();
      return products.filter(p => 
        p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
      );
    }
    return products.filter(p => 
      activeCategory === 'Semua' || p.category === activeCategory
    );
  }, [products, search, activeCategory]);

  // --- LOGIC: BILLING PIPELINE & ROUNDING ---
  const billMetrics = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price_retail * item.qty), 0);
    
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
  }, [cart, discountType, discountValue, applyTax, applyService, settings.rounding_mode]);

  // --- LOGIC: CART OPERATIONS ---
  const handleAddToCart = (prod) => {
    if (prod.stock_pcs <= 0) return showToast('Stok habis!', 'error');

    setCart(prev => {
      const existing = prev.find(i => i.id === prod.id);
      if (existing) {
        if (existing.qty >= prod.stock_pcs) { 
          showToast(`Maksimal stok ${prod.name} tercapai`, "error"); 
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
          showToast("Melebihi stok tersedia!", "error"); 
          return item; 
        }
        return { ...item, qty: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  // --- LOGIC: QUICK CASH SUGGESTIONS ---
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

  // --- LOGIC: CHECKOUT & HOLD BILL ---
  const handleProcessHold = () => {
    const label = prompt("Masukkan nama pelanggan/meja untuk ditahan:", `Antrean-${Date.now().toString().slice(-4)}`);
    if (!label) return;
    onHoldBill(label, cart);
    setCart([]); setDiscountType('none'); setDiscountValue(0); setApplyTax(false); setApplyService(false);
  };

  const handleProcessCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    let paid = billMetrics.grandTotal;
    if (paymentMethod === 'cash') {
      paid = parseInt(paidAmount) || 0;
      if (paid < billMetrics.grandTotal) return showToast("Uang bayar kurang!", "error");
    } else if (paymentMethod === 'receivable') {
      paid = 0; 
      if (!selectedCustomerId) return showToast("Pilih pelanggan untuk Bon/Piutang!", "error");
      if (!dueDate) return showToast("Tentukan tanggal jatuh tempo!", "error");
    }

    const txData = {
      subtotal: billMetrics.subtotal,
      discount: billMetrics.discountAmt,
      tax: billMetrics.taxAmt,
      service: billMetrics.serviceAmt,
      total: billMetrics.grandTotal,
      paid_amount: paid,
      change_amount: Math.max(0, paid - billMetrics.grandTotal),
      payment_method: paymentMethod,
      customer_id: paymentMethod === 'receivable' ? selectedCustomerId : null,
      due_date: paymentMethod === 'receivable' ? dueDate : null,
      items: cart.map(i => ({
        product_id: i.id,
        name: i.name,
        qty: i.qty,
        price_at_transaction: i.price_retail
      }))
    };

    onCheckout(txData);
    
    // Reset State
    setCart([]); setDiscountType('none'); setDiscountValue(0); setApplyTax(false); setApplyService(false);
    setShowChargeModal(false); setPaidAmount(''); setSelectedCustomerId(''); setDueDate('');
  };

  // --- RENDER ---
  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  if (!activeSession) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 p-8 text-center animate-in fade-in duration-500">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-lg border border-slate-200">
          <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-500/20">
            <Lock className="w-12 h-12" />
          </div>
          <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Terminal Terkunci</h3>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Anda harus membuka sesi kasir dan memasukkan modal awal laci sebelum dapat melakukan transaksi penjualan.
          </p>
          <button 
            onClick={onOpenShift} 
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-500/30 transition-all active:scale-95 text-lg tracking-widest uppercase"
          >
            Buka Sesi Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-slate-100 overflow-hidden animate-in fade-in duration-300">
      
      {/* KOLOM 1: NAVIGASI KATEGORI (MOKA STYLE) */}
      <div className="w-24 md:w-32 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto">
        <button onClick={() => setActiveCategory('Semua')} className={`flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl transition-all ${activeCategory === 'Semua' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
            <Package className="w-6 h-6 mb-2"/>
            <span className="text-[10px] font-bold">Semua</span>
        </button>
        
        {categories.map((cat, idx) => {
            const catName = typeof cat === 'string' ? cat : cat?.name;
            const catId = typeof cat === 'string' ? `cat-${idx}` : cat?.id;
            
            return (
              <button key={catId} onClick={() => setActiveCategory(catName)} className={`flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl transition-all ${activeCategory === catName ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                {catName?.toLowerCase().includes('minum') ? <Coffee className="w-6 h-6 mb-2"/> : 
                  catName?.toLowerCase().includes('makan') ? <Utensils className="w-6 h-6 mb-2"/> : <Package className="w-6 h-6 mb-2"/>}
                <span className="text-[10px] font-bold text-center leading-tight px-1">{catName}</span>
              </button>
            )
        })}

        {heldBills.length > 0 && (
            <div className="mt-auto border-t border-slate-200 w-full pt-4 flex flex-col items-center">
              <button className="relative p-3 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors group">
                  <PauseCircle className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{heldBills.length}</span>
                  
                  <div className="absolute bottom-full left-14 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50 p-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 px-2">Transaksi Ditahan</p>
                    {heldBills.map(b => (
                        <div key={b.id} onClick={() => {
                          onRestoreBill(b.id).then(items => {
                            setCart(items);
                            showToast("Antrian dipulihkan");
                          });
                        }} className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer border-b border-slate-100 last:border-0 text-left">
                          <p className="text-xs font-bold text-slate-800">{b.label}</p>
                          <p className="text-[9px] text-slate-500">{new Date(b.created_at).toLocaleTimeString()}</p>
                        </div>
                    ))}
                  </div>
              </button>
              <span className="text-[9px] font-bold text-slate-500 mt-2 text-center leading-tight">Hold<br/>Bills</span>
            </div>
        )}
      </div>

      {/* KOLOM 2: GRID PRODUK */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="px-6 py-4 bg-slate-50 flex items-center z-10 shrink-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
            <input ref={searchRef} type="text" placeholder="Cari Nama / Scan Barcode..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all shadow-sm" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
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
                className={`bg-white rounded-[1.5rem] p-4 border text-left flex flex-col h-36 relative overflow-hidden transition-all
                  ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed border-slate-200' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 active:scale-95 group'}`
                }>
                {isLowStock && !isOutOfStock && <span className="absolute top-3 right-3 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>}
                
                <h3 className={`font-bold text-sm line-clamp-2 leading-snug ${isOutOfStock ? 'text-slate-500' : 'text-slate-800 group-hover:text-blue-600'} transition-colors`}>{p.name}</h3>
                
                <div className="mt-auto flex justify-between items-end w-full">
                    <span className={`font-black text-base ${isOutOfStock ? 'text-slate-400' : 'text-slate-800'}`}>{formatRp(p.price_retail)}</span>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md ${isOutOfStock ? 'bg-red-50 text-red-600' : isLowStock ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      {isOutOfStock ? 'HABIS' : `Stok: ${available}`}
                    </span>
                </div>
              </button>
            )
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                <p className="font-bold">Tidak ada produk ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* KOLOM 3: KERANJANG (BILLING PIPELINE) */}
      <div className="w-full md:w-[380px] bg-white flex flex-col shadow-2xl shrink-0 z-20 border-l border-slate-200">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="font-black text-slate-800 flex items-center gap-2"><Receipt className="w-5 h-5 text-blue-600"/> Tagihan Aktif</h2>
          {cart.length > 0 && <button onClick={() => {if(window.confirm('Kosongkan keranjang?')) setCart([]);}} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Clear</button>}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50 custom-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-3 mb-2 border border-slate-100 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="font-bold text-sm text-slate-800 line-clamp-1">{item.name}</span>
                <span className="font-black text-slate-800 text-sm">{formatRp(item.qty * item.price_retail)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-500">{formatRp(item.price_retail)} / item</span>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg p-1">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-white rounded-md flex items-center justify-center hover:bg-slate-200 text-slate-700 shadow-sm"><Minus className="w-3 h-3"/></button>
                  <span className="w-8 text-center font-bold text-sm text-slate-800">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-white rounded-md flex items-center justify-center hover:bg-slate-200 text-slate-700 shadow-sm"><Plus className="w-3 h-3"/></button>
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col justify-center items-center text-slate-400 opacity-60">
                <ShoppingCart className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold">Keranjang Masih Kosong</p>
            </div>
          )}
        </div>
        
        {/* Kontrol Pipeline Tagihan */}
        <div className="p-5 bg-white border-t border-slate-100 shrink-0">
          {cart.length > 0 && (
              <div className="space-y-2 mb-4 text-xs font-bold text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatRp(billMetrics.subtotal)}</span></div>
                
                {/* Diskon */}
                <div className="flex justify-between items-center py-1">
                    <button onClick={() => {
                      const val = prompt("Masukkan Diskon (Ketik nominal misal 5000, atau persen misal 10%):");
                      if(!val) { setDiscountType('none'); setDiscountValue(0); return; }
                      if(val.includes('%')) { setDiscountType('percent'); setDiscountValue(parseFloat(val)); }
                      else { setDiscountType('nominal'); setDiscountValue(parseFloat(val)); }
                    }} className="text-blue-600 hover:text-blue-800 transition-colors border-b border-dashed border-blue-400 pb-0.5">
                      + Tambah Diskon
                    </button>
                    {billMetrics.discountAmt > 0 && <span className="text-red-500">-{formatRp(billMetrics.discountAmt)}</span>}
                </div>

                {/* Pajak & Layanan */}
                <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={applyTax} onChange={e=>setApplyTax(e.target.checked)} className="rounded text-blue-600 w-4 h-4 accent-blue-600" />
                      Pajak PB1 (10%)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={applyService} onChange={e=>setApplyService(e.target.checked)} className="rounded text-blue-600 w-4 h-4 accent-blue-600" />
                      Layanan (5%)
                    </label>
                </div>
                {applyTax && <div className="flex justify-between text-[10px] text-slate-400"><span>Pajak (10%)</span><span>{formatRp(billMetrics.taxAmt)}</span></div>}
                {applyService && <div className="flex justify-between text-[10px] text-slate-400"><span>Layanan (5%)</span><span>{formatRp(billMetrics.serviceAmt)}</span></div>}
              </div>
          )}

          <div className="flex justify-between items-end mb-4 pt-4 border-t border-slate-200">
            <span className="text-sm font-black text-slate-800">Total Tagihan</span>
            <span className="text-3xl font-black text-blue-600 tracking-tighter">{formatRp(billMetrics.grandTotal)}</span>
          </div>

          <div className="flex gap-2">
            <button disabled={cart.length === 0} onClick={handleProcessHold} className="flex-1 py-4 bg-orange-100 text-orange-600 font-black text-xs rounded-2xl hover:bg-orange-200 disabled:opacity-50 transition-all flex justify-center items-center gap-2 uppercase tracking-widest">
              Hold
            </button>
            <button disabled={cart.length === 0} onClick={() => setShowChargeModal(true)} className="flex-[2] py-4 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 disabled:opacity-50 transition-all flex justify-center items-center gap-2 uppercase tracking-widest">
              Charge
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CHECKOUT (FRICTIONLESS) */}
      {showChargeModal && (
        <Modal title="Penyelesaian Pembayaran" onClose={() => setShowChargeModal(false)} maxWidth="max-w-xl" show={showChargeModal}>
          <form onSubmit={handleProcessCheckout} className="space-y-6">
              <div className="text-center bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Total Harus Dibayar</p>
                <p className="text-5xl font-black text-blue-700 tracking-tighter">{formatRp(billMetrics.grandTotal)}</p>
              </div>
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Pilih Metode Pembayaran</p>
                <div className="grid grid-cols-4 gap-3">
                    <button type="button" onClick={() => setPaymentMethod('cash')} className={`py-4 rounded-2xl text-[10px] font-black border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'cash' ? 'bg-white text-blue-600 border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}><Banknote className="w-5 h-5"/> TUNAI</button>
                    <button type="button" onClick={() => setPaymentMethod('transfer')} className={`py-4 rounded-2xl text-[10px] font-black border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'transfer' ? 'bg-white text-blue-600 border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}><CreditCard className="w-5 h-5"/> TRF BANK</button>
                    <button type="button" onClick={() => setPaymentMethod('qris_manual')} className={`py-4 rounded-2xl text-[10px] font-black border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'qris_manual' ? 'bg-white text-blue-600 border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}><Barcode className="w-5 h-5"/> QRIS</button>
                    <button type="button" onClick={() => setPaymentMethod('receivable')} className={`py-4 rounded-2xl text-[10px] font-black border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'receivable' ? 'bg-orange-50 text-orange-600 border-orange-500 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}><Users className="w-5 h-5"/> BON/UTANG</button>
                </div>
              </div>

              {/* Input Dinamis berdasarkan Metode */}
              <div className="min-h-[120px]">
                {paymentMethod === 'cash' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                          {getQuickCashSuggestions().map((val, idx) => (
                            <button type="button" key={idx} onClick={() => setPaidAmount(val.toString())} className="flex-shrink-0 px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-xl hover:bg-emerald-100 whitespace-nowrap text-sm shadow-sm transition-colors">
                                {val === billMetrics.grandTotal ? 'Uang Pas' : formatRp(val)}
                            </button>
                          ))}
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Atau Ketik Nominal Manual</label>
                          <input type="number" required value={paidAmount} onChange={e=>setPaidAmount(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-right font-black text-3xl outline-none focus:border-blue-500" placeholder="0" />
                      </div>
                      {parseInt(paidAmount) >= billMetrics.grandTotal && (
                          <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center text-emerald-800">
                            <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Receipt className="w-4 h-4"/> Uang Kembali</span>
                            <span className="font-black text-2xl">{formatRp(parseInt(paidAmount) - billMetrics.grandTotal)}</span>
                          </div>
                      )}
                    </div>
                )}

                {paymentMethod === 'receivable' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                      <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl text-xs text-orange-800 font-medium">Transaksi akan dicatat sebagai Piutang Usaha (Accounts Receivable). Stok akan terpotong, namun uang tunai tidak bertambah.</div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Pelanggan / Debitur *</label>
                          <select required value={selectedCustomerId} onChange={e=>setSelectedCustomerId(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none cursor-pointer focus:border-orange-500 text-slate-700">
                            <option value="">-- Daftar Pelanggan Terdaftar --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone || '-'})</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal Jatuh Tempo Bayar *</label>
                          <input type="date" required value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-orange-500 text-slate-700" />
                      </div>
                    </div>
                )}

                {(paymentMethod === 'transfer' || paymentMethod === 'qris_manual') && (
                    <div className="h-full flex items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-sm font-bold text-slate-500">Pembayaran Non-Tunai. Pastikan pelanggan telah berhasil melakukan transfer ke rekening/QRIS toko sebelum klik konfirmasi.</p>
                    </div>
                )}
              </div>

              <button type="submit" className="w-full py-5 mt-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 active:scale-95 transition-all text-sm tracking-widest uppercase">KONFIRMASI & CETAK STRUK</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

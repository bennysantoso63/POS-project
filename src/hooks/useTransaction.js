import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSessionStore } from '../store/useSessionStore';

export function useTransaction(fetchData, currentUser) {
  const { activeSession } = useSessionStore();
  
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

  // Export State
  const [receiptToPrint, setReceiptToPrint] = useState(null);

  useEffect(() => {
    localStorage.setItem('lingling_active_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('lingling_active_customer', selectedCustomerId);
  }, [selectedCustomerId]);

  const handleCheckout = async (txData) => {
    if (!activeSession && currentUser?.role === 'cashier') {
      return toast.error("Buka sesi dulu!");
    }
    
    const res = await window.api?.processCheckout({
      ...txData,
      cashier_session_id: activeSession?.id || null,
      userName: currentUser?.username || 'System'
    });
    
    if (res?.success) {
      // Logic Piutang (Restored)
      if (txData.payment_method === 'receivable') {
        await window.api?.addCustomer(txData.customer_id); // Ensure customer exists/linked
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
      
      setCart([]);
      setSelectedCustomerId('');
      toast.success("Transaksi Berhasil"); 
      if (fetchData) fetchData();
      return { success: true };
    } else {
      toast.error(res?.error || "Gagal memproses transaksi");
      return { success: false };
    }
  };

  const handleHoldBill = async (cartItems, total) => {
    if (cartItems.length === 0) return;
    const label = prompt("Label Antrian:", `Antrian ${new Date().toLocaleTimeString()}`);
    if (!label) return;

    const res = await window.api?.holdBill({
      label,
      cartItems: cartItems
    });

    if (res?.success) {
      setCart([]);
      toast.success("Antrian disimpan");
      if (fetchData) fetchData();
    } else {
      toast.error("Gagal menyimpan antrian");
    }
  };

  const handleRestoreBill = async (id) => {
    const bill = await window.api?.restoreBill(id);
    if (bill) {
      setCart(bill.items || []);
      if (fetchData) fetchData();
      return true;
    }
    return false;
  };

  return {
    cart,
    setCart,
    selectedCustomerId,
    setSelectedCustomerId,
    receiptToPrint,
    setReceiptToPrint,
    handleCheckout,
    handleHoldBill,
    handleRestoreBill
  };
}

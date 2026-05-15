import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useSessionStore } from '../store/useSessionStore';
import { useAuth } from './AuthContext';

const TransactionContext = createContext();

export function TransactionProvider({ children, fetchData }) {
  const { activeSession } = useSessionStore();
  const { currentUser } = useAuth();
  
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [receiptToPrint, setReceiptToPrint] = useState(null);


  const handleCheckout = useCallback(async (txData) => {
    if (!activeSession && currentUser?.role === 'cashier') {
      return toast.error("Buka sesi dulu!");
    }
    
    const res = await window.api?.processCheckout({
      ...txData,
      cashier_session_id: activeSession?.id || null,
      userName: currentUser?.username || 'System'
    });
    
    if (res?.success) {
      if (txData.payment_method === 'receivable') {
        await window.api?.addCustomer(txData.customer_id);
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
  }, [activeSession, currentUser, fetchData]);

  const handleHoldBill = useCallback(async (cartItems, total) => {
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
  }, [fetchData]);

  const handleRestoreBill = useCallback(async (id) => {
    const bill = await window.api?.restoreBill(id);
    if (bill) {
      setCart(bill.items || []);
      if (fetchData) fetchData();
      return true;
    }
    return false;
  }, [fetchData]);

  // --- OPTIMIZATION: Memoize context value to prevent "Context Bottleneck" ---
  const value = useMemo(() => ({
    cart,
    setCart,
    selectedCustomerId,
    setSelectedCustomerId,
    receiptToPrint,
    setReceiptToPrint,
    handleCheckout,
    handleHoldBill,
    handleRestoreBill
  }), [cart, selectedCustomerId, receiptToPrint, handleCheckout, handleHoldBill, handleRestoreBill]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactionContext() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }
  return context;
}

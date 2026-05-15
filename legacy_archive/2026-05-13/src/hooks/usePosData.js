import { useState, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useSessionStore } from '../store/useSessionStore';

export function usePosData() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heldBills, setHeldBills] = useState([]);
  const [aprioriRules, setAprioriRules] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);


  const { activeSession, setSession } = useSessionStore();

  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0, 
    totalCogs: 0,
    profit: 0,
    totalTransactions: 0, 
    atv: 0,
    topProducts: [],
    lowStockProducts: []
  });

  const fetchData = useCallback(async () => {
    if (!window.api) {
      // [WEB-SIMULATION] ... (simulasi tetap ada)
      setDashboardStats({
        totalRevenue: 500000, totalCogs: 300000, profit: 200000,
        totalTransactions: 2, atv: 250000, topProducts: [], lowStockProducts: []
      });
      setIsLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled([
        window.api.getProducts(),
        window.api.getTransactions({ limit: 50 }), // Paginasi awal
        window.api.getTransactions(),
        window.api.getCustomers(),
        window.api.getActiveSession(),
        window.api.getDashboardStats(), // [M-1] Ambil statistik teragregasi
        window.api.getSettings(),
        window.api.getSuppliers(),
        window.api.getPurchaseOrders(),
        window.api.getCategories(),
        window.api.getHeldBills(),
        window.api.getSessions(),
        window.api.getExpenses(),
        window.api.getSembahyangApriori()
      ]);

      const [p, t, c, as, ds, set, sup, po, cat, hb, s, exp, ap] = results.map(r => r.status === 'fulfilled' ? r.value : null);
      
      setProducts(p || []);
      setTransactions(t || []);
      setCustomers(c || []);
      setSessions(s || []); 
      if (as && as.id) setSession(as);
      
      // Update Dashboard Stats dari Backend
      if (ds) {
        setDashboardStats({
          totalRevenue: ds.revenue,
          totalCogs: ds.total_cogs,
          profit: ds.profit,
          totalTransactions: ds.transaction_count,
          atv: ds.transaction_count > 0 ? ds.revenue / ds.transaction_count : 0,
          topProducts: ds.topProducts,
          lowStockProducts: (p || []).filter(prod => prod.stock_pcs <= (prod.low_stock_threshold || 10)).slice(0, 5)
        });
      }

      setSettings(set || {});
      setSuppliers(sup || []);
      setPurchaseOrders(po || []);
      setCategories(cat || []);
      setHeldBills(hb || []);
      setExpenses(exp || []);
      setAprioriRules(ap || []);

    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Gagal sinkronisasi database");
    } finally {
      setIsLoading(false);
    }
  }, [setSession]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    products, customers, transactions, sessions, movements, settings, 
    suppliers, purchaseOrders, expenses, categories, heldBills, aprioriRules,
    isLoading, fetchData, stats: dashboardStats 
  };

}

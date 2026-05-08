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

  const fetchData = useCallback(async () => {
    if (!window.api) return;
    try {
      const results = await Promise.allSettled([
        window.api.getProducts(),
        window.api.getTransactions(),
        window.api.getCustomers(),
        window.api.getActiveSession(),
        window.api.getStockMovements(),
        window.api.getSettings(),
        window.api.getSuppliers(),
        window.api.getPurchaseOrders(),
        window.api.getCategories(),
        window.api.getHeldBills(),
        window.api.getSessions(),
        window.api.getExpenses(),
        window.api.getSembahyangApriori()
      ]);


      const [p, t, c, as, m, set, sup, po, cat, hb, s, exp, ap] = results.map(r => r.status === 'fulfilled' ? r.value : []);

      
      setProducts(p || []);
      setTransactions(t || []);
      setCustomers(c || []);
      setSessions(s || []); 
      if (as && as.id) setSession(as);
      setMovements(m || []);
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

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCogs = 0;
    let productSales = {};
    const filteredTxs = (transactions || []).filter(tx => tx.status !== 'void');

    filteredTxs.forEach(tx => {
      totalRevenue += tx.total;
      tx.items?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: item.name, totalPcs: 0, revenue: 0 };
        }
        productSales[item.product_id].totalPcs += item.qty;
        productSales[item.product_id].revenue += (item.qty * item.unit_price);
        
        const prod = products.find(p => p.id === item.product_id);
        if (prod) totalCogs += (item.qty * (item.multiplier || 1) * (prod.cost_price || prod.price_wholesale || 0));
      });
    });

    const topProducts = Object.values(productSales).sort((a, b) => b.totalPcs - a.totalPcs).slice(0, 3);
    const lowStockProducts = products.filter(p => p.stock_pcs <= (p.low_stock_threshold || 10)).slice(0, 5);

    return { 
      totalRevenue, 
      totalCogs,
      profit: totalRevenue - totalCogs,
      totalTransactions: filteredTxs.length, 
      atv: filteredTxs.length > 0 ? totalRevenue / filteredTxs.length : 0,
      topProducts,
      lowStockProducts
    };
  }, [transactions, products]);

  return { 
    products, customers, transactions, sessions, movements, settings, 
    suppliers, purchaseOrders, expenses, categories, heldBills, aprioriRules,
    isLoading, fetchData, stats 
  };

}

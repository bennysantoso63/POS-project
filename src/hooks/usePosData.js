import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSessionStore } from '../store/useSessionStore';

export function usePosData() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [movements, setMovements] = useState([]);
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { setSession } = useSessionStore();

  const safeIpc = async (promise, fallback = null, timeoutMs = 5000) => {
    return Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve(fallback), timeoutMs))
    ]);
  };

  const fetchData = useCallback(async () => {
    if (!window.api || typeof window.api.getProducts !== 'function') {
      setIsLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled([
        safeIpc(window.api.getProducts(), []),
        safeIpc(window.api.getCustomers(), []),
        safeIpc(window.api.getTransactions(), []),
        safeIpc(window.api.getSessions(), []),
        safeIpc(window.api.getSettings(), {}),
        safeIpc(window.api.getCategories(), []),
        safeIpc(window.api.getSuppliers(), []),
        safeIpc(window.api.getPurchaseOrders(), []),
        safeIpc(window.api.getMovements(), []),
        safeIpc(window.api.getActiveSession(), null)
      ]);

      const [p, c, t, s, set, cat] = results.map(r => r.status === 'fulfilled' ? r.value : null);

      setProducts(p || []);
      setCustomers(c || []);
      setTransactions(t || []);
      setSessions(s || []);
      setSettings(set || {});
      setCategories(cat || []);
      setSuppliers(results[6]?.value || []);
      setPurchaseOrders(results[7]?.value || []);
      setMovements(results[8]?.value || []);
      
      const activeSession = results[9]?.value;
      setSession(activeSession);

    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Gagal sinkronisasi data");
    } finally {
      setIsLoading(false);
    }
  }, [setSession]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    products, 
    customers, 
    transactions, 
    sessions, 
    suppliers,
    purchaseOrders,
    movements,
    settings, 
    categories, 
    isLoading, 
    fetchData 
  };
}

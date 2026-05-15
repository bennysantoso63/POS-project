import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

export function usePosData() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const safeIpc = async (promise, fallback = null, timeoutMs = 5000) => {
    return Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve(fallback), timeoutMs))
    ]);
  };

  const fetchData = useCallback(async () => {
    if (!window.api) {
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
        safeIpc(window.api.getCategories(), [])
      ]);

      const [p, c, t, s, set, cat] = results.map(r => r.status === 'fulfilled' ? r.value : null);

      setProducts(p || []);
      setCustomers(c || []);
      setTransactions(t || []);
      setSessions(s || []);
      setSettings(set || {});
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, customers, transactions, sessions, settings, isLoading, fetchData };
}

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { usePosData } from './usePosData';
import { useAuth } from '../contexts/AuthContext';

/**
 * useAppActions Hook: Memusatkan semua operasi mutasi database yang sebelumnya ada di App.jsx.
 * Menghilangkan kebutuhan prop-drilling fetchData.
 */
export function useAppActions() {
  const { fetchData } = usePosData();
  const { currentUser } = useAuth();
  const [isDbSaving, setIsDbSaving] = useState(false);

  const handleSaveSettings = useCallback(async (localSettings, isDarkMode) => {
    setIsDbSaving(true);
    const res = await window.api?.saveSettings({
      ...localSettings,
      is_dark_mode: isDarkMode.toString()
    });
    setIsDbSaving(false);
    if (res?.success) {
      toast.success("Pengaturan Berhasil Disimpan");
      fetchData();
    } else {
      toast.error("Gagal menyimpan pengaturan");
    }
  }, [fetchData]);

  const handleAddProduct = useCallback(async (data) => {
    setIsDbSaving(true);
    const res = await window.api?.addProduct(data);
    setIsDbSaving(false);
    if (res?.success) {
      toast.success("Produk Berhasil Ditambah");
      fetchData();
    } else {
      toast.error(res?.error || "Gagal menambah produk");
    }
  }, [fetchData]);

  const handleUpdateProduct = useCallback(async (id, data) => {
    setIsDbSaving(true);
    const res = await window.api?.updateProduct(id, data, currentUser?.id);
    setIsDbSaving(false);
    if (res?.success) {
      toast.success("Produk Berhasil Diperbarui");
      fetchData();
    } else {
      toast.error(res?.error || "Gagal memperbarui produk");
    }
  }, [fetchData, currentUser]);

  const handleDeleteProduct = useCallback(async (product) => {
    if (window.confirm(`Hapus produk ${product.name}?`)) {
      const res = await window.api?.deleteProduct(product.id);
      if (res?.success) {
        toast.success("Produk Dihapus");
        fetchData();
      } else {
        toast.error("Gagal menghapus produk");
      }
    }
  }, [fetchData]);

  const handleApplyAdjustments = useCallback(async (adjustments) => {
    const toastId = toast.loading("Menyimpan penyesuaian stok...");
    try {effe
      for (const adj of adjustments) {
        await window.api.updateProduct(adj.id, { stock_pcs: adj.newStock }, currentUser?.id);
      }
      toast.success("Stok Berhasil Diperbarui", { id: toastId });
      fetchData();
    } catch (err) {
      toast.error("Gagal memperbarui beberapa stok", { id: toastId });
    }
  }, [fetchData, currentUser]);

  const handleAddCustomer = useCallback(async (data) => {
    setIsDbSaving(true);
    const res = await window.api?.addCustomer(data);
    setIsDbSaving(false);
    if (res?.success) {
      toast.success("Pelanggan Berhasil Ditambah");
      fetchData();
    } else {
      toast.error(res?.error || "Gagal menambah pelanggan");
    }
  }, [fetchData]);

  const handleUpdateCustomer = useCallback(async (id, data) => {
    setIsDbSaving(true);
    const res = await window.api?.updateCustomer(id, data);
    setIsDbSaving(false);
    if (res?.success) {
      toast.success("Data Pelanggan Diperbarui");
      fetchData();
    } else {
      toast.error("Gagal memperbarui data pelanggan");
    }
  }, [fetchData]);

  const handleDeleteCustomer = useCallback(async (customer) => {
    if (window.confirm(`Nonaktifkan pelanggan ${customer.name}?`)) {
      const res = await window.api?.deleteCustomer(customer.id);
      if (res?.success) {
        toast.success("Pelanggan Dinonaktifkan");
        fetchData();
      } else {
        toast.error("Gagal menghapus pelanggan");
      }
    }
  }, [fetchData]);

  const handleRecordCustomerPayment = useCallback(async (data) => {
    setIsDbSaving(true);
    const res = await window.api?.recordCustomerPayment(data);
    setIsDbSaving(false);
    if (res?.success) {
      toast.success("Pembayaran Berhasil Dicatat");
      fetchData();
    } else {
      toast.error("Gagal mencatat pembayaran");
    }
  }, [fetchData]);

  return {
    isDbSaving,
    handleSaveSettings,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleApplyAdjustments,
    handleAddCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    handleRecordCustomerPayment,
  };
}

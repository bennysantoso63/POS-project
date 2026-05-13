/**
 * LING-LING POS - CORE FORMATTERS
 * Sentralisasi fungsi pemformatan untuk konsistensi UI.
 */

/**
 * formatRp: Memformat angka ke mata uang Rupiah.
 * Menggunakan Intl.NumberFormat untuk performa terbaik dan kepatuhan lokal.
 */
export const formatRp = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * formatDate: Memformat tanggal ke format lokal Indonesia (DD MMM YYYY).
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * formatNumber: Memformat angka dengan pemisah ribuan.
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
};

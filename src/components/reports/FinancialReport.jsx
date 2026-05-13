import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register custom fonts if needed, or use defaults
// For enterprise look, we use clear sans-serif structure

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    letterSpacing: 1,
  },
  meta: {
    fontSize: 9,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#F3F4F6',
    padding: 8,
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  rowLabel: {
    flex: 1,
    fontSize: 10,
  },
  rowValue: {
    width: 120,
    fontSize: 10,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  totalLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    width: 150,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#999',
  }
});

export const FinancialReport = ({ data, settings, dateRange }) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{settings.store_name || 'LING-LING POS'}</Text>
            <Text style={styles.subtitle}>Laporan Keuangan Toko</Text>
          </View>
          <View style={styles.meta}>
            <Text>ID Laporan: {Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
            <Text>Dicetak: {new Date().toLocaleString()}</Text>
            <Text>Periode: {dateRange || 'Semua'}</Text>
          </View>
        </View>

        {/* REVENUE SECTION */}
        <Text style={styles.sectionTitle}>I. Pendapatan Penjualan</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total Penjualan Kotor</Text>
          <Text style={styles.rowValue}>{formatCurrency(data.revenue || 0)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Diskon Penjualan</Text>
          <Text style={styles.rowValue}>({formatCurrency(0)})</Text>
        </View>

        {/* COGS SECTION */}
        <Text style={styles.sectionTitle}>II. Harga Pokok Penjualan (HPP)</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total Modal Barang Terjual</Text>
          <Text style={styles.rowValue}>{formatCurrency(data.cogs || 0)}</Text>
        </View>
        
        {/* GROSS PROFIT */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Laba Kotor (Gross Profit)</Text>
          <Text style={styles.totalValue}>{formatCurrency((data.revenue || 0) - (data.cogs || 0))}</Text>
        </View>

        {/* OPEX SECTION */}
        <Text style={styles.sectionTitle}>III. Biaya Operasional (Pengeluaran)</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Pengeluaran Tetap</Text>
          <Text style={styles.rowValue}>{formatCurrency(data.fixedOpex || 0)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Pengeluaran Kas Kecil</Text>
          <Text style={styles.rowValue}>{formatCurrency(data.pettyCash || 0)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Estimasi Pajak Usaha</Text>
          <Text style={styles.rowValue}>{formatCurrency(data.taxLiability || 0)}</Text>
        </View>

        {/* NET PROFIT */}
        <View style={[styles.totalRow, { backgroundColor: '#F3F4F6', marginTop: 30 }]}>
          <Text style={styles.totalLabel}>Laba Bersih Akhir (Net Profit)</Text>
          <Text style={[styles.totalValue, { color: data.netProfit >= 0 ? '#059669' : '#DC2626' }]}>
            {formatCurrency(data.netProfit || 0)}
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Dokumen ini dicetak otomatis secara sah oleh Sistem LING-LING POS</Text>
          <Text style={styles.footerText}>Halaman 1 dari 1</Text>
        </View>
      </Page>
    </Document>
  );
};

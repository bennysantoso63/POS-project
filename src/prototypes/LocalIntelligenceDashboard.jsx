/**
 * PROTOTYPE: Local Intelligence Dashboard
 * Source: Roadmap Fase A & B
 * Status: Belum diintegrasikan — kumpulan referensi
 * 
 * Fitur:
 * 1. Market Basket Analysis (Apriori Algorithm)
 * 2. Survival Runway Calculator
 * 3. Dead-Stock Cash Radar
 */

import React, { useMemo } from 'react';
import { 
  BrainCircuit, TrendingUp, AlertTriangle, Target, Lightbulb, PackageX, Activity
} from 'lucide-react';

const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

export default function LocalIntelligenceDashboard({ transactions, products, settings }) {

  // --- AI ENGINE 1: MARKET BASKET ANALYSIS (Apriori Algorithm) ---
  const marketBasketInsights = useMemo(() => {
    const pairFrequency = {};
    const itemFrequency = {};
    let validTransactions = 0;

    transactions.forEach(tx => {
      if (!tx.items || tx.items.length < 2) return;
      validTransactions++;
      
      const itemNames = tx.items.map(i => i.name).sort();
      
      itemNames.forEach(name => {
        itemFrequency[name] = (itemFrequency[name] || 0) + 1;
      });

      for (let i = 0; i < itemNames.length; i++) {
        for (let j = i + 1; j < itemNames.length; j++) {
          const pair = `${itemNames[i]} & ${itemNames[j]}`;
          pairFrequency[pair] = (pairFrequency[pair] || 0) + 1;
        }
      }
    });

    if (validTransactions === 0) return [];

    const rules = Object.keys(pairFrequency).map(pair => {
      const [itemA, itemB] = pair.split(' & ');
      const freq = pairFrequency[pair];
      const confAtoB = freq / itemFrequency[itemA];
      const confBtoA = freq / itemFrequency[itemB];
      
      const primaryItem = confAtoB > confBtoA ? itemA : itemB;
      const secondaryItem = confAtoB > confBtoA ? itemB : itemA;
      const maxConfidence = Math.max(confAtoB, confBtoA);

      return {
        pair,
        support: (freq / validTransactions) * 100,
        confidence: maxConfidence * 100,
        primaryItem,
        secondaryItem,
        recommendation: `Buat Promo Bundling: Diskon 10% untuk ${secondaryItem} setiap pembelian ${primaryItem}.`
      };
    });

    return rules.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }, [transactions]);


  // --- AI ENGINE 2: SURVIVAL RUNWAY CALCULATOR ---
  const financialHealth = useMemo(() => {
    const opexPerMonth = parseInt(settings.fixedOpex) || 3500000;
    const totalCash = transactions.reduce((sum, tx) => sum + (tx.total || 0), 0) + 15000000;
    const runwayMonths = totalCash / opexPerMonth;
    
    return {
      totalCash,
      opexPerMonth,
      runwayMonths: runwayMonths.toFixed(1),
      status: runwayMonths > 6 ? 'SAFE' : runwayMonths > 3 ? 'WARNING' : 'DANGER',
      message: `Anda memiliki cadangan kas untuk bertahan selama ${runwayMonths.toFixed(1)} bulan tanpa ada pelanggan yang beli sama sekali.`
    };
  }, [transactions, settings]);


  // --- AI ENGINE 3: DEAD-STOCK CASH RADAR ---
  const inventoryHealth = useMemo(() => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const deadStocks = products.filter(p => {
      if (!p.last_sold_at) return true;
      return new Date(p.last_sold_at) < sixtyDaysAgo;
    });

    const frozenCash = deadStocks.reduce((sum, p) => sum + (p.stock_pcs * (p.cost_price || (p.price * 0.7))), 0);

    return {
      deadStockCount: deadStocks.length,
      frozenCash,
      items: deadStocks.slice(0, 3)
    };
  }, [products]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 p-8 lg:p-12 text-slate-200">
      
      <header className="mb-10 flex justify-between items-end">
        <div>
          <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Zero-API Edge Computing</p>
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
            <BrainCircuit className="w-10 h-10 text-indigo-500"/> Local Intelligence
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Analisis deterministik yang berjalan 100% di perangkat Anda tanpa akses internet.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* WIDGET 1: SURVIVAL RUNWAY (FASE A) */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity"><Target className="w-48 h-48"/></div>
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400"/> Survival Runway
           </h3>
           <p className="text-5xl font-black text-white tracking-tighter mb-2">{financialHealth.runwayMonths} <span className="text-xl text-slate-500">Bulan</span></p>
           <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest border-b border-slate-800 pb-4">Napas Bisnis Anda</p>
           
           <div className={`p-4 rounded-2xl border flex gap-4 items-start ${financialHealth.status === 'SAFE' ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-red-900/30 border-red-500/30'}`}>
              <Lightbulb className={`w-6 h-6 shrink-0 mt-0.5 ${financialHealth.status === 'SAFE' ? 'text-emerald-400' : 'text-red-400'}`}/>
              <p className="text-xs font-medium leading-relaxed text-slate-300">{financialHealth.message}</p>
           </div>
        </div>

        {/* WIDGET 2: MARKET BASKET ANALYSIS (FASE B) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/20 p-8 rounded-[2.5rem] shadow-2xl">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                 <TrendingUp className="w-5 h-5"/> Market Basket Analysis (AI Lokal)
              </h3>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">Apriori Algorithm</span>
           </div>

           {marketBasketInsights.length > 0 ? (
             <div className="space-y-4">
                {marketBasketInsights.map((insight, idx) => (
                  <div key={idx} className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                     <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center"><p className="text-2xl font-black text-white">{Math.round(insight.confidence)}%</p><p className="text-[9px] text-slate-500 uppercase font-bold">Korelasi</p></div>
                        <div className="h-10 w-px bg-slate-800"></div>
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-medium text-slate-300 mb-2">Pelanggan yang membeli <strong className="text-indigo-400">{insight.primaryItem}</strong> sangat sering membeli <strong className="text-emerald-400">{insight.secondaryItem}</strong>.</p>
                        <div className="bg-indigo-950/50 px-4 py-2 rounded-xl border border-indigo-900/50 inline-block text-xs font-bold text-indigo-300">💡 {insight.recommendation}</div>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <BrainCircuit className="w-16 h-16 mb-4 text-slate-600"/>
                <p className="text-sm font-bold">Data transaksi belum cukup untuk dianalisa AI.</p>
             </div>
           )}
        </div>

        {/* WIDGET 3: DEAD-STOCK RADAR (FASE B) */}
        <div className="lg:col-span-3 bg-red-950/20 border border-red-900/50 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
           <div className="shrink-0 text-center md:text-left">
              <h3 className="text-sm font-black uppercase tracking-widest text-red-400 mb-2 flex items-center gap-2 justify-center md:justify-start">
                 <PackageX className="w-5 h-5"/> Dead-Stock Radar
              </h3>
              <p className="text-4xl font-black text-white tracking-tighter">{formatRp(inventoryHealth.frozenCash)}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Uang Tunai Membeku di Gudang</p>
           </div>
           
           <div className="h-px w-full md:w-px md:h-20 bg-red-900/50"></div>
           
           <div className="flex-1">
              <div className="flex items-start gap-4">
                 <AlertTriangle className="w-8 h-8 text-red-500 shrink-0"/>
                 <div>
                    <p className="text-sm text-slate-300 font-medium mb-3">Terdapat <strong className="text-white">{inventoryHealth.deadStockCount} produk</strong> yang tidak pernah terjual selama lebih dari 60 hari. Ini adalah uang mati yang menggerus likuiditas Anda.</p>
                    <div className="flex flex-wrap gap-2">
                       {inventoryHealth.items.map(p => (
                         <span key={p.id} className="px-3 py-1.5 bg-slate-900 border border-red-900/50 text-xs font-bold text-red-200 rounded-lg">
                           {p.name} (Sisa {p.stock_pcs})
                         </span>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

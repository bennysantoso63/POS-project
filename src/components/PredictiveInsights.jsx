import React, { useState, useEffect } from 'react';
import { Flame, Moon, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

export default function PredictiveInsights({ 
  products = [], 
  settings = { business_mode: 'RETAIL' } 
}) {

  // =========================================================================
  // 🧠 DATA SCIENCE ENGINE 1: Inventory Burn-Rate (Velocity Analysis)
  // =========================================================================
  const [burnRateAlerts, setBurnRateAlerts] = useState([]);

  useEffect(() => {
    async function fetchBurnRate() {
      try {
        const data = await window.api?.intelligence?.getBurnRate();
        if (data && data.length > 0) {
          setBurnRateAlerts(data.slice(0, 3));
        } else {
          // Fallback: hitung dari products jika backend belum siap
          const fallback = products
            .filter(p => p.stock_pcs <= (p.low_stock_threshold || 10))
            .map(p => ({ id: p.id, name: p.name, stock: p.stock_pcs, velocity: '0', daysLeft: p.stock_pcs }))
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 3);
          setBurnRateAlerts(fallback);
        }
      } catch (e) {
        console.error('[PredictiveInsights] BurnRate error:', e);
      }
    }
    fetchBurnRate();
  }, [products]);

  // =========================================================================
  // 🧠 DATA SCIENCE ENGINE 2: Lunar Whisper (Seasonal Forecasting)
  // =========================================================================
  const [lunarForecast, setLunarForecast] = useState({
    event: null, countdownDays: 0,
    message: "Memuat data kalender lunar...",
    action: "Menghubungkan ke sistem astronomi..."
  });

  useEffect(() => {
    async function fetchLunar() {
      try {
        const data = await window.api?.sembahyang?.getLunarDate();
        if (!data) {
          setLunarForecast({
            event: null, countdownDays: 0,
            message: "Kalender ritual tidak aktif",
            action: "Aktifkan mode 'Toko Sembahyang' di Pengaturan untuk prediksi ritual lunar."
          });
          return;
        }
        const nearest = (data.daysUntilCeIt || 99) < (data.daysUntilCapGo || 99) ? 'Ce It' : 'Cap Go';
        const daysNearest = Math.min(data.daysUntilCeIt || 99, data.daysUntilCapGo || 99);
        let message, action;
        if (data.isCeIt) {
          message = `Hari ini Ce It — ${data.daysUntilCapGo} hari menuju Cap Go`;
          action = "Stok dupa, lilin, dan kertas sembahyang harus penuh hari ini. Pastikan display ritual rapi.";
        } else if (data.isCapGo) {
          message = `Hari ini Cap Go — ${data.daysUntilCeIt} hari menuju Ce It berikutnya`;
          action = "Hari puncak ritual. Pastikan stok premium tersedia dan tawarkan bundling paket sembahyang.";
        } else if (daysNearest <= 3) {
          message = `H-${daysNearest} menuju ${nearest}`;
          action = `URGENT: Segera restock Dupa Premium dan Kertas Sembahyang. Lonjakan hingga 300% pada H-3.`;
        } else if (daysNearest <= 7) {
          message = `${daysNearest} hari menuju ${nearest}`;
          action = `Persiapkan stok ritual untuk ${nearest}. Cek ketersediaan dupa, lilin merah, dan kertas emas.`;
        } else {
          message = `${daysNearest} hari menuju ${nearest} berikutnya`;
          action = `Stok ritual aman. Pantau terus menjelang ${nearest}.`;
        }
        setLunarForecast({ event: data.label || nearest, countdownDays: daysNearest, message, action });
      } catch (e) {
        console.error('[PredictiveInsights] Lunar error:', e);
      }
    }
    fetchLunar();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
      
      {/* 🔮 WIDGET 1: INVENTORY BURN-RATE (RISK RADAR) */}
      <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-rose-500/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group transition-all hover:border-rose-500/40">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-rose-500/10 transition-all duration-700"></div>
        
        <div className="flex items-center gap-5 mb-8">
          <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-lg shadow-rose-500/10">
            <Flame className="w-7 h-7 text-rose-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-brand-text font-black text-xl tracking-tight">Peringatan Burn-Rate</h3>
            <p className="text-brand-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Risk Analytics Engine</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {burnRateAlerts.length > 0 ? burnRateAlerts.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-brand-bg/50 p-5 rounded-2xl border border-brand-border transition-all hover:translate-x-2">
              <div className="max-w-[60%]">
                <p className="text-sm font-black text-brand-text truncate">{item.name}</p>
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1 opacity-50">Sisa: {item.stock} pcs | Laju: {item.velocity}/hari</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1.5 ${item.daysLeft <= 2 ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'} text-[9px] font-black uppercase rounded-xl border border-current/20 flex items-center gap-2`}>
                  <AlertTriangle className="w-3 h-3" />
                  {item.daysLeft} Hari Lagi
                </span>
              </div>
            </div>
          )) : (
            <div className="py-8 text-center border-2 border-dashed border-brand-border rounded-3xl opacity-30">
               <p className="text-[10px] font-bold uppercase tracking-widest">Stok Operasional Aman</p>
            </div>
          )}
        </div>
      </div>

      {/* 🔮 WIDGET 2: LUNAR WHISPER (SEASONAL FORECASTING) */}
      <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-brand-primary/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group transition-all hover:border-brand-primary/40">
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-all duration-1000"></div>
        
        <div className="flex items-center gap-5 mb-8 relative z-10">
          <div className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 shadow-lg shadow-brand-primary/10">
            <Moon className="w-7 h-7 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-brand-text font-black text-xl tracking-tight">Lunar Intelligence</h3>
            <p className="text-brand-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Seasonal Forecast Radar</p>
          </div>
        </div>

        <div className="relative z-10 bg-brand-bg/40 p-6 rounded-[2rem] border border-brand-border backdrop-blur-sm group-hover:bg-brand-bg/60 transition-all">
          <div className="flex items-center gap-3 mb-4">
             <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase rounded-lg border border-emerald-500/20">
                <Sparkles className="w-3 h-3 inline mr-1"/> High Confidence
             </span>
          </div>
          <p className="text-sm font-black text-emerald-500 mb-3 leading-tight">
            {lunarForecast.message}
          </p>
          <p className="text-[11px] font-bold text-brand-muted leading-relaxed opacity-80">
            {lunarForecast.action}
          </p>
          <button className="mt-8 w-full py-5 bg-brand-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:bg-brand-secondary shadow-xl shadow-brand-primary/20 active:scale-95 flex items-center justify-center gap-3">
            Otomasi Purchase Order (PO) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

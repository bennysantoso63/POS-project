import React, { useState, useEffect } from 'react';

export function LunarWidget({ settings }) {
    const [lunarData, setLunarData] = useState(null);

    useEffect(() => {
        if (settings?.business_type !== 'sembahyang') return;
        window.api.sembahyang.getLunarDate().then(setLunarData).catch(() => {});
    }, [settings?.business_type]);

    if (!lunarData || settings?.business_type !== 'sembahyang') return null;

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl
            text-xs font-bold transition-all shadow-lg backdrop-blur-md border
            ${lunarData.isImportantDay
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}>
            <span className="text-sm">🏮</span>
            <div className="flex flex-col">
                <span className="leading-none mb-0.5">
                    {lunarData.isImportantDay
                        ? `${lunarData.label}`
                        : lunarData.lunarDateStr
                    }
                </span>
                <span className="text-[10px] opacity-60 font-black tracking-tighter uppercase">
                    {lunarData.isImportantDay
                        ? `Sembahyang ${lunarData.label.split(' ')[0]}`
                        : lunarData.daysUntilCeIt <= lunarData.daysUntilCapGo
                            ? `Ce It: ${lunarData.daysUntilCeIt} Hari Lagi`
                            : `Cap Go: ${lunarData.daysUntilCapGo} Hari Lagi`
                    }
                </span>
            </div>
        </div>
    );
}

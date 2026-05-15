import React from 'react';

const RFM_CONFIG = {
    vip      : { icon: '👑', label: 'VIP',        cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-yellow-500/10' },
    loyal    : { icon: '⭐', label: 'Loyal',       cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10' },
    potential: { icon: '🌱', label: 'Potensial',   cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/10' },
    at_risk  : { icon: '🧊', label: 'Jarang',      cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-orange-500/10' },
    churned  : { icon: '💤', label: 'Tidak Aktif', cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30 shadow-slate-500/10' },
};

const CREDIT_CONFIG = {
    blocked : { icon: '🔴', label: 'Kasbon Terkunci', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    risk    : { icon: '⚠️', label: 'Riwayat Terlambat', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    caution : { icon: '🟡', label: 'Perhatian',     cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    safe    : null,
    new     : { icon: '🆕', label: 'Baru',          cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

export function CustomerBadge({ rfmProfile, creditScore }) {
    const rfm    = rfmProfile  ? RFM_CONFIG[rfmProfile.rfm_label]   : null;
    const credit = creditScore ? CREDIT_CONFIG[creditScore.label]    : null;

    if (!rfm && !credit) return null;

    return (
        <div className="flex items-center gap-2 flex-wrap mt-2">
            {rfm && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1
                    rounded-xl text-[10px] font-black uppercase tracking-tighter border shadow-lg ${rfm.cls}`}>
                    <span className="text-xs">{rfm.icon}</span>
                    {rfm.label}
                </span>
            )}
            {credit && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1
                    rounded-xl text-[10px] font-black uppercase tracking-tighter border shadow-lg ${credit.cls}`}>
                    <span className="text-xs">{credit.icon}</span>
                    {credit.label}
                    {creditScore.outstandingAmount > 0 && (
                        <span className="ml-1 opacity-80">
                            (Rp {creditScore.outstandingAmount.toLocaleString('id-ID')})
                        </span>
                    )}
                </span>
            )}
        </div>
    );
}

import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

export function BundlingSuggestion({ suggestions = [], onAddToCart }) {
    if (!suggestions.length) return null;

    return (
        <div className="bg-brand-primary/10 border-2 border-brand-primary/20 rounded-[2.5rem] p-6 mt-4 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-1000 group-hover:scale-150 rotate-12">
                <Sparkles size={60} />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary border border-brand-primary/30">
                    <Sparkles size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                    Smart Bundling Suggestions
                </p>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
                {suggestions.map(s => (
                    <div key={s.id || s.item_b_id}
                        className="flex items-center justify-between p-4 bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 transition-all group/item">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-brand-text mb-0.5">
                                {s.suggested_product_name || s.name}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-brand-primary">
                                    Rp {(s.suggested_product_price || s.price_retail).toLocaleString('id-ID')}
                                </span>
                                <span className="text-[9px] font-bold text-brand-muted opacity-50 tracking-tighter">
                                    ({s.confidence_pct}% Match)
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => onAddToCart({
                                id: s.item_b_id || s.id,
                                name: s.suggested_product_name || s.name,
                                price_retail: s.suggested_product_price || s.price_retail,
                                stock_pcs: s.stock_qty || s.stock_pcs
                            })}
                            className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

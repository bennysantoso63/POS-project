import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomDropdown = ({ value, onChange, options, label, icon, type = "button" }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOpt = options.find(opt => 
    (typeof opt === 'object' ? opt.value === value : opt === value)
  );
  const displayValue = typeof selectedOpt === 'object' ? selectedOpt.label : (selectedOpt || value);
  
  return (
    <div className="relative flex-1 xl:flex-none group">
      <button 
        type={type}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] ${icon ? 'pl-12' : 'pl-6'} pr-8 py-5 text-[11px] font-bold tracking-wider outline-none flex items-center justify-between hover:border-brand-primary/40 transition-all text-left shadow-sm hover:bg-white/80 dark:hover:bg-white/20`}
      >
        <div className="flex items-center gap-4">
          {icon && <div className="text-brand-muted group-hover:text-brand-primary transition-colors">{icon}</div>}
          <span className="truncate">{displayValue}</span>
        </div>
        <ChevronDown size={14} className={`text-brand-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 w-full mt-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-2 border-brand-border/50 rounded-[2rem] shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <button
                  key={optValue}
                  type="button"
                  onClick={() => { onChange(optValue); setIsOpen(false); }}
                  className={`w-full px-8 py-5 text-[10px] font-bold text-left hover:bg-brand-primary/10 transition-colors tracking-widest ${value === optValue ? 'text-brand-primary bg-brand-primary/5' : 'text-brand-muted'}`}
                >
                  {optLabel}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomDropdown;

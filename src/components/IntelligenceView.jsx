import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, ShieldAlert, Lock, Flame, Users, 
  TrendingUp, AlertCircle, Sparkles
} from 'lucide-react';
import LingLingChat from './LingLingChat';

export default function IntelligenceView({ 
  currentUser, 
  transactions = [], 
  products = [], 
  customers = [] 
}) {
  // RBAC Guard
  if (currentUser?.role !== 'admin') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#141E30] transition-colors duration-500">
        <div className="w-24 h-24 bg-[#FF826C]/10 dark:bg-[#E07060]/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-[#FF826C]/10">
          <ShieldAlert className="w-10 h-10 text-[#FF826C] dark:text-[#E07060]"/>
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Akses Terbatas</h2>
        <p className="text-slate-500 dark:text-[#64748b] font-bold max-w-md mt-4 uppercase text-[10px] tracking-widest leading-relaxed">
          Maaf, modul analitik strategis dan asisten AI Ling-Ling hanya dapat diakses oleh Administrator/Owner untuk menjaga kerahasiaan data performa toko.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-[#141E30] transition-colors duration-500">
      {/* 
        IntelligenceView sekarang menjadi wrapper untuk LingLingChat 
        yang sudah berisi Dashboard + Chat dalam satu split-pane premium.
      */}
      <LingLingChat 
        transactions={transactions} 
        products={products} 
        customers={customers} 
      />
    </div>
  );
}

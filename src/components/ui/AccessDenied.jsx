import React from 'react';

export function AccessDenied({ message = 'Akses ditolak.' }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 bg-slate-50 dark:bg-[#0F172A] rounded-[3rem] border border-slate-200 dark:border-indigo-500/20">
            <div className="text-6xl animate-bounce">🔒</div>
            <h2 className="text-2xl font-black text-slate-700 dark:text-slate-100 uppercase tracking-tighter">
                Akses Terbatas
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium">
                {message}
            </p>
            <div className="mt-4 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">
                  Hubungi pemilik bisnis jika Anda membutuhkan akses ini.
              </p>
            </div>
        </div>
    );
}

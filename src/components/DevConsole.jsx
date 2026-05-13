import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Trash2, ChevronDown, ChevronUp, Bug } from 'lucide-react';

/**
 * POS LING-LING - NATIVE DEVELOPER CONSOLE
 * Fitur: Debugging tanpa Chrome DevTools (tanpa pakai chrome)
 */
export default function DevConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Intercept console.log, warn, error
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type, args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev, { 
        id: Date.now() + Math.random(), 
        type, 
        message, 
        time: new Date().toLocaleTimeString() 
      }].slice(-100)); // Simpan 100 log terakhir
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('info', args);
    };
    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };
    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Shortcut Ctrl+Alt+D to toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && e.key === 'd') {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="fixed bottom-4 right-4 z-[9999] p-3 bg-[#1A2640] border border-[#35577D]/30 text-[#38B2AC] rounded-full shadow-2xl hover:scale-110 transition-all opacity-20 hover:opacity-100"
    >
      <Bug size={18} />
    </button>
  );

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] flex flex-col bg-[#141E30] border border-[#35577D]/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 ${isMinimized ? 'h-12 w-64' : 'h-[400px] w-[500px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#35577D]/30 bg-[#1A2640] rounded-t-2xl shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[#38B2AC]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#38B2AC]">Konsol Developer</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLogs([])} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-all">
            <Trash2 size={12} />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-all">
            {isMinimized ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2 custom-scrollbar bg-black/20"
        >
          {logs.length === 0 && (
            <p className="text-slate-600 italic">Belum ada log. Mode developer aktif.</p>
          )}
          {logs.map(log => (
            <div key={log.id} className="flex gap-3 border-b border-white/[0.03] pb-1 group">
              <span className="text-slate-600 shrink-0">{log.time}</span>
              <span className={`break-all ${
                log.type === 'error' ? 'text-rose-400' : 
                log.type === 'warn' ? 'text-amber-400' : 
                'text-emerald-400'
              }`}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer Info */}
      {!isMinimized && (
        <div className="p-2 border-t border-[#35577D]/20 bg-[#1A2640]/50 rounded-b-2xl flex justify-between px-4">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Tekan Ctrl+Alt+D untuk Buka/Tutup</span>
          <span className="text-[8px] font-black text-[#38B2AC] uppercase tracking-widest">Debugger Internal Ling-Ling v1.0</span>
        </div>
      )}
    </div>
  );
}

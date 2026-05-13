import React, { useState } from 'react';
import { Sparkles, MessageCircle, AlertTriangle, ShieldCheck, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LingLingChat() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Panggil IPC intelligence:chat yang sudah terdaftar di main.cjs
      const result = await window.api?.intelligence.chat(query);
      setResponse(result);
      if (!result.found) {
        toast.error("Ling-Ling tidak menemukan jawaban.");
      }
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error("Gagal menghubungi Ling-Ling.");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (score >= 0.6) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  return (
    <div className="flex flex-col h-full bg-brand-bg p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-500/30">
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Ling-Ling AI Assistant</h2>
          <p className="text-sm text-white/50">Analisis Dokumen & Data Toko Real-time</p>
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleAsk} className="relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tanya performa toko, profit hari ini, atau panduan operasional..."
          className="w-full p-4 pr-16 bg-brand-card/20 border border-brand-border rounded-2xl text-white focus:border-cyan-500/50 focus:outline-none transition-all"
        />
        <button 
          type="submit"
          disabled={loading}
          className="absolute right-2 top-2 p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <MessageCircle className="w-5 h-5" />}
        </button>
      </form>

      {/* Response Area */}
      {response && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-brand-card/30 border border-brand-border p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="text-white/90 leading-relaxed whitespace-pre-wrap text-sm italic">
              "{response.answer}"
            </div>

            {/* Citations & Metadata */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
              {/* Confidence Score */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${getConfidenceColor(response.confidence_score)}`}>
                {response.confidence_score >= 0.8 ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                Akurasi: {(response.confidence_score * 100).toFixed(0)}%
              </div>

              {/* Citations */}
              {response.citations?.map((source, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">
                  <Database className="w-3.5 h-3.5" />
                  {source}
                </div>
              ))}
            </div>

            {/* HITL Warning */}
            {response.confidence_score < 0.7 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                <div className="text-[11px] text-red-300">
                  <strong>Human-in-the-Loop Required:</strong> Tingkat kepastian rendah. Mohon verifikasi manual data ini sebelum mengambil keputusan bisnis.
                </div>
              </div>
            )}
            
            {/* Nudge */}
            <div className="text-[11px] text-cyan-400 font-medium">
              💡 {response.nudge}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!response && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
          <div className="p-6 bg-white/5 rounded-full">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <p className="text-sm text-white max-w-xs">
            Selamat datang! Saya Ling-Ling. Saya bisa menjawab pertanyaan berdasarkan data toko Anda atau dokumen yang Anda unggah.
          </p>
        </div>
      )}
    </div>
  );
}

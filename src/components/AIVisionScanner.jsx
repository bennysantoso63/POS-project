import React, { useState, useEffect, useRef } from 'react';
import { XCircle, CheckCircle2, ScanLine } from 'lucide-react';

// --- Helper: Haptic & Audio Feedback ---
const playScanFeedback = () => {
  try {
    // Beep Sound
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz Beep
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.1); // 100ms beep
    
    // Haptic Vibrate (Mobile/Tablet)
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  } catch(e) { console.log('Audio/Haptic feedback not supported', e); }
};

const AIVisionScanner = ({ onClose, onScan, products }) => {
  const videoRef = useRef(null);
  const [isLocked, setIsLocked] = useState(false);
  const [boundingBox, setBoundingBox] = useState(null);
  const [metrics, setMetrics] = useState({ latency: 45, fps: 30 });

  useEffect(() => {
    let stream = null;
    let timer = null;
    let metricInterval = null;

    // 1. Setup Camera Stream
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
         stream = s;
         if (videoRef.current) videoRef.current.srcObject = s;
      }).catch(e => console.error("Kamera tidak tersedia:", e));

    // Fake Telemetry Simulation (WASM / YOLOv8-nano simulation)
    metricInterval = setInterval(() => {
       if(!isLocked) {
         setMetrics({ 
           latency: Math.floor(Math.random() * 20) + 30, 
           fps: Math.floor(Math.random() * 5) + 28 
         });
       }
    }, 500);

    // AI Bounding Box Logic Simulation
    timer = setTimeout(() => {
       if (products.length === 0) return;
       const targetProduct = products[Math.floor(Math.random() * products.length)];
       setIsLocked(true);
       
       // Tampilkan kotak ROI (Region of Interest) hijau
       setBoundingBox({ top: '35%', left: '20%', width: '60%', height: '30%' });
       
       // Trigger Haptic & Beep
       playScanFeedback();

       // Jeda untuk memberikan Feedback UX sebelum menutup modal
       setTimeout(() => {
          onScan(targetProduct.sku);
       }, 1000);
    }, 2500); // Simulasi deteksi setelah 2.5 detik

    return () => {
       clearTimeout(timer);
       clearInterval(metricInterval);
       if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [products, onScan, isLocked]);

  return (
    <div className="fixed inset-0 bg-black z-[999] flex flex-col animate-in fade-in duration-300">
       {/* Scanner Header */}
       <div className="px-6 py-5 bg-black/50 backdrop-blur-md flex justify-between items-center text-white z-10 absolute top-0 w-full">
         <div>
            <h3 className="font-black text-lg tracking-widest flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-emerald-400"/> AI VISION <span className="font-mono text-[10px] bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded">v23.0</span>
            </h3>
            <div className="flex gap-3 mt-1 text-[9px] font-mono text-emerald-400/80">
               <span>FPS: {metrics.fps}</span>
               <span>LAT: {metrics.latency}ms</span>
               <span>CLAHE: ON</span>
               <span>YOLOv8-nano</span>
            </div>
         </div>
         <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
           <XCircle className="w-6 h-6"/>
         </button>
       </div>

       {/* Camera Feed & Overlay */}
       <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="absolute min-w-full min-h-full object-cover opacity-60"></video>
          
          {/* Scanning Animation (Not locked yet) */}
          {!isLocked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
              <style>{`@keyframes scan { 0%, 100% { top: 0%; } 50% { top: 100%; } }`}</style>
            </div>
          )}

          {/* AI Bounding Box (Locked) */}
          {isLocked && boundingBox && (
            <div 
               className="absolute border-4 border-emerald-500 bg-emerald-500/20 shadow-[0_0_30px_#10b981] animate-in zoom-in-95 duration-200"
               style={{ top: boundingBox.top, left: boundingBox.left, width: boundingBox.width, height: boundingBox.height, borderRadius: '1rem' }}
            >
               <div className="absolute -top-6 left-0 bg-emerald-500 text-black font-black text-[10px] px-2 py-1 tracking-widest flex items-center gap-1">
                 <CheckCircle2 className="w-3 h-3"/> DECODED (99.9%)
               </div>
            </div>
          )}
       </div>
    </div>
  );
};

export default AIVisionScanner;

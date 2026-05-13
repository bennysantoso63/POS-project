import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCcw, Zap, Activity, Focus, Cpu, Scan, Info, AlertCircle, Sparkles } from 'lucide-react';

const workerCode = `
  importScripts('https://docs.opencv.org/4.8.0/opencv.js');
  importScripts('https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js');

  let zxingReader = null;

  function initEngines() {
    if (typeof cv !== 'undefined' && cv.Mat && typeof ZXing !== 'undefined') {
      zxingReader = new ZXing.BrowserMultiFormatReader();
      postMessage({ type: 'WORKER_READY' });
    } else {
      setTimeout(initEngines, 100);
    }
  }
  initEngines();

  self.onmessage = function(e) {
    if (e.data.type === 'PROCESS_FRAME') {
      const { imageData, width, height } = e.data;
      const startTime = performance.now();

      try {
        let src = cv.matFromImageData(imageData);
        let gray = new cv.Mat();
        let enhanced = new cv.Mat();
        let laplacian = new cv.Mat();
        let mean = new cv.Mat();
        let stddev = new cv.Mat();

        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        let clahe = new cv.CLAHE(40, new cv.Size(8, 8));
        clahe.apply(gray, enhanced);

        cv.Laplacian(enhanced, laplacian, cv.CV_64F);
        cv.meanStdDev(laplacian, mean, stddev);
        let variance = Math.pow(stddev.doubleAt(0, 0), 2);
        const isBlurry = variance < 150;

        let barcodeResult = null;

        if (!isBlurry) {
          let rgbaMat = new cv.Mat();
          cv.cvtColor(enhanced, rgbaMat, cv.COLOR_GRAY2RGBA);
          const imgDataArr = new Uint8ClampedArray(rgbaMat.data);
          const luminanceSource = new ZXing.RGBLuminanceSource(imgDataArr, width, height);
          const binaryBitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminanceSource));
          
          try {
            const result = zxingReader.decode(binaryBitmap);
            barcodeResult = result.getText();
          } catch(err) { }
          rgbaMat.delete();
        }

        const processTime = performance.now() - startTime;

        postMessage({
          type: 'FRAME_RESULT',
          variance: variance.toFixed(2),
          isBlurry: isBlurry,
          processTimeMs: processTime.toFixed(2),
          barcode: barcodeResult
        });

        src.delete(); gray.delete(); enhanced.delete();
        laplacian.delete(); mean.delete(); stddev.delete(); clahe.delete();

      } catch (err) {
        console.error("Worker Error:", err);
      }
    }
  };
`;

const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = 800; 
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) { console.warn("Audio Context blocked."); }
};

const BarcodeScanner = ({ onScan, compact = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const requestRef = useRef(null);
  const debounceRef = useRef({ text: '', time: 0 });
  const lastFpsTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  const [sysStatus, setSysStatus] = useState('Initializing WASM Core...');
  const [workerReady, setWorkerReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [metrics, setMetrics] = useState({ variance: 0, isBlurry: false, processTime: 0 });
  const [flash, setFlash] = useState(false);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'WORKER_READY') {
        setWorkerReady(true);
        setSysStatus('Waiting for Lens Activation...');
      } else if (e.data.type === 'FRAME_RESULT') {
        setMetrics({ variance: e.data.variance, isBlurry: e.data.isBlurry, processTime: e.data.processTimeMs });
        
        if (e.data.barcode) {
          const now = Date.now();
          if (debounceRef.current.text !== e.data.barcode || (now - debounceRef.current.time) > 1500) {
            debounceRef.current = { text: e.data.barcode, time: now };
            playBeep();
            
            // Haptic Feedback for Mobile Support
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([100, 50, 100]); 
            }

            setFlash(true);
            setTimeout(() => setFlash(false), 500);
            onScan(e.data.barcode);
          }
        }
      }
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
      cancelAnimationFrame(requestRef.current);
    };
  }, [onScan]);

  useEffect(() => {
    if (!workerReady) return;
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 360 } }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraReady(true);
            startVisionPipeline();
          };
        }
      } catch (err) {
        setSysStatus('Optic Access Denied.');
      }
    }
    setupCamera();

    return () => {
       if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(track => track.stop());
       }
    }
  }, [workerReady]);

  const startVisionPipeline = () => {
    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !workerRef.current) return;
      if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        requestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // FPS Telemetry
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const width = 320; 
      const height = 180;
      canvas.width = width; canvas.height = height;

      ctx.drawImage(videoRef.current, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      workerRef.current.postMessage({ type: 'PROCESS_FRAME', imageData, width, height });
      setTimeout(() => { requestRef.current = requestAnimationFrame(processFrame); }, 100); 
    };
    requestRef.current = requestAnimationFrame(processFrame);
  };

  return (
    <div className={`bg-brand-card rounded-[2.5rem] border border-brand-border shadow-2xl shadow-black/5 overflow-hidden flex transition-all duration-500 ${compact ? 'flex-row items-center p-3 gap-6' : 'flex-col md:flex-row p-6 lg:p-8 gap-8'}`}>
      
      {/* LENS VIEWPORT (INTELLIGENCE HUD EDITION) */}
      <div className={`relative bg-black rounded-[2rem] overflow-hidden border-[3px] transition-all duration-500 flex items-center justify-center shrink-0 group ${flash ? 'border-[#38B2AC] shadow-[0_0_40px_rgba(56,178,172,0.3)] scale-[1.03]' : 'border-brand-border'} ${compact ? 'w-48 h-32' : 'w-full md:w-96 aspect-video'}`}>
        {(!cameraReady || !workerReady) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-muted bg-black/90 z-20 backdrop-blur-xl">
             <div className="relative mb-6">
                <RefreshCcw className="w-12 h-12 animate-spin text-[#53D2DC]" />
                <div className="absolute inset-0 blur-xl bg-[#53D2DC]/20 animate-pulse"></div>
             </div>
            {!compact && (
              <div className="text-center space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-text block">{sysStatus}</span>
                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">WASM Neural Engine Loading...</span>
              </div>
            )}
          </div>
        )}
        <video ref={videoRef} className="w-full h-full object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* SCI-FI RETICLE & HUD OVERLAY */}
        {cameraReady && workerReady && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
            
            {/* Top Diagnostics HUD */}
            <div className={`flex justify-between items-start font-mono text-[10px] font-bold tracking-widest transition-colors ${metrics.isBlurry ? 'text-[#FF826C] drop-shadow-[0_0_5px_#FF826C]' : 'text-[#53D2DC] drop-shadow-[0_0_5px_#53D2DC]'}`}>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1"><Activity size={12}/> FPS: {fps}</span>
                <span className="flex items-center gap-1"><Focus size={12}/> FOC: {metrics.isBlurry ? 'HUNTING' : 'LOCKED'}</span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="flex items-center justify-end gap-1">
                  SYS: ON <span className={`w-2 h-2 rounded-full animate-pulse ${metrics.isBlurry ? 'bg-[#FF826C]' : 'bg-[#38B2AC]'}`}/>
                </span>
                <span>VAR: {metrics.variance}</span>
              </div>
            </div>

            {/* NEON RETICLE */}
            <div className="flex-1 flex items-center justify-center">
              <div className={`w-[85%] h-[75%] border-[3px] border-dashed rounded-3xl relative transition-all duration-500 ${flash ? 'border-[#38B2AC] bg-[#38B2AC]/20 scale-110 shadow-[inset_0_0_40px_rgba(56,178,172,0.4)]' : metrics.isBlurry ? 'border-[#FF826C] bg-[#FF826C]/10' : 'border-[#53D2DC]/30'}`}>
                 {!metrics.isBlurry && !flash && (
                   <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#53D2DC] to-transparent absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_20px_rgba(83,210,220,0.8)]"></div>
                 )}
                 
                 {/* CORNER BRACKETS */}
                 <div className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl shadow-[-4px_-4px_10px_rgba(83,210,220,0.4)] transition-colors ${metrics.isBlurry ? 'border-[#FF826C]' : 'border-[#53D2DC]'}`}></div>
                 <div className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl shadow-[4px_-4px_10px_rgba(83,210,220,0.4)] transition-colors ${metrics.isBlurry ? 'border-[#FF826C]' : 'border-[#53D2DC]'}`}></div>
                 <div className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl shadow-[-4px_4px_10px_rgba(83,210,220,0.4)] transition-colors ${metrics.isBlurry ? 'border-[#FF826C]' : 'border-[#53D2DC]'}`}></div>
                 <div className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-xl shadow-[4px_4px_10px_rgba(83,210,220,0.4)] transition-colors ${metrics.isBlurry ? 'border-[#FF826C]' : 'border-[#53D2DC]'}`}></div>

                 {/* BLUR WARNING */}
                 {metrics.isBlurry && (
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 animate-bounce">
                         <AlertCircle className="text-[#FF826C] w-10 h-10" />
                         <span className="text-[9px] font-black text-[#FF826C] uppercase tracking-[0.3em] bg-[#FF826C]/10 px-4 py-1 rounded-full border border-[#FF826C]/20 backdrop-blur-md">Unstable Focus</span>
                      </div>
                   </div>
                 )}
              </div>
            </div>

            {/* Bottom Status Pill */}
            <div className="flex justify-center">
               <span className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest backdrop-blur-md transition-colors duration-300 ${flash ? 'bg-[#38B2AC]/20 border-[#38B2AC] text-[#38B2AC] shadow-[0_0_10px_#38B2AC]' : metrics.isBlurry ? 'bg-[#FF826C]/20 border-[#FF826C]/50 text-[#FF826C]' : 'bg-[#53D2DC]/20 border-[#53D2DC]/50 text-[#53D2DC] shadow-[0_0_10px_#53D2DC]'}`}>
                 {flash ? 'ID DECODED' : metrics.isBlurry ? 'ACQUIRING FOCUS...' : 'SCANNING ACTIVE'}
               </span>
            </div>
          </div>
        )}
      </div>
      
      {/* DIAGNOSTICS & TELEMETRY */}
      <div className={`flex flex-col justify-center ${compact ? 'flex-1' : 'w-full py-2'}`}>
        <div className="flex justify-between items-end mb-6 border-b border-brand-border pb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(83,210,220,0.8)] ${metrics.isBlurry ? 'bg-[#FF826C]' : 'bg-[#53D2DC]'}`} />
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-brand-text">Optic Neural Hub</h3>
            </div>
            <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] opacity-60">High-Precision Asset Identification</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-bg border border-brand-border shadow-inner">
             <Info className="w-3.5 h-3.5 text-brand-muted" />
             <span className="text-[8px] font-black text-brand-muted uppercase tracking-widest">WASM-4.8.0</span>
          </div>
        </div>

        {!compact ? (
          <div className="space-y-6 mt-2">
            <div className="group/metric">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted mb-3 group-hover/metric:text-brand-text transition-colors">
                <span className="flex items-center gap-3"><Focus className="w-4 h-4 text-[#53D2DC]"/> Focus Variance</span>
                <span className={`font-mono text-xs ${metrics.isBlurry ? 'text-[#FF826C]' : 'text-[#53D2DC]'}`}>{metrics.variance}</span>
              </div>
              <div className="w-full bg-brand-bg rounded-full h-2.5 overflow-hidden shadow-inner border border-brand-border/50">
                <div className={`h-full rounded-full transition-all duration-500 ${metrics.isBlurry ? 'bg-[#FF826C] shadow-[0_0_15px_rgba(255,130,108,0.4)]' : 'bg-[#53D2DC] shadow-[0_0_15px_rgba(83,210,220,0.4)]'}`} style={{width: `${Math.min(100, (metrics.variance/300)*100)}%`}}></div>
              </div>
            </div>

            <div className="group/metric">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted mb-3 group-hover/metric:text-brand-text transition-colors">
                <span className="flex items-center gap-3"><Cpu className="w-4 h-4 text-[#38B2AC]"/> Inference Latency</span>
                <span className="font-mono text-xs text-[#38B2AC]">{metrics.processTime}ms</span>
              </div>
              <div className="w-full bg-brand-bg rounded-full h-2.5 overflow-hidden shadow-inner border border-brand-border/50">
                <div className="h-full rounded-full bg-[#38B2AC]/40 transition-all duration-500 shadow-[0_0_15px_rgba(56,178,172,0.2)]" style={{width: `${Math.min(100, (metrics.processTime/150)*100)}%`}}></div>
              </div>
            </div>

            <div className="bg-brand-primary/5 border border-brand-primary/20 p-5 rounded-2xl flex items-start gap-4 mt-8 group hover:bg-brand-primary/10 transition-all">
               <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold text-brand-muted leading-relaxed uppercase tracking-widest opacity-80">
                 Integrated with <span className="text-[#53D2DC]">CLAHE Preprocessing</span> and <span className="text-[#53D2DC]">Hybrid Binarization</span> for superior low-light asset identification.
               </p>
            </div>
          </div>
        ) : (
           <div className="space-y-3">
             <div className="flex items-center gap-3">
                <Scan className="w-5 h-5 text-[#53D2DC] animate-pulse" />
                <p className="text-xs font-black text-brand-text leading-none uppercase tracking-tighter">Ready for Scan Sequence</p>
             </div>
             <p className="text-[9px] font-bold text-brand-muted leading-relaxed uppercase tracking-[0.2em] opacity-60">Center the barcode within the holographic brackets for real-time AI recognition.</p>
           </div>
        )}
      </div>
      
      <style>{`
        @keyframes scan { 
          0%, 100% { top: 0; opacity: 0.1; } 
          50% { top: 100%; opacity: 0.9; } 
        }
      `}</style>
    </div>
  )
};

export default BarcodeScanner;

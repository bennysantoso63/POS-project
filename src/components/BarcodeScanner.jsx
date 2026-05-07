import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCcw } from 'lucide-react';

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

  const [sysStatus, setSysStatus] = useState('Memuat Engine (WASM)...');
  const [workerReady, setWorkerReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [metrics, setMetrics] = useState({ variance: 0, isBlurry: false, processTime: 0 });
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'WORKER_READY') {
        setWorkerReady(true);
        setSysStatus('Menunggu Kamera...');
      } else if (e.data.type === 'FRAME_RESULT') {
        setMetrics({ variance: e.data.variance, isBlurry: e.data.isBlurry, processTime: e.data.processTimeMs });
        
        if (e.data.barcode) {
          const now = Date.now();
          if (debounceRef.current.text !== e.data.barcode || (now - debounceRef.current.time) > 1500) {
            debounceRef.current = { text: e.data.barcode, time: now };
            playBeep();
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
        setSysStatus('Kamera Ditolak.');
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
    <div className={`bg-slate-900 rounded-2xl border border-slate-700 shadow-inner overflow-hidden flex ${compact ? 'flex-row items-center p-2 gap-3' : 'flex-col md:flex-row p-4 gap-4'}`}>
      <div className={`relative bg-black rounded-xl overflow-hidden border-2 transition-colors duration-300 flex items-center justify-center shrink-0 ${flash ? 'border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'border-slate-700'} ${compact ? 'w-32 h-20' : 'w-full md:w-64 aspect-video'}`}>
        {(!cameraReady || !workerReady) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/90 z-20">
            <RefreshCcw className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} animate-spin text-indigo-500 mb-1`} />
            {!compact && <span className="text-xs text-center px-2">{sysStatus}</span>}
          </div>
        )}
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {cameraReady && workerReady && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`w-3/5 h-1/2 border border-dashed relative ${flash ? 'border-emerald-400 bg-emerald-500/20' : metrics.isBlurry ? 'border-red-500' : 'border-indigo-400/50'}`}>
               {!metrics.isBlurry && !flash && <div className="w-full h-px bg-indigo-400 absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>}
            </div>
          </div>
        )}
      </div>
      
      <div className={`flex flex-col justify-center ${compact ? 'flex-1' : 'w-full'}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-indigo-400"/> AI Scanner Aktif</span>
          {metrics.isBlurry && <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">BLUR</span>}
        </div>
        {!compact && (
          <div className="space-y-2 mt-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Fokus</span><span className={metrics.isBlurry?'text-red-400':'text-emerald-400'}>{metrics.variance}</span></div>
              <div className="w-full bg-slate-800 rounded-full h-1"><div className={`h-1 rounded-full ${metrics.isBlurry?'bg-red-500':'bg-emerald-500'}`} style={{width: `${Math.min(100, (metrics.variance/300)*100)}%`}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Latensi</span><span className="text-indigo-400">{metrics.processTime}ms</span></div>
              <div className="w-full bg-slate-800 rounded-full h-1"><div className="h-1 rounded-full bg-indigo-500" style={{width: `${Math.min(100, (metrics.processTime/150)*100)}%`}}></div></div>
            </div>
          </div>
        )}
        {compact && (
           <p className="text-[10px] text-slate-500 mt-1 leading-tight">Arahkan kamera ke Barcode produk. Pemrosesan CLAHE Edge-AI berjalan.</p>
        )}
      </div>
      <style>{`@keyframes scan { 0%, 100% { top: 0; } 50% { top: 100%; } }`}</style>
    </div>
  )
};

export default BarcodeScanner;

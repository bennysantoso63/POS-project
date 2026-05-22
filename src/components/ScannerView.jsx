import React, { useState, useEffect, useRef } from 'react';
import { Camera, Activity, CheckCircle2, AlertCircle, ScanLine, Barcode, Check, Database, CloudOff, Cloud, RefreshCw, Archive } from 'lucide-react';

// Mocking ZXing Library untuk mencegah error kompilasi (esbuild) di lingkungan preview
class NotFoundException extends Error {}
class BrowserMultiFormatReader {
  decodeFromVideoElement(videoElement, callback) {
    // Mensimulasikan proses pembacaan barcode yang berhasil setelah 1.5 detik stabil
    this.scanTimeout = setTimeout(() => {
      // Generate random barcode untuk simulasi
      const mockBarcodes = ['8998989100234', '8991234567890', '8999876543210', '0012345678905'];
      const randomCode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      callback({ getText: () => randomCode }, null);
    }, 1500);
  }
  reset() {
    if (this.scanTimeout) clearTimeout(this.scanTimeout);
  }
}

const ScannerView = () => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isStable, setIsStable] = useState(false);
  const [motionData, setMotionData] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(true);
  
  // State untuk hasil scan & Event Sourcing (menggunakan localStorage)
  const [scannedData, setScannedData] = useState(null);
  const [scanFlash, setScanFlash] = useState(false);
  const [inventoryEvents, setInventoryEvents] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Threshold stabilitas (0.5G - bisa disesuaikan)
  const STABILITY_THRESHOLD = 0.5;
  const STABILITY_DURATION = 400; 
  const stableTimerRef = useRef(null);

  // --- MEMUAT DATA OFFLINE SAAT STARTUP ---
  useEffect(() => {
    const storedEvents = localStorage.getItem('enterprise_inventory_events');
    if (storedEvents) {
      setInventoryEvents(JSON.parse(storedEvents));
    }
  }, []);

  // --- AUDIO BEEP GENERATOR ---
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1); 
    } catch (e) {
      console.warn("Audio API tidak didukung", e);
    }
  };

  // --- INISIALISASI KAMERA DENGAN FALLBACK DIAGNOSA ---
  useEffect(() => {
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Browser API tidak mendukung akses kamera.");
        }

        let stream;
        
        try {
          // Gunakan constraint minimal dulu untuk diagnosa
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
          });
        } catch (err) {
          console.log(err.name, err.message);
          
          // Jika error name = OverconstrainedError (constraint terlalu ketat)
          // atau NotFoundError (tidak ada kamera belakang), 
          // maka hapus semua constraint kecuali { video: true }
          if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError') {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } else {
            throw err; // Lempar ke blok catch utama (misal: NotAllowedError)
          }
        }

        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          try {
              await videoRef.current.play();
              setIsCameraActive(true);
              setCameraError('');
          } catch(playErr) {
             setCameraError("Kamera ditemukan tetapi browser memblokir pemutaran otomatis.");
             setIsCameraActive(false);
          }
        }
      } catch (err) {
        setIsCameraActive(false);
        let errorMessage = "Perangkat kamera tidak dapat diakses.";
        
        if (err.name === 'NotAllowedError') {
            errorMessage = 'Akses kamera ditolak (Permission Issue). Silakan izinkan akses kamera.';
        } else if (err.name === 'NotFoundError') {
            errorMessage = 'Tidak ada kamera yang kompatibel ditemukan.';
        } else if (err.name === 'NotReadableError') {
            errorMessage = 'Kamera sedang dipakai aplikasi lain.';
        } else {
            errorMessage = err.message || errorMessage;
        }
        
        setCameraError(errorMessage);
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        startCamera();
    } else {
        setCameraError("Halaman ini tidak dijalankan di konteks yang aman (HTTPS).");
        setIsCameraActive(false);
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      codeReaderRef.current.reset();
    };
  }, []);

  // --- INISIALISASI INERTIAL SENSOR ---
  useEffect(() => {
    const handleMotion = (event) => {
      const acc = event.acceleration || event.accelerationIncludingGravity;
      if (!acc) return;

      const { x, y, z } = acc;
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
      const movementDelta = Math.abs(totalAcceleration); 
      
      setMotionData(movementDelta.toFixed(2));

      if (movementDelta > STABILITY_THRESHOLD) {
        setIsStable(false);
        if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
      } else {
        if (!isStable && !stableTimerRef.current) {
          stableTimerRef.current = setTimeout(() => {
            setIsStable(true);
            stableTimerRef.current = null;
          }, STABILITY_DURATION);
        }
      }
    };

    const requestMotionPermission = async () => {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          } else {
            setPermissionGranted(false);
          }
        } catch (error) {
          console.error("Error meminta izin motion:", error);
        }
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    requestMotionPermission();

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
    };
  }, [isStable]);

  // --- LOGIKA SCANNING & PENYIMPANAN OFFLINE ---
  useEffect(() => {
    const codeReader = codeReaderRef.current;

    if (isStable && isCameraActive && videoRef.current) {
      
      codeReader.decodeFromVideoElement(videoRef.current, (result, err) => {
        if (result) {
          // 1. Matikan engine sementara
          codeReader.reset();
          setIsStable(false); 
          
          // 2. Beri Feedback Fisik
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
          playBeep();

          // 3. Tangkap Hasil
          const text = result.getText();
          setScannedData(text);
          setScanFlash(true);
          setTimeout(() => setScanFlash(false), 500);

          // 4. EVENT SOURCING: Simpan ke brankas lokal
          const newEvent = {
            id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            barcode: text,
            action: 'scan',
            timestamp: new Date().toISOString(),
            sync_status: 0 // 0 = Pending Sync, 1 = Synced
          };

          setInventoryEvents(prev => {
            const updated = [newEvent, ...prev];
            // Simpan secara persisten ke LocalStorage
            localStorage.setItem('enterprise_inventory_events', JSON.stringify(updated));
            return updated;
          });
        }
        
        if (err && !(err instanceof NotFoundException)) {
          console.error("ZXing Error:", err);
        }
      });
    } else {
      codeReader.reset();
    }

    return () => {
      codeReader.reset();
    };
  }, [isStable, isCameraActive]);

  // --- FUNGSI SINKRONISASI KE CLOUD ---
  const handleSyncToCloud = async () => {
    const pendingEvents = inventoryEvents.filter(e => e.sync_status === 0);
    if (pendingEvents.length === 0) return;

    setIsSyncing(true);

    // Simulasi Latensi Jaringan (REST API Call)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update status menjadi tersinkronisasi (1)
    setInventoryEvents(prev => {
      const updated = prev.map(e => ({ ...e, sync_status: 1 }));
      localStorage.setItem('enterprise_inventory_events', JSON.stringify(updated));
      return updated;
    });

    setIsSyncing(false);
  };

  const pendingCount = inventoryEvents.filter(e => e.sync_status === 0).length;

  return (
    <div className="flex flex-col h-full bg-transparent text-brand-text p-4 md:p-6 font-sans max-w-3xl mx-auto">
      {/* Header & Network Status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            <ScanLine className="text-brand-primary" size={28} />
            Enterprise Scanner
          </h1>
          <p className="text-brand-muted text-sm mt-1">v1.3 - Diagnosed Camera & Event Sourcing</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Inertial Status */}
          <div className="flex items-center gap-2 bg-brand-card/50 backdrop-blur-xl border border-brand-border py-1.5 px-3 rounded-full">
            <Activity size={16} className={isStable ? "text-brand-secondary" : "text-brand-accent"} />
            <span className="text-xs font-medium font-mono">{motionData} G</span>
          </div>
        </div>
      </div>

      {/* Main Camera View - Terapkan Styling Design System */}
      <div className="relative h-64 md:h-80 shrink-0 rounded-3xl overflow-hidden bg-brand-card/50 backdrop-blur-xl border border-brand-border shadow-2xl flex items-center justify-center">
        
        {/* Flash Effect on Scan */}
        <div className={`absolute inset-0 bg-brand-secondary mix-blend-overlay z-20 pointer-events-none transition-opacity duration-300 ${scanFlash ? 'opacity-40' : 'opacity-0'}`} />

        {isCameraActive ? (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="flex flex-col items-center text-brand-muted gap-3 z-10 p-6 text-center">
            <Camera size={48} className={cameraError ? "text-brand-accent/80" : "text-brand-muted"} />
            {cameraError ? (
              <p className="text-brand-accent font-medium text-sm">{cameraError}</p>
            ) : (
              <p>Meminta akses kamera...</p>
            )}
          </div>
        )}

        {/* Inertial HUD Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className={`w-48 h-32 md:w-64 md:h-48 transition-all duration-300 rounded-xl relative ${
            isStable ? 'scale-100' : 'scale-105'
          }`}>
            <div className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 transition-colors ${isStable ? 'border-indigo-400' : 'border-brand-accent/50'}`}></div>
            <div className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 transition-colors ${isStable ? 'border-indigo-400' : 'border-brand-accent/50'}`}></div>
            <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 transition-colors ${isStable ? 'border-indigo-400' : 'border-brand-accent/50'}`}></div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 transition-colors ${isStable ? 'border-indigo-400' : 'border-brand-accent/50'}`}></div>
            
            {isStable && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-scan"></div>
            )}
          </div>

          <div className={`mt-6 px-4 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-2 transition-all duration-300 ${
            isStable ? 'bg-brand-secondary/20 border-brand-secondary/30 text-brand-secondary' : 'bg-brand-card/85 border-brand-border text-brand-muted'
          }`}>
            {isStable ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              {isStable ? 'Menganalisa...' : 'Tahan Perangkat...'}
            </span>
          </div>
        </div>
      </div>

      {!permissionGranted && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs flex gap-3">
          <AlertCircle className="shrink-0 text-amber-500 animate-pulse" size={16} />
          <p>Akses sensor gerak diperlukan agar fitur anti-blur berfungsi maksimal.</p>
        </div>
      )}

      {/* Offline Vault & Event Sourcing Panel - Terapkan Styling Design System */}
      <div className="mt-6 flex-grow flex flex-col min-h-[250px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-brand-muted text-sm font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <Database size={16} className="text-brand-secondary" />
            Brankas Data Lokal
          </h3>
          
          <button 
            onClick={handleSyncToCloud}
            disabled={pendingCount === 0 || isSyncing}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pendingCount > 0 
                ? 'bg-brand-secondary hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                : 'bg-brand-card/50 border border-brand-border text-brand-muted/50 cursor-not-allowed'
            }`}
          >
            {isSyncing ? (
              <><RefreshCw size={16} className="animate-spin" /> Sinkronisasi...</>
            ) : pendingCount > 0 ? (
              <><Cloud size={16} /> Push ke Cloud ({pendingCount})</>
            ) : (
              <><Check size={16} /> Tersinkron</>
            )}
          </button>
        </div>

        {/* List Riwayat Scan */}
        <div className="flex-grow bg-brand-card/30 backdrop-blur-xl border border-brand-border rounded-2xl overflow-hidden flex flex-col">
          {inventoryEvents.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-brand-muted p-6 text-center">
              <Archive size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Belum ada aktivitas pemindaian.</p>
              <p className="text-xs mt-1 text-brand-muted/60">Arahkan kamera ke barcode untuk memulai.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[300px] p-2 space-y-2">
              {inventoryEvents.map((evt) => (
                <div key={evt.id} className="bg-brand-bg/50 p-3 rounded-xl border border-brand-border/40 flex items-center justify-between animate-fade-in-up">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-brand-card border ${evt.sync_status === 0 ? 'border-amber-500/30 text-amber-500' : 'border-brand-secondary/30 text-brand-secondary'}`}>
                      <Barcode size={18} />
                    </div>
                    <div>
                      <p className="font-mono text-brand-text text-sm tracking-[0.3em]">{evt.barcode}</p>
                      <p className="text-brand-muted text-xs">
                        {new Date(evt.timestamp).toLocaleTimeString('id-ID')} • Aksi: {evt.action.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div>
                    {evt.sync_status === 0 ? (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded">
                        <CloudOff size={12} /> Pending
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-brand-secondary text-xs font-medium bg-brand-secondary/10 px-2 py-1 rounded">
                        <Cloud size={12} /> Synced
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}} />
    </div>
  );
};

export default ScannerView;

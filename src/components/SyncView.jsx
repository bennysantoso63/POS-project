import React, { useState } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, AlertCircle, 
  RefreshCw, Database, ArrowRight, Layers, ShieldCheck,
  Zap, Download, Activity, Globe, LogIn, UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SyncView() {
  // State untuk Excel Sync
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [targetPlatform, setTargetPlatform] = useState('excel_manual'); // 'excel_manual' | 'shopee' | 'tokopedia'

  // State untuk Google Contacts Sync
  const [googleStatus, setGoogleStatus] = useState({ connected: false, message: '' });
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);

  React.useEffect(() => {
    // Muat status auto-backup saat mount
    const fetchStatus = async () => {
      try {
        const status = await window.api.sync.getDriveSyncStatus();
        setIsAutoBackupEnabled(status);
      } catch (e) {
        console.error("Gagal memuat status auto-backup:", e);
      }
    };
    fetchStatus();
  }, []);

  // --- HANDLERS EXCEL SYNC ---
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsProcessing(true);
    setSyncStatus(null);

    try {
      const result = await window.api.sync.dryRunExcel(selectedFile.path);
      setPreview(result);
      toast.success('Analisa Excel Selesai');
    } catch (error) {
      setSyncStatus({ type: 'error', message: `Gagal membaca file: ${error.message}` });
      setPreview(null);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    if (!preview || preview.valid.length === 0) return;
    
    setIsProcessing(true);
    try {
      const result = await window.api.sync.commitExcel(preview.valid, targetPlatform);
      setSyncStatus({ type: 'success', message: `Berhasil sinkronisasi ${result.processed} produk ke harga ${targetPlatform === 'excel_manual' ? 'OFFLINE' : 'ONLINE'}!` });
      setPreview(null);
      setFile(null);
      toast.success('Database Berhasil Diperbarui');
    } catch (error) {
      setSyncStatus({ type: 'error', message: `Gagal menyimpan data: ${error.message}` });
      toast.error('Gagal Sinkronisasi');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HANDLERS GOOGLE CONTACTS SYNC ---
  const handleGoogleConnect = async () => {
    setIsGoogleSyncing(true);
    setGoogleStatus({ connected: false, message: 'Membuka browser untuk login...' });
    
    try {
      const result = await window.api.sync.googleLogin();
      if (result.success) {
        setGoogleStatus({ connected: true, message: 'Berhasil terhubung ke Google Contacts.' });
        toast.success('Terhubung ke Google');
      }
    } catch (error) {
      setGoogleStatus({ connected: false, message: `Gagal login: ${error.message}` });
      toast.error('Gagal Login Google');
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const handleGoogleSync = async () => {
    setIsGoogleSyncing(true);
    setGoogleStatus(prev => ({ ...prev, message: 'Menyinkronkan data pelanggan ke Google...' }));
    
    try {
      const result = await window.api.sync.syncCustomersToGoogle();
      setGoogleStatus({ connected: true, message: `Sukses! ${result.synced} kontak berhasil disinkronisasi.` });
      toast.success(`Sinkronisasi ${result.synced} kontak selesai`);
    } catch (error) {
      setGoogleStatus({ connected: true, message: `Sinkronisasi terhenti: ${error.message}` });
      toast.error('Gagal Sinkronisasi Google');
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const handleManualBackup = async () => {
    setIsGoogleSyncing(true);
    setGoogleStatus(prev => ({ ...prev, message: 'Mengunggah backup database ke Drive...' }));
    
    try {
      const dbPath = "pos_mandiri.db"; 
      const result = await window.api.sync.uploadToDrive("", dbPath); 
      
      if (result.success) {
        setGoogleStatus({ connected: true, message: 'Berhasil mengunggah backup ke Google Drive.' });
        toast.success('Backup Cloud Sukses');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setGoogleStatus({ connected: true, message: `Gagal backup: ${error.message}` });
      toast.error('Gagal Backup ke Drive');
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const handleToggleAutoBackup = async () => {
    const newState = !isAutoBackupEnabled;
    try {
      await window.api.sync.toggleDriveSyncStatus(newState);
      setIsAutoBackupEnabled(newState);
      toast.success(`Auto-Backup ${newState ? 'AKTIF' : 'NONAKTIF'}`);
    } catch (e) {
      toast.error('Gagal mengubah pengaturan');
    }
  };

  return (
    <div className="flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto custom-scrollbar bg-brand-bg text-brand-text font-sans h-full relative selection:bg-brand-primary/30 selection:text-white">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-16 gap-12 relative z-[30]">
        <div>
          <div className="flex items-center gap-6 mb-6">
             <div className="w-20 h-20 bg-brand-primary rounded-[2.5rem] flex items-center justify-center shadow-[0_24px_48px_-12px_rgba(var(--brand-primary-rgb),0.5)] relative overflow-hidden group">
                <RefreshCw className="text-white w-10 h-10 group-hover:rotate-180 transition-transform duration-1000" />
             </div>
             <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-none">
                   Omnichannel <span className="text-brand-primary">Sync</span>
                </h1>
                <p className="text-brand-muted text-[10px] font-bold mt-3 tracking-wider opacity-60 uppercase">Integrasi Data Multi-Platform</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 relative z-10">
        
        {/* EXCEL SYNC PANEL */}
        <div className="card-premium p-10 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -top-10 -right-10 p-20 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <UploadCloud size={150} />
          </div>
          
          <div>
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <FileText size={24} />
               </div>
               <h3 className="text-lg font-black tracking-tight">1. Import Produk (Excel)</h3>
            </div>
            
            <div className="flex flex-col gap-6">
              <label className="block w-full py-12 bg-brand-bg/50 border-4 border-dashed border-brand-border rounded-[2.5rem] cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all mb-2 group/drop">
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                <div className="flex flex-col items-center gap-4">
                   <div className="p-4 bg-brand-primary/10 rounded-[1.5rem] group-hover/drop:scale-110 transition-all shadow-xl shadow-brand-primary/5">
                      <UploadCloud className="w-8 h-8 text-brand-primary"/>
                   </div>
                   <p className="text-[9px] font-black tracking-[0.3em] text-brand-text opacity-40 uppercase">Pilih File Master Produk</p>
                </div>
              </label>

              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest pl-2">Target Sinkronisasi Harga:</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'excel_manual', label: 'Offline', color: 'blue' },
                    { id: 'shopee', label: 'Shopee', color: 'orange' },
                    { id: 'tokopedia', label: 'Tokped', color: 'green' }
                  ].map(plat => (
                    <button
                      key={plat.id}
                      onClick={() => setTargetPlatform(plat.id)}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        targetPlatform === plat.id 
                        ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                        : 'bg-brand-card/50 text-brand-muted border-brand-border hover:border-brand-primary/40'
                      }`}
                    >
                      {plat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {file && (
              <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl flex items-center gap-4">
                 <div className="w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center text-white shrink-0">
                    <CheckCircle2 size={16} />
                 </div>
                 <p className="text-xs font-bold truncate text-brand-primary">{file.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* GOOGLE CONTACTS SYNC PANEL */}
        <div className="card-premium p-10 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -top-10 -right-10 p-20 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <Globe size={150} />
          </div>
          
          <div>
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Globe size={24} />
               </div>
               <h3 className="text-lg font-black tracking-tight">2. Sync Pelanggan (Google)</h3>
            </div>
            <div className="flex justify-between items-start mb-8">
              <p className="text-[10px] font-bold text-brand-muted leading-relaxed opacity-60 max-w-[60%]">
                Otomatiskan pencatatan nomor HP pelanggan ke akun Google untuk mempermudah broadcast WhatsApp.
              </p>
              
              <div className="flex flex-col items-end gap-2">
                <span className="text-[8px] font-black text-brand-muted uppercase tracking-widest">Auto-Backup</span>
                <button 
                  onClick={handleToggleAutoBackup}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-500 relative ${
                    isAutoBackupEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-brand-border'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-md ${
                    isAutoBackupEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {googleStatus.message && (
              <div className={`p-4 rounded-2xl text-[10px] font-black tracking-widest uppercase mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                googleStatus.connected || googleStatus.message.includes('Sukses') 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                {googleStatus.connected ? <CheckCircle2 size={14} /> : <Activity size={14} className="animate-pulse" />}
                {googleStatus.message}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-brand-border/50">
            {!googleStatus.connected ? (
              <button
                onClick={handleGoogleConnect}
                disabled={isGoogleSyncing}
                className="w-full py-5 bg-brand-card/80 border-2 border-brand-border rounded-[2rem] text-[10px] font-black text-brand-primary hover:text-white hover:bg-brand-primary transition-all flex items-center justify-center gap-4 tracking-[0.3em] active:scale-95 shadow-xl shadow-black/5"
              >
                <LogIn size={18} />
                {isGoogleSyncing ? 'Menghubungkan...' : 'Login Akun Google'}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGoogleSync}
                  disabled={isGoogleSyncing}
                  className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] text-[10px] font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 tracking-[0.3em] active:scale-95 shadow-xl shadow-emerald-500/20"
                >
                  <UserPlus size={18} />
                  {isGoogleSyncing ? 'Menyinkronkan...' : 'Mulai Sync Kontak'}
                </button>
                <button
                  onClick={handleManualBackup}
                  disabled={isGoogleSyncing}
                  className="w-full py-5 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary rounded-[2rem] text-[10px] font-black hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-4 tracking-[0.3em] active:scale-95"
                >
                  <Database size={18} />
                  {isGoogleSyncing ? 'Membackup...' : 'Backup DB ke Drive'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SYNC STATUS NOTIFICATION (EXCEL) */}
      {syncStatus && (
        <div className={`p-6 mb-12 rounded-[2.5rem] flex items-center gap-6 animate-in zoom-in-95 duration-500 border-2 ${
          syncStatus.type === 'error' 
          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            syncStatus.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
          }`}>
            {syncStatus.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <p className="text-xs font-black tracking-widest uppercase">{syncStatus.message}</p>
        </div>
      )}

      {/* PREVIEW AREA (EXCEL DRY RUN) */}
      {preview && !isProcessing && (
        <div className="card-premium overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-12 duration-1000">
           <div className="p-10 border-b border-brand-border bg-brand-bg/30 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-4">
                 <Zap className="text-brand-primary w-6 h-6" /> 3. Preview Dry Run
              </h3>
              <div className="flex gap-4">
                 <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex flex-col items-center shadow-lg">
                    <span className="text-[9px] font-black text-emerald-500 uppercase mb-1">Insert</span>
                    <span className="text-xl font-black text-emerald-500">{preview.stats.insert}</span>
                 </div>
                 <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-3 rounded-2xl flex flex-col items-center shadow-lg">
                    <span className="text-[9px] font-black text-amber-500 uppercase mb-1">Update</span>
                    <span className="text-xl font-black text-amber-500">{preview.stats.update}</span>
                 </div>
                 <div className="bg-rose-500/10 border border-rose-500/20 px-6 py-3 rounded-2xl flex flex-col items-center shadow-lg">
                    <span className="text-[9px] font-black text-rose-500 uppercase mb-1">Error</span>
                    <span className="text-xl font-black text-rose-500">{preview.stats.error}</span>
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left">
                 <thead className="sticky top-0 bg-brand-card/90 backdrop-blur-md z-20 border-b border-brand-border">
                    <tr>
                       <th className="px-8 py-6 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Row</th>
                       <th className="px-8 py-6 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">SKU</th>
                       <th className="px-8 py-6 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Product</th>
                       <th className="px-8 py-6 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Price</th>
                       <th className="px-8 py-6 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Stock</th>
                       <th className="px-8 py-6 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-border/50">
                    {preview.errors.map((item, idx) => (
                       <tr key={`err-${idx}`} className="bg-rose-500/[0.03]">
                          <td className="px-8 py-6 font-black text-rose-500">{item.rowNumber}</td>
                          <td className="px-8 py-6 text-xs font-bold opacity-40">{item.sku || '-'}</td>
                          <td className="px-8 py-6 text-xs font-bold">{item.name || '-'}</td>
                          <td className="px-8 py-6 text-xs tabular-nums">{item.price}</td>
                          <td className="px-8 py-6 text-xs tabular-nums">{item.stock}</td>
                          <td className="px-8 py-6 font-black text-rose-500 text-[9px] uppercase tracking-widest">{item.errorReason}</td>
                       </tr>
                    ))}
                    {preview.valid.map((item, idx) => (
                       <tr key={`val-${idx}`}>
                          <td className="px-8 py-6 text-xs font-bold text-brand-muted opacity-60">{item.rowNumber}</td>
                          <td className="px-8 py-6 text-xs font-black text-brand-text">{item.sku}</td>
                          <td className="px-8 py-6 text-xs font-bold">{item.name}</td>
                          <td className="px-8 py-6 text-xs font-black">Rp {item.price.toLocaleString()}</td>
                          <td className="px-8 py-6 text-xs font-bold">{item.stock}</td>
                          <td className="px-8 py-6">
                             <span className={`text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${
                                item.action === 'UPDATE' 
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                             }`}>
                                {item.action}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="p-10 bg-brand-bg/30 border-t border-brand-border flex justify-end">
              <button 
                onClick={handleCommit}
                disabled={preview.errors.length > 0 || preview.valid.length === 0}
                className={`px-12 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${
                  preview.errors.length > 0 || preview.valid.length === 0
                  ? 'bg-brand-border text-brand-muted cursor-not-allowed opacity-50' 
                  : 'bg-brand-primary hover:bg-brand-secondary text-white shadow-2xl shadow-brand-primary/40'
                }`}
              >
                {preview.errors.length > 0 ? 'Perbaiki Error Dahulu' : 'Commit ke Database'}
                <ArrowRight size={18} />
              </button>
           </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[1000] bg-brand-bg/80 backdrop-blur-xl flex flex-col items-center justify-center">
           <div className="w-24 h-24 border-8 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-8 shadow-2xl shadow-brand-primary/20"></div>
           <p className="text-xs font-black tracking-[0.5em] text-brand-text uppercase">Processing Neural Data...</p>
        </div>
      )}

    </div>
  );
}

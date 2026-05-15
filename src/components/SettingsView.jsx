import React, { useState, useEffect } from 'react';
import { 
  Settings, Store, Percent, Shield, Save, Moon, Sun, Users, Printer,
  Lock, Unlock, KeyRound, ChevronRight, X, Trash2, ShieldAlert, UploadCloud, RefreshCcw, Database, UserCircle,
  ShieldCheck, Globe, Monitor, Layout, Terminal, Fingerprint, Activity, Zap, Cpu, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

import CustomDropdown from './ui/CustomDropdown';

export default function SettingsView({ 
  config, 
  onConfigChange, 
  onSave, 
  currentUser, 
  isDarkMode, 
  toggleDarkMode, 
  isOwner, 
  canEdit 
}) {
  
  const safeConfig = config || {};
  const [taxLocked, setTaxLocked] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [users, setUsers] = useState([]);
  const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' });
  const [pinStatus, setPinStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    if (isOwner) {
      window.api?.invoke('api-get-users').then(data => setUsers(data || []));
    }
  }, [isOwner]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (onConfigChange) {
      onConfigChange({ ...safeConfig, [name]: value });
    }
  };

  const handleUnlockSettings = async (e) => {
    e.preventDefault();
    const res = await window.api?.invoke('api-login', unlockPin);
    if (res.success && res.user.role === 'owner') {
      setIsUnlocked(true);
      setShowUnlockModal(false);
      setUnlockPin('');
      toast.success('Akses Dibuka: Pengaturan Dapat Diubah', {
        icon: '🔐',
        style: { background: '#10b981', color: '#fff', fontWeight: '700', fontSize: '10px' }
      });
    } else {
      toast.error('Akses Ditolak: PIN Pemilik Salah', {
        icon: '🚫',
        style: { background: '#ef4444', color: '#fff', fontWeight: '700', fontSize: '10px' }
      });
      setUnlockPin('');
    }
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinStatus({ type: 'error', msg: 'PIN baru tidak cocok' });
      return;
    }
    const res = await window.api.invoke('api-change-pin', {
      userId: currentUser.id,
      oldPin: pinForm.oldPin,
      newPin: pinForm.newPin
    });
    if (res.success) {
      setPinStatus({ type: 'success', msg: 'PIN keamanan telah diperbarui' });
      setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
      toast.success('PIN Berhasil Diganti', {
        style: { background: '#10b981', color: '#fff', fontWeight: '700', fontSize: '10px' }
      });
    } else {
      setPinStatus({ type: 'error', msg: res.error });
    }
  };

  const handleResetUserPin = async (userId, username) => {
    const newPin = prompt(`Masukkan PIN baru untuk ${username} (4-6 digit):`);
    if (!newPin) return;
    const res = await window.api?.invoke('api-update-user', userId, { pin: newPin, callerId: currentUser.id });
    if (res.success) toast.success(`PIN [${username}] Berhasil Diganti`);
    else toast.error('Gagal mengganti PIN');
  };

  const handleBackup = async () => {
    const res = await window.api?.invoke('api-backup-database');
    if (res?.success) {
      toast.success('Database Berhasil Dicadangkan', {
        style: { background: '#10b981', color: '#fff', fontWeight: '700', fontSize: '10px' }
      });
    } else {
      toast.error('Gagal mencadangkan data: ' + res.error);
    }
  };

  return (
    <div className="flex-1 p-10 md:p-20 overflow-y-auto custom-scrollbar bg-brand-bg text-brand-text font-sans h-full relative">
      
      {/* HEADER PENGATURAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-10">
        <div className="animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-8 mb-6">
             <div className="w-20 h-20 bg-brand-primary rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(var(--brand-primary-rgb),0.5)] relative group overflow-hidden border-2 border-white/10">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700"></div>
                <Settings className="text-white w-10 h-10 relative z-10 group-hover:rotate-180 transition-transform duration-1000" />
             </div>
             <div>
                <h1 className="text-6xl font-bold tracking-tighter leading-none mb-3">
                  Pengaturan <span className="text-brand-primary">Sistem</span>
                </h1>
                <p className="text-brand-muted text-[11px] font-bold tracking-widest opacity-50 ml-1">
                  Pusat Kendali • Keamanan • Pengaturan Toko
                </p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8 bg-brand-card/80 backdrop-blur-xl px-12 py-7 rounded-[3rem] border-2 border-brand-border shadow-2xl group hover:border-brand-primary/30 transition-all animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-[1.5rem] flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-inner group-hover:rotate-12 transition-transform">
            <UserCircle className="w-8 h-8" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-brand-muted leading-none mb-3 opacity-60">Hak Akses</span>
            <span className="text-lg font-bold text-brand-primary leading-none tracking-widest flex items-center gap-3">
               {currentUser?.role === 'owner' ? 'Pemilik' : (currentUser?.role || 'Kasir')}
               <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-14 pb-56">
        
        {/* BANNER STATUS KUNCI PENGATURAN */}
        {canEdit && (
          <div className={`p-12 lg:p-14 rounded-[5rem] border-2 flex flex-col lg:flex-row items-center justify-between gap-12 transition-all duration-1000 relative overflow-hidden group ${isUnlocked ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.15)]' : 'bg-brand-accent/5 border-brand-accent/20 shadow-[0_0_80px_rgba(var(--brand-accent-rgb),0.05)]'}`}>
            <div className={`absolute -top-24 -right-24 w-96 h-96 blur-[150px] pointer-events-none transition-colors duration-1000 ${isUnlocked ? 'bg-emerald-500/10' : 'bg-brand-accent/10'}`}></div>
            
            <div className="flex items-center gap-10 relative z-10">
              <div className={`w-24 h-24 rounded-[2.8rem] flex items-center justify-center text-white shadow-2xl transition-all duration-1000 scale-100 group-hover:scale-110 border-4 border-white/10 ${isUnlocked ? 'bg-emerald-500 shadow-emerald-500/40 rotate-[360deg]' : 'bg-brand-accent shadow-brand-accent/40'}`}>
                {isUnlocked ? <ShieldCheck size={48} /> : <ShieldAlert size={48} />}
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tighter flex items-center gap-5">
                  {isUnlocked ? 'Akses Pengaturan Terbuka' : 'Pengaturan Terkunci'}
                  {isUnlocked && <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse delay-150"></div><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse delay-300"></div></div>}
                </h3>
                <p className="text-[11px] font-bold text-brand-muted tracking-widest mt-3 opacity-60 leading-relaxed max-w-lg">
                  {isUnlocked ? 'Anda sekarang dapat mengubah pengaturan sistem secara bebas. Gunakan dengan hati-hati.' : 'Pengaturan sistem dikunci untuk keamanan. Masukkan PIN Pemilik untuk membukanya.'}
                </p>
              </div>
            </div>
            <div className="relative z-10 w-full lg:w-auto">
              {isUnlocked ? (
                <button onClick={() => setIsUnlocked(false)} className="w-full lg:w-auto px-16 py-6 bg-brand-text text-brand-bg rounded-[2.2rem] text-[11px] font-bold tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-2xl border-2 border-white/10">Kunci Kembali</button>
              ) : (
                isOwner && (
                  <button onClick={() => setShowUnlockModal(true)} className="w-full lg:w-auto px-16 py-6 bg-brand-accent text-white rounded-[2.2rem] text-[11px] font-bold tracking-widest shadow-[0_20px_40px_-10px_rgba(var(--brand-accent-rgb),0.5)] active:scale-95 flex items-center justify-center gap-6 group/btn hover:bg-brand-accent/90 transition-all border-2 border-white/10">
                    Buka Pengaturan <ChevronRight size={22} className="group-hover:translate-x-2 transition-transform duration-500" />
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* PENGATURAN TAMPILAN */}
        <div className="bg-brand-card/60 backdrop-blur-2xl border-2 border-brand-border rounded-[5rem] p-14 flex flex-col lg:flex-row items-center justify-between shadow-2xl gap-14 overflow-hidden relative group">
          <div className="absolute -right-32 -bottom-32 opacity-[0.03] group-hover:scale-150 group-hover:rotate-12 transition-transform duration-[3000ms] pointer-events-none text-brand-primary">
             <Layout className="w-[500px] h-[500px]" />
          </div>
          
          <div className="relative z-10 max-w-2xl text-center lg:text-left">
            <h2 className="text-3xl font-bold text-brand-text flex items-center justify-center lg:justify-start gap-6 tracking-tighter mb-5">
              <Monitor className="w-10 h-10 text-brand-primary" />
              Tampilan Layar
            </h2>
            <p className="text-[12px] font-bold text-brand-muted tracking-widest leading-loose opacity-60">
              Atur kecerahan layar. Gunakan mode <span className="text-brand-primary">"Gelap"</span> untuk kenyamanan mata atau <span className="text-brand-accent">"Terang"</span> untuk siang hari.
            </p>
          </div>
          <div className="relative z-10 flex bg-brand-bg/80 backdrop-blur-md border-2 border-brand-border rounded-[3rem] p-4 shrink-0 shadow-inner w-full lg:w-auto scale-110">
            <button 
              type="button" onClick={() => isDarkMode && toggleDarkMode()}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-6 px-14 py-7 rounded-[2.5rem] text-[11px] font-bold tracking-widest transition-all duration-700 ${!isDarkMode ? 'bg-brand-card text-brand-accent shadow-[0_20px_40px_-10px_rgba(var(--brand-accent-rgb),0.3)] border-2 border-brand-border scale-105' : 'text-brand-muted hover:text-brand-text'}`}
            >
              <Sun className="w-6 h-6" /> Terang
            </button>
            <button 
              type="button" onClick={() => !isDarkMode && toggleDarkMode()}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-6 px-14 py-7 rounded-[2.5rem] text-[11px] font-bold tracking-widest transition-all duration-700 ${isDarkMode ? 'bg-brand-card text-brand-primary shadow-[0_20px_40px_-10px_rgba(var(--brand-primary-rgb),0.3)] border-2 border-brand-border scale-105' : 'text-brand-muted hover:text-brand-text'}`}
            >
              <Moon className="w-6 h-6" /> Gelap
            </button>
          </div>
        </div>

        {/* KONFIGURASI UTAMA */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-14 transition-all duration-1000 ${(!isUnlocked && canEdit) ? 'opacity-20 grayscale blur-[5px] pointer-events-none' : ''}`}>
          
          {/* PROFIL TOKO */}
          <div className="lg:col-span-7 bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border rounded-[5rem] p-14 lg:p-20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-bl-[150px] pointer-events-none group-hover:bg-brand-primary/10 transition-all duration-1000"></div>
            
            <div className="flex items-center gap-8 mb-16 border-b-2 border-brand-border pb-12 relative z-10">
              <div className="p-5 bg-brand-primary/10 rounded-[1.8rem] text-brand-primary border border-brand-primary/20 shadow-inner group-hover:scale-110 transition-transform"><Store className="w-10 h-10" /></div>
              <div>
                 <h2 className="text-2xl font-bold tracking-tighter text-brand-text mb-2">Profil Toko</h2>
                 <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50">Data Resmi Identitas Bisnis</p>
              </div>
            </div>
            
            <div className="space-y-12 relative z-10">
              <div className="space-y-5">
                <label className="text-[10px] font-bold tracking-widest text-brand-primary ml-4 opacity-80">Nama Toko / Bisnis</label>
                <div className="relative group/field">
                   <Terminal className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-primary/40 group-focus-within/field:text-brand-primary transition-colors" />
                   <input 
                     name="name" 
                     value={safeConfig.name || ''} 
                     onChange={handleChange} 
                     className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 pl-20 pr-10 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-sm tracking-widest hover:bg-white/80 dark:hover:bg-white/20" 
                   />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-5">
                  <label className="text-[10px] font-bold tracking-widest text-brand-primary ml-4 opacity-80">Slogan Toko</label>
                  <input name="slogan" value={safeConfig.slogan || ''} onChange={handleChange} className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 px-10 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-sm tracking-wide hover:bg-white/80 dark:hover:bg-white/20" />
                </div>
                <div className="space-y-5">
                  <label className="text-[10px] font-bold tracking-widest text-brand-primary ml-4 opacity-80">Nomor Telepon / WA</label>
                  <input name="phone" value={safeConfig.phone || ''} onChange={handleChange} className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 px-10 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all shadow-sm tracking-wide hover:bg-white/80 dark:hover:bg-white/20" />
                </div>
              </div>
              
              <div className="space-y-5">
                <label className="text-[10px] font-bold tracking-widest text-brand-primary ml-4 opacity-80">Alamat Lengkap Toko</label>
                <textarea name="address" value={safeConfig.address || ''} onChange={handleChange} rows="4" className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 px-10 text-xs font-bold text-brand-text outline-none focus:border-brand-primary transition-all resize-none shadow-sm custom-scrollbar tracking-wide leading-loose hover:bg-white/80 dark:hover:bg-white/20" />
              </div>

              <div className="pt-10 border-t border-brand-border/30 space-y-8">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20">
                       <Cpu size={20} />
                    </div>
                    <div>
                       <h3 className="text-[11px] font-bold tracking-widest text-brand-primary uppercase">Modul Intelijen Bisnis</h3>
                       <p className="text-[9px] font-bold text-brand-muted tracking-widest opacity-40 mt-1">Ekstensi Fitur Berbasis Domain</p>
                    </div>
                 </div>
                 
                 <div className="pl-4">
                    <CustomDropdown 
                      value={safeConfig.business_type || 'retail'} 
                      onChange={(val) => handleChange({ target: { name: 'business_type', value: val } })} 
                      options={[
                        { value: 'retail', label: 'Retail Umum (Standard POS)' },
                        { value: 'sembahyang', label: 'Toko Sembahyang (Fitur Ritual Cerdas)' }
                      ]} 
                      label="Jenis Bisnis"
                    />
                    
                    {safeConfig.business_type === 'sembahyang' && (
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black tracking-widest text-brand-primary uppercase">Threshold Anomali Void</label>
                                <input 
                                    type="number" 
                                    name="sembahyang_void_anomaly_threshold" 
                                    value={safeConfig.sembahyang_void_anomaly_threshold || 5} 
                                    onChange={handleChange} 
                                    className="w-full bg-white/40 dark:bg-white/5 border border-brand-border rounded-xl py-3 px-6 text-xs font-bold text-brand-text"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-black tracking-widest text-brand-primary uppercase">Jangkauan Prediksi Stok (Hari)</label>
                                <input 
                                    type="number" 
                                    name="sembahyang_burnrate_days_ahead" 
                                    value={safeConfig.sembahyang_burnrate_days_ahead || 2} 
                                    onChange={handleChange} 
                                    className="w-full bg-white/40 dark:bg-white/5 border border-brand-border rounded-xl py-3 px-6 text-xs font-bold text-brand-text"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-black tracking-widest text-brand-primary uppercase">Jumlah Produk KVI (Anchor)</label>
                                <input 
                                    type="number" 
                                    name="sembahyang_anchor_item_count" 
                                    value={safeConfig.sembahyang_anchor_item_count || 10} 
                                    onChange={handleChange} 
                                    className="w-full bg-white/40 dark:bg-white/5 border border-brand-border rounded-xl py-3 px-6 text-xs font-bold text-brand-text"
                                />
                            </div>
                            <div className="flex items-center gap-4 pt-4">
                                <div className="flex-1">
                                    <p className="text-[9px] font-bold text-brand-muted tracking-tight">Status Lunar & Kalender Ritual Aktif</p>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${safeConfig.sembahyang_lunar_display === '1' ? 'bg-brand-primary' : 'bg-slate-700'}`}
                                    onClick={() => handleChange({ target: { name: 'sembahyang_lunar_display', value: safeConfig.sembahyang_lunar_display === '1' ? '0' : '1' } })}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${safeConfig.sembahyang_lunar_display === '1' ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="text-[9px] font-bold text-brand-muted tracking-widest mt-4 opacity-50 leading-relaxed">
                       Mengaktifkan fitur khusus Kalender Lunar, Apriori Bundling, dan Radar Kasbon Vihara. Memerlukan restart modul untuk sinkronisasi data.
                    </p>
                  </div>
               </div>
            </div>
          </div>

          {/* PAJAK & PRINTER */}
          <div className="lg:col-span-5 space-y-14">
            
            {/* PENGATURAN PAJAK */}
            <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border rounded-[5rem] p-14 shadow-2xl relative overflow-visible group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-150 transition-transform duration-[2000ms]"><Shield size={200} className="text-brand-accent" /></div>
              
              <div className="flex items-center gap-8 mb-16 border-b-2 border-brand-border pb-12 relative z-10">
                <div className="p-5 bg-brand-accent/10 rounded-[1.8rem] text-brand-accent border border-brand-accent/20 shadow-inner group-hover:scale-110 transition-transform"><Percent className="w-10 h-10" /></div>
                <div>
                   <h2 className="text-2xl font-bold tracking-tighter text-brand-text mb-2">Pajak (Finansial)</h2>
                   <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50">Sistem Perhitungan Pajak</p>
                </div>
              </div>

              <div className="space-y-10 relative z-10">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-5">
                    <label className="text-[10px] font-bold tracking-widest text-brand-accent ml-4 opacity-80">Jenis Usaha</label>
                    <div className="relative group/select">
                      <CustomDropdown 
                        value={safeConfig.tax_type || 'OP'} 
                        onChange={(val) => handleChange({ target: { name: 'tax_type', value: val } })} 
                        options={[
                          { value: 'OP', label: 'Orang Pribadi (UMKM)' },
                          { value: 'Badan', label: 'Badan Usaha (PT/CV)' }
                        ]} 
                        label="Jenis Usaha"
                      />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <label className="text-[10px] font-bold tracking-widest text-brand-accent ml-4 opacity-80">Tahun Beroperasi</label>
                    <input type="number" name="tax_start_year" value={safeConfig.tax_start_year || '2024'} onChange={handleChange} className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-brand-border/50 rounded-[2rem] py-5 px-8 text-xs font-bold text-brand-text outline-none focus:border-brand-accent transition-all text-center tracking-widest shadow-sm hover:bg-white/80 dark:hover:bg-white/20" />
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="text-[10px] font-bold tracking-widest text-brand-accent flex justify-between items-center ml-4 opacity-80">
                    Tarif PPh Final (%)
                    <button type="button" onClick={() => setTaxLocked(!taxLocked)} className={`flex items-center gap-3 text-[9px] px-4 py-2 rounded-xl transition-all shadow-xl border-2 ${taxLocked ? 'bg-brand-card border-brand-border text-brand-muted' : 'bg-rose-500 border-rose-400 text-white animate-pulse'}`}>
                      {taxLocked ? <Lock size={12}/> : <Unlock size={12}/>} {taxLocked ? 'Terkunci' : 'Ubah'}
                    </button>
                  </label>
                  <div className="relative group/tax">
                    <input type="number" step="0.1" name="tax_rate" value={safeConfig.tax_rate ?? 0.5} onChange={handleChange} disabled={taxLocked} className={`w-full border-4 rounded-[3.5rem] px-12 py-12 pl-28 text-7xl font-bold outline-none transition-all tracking-tighter ${taxLocked ? 'bg-white/5 dark:bg-white/5 border-brand-border text-brand-muted/20 cursor-not-allowed opacity-50' : 'bg-white/60 dark:bg-white/10 border-brand-accent text-brand-accent shadow-[0_0_80px_rgba(var(--brand-accent-rgb),0.2)]'}`} />
                    <Percent className={`absolute left-12 top-1/2 -translate-y-1/2 w-12 h-12 transition-all duration-700 ${taxLocked ? 'text-brand-muted opacity-10' : 'text-brand-accent animate-bounce'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* PENGATURAN STRUK */}
            <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border rounded-[5rem] p-14 shadow-2xl group">
              <div className="flex items-center gap-8 mb-16 border-b-2 border-brand-border pb-12">
                <div className="p-5 bg-emerald-500/10 rounded-[1.8rem] text-emerald-500 border border-emerald-500/20 shadow-inner group-hover:scale-110 group-hover:rotate-12 transition-all"><Printer className="w-10 h-10" /></div>
                <div>
                   <h2 className="text-2xl font-bold tracking-tighter text-brand-text mb-2">Pengaturan Struk</h2>
                   <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50">Pencetakan Nota Thermal</p>
                </div>
              </div>
              <div className="space-y-5">
                <label className="text-[10px] font-bold tracking-widest text-brand-muted ml-4 opacity-70">Pesan di Bawah Struk</label>
                <textarea name="receiptFooter" value={safeConfig.receiptFooter || ''} onChange={handleChange} rows="4" className="w-full bg-brand-bg/60 border-2 border-brand-border rounded-[3rem] px-10 py-8 text-sm font-bold text-brand-text outline-none focus:border-brand-primary transition-all resize-none shadow-inner custom-scrollbar tracking-wide leading-relaxed focus:bg-brand-bg" placeholder="Contoh: Terima kasih telah berbelanja di toko kami..." />
              </div>
            </div>
          </div>
        </div>

        {/* UTILITY SISTEM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14">
          
          {/* SINKRONISASI CLOUD */}
          <div className="lg:col-span-4 flex flex-col gap-14">
            <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border p-14 rounded-[5rem] shadow-2xl flex flex-col justify-between group overflow-hidden relative min-h-[350px]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 blur-[100px] pointer-events-none group-hover:bg-brand-primary/20 transition-all duration-1000"></div>
              <div>
                <div className="flex items-center gap-8 mb-12">
                   <div className="w-16 h-16 bg-brand-primary/10 rounded-[1.8rem] flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-inner group-hover:scale-110 group-hover:rotate-[-360deg] transition-all duration-[1500ms]">
                      <Globe size={32} />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold tracking-widest text-brand-text">Sinkronisasi Cloud</h3>
                      <p className="text-[9px] font-bold text-brand-muted tracking-widest opacity-40 mt-1">Pusat Data Online</p>
                   </div>
                </div>
                <p className="text-[11px] font-bold text-brand-muted tracking-widest leading-loose opacity-60">
                   Sinkronkan data toko Anda ke server online agar data selalu aman dan terupdate di mana saja.
                </p>
              </div>
              <div className="flex gap-6 mt-10 relative z-10">
                <button onClick={() => window.api?.invoke('api-sync-cloud', { direction: 'push' })} className="flex-1 py-6 bg-brand-primary text-white rounded-[2rem] text-[10px] font-bold tracking-widest hover:bg-brand-secondary transition-all shadow-xl active:scale-95 group/btn border-2 border-white/10">Upload</button>
                <button onClick={() => window.api?.invoke('api-sync-cloud', { direction: 'pull' })} className="flex-1 py-6 bg-brand-bg/60 border-2 border-brand-border rounded-[2rem] text-[10px] font-bold text-brand-muted tracking-widest hover:border-brand-primary/40 transition-all active:scale-95">Download</button>
              </div>
            </div>

            {/* BACKUP DATABASE */}
            <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border p-14 rounded-[5rem] shadow-2xl flex flex-col justify-between group overflow-hidden relative min-h-[350px]">
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none group-hover:scale-150 transition-all duration-[3000ms]"></div>
              <div>
                <div className="flex items-center gap-8 mb-12">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.8rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                      <Database size={32} />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold tracking-widest text-brand-text">Cadangan Data</h3>
                      <p className="text-[9px] font-bold text-brand-muted tracking-widest opacity-40 mt-1">Backup Database Lokal</p>
                   </div>
                </div>
                <p className="text-[11px] font-bold text-brand-muted tracking-widest leading-loose opacity-60">
                   Buat salinan data seluruh transaksi dan stok barang untuk cadangan jika terjadi kendala pada sistem.
                </p>
              </div>
              <button onClick={handleBackup} className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] text-[11px] font-bold tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-6 shadow-[0_25px_50px_-10px_rgba(16,185,129,0.5)] active:scale-95 group/btn border-2 border-white/10 mt-10 relative z-10">
                 <ShieldCheck size={24} className="group-hover:scale-125 transition-transform duration-500" /> Buat Cadangan Sekarang
              </button>
            </div>
          </div>

          {/* KEAMANAN PIN */}
          <div className="lg:col-span-8 bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border p-14 lg:p-20 rounded-[5rem] shadow-2xl relative overflow-hidden group min-h-[500px]">
            <div className="absolute -bottom-24 -right-24 p-12 opacity-[0.03] pointer-events-none group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-[3000ms] text-emerald-500">
               <Fingerprint size={300} />
            </div>
            
            <div className="flex items-center gap-8 mb-16 border-b-2 border-brand-border pb-12 relative z-10">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.8rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform">
                  <KeyRound size={32} />
               </div>
               <div>
                  <h3 className="text-2xl font-bold tracking-tighter">PIN Keamanan</h3>
                  <p className="text-[10px] font-bold text-brand-muted tracking-widest opacity-50 mt-1">Ganti PIN untuk Masuk ke Sistem</p>
               </div>
            </div>
            <form onSubmit={handleUpdatePin} className="grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
              <div className="md:col-span-12 space-y-5">
                <label className="text-[10px] font-bold text-brand-muted tracking-widest ml-4 opacity-70">PIN Lama</label>
                <input type="password" required value={pinForm.oldPin} onChange={e => setPinForm({...pinForm, oldPin: e.target.value})} className="w-full bg-brand-bg/60 border-2 border-brand-border rounded-[2.5rem] px-10 py-7 text-4xl font-bold outline-none focus:border-emerald-500 transition-all tracking-[0.8em] text-center shadow-inner focus:bg-brand-bg" placeholder="••••" />
              </div>
              <div className="md:col-span-6 space-y-5">
                <label className="text-[10px] font-bold text-brand-muted tracking-widest ml-4 opacity-70">PIN Baru</label>
                <input type="password" required value={pinForm.newPin} onChange={e => setPinForm({...pinForm, newPin: e.target.value})} className="w-full bg-brand-bg/60 border-2 border-brand-border rounded-[2.5rem] px-10 py-7 text-4xl font-black outline-none focus:border-emerald-500 transition-all tracking-[0.8em] text-center shadow-inner focus:bg-brand-bg" placeholder="••••" />
              </div>
              <div className="md:col-span-6 space-y-5">
                <label className="text-[10px] font-bold text-brand-muted tracking-widest ml-4 opacity-70">Ulangi PIN Baru</label>
                <input type="password" required value={pinForm.confirmPin} onChange={e => setPinForm({...pinForm, confirmPin: e.target.value})} className="w-full bg-brand-bg/60 border-2 border-brand-border rounded-[2.5rem] px-10 py-7 text-4xl font-bold outline-none focus:border-emerald-500 transition-all tracking-[0.8em] text-center shadow-inner focus:bg-brand-bg" placeholder="••••" />
              </div>
              <button type="submit" className="md:col-span-12 py-8 bg-emerald-600 text-white rounded-[3rem] text-[11px] font-bold tracking-widest hover:bg-emerald-500 transition-all shadow-[0_25px_50px_-10px_rgba(16,185,129,0.5)] active:scale-95 flex items-center justify-center gap-6 group/save border-2 border-white/10 mt-6">
                 <ShieldCheck size={28} className="group-hover:scale-125 transition-transform duration-500" /> Ganti PIN Sekarang
              </button>
            </form>
          </div>
        </div>

        {/* DAFTAR STAF & KASIR */}
        {isOwner && (
          <div className="bg-brand-card/40 backdrop-blur-xl border-2 border-brand-border p-14 lg:p-20 rounded-[6rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[150px] pointer-events-none group-hover:bg-brand-primary/10 transition-all duration-[2000ms]"></div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-20 border-b-2 border-brand-border pb-14 relative z-10 gap-10">
              <div className="flex items-center gap-10">
                <div className="w-24 h-24 bg-brand-primary/10 rounded-[2.5rem] flex items-center justify-center text-brand-primary border-2 border-brand-primary/20 shadow-inner group-hover:rotate-12 transition-transform">
                   <Users size={48} />
                </div>
                <div>
                   <h3 className="text-4xl font-bold tracking-tighter text-brand-text mb-3">Daftar Staf & Kasir</h3>
                   <p className="text-[11px] font-bold text-brand-muted tracking-widest opacity-50">Manajemen Hak Akses Pengguna</p>
                </div>
              </div>
              <div className="flex items-center gap-6 bg-brand-bg/80 backdrop-blur-md px-10 py-5 rounded-[2.2rem] border-2 border-brand-border shadow-xl">
                 <Zap size={20} className="text-brand-primary animate-pulse" />
                 <span className="text-[11px] font-bold text-brand-text tracking-widest">{users.length} Staf Terdaftar Aktif</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10">
              {users.map(user => (
                <div key={user.id} className="flex flex-col p-10 bg-brand-bg/60 backdrop-blur-md border-2 border-brand-border rounded-[3.5rem] group/user hover:border-brand-primary/50 transition-all duration-700 shadow-lg hover:shadow-2xl hover:-translate-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-8 mb-10">
                    <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center font-black text-3xl shadow-inner border-2 transition-all duration-700 ${user.role === 'owner' ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent group-hover/user:bg-brand-accent group-hover/user:text-white' : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary group-hover/user:bg-brand-primary group-hover/user:text-white'}`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold tracking-tighter text-brand-text mb-2 transition-colors duration-500 group-hover/user:text-brand-primary">{user.username}</h4>
                      <div className={`inline-flex items-center gap-3 text-[9px] font-bold px-4 py-2 rounded-xl tracking-widest border-2 transition-all duration-700 ${user.role === 'owner' ? 'bg-brand-accent/5 border-brand-accent/20 text-brand-accent' : 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary'}`}>
                         <Activity size={12} className="animate-pulse" /> {user.role === 'owner' ? 'Pemilik' : user.role}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-8 border-t-2 border-brand-border/30 opacity-0 group-hover/user:opacity-100 transition-all translate-y-6 group-hover/user:translate-y-0 duration-500">
                    {user.role !== 'owner' ? (
                      <>
                        <button onClick={() => handleResetUserPin(user.id, user.username)} className="flex-1 py-5 bg-brand-card rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold tracking-widest text-brand-muted hover:text-brand-primary hover:border-brand-primary/40 border-2 border-brand-border shadow-xl active:scale-90 transition-all">
                          <KeyRound size={18} /> Ganti PIN
                        </button>
                        <button aria-label="Hapus Staf" className="w-14 h-14 bg-brand-card rounded-2xl flex items-center justify-center text-brand-muted hover:text-rose-500 hover:border-rose-500/40 border-2 border-brand-border shadow-xl active:scale-90 transition-all">
                          <Trash2 size={20} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full py-5 bg-brand-bg/40 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold tracking-widest text-brand-muted/40 border-2 border-dashed border-brand-border cursor-not-allowed">
                        <Lock size={16} /> Akun Permanen
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TOMBOL SIMPAN MELAYANG */}
      {canEdit && (
        <div className="fixed bottom-14 right-14 z-[200] animate-in slide-in-from-bottom-20 duration-1000">
          <button 
            onClick={onSave}
            className="flex items-center gap-8 bg-brand-primary hover:bg-brand-secondary text-white px-16 py-8 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(var(--brand-primary-rgb),0.6)] transition-all hover:-translate-y-4 group/save active:scale-95 active:translate-y-0 border-4 border-white/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
            <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center group-hover:rotate-[360deg] transition-all duration-[1000ms] shadow-inner relative z-10">
               <Save className="w-8 h-8" />
            </div>
            <div className="text-left relative z-10">
               <p className="text-[10px] font-bold tracking-widest opacity-70 leading-none mb-2">Simpan Perubahan</p>
               <span className="text-lg font-bold tracking-widest leading-none">Simpan Semua</span>
            </div>
          </button>
        </div>
      )}

      {/* MODAL OTORITAS PEMILIK */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-12 bg-brand-bg/95 backdrop-blur-3xl animate-in fade-in duration-700">
          <div className="bg-brand-card w-full max-w-xl rounded-[5rem] p-20 border-2 border-brand-border shadow-[0_100px_200px_-50px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-700 relative overflow-hidden group/modal">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent shadow-[0_0_30px_rgba(var(--brand-accent-rgb),0.5)]"></div>
            
            <div className="flex flex-col items-center gap-14 relative z-10">
              <div className="w-32 h-32 bg-brand-accent/10 text-brand-accent rounded-[3rem] flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(var(--brand-accent-rgb),0.4)] group border-2 border-brand-accent/20 relative">
                <div className="absolute inset-0 bg-brand-accent rounded-[3rem] animate-ping opacity-10"></div>
                <Shield size={64} className="group-hover:scale-110 transition-transform duration-700 relative z-10" />
              </div>
              <div className="text-center">
                <h3 className="text-5xl font-bold tracking-tighter mb-5">Otoritas Pemilik</h3>
                <p className="text-[12px] font-bold text-brand-muted tracking-widest leading-loose opacity-60 max-w-sm mx-auto">Masukkan PIN Pemilik Toko untuk membuka kunci pengaturan sistem.</p>
              </div>
              <form onSubmit={handleUnlockSettings} className="w-full space-y-14">
                <div className="relative group/input">
                   <input 
                     type="password" autoFocus value={unlockPin} onChange={e => setUnlockPin(e.target.value)}
                     placeholder="••••" className="w-full bg-brand-bg/80 border-4 border-brand-border rounded-[3rem] px-12 py-10 text-center text-7xl font-black tracking-[1em] outline-none focus:border-brand-accent transition-all shadow-inner placeholder:opacity-5 text-brand-text"
                   />
                </div>
                
                <div className="flex gap-8">
                  <button type="button" onClick={() => setShowUnlockModal(false)} className="flex-1 py-8 bg-brand-bg/60 border-2 border-brand-border rounded-[2.5rem] text-[11px] font-bold tracking-widest hover:text-brand-text hover:border-brand-primary/40 transition-all active:scale-95 shadow-xl">Batalkan</button>
                  <button type="submit" className="flex-1 py-8 bg-brand-accent text-white rounded-[2.5rem] text-[11px] font-bold tracking-widest shadow-[0_30px_60px_-15px_rgba(var(--brand-accent-rgb),0.5)] active:scale-95 hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-6 group/auth border-2 border-white/10">
                     <Fingerprint size={28} className="group-hover:rotate-12 transition-transform duration-500" /> Buka Kunci
                  </button>
                </div>
              </form>
              <div className="flex items-center gap-4 py-4 px-10 bg-brand-bg/40 border-2 border-brand-border rounded-2xl opacity-40">
                 <ShieldAlert size={14} className="text-brand-accent" />
                 <p className="text-[9px] font-bold tracking-widest">Setiap percobaan akses akan dicatat dalam log keamanan sistem.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

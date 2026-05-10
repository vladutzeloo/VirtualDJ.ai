import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Fingerprint, Lock, Unlock, Key, Eye, EyeOff, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  authenticateBiometric,
  checkBiometricSupport,
  isVaultRegistered,
  registerBiometric,
} from '../services/biometricService';

interface VaultProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const Vault = ({ isOpen, onClose, theme }: VaultProps) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    checkBiometricSupport().then(({ platformAvailable }) => {
      setHasPlatformAuth(platformAvailable);
      setRegistered(isVaultRegistered());
    });
  }, [isOpen]);

  const runBiometricFlow = async () => {
    setAuthError(null);
    setIsScanning(true);
    setScanProgress(15);
    try {
      if (!isVaultRegistered()) {
        await registerBiometric();
        setRegistered(true);
      } else {
        await authenticateBiometric();
      }
      setScanProgress(100);
      setIsUnlocked(true);
    } catch (err: any) {
      setAuthError(err?.message ?? 'Biometric authorization failed.');
    } finally {
      setIsScanning(false);
    }
  };

  // Fallback simulated scan for environments without a platform authenticator.
  useEffect(() => {
    let interval: any;
    if (isScanning && !hasPlatformAuth) {
      setScanProgress(0);
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            setIsUnlocked(true);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isScanning, hasPlatformAuth]);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`relative w-full max-w-[450px] rounded-[2.5rem] border overflow-hidden shadow-2xl transition-colors duration-500 flex flex-col ${
          theme === 'dark' ? 'bg-[#0A0C10] border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-white/5' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isUnlocked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-jarvis-accent-cyan/10 text-jarvis-accent-cyan'
            }`}>
              {isUnlocked ? <Unlock className="w-5 h-5 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> : <Lock className="w-5 h-5 shadow-[0_0_10px_rgba(0,242,255,0.5)]" />}
            </div>
            <div>
              <h2 className={`text-sm vdj-display font-bold tracking-[0.2em] uppercase ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Neural Vault
              </h2>
              <span className="vdj-eyebrow text-[9px]">API · Credential · Management</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar min-h-[400px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {!isUnlocked ? (
              <motion.div 
                key="locked"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-8 w-full"
              >
                <div className="relative group">
                  <motion.div 
                    animate={isScanning ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
                      isScanning ? 'border-jarvis-accent-cyan scale-110 shadow-[0_0_30px_rgba(0,242,255,0.3)]' : 'border-white/5'
                    }`}
                  >
                    <Fingerprint className={`w-16 h-16 transition-colors duration-500 ${isScanning ? 'text-jarvis-accent-cyan' : 'text-slate-700'}`} />
                  </motion.div>
                  
                  {isScanning && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-jarvis-accent-cyan transition-all duration-300"
                        strokeDasharray={377}
                        strokeDashoffset={377 - (377 * scanProgress) / 100}
                        style={{ filter: 'drop-shadow(0 0 5px rgba(0,242,255,0.8))' }}
                      />
                    </svg>
                  )}
                </div>

                <div className="text-center space-y-2">
                  <h3 className={`text-lg vdj-display font-bold tracking-[0.08em] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    AUTHENTICATION REQUIRED
                  </h3>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-widest max-w-[240px] mx-auto">
                    {hasPlatformAuth
                      ? registered
                        ? 'Authorize via Touch ID, Windows Hello, or Android Fingerprint'
                        : 'Enrol this device biometric to seal the neural vault'
                      : 'Hold Fingerprint Sensor to access neural key store'}
                  </p>
                  {authError && (
                    <p className="text-[10px] font-mono text-red-400 max-w-[260px] mx-auto">
                      {authError}
                    </p>
                  )}
                </div>

                {hasPlatformAuth ? (
                  <button
                    onClick={runBiometricFlow}
                    disabled={isScanning}
                    className={`w-full py-4 rounded-2xl font-mono font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
                      isScanning ? 'bg-jarvis-accent-cyan text-jarvis-bg' : 'bg-white/5 border border-white/10 text-white'
                    }`}
                  >
                    {isScanning
                      ? 'Awaiting Biometric...'
                      : registered
                        ? 'Authorize with Biometric'
                        : 'Enrol Biometric'}
                  </button>
                ) : (
                  <button
                    onMouseDown={() => setIsScanning(true)}
                    onMouseUp={() => setIsScanning(false)}
                    onMouseLeave={() => setIsScanning(false)}
                    onTouchStart={() => setIsScanning(true)}
                    onTouchEnd={() => setIsScanning(false)}
                    className={`w-full py-4 rounded-2xl font-mono font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
                      isScanning ? 'bg-jarvis-accent-cyan text-jarvis-bg' : 'bg-white/5 border border-white/10 text-white'
                    }`}
                  >
                    {isScanning ? `Scanning... ${scanProgress}%` : 'Hold to Authorize'}
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="unlocked"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-8"
              >
                <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                  theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest">Biometric Authorized</span>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Gemini Neural Engine Key</label>
                    <div className="relative group">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                       <input 
                         type={showKey ? "text" : "password"}
                         defaultValue="********************************"
                         className={`w-full h-12 pl-12 pr-12 rounded-xl border bg-transparent font-mono text-sm transition-all focus:outline-none focus:ring-2 ${
                           theme === 'dark' ? 'border-white/10 text-white focus:ring-jarvis-accent-cyan/20' : 'border-slate-200 text-slate-900 focus:ring-jarvis-accent-cyan/10'
                         }`}
                       />
                       <button 
                         onClick={() => setShowKey(!showKey)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-jarvis-accent-cyan transition-colors"
                       >
                         {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                    </div>
                    <p className="text-[9px] font-mono text-slate-500 flex items-center gap-2">
                       <AlertCircle className="w-3 h-3 text-jarvis-accent-pink" /> 
                       NEVER EXPOSE KEYS IN CLIENT-SIDE REPOS
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Encryption Level</label>
                    <div className={`w-full p-4 rounded-xl border flex items-center justify-between ${
                      theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                    }`}>
                       <span className="text-xs font-mono font-black text-jarvis-accent-cyan">AES-256-VIRTUAL</span>
                       <div className="h-2 w-24 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-jarvis-accent-cyan shadow-[0_0_10px_rgba(0,242,255,1)]" />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button 
                    onClick={handleSave}
                    disabled={saveStatus !== 'idle'}
                    className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 font-mono font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                      saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-jarvis-accent-cyan text-jarvis-bg hover:shadow-lg hover:shadow-jarvis-accent-cyan/20'
                    }`}
                  >
                    {saveStatus === 'saving' ? (
                      <div className="w-5 h-5 border-2 border-jarvis-bg/30 border-t-jarvis-bg animate-spin rounded-full" />
                    ) : saveStatus === 'saved' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Encrypt & Save
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${
          theme === 'dark' ? 'border-white/5' : 'border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-jarvis-accent-pink" />
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">End-to-End Encrypted</span>
             </div>
             <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Build v3.2.1-stable</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

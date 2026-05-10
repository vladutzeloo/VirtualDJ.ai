import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Fingerprint,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Download,
  Activity,
  DollarSign,
  Cpu,
  Zap,
  Copy,
  RefreshCcw,
  Webhook,
  Send,
  Power,
  PowerOff,
  Brain,
  Check,
  Gauge,
  PlayCircle,
} from 'lucide-react';
import {
  authenticateBiometric,
  checkBiometricSupport,
  isVaultRegistered,
  registerBiometric,
} from '../services/biometricService';
import {
  PROVIDERS,
  ProviderId,
  KeyPreview,
  previewAll,
  setApiKey,
  removeApiKey,
  importFromEnvBlob,
  exportAsEnvBlob,
  subscribe as subscribeKeys,
  clearAllKeys,
} from '../services/apiKeyManager';
import {
  getLocalLlmConfig,
  setLocalLlmConfig,
  subscribeLocalLlm,
  DEFAULT_LOCAL_LLM_CONFIG,
  type LocalLlmConfig,
} from '../services/localLlmService';
import {
  getUsage,
  subscribeUsage,
  clearUsage,
  formatUsd,
  formatTokens,
  UsageSummary,
} from '../services/usageTracker';
import {
  WEBHOOK_EVENTS,
  EVENT_LABELS,
  WebhookConfig,
  WebhookDelivery,
  WebhookEvent,
  addWebhook,
  updateWebhook,
  removeWebhook,
  listWebhooks,
  listDeliveries,
  clearDeliveries,
  subscribeWebhooks,
  testWebhook,
} from '../services/webhookService';
import {
  ModelEntry,
  getModelsForProvider,
  getPreferredModel,
  setPreferredModel,
  subscribeModelPrefs,
} from '../services/modelCatalog';
import {
  CheckResult,
  checkProvider,
  getAllCheckResults,
  subscribeCheckResults,
} from '../services/modelChecker';
import { lookupPricing } from '../services/usageTracker';

interface VaultProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

type Tab = 'keys' | 'models' | 'import' | 'usage' | 'webhooks';

export const Vault = ({ isOpen, onClose, theme }: VaultProps) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [tab, setTab] = useState<Tab>('keys');
  const [keys, setKeys] = useState<KeyPreview[]>(previewAll());
  const [usage, setUsage] = useState<UsageSummary>(() => getUsage());
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(() => listWebhooks());
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>(() => listDeliveries());

  useEffect(() => {
    if (!isOpen) return;
    setKeys(previewAll());
    setUsage(getUsage());
    setWebhooks(listWebhooks());
    setDeliveries(listDeliveries());
    checkBiometricSupport().then(({ platformAvailable }) => {
      setHasPlatformAuth(platformAvailable);
      setRegistered(isVaultRegistered());
    });
  }, [isOpen]);

  useEffect(() => {
    const unsubKeys = subscribeKeys(() => setKeys(previewAll()));
    const unsubUsage = subscribeUsage(() => setUsage(getUsage()));
    const unsubHooks = subscribeWebhooks(() => {
      setWebhooks(listWebhooks());
      setDeliveries(listDeliveries());
    });
    return () => {
      unsubKeys();
      unsubUsage();
      unsubHooks();
    };
  }, []);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-vdj-bg/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`relative w-full max-w-[560px] max-h-[90vh] rounded-[2.5rem] border overflow-hidden shadow-2xl transition-colors duration-500 flex flex-col ${
          theme === 'dark' ? 'bg-[#0A0C10] border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        <header className={`p-6 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-white/5' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isUnlocked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-jarvis-accent-cyan/10 text-jarvis-accent-cyan'
            }`}>
              {isUnlocked
                ? <Unlock className="w-5 h-5 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                : <Lock className="w-5 h-5 drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]" />}
            </div>
            <div>
              <h2 className={`text-sm vdj-display font-bold tracking-[0.2em] uppercase ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Neural Vault
              </h2>
              <span className="vdj-eyebrow text-[9px]">API Keys · Tokens · Cost</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        {!isUnlocked ? (
          <LockedView
            theme={theme}
            isScanning={isScanning}
            scanProgress={scanProgress}
            authError={authError}
            hasPlatformAuth={hasPlatformAuth}
            registered={registered}
            onScanStart={() => setIsScanning(true)}
            onScanEnd={() => setIsScanning(false)}
            onRunBiometric={runBiometricFlow}
          />
        ) : (
          <>
            <UsageBanner theme={theme} usage={usage} />
            <Tabs theme={theme} tab={tab} setTab={setTab} />
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {tab === 'keys' && <KeysPanel theme={theme} keys={keys} />}
              {tab === 'models' && <ModelsPanel theme={theme} keys={keys} />}
              {tab === 'import' && <ImportPanel theme={theme} />}
              {tab === 'usage' && <UsagePanel theme={theme} usage={usage} />}
              {tab === 'webhooks' && (
                <WebhooksPanel theme={theme} webhooks={webhooks} deliveries={deliveries} />
              )}
            </div>
          </>
        )}

        <footer className={`p-4 border-t flex items-center justify-between ${
          theme === 'dark' ? 'border-white/5' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-jarvis-accent-pink" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Local-only · WebAuthn-gated
            </span>
          </div>
          {isUnlocked && (
            <button
              onClick={() => {
                if (confirm('Wipe all stored API keys, usage history, and webhook deliveries?')) {
                  clearAllKeys();
                  clearUsage();
                  clearDeliveries();
                }
              }}
              className="text-[9px] font-mono text-slate-500 hover:text-red-400 uppercase tracking-widest"
            >
              Wipe vault
            </button>
          )}
        </footer>
      </motion.div>
    </div>
  );
};

// ─── Locked view ──────────────────────────────────────────────────────────

interface LockedViewProps {
  theme: 'dark' | 'light';
  isScanning: boolean;
  scanProgress: number;
  authError: string | null;
  hasPlatformAuth: boolean;
  registered: boolean;
  onScanStart: () => void;
  onScanEnd: () => void;
  onRunBiometric: () => void;
}

const LockedView = ({
  theme,
  isScanning,
  scanProgress,
  authError,
  hasPlatformAuth,
  registered,
  onScanStart,
  onScanEnd,
  onRunBiometric,
}: LockedViewProps) => (
  <div className="flex-1 p-8 overflow-y-auto custom-scrollbar min-h-[400px] flex flex-col items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-8 w-full"
    >
      <div className="relative">
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
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest max-w-[280px] mx-auto">
          {hasPlatformAuth
            ? registered
              ? 'Authorize via Touch ID, Windows Hello, or Android Fingerprint'
              : 'Enrol this device biometric to seal the neural vault'
            : 'Hold Fingerprint Sensor to access neural key store'}
        </p>
        {authError && (
          <p className="text-[10px] font-mono text-red-400 max-w-[260px] mx-auto">{authError}</p>
        )}
      </div>

      {hasPlatformAuth ? (
        <button
          onClick={onRunBiometric}
          disabled={isScanning}
          className={`w-full py-4 rounded-2xl font-mono font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
            isScanning ? 'bg-jarvis-accent-cyan text-jarvis-bg' : 'bg-white/5 border border-white/10 text-white'
          }`}
        >
          {isScanning ? 'Awaiting Biometric...' : registered ? 'Authorize with Biometric' : 'Enrol Biometric'}
        </button>
      ) : (
        <button
          onMouseDown={onScanStart}
          onMouseUp={onScanEnd}
          onMouseLeave={onScanEnd}
          onTouchStart={onScanStart}
          onTouchEnd={onScanEnd}
          className={`w-full py-4 rounded-2xl font-mono font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
            isScanning ? 'bg-jarvis-accent-cyan text-jarvis-bg' : 'bg-white/5 border border-white/10 text-white'
          }`}
        >
          {isScanning ? `Scanning... ${scanProgress}%` : 'Hold to Authorize'}
        </button>
      )}
    </motion.div>
  </div>
);

// ─── Usage banner ─────────────────────────────────────────────────────────

const UsageBanner = ({ theme, usage }: { theme: 'dark' | 'light'; usage: UsageSummary }) => (
  <div className={`px-6 py-3 grid grid-cols-3 gap-3 border-b ${
    theme === 'dark' ? 'border-white/5 bg-black/40' : 'border-slate-100 bg-slate-50'
  }`}>
    <BannerStat icon={DollarSign} label="Total Cost" value={formatUsd(usage.totalCostUsd)} accent="text-jarvis-accent-cyan" />
    <BannerStat
      icon={Cpu}
      label="Tokens"
      value={formatTokens(usage.totalInputTokens + usage.totalOutputTokens)}
      accent="text-jarvis-accent-pink"
    />
    <BannerStat icon={Activity} label="Calls" value={String(usage.events.length)} accent="text-emerald-400" />
  </div>
);

const BannerStat = ({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) => (
  <div className="flex flex-col items-start gap-0.5">
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3 h-3 ${accent}`} />
      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">{label}</span>
    </div>
    <span className={`text-base font-display font-black ${accent}`}>{value}</span>
  </div>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────

const Tabs = ({ theme, tab, setTab }: { theme: 'dark' | 'light'; tab: Tab; setTab: (t: Tab) => void }) => {
  const items: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'keys', label: 'Keys', icon: Key },
    { id: 'models', label: 'Models', icon: Brain },
    { id: 'import', label: 'Import', icon: Upload },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'webhooks', label: 'Hooks', icon: Webhook },
  ];
  return (
    <div className={`flex border-b px-2 overflow-x-auto custom-scrollbar ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
          className={`flex items-center gap-1.5 px-3 py-3 text-[10px] font-mono font-black uppercase tracking-[0.18em] transition-all border-b-2 shrink-0 ${
            tab === item.id
              ? 'border-jarvis-accent-cyan text-jarvis-accent-cyan'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <item.icon className="w-3 h-3" />
          {item.label}
        </button>
      ))}
    </div>
  );
};

// ─── Keys panel ───────────────────────────────────────────────────────────

const KeysPanel = ({ theme, keys }: { theme: 'dark' | 'light'; keys: KeyPreview[] }) => (
  <div className="space-y-3">
    <LocalLlmCard theme={theme} />
    {keys.map(k => (
      <KeyCard key={k.provider} preview={k} theme={theme} />
    ))}
  </div>
);

// ─── Local LLM endpoint card ──────────────────────────────────────────────

const LocalLlmCard = ({ theme }: { theme: 'dark' | 'light' }) => {
  const [config, setConfig] = useState<LocalLlmConfig>(() => getLocalLlmConfig());
  const [draftBaseUrl, setDraftBaseUrl] = useState(config.baseUrl);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    return subscribeLocalLlm(() => {
      const next = getLocalLlmConfig();
      setConfig(next);
      setDraftBaseUrl(next.baseUrl);
    });
  }, []);

  const dirty = draftBaseUrl !== config.baseUrl;
  const isDefault = config.baseUrl === DEFAULT_LOCAL_LLM_CONFIG.baseUrl;

  const onSave = () => {
    setLocalLlmConfig({ baseUrl: draftBaseUrl });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-display font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Local LLM Endpoint
            </span>
            <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              isDefault
                ? 'text-slate-500 border-white/10 bg-white/5'
                : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
            }`}>
              {isDefault ? 'Default' : 'Custom'}
            </span>
            {savedFlash && (
              <span className="text-[8px] font-mono font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
            Fallback chain target. Any OpenAI-compatible server: Ollama, LM Studio, llama.cpp, vLLM.
            Pick the model in the Models tab.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Base URL</span>
          <input
            type="text"
            value={draftBaseUrl}
            onChange={e => setDraftBaseUrl(e.target.value)}
            placeholder={DEFAULT_LOCAL_LLM_CONFIG.baseUrl}
            className={`mt-1 w-full h-10 px-3 rounded-lg border bg-transparent font-mono text-xs focus:outline-none focus:ring-2 ${
              theme === 'dark'
                ? 'border-white/10 text-white focus:ring-jarvis-accent-cyan/40'
                : 'border-slate-200 text-slate-900 focus:ring-jarvis-accent-cyan/30'
            }`}
          />
        </label>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[9px] font-mono text-slate-600">
            Ollama 11434 · LM Studio 1234 · llama.cpp 8080 · vLLM 8000
          </span>
          <button
            onClick={onSave}
            disabled={!dirty || !draftBaseUrl.trim()}
            className="h-9 px-4 rounded-lg bg-jarvis-accent-cyan text-jarvis-bg font-mono font-black text-[10px] uppercase tracking-widest disabled:opacity-30 active:scale-95 transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const KeyCard = ({ preview, theme }: { preview: KeyPreview; theme: 'dark' | 'light' }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [reveal, setReveal] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const sourceColor =
    preview.source === 'vault'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : preview.source === 'env'
        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
        : 'text-slate-500 border-white/10 bg-white/5';

  const sourceLabel =
    preview.source === 'vault' ? 'Stored' : preview.source === 'env' ? 'From .env' : 'Missing';

  const onSave = () => {
    if (!value.trim()) return;
    setApiKey(preview.provider, value.trim(), 'manual');
    setValue('');
    setEditing(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-display font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {preview.meta.name}
            </span>
            <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sourceColor}`}>
              {sourceLabel}
            </span>
            {savedFlash && (
              <span className="text-[8px] font-mono font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">{preview.meta.description}</p>
          <p className="text-[9px] font-mono text-slate-600 mt-0.5">
            ENV: <span className="text-slate-400">{preview.meta.envVar}</span>
            {' · '}
            <a
              href={preview.meta.consoleUrl}
              target="_blank"
              rel="noreferrer"
              className="text-jarvis-accent-cyan hover:underline"
            >
              Get key
            </a>
          </p>
        </div>
        <div className="flex items-center gap-1">
          {preview.source !== 'missing' && !editing && (
            <button
              onClick={() => {
                setEditing(true);
                setValue('');
              }}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-jarvis-accent-cyan transition"
              title="Replace key"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {preview.source === 'vault' && (
            <button
              onClick={() => removeApiKey(preview.provider)}
              className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
              title="Remove key"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {editing || preview.source === 'missing' ? (
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              ref={inputRef}
              type={reveal ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') setEditing(false);
              }}
              placeholder={preview.meta.keyPrefix ? `${preview.meta.keyPrefix}…` : 'Paste API key'}
              className={`w-full h-10 pl-9 pr-9 rounded-lg border bg-transparent font-mono text-xs focus:outline-none focus:ring-2 ${
                theme === 'dark'
                  ? 'border-white/10 text-white focus:ring-jarvis-accent-cyan/40'
                  : 'border-slate-200 text-slate-900 focus:ring-jarvis-accent-cyan/30'
              }`}
            />
            <button
              type="button"
              onClick={() => setReveal(r => !r)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-jarvis-accent-cyan"
            >
              {reveal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            onClick={onSave}
            disabled={!value.trim()}
            className="h-10 px-4 rounded-lg bg-jarvis-accent-cyan text-jarvis-bg font-mono font-black text-[10px] uppercase tracking-widest disabled:opacity-30 active:scale-95 transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="font-mono text-xs text-slate-300 truncate">
            <span className="text-slate-500">{preview.masked}</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 shrink-0">
            <span title="Fingerprint">FP {preview.fingerprint}</span>
            {preview.lastUsedAt && (
              <span title={new Date(preview.lastUsedAt).toLocaleString()}>
                · used {timeAgo(preview.lastUsedAt)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Import panel ─────────────────────────────────────────────────────────

const ImportPanel = ({ theme }: { theme: 'dark' | 'light' }) => {
  const [blob, setBlob] = useState('');
  const [report, setReport] = useState<{ imported: ProviderId[]; skipped: { provider: string; reason: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onImport = () => {
    if (!blob.trim()) return;
    const result = importFromEnvBlob(blob);
    setReport(result);
    if (result.imported.length) setBlob('');
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setBlob(text);
    };
    reader.readAsText(file);
  };

  const onExport = () => {
    const blobText = exportAsEnvBlob();
    if (!blobText) return;
    const file = new Blob([blobText], { type: 'text/plain' });
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'virtualdj-keys.env';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onCopy = async () => {
    const blobText = exportAsEnvBlob();
    if (!blobText) return;
    await navigator.clipboard.writeText(blobText);
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-jarvis-accent-cyan" />
            <span className="text-xs font-display font-black uppercase tracking-widest text-white">
              Import .env
            </span>
          </div>
          <div className="flex items-center gap-1">
            <input
              ref={fileRef}
              type="file"
              accept=".env,.txt,text/plain"
              className="hidden"
              onChange={e => onFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-mono font-black uppercase tracking-widest text-white hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <Upload className="w-3 h-3" /> File
            </button>
          </div>
        </div>
        <textarea
          value={blob}
          onChange={e => setBlob(e.target.value)}
          placeholder={`# Paste a .env-style block, e.g.\nGEMINI_API_KEY=AIza...\nNVIDIA_API_KEY="nvapi-..."\nLOCAL_LLM_API_KEY="optional-bearer-for-vllm"`}
          rows={6}
          className={`w-full rounded-lg border bg-transparent font-mono text-[11px] p-3 focus:outline-none focus:ring-2 ${
            theme === 'dark'
              ? 'border-white/10 text-white focus:ring-jarvis-accent-cyan/40 placeholder:text-slate-600'
              : 'border-slate-200 text-slate-900 focus:ring-jarvis-accent-cyan/30 placeholder:text-slate-400'
          }`}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Recognised: GEMINI_API_KEY · KIMI_API_KEY · OPENAI_API_KEY · NVIDIA_API_KEY · LOCAL_LLM_API_KEY
          </span>
          <button
            onClick={onImport}
            disabled={!blob.trim()}
            className="px-4 py-2 rounded-lg bg-jarvis-accent-cyan text-jarvis-bg font-mono font-black text-[10px] uppercase tracking-widest disabled:opacity-30 active:scale-95 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Import
          </button>
        </div>

        {report && (
          <div className="mt-3 space-y-1">
            {report.imported.length > 0 && (
              <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Imported: {report.imported.map(p => PROVIDERS[p].shortName).join(', ')}
              </p>
            )}
            {report.skipped.map((s, i) => (
              <p key={i} className="text-[10px] font-mono text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                Skipped {s.provider}: {s.reason}
              </p>
            ))}
            {!report.imported.length && !report.skipped.length && (
              <p className="text-[10px] font-mono text-slate-500">Nothing recognisable in that block.</p>
            )}
          </div>
        )}
      </div>

      <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-jarvis-accent-pink" />
            <span className="text-xs font-display font-black uppercase tracking-widest text-white">
              Export
            </span>
          </div>
        </div>
        <p className="text-[10px] font-mono text-slate-500 mb-3">
          Download or copy the currently stored keys as a .env block. Plaintext — handle with care.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono font-black uppercase tracking-widest text-white hover:bg-white/10 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button
            onClick={onCopy}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono font-black uppercase tracking-widest text-white hover:bg-white/10 transition flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Usage panel ──────────────────────────────────────────────────────────

const UsagePanel = ({ theme, usage }: { theme: 'dark' | 'light'; usage: UsageSummary }) => {
  const recent = useMemo(() => [...usage.events].reverse().slice(0, 30), [usage.events]);
  const providerEntries = (Object.keys(usage.byProvider) as ProviderId[])
    .map(p => usage.byProvider[p])
    .filter(p => p.calls > 0)
    .sort((a, b) => b.costUsd - a.costUsd);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500">
          Cost by Provider
        </h3>
        {providerEntries.length === 0 && (
          <div className={`rounded-xl border p-6 text-center ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <Zap className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-[11px] font-mono text-slate-500">
              No calls yet. Run a search or deploy an agent to see costs.
            </p>
          </div>
        )}
        {providerEntries.map(p => {
          const share = usage.totalCostUsd > 0 ? (p.costUsd / usage.totalCostUsd) * 100 : 0;
          return (
            <div
              key={p.provider}
              className={`rounded-xl border p-3 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-display font-black uppercase tracking-widest text-white">
                  {PROVIDERS[p.provider].shortName}
                </span>
                <span className="text-sm font-display font-black text-jarvis-accent-cyan">
                  {formatUsd(p.costUsd)}
                </span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-gradient-to-r from-jarvis-accent-cyan to-jarvis-accent-pink"
                  style={{ width: `${Math.min(100, share)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>{p.calls} call{p.calls === 1 ? '' : 's'}</span>
                <span>
                  {formatTokens(p.inputTokens)} in · {formatTokens(p.outputTokens)} out
                  {p.imageCalls > 0 ? ` · ${p.imageCalls} img` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500">
          Recent Activity
        </h3>
        {recent.length === 0 && (
          <p className="text-[10px] font-mono text-slate-600 italic">No events recorded.</p>
        )}
        <div className="space-y-1">
          {recent.map(e => (
            <div
              key={e.id}
              className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 ${
                theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-100'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-jarvis-accent-cyan shrink-0">
                    {PROVIDERS[e.provider].shortName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-300 truncate">{e.feature}</span>
                </div>
                <div className="text-[9px] font-mono text-slate-500 truncate">
                  {e.model} · {formatTokens(e.inputTokens)} in / {formatTokens(e.outputTokens)} out
                  {e.imageCalls ? ` · ${e.imageCalls} img` : ''}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-mono font-black text-jarvis-accent-pink">
                  {formatUsd(e.costUsd)}
                </div>
                <div className="text-[8px] font-mono text-slate-600">{timeAgo(e.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Webhooks panel ───────────────────────────────────────────────────────

interface WebhooksPanelProps {
  theme: 'dark' | 'light';
  webhooks: WebhookConfig[];
  deliveries: WebhookDelivery[];
}

const WebhooksPanel = ({ theme, webhooks, deliveries }: WebhooksPanelProps) => {
  const [adding, setAdding] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftLabel, setDraftLabel] = useState('');
  const [draftSecret, setDraftSecret] = useState('');
  const [draftEvents, setDraftEvents] = useState<WebhookEvent[]>([...WEBHOOK_EVENTS]);
  const [error, setError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const recentDeliveries = useMemo(
    () => [...deliveries].reverse().slice(0, 20),
    [deliveries],
  );

  const toggleDraftEvent = (event: WebhookEvent) => {
    setDraftEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event],
    );
  };

  const onSave = () => {
    setError(null);
    try {
      addWebhook({
        url: draftUrl,
        label: draftLabel || undefined,
        secret: draftSecret || undefined,
        events: draftEvents,
      });
      setDraftUrl('');
      setDraftLabel('');
      setDraftSecret('');
      setDraftEvents([...WEBHOOK_EVENTS]);
      setAdding(false);
    } catch (e: any) {
      setError(e?.message ?? 'Could not save webhook.');
    }
  };

  const onTest = async (id: string) => {
    setTestingId(id);
    try {
      await testWebhook(id);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-jarvis-accent-cyan" />
            <span className="text-xs font-display font-black uppercase tracking-widest text-white">
              Outgoing Webhooks
            </span>
          </div>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="px-3 py-1.5 rounded-lg bg-jarvis-accent-cyan text-jarvis-bg font-mono font-black text-[9px] uppercase tracking-widest active:scale-95 transition flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          )}
        </div>
        <p className="text-[10px] font-mono text-slate-500">
          POST JSON to your endpoints when DJ events fire. Add an optional shared secret to receive an
          <span className="text-slate-300"> X-VDJ-Signature: sha256=… </span>
          header (HMAC of the raw body).
        </p>

        {adding && (
          <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
            <input
              value={draftUrl}
              onChange={e => setDraftUrl(e.target.value)}
              placeholder="https://hooks.example.com/virtualdj"
              className={`w-full h-10 px-3 rounded-lg border bg-transparent font-mono text-xs focus:outline-none focus:ring-2 ${
                theme === 'dark'
                  ? 'border-white/10 text-white focus:ring-jarvis-accent-cyan/40'
                  : 'border-slate-200 text-slate-900 focus:ring-jarvis-accent-cyan/30'
              }`}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={draftLabel}
                onChange={e => setDraftLabel(e.target.value)}
                placeholder="Label (optional)"
                className={`h-10 px-3 rounded-lg border bg-transparent font-mono text-[11px] focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'border-white/10 text-white focus:ring-jarvis-accent-cyan/40'
                    : 'border-slate-200 text-slate-900 focus:ring-jarvis-accent-cyan/30'
                }`}
              />
              <input
                value={draftSecret}
                onChange={e => setDraftSecret(e.target.value)}
                placeholder="Shared secret (optional)"
                type="password"
                className={`h-10 px-3 rounded-lg border bg-transparent font-mono text-[11px] focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'border-white/10 text-white focus:ring-jarvis-accent-cyan/40'
                    : 'border-slate-200 text-slate-900 focus:ring-jarvis-accent-cyan/30'
                }`}
              />
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">
                Events ({draftEvents.length}/{WEBHOOK_EVENTS.length})
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {WEBHOOK_EVENTS.map(ev => {
                  const active = draftEvents.includes(ev);
                  return (
                    <button
                      key={ev}
                      onClick={() => toggleDraftEvent(ev)}
                      className={`text-left px-2 py-1.5 rounded-md border text-[9px] font-mono uppercase tracking-widest transition ${
                        active
                          ? 'border-jarvis-accent-cyan/60 bg-jarvis-accent-cyan/10 text-jarvis-accent-cyan'
                          : 'border-white/10 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {EVENT_LABELS[ev]}
                    </button>
                  );
                })}
              </div>
            </div>
            {error && (
              <p className="text-[10px] font-mono text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" /> {error}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={onSave}
                disabled={!draftUrl.trim() || draftEvents.length === 0}
                className="px-4 py-2 rounded-lg bg-jarvis-accent-cyan text-jarvis-bg font-mono font-black text-[10px] uppercase tracking-widest disabled:opacity-30 active:scale-95 transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono font-black uppercase tracking-widest text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {webhooks.length === 0 && !adding && (
          <div className={`rounded-xl border p-6 text-center ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <Webhook className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-[11px] font-mono text-slate-500">
              No webhooks yet. Add one to receive event POSTs.
            </p>
          </div>
        )}
        {webhooks.map(hook => (
          <WebhookRow
            key={hook.id}
            hook={hook}
            theme={theme}
            testing={testingId === hook.id}
            onTest={() => onTest(hook.id)}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500">
            Recent Deliveries
          </h3>
          {deliveries.length > 0 && (
            <button
              onClick={clearDeliveries}
              className="text-[9px] font-mono text-slate-500 hover:text-red-400 uppercase tracking-widest"
            >
              Clear log
            </button>
          )}
        </div>
        {recentDeliveries.length === 0 && (
          <p className="text-[10px] font-mono text-slate-600 italic">No deliveries yet.</p>
        )}
        <div className="space-y-1">
          {recentDeliveries.map(d => (
            <div
              key={d.id}
              className={`rounded-lg border px-3 py-2 ${
                theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[8px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${
                      d.ok
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                        : 'text-red-400 border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    {d.status ?? 'ERR'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-300 truncate">{d.event}</span>
                </div>
                <div className="text-[9px] font-mono text-slate-500 shrink-0">
                  {d.attempts > 1 ? `${d.attempts}× · ` : ''}
                  {d.durationMs}ms · {timeAgo(d.timestamp)}
                </div>
              </div>
              <div className="text-[9px] font-mono text-slate-600 truncate mt-0.5">{d.url}</div>
              {d.error && (
                <div className="text-[9px] font-mono text-red-400/80 truncate mt-0.5">{d.error}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WebhookRow = ({
  hook,
  theme,
  testing,
  onTest,
}: {
  hook: WebhookConfig;
  theme: 'dark' | 'light';
  testing: boolean;
  onTest: () => void;
}) => {
  const status = hook.lastStatus;
  const statusBadge =
    status === undefined
      ? 'text-slate-500 border-white/10 bg-white/5'
      : status >= 200 && status < 300
        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
        : 'text-red-400 border-red-500/30 bg-red-500/10';

  return (
    <div className={`rounded-2xl border p-3 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-display font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {hook.label || hook.url.replace(/^https?:\/\//, '').split('/')[0]}
            </span>
            <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              hook.enabled
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-slate-500 border-white/10 bg-white/5'
            }`}>
              {hook.enabled ? 'On' : 'Off'}
            </span>
            {hook.secret && (
              <span className="text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-jarvis-accent-cyan border-jarvis-accent-cyan/30 bg-jarvis-accent-cyan/10">
                Signed
              </span>
            )}
            {status !== undefined && (
              <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusBadge}`}>
                last {status}
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">{hook.url}</p>
          <p className="text-[9px] font-mono text-slate-600 mt-0.5">
            {hook.events.length} event{hook.events.length === 1 ? '' : 's'}
            {' · '}
            {hook.successCount} ok / {hook.failureCount} fail
            {hook.lastDeliveryAt ? ` · last ${timeAgo(hook.lastDeliveryAt)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onTest}
            disabled={testing}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-jarvis-accent-cyan transition disabled:opacity-40"
            title="Send test ping"
          >
            <Send className={`w-3.5 h-3.5 ${testing ? 'animate-pulse' : ''}`} />
          </button>
          <button
            onClick={() => updateWebhook(hook.id, { enabled: !hook.enabled })}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-jarvis-accent-pink transition"
            title={hook.enabled ? 'Disable' : 'Enable'}
          >
            {hook.enabled ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => removeWebhook(hook.id)}
            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
            title="Remove webhook"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {hook.lastError && (
        <p className="text-[9px] font-mono text-red-400/80 mt-2 truncate">
          <AlertCircle className="w-2.5 h-2.5 inline mr-1" /> {hook.lastError}
        </p>
      )}
    </div>
  );
};

// ─── Models panel (LLM checker + selector) ───────────────────────────────

const PROVIDER_ORDER: ProviderId[] = ['nvidia', 'kimi', 'gemini', 'openai', 'local'];

const ModelsPanel = ({ theme, keys }: { theme: 'dark' | 'light'; keys: KeyPreview[] }) => {
  const [results, setResults] = useState<Partial<Record<ProviderId, CheckResult>>>(
    () => getAllCheckResults(),
  );
  const [busy, setBusy] = useState<ProviderId | 'all' | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const unsubResults = subscribeCheckResults(() => setResults(getAllCheckResults()));
    const unsubPrefs = subscribeModelPrefs(() => force(n => n + 1));
    return () => {
      unsubResults();
      unsubPrefs();
    };
  }, []);

  const keyByProvider = useMemo(() => {
    const map: Partial<Record<ProviderId, KeyPreview>> = {};
    keys.forEach(k => {
      map[k.provider] = k;
    });
    return map;
  }, [keys]);

  const onCheck = async (provider: ProviderId) => {
    setBusy(provider);
    try {
      await checkProvider(provider);
    } finally {
      setBusy(null);
    }
  };

  // Local servers run without a Bearer in the common case, so we always
  // include 'local' in batch checks; the connection error (if any) is
  // surfaced from the fetch itself rather than a missing-key gate.
  const isCheckable = (p: ProviderId) =>
    p === 'local' || keyByProvider[p]?.source !== 'missing';

  const onCheckAll = async () => {
    const configured = PROVIDER_ORDER.filter(isCheckable);
    if (configured.length === 0) return;
    setBusy('all');
    try {
      await Promise.all(configured.map(p => checkProvider(p)));
    } finally {
      setBusy(null);
    }
  };

  const configuredCount = PROVIDER_ORDER.filter(isCheckable).length;

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-jarvis-accent-cyan" />
            <span className="text-xs font-display font-black uppercase tracking-widest text-white">
              LLM Checker
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            Send a tiny live ping to each configured provider with the selected model.
            {' '}Records latency, cost, and any errors.
          </p>
        </div>
        <button
          onClick={onCheckAll}
          disabled={busy !== null || configuredCount === 0}
          className="px-3 py-2 rounded-lg bg-jarvis-accent-cyan text-jarvis-bg font-mono font-black text-[10px] uppercase tracking-widest disabled:opacity-30 active:scale-95 transition flex items-center gap-1.5 shrink-0"
        >
          <PlayCircle className={`w-3.5 h-3.5 ${busy === 'all' ? 'animate-pulse' : ''}`} />
          {busy === 'all' ? 'Checking…' : 'Check All'}
        </button>
      </div>

      {PROVIDER_ORDER.map(provider => (
        <ProviderModelsCard
          key={provider}
          theme={theme}
          provider={provider}
          preview={keyByProvider[provider]}
          result={results[provider]}
          busy={busy === provider}
          onCheck={() => onCheck(provider)}
        />
      ))}
    </div>
  );
};

interface ProviderModelsCardProps {
  theme: 'dark' | 'light';
  provider: ProviderId;
  preview?: KeyPreview;
  result?: CheckResult;
  busy: boolean;
  onCheck: () => void;
}

const ProviderModelsCard = ({
  theme,
  provider,
  preview,
  result,
  busy,
  onCheck,
}: ProviderModelsCardProps) => {
  const meta = PROVIDERS[provider];
  const models = getModelsForProvider(provider);
  const selected = getPreferredModel(provider);
  const isLocal = provider === 'local';
  const hasKey = Boolean(preview && preview.source !== 'missing');
  // Local servers usually run without a key, so a missing Bearer is normal —
  // don't gate the Check button on it. Cloud providers still require a key.
  const checkEnabled = isLocal || hasKey;
  // For local, the catalog is a starter list; users may run any model name
  // (custom Ollama tags, fine-tunes, etc). Show a free-form input alongside
  // the radio list so they can enter anything.
  const isCustomLocal = isLocal && !models.some((m) => m.id === selected);
  const [customModel, setCustomModel] = useState(isCustomLocal ? selected : '');

  useEffect(() => {
    if (isCustomLocal) setCustomModel(selected);
  }, [selected, isCustomLocal]);

  const onSaveCustom = () => {
    const trimmed = customModel.trim();
    if (!trimmed) return;
    setPreferredModel('local', trimmed);
  };

  const statusLabel = !result
    ? 'Untested'
    : result.ok
      ? `${result.latencyMs}ms`
      : 'Failed';
  const statusColor = !result
    ? 'text-slate-500 border-white/10 bg-white/5'
    : result.ok
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : 'text-red-400 border-red-500/30 bg-red-500/10';

  return (
    <div className={`rounded-2xl border p-4 ${
      theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-display font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {meta.name}
            </span>
            <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusColor}`}>
              {result?.ok ? <Check className="w-2.5 h-2.5 inline mr-0.5" /> : null}
              {statusLabel}
            </span>
            {!hasKey && !isLocal && (
              <span className="text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-amber-400 border-amber-500/30 bg-amber-500/10">
                No key
              </span>
            )}
          </div>
          {result?.timestamp && (
            <p className="text-[9px] font-mono text-slate-600 mt-0.5">
              Last check {timeAgo(result.timestamp)}
              {result.ok && result.sample ? ` · "${result.sample}"` : ''}
            </p>
          )}
          {result && !result.ok && result.error && (
            <p className="text-[9px] font-mono text-red-400/80 mt-0.5 truncate">
              <AlertCircle className="w-2.5 h-2.5 inline mr-1" />
              {result.error}
            </p>
          )}
        </div>
        <button
          onClick={onCheck}
          disabled={busy || !checkEnabled}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono font-black uppercase tracking-widest text-white hover:bg-white/10 disabled:opacity-30 active:scale-95 transition flex items-center gap-1.5 shrink-0"
          title={
            isLocal
              ? 'Ping the configured local endpoint'
              : hasKey
                ? 'Run live ping'
                : 'Add a key to enable checks'
          }
        >
          <Gauge className={`w-3.5 h-3.5 ${busy ? 'animate-pulse' : ''}`} />
          {busy ? 'Pinging…' : 'Check'}
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {models.map(model => (
          <ModelRow
            key={model.id}
            model={model}
            selected={model.id === selected}
            theme={theme}
            onSelect={() => setPreferredModel(provider, model.id)}
          />
        ))}
        {isLocal && (
          <div className={`rounded-xl border px-3 py-2 ${
            isCustomLocal
              ? 'border-jarvis-accent-cyan/60 bg-jarvis-accent-cyan/5'
              : theme === 'dark'
                ? 'border-white/5 bg-white/[0.02]'
                : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                isCustomLocal
                  ? 'border-jarvis-accent-cyan bg-jarvis-accent-cyan/20'
                  : 'border-white/20'
              }`}>
                {isCustomLocal && <div className="w-1.5 h-1.5 rounded-full bg-jarvis-accent-cyan" />}
              </div>
              <span className={`text-xs font-display font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Custom model
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
              Paste any tag your local server has loaded (e.g. <span className="text-slate-400">qwen2.5:14b</span>, <span className="text-slate-400">deepseek-r1:32b</span>).
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveCustom();
                }}
                placeholder="model:tag"
                className={`flex-1 h-9 px-3 rounded-lg border bg-transparent font-mono text-xs focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'border-white/10 text-white focus:ring-jarvis-accent-cyan/40'
                    : 'border-slate-200 text-slate-900 focus:ring-jarvis-accent-cyan/30'
                }`}
              />
              <button
                onClick={onSaveCustom}
                disabled={!customModel.trim() || customModel.trim() === selected}
                className="h-9 px-3 rounded-lg bg-jarvis-accent-cyan text-jarvis-bg font-mono font-black text-[10px] uppercase tracking-widest disabled:opacity-30 active:scale-95 transition"
              >
                Use
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ModelRowProps {
  model: ModelEntry;
  selected: boolean;
  theme: 'dark' | 'light';
  onSelect: () => void;
}

const ModelRow = ({ model, selected, theme, onSelect }: ModelRowProps) => {
  const pricing = lookupPricing(model.provider, model.id);
  const contextLabel =
    model.contextWindow >= 1_000_000
      ? `${(model.contextWindow / 1_000_000).toFixed(model.contextWindow % 1_000_000 === 0 ? 0 : 1)}M ctx`
      : `${Math.round(model.contextWindow / 1000)}k ctx`;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border px-3 py-2 transition-all flex items-start gap-3 ${
        selected
          ? 'border-jarvis-accent-cyan/60 bg-jarvis-accent-cyan/5'
          : theme === 'dark'
            ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
            : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
        selected
          ? 'border-jarvis-accent-cyan bg-jarvis-accent-cyan/20'
          : 'border-white/20'
      }`}>
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-jarvis-accent-cyan" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-display font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {model.label}
          </span>
          {model.default && (
            <span className="text-[8px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              Default
            </span>
          )}
          {model.capabilities.slice(0, 3).map(cap => (
            <span
              key={cap}
              className="text-[8px] font-mono uppercase tracking-widest text-slate-500 border border-white/10 bg-white/5 rounded-full px-1.5 py-0.5"
            >
              {cap}
            </span>
          ))}
        </div>
        <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">{model.description}</p>
        <p className="text-[9px] font-mono text-slate-600 mt-0.5">
          <span className="text-slate-400">{model.id}</span>
          {' · '}
          {contextLabel}
          {' · '}
          ${pricing.inputPerMTok.toFixed(2)} in / ${pricing.outputPerMTok.toFixed(2)} out per 1M
        </p>
      </div>
    </button>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
};

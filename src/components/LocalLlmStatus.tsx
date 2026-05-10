import { useEffect, useState } from 'react';
import { Cpu, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { checkProvider, subscribeCheckResults, getLastCheckResult } from '../services/modelChecker';
import { getLocalLlmConfig, subscribeLocalLlm } from '../services/localLlmService';
import { hasApiKey } from '../services/apiKeyManager';

type Status = 'checking' | 'online' | 'offline';

export const LocalLlmStatus = ({ onOpenVault }: { onOpenVault?: () => void }) => {
  const [status, setStatus] = useState<Status>('checking');
  const [model, setModel] = useState<string>('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [baseUrl, setBaseUrl] = useState<string>(getLocalLlmConfig().baseUrl);
  const cloudConfigured = hasApiKey('nvidia') || hasApiKey('kimi') || hasApiKey('gemini');

  const runCheck = async () => {
    setStatus('checking');
    const result = await checkProvider('local');
    setStatus(result.ok ? 'online' : 'offline');
    setModel(result.model);
    setError(result.error);
  };

  useEffect(() => {
    const last = getLastCheckResult('local');
    if (last) {
      setStatus(last.ok ? 'online' : 'offline');
      setModel(last.model);
      setError(last.error);
    }
    runCheck();
    const off = subscribeCheckResults(() => {
      const r = getLastCheckResult('local');
      if (!r) return;
      setStatus(r.ok ? 'online' : 'offline');
      setModel(r.model);
      setError(r.error);
    });
    const offCfg = subscribeLocalLlm(() => {
      setBaseUrl(getLocalLlmConfig().baseUrl);
      runCheck();
    });
    return () => {
      off();
      offCfg();
    };
  }, []);

  const isOk = status === 'online';
  const isChecking = status === 'checking';

  const tone = isChecking
    ? 'border-slate-700/50 bg-slate-900/40 text-slate-400'
    : isOk
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    : 'border-amber-500/40 bg-amber-500/10 text-amber-300';

  const icon = isChecking ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
  ) : isOk ? (
    <CheckCircle2 className="w-3.5 h-3.5" />
  ) : (
    <AlertTriangle className="w-3.5 h-3.5" />
  );

  const headline = isChecking
    ? 'Local AI · checking…'
    : isOk
    ? `Local AI · ${model || 'online'}`
    : cloudConfigured
    ? 'Local AI · offline (cloud chain active)'
    : 'Local AI · offline';

  const detail = isChecking
    ? baseUrl
    : isOk
    ? baseUrl
    : cloudConfigured
    ? 'Optional. Run Ollama for offline fallback.'
    : 'Run `ollama serve` then `ollama pull llama3.2`, or add a cloud key in the Vault.';

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-md ${tone}`}
      role="status"
      aria-live="polite"
    >
      <Cpu className="w-3.5 h-3.5 shrink-0 opacity-80" />
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-[0.18em]">
          {icon}
          <span className="truncate">{headline}</span>
        </div>
        <span className="text-[9px] font-mono opacity-75 truncate">{detail}</span>
        {error && !isOk && !isChecking && (
          <span className="text-[9px] font-mono opacity-70 truncate" title={error}>
            {error}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={runCheck}
          disabled={isChecking}
          className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border border-current/30 hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          Recheck
        </button>
        {onOpenVault && (
          <button
            onClick={onOpenVault}
            className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border border-current/30 hover:bg-white/5 transition-colors"
          >
            Vault
          </button>
        )}
      </div>
    </div>
  );
};

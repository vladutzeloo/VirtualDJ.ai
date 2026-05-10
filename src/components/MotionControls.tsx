import { motion } from 'motion/react';
import { Compass, Power, Smartphone, Zap } from 'lucide-react';
import type { MotionState } from '../hooks/useMotionControls';

interface MotionControlsProps {
  state: MotionState;
  onEnable: () => void | Promise<void>;
  onDisable: () => void;
  onTestPulse: () => void;
}

const Bar = ({ label, value, min, max, color = 'cyan' }: { label: string; value: number; min: number; max: number; color?: 'cyan' | 'pink' | 'emerald' }) => {
  const span = max - min || 1;
  const pct = Math.max(0, Math.min(100, ((value - min) / span) * 100));
  const stroke =
    color === 'pink'
      ? 'bg-jarvis-accent-pink shadow-[0_0_8px_var(--color-jarvis-accent-pink)]'
      : color === 'emerald'
        ? 'bg-emerald-500 shadow-[0_0_8px_rgb(16,185,129)]'
        : 'bg-jarvis-accent-cyan shadow-[0_0_8px_var(--color-jarvis-accent-cyan)]';
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest text-slate-500">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden relative">
        <div className={`absolute inset-y-0 left-0 ${stroke} transition-[width] duration-75`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const MotionControls = ({ state, onEnable, onDisable, onTestPulse }: MotionControlsProps) => {
  const { enabled, permission, alpha, beta, gamma, shake } = state;
  const unavailable = permission === 'unavailable';
  const denied = permission === 'denied';

  return (
    <div className="flex flex-col gap-3 p-4 glass rounded-2xl bg-vdj-surface/40 backdrop-blur-md border border-jarvis-border/40 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-jarvis-accent-cyan/10 blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-jarvis-accent-cyan" />
          <h3 className="text-[11px] font-display font-black uppercase tracking-[0.25em] text-white">Gyro Deck</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgb(16,185,129)]' : 'bg-slate-700'}`} />
          <span className={`text-[8px] font-mono uppercase tracking-widest ${enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
            {enabled ? 'LIVE' : unavailable ? 'NO SENSOR' : denied ? 'DENIED' : 'IDLE'}
          </span>
        </div>
      </div>

      <p className="text-[9px] font-mono text-slate-500 leading-relaxed">
        Tilt the S23 to ride the crossfader, twist to dial volume, nudge fwd/back for tempo. Shake hard for emergency stop, flick for next track.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <Bar label="α YAW" value={alpha} min={0} max={360} />
        <Bar label="β PITCH" value={beta} min={-90} max={90} color="pink" />
        <Bar label="γ ROLL" value={gamma} min={-90} max={90} color="emerald" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 bg-slate-800/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-jarvis-accent-pink"
            animate={{ width: `${Math.min(100, (shake / 40) * 100)}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <span className="text-[8px] font-mono uppercase tracking-widest text-jarvis-accent-pink w-14 text-right">
          SHK {shake.toFixed(1)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => (enabled ? onDisable() : onEnable())}
          disabled={unavailable}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
            unavailable
              ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
              : enabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-jarvis-accent-cyan/15 border-jarvis-accent-cyan/40 text-jarvis-accent-cyan hover:bg-jarvis-accent-cyan/25'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {enabled ? 'Disengage' : 'Engage Gyro'}
        </button>
        <button
          onClick={onTestPulse}
          className="px-3 py-2 rounded-xl border border-jarvis-border/40 bg-white/5 text-slate-300 hover:bg-white/10 active:scale-95 transition-all"
          title="Test haptic pulse"
        >
          <Zap className="w-3.5 h-3.5" />
        </button>
        <div className="px-3 py-2 rounded-xl border border-jarvis-border/40 bg-white/5 text-slate-400" title="Compass heading">
          <Compass className="w-3.5 h-3.5" style={{ transform: `rotate(${alpha}deg)` }} />
        </div>
      </div>

      {denied && (
        <p className="text-[9px] font-mono text-amber-400/80 leading-tight">
          Motion access denied. Re-enable in browser site settings, then tap Engage again.
        </p>
      )}
      {unavailable && (
        <p className="text-[9px] font-mono text-slate-500 leading-tight">
          This device exposes no motion sensors. Open on the S23 Ultra over HTTPS to use gyro controls.
        </p>
      )}
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Cpu,
  MemoryStick,
  HardDrive,
  BatteryFull,
  BatteryCharging,
  Monitor,
  Camera,
  Wifi,
  X,
  Activity,
  Gauge,
  Clock,
  Disc,
  Music,
  Plus,
} from 'lucide-react';
import {
  DEVICE_PROFILES,
  DEFAULT_DEVICE_ID,
  detectDeviceFromUA,
  getDeviceProfile,
} from '../data/devices';
import type { DeviceTelemetry } from '../hooks/useDeviceTelemetry';

interface UsageSnapshot {
  sessionMin: number;
  tracksPlayed: number;
  tracksLiked: number;
  agentsDeployed: number;
  searchesRun: number;
  fpsAvg: number;
  peakHeapMB: number;
}

interface DeviceIdentityProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  usage: UsageSnapshot;
  telemetry: DeviceTelemetry;
}

const STORAGE_KEY = 'jarvis.device.profile';

export const DeviceIdentity = ({ isOpen, onClose, theme, usage, telemetry }: DeviceIdentityProps) => {
  const [deviceId, setDeviceId] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_DEVICE_ID;
    return window.localStorage.getItem(STORAGE_KEY) ?? detectDeviceFromUA();
  });
  const [storageTier, setStorageTier] = useState<number>(0);

  const profile = useMemo(() => getDeviceProfile(deviceId), [deviceId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, deviceId);
    }
    setStorageTier(0);
  }, [deviceId]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const heapPct =
    telemetry.heapUsedMB && telemetry.heapLimitMB
      ? Math.min(100, Math.round((telemetry.heapUsedMB / telemetry.heapLimitMB) * 100))
      : null;

  const sessionH = Math.floor(usage.sessionMin / 60);
  const sessionM = usage.sessionMin % 60;

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
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`relative w-full max-w-[460px] max-h-[92vh] rounded-[2.5rem] border overflow-hidden shadow-2xl flex flex-col ${
          isDark ? 'bg-[#0A0C10] border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isDark ? 'border-white/5' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jarvis-accent-cyan/10 text-jarvis-accent-cyan flex items-center justify-center">
              <Smartphone className="w-5 h-5 drop-shadow-[0_0_10px_rgba(0,242,255,0.6)]" />
            </div>
            <div>
              <h2
                className={`text-sm font-display font-black tracking-widest uppercase ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Device Identity
              </h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase font-black tracking-tighter">
                Hardware Profile + Live Telemetry
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
          {/* Identity card */}
          <div
            className={`relative overflow-hidden rounded-2xl border p-5 ${
              isDark
                ? 'bg-gradient-to-br from-jarvis-accent-cyan/10 via-black/40 to-transparent border-jarvis-accent-cyan/20'
                : 'bg-gradient-to-br from-jarvis-accent-cyan/5 via-slate-50 to-white border-slate-200'
            }`}
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-jarvis-accent-cyan/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono font-black text-jarvis-accent-cyan uppercase tracking-[0.3em]">
                  {profile.brand}
                </span>
                <h3
                  className={`text-2xl vdj-display font-bold tracking-[0.06em] leading-none ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {profile.model}
                </h3>
                <span className="text-[10px] font-mono text-slate-500 mt-1">
                  {profile.codename} · {profile.releaseYear} · {profile.os}
                </span>
              </div>
              <select
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
                className={`text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg border px-2 py-1 cursor-pointer ${
                  isDark
                    ? 'bg-vdj-surface/60 border-vdj-border text-white'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {DEVICE_PROFILES.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <SpecChip
                icon={<Cpu className="w-3.5 h-3.5" />}
                label="Chipset"
                value={profile.chip}
                sub={`${profile.chipProcess} · ${telemetry.cores} cores`}
                isDark={isDark}
              />
              <SpecChip
                icon={<MemoryStick className="w-3.5 h-3.5" />}
                label="Memory"
                value={`${profile.ramGB} GB RAM`}
                sub={
                  telemetry.memoryGB
                    ? `≈${telemetry.memoryGB} GB exposed to web`
                    : 'web layer hidden'
                }
                isDark={isDark}
              />
              <SpecChip
                icon={<HardDrive className="w-3.5 h-3.5" />}
                label="Storage"
                value={`${profile.storageGB[storageTier]} GB`}
                sub={profile.storageGB.map(s => `${s}`).join(' / ')}
                isDark={isDark}
                onClick={() => setStorageTier(t => (t + 1) % profile.storageGB.length)}
              />
              <SpecChip
                icon={<Monitor className="w-3.5 h-3.5" />}
                label="Display"
                value={`${profile.display.sizeIn}″ ${profile.display.refreshHz}Hz`}
                sub={`${profile.display.resolution} · ${profile.display.peakNits} nits`}
                isDark={isDark}
              />
              <SpecChip
                icon={<Camera className="w-3.5 h-3.5" />}
                label="Main Cam"
                value={profile.camera.main}
                sub={`Tele ${profile.camera.tele}`}
                isDark={isDark}
              />
              <SpecChip
                icon={<BatteryFull className="w-3.5 h-3.5" />}
                label="Battery"
                value={`${profile.battery.capacityMah} mAh`}
                sub={`${profile.battery.fastWattW}W fast charge`}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Live telemetry */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4
                className={`text-xs font-display font-black tracking-[0.25em] uppercase ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Live Telemetry
              </h4>
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    telemetry.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  {telemetry.online ? 'Streaming' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Meter
                icon={<Gauge className="w-3.5 h-3.5" />}
                label="Frame Rate"
                value={`${telemetry.fps} fps`}
                pct={Math.min(100, (telemetry.fps / profile.display.refreshHz) * 100)}
                tone="cyan"
                isDark={isDark}
              />
              <Meter
                icon={<Activity className="w-3.5 h-3.5" />}
                label="Main Thread"
                value={`${telemetry.cpuLoadPct}%`}
                pct={telemetry.cpuLoadPct}
                tone={telemetry.cpuLoadPct > 60 ? 'pink' : 'cyan'}
                isDark={isDark}
              />
              <Meter
                icon={<MemoryStick className="w-3.5 h-3.5" />}
                label="JS Heap"
                value={
                  telemetry.heapUsedMB != null
                    ? `${telemetry.heapUsedMB} MB`
                    : '— MB'
                }
                pct={heapPct ?? 0}
                tone="cyan"
                isDark={isDark}
              />
              <Meter
                icon={
                  telemetry.battery?.charging ? (
                    <BatteryCharging className="w-3.5 h-3.5" />
                  ) : (
                    <BatteryFull className="w-3.5 h-3.5" />
                  )
                }
                label="Battery"
                value={
                  telemetry.battery
                    ? `${telemetry.battery.level}%${telemetry.battery.charging ? ' ⚡' : ''}`
                    : 'API blocked'
                }
                pct={telemetry.battery?.level ?? 0}
                tone={
                  telemetry.battery && telemetry.battery.level < 20 ? 'pink' : 'cyan'
                }
                isDark={isDark}
              />
            </div>

            <div
              className={`rounded-xl border p-3 flex items-center justify-between text-[10px] font-mono ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 text-slate-400">
                <Wifi className="w-3.5 h-3.5 text-jarvis-accent-cyan" />
                <span className="uppercase tracking-widest">Network</span>
              </div>
              <span className={isDark ? 'text-white' : 'text-slate-700'}>
                {telemetry.network
                  ? `${telemetry.network.type.toUpperCase()} · ${
                      telemetry.network.downlinkMbps ?? '—'
                    } Mbps · ${telemetry.network.rttMs ?? '—'} ms`
                  : 'API not exposed'}
              </span>
            </div>

            <div
              className={`rounded-xl border p-3 flex items-center justify-between text-[10px] font-mono ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 text-slate-400">
                <Monitor className="w-3.5 h-3.5 text-jarvis-accent-cyan" />
                <span className="uppercase tracking-widest">Viewport</span>
              </div>
              <span className={isDark ? 'text-white' : 'text-slate-700'}>
                {telemetry.screen.width}×{telemetry.screen.height} @ {telemetry.screen.dpr}x
              </span>
            </div>
          </div>

          {/* Session usage */}
          <div className="flex flex-col gap-3">
            <h4
              className={`text-xs font-display font-black tracking-[0.25em] uppercase ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              My Usage
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <UsageStat
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Session"
                value={
                  sessionH > 0 ? `${sessionH}h ${sessionM}m` : `${sessionM}m`
                }
                isDark={isDark}
              />
              <UsageStat
                icon={<Disc className="w-3.5 h-3.5" />}
                label="Tracks Played"
                value={`${usage.tracksPlayed}`}
                isDark={isDark}
              />
              <UsageStat
                icon={<Music className="w-3.5 h-3.5" />}
                label="Liked"
                value={`${usage.tracksLiked}`}
                isDark={isDark}
              />
              <UsageStat
                icon={<Plus className="w-3.5 h-3.5" />}
                label="Agents Deployed"
                value={`${usage.agentsDeployed}`}
                isDark={isDark}
              />
              <UsageStat
                icon={<Activity className="w-3.5 h-3.5" />}
                label="Searches"
                value={`${usage.searchesRun}`}
                isDark={isDark}
              />
              <UsageStat
                icon={<Gauge className="w-3.5 h-3.5" />}
                label="Avg FPS"
                value={`${usage.fpsAvg || telemetry.fps}`}
                isDark={isDark}
              />
            </div>
          </div>
        </div>

        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDark ? 'border-white/5' : 'border-slate-100'
          }`}
        >
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Uptime · {telemetry.uptimeSec}s
          </span>
          <span className="text-[9px] font-mono text-jarvis-accent-cyan uppercase tracking-widest">
            Identity · {profile.id}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

interface SpecChipProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  isDark: boolean;
  onClick?: () => void;
}

const SpecChip = ({ icon, label, value, sub, isDark, onClick }: SpecChipProps) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`text-left rounded-xl border p-3 flex flex-col gap-1 transition-colors ${
      isDark ? 'bg-vdj-surface/40 border-vdj-border' : 'bg-white border-slate-100'
    } ${onClick ? 'hover:border-jarvis-accent-cyan/50 cursor-pointer' : 'cursor-default'}`}
  >
    <div className="flex items-center gap-1.5 text-jarvis-accent-cyan">
      {icon}
      <span className="text-[8px] font-mono font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
    <span
      className={`text-[11px] font-display font-bold leading-tight ${
        isDark ? 'text-white' : 'text-slate-900'
      }`}
    >
      {value}
    </span>
    {sub && (
      <span className="text-[9px] font-mono text-slate-500 truncate">{sub}</span>
    )}
  </button>
);

interface MeterProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  pct: number;
  tone: 'cyan' | 'pink';
  isDark: boolean;
}

const Meter = ({ icon, label, value, pct, tone, isDark }: MeterProps) => {
  const barColor =
    tone === 'pink'
      ? 'bg-jarvis-accent-pink shadow-[0_0_8px_rgba(255,255,255,0.5)]'
      : 'bg-jarvis-accent-cyan shadow-[0_0_8px_rgba(0,242,255,0.6)]';
  return (
    <div
      className={`rounded-xl border p-3 flex flex-col gap-2 ${
        isDark ? 'bg-vdj-surface/40 border-vdj-border' : 'bg-white border-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-jarvis-accent-cyan">
          {icon}
          <span className="text-[8px] font-mono font-black uppercase tracking-widest">
            {label}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {value}
        </span>
      </div>
      <div
        className={`h-1.5 rounded-full overflow-hidden ${
          isDark ? 'bg-white/5' : 'bg-slate-100'
        }`}
      >
        <AnimatePresence>
          <motion.div
            key={pct}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full ${barColor}`}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

interface UsageStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
}

const UsageStat = ({ icon, label, value, isDark }: UsageStatProps) => (
  <div
    className={`rounded-xl border p-3 flex flex-col gap-1 ${
      isDark ? 'bg-vdj-surface/40 border-vdj-border' : 'bg-white border-slate-100'
    }`}
  >
    <div className="flex items-center gap-1.5 text-jarvis-accent-cyan">
      {icon}
      <span className="text-[8px] font-mono font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
    <span
      className={`text-base vdj-display font-bold tracking-[0.04em] ${
        isDark ? 'text-white' : 'text-slate-900'
      }`}
    >
      {value}
    </span>
  </div>
);

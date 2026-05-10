import { useEffect, useRef, useState } from 'react';

export interface DeviceTelemetry {
  cores: number;
  memoryGB: number | null;
  heapUsedMB: number | null;
  heapLimitMB: number | null;
  battery: { level: number; charging: boolean } | null;
  network: { type: string; downlinkMbps: number | null; rttMs: number | null; saveData: boolean } | null;
  screen: { width: number; height: number; dpr: number; colorDepth: number };
  fps: number;
  cpuLoadPct: number;
  online: boolean;
  uptimeSec: number;
}

const SAMPLE_MS = 1000;

interface MemoryInfo {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}
interface ConnectionInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (event: string, handler: () => void) => void;
  removeEventListener?: (event: string, handler: () => void) => void;
}
interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

export const useDeviceTelemetry = (): DeviceTelemetry => {
  const mountedAt = useRef(performance.now());
  const lastFrame = useRef(performance.now());
  const frameAccum = useRef({ frames: 0, elapsed: 0, lateMs: 0 });
  const rafId = useRef(0);

  const [telemetry, setTelemetry] = useState<DeviceTelemetry>(() => ({
    cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8,
    memoryGB: typeof navigator !== 'undefined' ? (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null : null,
    heapUsedMB: null,
    heapLimitMB: null,
    battery: null,
    network: null,
    screen: {
      width: typeof window !== 'undefined' ? window.screen.width : 0,
      height: typeof window !== 'undefined' ? window.screen.height : 0,
      dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      colorDepth: typeof window !== 'undefined' ? window.screen.colorDepth : 24,
    },
    fps: 60,
    cpuLoadPct: 0,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    uptimeSec: 0,
  }));

  // FPS + jank-derived CPU load via requestAnimationFrame.
  // Frames consistently arriving late (>16.7ms) imply main thread pressure.
  useEffect(() => {
    const tick = (now: number) => {
      const dt = now - lastFrame.current;
      lastFrame.current = now;
      frameAccum.current.frames += 1;
      frameAccum.current.elapsed += dt;
      frameAccum.current.lateMs += Math.max(0, dt - 16.7);
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  useEffect(() => {
    let batteryRef: BatteryManager | null = null;
    let connectionRef: ConnectionInfo | null = null;

    const sample = () => {
      const acc = frameAccum.current;
      const fps = acc.elapsed > 0 ? Math.round((acc.frames * 1000) / acc.elapsed) : 60;
      // load proxy: fraction of frame time spent over the 60fps budget, clamped
      const load = acc.elapsed > 0 ? Math.min(100, Math.round((acc.lateMs / acc.elapsed) * 100)) : 0;
      frameAccum.current = { frames: 0, elapsed: 0, lateMs: 0 };

      const perfMem = (performance as unknown as { memory?: MemoryInfo }).memory;
      const heapUsedMB = perfMem ? Math.round(perfMem.usedJSHeapSize / 1048576) : null;
      const heapLimitMB = perfMem ? Math.round(perfMem.jsHeapSizeLimit / 1048576) : null;

      setTelemetry(prev => ({
        ...prev,
        fps,
        cpuLoadPct: load,
        heapUsedMB,
        heapLimitMB,
        online: navigator.onLine,
        uptimeSec: Math.round((performance.now() - mountedAt.current) / 1000),
        battery: batteryRef
          ? { level: Math.round(batteryRef.level * 100), charging: batteryRef.charging }
          : prev.battery,
        network: connectionRef
          ? {
              type: connectionRef.effectiveType ?? 'unknown',
              downlinkMbps: connectionRef.downlink ?? null,
              rttMs: connectionRef.rtt ?? null,
              saveData: !!connectionRef.saveData,
            }
          : prev.network,
      }));
    };

    const interval = setInterval(sample, SAMPLE_MS);

    const nav = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManager>;
      connection?: ConnectionInfo;
      mozConnection?: ConnectionInfo;
      webkitConnection?: ConnectionInfo;
    };

    const onBatteryChange = () => sample();
    if (typeof nav.getBattery === 'function') {
      nav.getBattery().then(b => {
        batteryRef = b;
        b.addEventListener('levelchange', onBatteryChange);
        b.addEventListener('chargingchange', onBatteryChange);
        sample();
      }).catch(() => {});
    }

    connectionRef = nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
    const onConnChange = () => sample();
    connectionRef?.addEventListener?.('change', onConnChange);

    const onOnline = () => sample();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOnline);

    sample();

    return () => {
      clearInterval(interval);
      connectionRef?.removeEventListener?.('change', onConnChange);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOnline);
      if (batteryRef) {
        batteryRef.removeEventListener('levelchange', onBatteryChange);
        batteryRef.removeEventListener('chargingchange', onBatteryChange);
      }
    };
  }, []);

  return telemetry;
};

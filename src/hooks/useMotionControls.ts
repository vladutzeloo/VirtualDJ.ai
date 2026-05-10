import { useCallback, useEffect, useRef, useState } from 'react';

export type MotionPermission = 'unknown' | 'granted' | 'denied' | 'unavailable';

export interface MotionState {
  permission: MotionPermission;
  enabled: boolean;
  // Orientation in degrees
  alpha: number; // compass / yaw   (0..360)
  beta: number;  // front-to-back tilt (-180..180)
  gamma: number; // left-to-right tilt (-90..90)
  // Acceleration including gravity (m/s^2)
  accel: { x: number; y: number; z: number };
  // Latest detected shake magnitude (smoothed)
  shake: number;
}

export interface MotionControlBindings {
  // Tilt left/right (gamma) maps to crossfader 0..100
  onCrossfader?: (value: number) => void;
  // Tilt forward/back (beta) maps to tempo delta (-1..+1 per sample)
  onTempoDelta?: (delta: number) => void;
  // Compass rotation (alpha) maps to volume 0..100
  onVolume?: (value: number) => void;
  // Shake gesture (e.g. hard jolt) -> emergency stop / global pause
  onShake?: () => void;
  // Flick gesture (sharp single-axis spike) -> next track
  onFlick?: (direction: 'left' | 'right' | 'up' | 'down') => void;
}

const SHAKE_THRESHOLD = 28;     // m/s^2 sum of jerk magnitude
const FLICK_THRESHOLD = 18;     // m/s^2 single-axis spike
const SHAKE_COOLDOWN_MS = 700;
const FLICK_COOLDOWN_MS = 450;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface PermissionCapableEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export const vibrate = (pattern: number | number[]): boolean => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
};

export const useMotionControls = (bindings: MotionControlBindings = {}) => {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const [state, setState] = useState<MotionState>(() => ({
    permission: 'unknown',
    enabled: false,
    alpha: 0,
    beta: 0,
    gamma: 0,
    accel: { x: 0, y: 0, z: 0 },
    shake: 0,
  }));

  const lastAccel = useRef({ x: 0, y: 0, z: 0, t: 0 });
  const lastShakeAt = useRef(0);
  const lastFlickAt = useRef(0);
  const enabledRef = useRef(false);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const alpha = e.alpha ?? 0;
    const beta = e.beta ?? 0;
    const gamma = e.gamma ?? 0;

    // Map to control surfaces
    const crossfader = clamp(((gamma + 45) / 90) * 100, 0, 100);
    const volume = clamp((alpha / 360) * 100, 0, 100);
    // Tilt past +/-15deg starts nudging tempo. Dead-zone in the middle.
    const tiltN = beta;
    const dead = 15;
    const tempoDelta = Math.abs(tiltN) < dead ? 0 : clamp((tiltN - Math.sign(tiltN) * dead) / 60, -1, 1);

    bindingsRef.current.onCrossfader?.(crossfader);
    bindingsRef.current.onVolume?.(volume);
    if (tempoDelta !== 0) bindingsRef.current.onTempoDelta?.(tempoDelta);

    setState(prev => ({ ...prev, alpha, beta, gamma }));
  }, []);

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity ?? e.acceleration ?? { x: 0, y: 0, z: 0 };
    const x = a.x ?? 0;
    const y = a.y ?? 0;
    const z = a.z ?? 0;
    const now = performance.now();
    const dt = lastAccel.current.t > 0 ? (now - lastAccel.current.t) / 1000 : 0;

    // Per-axis jerk (delta accel). Used for shake + flick detection.
    const jx = x - lastAccel.current.x;
    const jy = y - lastAccel.current.y;
    const jz = z - lastAccel.current.z;
    const jerk = Math.abs(jx) + Math.abs(jy) + Math.abs(jz);

    lastAccel.current = { x, y, z, t: now };

    if (dt > 0 && dt < 0.2) {
      if (jerk > SHAKE_THRESHOLD && now - lastShakeAt.current > SHAKE_COOLDOWN_MS) {
        lastShakeAt.current = now;
        vibrate([30, 40, 30]);
        bindingsRef.current.onShake?.();
      } else if (now - lastFlickAt.current > FLICK_COOLDOWN_MS) {
        const ax = Math.abs(jx);
        const ay = Math.abs(jy);
        const az = Math.abs(jz);
        const peak = Math.max(ax, ay, az);
        if (peak > FLICK_THRESHOLD && jerk < SHAKE_THRESHOLD) {
          lastFlickAt.current = now;
          let dir: 'left' | 'right' | 'up' | 'down';
          if (peak === ax) dir = jx > 0 ? 'right' : 'left';
          else if (peak === ay) dir = jy > 0 ? 'up' : 'down';
          else dir = jz > 0 ? 'up' : 'down';
          vibrate(20);
          bindingsRef.current.onFlick?.(dir);
        }
      }
    }

    setState(prev => ({
      ...prev,
      accel: { x, y, z },
      shake: prev.shake * 0.7 + jerk * 0.3,
    }));
  }, []);

  const attach = useCallback(() => {
    if (enabledRef.current) return;
    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
    enabledRef.current = true;
    setState(prev => ({ ...prev, enabled: true }));
  }, [handleMotion, handleOrientation]);

  const detach = useCallback(() => {
    if (!enabledRef.current) return;
    window.removeEventListener('deviceorientation', handleOrientation);
    window.removeEventListener('devicemotion', handleMotion);
    enabledRef.current = false;
    setState(prev => ({ ...prev, enabled: false }));
  }, [handleMotion, handleOrientation]);

  const enable = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const hasMotion = 'DeviceMotionEvent' in window;
    const hasOrient = 'DeviceOrientationEvent' in window;
    if (!hasMotion && !hasOrient) {
      setState(prev => ({ ...prev, permission: 'unavailable' }));
      return;
    }

    const motionCtor = (window as unknown as { DeviceMotionEvent?: PermissionCapableEvent }).DeviceMotionEvent;
    const orientCtor = (window as unknown as { DeviceOrientationEvent?: PermissionCapableEvent }).DeviceOrientationEvent;
    const requesters = [motionCtor?.requestPermission, orientCtor?.requestPermission].filter(
      (fn): fn is () => Promise<'granted' | 'denied'> => typeof fn === 'function',
    );

    if (requesters.length > 0) {
      try {
        const results = await Promise.all(requesters.map(fn => fn()));
        const granted = results.every(r => r === 'granted');
        setState(prev => ({ ...prev, permission: granted ? 'granted' : 'denied' }));
        if (!granted) return;
      } catch {
        setState(prev => ({ ...prev, permission: 'denied' }));
        return;
      }
    } else {
      setState(prev => ({ ...prev, permission: 'granted' }));
    }

    vibrate(15);
    attach();
  }, [attach]);

  const disable = useCallback(() => {
    detach();
    vibrate(10);
  }, [detach]);

  useEffect(() => () => detach(), [detach]);

  return { state, enable, disable, vibrate };
};

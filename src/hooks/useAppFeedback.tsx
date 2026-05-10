import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  playSound as playSoundRaw,
  setSoundEnabled as setSoundEnabledRaw,
  unlockAudio,
  type SoundName,
} from '../services/soundService';

export type NotificationType = 'info' | 'success' | 'warn' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  type: NotificationType;
  agent?: string;
  createdAt: number;
}

interface NotifyOptions {
  title: string;
  message?: string;
  type?: NotificationType;
  agent?: string;
  sound?: SoundName | null;
  duration?: number;
}

interface AppFeedbackValue {
  notifications: NotificationItem[];
  notify: (opts: NotifyOptions) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
  playSound: (name: SoundName) => void;
  soundEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
}

const NOTIFICATIONS_KEY = 'vdj.notifications.enabled';
const SOUND_KEY = 'vdj.sound.enabled';
const DEFAULT_DURATION = 4000;
const MAX_VISIBLE = 4;

const AppFeedbackContext = createContext<AppFeedbackValue | null>(null);

const defaultSoundForType: Record<NotificationType, SoundName> = {
  info: 'notify',
  success: 'success',
  warn: 'warn',
  error: 'error',
};

function readBool(key: string, fallback = true): boolean {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // Persistence is best effort.
  }
}

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => readBool(SOUND_KEY, true));
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() =>
    readBool(NOTIFICATIONS_KEY, true),
  );
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Keep the sound service in sync with React state.
  useEffect(() => {
    setSoundEnabledRaw(soundEnabled);
  }, [soundEnabled]);

  // Unlock audio on the first user gesture so future sounds play instantly.
  useEffect(() => {
    const onGesture = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, []);

  // Clean up any pending timers on unmount.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(t => clearTimeout(t));
      map.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const clearAll = useCallback(() => {
    timers.current.forEach(t => clearTimeout(t));
    timers.current.clear();
    setNotifications([]);
  }, []);

  const playSound = useCallback(
    (name: SoundName) => {
      if (!soundEnabled) return;
      playSoundRaw(name);
    },
    [soundEnabled],
  );

  const notify = useCallback(
    ({ title, message, type = 'info', agent, sound, duration = DEFAULT_DURATION }: NotifyOptions) => {
      const id = `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

      // Always trigger sound feedback — sounds and notifications can be toggled
      // independently so a user can keep audible cues even with toasts hidden.
      const soundName = sound === undefined ? defaultSoundForType[type] : sound;
      if (soundName) playSoundRaw(soundName);

      if (!notificationsEnabled) return id;

      setNotifications(prev => {
        const next = [...prev, { id, title, message, type, agent, createdAt: Date.now() }];
        if (next.length > MAX_VISIBLE) {
          const dropped = next.slice(0, next.length - MAX_VISIBLE);
          dropped.forEach(d => {
            const t = timers.current.get(d.id);
            if (t) {
              clearTimeout(t);
              timers.current.delete(d.id);
            }
          });
          return next.slice(-MAX_VISIBLE);
        }
        return next;
      });

      const handle = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, handle);
      return id;
    },
    [dismiss, notificationsEnabled],
  );

  const setSoundEnabled = useCallback((value: boolean) => {
    setSoundEnabledState(value);
    writeBool(SOUND_KEY, value);
    if (value) {
      // Audible confirmation that sound is back on.
      playSoundRaw('toggle');
    }
  }, []);

  const setNotificationsEnabled = useCallback((value: boolean) => {
    setNotificationsEnabledState(value);
    writeBool(NOTIFICATIONS_KEY, value);
  }, []);

  const value = useMemo<AppFeedbackValue>(
    () => ({
      notifications,
      notify,
      dismiss,
      clearAll,
      playSound,
      soundEnabled,
      setSoundEnabled,
      notificationsEnabled,
      setNotificationsEnabled,
    }),
    [
      notifications,
      notify,
      dismiss,
      clearAll,
      playSound,
      soundEnabled,
      setSoundEnabled,
      notificationsEnabled,
      setNotificationsEnabled,
    ],
  );

  return <AppFeedbackContext.Provider value={value}>{children}</AppFeedbackContext.Provider>;
}

export function useAppFeedback(): AppFeedbackValue {
  const ctx = useContext(AppFeedbackContext);
  if (!ctx) {
    throw new Error('useAppFeedback must be used within an AppFeedbackProvider');
  }
  return ctx;
}

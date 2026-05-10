import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, X, Info } from 'lucide-react';
import { useAppFeedback, type NotificationType } from '../hooks/useAppFeedback';

interface NotificationCenterProps {
  theme?: 'dark' | 'light';
}

const ACCENT: Record<NotificationType, { bar: string; icon: string; chip: string; glow: string }> = {
  info: {
    bar: 'bg-jarvis-accent-cyan',
    icon: 'text-jarvis-accent-cyan',
    chip: 'bg-jarvis-accent-cyan/10 text-jarvis-accent-cyan border-jarvis-accent-cyan/30',
    glow: 'shadow-[0_0_25px_rgba(0,242,255,0.18)]',
  },
  success: {
    bar: 'bg-emerald-500',
    icon: 'text-emerald-400',
    chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.18)]',
  },
  warn: {
    bar: 'bg-amber-400',
    icon: 'text-amber-400',
    chip: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.18)]',
  },
  error: {
    bar: 'bg-red-500',
    icon: 'text-red-400',
    chip: 'bg-red-500/10 text-red-400 border-red-500/30',
    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.18)]',
  },
};

function iconFor(type: NotificationType) {
  switch (type) {
    case 'success':
      return CheckCircle2;
    case 'warn':
      return AlertTriangle;
    case 'error':
      return AlertCircle;
    default:
      return Info;
  }
}

export function NotificationCenter({ theme = 'dark' }: NotificationCenterProps) {
  const { notifications, dismiss } = useAppFeedback();
  const isDark = theme === 'dark';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[300] flex flex-col items-center gap-2 px-3 sm:top-4">
      <AnimatePresence initial={false}>
        {notifications.map(n => {
          const accent = ACCENT[n.type];
          const Icon = iconFor(n.type);
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border backdrop-blur-xl ${accent.glow} ${
                isDark
                  ? 'bg-black/70 border-white/10 text-white'
                  : 'bg-white/90 border-slate-200 text-slate-900'
              }`}
              role="status"
              aria-live="polite"
            >
              <div className={`h-[2px] w-full ${accent.bar}`} />
              <div className="flex items-start gap-3 p-3">
                <div className={`mt-0.5 ${accent.icon}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {n.agent && (
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${accent.chip}`}
                      >
                        {n.agent}
                      </span>
                    )}
                    <span className="font-display text-[12px] font-bold tracking-tight truncate">
                      {n.title}
                    </span>
                  </div>
                  {n.message && (
                    <p
                      className={`mt-0.5 font-mono text-[10px] leading-snug ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {n.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(n.id)}
                  aria-label="Dismiss notification"
                  className={`rounded-md p-1 transition-colors ${
                    isDark ? 'text-slate-500 hover:bg-white/5 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function NotificationCenterEmptyHint() {
  // Lightweight standalone hint when the user opens preferences with notifications off.
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
      <Bell className="h-3 w-3" /> No live alerts
    </div>
  );
}

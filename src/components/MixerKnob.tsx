import { useRef } from "react";
import { motion } from "motion/react";

interface MixerKnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange?: (val: number) => void;
  color?: "cyan" | "pink";
  unit?: string;
  /** Pixels of vertical drag required to traverse the full range. */
  sensitivity?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const MixerKnob = ({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
  color = "cyan",
  unit,
  sensitivity = 140,
}: MixerKnobProps) => {
  const span = max - min;
  const safeValue = clamp(value, min, max);
  const rotation = ((safeValue - min) / span) * 270 - 135;
  const accentColor = color === "cyan" ? "var(--color-jarvis-accent-cyan)" : "var(--color-jarvis-accent-pink)";
  const interactive = typeof onChange === "function";

  const dragRef = useRef<{ startY: number; startValue: number; pointerId: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startValue: safeValue, pointerId: e.pointerId };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !onChange) return;
    const dy = drag.startY - e.clientY;
    const next = clamp(Math.round(drag.startValue + (dy / sensitivity) * span), min, max);
    if (next !== safeValue) onChange(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    try { e.currentTarget.releasePointerCapture(drag.pointerId); } catch {}
    dragRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!onChange) return;
    e.preventDefault();
    const step = Math.max(1, Math.round(span / 100));
    const delta = -Math.sign(e.deltaY) * step * (e.shiftKey ? 5 : 1);
    onChange(clamp(safeValue + delta, min, max));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onChange) return;
    const step = e.shiftKey ? Math.max(1, Math.round(span / 10)) : Math.max(1, Math.round(span / 100));
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      onChange(clamp(safeValue + step, min, max));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(clamp(safeValue - step, min, max));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(min);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(max);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        role={interactive ? "slider" : undefined}
        aria-label={interactive ? label : undefined}
        aria-valuemin={interactive ? min : undefined}
        aria-valuemax={interactive ? max : undefined}
        aria-valuenow={interactive ? safeValue : undefined}
        tabIndex={interactive ? 0 : undefined}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerUp={interactive ? endDrag : undefined}
        onPointerCancel={interactive ? endDrag : undefined}
        onWheel={interactive ? handleWheel : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        onDoubleClick={interactive ? () => onChange?.(Math.round((min + max) / 2)) : undefined}
        className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors group select-none touch-none border-slate-200 dark:border-jarvis-border bg-slate-100 dark:bg-slate-900/50 ${
          interactive
            ? "cursor-ns-resize hover:border-jarvis-accent-cyan/60 active:scale-95 focus:outline-none focus:ring-2 focus:ring-jarvis-accent-cyan/50"
            : "cursor-default"
        }`}
      >
        <motion.div
           className="w-1 h-3 rounded-full absolute top-1 pointer-events-none"
           style={{
             backgroundColor: accentColor,
             transformOrigin: "bottom center",
             rotate: `${rotation}deg`,
             boxShadow: `0 0 12px ${accentColor}, 0 0 4px ${accentColor}`,
           }}
        />
        <div className="flex flex-col items-center leading-none pointer-events-none">
           <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white transition-colors group-hover:opacity-100">
             {Math.round(safeValue)}
           </span>
           {unit && <span className="text-[6px] font-mono opacity-40 uppercase text-slate-600 dark:text-slate-400">{unit}</span>}
        </div>
      </div>
      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-500">{label}</span>
    </div>
  );
};

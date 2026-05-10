import { motion } from "motion/react";

interface MixerKnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange?: (val: number) => void;
  color?: "cyan" | "pink";
  unit?: string;
}

export const MixerKnob = ({ label, value, min = 0, max = 100, onChange, color = "cyan", unit }: MixerKnobProps) => {
  const rotation = (value / max) * 270 - 135;
  const accentColor = color === "cyan" ? "var(--color-jarvis-accent-cyan)" : "var(--color-jarvis-accent-pink)";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors group cursor-pointer border-slate-200 dark:border-jarvis-border bg-slate-100 dark:bg-slate-900/50">
        <motion.div
           className="w-1 h-3 rounded-full absolute top-1"
           style={{ 
             backgroundColor: accentColor,
             transformOrigin: "bottom center",
             rotate: `${rotation}deg`,
             boxShadow: `0 0 12px ${accentColor}, 0 0 4px ${accentColor}`
           }}
        />
        <div className="flex flex-col items-center leading-none">
           <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white transition-colors group-hover:opacity-100">
             {value}
           </span>
           {unit && <span className="text-[6px] font-mono opacity-40 uppercase text-slate-600 dark:text-slate-400">{unit}</span>}
        </div>
      </div>
      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-500">{label}</span>
    </div>
  );
};

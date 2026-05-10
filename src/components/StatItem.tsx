import { motion } from "motion/react";
import { Cpu, MemoryStick, Zap, Waves } from "lucide-react";

interface StatItemProps {
  icon: "cpu" | "ram" | "pwr" | "vram";
  label: string;
  value: string;
  subValue?: string;
  theme?: 'dark' | 'light';
  pct?: number;
}

const icons = {
  cpu: Cpu,
  ram: MemoryStick,
  pwr: Zap,
  vram: Waves,
};

export const StatItem = ({ icon, label, value, subValue, theme = 'dark', pct }: StatItemProps) => {
  const Icon = icons[icon];
  return (
    <div className={`flex-1 flex items-center justify-center gap-3 px-4 py-1 border-r last:border-none group transition-colors ${
      theme === 'dark' ? 'border-white/5' : 'border-slate-100'
    }`}>
      <div className={`p-1.5 rounded-lg transition-colors ${
        theme === 'dark' ? 'bg-white/5 group-hover:bg-jarvis-accent-cyan/10' : 'bg-slate-100 group-hover:bg-jarvis-accent-cyan/10'
      }`}>
        <Icon className={`w-3.5 h-3.5 transition-colors ${
          theme === 'dark' ? 'text-slate-500 group-hover:text-jarvis-accent-cyan' : 'text-slate-400 group-hover:text-jarvis-accent-cyan'
        }`} />
      </div>
      <div className="flex flex-col">
        <span className={`text-[8px] font-mono font-black uppercase tracking-tighter leading-none mb-1 ${
          theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
        }`}>
          {label}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[11px] font-display font-medium tracking-tight transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>{value}</span>
          {subValue && <span className={`text-[8px] font-mono italic ${
            theme === 'dark' ? 'text-slate-700' : 'text-slate-300'
          }`}>{subValue}</span>}
        </div>
        {pct !== undefined && (
          <div className={`mt-1 h-[2px] w-full rounded-full overflow-hidden ${
            theme === 'dark' ? 'bg-white/5' : 'bg-slate-200'
          }`}>
            <div
              className="h-full bg-jarvis-accent-cyan shadow-[0_0_4px_rgba(0,242,255,0.6)] transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

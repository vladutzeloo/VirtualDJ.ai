import { motion } from "motion/react";
import { Cpu, MemoryStick, Zap, Waves } from "lucide-react";

interface StatItemProps {
  icon: "cpu" | "ram" | "pwr" | "vram";
  label: string;
  value: string;
  subValue?: string;
  theme?: 'dark' | 'light';
}

const icons = {
  cpu: Cpu,
  ram: MemoryStick,
  pwr: Zap,
  vram: Waves,
};

export const StatItem = ({ icon, label, value, subValue, theme = 'dark' }: StatItemProps) => {
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
      </div>
    </div>
  );
};

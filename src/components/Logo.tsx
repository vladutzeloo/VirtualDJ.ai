import { motion } from 'motion/react';
import { Disc, Zap } from 'lucide-react';

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full bg-vdj-bg border-2 border-vdj-neon-cyan flex items-center justify-center ring-glow-cyan"
        >
          <Disc className="w-5 h-5 text-vdj-neon-cyan" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, scale: 0.8 }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.05, 0.85] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1"
        >
          <Zap className="w-4 h-4 text-vdj-neon-magenta fill-vdj-neon-magenta glow-magenta" />
        </motion.div>
      </div>

      <div className="flex flex-col leading-none">
        <span className="vdj-display text-[15px] font-bold tracking-[0.18em] text-slate-900 dark:text-white uppercase transition-colors">
          VIRTUAL<span className="text-vdj-neon-cyan">DJ</span>
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-[2px] w-4 bg-vdj-neon-magenta rounded-full transition-colors" />
          <span className="vdj-eyebrow text-[9px] text-slate-400 dark:text-vdj-text-muted">.AI · ENGINE</span>
        </div>
      </div>
    </div>
  );
};

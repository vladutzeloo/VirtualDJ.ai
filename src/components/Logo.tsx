import React from 'react';
import { motion } from 'motion/react';
import { Disc, Zap } from 'lucide-react';

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative group">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full bg-black border-2 border-jarvis-accent-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]"
        >
          <Disc className="w-6 h-6 text-jarvis-accent-cyan" />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0.5, scale: 0.8 }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1"
        >
          <Zap className="w-4 h-4 text-jarvis-accent-pink fill-jarvis-accent-pink shadow-[0_0_10px_rgba(255,0,255,0.8)]" />
        </motion.div>
      </div>
      
      <div className="flex flex-col leading-none">
        <span className="text-xl font-display font-black tracking-tighter text-slate-900 dark:text-white uppercase italic transition-colors">
          VIRTUAL<span className="text-jarvis-accent-cyan italic">DJ</span>
        </span>
        <div className="flex items-center gap-1">
          <div className="h-[2px] w-4 bg-jarvis-accent-pink rounded-full transition-colors" />
          <span className="text-[10px] font-mono font-black tracking-[0.4em] text-slate-400 dark:text-slate-500 uppercase transition-colors">.AI ENGINE</span>
        </div>
      </div>
    </div>
  );
};

import { motion } from 'motion/react';

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-black" />
        </div>
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border border-white/40"
        />
      </div>

      <div className="flex flex-col leading-none">
        <span className="vdj-wordmark text-[15px] text-slate-900 dark:text-white">
          VIRTUALDJ
          <span className="text-vdj-neon-cyan">.AI</span>
        </span>
        <span className="vdj-eyebrow text-[8px] mt-1 tracking-[0.5em] text-slate-400 dark:text-vdj-text-subtle">
          HIFI · ENGINE
        </span>
      </div>
    </div>
  );
};

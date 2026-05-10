import { motion } from "motion/react";

interface RickRubinAgentProps {
  meditating?: boolean;
}

export const RickRubinAgent = ({ meditating = false }: RickRubinAgentProps) => {
  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className={`relative w-24 h-24 flex items-center justify-center p-2 rounded-xl bg-slate-900/40 border transition-all duration-500 ${
          meditating
            ? 'border-jarvis-accent-pink shadow-[0_0_24px_rgba(255,0,255,0.25)]'
            : 'border-jarvis-border/20 shadow-inner'
        }`}
        animate={meditating ? {
          scale: [1, 1.04, 1],
          y: [0, -3, 0],
        } : {
          y: [0, -2, 0],
        }}
        transition={{ repeat: Infinity, duration: meditating ? 3 : 4, ease: "easeInOut" }}
      >
        {/* Rick Rubin (Zen producer) inspired 16-bit SVG sprite */}
        <svg width="68" height="68" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
          {/* White Robe / Body */}
          <rect x="16" y="40" width="32" height="24" fill="#f5f5f4" />
          <rect x="18" y="42" width="28" height="22" fill="#e7e5e4" />
          {/* Robe shadow fold */}
          <rect x="30" y="42" width="2" height="22" fill="#a8a29e" opacity="0.6" />

          {/* Hands clasped (meditation) */}
          <motion.g
            animate={meditating ? { y: [0, -1, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <rect x="26" y="48" width="5" height="5" fill="#fcd9b6" />
            <rect x="33" y="48" width="5" height="5" fill="#fcd9b6" />
            <rect x="26" y="48" width="12" height="1" fill="#c79b73" />
          </motion.g>

          {/* Head Container */}
          <motion.g
            animate={meditating ? {
              y: [0, 1, 0],
              rotate: [-1, 1, -1],
            } : {
              y: [0, 0.5, 0],
            }}
            transition={{ repeat: Infinity, duration: meditating ? 3 : 5, ease: "easeInOut" }}
          >
            {/* Bald head — skin tone */}
            <rect x="22" y="14" width="20" height="18" fill="#fcd9b6" />
            <rect x="24" y="12" width="16" height="2" fill="#fcd9b6" />
            <rect x="24" y="14" width="16" height="14" fill="#f4c39a" />
            {/* Forehead highlight */}
            <rect x="26" y="15" width="4" height="2" fill="#fde4c4" opacity="0.9" />

            {/* Subtle eyebrow line (no real brows — bald monk) */}
            <rect x="26" y="20" width="4" height="1" fill="#a8a29e" opacity="0.4" />
            <rect x="34" y="20" width="4" height="1" fill="#a8a29e" opacity="0.4" />

            {/* Sunglasses — iconic black shades */}
            <rect x="24" y="22" width="16" height="4" fill="#0a0a0a" />
            <rect x="24" y="22" width="7" height="4" fill="#111111" />
            <rect x="33" y="22" width="7" height="4" fill="#111111" />
            <rect x="31" y="23" width="2" height="1" fill="#0a0a0a" />
            {/* Lens reflection */}
            <motion.rect
              x="25" y="23" width="2" height="1" fill="#00f2ff" opacity="0.7"
              animate={meditating ? { opacity: [0.7, 0.2, 0.7] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.rect
              x="34" y="23" width="2" height="1" fill="#ff00ff" opacity="0.7"
              animate={meditating ? { opacity: [0.7, 0.2, 0.7] } : {}}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            />

            {/* Long flowing beard — the centerpiece */}
            {/* Upper moustache */}
            <rect x="26" y="28" width="12" height="2" fill="#e7e5e4" />
            {/* Beard mass */}
            <rect x="22" y="30" width="20" height="10" fill="#f5f5f4" />
            <rect x="20" y="32" width="24" height="8" fill="#f5f5f4" />
            <rect x="22" y="40" width="20" height="6" fill="#e7e5e4" />
            {/* Beard tapered tips */}
            <rect x="26" y="46" width="12" height="3" fill="#d6d3d1" />
            <rect x="29" y="49" width="6" height="2" fill="#a8a29e" />
            {/* Beard texture strands */}
            <rect x="24" y="34" width="1" height="6" fill="#d6d3d1" opacity="0.6" />
            <rect x="28" y="36" width="1" height="8" fill="#d6d3d1" opacity="0.6" />
            <rect x="35" y="36" width="1" height="8" fill="#d6d3d1" opacity="0.6" />
            <rect x="39" y="34" width="1" height="6" fill="#d6d3d1" opacity="0.6" />
          </motion.g>

          {/* Meditation aura ring (only when meditating) */}
          {meditating && (
            <>
              <motion.circle
                cx="32" cy="32" r="28"
                stroke="#ff00ff" strokeWidth="0.5" fill="none"
                opacity="0.4"
                animate={{ r: [28, 32, 28], opacity: [0.4, 0.05, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.circle
                cx="32" cy="32" r="24"
                stroke="#00f2ff" strokeWidth="0.5" fill="none"
                opacity="0.3"
                animate={{ r: [24, 30, 24], opacity: [0.3, 0.05, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}

          {/* Studio floor / mat */}
          <rect x="10" y="60" width="44" height="2" fill="#00f2ff" opacity="0.2" />
          {meditating && (
            <motion.rect
              x="10" y="60" width="8" height="2" fill="#ff00ff"
              animate={{ x: [10, 46, 10] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </svg>

        {/* Ambient AI glow */}
        <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${meditating ? 'bg-jarvis-accent-pink/20' : 'bg-jarvis-accent-cyan/5'}`} />
      </motion.div>

      <div className="mt-3 flex flex-col items-center gap-1">
        <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 group transition-all ${
          meditating ? 'bg-vdj-neon-magenta/10 border-vdj-neon-magenta/50 ring-glow-magenta' : 'bg-vdj-neon-cyan/10 border-vdj-neon-cyan/30'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-ping ${meditating ? 'bg-vdj-neon-magenta' : 'bg-vdj-neon-cyan'}`} />
          <span className="vdj-mono text-[10px] font-bold text-white tracking-[0.2em] uppercase">
            {meditating ? 'Rubin · Listening' : 'Rubin · Present'}
          </span>
        </div>
        <span className="vdj-eyebrow text-[8px] flex items-center gap-1">
          <span className={`w-1 h-1 rounded-full ${meditating ? 'bg-vdj-neon-magenta animate-pulse' : 'bg-vdj-text-subtle'}`} />
          {meditating ? 'STRIPPING · NOISE' : 'ZEN · STATE'}
        </span>
      </div>
    </div>
  );
};

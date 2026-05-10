import { motion } from "motion/react";
import { Headphones, Music } from "lucide-react";

interface JulesAgentProps {
  planning?: boolean;
}

export const JulesAgent = ({ planning = false }: JulesAgentProps) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Sprite Container */}
      <motion.div 
        className={`relative w-24 h-24 flex items-center justify-center p-2 rounded-xl bg-slate-900/40 border transition-all duration-500 ${
          planning ? 'border-jarvis-accent-cyan shadow-[0_0_20px_rgba(0,242,255,0.2)]' : 'border-jarvis-border/20 shadow-inner'
        }`}
        animate={planning ? { 
          scale: [1, 1.05, 1],
          y: [0, -8, 0],
        } : { 
          y: [0, -4, 0] 
        }}
        transition={{ repeat: Infinity, duration: planning ? 1 : 2, ease: "easeInOut" }}
      >
        {/* Sam Jackson / Jules (Pulp Fiction) inspired 16-bit SVG Sprite */}
        <svg width="68" height="68" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
          {/* Suit / Body */}
          <rect x="18" y="36" width="28" height="24" fill="#000000" /> {/* Black Suit */}
          <rect x="26" y="36" width="12" height="10" fill="#ffffff" /> {/* White Shirt */}
          <rect x="30" y="38" width="4" height="8" fill="#000000" /> {/* Thin Black Tie */}
          
          {/* Hands */}
          <motion.rect 
            x="14" y="48" width="4" height="6" fill="#451a03" 
            animate={planning ? { x: [14, 12, 14], y: [48, 46, 48] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
          <motion.rect 
            x="46" y="48" width="4" height="6" fill="#451a03" 
            animate={planning ? { x: [46, 48, 46], y: [48, 46, 48] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />

          {/* Head Container */}
          <motion.g
            animate={planning ? { 
              y: [0, 2, 0], 
              rotate: [-2, 2, -2] 
            } : { 
              y: [0, 1, 0], 
              rotate: [-1, 1, -1] 
            }}
            transition={{ repeat: Infinity, duration: planning ? 0.4 : 1, ease: "easeInOut" }}
          >
            {/* Skin Tone */}
            <rect x="22" y="16" width="20" height="20" fill="#451a03" />
            <rect x="24" y="18" width="16" height="16" fill="#5c2406" />
            
            {/* Iconic Hair (Jheri Curl Style) */}
            <rect x="20" y="14" width="24" height="6" fill="#111111" />
            <rect x="18" y="18" width="4" height="12" fill="#111111" />
            <rect x="42" y="18" width="4" height="12" fill="#111111" />
            <rect x="20" y="10" width="2" height="4" fill="#111111" />
            <rect x="42" y="10" width="2" height="4" fill="#111111" />
            
            {/* Facial Hair (Chops + Moustache) */}
            <rect x="22" y="24" width="2" height="8" fill="#111111" />
            <rect x="40" y="24" width="2" height="8" fill="#111111" />
            <rect x="28" y="30" width="8" height="2" fill="#111111" />
            
            {/* Eyes - Sharp Gaze */}
            <motion.g animate={planning ? { scale: [1, 1.2, 1] } : {}} transition={{ repeat: Infinity, duration: 0.8 }}>
              <rect x="27" y="22" width="3" height="1" fill="#ffffff" />
              <rect x="34" y="22" width="3" height="1" fill="#ffffff" />
              <rect x="28" y="22" width="1" height="1" fill="#000000" />
              <rect x="35" y="22" width="1" height="1" fill="#000000" />
            </motion.g>

            {/* Glowing DJ Headphones */}
            <rect x="18" y="20" width="4" height="10" fill={planning ? "#ff00ff" : "#00f2ff"} opacity="0.8" />
            <rect x="42" y="20" width="4" height="10" fill={planning ? "#ff00ff" : "#00f2ff"} opacity="0.8" />
            <rect x="20" y="14" width="24" height="2" fill={planning ? "#ff00ff" : "#00f2ff"} opacity="0.6" />
          </motion.g>

          {/* Record Player Simulation */}
          <rect x="12" y="58" width="40" height="2" fill="#00f2ff" opacity="0.2" />
          {planning && (
            <motion.rect 
              x="12" y="58" width="10" height="2" fill="#ff00ff" 
              animate={{ x: [12, 42, 12] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </svg>

        {/* Ambient AI Glow */}
        <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${planning ? 'bg-jarvis-accent-pink/20' : 'bg-jarvis-accent-cyan/5'}`} />
      </motion.div>

      <div className="mt-2 flex flex-col items-center">
        <div className={`px-3 py-1 rounded-full border flex items-center gap-2 group transition-all ${
          planning ? 'bg-jarvis-accent-pink/10 border-jarvis-accent-pink/50' : 'bg-jarvis-accent-cyan/10 border-jarvis-accent-cyan/30'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-ping ${planning ? 'bg-jarvis-accent-pink' : 'bg-jarvis-accent-cyan'}`} />
          <span className="text-[10px] font-display font-bold text-white tracking-widest uppercase">
            {planning ? 'Jules Thinking...' : 'Jules Waiting'}
          </span>
        </div>
        <span className="text-[8px] font-mono text-slate-500 uppercase mt-1 tracking-widest flex items-center gap-1">
          <span className={`w-1 h-1 rounded-full ${planning ? 'bg-jarvis-accent-pink animate-pulse' : 'bg-slate-700'}`} />
          {planning ? 'SYNCING AGENTS' : 'IDLE STATE'}
        </span>
      </div>
    </div>
  );
};


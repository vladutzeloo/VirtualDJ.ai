import React from 'react';
import { motion } from 'motion/react';
import { Bot, Zap, Activity, Music, Sparkles, Shield, Cpu } from 'lucide-react';
import { getAgentImage } from '../constants/agentImages';

const AGENTS_LIST = [
  {
    name: 'Bass Architect',
    role: 'Low-Frequency Optimization',
    description: 'Specializes in structural bass integrity and sub-harmonic enhancement. Ideal for Techno, Trap, and D&B.',
    icon: <Cpu className="w-5 h-5" />,
    color: 'orange',
    accent: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    rarity: 'LEGENDARY',
    power: 94,
    skills: ['SUB-CLEAN', 'THUMP', 'RESONANCE']
  },
  {
    name: 'Vocal Refiner',
    role: 'Lyrical Clarity & Silk',
    description: 'Neural filtering for vocal layers. Ensures every lyric cuts through the mix with crystalline precision.',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'cyan',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    rarity: 'HOLO',
    power: 99,
    skills: ['AI-VOICE', 'SILK', 'BREATH']
  },
  {
    name: 'Techno Weaver',
    role: 'Rhythmic Complexity',
    description: 'Weaves intricate polyrhythms and high-energy percussion loops into the existing sonic fabric.',
    icon: <Zap className="w-5 h-5" />,
    color: 'emerald',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    rarity: 'RARE',
    power: 82,
    skills: ['POLY-SHIFT', 'TICK', 'DRIVE']
  },
  {
    name: 'Ambient Soul',
    role: 'Atmospheric Texture',
    description: 'Generates procedural pads and evolving soundscapes to fill the negative space in minimal mixes.',
    icon: <Activity className="w-5 h-5" />,
    color: 'purple',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    rarity: 'COMMON',
    power: 65,
    skills: ['PAD-GEN', 'REVERB']
  },
  {
    name: 'Sync Master',
    role: 'Temporal Alignment',
    description: 'Ensures absolute phase coherence and BPM alignment across all neural layers.',
    icon: <Shield className="w-5 h-5" />,
    color: 'blue',
    accent: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    rarity: 'RARE',
    power: 88,
    skills: ['PHASE-LOCK', 'SYNC']
  },
  {
    name: 'Melody Scaper',
    role: 'Harmonic Intelligence',
    description: 'Analyzes key signatures and suggests melodic counters to the primary lead instrument.',
    icon: <Music className="w-5 h-5" />,
    color: 'pink',
    accent: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    rarity: 'LEGENDARY',
    power: 91,
    skills: ['HARM-SCAN', 'SCALE-LOCK']
  }
];

export const AgentShowcase = () => {
  return (
    <div className="p-4 sm:p-8 flex flex-col gap-10">
      <div>
        <div className="flex items-center gap-2 mb-3">
           <Bot className="w-5 h-5 text-vdj-neon-cyan glow-cyan" />
           <h2 className="vdj-eyebrow text-vdj-neon-cyan glow-cyan">Neural · Entourage · V3.4</h2>
        </div>
        <h1 className="vdj-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-[0.06em]">AI DJ PERSONAS</h1>
        <p className="text-vdj-text-muted mt-4 max-w-2xl font-sans text-sm leading-relaxed bg-slate-50 dark:bg-vdj-surface/40 p-4 rounded-xl border border-slate-200 dark:border-vdj-border">
          Collect and deploy specialized digital entities. Each persona ships with unique neural weights, a rarity grade, and a curated skill set.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {AGENTS_LIST.map((agent, i) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -10 }}
            className={`glass group relative overflow-hidden rounded-[2.5rem] p-8 border transition-all duration-700 shadow-2xl ${
              agent.border
            } ${
              agent.bg
            } hover:bg-slate-100 dark:hover:bg-white/10 dark:shadow-none`}
          >
            {/* Holographic Sheen (HOLO Only) */}
            {agent.rarity === 'HOLO' && (
              <motion.div 
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 z-20 pointer-events-none"
              />
            )}

            {/* Rarity Tag */}
            <div className={`absolute top-8 right-8 px-3 py-1 rounded-full text-[8px] font-mono font-black tracking-widest border ${
               agent.rarity === 'HOLO' ? 'bg-white text-black border-white shadow-[0_0_20px_white]' : 
               agent.rarity === 'LEGENDARY' ? 'bg-jarvis-accent-pink/20 text-jarvis-accent-pink border-jarvis-accent-pink/40' :
               'bg-black/60 text-slate-400 border-white/10'
            }`}>
               {agent.rarity}
            </div>

            {/* Image Background */}
            <div className="absolute top-0 right-0 w-48 h-48 opacity-10 filter grayscale group-hover:grayscale-0 group-hover:opacity-30 group-hover:scale-110 transition-all duration-1000 pointer-events-none">
               <img 
                 src={getAgentImage(agent.name)} 
                 alt={agent.name} 
                 className="w-full h-full object-cover"
                 referrerPolicy="no-referrer"
               />
            </div>

            <div className={`w-14 h-14 rounded-2xl ${agent.bg} flex items-center justify-center mb-8 border ${agent.border} ${agent.accent} shadow-inner`}>
               {React.cloneElement(agent.icon as any, { className: "w-7 h-7" })}
            </div>

            <div className="relative z-10 space-y-4">
               <div>
                 <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white group-hover:text-jarvis-accent-cyan transition-colors">{agent.name}</h3>
                 <p className={`text-[9px] font-mono uppercase tracking-[0.2em] font-black opacity-60 ${agent.accent}`}>{agent.role}</p>
               </div>
               
               <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed line-clamp-2 italic">
                 "{agent.description}"
               </p>

               {/* Skills Tag Cloud */}
               <div className="flex flex-wrap gap-2 py-4">
                  {agent.skills.map(skill => (
                    <span key={skill} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[7px] font-mono font-black text-slate-500 uppercase tracking-tighter group-hover:border-white/10 group-hover:text-slate-300 transition-colors">
                       {skill}
                    </span>
                  ))}
               </div>
            </div>

            {/* Power Level Meter */}
            <div className="mt-4 space-y-2">
               <div className="flex justify-between items-end">
                  <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase font-black">Sync Potential</span>
                  <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{agent.power}%</span>
               </div>
               <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden transition-colors">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${agent.power}%` }}
                    className={`h-full ${agent.rarity === 'HOLO' ? 'bg-white' : agent.accent.replace('text', 'bg')}`}
                  />
               </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[7px] font-mono text-slate-600 uppercase">MODEL ENGINE</span>
                  <span className="text-[9px] font-mono text-slate-400 font-black">NEURAL-MIXER-X2</span>
               </div>
               <button className={`px-5 py-2.5 rounded-2xl text-[10px] font-mono font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                 agent.rarity === 'HOLO' ? 'bg-white text-black hover:bg-slate-200' :
                 `bg-black/60 border border-white/10 text-white hover:border-${agent.color}-500/50 hover:text-${agent.accent.replace('text-', '')}`
               }`}>
                 DEPLOY AGENT
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { motion } from "motion/react";
import { 
  Mic, 
  MicOff, 
  RefreshCw, 
  Infinity as InfinityIcon, 
  Activity, 
  Lock, 
  Unlock,
  Volume2,
  Zap,
  Sliders
} from "lucide-react";
import { AudioKnob3D } from './AudioKnob3D';

export const ControlDeck = () => {
  const [voiceActive, setVoiceActive] = useState(false);
  const [syncLock, setSyncLock] = useState(true);
  const [autoLoop, setAutoLoop] = useState(false);
  const [knobValues, setKnobValues] = useState({ low: 30, mid: 65, high: 45, master: 80 });

  const ControlToggle = ({ 
    label, 
    active, 
    onClick, 
    iconActive: IconActive, 
    iconInactive: IconInactive,
    color = "cyan" 
  }: any) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl glass transition-all border-2 flex-1 ${
        active 
          ? color === "cyan" ? "border-jarvis-accent-cyan bg-jarvis-accent-cyan/10" : "border-jarvis-accent-pink bg-jarvis-accent-pink/10"
          : "border-slate-200 dark:border-jarvis-border/30 bg-slate-50 dark:bg-slate-900/40 opacity-60 hover:opacity-100 hover:border-jarvis-border"
      }`}
    >
      <div className={`p-2 rounded-lg ${active ? color === "cyan" ? "text-jarvis-accent-cyan" : "text-jarvis-accent-pink" : "text-slate-400 dark:text-slate-500"}`}>
        {active ? <IconActive className="w-5 h-5" /> : <IconInactive className="w-5 h-5" />}
      </div>
      <span className={`text-[9px] font-display font-bold uppercase tracking-widest leading-none ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
        {label}
      </span>
      <div className={`w-full h-1 rounded-full ${active ? color === "cyan" ? "bg-jarvis-accent-cyan" : "bg-jarvis-accent-pink" : "bg-slate-200 dark:bg-slate-800"}`} />
    </button>
  );

  return (
    <div className="flex flex-col gap-6 p-6 glass rounded-3xl shadow-2xl relative overflow-hidden transition-colors bg-white dark:bg-jarvis-card border-slate-200 dark:border-jarvis-border/40">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-jarvis-accent-cyan/20 to-transparent" />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-jarvis-accent-cyan" />
          <h2 className="text-sm font-display font-black uppercase tracking-[0.3em] text-slate-800 dark:text-white">Precision Console</h2>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_var(--color-emerald-500)]" />
             MASTER-LINK
           </div>
        </div>
      </div>

      {/* 3D Audio Knobs Row */}
      <div className="grid grid-cols-4 gap-4 py-4 border-y bg-slate-400/5 -mx-6 px-6 transition-colors border-slate-100 dark:border-white/5">
        <AudioKnob3D label="Low" value={knobValues.low} />
        <AudioKnob3D label="Mid" value={knobValues.mid} />
        <AudioKnob3D label="High" value={knobValues.high} />
        <AudioKnob3D label="Master" value={knobValues.master} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ControlToggle 
          label="Voice" 
          active={voiceActive} 
          onClick={() => setVoiceActive(!voiceActive)}
          iconActive={Mic}
          iconInactive={MicOff}
          color="pink"
        />
        <ControlToggle 
          label="Sync" 
          active={syncLock} 
          onClick={() => setSyncLock(!syncLock)}
          iconActive={Lock}
          iconInactive={Unlock}
        />
        <ControlToggle 
          label="Loop" 
          active={autoLoop} 
          onClick={() => setAutoLoop(!autoLoop)}
          iconActive={InfinityIcon}
          iconInactive={RefreshCw}
        />
        <ControlToggle 
          label="Auto FX" 
          active={true} 
          onClick={() => {}}
          iconActive={Activity}
          iconInactive={Activity}
        />
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 flex flex-col gap-4 transition-colors">
         <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden group">
               <motion.div 
                 initial={{ width: "0%" }}
                 animate={{ width: "75%" }}
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-jarvis-accent-cyan/50 to-jarvis-accent-cyan shadow-[0_0_15px_var(--color-jarvis-accent-cyan)] transition-all" 
               />
            </div>
         </div>
      </div>
    </div>
  );
};

import { motion } from "motion/react";
import { Play, Pause, FastForward, Rewind, Music, Bot, Heart } from "lucide-react";

export interface TrackData {
  id: string;
  title: string;
  artist: string;
  agentLabel: string;
  duration: string;
  isPlaying: boolean;
  color: string;
  liked?: boolean;
  audioUrl?: string;
  previewUrl?: string;
}

interface TrackLayerProps {
  title: string;
  track?: TrackData;
  onPlayToggle?: () => void;
  currentTime?: number;
  totalSeconds?: number;
}

const formatTime = (sec: number) => {
  if (!isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m.toString().padStart(2, '0')}:${s}`;
};

export const TrackLayer = ({ title, track, onPlayToggle, currentTime = 0, totalSeconds = 0 }: TrackLayerProps) => {
  const hasRealTime = totalSeconds > 0;
  const progressPct = hasRealTime ? Math.min(100, (currentTime / totalSeconds) * 100) : 0;
  return (
    <div className="flex flex-col gap-2 p-4 glass rounded-xl bg-jarvis-card relative overflow-hidden group">
      {/* Background visualizer simulation */}
      <div className="absolute inset-0 opacity-10 flex items-end overflow-hidden pb-2 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-jarvis-accent-cyan mx-[1px] rounded-t-sm"
            animate={{ height: track?.isPlaying ? [10, 40, 20, 60, 30] : [10, 15, 12] }}
            transition={{ 
              duration: 1 + Math.random(), 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 0.05
            }}
          />
        ))}
      </div>

      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-jarvis-accent-cyan animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-jarvis-accent-cyan">
            {title}
          </span>
          {track?.liked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-jarvis-accent-pink"
            >
              <Heart className="w-3 h-3 fill-current shadow-[0_0_10px_rgba(255,0,255,0.5)]" />
            </motion.div>
          )}
        </div>
        {track && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-jarvis-accent-pink/20 border border-jarvis-accent-pink/30">
            <Bot className="w-3 h-3 text-jarvis-accent-pink" />
            <span className="vdj-mono text-[9px] font-bold text-jarvis-accent-pink uppercase tracking-[0.2em]">
              {track.agentLabel}
            </span>
          </div>
        )}
      </div>

      {track ? (
        <div className="flex items-center justify-between gap-4 mt-2 relative z-10">
          <div className="flex flex-col">
            <h3 className="text-lg font-display font-bold text-white truncate max-w-[200px] glow-cyan">
              {track.title}
            </h3>
            <p className="text-xs font-mono text-slate-400 truncate tracking-wide">
              {track.artist}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <Rewind className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={onPlayToggle}
              className="w-12 h-12 rounded-full glass bg-jarvis-accent-cyan/20 border-jarvis-accent-cyan/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-jarvis-accent-cyan shadow-[0_0_15px_rgba(0,242,255,0.3)]"
            >
              {track.isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <FastForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-6 text-slate-600 italic font-mono text-sm uppercase tracking-widest">
          No track loaded
        </div>
      )}

      <div className="flex items-center gap-2 mt-2 relative z-10">
        <span className="text-[9px] font-mono opacity-50">{hasRealTime ? formatTime(currentTime) : '00:00'}</span>
        <div className="flex-1 h-1 bg-slate-800 rounded-full relative overflow-hidden">
          {hasRealTime ? (
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-jarvis-accent-cyan to-jarvis-accent-pink transition-[width] duration-200 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          ) : (
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-jarvis-accent-cyan to-jarvis-accent-pink"
              animate={{ width: track?.isPlaying ? '100%' : '40%' }}
              transition={{ duration: track?.isPlaying ? 120 : 0.5, ease: 'linear' }}
            />
          )}
        </div>
        <span className="text-[9px] font-mono opacity-50">
          {hasRealTime ? formatTime(totalSeconds) : track?.duration || '00:00'}
        </span>
      </div>
    </div>
  );
};

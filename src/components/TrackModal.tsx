import { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, Calendar, Music, Bot, Globe } from "lucide-react";
import { TrackRecommendation } from "../services/musicService";

interface TrackModalProps {
  track: TrackRecommendation | null;
  onClose: () => void;
  onAdd: (track: TrackRecommendation, notes: string) => void;
}

export const TrackModal = ({ track, onClose, onAdd }: TrackModalProps) => {
  if (!track) return null;

  const [notes, setNotes] = useState(track.notes || "");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-jarvis-bg/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg glass bg-jarvis-card rounded-3xl overflow-hidden border-jarvis-accent-cyan/20 relative"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="mb-6 relative h-48 rounded-2xl overflow-hidden group">
            {track.imageUrl ? (
              <img src={track.imageUrl} alt={track.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center border border-jarvis-border/50">
                <Music className="w-12 h-12 text-slate-800 animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-jarvis-card via-jarvis-card/20 to-transparent" />
            
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-jarvis-accent-pink" />
              <span className="text-[10px] font-mono font-bold text-jarvis-accent-pink uppercase tracking-widest bg-jarvis-accent-pink/10 px-2 py-0.5 rounded border border-jarvis-accent-pink/20 backdrop-blur-sm">
                Agent: {track.agentLabel}
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-1 glow-cyan">
            {track.title}
          </h2>
          <p className="text-lg font-mono text-slate-400 mb-8">{track.artist}</p>

          <div className="grid grid-cols-2 gap-6 mb-8 border-y border-jarvis-border/50 py-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Music className="w-3 h-3" /> Genre
              </span>
              <span className="text-sm font-semibold text-jarvis-accent-cyan">{track.genre}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Release Date
              </span>
              <span className="text-sm font-semibold text-white">{track.releaseDate}</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2 block">Curation Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add thoughts for the mix..."
              className="w-full bg-slate-900/50 border border-jarvis-border rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-jarvis-accent-cyan min-h-[100px] resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {track.tags?.map(tag => (
              <span key={tag} className="text-[10px] font-mono text-slate-400 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                #{tag}
              </span>
            ))}
          </div>

          {track.sources && track.sources.length > 0 && (
            <div className="mb-8">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Web Sources
              </span>
              <div className="flex flex-col gap-1.5">
                {track.sources.slice(0, 5).map(s => (
                  <a
                    key={s.uri}
                    href={s.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-jarvis-accent-cyan/80 hover:text-jarvis-accent-cyan truncate flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <a 
              href={track.previewUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-900 border border-jarvis-border text-white font-display font-bold text-sm tracking-widest hover:bg-slate-800 transition-all border-jarvis-accent-cyan/10"
            >
              PREVIEW <ExternalLink className="w-4 h-4" />
            </a>
            <button 
              onClick={() => {
                onAdd(track, notes);
                onClose();
              }}
              className="flex-1 py-4 rounded-xl bg-jarvis-accent-cyan text-jarvis-bg font-display font-bold text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)]"
            >
              ADD TO MIX
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

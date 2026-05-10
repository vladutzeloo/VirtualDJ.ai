import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Heart, Share2, Play, Plus, Sparkles, MessageSquare } from 'lucide-react';

interface TrendingTrack {
  id: string;
  title: string;
  artist: string;
  resonance: number; // 0-100 representation of AI/Personal match
  engagement: string; // e.g. "2.4k listeners"
  tags: string[];
  imageUrl?: string;
  friendActivty?: string;
  type?: 'track' | 'artist';
}

const TRENDING_MOCK: TrendingTrack[] = [
  {
    id: 't1',
    title: 'Holographic Dreams',
    artist: 'Neural Phase',
    resonance: 98,
    engagement: '12.8k users',
    tags: ['Cyberpunk', 'Hyper-Bass'],
    friendActivty: 'Liked by Jules + 4 others'
  },
  {
    id: 'a1',
    title: 'Recommended Artist',
    artist: 'CYBER-SOUL',
    resonance: 95,
    engagement: '45k monthly',
    tags: ['Soul', 'Glitch'],
    friendActivty: 'Similar to your top tracks',
    type: 'artist'
  },
  {
    id: 't2',
    title: 'Silicon Whisper',
    artist: 'Delta Stream',
    resonance: 84,
    engagement: '5.2k users',
    tags: ['Ambient', 'Ethical AI'],
    friendActivty: 'Saved by 2 Friends'
  },
  {
    id: 'a2',
    title: 'Rising Artist',
    artist: 'KINETIC.D',
    resonance: 88,
    engagement: '12k monthly',
    tags: ['Drill', 'AI-Fusion'],
    friendActivty: 'Trending in Japan',
    type: 'artist'
  },
  {
    id: 't3',
    title: 'Circuit Breaker',
    artist: 'Voltage 7',
    resonance: 72,
    engagement: '8.1k users',
    tags: ['Techno', 'Industrial'],
    friendActivty: 'Trending in your city'
  }
];

export const SocialPickups = ({ onAdd }: { onAdd: (track: any) => void }) => {
  return (
    <div className="flex flex-col gap-8 p-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-jarvis-accent-pink" />
          <span className="text-[10px] font-mono font-black text-jarvis-accent-pink tracking-[0.4em] uppercase">Neural Signal</span>
        </div>
        <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">DISCOVERY & SIGNALS</h1>
        <p className="text-slate-500 font-mono text-xs max-w-md uppercase tracking-tighter">
          Socially resonant tracks and artists filtered by your acoustic fingerprint.
        </p>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-4">
        {TRENDING_MOCK.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass group relative flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer ${
              track.type === 'artist' ? 'bg-jarvis-accent-cyan/5 border-jarvis-accent-cyan/20' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
            } hover:bg-slate-100 dark:hover:bg-white/10 hover:border-jarvis-accent-cyan/30`}
          >
            {/* Visual/Artwork Placeholder */}
            <div className={`w-16 h-16 bg-slate-800 flex-shrink-0 relative overflow-hidden ${track.type === 'artist' ? 'rounded-full' : 'rounded-xl'}`}>
               <div className={`absolute inset-0 bg-gradient-to-br ${track.type === 'artist' ? 'from-jarvis-accent-pink/20 to-jarvis-accent-cyan/20' : 'from-jarvis-accent-cyan/20 to-jarvis-accent-pink/20'}`} />
               <div className="absolute inset-0 flex items-center justify-center">
                  {track.type === 'artist' ? (
                    <Users className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                  ) : (
                    <Play className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                  )}
               </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-slate-900 dark:text-white font-bold truncate">{track.artist}</h3>
                  <div className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                    track.type === 'artist' ? 'bg-jarvis-accent-pink/20 text-jarvis-accent-pink' : 'bg-jarvis-accent-cyan/20 text-jarvis-accent-cyan'
                  }`}>
                     {track.resonance}% {track.type === 'artist' ? 'AFFINITY' : 'MATCH'}
                  </div>
               </div>
               <p className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest mb-2">
                 {track.type === 'artist' ? 'Artist Profile' : track.title}
               </p>
               
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                     <Users className="w-3 h-3" /> {track.engagement}
                  </div>
                  {track.friendActivty && (
                    <div className="flex items-center gap-1 text-[9px] font-mono text-jarvis-accent-pink">
                       <MessageSquare className="w-3 h-3" /> {track.friendActivty}
                    </div>
                  )}
               </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
               {track.type === 'artist' ? (
                 <button 
                  onClick={(e) => { e.stopPropagation(); }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-mono font-black uppercase tracking-widest hover:bg-black transition-colors"
                 >
                   Follow
                 </button>
               ) : (
                 <>
                   <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-3 rounded-full hover:bg-white/5 text-slate-500 hover:text-jarvis-accent-pink transition-colors"
                   >
                      <Heart className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onAdd(track); }}
                    className="w-10 h-10 rounded-xl bg-jarvis-accent-cyan/20 border border-jarvis-accent-cyan/40 flex items-center justify-center text-jarvis-accent-cyan hover:bg-jarvis-accent-cyan hover:text-jarvis-bg transition-all active:scale-90"
                   >
                      <Plus className="w-5 h-5" />
                   </button>
                 </>
               )}
            </div>

            {/* Resonance Progress Line */}
            <div className="absolute bottom-0 left-0 h-[2px] bg-jarvis-accent-cyan/30" style={{ width: `${track.resonance}%` }} />
          </motion.div>
        ))}
      </div>

      {/* Social Stats Sidebar/Footer */}
      <div className="grid grid-cols-2 gap-4">
         <div className="p-6 rounded-3xl flex flex-col gap-1 transition-colors bg-jarvis-accent-pink/5 border border-jarvis-accent-pink/10 dark:border-jarvis-accent-pink/20">
            <span className="text-[10px] font-mono font-black text-jarvis-accent-pink tracking-widest uppercase">Global Echo</span>
            <span className="text-2xl font-display font-black text-slate-900 dark:text-white">+1,204</span>
            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">New Neural Connections</span>
         </div>
         <div className="p-6 rounded-3xl flex flex-col gap-1 transition-colors bg-jarvis-accent-cyan/5 border border-jarvis-accent-cyan/10 dark:border-jarvis-accent-cyan/20">
            <span className="text-[10px] font-mono font-black text-jarvis-accent-cyan tracking-widest uppercase">Personal Fit</span>
            <span className="text-2xl font-display font-black text-slate-900 dark:text-white">Legendary</span>
            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">Selection Quality</span>
         </div>
      </div>
    </div>
  );
};

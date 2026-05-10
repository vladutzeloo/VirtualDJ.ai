import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Disc, ChevronLeft, ChevronRight, Play, Plus, Sparkles, Filter } from 'lucide-react';

interface Suggestion {
  track: string;
  artist: string;
  reason: string;
  genre: string;
}

interface RecordPickerProps {
  suggestions: Suggestion[];
  onAdd: (track: string, artist: string) => void;
  isLoading: boolean;
}

export const RecordPicker = ({ suggestions, onAdd, isLoading }: RecordPickerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % suggestions.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-2 border-dashed border-jarvis-accent-cyan rounded-full flex items-center justify-center"
        >
          <Disc className="w-8 h-8 text-jarvis-accent-cyan" />
        </motion.div>
        <p className="text-[10px] font-mono font-bold tracking-[0.4em] text-jarvis-accent-cyan animate-pulse">
          AI AGENT: FETCHING VINYL...
        </p>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  const current = suggestions[currentIndex];

  return (
    <div className="flex flex-col gap-8 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-jarvis-accent-cyan/5 blur-3xl rounded-full" />
      
      {/* Title Area */}
      <div className="flex items-center justify-between px-2">
         <div className="flex flex-col">
            <span className="text-[8px] font-mono font-bold text-jarvis-accent-cyan tracking-[0.3em] uppercase">Neural Crate</span>
            <h3 className="text-white font-display text-lg font-black tracking-tight">AI RECORD PICKER</h3>
         </div>
         <button className="w-10 h-10 rounded-full glass bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <Filter className="w-4 h-4" />
         </button>
      </div>

      {/* 3D-ish Record Carousel */}
      <div className="relative flex items-center justify-center py-12 perspective-[1000px]">
         <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ rotateY: -45, opacity: 0, x: -100 }}
              animate={{ rotateY: 0, opacity: 1, x: 0 }}
              exit={{ rotateY: 45, opacity: 0, x: 100 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-64 h-64 flex flex-col group cursor-grab active:cursor-grabbing"
              style={{ transformStyle: 'preserve-3d' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) prev();
                else if (info.offset.x < -100) next();
              }}
            >
               {/* Record Sleeve */}
               <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-2xl overflow-hidden border border-white/5 flex flex-col p-6 z-20">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                     <Disc className="w-8 h-8 text-white/40" />
                  </div>
                  <div className="mt-auto">
                     <h4 className="text-white font-display text-xl font-black leading-tight mb-1">{current.track}</h4>
                     <p className="text-jarvis-accent-cyan font-mono text-[10px] uppercase font-bold tracking-widest">{current.artist}</p>
                  </div>
                  
                  {/* Genre Tag */}
                  <div className="absolute top-6 right-6 px-2 py-1 bg-jarvis-accent-pink/20 border border-jarvis-accent-pink/30 rounded text-[8px] font-mono font-black text-jarvis-accent-pink">
                    {current.genre}
                  </div>
               </div>

               {/* Virtual Vinyl Peak-a-boo */}
               <motion.div 
                 animate={{ x: 80, rotate: 360 }}
                 transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" } }}
                 className="absolute top-4 bottom-4 right-0 w-56 bg-vdj-bg rounded-full shadow-lg border border-vdj-border z-10 flex items-center justify-center"
               >
                  <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center bg-slate-800">
                     <div className="w-2 h-2 rounded-full bg-white/20" />
                  </div>
                  {/* Grooves */}
                  <div className="absolute inset-2 rounded-full border border-white/5" />
                  <div className="absolute inset-4 rounded-full border border-white/5" />
                  <div className="absolute inset-6 rounded-full border border-white/5" />
               </motion.div>
            </motion.div>
         </AnimatePresence>

         {/* Navigation Buttons */}
         <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none px-4">
            <button 
              onClick={prev}
              className="w-12 h-12 rounded-full glass bg-white/5 border border-white/10 text-white pointer-events-auto flex items-center justify-center active:scale-90 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={next}
              className="w-12 h-12 rounded-full glass bg-white/5 border border-white/10 text-white pointer-events-auto flex items-center justify-center active:scale-90 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
         </div>
      </div>

      {/* Crate Info */}
      <div className="flex flex-col items-center text-center gap-4 px-6">
         <div className="bg-white/5 rounded-2xl p-4 border border-white/10 w-full">
            <p className="text-slate-400 text-xs italic font-serif leading-relaxed line-clamp-2">
               "{current.reason}"
            </p>
         </div>

         <div className="flex gap-4 w-full">
            <button 
              onClick={() => onAdd(current.track, current.artist)}
              className="flex-1 py-4.5 rounded-[1.5rem] bg-jarvis-accent-cyan text-jarvis-bg font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,242,255,0.3)] active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> ADD TO DECK
            </button>
         </div>
      </div>

      {/* AI Intelligence Badge */}
      <div className="flex items-center justify-center gap-2 opacity-40">
         <Sparkles className="w-3 h-3 text-jarvis-accent-pink" />
         <span className="text-[8px] font-mono font-bold tracking-[0.3em] uppercase text-white">AI PICK ENGINE V2</span>
      </div>
    </div>
  );
};

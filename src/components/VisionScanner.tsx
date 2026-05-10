import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import {
  recognizeFromVideo,
  mapGestureToAction,
} from '../services/gestureService';

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please provide it in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

interface VisionScannerProps {
  onScanResult: (context: string) => void;
  onGesture?: (gesture: string) => void;
  onClose: () => void;
}

export const VisionScanner = ({ onScanResult, onGesture, onClose }: VisionScannerProps) => {
  const webcamRef = useRef<Webcam>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [gestureMode, setGestureMode] = useState(false);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    setScanning(true);

    try {
      if (gestureMode) {
        const video = webcamRef.current.video as HTMLVideoElement | null;
        if (!video) throw new Error('Webcam video element unavailable');
        const detections = await recognizeFromVideo(video);
        const top = detections
          .filter((d) => d.category && d.category !== 'None')
          .sort((a, b) => b.score - a.score)[0];

        if (top) {
          const action = mapGestureToAction(top.category) ?? top.category;
          onGesture?.(action);
          setResult(
            `GESTURE: ${action.toUpperCase()} (${Math.round(top.score * 100)}%)`,
          );
        } else {
          setResult('NO GESTURE DETECTED');
        }
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error('Could not capture image');

      const base64Data = imageSrc.split(',')[1];
      const ai = getAI();

      const prompt =
        'Analyze this image. What is the setting? (e.g., Gym, Office, Party, Nature). Suggest a music genre and 3 mood tags for this environment. Format: Setting | Genre | tag1, tag2, tag3';

      const generation = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg',
              },
            },
          ],
        },
      });

      const text = generation.text?.trim();
      if (text) {
        setResult(text);
        onScanResult(text);
      }
    } catch (error) {
      console.error('Vision Analysis Error:', error);
      setResult('ERROR: Neural link failed. Manual override required.');
    } finally {
      setScanning(false);
    }
  }, [webcamRef, onScanResult, gestureMode, onGesture]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vdj-bg/85 backdrop-blur-md"
    >
      <div className="w-full max-w-xl aspect-square bg-jarvis-card border border-jarvis-border rounded-3xl overflow-hidden relative shadow-2xl">
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
           <div className="flex gap-2">
             <button 
               onClick={() => { setGestureMode(false); setResult(null); }}
               className={`px-5 py-2.5 rounded-full text-[11px] font-mono font-black tracking-[0.2em] border transition-all shadow-lg active:scale-95 ${!gestureMode ? 'bg-jarvis-accent-cyan border-jarvis-accent-cyan text-jarvis-bg' : 'bg-vdj-surface-2/70 border-vdj-border text-white backdrop-blur-md'}`}
             >
               ENVIRONMENT.SCAN()
             </button>
             <button 
               onClick={() => { setGestureMode(true); setResult(null); }}
               className={`px-5 py-2.5 rounded-full text-[11px] font-mono font-black tracking-[0.2em] border transition-all shadow-lg active:scale-95 ${gestureMode ? 'bg-jarvis-accent-pink border-jarvis-accent-pink text-white' : 'bg-vdj-surface-2/70 border-vdj-border text-white backdrop-blur-md'}`}
             >
               GESTURE.LINK()
             </button>
           </div>
           
           <div className="flex flex-col gap-1 px-3 py-2 bg-vdj-surface/50 backdrop-blur-sm border-l-2 border-jarvis-accent-cyan/50 rounded-r-lg">
              <span className="text-[8px] font-mono text-slate-400">LATENCY: <span className="text-jarvis-accent-cyan">18MS</span></span>
              <span className="text-[8px] font-mono text-slate-400">MODEL: <span className="text-jarvis-accent-pink">{gestureMode ? 'MEDIAPIPE-HAND-V1' : 'GEMINI-SCAN-V3'}</span></span>
           </div>
        </div>
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-vdj-surface-2/70 border border-vdj-border flex items-center justify-center text-white hover:bg-vdj-elevated/60 transition-all backdrop-blur-md active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="absolute inset-0 grayscale contrast-125 brightness-90">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{ facingMode: "environment" }}
          />
        </div>

        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-10 left-10 w-12 h-12 border-t-2 border-l-2 border-jarvis-accent-cyan/60 rounded-tl-xl" />
           <div className="absolute top-10 right-10 w-12 h-12 border-t-2 border-r-2 border-jarvis-accent-cyan/60 rounded-tr-xl" />
           <div className="absolute bottom-10 left-10 w-12 h-12 border-b-2 border-l-2 border-jarvis-accent-cyan/60 rounded-bl-xl" />
           <div className="absolute bottom-10 right-10 w-12 h-12 border-b-2 border-r-2 border-jarvis-accent-cyan/60 rounded-br-xl" />

           <motion.div 
             animate={{ top: ['10%', '90%', '10%'] }}
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
             className={`absolute left-10 right-10 h-[2px] z-10 opacity-50 ${gestureMode ? 'bg-jarvis-accent-pink shadow-[0_0_15px_rgba(255,0,255,0.8)]' : 'bg-jarvis-accent-cyan shadow-[0_0_15px_rgba(0,242,255,0.8)]'}`}
           />

           <div className="w-full h-full border border-jarvis-accent-cyan/30 flex items-center justify-center">
              {gestureMode ? (
                <div className="relative">
                  <div className="w-56 h-56 border-2 border-dashed border-jarvis-accent-pink/40 rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border border-jarvis-accent-pink/20 rounded-full animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="w-2/3 h-2/3 border border-dashed border-jarvis-accent-cyan/20 grid grid-cols-3 grid-rows-3">
                   {Array.from({ length: 9 }).map((_, i) => (
                     <div key={i} className="border border-white/5" />
                   ))}
                </div>
              )}
           </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-10 pt-20 bg-gradient-to-t from-black via-black/90 to-transparent">
           {result ? (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col gap-6 text-center w-full"
             >
                <div className="space-y-1">
                  <p className={`font-mono text-[10px] font-black tracking-[0.3em] uppercase italic ${gestureMode ? 'text-jarvis-accent-pink' : 'text-jarvis-accent-cyan'}`}>
                    {gestureMode ? 'Neural Gesture Received' : 'Environment Synced'}
                  </p>
                  <h3 className="text-white font-display text-2xl font-black tracking-tight">{result}</h3>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setResult(null)}
                    className="flex-1 py-4.5 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> RETRY
                  </button>
                  {!gestureMode && (
                    <button 
                      onClick={() => { onScanResult(result); onClose(); }}
                      className="flex-1 py-4.5 rounded-2xl bg-jarvis-accent-cyan text-jarvis-bg font-display font-black text-[10px] uppercase tracking-widest shadow-[0_0_30px_rgba(0,242,255,0.4)] active:scale-95 transition-all"
                    >
                      APPLY MIX
                    </button>
                  )}
                </div>
             </motion.div>
           ) : (
             <button 
               onClick={capture}
               disabled={scanning}
               className="mx-auto flex flex-col items-center gap-4 group"
             >
                <div className={`w-28 h-28 rounded-full border-2 border-vdj-border-strong flex items-center justify-center transition-all bg-vdj-surface/50 backdrop-blur-md relative ${scanning ? 'scale-90' : 'group-hover:scale-105 group-active:scale-95'}`}>
                   <div className={`absolute -inset-1 rounded-full border border-dashed animate-[spin_6s_linear_infinite] opacity-40 ${gestureMode ? 'border-jarvis-accent-pink' : 'border-jarvis-accent-cyan'}`} />
                   
                   <div className={`w-20 h-20 rounded-full flex items-center justify-center text-black shadow-lg ${gestureMode ? 'bg-jarvis-accent-pink shadow-[0_0_20px_rgba(255,0,255,0.4)]' : 'bg-jarvis-accent-cyan shadow-[0_0_20px_rgba(0,242,255,0.4)]'}`}>
                      <Sparkles className={`w-10 h-10 ${scanning ? 'animate-spin' : ''}`} />
                   </div>
                </div>
                <span className="text-white font-mono font-black uppercase tracking-[0.4em] text-[10px] drop-shadow-md">
                  {scanning ? 'PROCESING...' : gestureMode ? 'DETECT GESTURE' : 'SYNC ENVIRONMENT'}
                </span>
             </button>
           )}
        </div>
      </div>
    </motion.div>
  );
};

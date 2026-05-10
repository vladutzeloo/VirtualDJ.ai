import { ReactNode } from 'react';
import { motion } from "motion/react";
import { Battery, Wifi, Signal } from "lucide-react";

interface PhoneFrameProps {
  children: ReactNode;
}

export const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <div className="relative w-[340px] h-[680px] bg-black rounded-[50px] border-[8px] border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-[100] flex items-center justify-center gap-2">
         <div className="w-12 h-1 bg-slate-900 rounded-full" />
         <div className="w-2 h-2 rounded-full bg-slate-900" />
      </div>

      {/* Status Bar */}
      <div className="absolute top-0 inset-x-0 h-10 flex items-center justify-between px-8 z-[90] text-white">
        <span className="text-[10px] font-bold">9:41</span>
        <div className="flex items-center gap-1.5">
           <Signal className="w-3 h-3" />
           <Wifi className="w-3 h-3" />
           <Battery className="w-3 h-3" />
        </div>
      </div>

      {/* Screen Content */}
      <div className="w-full h-full bg-jarvis-bg overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scale-[0.85] origin-top h-[117%] w-[117%] -translate-x-[8%] -translate-y-[2%]">
          {children}
        </div>
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bgColor-white/20 rounded-full z-[100]" />
    </div>
  );
};


import React from 'react';
import { useAssistant } from '../context/AssistantContext';
import { X, MessageSquare } from 'lucide-react';

export const AssistantUI = () => {
  const { message, isVisible, mood, closeMessage } = useAssistant();

  if (!isVisible || !message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[90] animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md relative">
        {/* Pointer */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-r border-b border-cyan-500/50 rotate-45"></div>
        
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-black overflow-hidden ${
                mood === 'sarcastic' ? 'border-purple-500 shadow-[0_0_15px_#a855f7]' : 
                mood === 'happy' ? 'border-green-500 shadow-[0_0_15px_#22c55e]' : 
                'border-cyan-500 shadow-[0_0_15px_#06b6d4]'
            }`}>
               {/* Animated Eye */}
               <div className={`w-8 h-8 rounded-full bg-current animate-pulse ${
                   mood === 'sarcastic' ? 'text-purple-500' : 'text-cyan-500'
               }`}>
                   <div className="w-full h-1 bg-black/50 absolute top-1/2 -translate-y-1/2"></div>
               </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-black rounded-full px-1.5 py-0.5 border border-slate-700">
                <span className="text-[8px] font-bold text-white font-mono">K.O.R.A.</span>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1">
             <p className="text-sm text-cyan-50 font-medium leading-snug drop-shadow-md">
                 "{message}"
             </p>
          </div>

          <button onClick={closeMessage} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { useMission } from '../context/MissionContext';
import { CheckCircle2, X, Gift, Target, ListTodo, Coins, Leaf, Box, Gem, Ticket } from 'lucide-react';
import { useAnimation } from '../context/AnimationContext';

interface MissionGuideProps {
  onNavigate: (view: string) => void;
}

// Internal component for the reward splash
const RewardSplash = ({ rewards, onComplete, spawnItem }: { rewards: any, onComplete: () => void, spawnItem: (rect: DOMRect, icon: React.ReactNode, color: string) => void }) => {
    const [step, setStep] = useState(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Flatten rewards into an array for rendering
    const rewardList = [];
    if (rewards.credits) rewardList.push({ type: 'credits', val: rewards.credits, icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500' });
    if (rewards.biomass) rewardList.push({ type: 'biomass', val: rewards.biomass, icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500' });
    if (rewards.nanosteel) rewardList.push({ type: 'nanosteel', val: rewards.nanosteel, icon: Box, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500' });
    if (rewards.gems) rewardList.push({ type: 'gems', val: rewards.gems, icon: Gem, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500' });
    if (rewards.items) {
        rewards.items.forEach((item: any) => {
            rewardList.push({ type: 'item', val: item.amount, name: item.id, icon: Ticket, color: 'text-white', bg: 'bg-slate-700', border: 'border-slate-500' });
        });
    }

    useEffect(() => {
        // Sequence: 
        // 0ms: Mount
        // 100ms: Show Backdrop
        // 2000ms: Trigger Fly Animation
        // 2500ms: Complete/Close
        
        const t1 = setTimeout(() => setStep(1), 50);
        
        const t2 = setTimeout(() => {
            // Trigger Fly Animation for all items
            rewardList.forEach((r, i) => {
                const el = itemRefs.current[i];
                if (el) {
                    const rect = el.getBoundingClientRect();
                    // Add staggered delay
                    setTimeout(() => {
                        spawnItem(rect, <r.icon className={`w-8 h-8 ${r.color}`} />, r.color);
                    }, i * 100);
                }
            });
        }, 1800);

        const t3 = setTimeout(() => onComplete(), 2500);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-all duration-300 ${step >= 1 ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}>
            <div className={`flex flex-col items-center gap-4 transition-all duration-500 ${step >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                
                <h2 className="text-3xl font-black text-white uppercase italic tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-bounce">
                    MISSION COMPLETE!
                </h2>

                <div className="flex flex-wrap justify-center gap-4">
                    {rewardList.map((r, i) => (
                        <div 
                            key={i}
                            ref={el => { itemRefs.current[i] = el; }}
                            className={`
                                flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 ${r.bg} ${r.border} backdrop-blur-md shadow-2xl
                                animate-in zoom-in duration-300 fill-mode-both
                            `}
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <r.icon className={`w-8 h-8 ${r.color} mb-1 drop-shadow-md`} />
                            <span className="text-white font-black text-lg drop-shadow-md">+{r.val}</span>
                            <span className="text-[10px] text-slate-300 uppercase font-bold">{r.name || r.type}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const MissionGuide: React.FC<MissionGuideProps> = ({ onNavigate }) => {
  const { currentMission, isCompleted, claimReward, progress, maxProgress } = useMission();
  const { spawnFlyingItem } = useAnimation();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showRewardSplash, setShowRewardSplash] = useState(false);
  const [tempRewards, setTempRewards] = useState<any>(null);

  // Auto-expand when a new mission starts or completes
  useEffect(() => {
      if (currentMission) setIsMinimized(false);
  }, [currentMission?.id, isCompleted]);

  if (!currentMission) {
    return (
        <div className="fixed bottom-[80px] left-4 z-40 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-2xl p-3 shadow-xl max-w-[200px] animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Alle Missionen erfüllt!</span>
            </div>
        </div>
    );
  }

  const handleAction = () => {
    if (isCompleted) {
      // 1. Capture rewards for animation
      setTempRewards(currentMission.rewards);
      setShowRewardSplash(true);
      // 2. Logic happens after animation completes in the callback
    } else {
      // Simple routing based on type
      if (currentMission.type === 'BUILD') onNavigate('station');
      if (currentMission.type === 'RECRUIT') onNavigate('forge');
      if (currentMission.type === 'BATTLE_FLOOR') onNavigate('spire');
    }
  };

  const handleAnimationComplete = () => {
      setShowRewardSplash(false);
      claimReward();
      setTempRewards(null);
  };

  return (
    <>
        {showRewardSplash && tempRewards && (
            <RewardSplash rewards={tempRewards} onComplete={handleAnimationComplete} spawnItem={spawnFlyingItem} />
        )}

        {/* --- MINIMIZED STATE --- */}
        {isMinimized ? (
            <div className="fixed bottom-[80px] left-4 z-40 animate-in fade-in slide-in-from-bottom-4">
                <button 
                    onClick={() => setIsMinimized(false)}
                    className={`
                        w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-2 active:scale-95 transition-all
                        ${isCompleted 
                            ? 'bg-green-600 border-green-400 text-white animate-bounce' 
                            : 'bg-slate-900/90 border-blue-500/30 text-blue-400 backdrop-blur'
                        }
                    `}
                >
                    {isCompleted ? <Gift className="w-6 h-6" /> : <ListTodo className="w-6 h-6" />}
                    {isCompleted && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-ping"></span>
                    )}
                </button>
            </div>
        ) : (
            /* --- EXPANDED STATE --- */
            <div className="fixed bottom-[80px] left-4 z-40 animate-in fade-in slide-in-from-bottom-4 w-[calc(100%-2rem)] max-w-[320px]">
            <div 
                className={`
                relative overflow-hidden rounded-2xl shadow-2xl transition-all border-2
                ${isCompleted 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-green-400' 
                    : 'bg-slate-900/95 backdrop-blur-md border-slate-700'
                }
                `}
            >
                {/* Glow Effect when completed */}
                {isCompleted && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent animate-pulse pointer-events-none"></div>
                )}

                <div className="flex relative z-10">
                    {/* Clickable Area for Navigation */}
                    <div 
                        onClick={handleAction}
                        className="flex-1 p-4 pr-2 cursor-pointer active:opacity-80 transition-opacity"
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0
                                ${isCompleted ? 'bg-white text-green-600' : 'bg-blue-600 text-white'}
                            `}>
                                {isCompleted ? <Gift className="w-3.5 h-3.5" /> : (currentMission.id.match(/\d+/) || ['1'])[0]}
                            </div>
                            <h3 className={`font-black text-xs uppercase tracking-wide ${isCompleted ? 'text-white' : 'text-blue-100'}`}>
                                {isCompleted ? 'BELOHNUNG ABHOLEN!' : 'AKTUELLE MISSION'}
                            </h3>
                        </div>
                        
                        <p className={`text-xs font-bold leading-tight mb-3 ${isCompleted ? 'text-green-100' : 'text-white'}`}>
                            {currentMission.description}
                        </p>

                        {/* Progress Bar */}
                        {!isCompleted && (
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex items-center">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (progress / maxProgress) * 100)}%` }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Close Button Area */}
                    <div className="flex flex-col justify-center pr-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMinimized(true);
                            }}
                            className={`
                                w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-90
                                ${isCompleted ? 'bg-black/20 hover:bg-black/30 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700'}
                            `}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
            </div>
        )}
    </>
  );
};

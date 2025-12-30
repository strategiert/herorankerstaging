
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface LockOnBarProps {
  onFire: (multiplier: number) => void;
  difficulty?: number; // 1-10, affects sweet spot size and speed
  disabled?: boolean;
}

export function LockOnBar({ onFire, difficulty = 1, disabled = false }: LockOnBarProps) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<'CRIT' | 'HIT' | 'MISS' | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Difficulty Config
  // Center is always 50
  
  // Gold Zone (Crit): 2.5x damage
  // Size decreases with difficulty (e.g. 10% to 4%)
  const goldSize = Math.max(4, 12 - difficulty * 0.8);
  
  // Hit Zone (Dark): 1.2x damage
  // Surrounds Gold Zone. E.g. 30% to 15%
  const hitSize = Math.max(15, 35 - difficulty * 2);

  // Speed Logic: Base speed + scaling
  // Speed is units per ms. 0.1 means 100 units in 1000ms (1s).
  const speed = 0.08 + (difficulty * 0.015);

  const directionRef = useRef(1);
  const positionRef = useRef(0);

  const runLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = Math.min(timestamp - lastTimeRef.current, 64); // Cap delta to prevent huge jumps on lag
    lastTimeRef.current = timestamp;

    // Calculate new position
    const move = directionRef.current * speed * delta;
    let newPos = positionRef.current + move;

    // Bounce Logic (Ping Pong)
    if (newPos >= 100) {
      newPos = 100;
      directionRef.current = -1;
    } else if (newPos <= 0) {
      newPos = 0;
      directionRef.current = 1;
    }

    positionRef.current = newPos;
    setCursorPosition(newPos); // Sync to React State for render

    animationRef.current = requestAnimationFrame(runLoop);
  }, [speed]);

  const startAnimation = useCallback(() => {
    if (disabled) return;
    setIsRunning(true);
    setResult(null);
    lastTimeRef.current = 0;
    // Random start direction
    directionRef.current = Math.random() > 0.5 ? 1 : -1;
    animationRef.current = requestAnimationFrame(runLoop);
  }, [runLoop, disabled]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const handleFire = useCallback(() => {
    if (!isRunning || disabled) return;
    
    stopAnimation();
    
    // Check hit based on Ref (most accurate current position)
    const pos = positionRef.current;
    const dist = Math.abs(pos - 50); // Distance from center
    
    let multiplier = 0.5;
    let res: 'CRIT' | 'HIT' | 'MISS' = 'MISS';

    // Zones are half-widths from center
    if (dist <= goldSize / 2) {
        multiplier = 2.5;
        res = 'CRIT';
    } else if (dist <= hitSize / 2) {
        multiplier = 1.2;
        res = 'HIT';
    } else {
        multiplier = 0.5;
        res = 'MISS';
    }

    setResult(res);
    
    // Delay before calling onFire for visual feedback
    setTimeout(() => {
      onFire(multiplier);
      setResult(null);
    }, 800);
  }, [isRunning, goldSize, hitSize, stopAnimation, onFire, disabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full space-y-2">
      {/* Lock-On Bar Container */}
      <div className="relative w-full h-12 bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 shadow-inner group">
        
        {/* Tech Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(90deg, transparent 95%, #3b82f6 95%), linear-gradient(0deg, transparent 95%, #3b82f6 95%)',
            backgroundSize: '10px 10px'
          }}
        />

        {/* 1. HIT ZONE (Dark Blue/Grey) */}
        <div
          className="absolute top-0 bottom-0 z-10 bg-slate-700/50 border-l border-r border-slate-500"
          style={{
            left: `${50 - hitSize / 2}%`,
            width: `${hitSize}%`,
          }}
        />

        {/* 2. GOLD ZONE (Crit) */}
        <div
          className="absolute top-0 bottom-0 z-20 bg-yellow-500/30 border-l-2 border-r-2 border-yellow-400 box-content"
          style={{
            left: `${50 - goldSize / 2}%`,
            width: `${goldSize}%`,
            boxShadow: '0 0 10px rgba(250, 204, 21, 0.5)'
          }}
        >
            {/* Center Line Indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-yellow-200 opacity-70 transform -translate-x-1/2"></div>
        </div>
        
        {/* Moving Cursor (The Red Stripe) */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-red-500 z-30 shadow-[0_0_10px_rgba(239,68,68,1)]"
          style={{
            left: `calc(${cursorPosition}% - 3px)`,
            willChange: 'left',
          }}
        >
           <div className="w-full h-full bg-white opacity-50"></div>
        </div>

        {/* Difficulty Indicator */}
        <div className="absolute top-1 right-2 text-[8px] font-mono text-slate-500 z-0">
           ZONE: {goldSize.toFixed(1)}%
        </div>
      </div>

      {/* Result Text & Controls */}
      <div className="flex gap-2 items-center h-12">
         {result ? (
            <div className={`flex-1 flex items-center justify-center font-black text-lg uppercase italic tracking-wider animate-in zoom-in duration-200 border-2 rounded-xl h-full ${
                result === 'CRIT' 
                ? 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                : result === 'HIT'
                ? 'text-blue-400 border-blue-500/50 bg-blue-900/20'
                : 'text-red-500 border-red-500/50 bg-red-900/20'
            }`}>
               {result === 'CRIT' ? 'CRITICAL x2.5' : result === 'HIT' ? 'TARGET HIT x1.2' : 'GLANCING BLOW x0.5'}
            </div>
         ) : !isRunning ? (
            <button
                onClick={startAnimation}
                disabled={disabled}
                className="flex-1 h-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 active:translate-y-1 transition-all flex items-center justify-center gap-2 border-b-4 border-blue-800 active:border-b-0"
            >
                <span className="animate-pulse">⦿</span> ZIELEN
            </button>
         ) : (
            <button
                onClick={handleFire}
                // Mouse down handler for faster reaction than click
                onMouseDown={handleFire}
                onTouchStart={handleFire}
                className="flex-1 h-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-900/20 active:translate-y-1 transition-all flex items-center justify-center gap-2 border-b-4 border-red-800 active:border-b-0"
            >
                FEUER!
            </button>
         )}
      </div>
    </div>
  );
}

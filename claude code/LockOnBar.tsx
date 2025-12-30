import React, { useState, useEffect, useRef, useCallback } from 'react';

interface LockOnBarProps {
  onFire: (isCritical: boolean) => void;
  difficulty?: number; // 1-10, affects sweet spot size and speed
  disabled?: boolean;
}

export function LockOnBar({ onFire, difficulty = 5, disabled = false }: LockOnBarProps) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<'hit' | 'miss' | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Sweet spot configuration based on difficulty
  const sweetSpotSize = Math.max(8, 25 - difficulty * 1.5); // Smaller at higher difficulty
  const sweetSpotStart = 50 - sweetSpotSize / 2;
  const sweetSpotEnd = 50 + sweetSpotSize / 2;
  const speed = 0.08 + difficulty * 0.015; // Faster at higher difficulty

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    setCursorPosition(prev => {
      let newPos = prev + direction * speed * delta * 0.1;
      
      // Bounce at edges
      if (newPos >= 100) {
        newPos = 100;
        setDirection(-1);
      } else if (newPos <= 0) {
        newPos = 0;
        setDirection(1);
      }
      
      return newPos;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [direction, speed]);

  const startAnimation = useCallback(() => {
    if (disabled) return;
    setIsRunning(true);
    setResult(null);
    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);
  }, [animate, disabled]);

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
    
    const isCritical = cursorPosition >= sweetSpotStart && cursorPosition <= sweetSpotEnd;
    setResult(isCritical ? 'hit' : 'miss');
    
    // Delay before calling onFire for visual feedback
    setTimeout(() => {
      onFire(isCritical);
      setResult(null);
      setCursorPosition(0);
    }, 600);
  }, [isRunning, cursorPosition, sweetSpotStart, sweetSpotEnd, stopAnimation, onFire, disabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full space-y-3">
      {/* Lock-On Bar */}
      <div className="relative w-full h-10 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 via-transparent to-red-900/30" />
        
        {/* Sweet Spot Zone */}
        <div
          className="absolute top-0 h-full transition-all duration-200"
          style={{
            left: `${sweetSpotStart}%`,
            width: `${sweetSpotSize}%`,
            background: result === 'hit' 
              ? 'linear-gradient(180deg, rgba(34, 197, 94, 0.8) 0%, rgba(34, 197, 94, 0.4) 100%)'
              : result === 'miss'
              ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.4) 100%)'
              : 'linear-gradient(180deg, rgba(234, 179, 8, 0.6) 0%, rgba(234, 179, 8, 0.3) 100%)',
            boxShadow: result === 'hit'
              ? '0 0 20px rgba(34, 197, 94, 0.8)'
              : result === 'miss'
              ? '0 0 20px rgba(239, 68, 68, 0.8)'
              : '0 0 15px rgba(234, 179, 8, 0.5)',
          }}
        >
          {/* Sweet spot markers */}
          <div className="absolute left-0 top-0 h-full w-1 bg-yellow-400/80" />
          <div className="absolute right-0 top-0 h-full w-1 bg-yellow-400/80" />
          
          {/* Critical text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-yellow-200 uppercase tracking-wider opacity-70">
              CRITICAL
            </span>
          </div>
        </div>
        
        {/* Cursor */}
        <div
          className="absolute top-1 bottom-1 w-1 rounded-full transition-colors duration-100"
          style={{
            left: `calc(${cursorPosition}% - 2px)`,
            background: cursorPosition >= sweetSpotStart && cursorPosition <= sweetSpotEnd
              ? '#22c55e'
              : '#ef4444',
            boxShadow: cursorPosition >= sweetSpotStart && cursorPosition <= sweetSpotEnd
              ? '0 0 10px #22c55e, 0 0 20px #22c55e'
              : '0 0 10px #ef4444',
          }}
        />
        
        {/* Scan lines effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
        />
      </div>

      {/* Result Feedback */}
      {result && (
        <div className={`text-center font-bold text-lg animate-pulse ${
          result === 'hit' ? 'text-green-400' : 'text-red-400'
        }`}>
          {result === 'hit' ? '💥 CRITICAL HIT!' : '❌ GLANCING BLOW'}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={startAnimation}
            disabled={disabled}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 
                       disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed
                       rounded-lg font-bold text-white transition-all duration-200 
                       shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40
                       flex items-center justify-center gap-2"
          >
            <span>🎯</span>
            <span>LOCK ON</span>
          </button>
        ) : (
          <button
            onClick={handleFire}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 
                       rounded-lg font-bold text-white transition-all duration-200 
                       shadow-lg shadow-red-500/30 hover:shadow-red-500/50
                       flex items-center justify-center gap-2 animate-pulse"
          >
            <span>⚡</span>
            <span>FIRE!</span>
          </button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500 text-center">
        {!isRunning 
          ? 'Click "LOCK ON" to start targeting' 
          : 'Hit "FIRE" when the cursor is in the yellow zone!'}
      </p>
    </div>
  );
}

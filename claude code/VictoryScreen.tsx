import React, { useEffect, useState } from 'react';
import { Item } from '../../contexts/SpireContext';

interface VictoryScreenProps {
  floor: number;
  loot: Item[];
  onCollect: () => void;
  onNextFloor: () => void;
}

const RARITY_COLORS = {
  common: { bg: 'bg-gray-700', border: 'border-gray-500', text: 'text-gray-300', glow: '' },
  uncommon: { bg: 'bg-green-900/50', border: 'border-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' },
  rare: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
  epic: { bg: 'bg-purple-900/50', border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/40' },
  legendary: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/50' },
};

export function VictoryScreen({ floor, loot, onCollect, onNextFloor }: VictoryScreenProps) {
  const [showLoot, setShowLoot] = useState(false);
  const [collectedItems, setCollectedItems] = useState<Set<string>>(new Set());
  const [allCollected, setAllCollected] = useState(false);

  useEffect(() => {
    // Delay loot reveal for dramatic effect
    const timer = setTimeout(() => setShowLoot(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCollectItem = (itemId: string) => {
    setCollectedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(itemId);
      
      // Check if all collected
      if (newSet.size === loot.length) {
        setAllCollected(true);
        onCollect();
      }
      
      return newSet;
    });
  };

  const handleCollectAll = () => {
    setCollectedItems(new Set(loot.map(item => item.id)));
    setAllCollected(true);
    onCollect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Victory Card */}
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-yellow-500/30 
                   shadow-2xl shadow-yellow-500/10 overflow-hidden animate-[scaleIn_0.3s_ease-out]"
      >
        {/* Header Glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-yellow-500/20 to-transparent" />
        
        {/* Content */}
        <div className="relative p-6">
          {/* Victory Banner */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-2 animate-bounce">🏆</div>
            <h2 className="text-2xl font-bold text-yellow-400 tracking-wider">VICTORY!</h2>
            <p className="text-gray-400 text-sm mt-1">Floor {floor} Cleared</p>
          </div>

          {/* Loot Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                📦 Loot Acquired
              </h3>
              {!allCollected && loot.length > 0 && (
                <button
                  onClick={handleCollectAll}
                  className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Collect All
                </button>
              )}
            </div>

            {/* Loot Grid */}
            <div className="grid grid-cols-2 gap-2">
              {showLoot ? (
                loot.length > 0 ? (
                  loot.map((item, index) => {
                    const colors = RARITY_COLORS[item.rarity];
                    const isCollected = collectedItems.has(item.id);
                    
                    return (
                      <button
                        key={`${item.id}-${index}`}
                        onClick={() => !isCollected && handleCollectItem(item.id)}
                        disabled={isCollected}
                        className={`
                          relative p-3 rounded-lg border-2 transition-all duration-300
                          ${colors.bg} ${colors.border}
                          ${!isCollected ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-default'}
                          ${colors.glow ? `shadow-lg ${colors.glow}` : ''}
                        `}
                        style={{
                          animation: `fadeSlideIn 0.3s ease-out ${index * 0.1}s both`,
                        }}
                      >
                        {/* Rarity indicator */}
                        <div className={`absolute top-1 right-1 text-[8px] font-bold uppercase ${colors.text}`}>
                          {item.rarity}
                        </div>
                        
                        {/* Item content */}
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="flex-1 text-left">
                            <div className={`text-sm font-semibold ${colors.text}`}>{item.name}</div>
                            <div className="text-xs text-gray-400">x{item.quantity}</div>
                          </div>
                        </div>

                        {/* Collected overlay */}
                        {isCollected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                            <span className="text-green-400 text-xl">✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No loot dropped
                  </div>
                )
              ) : (
                // Loading placeholders
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-800 rounded-lg animate-pulse"
                  />
                ))
              )}
            </div>
          </div>

          {/* Next Floor Button */}
          <button
            onClick={onNextFloor}
            disabled={!allCollected && loot.length > 0}
            className={`
              w-full mt-6 py-4 rounded-xl font-bold text-lg tracking-wider transition-all duration-300
              flex items-center justify-center gap-2
              ${allCollected || loot.length === 0
                ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black shadow-lg shadow-yellow-500/30'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <span>⬆️</span>
            <span>NEXT FLOOR</span>
            <span className="text-sm opacity-70">(Floor {floor + 1})</span>
          </button>
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-500/50 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-500/50 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-500/50 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-yellow-500/50 rounded-br-2xl" />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

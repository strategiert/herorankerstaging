import React, { useState } from 'react';
import { Hero, Faction, FACTION_COLORS, FACTION_ICONS, FACTION_EFFECTIVENESS } from '../../contexts/SpireContext';

interface HeroSelectModalProps {
  heroes: Hero[];
  enemyFaction: Faction;
  onSelect: (hero: Hero) => void;
  onClose: () => void;
}

export function HeroSelectModal({ heroes, enemyFaction, onSelect, onClose }: HeroSelectModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterFaction, setFilterFaction] = useState<Faction | 'all'>('all');

  // Get the counter faction for the current enemy
  const counterFaction = Object.entries(FACTION_EFFECTIVENESS).find(
    ([_, value]) => (value as { strongAgainst: Faction }).strongAgainst === enemyFaction
  )?.[0] as Faction | undefined;

  const filteredHeroes = filterFaction === 'all' 
    ? heroes 
    : heroes.filter(h => h.faction === filterFaction);

  const selectedHero = heroes.find(h => h.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Select Champion</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Tactical Info */}
          <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tactical Intel</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Enemy Faction:</span>
                <span 
                  className="px-2 py-1 rounded text-sm font-semibold"
                  style={{ 
                    backgroundColor: `${FACTION_COLORS[enemyFaction]}20`,
                    color: FACTION_COLORS[enemyFaction],
                  }}
                >
                  {FACTION_ICONS[enemyFaction]} {enemyFaction}
                </span>
              </div>
              {counterFaction && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Weakness:</span>
                  <span 
                    className="px-2 py-1 rounded text-sm font-semibold animate-pulse"
                    style={{ 
                      backgroundColor: `${FACTION_COLORS[counterFaction]}30`,
                      color: FACTION_COLORS[counterFaction],
                      boxShadow: `0 0 10px ${FACTION_COLORS[counterFaction]}40`,
                    }}
                  >
                    {FACTION_ICONS[counterFaction]} {counterFaction}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Faction Filter */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterFaction('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterFaction === 'all'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All ({heroes.length})
            </button>
            {(['Mechanoid', 'Terraguard', 'Solaris', 'Voidborn'] as Faction[]).map(faction => {
              const count = heroes.filter(h => h.faction === faction).length;
              if (count === 0) return null;
              const isCounter = faction === counterFaction;
              
              return (
                <button
                  key={faction}
                  onClick={() => setFilterFaction(faction)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterFaction === faction
                      ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                      : 'hover:opacity-80'
                  } ${isCounter ? 'ring-1 ring-yellow-400/50' : ''}`}
                  style={{ 
                    backgroundColor: `${FACTION_COLORS[faction]}30`,
                    color: FACTION_COLORS[faction],
                  }}
                >
                  {FACTION_ICONS[faction]} {faction} ({count})
                  {isCounter && <span className="ml-1 text-yellow-400">★</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-2">
            {filteredHeroes.length > 0 ? (
              filteredHeroes.map(hero => {
                const isCounter = hero.faction === counterFaction;
                const isSelected = selectedId === hero.id;
                
                return (
                  <button
                    key={hero.id}
                    onClick={() => setSelectedId(hero.id)}
                    className={`
                      relative p-3 rounded-xl border-2 transition-all duration-200 text-left
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                      }
                    `}
                  >
                    {/* Counter Bonus Badge */}
                    {isCounter && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-xs font-bold text-green-400">
                        +20% DMG
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      {/* Hero Avatar */}
                      <div 
                        className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl"
                        style={{ backgroundColor: `${FACTION_COLORS[hero.faction]}20` }}
                      >
                        {hero.image}
                      </div>
                      
                      {/* Hero Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{hero.name}</span>
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ 
                              backgroundColor: `${FACTION_COLORS[hero.faction]}20`,
                              color: FACTION_COLORS[hero.faction],
                            }}
                          >
                            {hero.faction}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span>⚔️ ATK {hero.attack}</span>
                          <span>🛡️ DEF {hero.defense}</span>
                          <span>❤️ HP {hero.maxHp}</span>
                        </div>
                        
                        <div className="flex gap-1 mt-1.5">
                          {hero.abilities.slice(0, 3).map((ability, i) => (
                            <span 
                              key={i}
                              className="px-1.5 py-0.5 bg-gray-700 rounded text-[9px] text-gray-300"
                            >
                              {ability}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Power Badge */}
                      <div className="text-center">
                        <div className="text-xs text-gray-400">PWR</div>
                        <div className="text-lg font-bold text-yellow-400">{hero.power}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No heroes available for this faction
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={() => selectedHero && onSelect(selectedHero)}
            disabled={!selectedHero}
            className={`
              w-full py-3 rounded-xl font-bold text-lg transition-all duration-200
              ${selectedHero
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {selectedHero ? (
              <span className="flex items-center justify-center gap-2">
                <span>Deploy {selectedHero.name}</span>
                {selectedHero.faction === counterFaction && (
                  <span className="px-2 py-0.5 bg-green-500/30 rounded text-sm text-green-400">
                    +20% DMG
                  </span>
                )}
              </span>
            ) : (
              'Select a Champion'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
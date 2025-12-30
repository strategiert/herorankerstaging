
import React, { useState, useMemo, useEffect } from 'react';
import { 
  useSpire, 
  FACTION_COLORS, 
  FACTION_ICONS, 
  Faction,
  SpireHero
} from '../context/SpireContext';
import { useGame } from '../context/GameContext';
import { useAssistant } from '../context/AssistantContext';
import { Hero } from '../types';
import { LockOnBar } from './LockOnBar';
import { VictoryScreen } from './VictoryScreen';
import { HeroSelectModal } from './HeroSelectModal';
import { 
  Zap, Shield, Heart, Target, RefreshCw, ChevronUp, 
  Skull, Trophy, Activity, Swords, AlertTriangle 
} from 'lucide-react';

// =============================================================================
// HP BAR COMPONENT
// =============================================================================

interface HPBarProps {
  current: number;
  max: number;
  label?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'player' | 'enemy';
}

function HPBar({ current, max, label, showText = true, size = 'md', color = 'player' }: HPBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  const heights = { sm: 'h-2', md: 'h-4', lg: 'h-6' };
  
  const getBarColor = () => {
    if (color === 'enemy') return 'bg-red-500';
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="w-full">
      {label && <div className="text-[10px] text-slate-500 mb-1 font-mono uppercase">{label}</div>}
      <div className={`relative w-full ${heights[size]} bg-slate-900 rounded-full overflow-hidden border border-slate-700`}>
        <div
          className={`absolute inset-y-0 left-0 ${getBarColor()} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
        {showText && size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow font-mono">
            {current} / {max}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COMBAT LOG COMPONENT
// =============================================================================

function CombatLog() {
  const { combatLog } = useSpire();
  
  const getLogStyle = (type: string) => {
    switch (type) {
      case 'critical': return 'text-yellow-400 font-bold';
      case 'attack': return 'text-blue-400';
      case 'heal': return 'text-green-400';
      case 'enemy_attack': return 'text-red-400';
      case 'victory': return 'text-yellow-300 font-bold';
      case 'defeat': return 'text-red-500 font-bold';
      default: return 'text-slate-400';
    }
  };
  
  return (
    <div className="bg-slate-950/80 rounded-xl p-3 h-28 overflow-y-auto border border-slate-800 custom-scrollbar">
      <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2 font-mono flex items-center gap-1">
        <Activity className="w-3 h-3" /> KAMPFPROTOKOLL
      </div>
      <div className="space-y-1">
        {combatLog.length > 0 ? (
          combatLog.slice().reverse().map(log => (
            <div key={log.id} className={`text-[11px] ${getLogStyle(log.type)}`}>
              {log.message}
            </div>
          ))
        ) : (
          <div className="text-[11px] text-slate-700 italic">Warte auf Kampfbeginn...</div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN SPIRE SCREEN
// =============================================================================

interface SpireScreenProps {
  myHeroes: Hero[];
  onNavigateToRecruit: () => void;
}

export function SpireScreen({ myHeroes, onNavigateToRecruit }: SpireScreenProps) {
  const {
    currentFloor,
    highScore,
    selectedHero,
    currentEnemy,
    playerHp,
    playerMaxHp,
    energy,
    maxEnergy,
    healCooldown,
    showVictoryScreen,
    pendingLoot,
    screenShake,
    selectHero,
    clearHero,
    performAttack,
    performHeal,
    nextFloor,
    collectLoot,
    resetSpire,
    getCounterFaction,
    hasCounterBonus,
  } = useSpire();

  const { state: gameState, deductResources } = useGame();
  const { triggerEvent } = useAssistant(); // K.O.R.A. Integration
  
  const [showHeroModal, setShowHeroModal] = useState(false);

  // --- K.O.R.A. TRIGGERS ---
  useEffect(() => {
      if (showVictoryScreen) {
          triggerEvent('spire_victory', `Sieg auf Ebene ${currentFloor}. Gegner eliminiert.`);
      }
  }, [showVictoryScreen]);

  useEffect(() => {
      if (playerHp <= 0 && selectedHero) {
          triggerEvent('spire_defeat', `Held ${selectedHero.name} wurde vernichtet.`);
      }
  }, [playerHp]);

  const handleHealClick = () => {
      performHeal();
      if (playerHp < playerMaxHp * 0.5) {
        // Only comment on heal if critical or randomly
        triggerEvent('spire_heal', 'Reparatur-Protokoll initiiert.');
      }
  };

  // Transform App Heroes to Spire Heroes
  const spireHeroes = useMemo<SpireHero[]>(() => {
    return myHeroes.map((h: Hero) => {
      const stats = h.powerstats;
      
      // Determine Faction based on attributes
      let faction: Faction = 'Neutral';
      const race = (h.appearance.race || '').toLowerCase();
      const pub = (h.biography.publisher || '').toLowerCase();
      
      if (race.includes('robot') || race.includes('android') || race.includes('cyborg') || race.includes('synth')) {
          faction = 'Mechanoid';
      } else if (race.includes('human') || pub.includes('marvel')) { 
           if(stats.power > 80) faction = 'Solaris';
           else faction = 'Terraguard';
      } else if (race.includes('alien') || race.includes('demon') || race.includes('mutant') || pub.includes('dc')) {
          faction = 'Voidborn';
      } else {
          const hash = h.id.charCodeAt(0) % 4;
          faction = (['Mechanoid', 'Terraguard', 'Solaris', 'Voidborn'][hash]) as Faction;
      }

      return {
        id: h.id,
        name: h.name,
        // SpireHero.image is string | ReactNode. We create an img element or use an emoji string.
        image: h.image?.url ? <img src={h.image.url} className="w-full h-full object-cover" alt={h.name} /> : '🦸',
        faction,
        power: Math.floor((stats.intelligence + stats.strength + stats.speed + stats.durability + stats.power + stats.combat) / 6),
        maxHp: stats.durability * 10 + stats.strength * 5,
        currentHp: stats.durability * 10 + stats.strength * 5,
        attack: Math.floor(stats.power * 1.5 + stats.combat),
        defense: Math.floor(stats.durability + stats.speed * 0.5),
        abilities: ['Strike', 'Defend', 'Ultimate'] 
      };
    });
  }, [myHeroes]);

  const isPlayerDead = playerHp <= 0;
  const counterFaction = currentEnemy ? getCounterFaction(currentEnemy.faction) : null;
  const isBossFloor = currentFloor % 10 === 0;

  // Handle loot collection and add to game resources
  const handleCollectLoot = () => {
    const loot = collectLoot();
    console.log('Collected loot:', loot);
  };

  return (
    <div 
      className={`h-full flex flex-col bg-[#020617] overflow-hidden ${
        screenShake ? 'animate-shake' : ''
      }`}
    >
      {/* Screen Shake Animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-8px) rotate(-0.5deg); }
          20% { transform: translateX(8px) rotate(0.5deg); }
          30% { transform: translateX(-6px) rotate(-0.5deg); }
          40% { transform: translateX(6px) rotate(0.5deg); }
          50% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          70% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>

      {/* Header - Compact */}
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-400">
          <Zap className="w-4 h-4" />
          <h1 className="text-lg font-comic tracking-wider">SPIRE</h1>
          <span className="text-slate-500 text-xs font-mono">E{currentFloor}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isBossFloor && (
            <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded text-red-400 font-bold text-[10px] flex items-center gap-1">
              <Skull className="w-3 h-3" /> BOSS
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">
            🏆 {highScore}
          </span>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        
        {/* Enemy Card - Compact */}
        {currentEnemy && (
          <div className={`
            relative bg-gradient-to-b from-slate-800/60 to-slate-900/60 rounded-xl p-4 
            border ${isBossFloor ? 'border-red-500/40' : 'border-slate-700/50'}
          `}>
            <div className="flex items-center gap-4">
              {/* Enemy Avatar */}
              <div 
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl shrink-0 ${isBossFloor ? 'animate-pulse' : ''}`}
                style={{ 
                  backgroundColor: `${FACTION_COLORS[currentEnemy.faction]}15`,
                  boxShadow: `0 0 20px ${FACTION_COLORS[currentEnemy.faction]}20`,
                  border: `2px solid ${FACTION_COLORS[currentEnemy.faction]}40`
                }}
              >
                {currentEnemy.image}
              </div>
              
              {/* Enemy Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-comic text-white tracking-wide truncate">
                    {currentEnemy.name}
                  </h2>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 font-mono">
                    LV{currentEnemy.level}
                  </span>
                </div>
                
                {/* Faction & Weakness */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span 
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{ 
                      backgroundColor: `${FACTION_COLORS[currentEnemy.faction]}20`,
                      color: FACTION_COLORS[currentEnemy.faction],
                    }}
                  >
                    {FACTION_ICONS[currentEnemy.faction]} {currentEnemy.faction}
                  </span>
                  {counterFaction && (
                    <span className="text-[9px] text-slate-500">
                      Weak: <span style={{ color: FACTION_COLORS[counterFaction] }}>{FACTION_ICONS[counterFaction]}</span>
                    </span>
                  )}
                </div>

                {/* Enemy HP Bar */}
                <div className="mt-2">
                  <HPBar current={currentEnemy.currentHp} max={currentEnemy.maxHp} color="enemy" size="md" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player Hero Stats - Compact */}
        {selectedHero && (
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                {/* Render image or emoji */}
                {typeof selectedHero.image === 'string' ? (
                  <span className="text-xl">{selectedHero.image}</span>
                ) : (
                  selectedHero.image
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">{selectedHero.name}</span>
                  {hasCounterBonus() && (
                    <span className="px-1 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-[8px] font-bold text-green-400 shrink-0">
                      +20%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1">
                    <HPBar current={playerHp} max={playerMaxHp} size="sm" showText={false} />
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono shrink-0">{playerHp}/{playerMaxHp}</span>
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-[8px] text-slate-500 uppercase">EN</div>
                <div className="text-blue-400 font-bold text-sm">{energy}</div>
              </div>
              <button
                onClick={clearHero}
                className="p-1 text-slate-600 hover:text-red-400 transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Combat Log - Compact */}
        {selectedHero && !isPlayerDead && (
          <CombatLog />
        )}

        {/* Death Screen */}
        {selectedHero && isPlayerDead && (
          <div className="text-center space-y-3 py-4">
            <div className="text-5xl">💀</div>
            <h3 className="text-xl font-comic text-red-400">NIEDERLAGE</h3>
            <p className="text-slate-400 text-xs">
              {selectedHero.name} gefallen auf Etage {currentFloor}
            </p>
          </div>
        )}
      </div>

      {/* FIXED ACTION FOOTER */}
      <div className="shrink-0 bg-slate-900/95 border-t border-slate-800 p-3 pb-20 space-y-2">
        {!selectedHero ? (
          /* Hero Select Button */
          <button
            onClick={() => setShowHeroModal(true)}
            className="w-full py-4 bg-gradient-to-b from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 
                       rounded-xl font-comic text-lg text-white tracking-wider transition-all duration-200
                       shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 border-b-4 border-cyan-800
                       active:border-b-0 active:translate-y-1"
          >
            <Target className="w-5 h-5" />
            <span>CHAMPION WÄHLEN</span>
          </button>
        ) : isPlayerDead ? (
          /* Reset Button */
          <button
            onClick={resetSpire}
            className="w-full py-4 bg-gradient-to-b from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 
                       rounded-xl font-comic text-white transition-all border-b-4 border-red-900
                       active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>SPIRE NEU STARTEN</span>
          </button>
        ) : (
          /* Combat Actions */
          <>
            {/* Lock-On Bar */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
              <LockOnBar 
                onFire={(isCritical: any) => performAttack(typeof isCritical === 'boolean' ? (isCritical ? 2.5 : 1.0) : isCritical)}
                difficulty={Math.min(10, Math.floor(currentFloor / 4) + 3)}
              />
            </div>

            {/* Heal Button */}
            <button
              onClick={handleHealClick}
              disabled={healCooldown > 0 || energy < 30}
              className={`
                w-full py-3 rounded-xl font-comic transition-all duration-200
                flex items-center justify-center gap-2 border-b-4
                active:border-b-0 active:translate-y-1
                ${healCooldown > 0 || energy < 30
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-900'
                  : 'bg-gradient-to-b from-green-600 to-emerald-700 border-green-900 text-white shadow-lg shadow-green-500/20'
                }
              `}
            >
              <Shield className="w-4 h-4" />
              <span>REPARATUR</span>
              <span className="text-xs opacity-70 font-tech">
                -30 EN {healCooldown > 0 && `[${healCooldown}]`}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Hero Select Modal */}
      {showHeroModal && currentEnemy && (
        <HeroSelectModal
          heroes={spireHeroes}
          enemyFaction={currentEnemy.faction}
          onSelect={(hero) => {
            selectHero(hero);
            setShowHeroModal(false);
          }}
          onClose={() => setShowHeroModal(false)}
          onNavigateToRecruit={onNavigateToRecruit}
        />
      )}

      {/* Victory Screen */}
      {showVictoryScreen && (
        <VictoryScreen
          floor={currentFloor}
          loot={pendingLoot}
          onCollect={handleCollectLoot}
          onNextFloor={nextFloor}
        />
      )}
    </div>
  );
}

export default SpireScreen;

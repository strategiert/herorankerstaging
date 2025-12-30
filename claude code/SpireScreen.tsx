import React, { useState } from 'react';
import { 
  useSpire, 
  FACTION_COLORS, 
  FACTION_ICONS, 
  FACTION_EFFECTIVENESS,
  Hero,
} from '../../contexts/SpireContext';
import { LockOnBar } from './LockOnBar';
import { VictoryScreen } from './VictoryScreen';
import { HeroSelectModal } from './HeroSelectModal';

// =============================================================================
// HP BAR COMPONENT
// =============================================================================

interface HPBarProps {
  current: number;
  max: number;
  label?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'red' | 'blue';
  animated?: boolean;
}

function HPBar({ current, max, label, showText = true, size = 'md', color = 'green', animated = true }: HPBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  const heights = { sm: 'h-2', md: 'h-4', lg: 'h-6' };
  const colors = {
    green: percentage > 50 ? 'bg-green-500' : percentage > 25 ? 'bg-yellow-500' : 'bg-red-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };
  
  return (
    <div className="w-full">
      {label && <div className="text-xs text-gray-400 mb-1">{label}</div>}
      <div className={`relative w-full ${heights[size]} bg-gray-800 rounded-full overflow-hidden`}>
        <div
          className={`absolute inset-y-0 left-0 ${colors[color]} rounded-full ${animated ? 'transition-all duration-500' : ''}`}
          style={{ width: `${percentage}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
        {showText && size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
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
  
  const getLogColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-yellow-400';
      case 'attack': return 'text-blue-400';
      case 'heal': return 'text-green-400';
      case 'enemy_attack': return 'text-red-400';
      case 'victory': return 'text-yellow-300';
      case 'defeat': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <div className="bg-gray-900/80 rounded-lg p-3 h-32 overflow-y-auto border border-gray-800">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Combat Log</div>
      <div className="space-y-1">
        {combatLog.length > 0 ? (
          combatLog.slice().reverse().map(log => (
            <div key={log.id} className={`text-xs ${getLogColor(log.type)}`}>
              {log.message}
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-600 italic">Waiting for combat...</div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN SPIRE SCREEN
// =============================================================================

interface SpireScreenProps {
  unlockedHeroes: Hero[];
}

export function SpireScreen({ unlockedHeroes }: SpireScreenProps) {
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
    isInCombat,
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

  const [showHeroModal, setShowHeroModal] = useState(false);
  const [showCombatUI, setShowCombatUI] = useState(false);

  const isPlayerDead = playerHp <= 0;
  const counterFaction = currentEnemy ? getCounterFaction(currentEnemy.faction) : null;

  return (
    <div 
      className={`min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-4 ${
        screenShake ? 'animate-shake' : ''
      }`}
    >
      {/* Screen Shake Animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-10px) rotate(-1deg); }
          20% { transform: translateX(10px) rotate(1deg); }
          30% { transform: translateX(-10px) rotate(-1deg); }
          40% { transform: translateX(10px) rotate(1deg); }
          50% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
          70% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
          90% { transform: translateX(-1px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>

      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <span className="text-xl">⚡</span>
            <h1 className="text-2xl font-bold tracking-wider">INFINITE SPIRE</h1>
          </div>
          <p className="text-gray-400 text-sm">
            FLOOR {currentFloor} • HIGHSCORE: {highScore}
          </p>
        </div>

        {/* Enemy Card */}
        {currentEnemy && (
          <div className="relative bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl p-6 border border-gray-700/50">
            {/* Enemy Avatar */}
            <div className="flex flex-col items-center">
              <div 
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-6xl mb-4"
                style={{ 
                  backgroundColor: `${FACTION_COLORS[currentEnemy.faction]}15`,
                  boxShadow: `0 0 30px ${FACTION_COLORS[currentEnemy.faction]}30`,
                }}
              >
                {currentEnemy.image}
              </div>
              
              <h2 className="text-xl font-bold text-white tracking-wide">
                {currentEnemy.name}
              </h2>
              
              {/* Level & Power */}
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                  LV {currentEnemy.level}
                </span>
                <span className="px-2 py-1 bg-red-900/50 border border-red-500/50 rounded text-xs text-red-400">
                  PWR {currentEnemy.power}
                </span>
              </div>

              {/* Faction Badge */}
              <div 
                className="mt-3 px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{ 
                  backgroundColor: `${FACTION_COLORS[currentEnemy.faction]}20`,
                  color: FACTION_COLORS[currentEnemy.faction],
                }}
              >
                {FACTION_ICONS[currentEnemy.faction]} {currentEnemy.faction}
              </div>

              {/* Tactical Info */}
              {counterFaction && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Weak to:</span>
                  <span 
                    className="px-2 py-1 rounded font-semibold animate-pulse"
                    style={{ 
                      backgroundColor: `${FACTION_COLORS[counterFaction]}30`,
                      color: FACTION_COLORS[counterFaction],
                    }}
                  >
                    {FACTION_ICONS[counterFaction]} {counterFaction}
                  </span>
                </div>
              )}

              {/* Enemy HP Bar */}
              <div className="w-full mt-4">
                <HPBar 
                  current={currentEnemy.currentHp} 
                  max={currentEnemy.maxHp} 
                  color="red"
                  size="lg"
                />
              </div>
            </div>

            {/* Loot Preview */}
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>POSSIBLE LOOT</span>
                <div className="flex gap-1">
                  {currentEnemy.lootTable.slice(0, 4).map((loot, i) => (
                    <span key={i} className="text-base" title={loot.name}>{loot.icon}</span>
                  ))}
                  {currentEnemy.lootTable.length > 4 && (
                    <span className="text-gray-600">+{currentEnemy.lootTable.length - 4}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player Stats (when hero selected) */}
        {selectedHero && (
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${FACTION_COLORS[selectedHero.faction]}20` }}
              >
                {selectedHero.image}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{selectedHero.name}</span>
                  {hasCounterBonus() && (
                    <span className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-[10px] font-bold text-green-400">
                      +20% DMG
                    </span>
                  )}
                </div>
                <HPBar current={playerHp} max={playerMaxHp} size="sm" showText={false} />
                <div className="text-xs text-gray-400 mt-1">
                  HP: {playerHp}/{playerMaxHp}
                </div>
              </div>
              <button
                onClick={clearHero}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                title="Change Hero"
              >
                ✕
              </button>
            </div>

            {/* Energy Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>⚡ Energy</span>
                <span>{energy}/{maxEnergy}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(energy / maxEnergy) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Combat UI or Hero Select */}
        {!selectedHero ? (
          // No hero selected - show Select Champion button
          <button
            onClick={() => setShowHeroModal(true)}
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 
                       rounded-xl font-bold text-lg text-white tracking-wider transition-all duration-200
                       shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50
                       flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🎯</span>
            <span>SELECT CHAMPION</span>
          </button>
        ) : isPlayerDead ? (
          // Player Dead - show Game Over
          <div className="text-center space-y-4">
            <div className="text-5xl">💀</div>
            <h3 className="text-xl font-bold text-red-400">DEFEAT</h3>
            <p className="text-gray-400 text-sm">Your champion has fallen at Floor {currentFloor}</p>
            <button
              onClick={resetSpire}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 
                         rounded-xl font-bold text-white transition-all"
            >
              🔄 RESTART SPIRE
            </button>
          </div>
        ) : (
          // Combat Interface
          <div className="space-y-4">
            {/* Lock-On Attack System */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">
                ⚔️ ATTACK SYSTEM
              </div>
              <LockOnBar 
                onFire={performAttack}
                difficulty={Math.min(10, Math.floor(currentFloor / 5) + 3)}
              />
            </div>

            {/* Heal Button */}
            <button
              onClick={performHeal}
              disabled={healCooldown > 0 || energy < 30}
              className={`
                w-full py-4 rounded-xl font-bold transition-all duration-200
                flex items-center justify-center gap-2
                ${healCooldown > 0 || energy < 30
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20'
                }
              `}
            >
              <span>🛡️</span>
              <span>REPAIR</span>
              <span className="text-sm opacity-70">
                (+30% HP, -30 Energy)
                {healCooldown > 0 && ` [CD: ${healCooldown}]`}
              </span>
            </button>

            {/* Combat Log */}
            <CombatLog />
          </div>
        )}

        {/* Team Power Display */}
        {selectedHero && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-lg"
                style={{ backgroundColor: `${FACTION_COLORS[selectedHero.faction]}20` }}
              >
                {selectedHero.image}
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Your Champion</div>
                <div className="text-white font-semibold">{selectedHero.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase">Team Power</div>
              <div className="text-yellow-400 font-bold">{selectedHero.power}</div>
            </div>
          </div>
        )}
      </div>

      {/* Hero Select Modal */}
      {showHeroModal && currentEnemy && (
        <HeroSelectModal
          heroes={unlockedHeroes}
          enemyFaction={currentEnemy.faction}
          onSelect={(hero) => {
            selectHero(hero);
            setShowHeroModal(false);
          }}
          onClose={() => setShowHeroModal(false)}
        />
      )}

      {/* Victory Screen */}
      {showVictoryScreen && (
        <VictoryScreen
          floor={currentFloor}
          loot={pendingLoot}
          onCollect={collectLoot}
          onNextFloor={() => {
            nextFloor();
            clearHero(); // Force new hero selection each floor
          }}
        />
      )}
    </div>
  );
}

export default SpireScreen;

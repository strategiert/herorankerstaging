
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface SpireHero {
  id: string;
  name: string;
  image: string | ReactNode;
  faction: Faction;
  power: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  abilities: string[];
}

export interface Enemy {
  id: string;
  name: string;
  image: string;
  faction: Faction;
  level: number;
  power: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  lootTable: LootDrop[];
}

export interface LootDrop {
  itemId: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  dropChance: number; // 0-100
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  description: string;
}

export type Faction = 'Mechanoid' | 'Terraguard' | 'Voidborn' | 'Solaris' | 'Neutral';

export interface CombatLog {
  id: string;
  type: 'attack' | 'heal' | 'critical' | 'enemy_attack' | 'victory' | 'defeat';
  message: string;
  damage?: number;
  timestamp: number;
}

export interface SpireState {
  currentFloor: number;
  highScore: number;
  selectedHero: SpireHero | null;
  currentEnemy: Enemy | null;
  playerHp: number;
  playerMaxHp: number;
  energy: number;
  maxEnergy: number;
  healCooldown: number;
  combatLog: CombatLog[];
  isInCombat: boolean;
  showVictoryScreen: boolean;
  pendingLoot: Item[];
  screenShake: boolean;
}

// =============================================================================
// FACTION EFFECTIVENESS (Rock-Paper-Scissors)
// =============================================================================

export const FACTION_EFFECTIVENESS: Record<Faction, { strongAgainst: Faction; weakAgainst: Faction }> = {
  Mechanoid: { strongAgainst: 'Voidborn', weakAgainst: 'Terraguard' },
  Terraguard: { strongAgainst: 'Mechanoid', weakAgainst: 'Solaris' },
  Solaris: { strongAgainst: 'Terraguard', weakAgainst: 'Voidborn' },
  Voidborn: { strongAgainst: 'Solaris', weakAgainst: 'Mechanoid' },
  Neutral: { strongAgainst: 'Neutral', weakAgainst: 'Neutral' },
};

export const FACTION_COLORS: Record<Faction, string> = {
  Mechanoid: '#3B82F6', // Blue
  Terraguard: '#22C55E', // Green
  Solaris: '#F59E0B', // Amber
  Voidborn: '#A855F7', // Purple
  Neutral: '#6B7280', // Gray
};

export const FACTION_ICONS: Record<Faction, string> = {
  Mechanoid: '🤖',
  Terraguard: '🛡️',
  Solaris: '☀️',
  Voidborn: '👁️',
  Neutral: '⚪',
};

// =============================================================================
// ITEM DATABASE
// =============================================================================

export const ITEM_DATABASE: Record<string, Omit<Item, 'quantity'>> = {
  scrap_metal: {
    id: 'scrap_metal',
    name: 'Scrap Metal',
    icon: '🔩',
    rarity: 'common',
    description: 'Basic crafting material salvaged from defeated enemies.',
  },
  credits: {
    id: 'credits',
    name: 'Credits',
    icon: '💰',
    rarity: 'common',
    description: 'Universal currency.',
  },
  energy_cell: {
    id: 'energy_cell',
    name: 'Energy Cell',
    icon: '🔋',
    rarity: 'uncommon',
    description: 'Powers advanced equipment and abilities.',
  },
  rare_alloy: {
    id: 'rare_alloy',
    name: 'Rare Alloy',
    icon: '💎',
    rarity: 'rare',
    description: 'High-grade material for crafting powerful gear.',
  },
  void_shard: {
    id: 'void_shard',
    name: 'Void Shard',
    icon: '🔮',
    rarity: 'epic',
    description: 'Fragment of pure void energy. Extremely valuable.',
  },
  ancient_core: {
    id: 'ancient_core',
    name: 'Ancient Core',
    icon: '⚙️',
    rarity: 'legendary',
    description: 'Core component from an ancient machine. Priceless.',
  },
  recruit_ticket: {
    id: 'recruit_ticket',
    name: 'Recruit Ticket',
    icon: '🎫',
    rarity: 'rare',
    description: 'Used to summon new heroes.',
  },
};

// =============================================================================
// ENEMY GENERATOR
// =============================================================================

const ENEMY_TEMPLATES = [
  { name: 'Security Bot', image: '🤖', faction: 'Mechanoid' as Faction, baseLevel: 1 },
  { name: 'Guard Drone', image: '🛸', faction: 'Mechanoid' as Faction, baseLevel: 5 },
  { name: 'Terra Sentinel', image: '🗿', faction: 'Terraguard' as Faction, baseLevel: 1 },
  { name: 'Stone Golem', image: '🪨', faction: 'Terraguard' as Faction, baseLevel: 10 },
  { name: 'Solar Wraith', image: '👻', faction: 'Solaris' as Faction, baseLevel: 1 },
  { name: 'Flame Phoenix', image: '🔥', faction: 'Solaris' as Faction, baseLevel: 15 },
  { name: 'Void Stalker', image: '👁️', faction: 'Voidborn' as Faction, baseLevel: 1 },
  { name: 'Shadow Beast', image: '🦇', faction: 'Voidborn' as Faction, baseLevel: 8 },
  { name: 'Corrupted AI', image: '💀', faction: 'Mechanoid' as Faction, baseLevel: 20 },
  { name: 'Titan Mech', image: '🦾', faction: 'Mechanoid' as Faction, baseLevel: 30 },
];

export function generateEnemy(floor: number): Enemy {
  // Pick template based on floor
  const eligibleTemplates = ENEMY_TEMPLATES.filter(t => t.baseLevel <= floor);
  const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)] || ENEMY_TEMPLATES[0];
  
  // Scale stats with floor (Exponential Curve)
  const level = floor;
  const scaleFactor = Math.pow(1.05, floor); // 5% harder per floor
  
  const baseHp = 100;
  const baseAttack = 15;
  const baseDefense = 5;
  
  const lootTable: LootDrop[] = [
    { itemId: 'scrap_metal', name: 'Scrap Metal', icon: '🔩', rarity: 'common', quantity: Math.floor(1 + floor * 0.5), dropChance: 80 },
    { itemId: 'credits', name: 'Credits', icon: '💰', rarity: 'common', quantity: Math.floor(10 + floor * 5), dropChance: 100 },
    { itemId: 'energy_cell', name: 'Energy Cell', icon: '🔋', rarity: 'uncommon', quantity: 1, dropChance: 20 },
    { itemId: 'rare_alloy', name: 'Rare Alloy', icon: '💎', rarity: 'rare', quantity: 1, dropChance: 5 },
  ];
  
  // Boss floors (every 10)
  if (floor % 10 === 0) {
    lootTable.push({ itemId: 'ancient_core', name: 'Ancient Core', icon: '⚙️', rarity: 'legendary', quantity: 1, dropChance: 50 });
    lootTable.push({ itemId: 'recruit_ticket', name: 'Recruit Ticket', icon: '🎫', rarity: 'rare', quantity: 1, dropChance: 100 });
  } else {
      // Small chance for tickets on normal floors
      lootTable.push({ itemId: 'recruit_ticket', name: 'Recruit Ticket', icon: '🎫', rarity: 'rare', quantity: 1, dropChance: 2 });
  }
  
  return {
    id: `enemy_${floor}_${Date.now()}`,
    name: floor % 10 === 0 ? `${template.name} MK.${Math.ceil(floor / 10)}` : template.name,
    image: template.image,
    faction: template.faction,
    level,
    power: Math.floor(50 * scaleFactor),
    maxHp: Math.floor(baseHp * scaleFactor * (floor % 10 === 0 ? 2.5 : 1)), // Bosses have 2.5x HP
    currentHp: Math.floor(baseHp * scaleFactor * (floor % 10 === 0 ? 2.5 : 1)),
    attack: Math.floor(baseAttack * scaleFactor),
    defense: Math.floor(baseDefense * scaleFactor),
    lootTable,
  };
}

// =============================================================================
// LOOT GENERATION
// =============================================================================

export function generateLoot(lootTable: LootDrop[]): Item[] {
  const loot: Item[] = [];
  
  for (const drop of lootTable) {
    const roll = Math.random() * 100;
    if (roll <= drop.dropChance) {
      const itemTemplate = ITEM_DATABASE[drop.itemId];
      if (itemTemplate) {
        loot.push({
          ...itemTemplate,
          quantity: drop.quantity,
        });
      }
    }
  }
  
  return loot;
}

// =============================================================================
// CONTEXT
// =============================================================================

interface SpireContextType extends SpireState {
  // Hero Selection
  selectHero: (hero: SpireHero) => void;
  clearHero: () => void;
  
  // Combat Actions
  startCombat: () => void;
  performAttack: (multiplier: number) => void;
  performHeal: () => void;
  
  // Floor Progression
  nextFloor: () => void;
  resetSpire: () => void;
  
  // Loot
  collectLoot: () => Item[];
  
  // UI
  triggerScreenShake: () => void;
  addCombatLog: (log: Omit<CombatLog, 'id' | 'timestamp'>) => void;
  
  // Utilities
  getCounterFaction: (enemyFaction: Faction) => Faction;
  hasCounterBonus: () => boolean;
  
  // Sync
  loadSpireState: (newState: Partial<SpireState>) => void;
}

const SpireContext = createContext<SpireContextType | null>(null);

export function useSpire() {
  const context = useContext(SpireContext);
  if (!context) {
    throw new Error('useSpire must be used within a SpireProvider');
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

interface SpireProviderProps {
  children?: ReactNode;
  unlockedHeroes: SpireHero[];
  onAddItem: (item: Item) => void;
}

export function SpireProvider({ children, unlockedHeroes, onAddItem }: SpireProviderProps) {
  const [state, setState] = useState<SpireState>({
    currentFloor: 1,
    highScore: parseInt(localStorage.getItem('spire_highscore') || '1'),
    selectedHero: null,
    currentEnemy: generateEnemy(1),
    playerHp: 100,
    playerMaxHp: 100,
    energy: 100,
    maxEnergy: 100,
    healCooldown: 0,
    combatLog: [],
    isInCombat: false,
    showVictoryScreen: false,
    pendingLoot: [],
    screenShake: false,
  });

  const loadSpireState = (newState: Partial<SpireState>) => {
      if (newState) {
          console.log("Loading Cloud Save for Spire...");
          setState(prev => ({
              ...prev,
              currentFloor: newState.currentFloor || 1,
              highScore: newState.highScore || prev.highScore,
              selectedHero: null,
              currentEnemy: generateEnemy(newState.currentFloor || 1),
              playerHp: 100,
              isInCombat: false
          }));
      }
  };

  const getCounterFaction = useCallback((enemyFaction: Faction): Faction => {
    const entry = Object.entries(FACTION_EFFECTIVENESS).find(
      ([_, value]) => value.strongAgainst === enemyFaction
    );
    return entry ? (entry[0] as Faction) : 'Neutral';
  }, []);

  const hasCounterBonus = useCallback((): boolean => {
    if (!state.selectedHero || !state.currentEnemy) return false;
    return FACTION_EFFECTIVENESS[state.selectedHero.faction]?.strongAgainst === state.currentEnemy.faction;
  }, [state.selectedHero, state.currentEnemy]);

  const selectHero = useCallback((hero: SpireHero) => {
    setState(prev => ({
      ...prev,
      selectedHero: hero,
      playerHp: hero.maxHp,
      playerMaxHp: hero.maxHp,
      isInCombat: true,
    }));
  }, []);

  const clearHero = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedHero: null,
      isInCombat: false,
    }));
  }, []);

  const startCombat = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInCombat: true,
    }));
  }, []);

  const addCombatLog = useCallback((log: Omit<CombatLog, 'id' | 'timestamp'>) => {
    const newLog: CombatLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    setState(prev => ({
      ...prev,
      combatLog: [...prev.combatLog.slice(-20), newLog], // Keep last 20 logs
    }));
  }, []);

  const triggerScreenShake = useCallback(() => {
    setState(prev => ({ ...prev, screenShake: true }));
    setTimeout(() => {
      setState(prev => ({ ...prev, screenShake: false }));
    }, 300);
  }, []);

  // UPDATED: Now accepts multiplier float
  const performAttack = useCallback((aimMultiplier: number) => {
    if (!state.selectedHero || !state.currentEnemy) return;
    
    // Attack Cost
    const energyCost = 10;
    if (state.energy < energyCost) {
        // Option: Fail or just do weak attack? Let's prevent attack
        // Assuming UI disables it, but just in case:
        addCombatLog({ type: 'defeat', message: 'Not enough Energy!' });
        return;
    }

    const hasBonus = hasCounterBonus();
    const heroPower = state.selectedHero.power;
    const enemyDef = state.currentEnemy.defense;
    
    // New Formula: (Hero.PWR * AimMultiplier) - (Enemy.DEF * 0.5)
    // Add faction bonus to power
    const powerWithFaction = hasBonus ? heroPower * 1.2 : heroPower;
    
    let rawDamage = (powerWithFaction * aimMultiplier) - (enemyDef * 0.5);
    rawDamage = Math.max(1, Math.floor(rawDamage)); // Minimum 1 dmg
    
    const newEnemyHp = Math.max(0, state.currentEnemy.currentHp - rawDamage);
    
    // Log attack
    const isCrit = aimMultiplier > 1.5; // Gold Zone
    
    addCombatLog({
      type: isCrit ? 'critical' : 'attack',
      message: isCrit 
        ? `💥 CRITICAL! ${state.selectedHero.name} deals ${rawDamage}!`
        : `⚔️ ${state.selectedHero.name} hits for ${rawDamage}.`,
      damage: rawDamage,
    });

    if (isCrit) {
      triggerScreenShake();
    }

    // Check victory
    if (newEnemyHp <= 0) {
      const loot = generateLoot(state.currentEnemy.lootTable);
      setState(prev => ({
        ...prev,
        currentEnemy: { ...prev.currentEnemy!, currentHp: 0 },
        showVictoryScreen: true,
        pendingLoot: loot,
        highScore: Math.max(prev.highScore, prev.currentFloor),
        energy: prev.energy - energyCost,
      }));
      localStorage.setItem('spire_highscore', String(Math.max(state.highScore, state.currentFloor)));
      addCombatLog({
        type: 'victory',
        message: `🏆 Victory! ${state.currentEnemy.name} defeated!`,
      });
      return;
    }

    // Enemy counter-attack (Turn Based)
    const variance = 0.8 + Math.random() * 0.4;
    const enemyMitigation = state.selectedHero.defense > 0 ? (100 / (100 + state.selectedHero.defense)) : 1;
    const enemyDamage = Math.max(1, Math.floor(state.currentEnemy.attack * variance * enemyMitigation));
    
    const newPlayerHp = Math.max(0, state.playerHp - enemyDamage);

    setState(prev => ({
      ...prev,
      currentEnemy: { ...prev.currentEnemy!, currentHp: newEnemyHp },
      playerHp: newPlayerHp,
      healCooldown: Math.max(0, prev.healCooldown - 1),
      energy: Math.max(0, prev.energy - energyCost),
    }));

    addCombatLog({
      type: 'enemy_attack',
      message: `👊 ${state.currentEnemy.name} hits back for ${enemyDamage}!`,
      damage: enemyDamage,
    });

    if (newPlayerHp <= 0) {
      addCombatLog({
        type: 'defeat',
        message: `💀 Defeat! ${state.selectedHero.name} has fallen...`,
      });
    }
  }, [state, hasCounterBonus, addCombatLog, triggerScreenShake]);

  const performHeal = useCallback(() => {
    if (state.healCooldown > 0 || state.energy < 30) return;
    
    const healAmount = Math.floor(state.playerMaxHp * 0.35);
    const newHp = Math.min(state.playerMaxHp, state.playerHp + healAmount);
    
    setState(prev => ({
      ...prev,
      playerHp: newHp,
      energy: prev.energy - 30,
      healCooldown: 3, // Cooldown in turns
    }));

    addCombatLog({
      type: 'heal',
      message: `💚 Repaired systems for ${healAmount} HP!`,
    });

    // Enemy still attacks after heal
    if (state.currentEnemy && state.selectedHero) {
      const variance = 0.8 + Math.random() * 0.4;
      const enemyMitigation = state.selectedHero.defense > 0 ? (100 / (100 + state.selectedHero.defense)) : 1;
      const enemyDamage = Math.max(1, Math.floor(state.currentEnemy.attack * variance * enemyMitigation));
      
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          playerHp: Math.max(0, prev.playerHp - enemyDamage),
        }));
        addCombatLog({
          type: 'enemy_attack',
          message: `👊 ${state.currentEnemy!.name} interrupts for ${enemyDamage}!`,
          damage: enemyDamage,
        });
      }, 400);
    }
  }, [state, addCombatLog]);

  const nextFloor = useCallback(() => {
    const newFloor = state.currentFloor + 1;
    setState(prev => ({
      ...prev,
      currentFloor: newFloor,
      currentEnemy: generateEnemy(newFloor),
      showVictoryScreen: false,
      pendingLoot: [],
      energy: Math.min(prev.maxEnergy, prev.energy + 20),
      combatLog: [],
    }));
  }, [state.currentFloor]);

  const collectLoot = useCallback(() => {
    const loot = [...state.pendingLoot];
    state.pendingLoot.forEach(item => {
      onAddItem(item);
    });
    return loot;
  }, [state.pendingLoot, onAddItem]);

  const resetSpire = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentFloor: 1,
      selectedHero: null,
      currentEnemy: generateEnemy(1),
      playerHp: 100,
      playerMaxHp: 100,
      energy: 100,
      healCooldown: 0,
      combatLog: [],
      isInCombat: false,
      showVictoryScreen: false,
      pendingLoot: [],
    }));
  }, []);

  const value: SpireContextType = {
    ...state,
    selectHero,
    clearHero,
    startCombat,
    performAttack,
    performHeal,
    nextFloor,
    resetSpire,
    collectLoot,
    triggerScreenShake,
    addCombatLog,
    getCounterFaction,
    hasCounterBonus,
    loadSpireState,
  };

  return <SpireContext.Provider value={value}>{children}</SpireContext.Provider>;
}

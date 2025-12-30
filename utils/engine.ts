
import { BuildingState, Resources, BuildingDefinition, ResourceType } from '../types/economy';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { Hero } from '../types';

/**
 * ENGINE: Pure functions for game logic.
 */

// 1. Calculate Cost for NEXT Level
export const calculateCost = (def: BuildingDefinition, currentLevel: number): Resources => {
  // Logic: Cost to go FROM currentLevel TO currentLevel + 1
  const multiplier = Math.pow(def.costGrowth, currentLevel);
  
  return {
    credits: Math.floor((def.baseCost.credits || 0) * multiplier),
    biomass: Math.floor((def.baseCost.biomass || 0) * multiplier),
    nanosteel: Math.floor((def.baseCost.nanosteel || 0) * multiplier),
    gems: 0
  };
};

// 2. Calculate Production Rate (Per Hour) for CURRENT Level
// Updated to support Hero Synergy
export const calculateProduction = (def: BuildingDefinition, currentLevel: number, assignedHero?: Hero): Resources => {
  const result: Resources = { credits: 0, biomass: 0, nanosteel: 0, gems: 0 };
  
  if (!def.baseProduction || !def.resource || !def.prodGrowth) return result;

  // Formula: Base * (Growth ^ (Level - 1))
  const multiplier = Math.pow(def.prodGrowth, Math.max(0, currentLevel - 1));
  let amount = Math.floor(def.baseProduction * multiplier);

  // Apply Hero Bonus
  if (assignedHero) {
      // Base Bonus: 1% per 10 Intelligence
      // Example: 80 INT = +8%
      let heroBonus = 1 + (assignedHero.powerstats.intelligence / 1000);
      
      // Specialty Bonus: Flat +20% if specialty matches
      // Production buildings need PROD specialty
      if (def.type === 'PRODUCTION' && assignedHero.specialty === 'PROD') {
          heroBonus += 0.2;
      }
      // Military/Utility/Research logic can be added here
      
      amount = Math.floor(amount * heroBonus);
  }

  if (def.resource === 'credits') result.credits = amount;
  if (def.resource === 'biomass') result.biomass = amount;
  if (def.resource === 'nanosteel') result.nanosteel = amount;
  if (def.resource === 'gems') result.gems = amount;

  return result;
};

// 3. Calculate Storage Capacity
export const calculateStorageCap = (buildings: BuildingState[]): Resources => {
    // Base Caps
    const caps: Resources = {
        credits: 10000,
        biomass: 5000,
        nanosteel: 5000,
        gems: 999999999 // Gems are usually unlimited
    };

    buildings.forEach(b => {
        const def = BUILDING_DEFINITIONS[b.type];
        if (def && def.storageResource && def.baseCapacity && def.capGrowth && b.level > 0 && b.status === 'IDLE') {
            const multiplier = Math.pow(def.capGrowth, b.level - 1);
            const extraCap = Math.floor(def.baseCapacity * multiplier);
            
            if (def.storageResource === 'credits') caps.credits += extraCap;
            if (def.storageResource === 'biomass') caps.biomass += extraCap;
            if (def.storageResource === 'nanosteel') caps.nanosteel += extraCap;
        }
    });

    return caps;
};

// 4. Calculate Build Time (Seconds) for NEXT Level
export const calculateBuildTime = (def: BuildingDefinition, currentLevel: number): number => {
  // Linear for first few levels to keep game fast
  if (currentLevel < 3) return def.baseTime * currentLevel;

  // Exponential afterwards
  const multiplier = Math.pow(def.timeGrowth, currentLevel - 1);
  return Math.floor(def.baseTime * multiplier);
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
};

// 5. XP & Leveling Logic
export const calculateXpToNextLevel = (level: number): number => {
    // Formula: 500 * (Level ^ 1.5)
    return Math.floor(500 * Math.pow(level, 1.5));
};

export const calculateXpGain = (building: BuildingState): number => {
    // XP per second based on building level. 
    // Higher tier buildings could give more, simple for now.
    // e.g. Level 1 = 1 XP/s, Level 10 = 10 XP/s
    return Math.max(1, building.level);
};

// Checks if hero levels up and returns updated stats
export const processHeroLevelUp = (hero: Hero): Hero => {
    let h = { ...hero };
    
    // Level up as long as we have enough XP
    while (h.currentXp >= h.xpToNextLevel) {
        h.currentXp -= h.xpToNextLevel;
        h.level += 1;
        h.xpToNextLevel = calculateXpToNextLevel(h.level);
        
        // Boost Stats (5% per level)
        const factor = 1.05;
        h.powerstats = {
            intelligence: Math.ceil(h.powerstats.intelligence * factor),
            strength: Math.ceil(h.powerstats.strength * factor),
            speed: Math.ceil(h.powerstats.speed * factor),
            durability: Math.ceil(h.powerstats.durability * factor),
            power: Math.ceil(h.powerstats.power * factor),
            combat: Math.ceil(h.powerstats.combat * factor),
        };
        
        // Rank up every 10 levels
        if (h.level % 10 === 0) {
            h.rank = Math.min(5, h.rank + 1);
        }
    }
    return h;
};

// 6. Calculate Offline Production (Updated with Caps)
const MAX_OFFLINE_SECONDS = 12 * 60 * 60; // 12 Hours Cap

export const calculateOfflineProduction = (
  buildings: BuildingState[],
  lastSaveTime: number
): { resources: Resources, seconds: number } => {
  const now = Date.now();
  const diff = (now - lastSaveTime) / 1000;
  
  if (diff < 10) return { resources: { credits: 0, biomass: 0, nanosteel: 0, gems: 0 }, seconds: 0 };

  const secondsCalculated = Math.min(diff, MAX_OFFLINE_SECONDS);
  
  let totalCredits = 0;
  let totalBiomass = 0;
  let totalNanosteel = 0;

  buildings.forEach(b => {
    // Only finished buildings produce
    if (b.status === 'IDLE' || (b.finishTime && b.finishTime < now)) {
        const def = BUILDING_DEFINITIONS[b.type];
        if (def && def.baseProduction) {
            // Note: Offline prod currently ignores hero bonus for simplicity/safety,
            // or we would need to pass heroes here too. For MVP, base prod is fine.
            const prodPerHour = calculateProduction(def, b.level);
            
            // Production per second * seconds offline
            totalCredits += (prodPerHour.credits / 3600) * secondsCalculated;
            totalBiomass += (prodPerHour.biomass / 3600) * secondsCalculated;
            totalNanosteel += (prodPerHour.nanosteel / 3600) * secondsCalculated;
        }
    }
  });

  return {
    resources: {
        credits: Math.floor(totalCredits),
        biomass: Math.floor(totalBiomass),
        nanosteel: Math.floor(totalNanosteel),
        gems: 0
    },
    seconds: Math.floor(secondsCalculated)
  };
};

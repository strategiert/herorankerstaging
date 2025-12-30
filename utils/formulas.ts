
import { BuildingType, Resources } from '../types/economy';

// Base Configuration
const COST_GROWTH_FACTOR = 1.5; // Costs increase by 50% per level
const TIME_GROWTH_FACTOR = 1.6; // Time increases by 60% per level after base threshold

// Base Costs (Level 1)
const BASE_COSTS: Record<BuildingType, Partial<Resources>> = {
  [BuildingType.COMMAND_CENTER]: { nanosteel: 500, credits: 500 },
  [BuildingType.SHIELD_GENERATOR]: { nanosteel: 1000 },
  [BuildingType.HYDROPONICS]: { credits: 100 },
  [BuildingType.NANO_FOUNDRY]: { credits: 100, biomass: 50 },
  [BuildingType.CREDIT_TERMINAL]: { nanosteel: 100 },
  [BuildingType.BARRACKS]: { nanosteel: 200, biomass: 200 },
  [BuildingType.MED_BAY]: { nanosteel: 150, biomass: 100 },
  [BuildingType.RADAR_STATION]: { nanosteel: 300, credits: 300 },
  [BuildingType.TECH_LAB]: { nanosteel: 500, credits: 1000 },
  [BuildingType.ALLIANCE_HUB]: { nanosteel: 1000, credits: 1000 },
  
  // Storage
  [BuildingType.NANO_VAULT]: { credits: 200, nanosteel: 100 },
  [BuildingType.BIO_SILO]: { credits: 200, nanosteel: 100 },
  
  // Factories
  [BuildingType.TERRA_FACTORY]: { nanosteel: 500, credits: 200 },
  [BuildingType.AERO_DOCK]: { nanosteel: 400, credits: 300 },
  [BuildingType.CYBER_UPLINK]: { nanosteel: 300, credits: 400 },
  
  // Missing Types
  [BuildingType.SOLARIS_CITADEL]: { nanosteel: 1500 },
  [BuildingType.TERRAGUARD_BUNKER]: { nanosteel: 1500 },
  [BuildingType.MECHANOID_FACTORY]: { nanosteel: 1500 },
  [BuildingType.WORKSHOP]: { credits: 1000 },
  [BuildingType.TITAN_FACTORY]: { nanosteel: 2000, credits: 1000 },
};

// Base Production per Hour (Level 1)
const BASE_PRODUCTION: Record<BuildingType, Partial<Resources>> = {
  [BuildingType.HYDROPONICS]: { biomass: 600 },
  [BuildingType.NANO_FOUNDRY]: { nanosteel: 300 },
  [BuildingType.CREDIT_TERMINAL]: { credits: 150 },
  
  // Non-production buildings return empty
  [BuildingType.COMMAND_CENTER]: {},
  [BuildingType.SHIELD_GENERATOR]: {},
  [BuildingType.BARRACKS]: {},
  [BuildingType.MED_BAY]: {},
  [BuildingType.RADAR_STATION]: {},
  [BuildingType.TECH_LAB]: {},
  [BuildingType.ALLIANCE_HUB]: {},
  
  // Storage
  [BuildingType.NANO_VAULT]: {},
  [BuildingType.BIO_SILO]: {},
  
  // Factories
  [BuildingType.TERRA_FACTORY]: {},
  [BuildingType.AERO_DOCK]: {},
  [BuildingType.CYBER_UPLINK]: {},
  
  // Missing Types
  [BuildingType.SOLARIS_CITADEL]: {},
  [BuildingType.TERRAGUARD_BUNKER]: {},
  [BuildingType.MECHANOID_FACTORY]: {},
  [BuildingType.WORKSHOP]: {},
  [BuildingType.TITAN_FACTORY]: {},
};

// Base Build Time in Seconds (Level 1)
const BASE_BUILD_TIME = 10; 

/**
 * Calculates the resource cost for the NEXT level (currentLevel + 1)
 */
export const calculateBuildingCost = (type: BuildingType, currentLevel: number): Resources => {
  const base = BASE_COSTS[type];
  const multiplier = Math.pow(COST_GROWTH_FACTOR, currentLevel);

  return {
    credits: Math.floor((base.credits || 0) * multiplier),
    biomass: Math.floor((base.biomass || 0) * multiplier),
    nanosteel: Math.floor((base.nanosteel || 0) * multiplier),
    gems: 0,
  };
};

/**
 * Calculates production per hour for a specific level
 */
export const calculateProductionRate = (type: BuildingType, level: number): Partial<Resources> => {
  const base = BASE_PRODUCTION[type];
  if (!base) return {};

  // Production grows slightly slower than cost (e.g., 1.2x per level)
  const multiplier = Math.pow(1.2, level - 1);

  const result: Partial<Resources> = {};
  if (base.credits) result.credits = Math.floor(base.credits * multiplier);
  if (base.biomass) result.biomass = Math.floor(base.biomass * multiplier);
  if (base.nanosteel) result.nanosteel = Math.floor(base.nanosteel * multiplier);
  
  return result;
};

/**
 * Calculates build time in seconds for the NEXT level
 * Level 1->2: 10s
 * Level 10->11: ~1 hour
 * Level 20->21: ~24 hours
 * Level 30: ~14 days
 */
export const calculateBuildTime = (currentLevel: number): number => {
  // Linear ramp up for first 5 levels to keep it snappy for new players
  if (currentLevel < 5) {
    return BASE_BUILD_TIME * currentLevel;
  }

  // Exponentional ramp up
  // Formula tuned to reach approx 14 days (1,209,600s) at level 30
  // t = 10 * 1.6^(level) 
  return Math.floor(BASE_BUILD_TIME * Math.pow(TIME_GROWTH_FACTOR, currentLevel - 4));
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
};

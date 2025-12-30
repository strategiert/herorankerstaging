
import { Hero } from '../types';

export interface Resources {
  credits: number;
  biomass: number;
  nanosteel: number;
  gems: number;
}

export type ResourceType = 'credits' | 'biomass' | 'nanosteel' | 'gems';

export enum BuildingType {
  // CORE
  COMMAND_CENTER = 'COMMAND_CENTER', // Neuronale Zitadelle
  
  // PRODUCTION (Economy)
  NANO_FOUNDRY = 'NANO_FOUNDRY', // Quanten-Schmelze
  HYDROPONICS = 'HYDROPONICS',   // Bio-Reaktor (renamed visual)
  CREDIT_TERMINAL = 'CREDIT_TERMINAL', // Handels-Link
  
  // STORAGE
  NANO_VAULT = 'NANO_VAULT', // Zentralspeicher
  BIO_SILO = 'BIO_SILO',
  
  // DEFENSE & FACTIONS (The new TD Buildings)
  SHIELD_GENERATOR = 'SHIELD_GENERATOR', // Aegis-Kern
  SOLARIS_CITADEL = 'SOLARIS_CITADEL',
  TERRAGUARD_BUNKER = 'TERRAGUARD_BUNKER',
  MECHANOID_FACTORY = 'MECHANOID_FACTORY',
  
  // DEVELOPMENT
  TECH_LAB = 'TECH_LAB',
  CYBER_UPLINK = 'CYBER_UPLINK', // Cyber-Netzknoten (Cards)
  WORKSHOP = 'WORKSHOP', // Fertigungs-Werk (Items)
  
  // MILITARY (Units/Heroes)
  BARRACKS = 'BARRACKS', // Klon-Replikator
  TITAN_FACTORY = 'TITAN_FACTORY', // Titan-Werk
  ALLIANCE_HUB = 'ALLIANCE_HUB', // Spire-Portal
  
  // LEGACY/MISC
  MED_BAY = 'MED_BAY',
  RADAR_STATION = 'RADAR_STATION',
  AERO_DOCK = 'AERO_DOCK',
  TERRA_FACTORY = 'TERRA_FACTORY' 
}

export type BuildingCategory = 
  | 'HQ' 
  | 'PRODUCTION' 
  | 'STORAGE' 
  | 'MILITARY' 
  | 'DEFENSE' 
  | 'UTILITY' 
  | 'RESEARCH';

export type BuildingStatus = 'IDLE' | 'UPGRADING';

export interface BuildingState {
  id: string; // Unique Instance ID (e.g. "hydro_1")
  type: BuildingType;
  level: number;
  status: BuildingStatus;
  finishTime?: number; // Timestamp in ms when upgrade finishes
  activeSkin?: string; // ID of the equipped skin
  slotId: string; // The map slot where this building is placed
}

export interface BuildingDefinition {
  id: string;
  name: string;
  description: string;
  type: BuildingCategory;
  maxLevel: number;
  baseCost: Partial<Record<ResourceType, number>>;
  costGrowth: number;
  baseTime: number; // in seconds
  timeGrowth: number;
  baseProduction?: number; // Amount per hour at lvl 1
  prodGrowth?: number;
  resource?: ResourceType; // Which resource it produces
  baseCapacity?: number;
  capGrowth?: number;
  storageResource?: ResourceType;
  unitType?: 'terraguard' | 'aero' | 'cyber';
  statBonus?: string;
  maxCount?: number; // Optional limit
}

export interface TroopState {
  count: number;
  tier: number;
  wounded: number;
}

export interface GameState {
  resources: Resources;
  buildings: BuildingState[];
  troops: TroopState;
  builderDroids: number;
  lastSaveTime: number;
  heroes: Hero[]; // NOW CENTRALIZED HERE
  unlockedSkins: string[]; // List of purchased skin IDs
  totalHeroes?: number;
}

// START RESOURCES
export const INITIAL_RESOURCES: Resources = {
  credits: 5000,
  biomass: 5000,
  nanosteel: 2500,
  gems: 100
};
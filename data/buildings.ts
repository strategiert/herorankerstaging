
import { BuildingDefinition, BuildingType } from '../types/economy';

export const BUILDING_DEFINITIONS: Record<string, BuildingDefinition> = {
  // --- 1. CORE ---
  [BuildingType.COMMAND_CENTER]: {
    id: 'COMMAND_CENTER',
    name: 'Neuronale Zitadelle',
    description: 'Das Herz der Basis. Bestimmt maximale Systemkapazität und Level-Limits.',
    type: 'HQ',
    maxLevel: 30,
    baseCost: { nanosteel: 500, biomass: 500 },
    costGrowth: 1.65,
    baseTime: 10,
    timeGrowth: 1.55,
    maxCount: 1
  },

  // --- 2. ECONOMY ---
  [BuildingType.NANO_FOUNDRY]: {
    id: 'NANO_FOUNDRY',
    name: 'Quanten-Schmelze',
    description: 'Generiert Nanosteel für den Bau und Upgrades von Türmen im Invasion Protocol.',
    type: 'PRODUCTION',
    resource: 'nanosteel',
    maxLevel: 30,
    baseCost: { credits: 100 },
    costGrowth: 1.65,
    baseTime: 5,
    timeGrowth: 1.5,
    baseProduction: 100,
    prodGrowth: 1.45,
    maxCount: 5
  },
  [BuildingType.HYDROPONICS]: { // Remapped from Bio-Farm to Bio-Reaktor logic
    id: 'HYDROPONICS',
    name: 'Bio-Reaktor',
    description: 'Produziert Biomasse für Helden-Training und Schild-Energie.',
    type: 'PRODUCTION',
    resource: 'biomass',
    maxLevel: 30,
    baseCost: { credits: 100 },
    costGrowth: 1.65,
    baseTime: 5,
    timeGrowth: 1.5,
    baseProduction: 100,
    prodGrowth: 1.45,
    maxCount: 5
  },
  [BuildingType.CREDIT_TERMINAL]: {
    id: 'CREDIT_TERMINAL',
    name: 'Handels-Link',
    description: 'Erzeugt Credits für Forschung und Crafting.',
    type: 'PRODUCTION',
    resource: 'credits',
    maxLevel: 30,
    baseCost: { nanosteel: 80 },
    costGrowth: 1.5,
    baseTime: 15,
    timeGrowth: 1.3,
    baseProduction: 120,
    prodGrowth: 1.35,
    maxCount: 5
  },
  [BuildingType.NANO_VAULT]: { // Consolidated Storage
    id: 'NANO_VAULT',
    name: 'Zentralspeicher',
    description: 'Definiert das Ressourcen-Cap für Nanosteel und Biomasse.',
    type: 'STORAGE',
    storageResource: 'nanosteel', // Simplifying for display, handles logic internally
    maxLevel: 30,
    baseCost: { credits: 500 },
    costGrowth: 1.5,
    baseTime: 60,
    timeGrowth: 1.4,
    baseCapacity: 10000,
    capGrowth: 1.6,
    maxCount: 3
  },

  // --- 3. DEVELOPMENT & RESEARCH ---
  [BuildingType.TECH_LAB]: {
    id: 'TECH_LAB',
    name: 'Tech-Lab',
    description: 'Forschungstree. Investiere Credits für permanente Boni auf Turm-Schaden und Reichweite.',
    type: 'RESEARCH',
    maxLevel: 30,
    baseCost: { nanosteel: 1000, biomass: 1000 },
    costGrowth: 1.7,
    baseTime: 1200,
    timeGrowth: 1.5,
    maxCount: 1
  },
  [BuildingType.CYBER_UPLINK]: {
    id: 'CYBER_UPLINK',
    name: 'Cyber-Netzknoten',
    description: 'Verwaltet das Card-Loot-System. Upgrades verbessern Kartenqualität.',
    type: 'UTILITY',
    maxLevel: 20,
    baseCost: { nanosteel: 800 },
    costGrowth: 1.6,
    baseTime: 600,
    timeGrowth: 1.5,
    maxCount: 1
  },
  [BuildingType.WORKSHOP]: {
    id: 'WORKSHOP',
    name: 'Fertigungs-Werk',
    description: 'Crafting-Station für Helden-Waffen und Chips.',
    type: 'PRODUCTION',
    maxLevel: 20,
    baseCost: { credits: 1000 },
    costGrowth: 1.6,
    baseTime: 900,
    timeGrowth: 1.5,
    maxCount: 1
  },

  // --- 4. FACTIONS & DEFENSE ---
  [BuildingType.SHIELD_GENERATOR]: {
    id: 'SHIELD_GENERATOR',
    name: 'Aegis-Kern',
    description: 'Bestimmt Festungs-HP, Schildstärke und Start-Energie im Invasion Protocol.',
    type: 'DEFENSE',
    maxLevel: 30,
    baseCost: { nanosteel: 200 },
    costGrowth: 1.65,
    baseTime: 60,
    timeGrowth: 1.52,
    maxCount: 1
  },
  [BuildingType.SOLARIS_CITADEL]: {
    id: 'SOLARIS_CITADEL',
    name: 'Solaris-Zitadelle',
    description: 'Schaltet Energie-Waffen und Laser-Türme frei.',
    type: 'MILITARY',
    maxLevel: 10,
    baseCost: { nanosteel: 1500 },
    costGrowth: 1.8,
    baseTime: 1800,
    timeGrowth: 1.5,
    maxCount: 1
  },
  [BuildingType.TERRAGUARD_BUNKER]: {
    id: 'TERRAGUARD_BUNKER',
    name: 'Terraguard-Bollwerk',
    description: 'Schaltet ballistische Waffen und Raketen-Silos frei.',
    type: 'MILITARY',
    maxLevel: 10,
    baseCost: { nanosteel: 1500 },
    costGrowth: 1.8,
    baseTime: 1800,
    timeGrowth: 1.5,
    maxCount: 1
  },
  [BuildingType.MECHANOID_FACTORY]: {
    id: 'MECHANOID_FACTORY',
    name: 'Mechanoid-Fabrik',
    description: 'Spezialisiert auf autonome Systeme, Drohnen und Tesla-Spulen.',
    type: 'MILITARY',
    maxLevel: 10,
    baseCost: { nanosteel: 1500 },
    costGrowth: 1.8,
    baseTime: 1800,
    timeGrowth: 1.5,
    maxCount: 1
  },

  // --- 5. UNITS ---
  [BuildingType.BARRACKS]: {
    id: 'BARRACKS',
    name: 'Klon-Replikator',
    description: 'Schnelles Leveln von Helden-Kopien für Sektor-Verteidigung.',
    type: 'MILITARY',
    maxLevel: 30,
    baseCost: { biomass: 150 },
    costGrowth: 1.65,
    baseTime: 30,
    timeGrowth: 1.5,
    maxCount: 1
  },
  [BuildingType.TITAN_FACTORY]: {
    id: 'TITAN_FACTORY',
    name: 'Titan-Werk',
    description: 'Produziert mobile Verteidigungseinheiten.',
    type: 'MILITARY',
    maxLevel: 10,
    baseCost: { nanosteel: 2000, credits: 1000 },
    costGrowth: 1.8,
    baseTime: 3600,
    timeGrowth: 1.5,
    maxCount: 1
  },
  [BuildingType.ALLIANCE_HUB]: { // Spire Portal Mapping
    id: 'ALLIANCE_HUB',
    name: 'Spire-Portal',
    description: 'Zugang zu globalen Expeditionen und Boss-Raids.',
    type: 'UTILITY',
    maxLevel: 10,
    baseCost: { credits: 2000 },
    costGrowth: 1.8,
    baseTime: 3600,
    timeGrowth: 1.6,
    maxCount: 1
  },
  
  // Keep legacy needed for rendering loop safety but hidden mostly
  [BuildingType.BIO_SILO]: {
    id: 'BIO_SILO',
    name: 'Bio-Silo (Legacy)',
    description: 'Zusatzspeicher.',
    type: 'STORAGE',
    maxLevel: 1,
    baseCost: { credits: 100 },
    costGrowth: 1,
    baseTime: 10,
    timeGrowth: 1,
    maxCount: 0
  }
};

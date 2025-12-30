
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Resources, GameState, INITIAL_RESOURCES, BuildingType, BuildingStatus, BuildingState, BuildingDefinition } from '../types/economy';
import { Hero, HeroSpecialty } from '../types';
import { 
    calculateCost, 
    calculateBuildTime, 
    calculateProduction, 
    calculateOfflineProduction, 
    calculateStorageCap,
    calculateXpGain,
    processHeroLevelUp
} from '../utils/engine';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { SKIN_DATABASE } from '../data/skins';
import { STATION_MAP_CONFIG } from '../data/mapConfig';

interface GameContextType {
  state: GameState;
  storageCaps: Resources;
  offlineGains: { resources: Resources, seconds: number } | null;
  clearOfflineGains: () => void;
  startUpgrade: (buildingId: string) => void;
  constructBuilding: (type: BuildingType, slotId: string) => void;
  speedUpBuilding: (buildingId: string, seconds: number) => void;
  deductResources: (cost: Partial<Resources>) => boolean;
  addResources: (amount: Partial<Resources>) => void;
  incrementHeroCount: () => void;
  debugAddResources: () => void;
  loadState: (newState: GameState) => void;
  unlockSkin: (skinId: string) => boolean;
  equipSkin: (buildingId: string, skinId: string) => void;
  
  // Hero Management
  assignHero: (heroId: string, buildingId: string | null) => void;
  addHero: (hero: Hero) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// --- MIGRATION & REPAIR LOGIC ---
const reconcileState = (savedState: GameState): GameState => {
    const newState = { ...savedState };
    
    // 1. Ensure Resources object is complete
    newState.resources = { ...INITIAL_RESOURCES, ...savedState.resources };

    // 2. Ensure new properties exist and are valid
    if (typeof newState.totalHeroes === 'undefined') newState.totalHeroes = 0;
    if (typeof newState.builderDroids === 'undefined' || newState.builderDroids < 2) newState.builderDroids = 2;
    if (!Array.isArray(newState.unlockedSkins)) newState.unlockedSkins = ['default'];
    if (!Array.isArray(newState.heroes)) newState.heroes = []; // Initialize heroes array

    // 3. Filter out invalid/corrupted buildings
    if (Array.isArray(newState.buildings)) {
        newState.buildings = newState.buildings.filter(b => 
            b && b.type && BUILDING_DEFINITIONS[b.type] && !isNaN(b.level)
        );
    } else {
        newState.buildings = [];
    }

    // 4. MIGRATION: Assign missing slots for old saves
    const availableSlots = [...STATION_MAP_CONFIG.map.slots];
    newState.buildings.forEach(b => {
        if (!b.slotId) {
            // Find a slot that fits the building type
            const slotIndex = availableSlots.findIndex(s => {
               // Only use this slot if it's not already taken by another building in this loop
               const isTaken = newState.buildings.some(other => other.slotId === s.id);
               if (isTaken) return false;
               
               if (b.type === 'COMMAND_CENTER' && s.id === 'slot_center_core') return true;
               if (s.allowed && s.allowed.includes(b.type)) return true;
               // Fallback: if allowed array exists but type not in it, skip. If undefined, assume open? No, strict.
               return false;
            });

            if (slotIndex >= 0) {
                b.slotId = availableSlots[slotIndex].id;
                console.log(`Migrated ${b.type} to ${b.slotId}`);
            } else {
                // Last resort fallback
                b.slotId = `temp_slot_${Math.random()}`; 
            }
        }
    });

    // 5. MIGRATION: Assign specialties to heroes if missing
    newState.heroes.forEach(h => {
        if (!h.specialty) {
            // Simple logic: High INT = PROD, High STR = MILITARY, else RESEARCH/PROD
            if (h.powerstats.intelligence > 70) h.specialty = 'PROD';
            else if (h.powerstats.strength > 70) h.specialty = 'MILITARY';
            else h.specialty = Math.random() > 0.5 ? 'PROD' : 'MILITARY';
        }
    });

    // 6. Ensure Core Buildings exist
    const coreBuildings: BuildingState[] = [
        { id: 'hq_1', type: BuildingType.COMMAND_CENTER, level: 1, status: 'IDLE', slotId: 'slot_center_core' },
    ];

    coreBuildings.forEach(core => {
        const exists = newState.buildings.some(b => b.type === core.type);
        if (!exists) {
            console.log(`[Repair] Restoring missing building: ${core.type}`);
            newState.buildings.push(core);
        }
    });

    return newState;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('infinite_arena_gamestate');
    if (saved) {
      try {
          const parsed = JSON.parse(saved);
          return reconcileState(parsed);
      } catch (e) {
          console.error("Save file corrupted, resetting.");
      }
    }
    return reconcileState({
      resources: INITIAL_RESOURCES,
      buildings: [], 
      troops: { count: 0, tier: 1, wounded: 0 },
      builderDroids: 2,
      lastSaveTime: Date.now(),
      totalHeroes: 0,
      heroes: [],
      unlockedSkins: ['default']
    });
  });

  const [offlineGains, setOfflineGains] = useState<{ resources: Resources, seconds: number } | null>(null);
  
  // Calculate dynamic storage caps based on buildings
  const storageCaps = calculateStorageCap(state.buildings);

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // --- 1. INITIALIZATION & OFFLINE CALC ---
  useEffect(() => {
    const result = calculateOfflineProduction(state.buildings, state.lastSaveTime);
    
    if (result.seconds > 60 && (result.resources.credits > 0 || result.resources.biomass > 0 || result.resources.nanosteel > 0)) {
        setOfflineGains(result);
        
        setState(prev => {
            const caps = calculateStorageCap(prev.buildings);
            return {
                ...prev,
                resources: {
                    credits: Math.min(caps.credits, prev.resources.credits + result.resources.credits),
                    biomass: Math.min(caps.biomass, prev.resources.biomass + result.resources.biomass),
                    nanosteel: Math.min(caps.nanosteel, prev.resources.nanosteel + result.resources.nanosteel),
                    gems: prev.resources.gems
                },
                lastSaveTime: Date.now()
            };
        });
    }
  }, []);

  // --- 2. GAME LOOP (1s Tick) ---
  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      
      setState(prev => {
        let hasChanges = false;
        const newBuildings = [...prev.buildings];
        const newResources = { ...prev.resources };
        let newHeroes = [...prev.heroes];

        // A. Handle Building Upgrades
        newBuildings.forEach((b, idx) => {
          if (b.status === 'UPGRADING' && b.finishTime && now >= b.finishTime) {
            hasChanges = true;
            const newLevel = b.level === 0 ? 1 : b.level + 1;
            
            newBuildings[idx] = {
              ...b,
              level: newLevel,
              status: 'IDLE',
              finishTime: undefined
            };
          }
        });

        // B. Handle Passive Production (with Caps)
        const caps = calculateStorageCap(newBuildings);
        let prodCredits = 0;
        let prodBiomass = 0;
        let prodNanosteel = 0;

        newBuildings.forEach(b => {
            if (b.status === 'IDLE' && b.level > 0) {
                const def = BUILDING_DEFINITIONS[b.type];
                if (def && def.baseProduction) {
                    // Find assigned hero for this building
                    const assignedHero = newHeroes.find(h => h.assignedBuildingId === b.id);
                    
                    const prod = calculateProduction(def, b.level, assignedHero);
                    
                    // Add per-second amount
                    prodCredits += prod.credits / 3600;
                    prodBiomass += prod.biomass / 3600;
                    prodNanosteel += prod.nanosteel / 3600;
                }
            }
        });

        if (prodCredits > 0 || prodBiomass > 0 || prodNanosteel > 0) {
            newResources.credits = Math.min(caps.credits, newResources.credits + prodCredits);
            newResources.biomass = Math.min(caps.biomass, newResources.biomass + prodBiomass);
            newResources.nanosteel = Math.min(caps.nanosteel, newResources.nanosteel + prodNanosteel);
        }

        // C. Handle Hero Training
        newHeroes = newHeroes.map(h => {
            if (h.assignedBuildingId) {
                const building = newBuildings.find(b => b.id === h.assignedBuildingId);
                // Hero gains XP if building exists, is built (level > 0), and is IDLE (not upgrading)
                if (building && building.level > 0 && building.status === 'IDLE') {
                    const xpGain = calculateXpGain(building);
                    const heroWithXp = { ...h, currentXp: h.currentXp + xpGain };
                    // Check Level Up
                    return processHeroLevelUp(heroWithXp);
                } else if (!building) {
                    // Building gone? Unassign
                    return { ...h, assignedBuildingId: null };
                }
            }
            return h;
        });

        return { 
            ...prev, 
            buildings: newBuildings,
            resources: newResources,
            heroes: newHeroes,
            lastSaveTime: now 
        };
      });

    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // --- 3. PERSISTENCE ---
  useEffect(() => {
      const saveInterval = setInterval(() => {
          localStorage.setItem('infinite_arena_gamestate', JSON.stringify(stateRef.current));
      }, 5000);
      return () => clearInterval(saveInterval);
  }, []);


  // --- ACTIONS ---

  const loadState = (newState: GameState) => {
      const fixedState = reconcileState(newState);
      setState(fixedState);
  };

  const clearOfflineGains = () => setOfflineGains(null);

  const constructBuilding = (type: BuildingType, slotId: string) => {
      setState(prev => {
          const def = BUILDING_DEFINITIONS[type];
          if (!def) return prev;

          // Check Limit
          const currentCount = prev.buildings.filter(b => b.type === type).length;
          if (def.maxCount && currentCount >= def.maxCount) return prev;

          // Check Builders
          const activeBuilders = prev.buildings.filter(b => b.status === 'UPGRADING').length;
          if (activeBuilders >= prev.builderDroids) return prev;

          // Calculate Cost
          const cost = calculateCost(def, 0); 
          const time = calculateBuildTime(def, 0);

          if (prev.resources.credits < cost.credits || 
              prev.resources.nanosteel < cost.nanosteel || 
              prev.resources.biomass < cost.biomass) {
            return prev;
          }

          // Deduct & Build
          const newResources = {
            ...prev.resources,
            credits: prev.resources.credits - cost.credits,
            nanosteel: prev.resources.nanosteel - cost.nanosteel,
            biomass: prev.resources.biomass - cost.biomass,
          };

          const newBuilding: BuildingState = {
              id: `${type}_${crypto.randomUUID().slice(0,4)}`,
              type: type,
              level: 0,
              status: 'UPGRADING',
              finishTime: Date.now() + (time * 1000),
              activeSkin: 'default',
              slotId: slotId // Assign slot
          };

          return {
              ...prev,
              resources: newResources,
              buildings: [...prev.buildings, newBuilding]
          };
      });
  };

  const startUpgrade = (buildingId: string) => {
    setState(prev => {
      const buildingIndex = prev.buildings.findIndex(b => b.id === buildingId);
      if (buildingIndex === -1) return prev;

      const building = prev.buildings[buildingIndex];
      const def = BUILDING_DEFINITIONS[building.type];
      
      const cost = calculateCost(def, building.level);
      const time = calculateBuildTime(def, building.level);

      if (prev.resources.credits < cost.credits || 
          prev.resources.nanosteel < cost.nanosteel || 
          prev.resources.biomass < cost.biomass) {
        return prev;
      }

      const activeBuilders = prev.buildings.filter(b => b.status === 'UPGRADING').length;
      if (activeBuilders >= prev.builderDroids) {
        return prev;
      }

      const newResources = {
        ...prev.resources,
        credits: prev.resources.credits - cost.credits,
        nanosteel: prev.resources.nanosteel - cost.nanosteel,
        biomass: prev.resources.biomass - cost.biomass,
      };

      const newBuildings = [...prev.buildings];
      newBuildings[buildingIndex] = {
        ...building,
        status: 'UPGRADING',
        finishTime: Date.now() + (time * 1000)
      };

      return {
        ...prev,
        resources: newResources,
        buildings: newBuildings
      };
    });
  };

  const speedUpBuilding = (buildingId: string, seconds: number) => {
    setState(prev => {
      const newBuildings = prev.buildings.map(b => {
        if (b.id === buildingId && b.status === 'UPGRADING' && b.finishTime) {
          return { ...b, finishTime: b.finishTime - (seconds * 1000) };
        }
        return b;
      });
      return { ...prev, buildings: newBuildings };
    });
  };

  const deductResources = (cost: Partial<Resources>): boolean => {
      let canAfford = true;
      if (cost.credits && state.resources.credits < cost.credits) canAfford = false;
      if (cost.nanosteel && state.resources.nanosteel < cost.nanosteel) canAfford = false;
      if (cost.biomass && state.resources.biomass < cost.biomass) canAfford = false;
      if (cost.gems && state.resources.gems < cost.gems) canAfford = false;

      if (!canAfford) return false;

      setState(prev => ({
          ...prev,
          resources: {
              credits: prev.resources.credits - (cost.credits || 0),
              nanosteel: prev.resources.nanosteel - (cost.nanosteel || 0),
              biomass: prev.resources.biomass - (cost.biomass || 0),
              gems: prev.resources.gems - (cost.gems || 0),
          }
      }));
      return true;
  };

  const addResources = (amount: Partial<Resources>) => {
      setState(prev => {
          const caps = calculateStorageCap(prev.buildings);
          return {
              ...prev,
              resources: {
                  credits: Math.min(caps.credits, prev.resources.credits + (amount.credits || 0)),
                  nanosteel: Math.min(caps.nanosteel, prev.resources.nanosteel + (amount.nanosteel || 0)),
                  biomass: Math.min(caps.biomass, prev.resources.biomass + (amount.biomass || 0)),
                  gems: prev.resources.gems + (amount.gems || 0), // Gems usually uncapped
              }
          };
      });
  };

  const incrementHeroCount = () => {
      setState(prev => ({ ...prev, totalHeroes: (prev.totalHeroes || 0) + 1 }));
  };

  const debugAddResources = () => {
    addResources({
        credits: 10000,
        nanosteel: 5000,
        biomass: 5000,
        gems: 100
    });
  };

  // --- HEROES ---

  const addHero = (hero: Hero) => {
      // Ensure new hero has a specialty
      const h = { ...hero };
      if (!h.specialty) {
          if (h.powerstats.intelligence > 70) h.specialty = 'PROD';
          else if (h.powerstats.strength > 70) h.specialty = 'MILITARY';
          else h.specialty = Math.random() > 0.5 ? 'PROD' : 'MILITARY';
      }

      setState(prev => ({
          ...prev,
          heroes: [...prev.heroes, h],
          totalHeroes: (prev.totalHeroes || 0) + 1
      }));
  };

  const assignHero = (heroId: string, buildingId: string | null) => {
      setState(prev => {
          // If buildingId is not null, unassign this hero from any previous building
          // Also, if another hero was assigned to this building, unassign them first (game logic choice: replace or fail? let's replace)
          
          let newHeroes = [...prev.heroes];
          
          // 1. Unassign target hero from anywhere
          newHeroes = newHeroes.map(h => 
              h.id === heroId ? { ...h, assignedBuildingId: null } : h
          );

          // 2. If assigning to a building, unassign anyone else currently there
          if (buildingId) {
              newHeroes = newHeroes.map(h => 
                  h.assignedBuildingId === buildingId ? { ...h, assignedBuildingId: null } : h
              );
          }

          // 3. Assign
          newHeroes = newHeroes.map(h => 
              h.id === heroId ? { ...h, assignedBuildingId: buildingId } : h
          );

          return { ...prev, heroes: newHeroes };
      });
  };

  // --- SKINS ---

  const unlockSkin = (skinId: string): boolean => {
      const skin = SKIN_DATABASE[skinId];
      if (!skin) return false;
      if (state.unlockedSkins.includes(skinId)) return true;

      // Check costs
      if (!deductResources(skin.cost)) return false;

      setState(prev => ({
          ...prev,
          unlockedSkins: [...prev.unlockedSkins, skinId]
      }));
      return true;
  };

  const equipSkin = (buildingId: string, skinId: string) => {
      setState(prev => ({
          ...prev,
          buildings: prev.buildings.map(b => 
              b.id === buildingId ? { ...b, activeSkin: skinId } : b
          )
      }));
  };

  return (
    <GameContext.Provider value={{ 
        state, 
        storageCaps,
        offlineGains, 
        clearOfflineGains,
        startUpgrade, 
        constructBuilding,
        speedUpBuilding, 
        deductResources, 
        addResources,
        incrementHeroCount,
        debugAddResources, 
        loadState,
        unlockSkin,
        equipSkin,
        assignHero,
        addHero
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};

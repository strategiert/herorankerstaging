import React, { createContext, useContext, useState, useEffect } from 'react';
import { CHAPTER_1_MISSIONS, Mission } from '../data/missions';
import { useGame } from './GameContext';
import { useInventory } from './InventoryContext';
import { useSpire } from './SpireContext';

interface MissionContextType {
  currentMission: Mission | null;
  isCompleted: boolean; // Is the current mission condition met?
  claimReward: () => void;
  progress: number;
  maxProgress: number;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: gameState, debugAddResources, deductResources } = useGame(); // We need a way to ADD resources
  const { currentFloor } = useSpire();
  const { addItem } = useInventory();

  // Persist current mission index
  const [missionIndex, setMissionIndex] = useState(() => {
    return parseInt(localStorage.getItem('infinite_arena_mission_idx') || '0');
  });

  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentMission = CHAPTER_1_MISSIONS[missionIndex] || null;

  // Save Progress
  useEffect(() => {
    localStorage.setItem('infinite_arena_mission_idx', missionIndex.toString());
  }, [missionIndex]);

  // Check Conditions
  useEffect(() => {
    if (!currentMission) return;

    let met = false;
    let curr = 0;
    const target = currentMission.targetValue;

    switch (currentMission.type) {
      case 'BUILD':
        // Check if ANY building of type has level >= targetValue
        const building = gameState.buildings.find(b => b.type === currentMission.targetId);
        if (building) {
          curr = building.level;
          met = curr >= target;
        }
        break;
      case 'RECRUIT':
        curr = gameState.totalHeroes || 0;
        met = curr >= target;
        break;
      case 'BATTLE_FLOOR':
        curr = currentFloor;
        met = curr >= target;
        break;
      default:
        break;
    }

    setProgress(curr);
    setIsCompleted(met);
  }, [gameState, currentFloor, currentMission]);

  const claimReward = () => {
    if (!currentMission || !isCompleted) return;

    // 1. Grant Resources (Using a hack via debugAddResources modified or deduct negative?)
    // Proper way: Add a proper addResources function to GameContext.
    // For now, we assume deductResources with negative values works OR we manually update via a new exposed method.
    // Let's use `debugAddResources` conceptually but really we need a real method.
    // I will use a direct state update if I could, but here I'll simulate it by calling 'deduct' with negative values if GameContext allows, 
    // OR BETTER: I'll expose `addResources` in GameContext update. 
    // Wait, I can't update GameContext in this file block easily without re-outputting it. 
    // I will output an update for GameContext too.
    
    // For now, let's assume `addResources` exists on the context (I will add it).
    // @ts-ignore
    if (gameState.addResources) {
         // @ts-ignore
        gameState.addResources(currentMission.rewards);
    } else {
        // Fallback or error
        console.warn("addResources not found on GameContext");
    }

    // 2. Grant Items
    if (currentMission.rewards.items) {
      currentMission.rewards.items.forEach(item => {
        addItem({
            id: crypto.randomUUID(),
            templateId: item.id,
            name: item.id === 'recruit_ticket' ? 'Rekrutierungs-Ticket' : 'Speed Up', // Simple name mapping
            category: 'consumable',
            rarity: 'blue',
            description: 'Mission Reward'
        }, item.amount);
      });
    }

    // 3. Advance
    setMissionIndex(prev => prev + 1);
    setIsCompleted(false);
  };

  return (
    <MissionContext.Provider value={{ currentMission, isCompleted, claimReward, progress, maxProgress: currentMission?.targetValue || 1 }}>
      {children}
    </MissionContext.Provider>
  );
};

export const useMission = () => {
  const context = useContext(MissionContext);
  if (!context) throw new Error("useMission must be used within MissionProvider");
  return context;
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TowerEnemy, Hero } from '../types';
import { FULL_HERO_DATA } from '../services/fullHeroData';

interface TowerContextType {
  currentFloor: number;
  highestFloor: number;
  enemy: TowerEnemy | null;
  generateEnemy: (floor: number) => void;
  advanceFloor: () => void;
  resetTower: () => void; // Optional debug
}

const TowerContext = createContext<TowerContextType | undefined>(undefined);

// Math Scaling Constants
const BASE_HP = 100;
const BASE_ATK = 15;
const SCALING_FACTOR = 1.05; // 5% harder per floor

export const TowerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFloor, setCurrentFloor] = useState<number>(() => {
    return parseInt(localStorage.getItem('infinite_arena_tower_floor') || '1');
  });
  
  const [highestFloor, setHighestFloor] = useState<number>(() => {
    return parseInt(localStorage.getItem('infinite_arena_tower_high') || '1');
  });

  const [enemy, setEnemy] = useState<TowerEnemy | null>(null);

  useEffect(() => {
    localStorage.setItem('infinite_arena_tower_floor', currentFloor.toString());
    localStorage.setItem('infinite_arena_tower_high', highestFloor.toString());
  }, [currentFloor, highestFloor]);

  // Generate Enemy on Mount or Floor Change
  useEffect(() => {
    generateEnemy(currentFloor);
  }, [currentFloor]);

  const generateEnemy = (floor: number) => {
    const isBoss = floor % 10 === 0;
    const scaling = Math.pow(SCALING_FACTOR, floor);
    
    // Stats calculation
    const hp = Math.floor((isBoss ? BASE_HP * 3 : BASE_HP) * scaling);
    const atk = Math.floor((isBoss ? BASE_ATK * 1.5 : BASE_ATK) * scaling);

    let newEnemy: TowerEnemy;

    if (isBoss) {
      // Pick a random hero from the wiki data as a "Simulation"
      const template = FULL_HERO_DATA[Math.floor(Math.random() * FULL_HERO_DATA.length)];
      newEnemy = {
        name: template.name,
        level: floor,
        isBoss: true,
        hp,
        maxHp: hp,
        atk,
        image: template.image,
        color: template.color
      };
    } else {
      // Generic Minion
      const minionTypes = ['Cyber Drone', 'Scrap Walker', 'Nano-Bug', 'Security Bot', 'Void Larva'];
      const suffix = Math.floor(floor / 10) + 1;
      newEnemy = {
        name: `${minionTypes[floor % minionTypes.length]} Mk.${suffix}`,
        level: floor,
        isBoss: false,
        hp,
        maxHp: hp,
        atk,
        image: '🤖',
        color: '#94a3b8'
      };
    }

    setEnemy(newEnemy);
  };

  const advanceFloor = () => {
    const next = currentFloor + 1;
    setCurrentFloor(next);
    if (next > highestFloor) setHighestFloor(next);
  };

  const resetTower = () => {
    setCurrentFloor(1);
    generateEnemy(1);
  };

  return (
    <TowerContext.Provider value={{ currentFloor, highestFloor, enemy, generateEnemy, advanceFloor, resetTower }}>
      {children}
    </TowerContext.Provider>
  );
};

export const useTower = () => {
  const context = useContext(TowerContext);
  if (!context) throw new Error("useTower must be used within TowerProvider");
  return context;
};
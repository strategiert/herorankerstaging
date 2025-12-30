
import { Hero } from './types';

// --- GAMEPLAY ENTITIES ---

export type EntityType = 'HERO' | 'TOWER' | 'ENEMY' | 'PROJECTILE';
export type TowerPosition = 'L1' | 'L2' | 'R1' | 'R2'; // Left 1, Left 2, Right 1, Right 2

export interface Vector2 {
  x: number;
  y: number;
}

export interface GameEntity {
  id: string;
  type: EntityType;
  pos: Vector2;
  width: number;
  height: number;
  rotation: number;
  color: string;
}

export interface CombatEntity extends GameEntity {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  isDead: boolean;
}

// --- TOWER SYSTEM ---

export interface TowerConfig {
  id: string;
  name: string;
  type: 'BALLISTIC' | 'LASER' | 'AREA' | 'SUPPORT';
  baseDamage: number;
  fireRate: number; // ms cooldown
  range: number;
  color: string;
  icon: string;
}

export interface ActiveTower extends CombatEntity {
  configId: string;
  positionSlot: TowerPosition;
  level: number; // 1-5
  upgradeProgress: number; // 0-5 (5 micro upgrades = 1 Level)
  cooldown: number;
  targetId?: string | null;
}

// --- CARD SYSTEM ---

export interface UpgradeCard {
  id: string;
  title: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
  type: 'NEW_TOWER' | 'UPGRADE_TOWER' | 'HERO_BUFF';
  towerConfigId?: string; // If new tower
  targetSlot?: TowerPosition; // Where to put it
  statBoost?: { damage?: number, speed?: number };
}

// --- STATE MANAGEMENT ---

export interface InvasionGameState {
  status: 'MENU' | 'PLAYING' | 'PAUSED_LEVEL_UP' | 'GAME_OVER' | 'VICTORY';
  level: number; // 1-20
  xp: number;
  xpToNext: number; // Formula: Level * 1 (Linear scaling as requested)
  wave: number;
  hero: CombatEntity & { heroRef: Hero };
  towers: ActiveTower[];
  enemies: CombatEntity[];
  projectiles: (GameEntity & { damage: number, targetId?: string })[];
  availableCards: UpgradeCard[];
  time: number;
}

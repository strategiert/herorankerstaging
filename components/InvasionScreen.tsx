
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Zap, Crosshair, Hexagon, Pause, Play, RefreshCw, ChevronLeft, Target, Rocket } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { Hero } from '../types';
import { InvasionGameState, ActiveTower, CombatEntity, Vector2, UpgradeCard, TowerConfig, TowerPosition, GameEntity } from '../types/invasion';

// --- CONFIGURATION ---

const GAME_WIDTH = 100; // Percent
const GAME_HEIGHT = 100; // Percent
const HERO_Y = 85; // Position from top %
const SPAWN_Y = -5; // Spawn above screen

const TOWER_SLOTS: Record<TowerPosition, Vector2> = {
    'L1': { x: 20, y: 85 },
    'L2': { x: 10, y: 85 },
    'R1': { x: 80, y: 85 },
    'R2': { x: 90, y: 85 },
};

const TOWER_TYPES: Record<string, TowerConfig> = {
    'TURRET': { id: 'TURRET', name: 'Gauß-Geschütz', type: 'BALLISTIC', baseDamage: 10, fireRate: 800, range: 40, color: '#3b82f6', icon: '🔫' },
    'LASER': { id: 'LASER', name: 'Prisma-Laser', type: 'LASER', baseDamage: 5, fireRate: 200, range: 35, color: '#06b6d4', icon: '⚡' },
    'MISSILE': { id: 'MISSILE', name: 'Raketen-Silo', type: 'AREA', baseDamage: 40, fireRate: 2000, range: 60, color: '#f59e0b', icon: '🚀' },
};

// --- HELPER FUNCTIONS ---

const checkCollision = (a: Vector2, b: Vector2, radius: number) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return (dx * dx + dy * dy) < (radius * radius);
};

// --- COMPONENT ---

export const InvasionScreen = ({ onBack }: { onBack: () => void }) => {
    const { state: rootState } = useGame();
    
    // Initial Setup: Use the first hero or a dummy
    const initialHero = rootState.heroes[0] || {
        id: 'dummy',
        name: 'Commander',
        powerstats: { intelligence: 50, strength: 50, speed: 50, durability: 50, power: 50, combat: 50 },
        image: { url: '' }
    };

    // Game State Ref (Mutable for Game Loop performance)
    const gameState = useRef<InvasionGameState>({
        status: 'MENU',
        level: 1,
        xp: 0,
        xpToNext: 1, // Level 1 needs 1 kill to reach Level 2 (Interpretation: Lvl 2 needs 2 means start at 1 need 1?)
                     // Prompt: "lvl 2 braucht 2 Gegner". Assuming current Level = XP needed.
        wave: 1,
        hero: {
            id: 'hero',
            type: 'HERO',
            pos: { x: 50, y: HERO_Y },
            width: 8, height: 8,
            rotation: 0,
            color: '#ffffff',
            hp: initialHero.powerstats.durability * 10,
            maxHp: initialHero.powerstats.durability * 10,
            damage: initialHero.powerstats.power / 2,
            speed: 0,
            isDead: false,
            heroRef: initialHero as Hero
        },
        towers: [],
        enemies: [],
        projectiles: [],
        availableCards: [],
        time: 0
    });

    // React State for UI Updates (rendering loop sync)
    const [uiState, setUiState] = useState<number>(0); // Ticker to force re-render
    const [showCards, setShowCards] = useState(false);
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const lastMouseX = useRef(0); // Track mouse for sprite direction

    // --- GAME ENGINE ---

    const spawnEnemy = () => {
        const type = Math.random() > 0.8 ? 'COMET' : 'SHIP';
        const levelScaling = gameState.current.level;
        
        gameState.current.enemies.push({
            id: `enemy_${Date.now()}_${Math.random()}`,
            type: 'ENEMY',
            pos: { x: 10 + Math.random() * 80, y: SPAWN_Y },
            width: type === 'COMET' ? 6 : 5,
            height: type === 'COMET' ? 6 : 5,
            rotation: 180,
            color: type === 'COMET' ? '#ef4444' : '#a855f7',
            hp: 20 + (levelScaling * 10),
            maxHp: 20 + (levelScaling * 10),
            damage: 10 + levelScaling,
            speed: (type === 'COMET' ? 0.3 : 0.15) + (levelScaling * 0.01),
            isDead: false
        });
    };

    const generateCards = () => {
        const cards: UpgradeCard[] = [];
        const towerKeys = Object.keys(TOWER_TYPES);
        const slots: TowerPosition[] = ['L1', 'L2', 'R1', 'R2'];

        // Card 1: New Tower or Upgrade
        const emptySlots = slots.filter(s => !gameState.current.towers.find(t => t.positionSlot === s));
        
        if (emptySlots.length > 0) {
            const slot = emptySlots[0]; // Fill from inside out logic could go here
            const type = TOWER_TYPES[towerKeys[Math.floor(Math.random() * towerKeys.length)]];
            cards.push({
                id: `new_${Date.now()}`,
                title: `Baue ${type.name}`,
                description: `Platziere einen neuen Turm auf Position ${slot}.`,
                rarity: 'COMMON',
                type: 'NEW_TOWER',
                towerConfigId: type.id,
                targetSlot: slot
            });
        } else {
            // Upgrade existing
            const tower = gameState.current.towers[Math.floor(Math.random() * gameState.current.towers.length)];
            if (tower) {
                cards.push({
                    id: `upg_${Date.now()}`,
                    title: `Upgrade ${TOWER_TYPES[tower.configId].name}`,
                    description: `+20% Schaden für Turm auf ${tower.positionSlot}.`,
                    rarity: 'RARE',
                    type: 'UPGRADE_TOWER',
                    targetSlot: tower.positionSlot,
                    statBoost: { damage: Math.ceil(tower.damage * 0.2) }
                });
            }
        }

        // Card 2: Hero Buff
        cards.push({
            id: `hero_${Date.now()}`,
            title: 'Helden-Overclock',
            description: 'Erhöht den Schaden deines Helden um 15%.',
            rarity: 'COMMON',
            type: 'HERO_BUFF',
            statBoost: { damage: Math.ceil(gameState.current.hero.damage * 0.15) }
        });

        // Card 3: Random
        cards.push({
            id: `repair_${Date.now()}`,
            title: 'Nano-Reparatur',
            description: 'Heilt 30% der HP der Basis.',
            rarity: 'COMMON',
            type: 'HERO_BUFF', // Using hero buff type for ease, handled in logic
            statBoost: { damage: 0 } // Dummy
        });

        gameState.current.availableCards = cards;
        setShowCards(true);
        gameState.current.status = 'PAUSED_LEVEL_UP';
    };

    const handleCardSelect = (card: UpgradeCard) => {
        if (card.type === 'NEW_TOWER' && card.towerConfigId && card.targetSlot) {
            const conf = TOWER_TYPES[card.towerConfigId];
            gameState.current.towers.push({
                id: `tower_${Date.now()}`,
                type: 'TOWER',
                pos: TOWER_SLOTS[card.targetSlot],
                width: 6, height: 6, rotation: 0, color: conf.color,
                hp: 100, maxHp: 100, isDead: false, damage: conf.baseDamage, speed: 0,
                configId: conf.id,
                positionSlot: card.targetSlot,
                level: 1,
                upgradeProgress: 0,
                cooldown: 0
            });
        } else if (card.type === 'UPGRADE_TOWER' && card.targetSlot) {
            const tower = gameState.current.towers.find(t => t.positionSlot === card.targetSlot);
            if (tower) {
                tower.upgradeProgress += 1;
                if (tower.upgradeProgress >= 5) {
                    tower.level = Math.min(5, tower.level + 1);
                    tower.upgradeProgress = 0;
                    tower.damage *= 1.5; // Big jump on Level up
                } else {
                    tower.damage += (card.statBoost?.damage || 1);
                }
            }
        } else if (card.title === 'Nano-Reparatur') {
            gameState.current.hero.hp = Math.min(gameState.current.hero.maxHp, gameState.current.hero.hp + (gameState.current.hero.maxHp * 0.3));
        } else if (card.type === 'HERO_BUFF') {
            gameState.current.hero.damage += (card.statBoost?.damage || 5);
        }

        // Advance Level
        gameState.current.level += 1;
        gameState.current.xp = 0;
        gameState.current.xpToNext = gameState.current.level; // Lvl 2 needs 2 kills, Lvl 3 needs 3...
        
        setShowCards(false);
        gameState.current.status = 'PLAYING';
        
        if (gameState.current.level > 20) {
            gameState.current.status = 'VICTORY';
        }
    };

    const updateGame = (deltaTime: number) => {
        if (gameState.current.status !== 'PLAYING') return;

        gameState.current.time += deltaTime;

        // 1. Spawn Enemies (Simple timer)
        // Spawn rate increases with level
        const spawnRate = Math.max(500, 3000 - (gameState.current.level * 100));
        if (gameState.current.time % spawnRate < deltaTime) {
            spawnEnemy();
        }

        // 2. Move Enemies
        gameState.current.enemies.forEach(e => {
            e.pos.y += e.speed; // Move down
            // Collision with Hero Area
            if (e.pos.y > 80 && !e.isDead) {
                gameState.current.hero.hp -= e.damage;
                e.isDead = true; // Kamikaze
            }
        });

        // 3. Towers & Hero Fire
        const attackers = [gameState.current.hero, ...gameState.current.towers];
        attackers.forEach(atk => {
            // @ts-ignore
            if (atk.cooldown > 0) atk.cooldown -= deltaTime;
            else {
                // Find target
                // Hero shoots up (closest Y to him but < his Y)
                // Towers shoot closest distance
                const targets = gameState.current.enemies.filter(e => !e.isDead && e.pos.y < 85 && e.pos.y > 0);
                let target: CombatEntity | null = null;

                if (atk.type === 'HERO') {
                    // Hero targets random enemy in front
                    target = targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : null;
                } else {
                    // Tower targets closest
                    let minDist = 9999;
                    targets.forEach(t => {
                        const dist = Math.hypot(t.pos.x - atk.pos.x, t.pos.y - atk.pos.y);
                        if (dist < minDist) { minDist = dist; target = t; }
                    });
                }

                if (target) {
                    // Fire!
                    // @ts-ignore
                    atk.cooldown = atk.type === 'HERO' ? 500 : TOWER_TYPES[atk.configId].fireRate;
                    gameState.current.projectiles.push({
                        id: `proj_${Date.now()}_${Math.random()}`,
                        type: 'PROJECTILE',
                        pos: { x: atk.pos.x, y: atk.pos.y - 2 },
                        width: 1, height: 2, rotation: 0, color: atk.color,
                        damage: atk.damage,
                        targetId: target.id
                    });
                }
            }
        });

        // 4. Move Projectiles
        gameState.current.projectiles.forEach(p => {
            p.pos.y -= 1.5; // Move Up fast
            
            // Check Hits
            const hitEnemy = gameState.current.enemies.find(e => !e.isDead && checkCollision(p.pos, e.pos, e.width/2));
            if (hitEnemy) {
                hitEnemy.hp -= p.damage;
                p.pos.y = -100; // Remove proj
                
                if (hitEnemy.hp <= 0 && !hitEnemy.isDead) {
                    hitEnemy.isDead = true;
                    // XP Logic
                    gameState.current.xp += 1;
                    if (gameState.current.xp >= gameState.current.xpToNext) {
                        generateCards();
                    }
                }
            }
        });

        // 5. Cleanup
        gameState.current.enemies = gameState.current.enemies.filter(e => !e.isDead && e.pos.y < 100);
        gameState.current.projectiles = gameState.current.projectiles.filter(p => p.pos.y > -10);

        // Check Game Over
        if (gameState.current.hero.hp <= 0) {
            gameState.current.status = 'GAME_OVER';
        }
    };

    // Loop
    const animate = (time: number) => {
        if (lastTimeRef.current !== undefined) {
            const deltaTime = time - lastTimeRef.current;
            updateGame(deltaTime);
        }
        lastTimeRef.current = time;
        setUiState(Date.now()); // Trigger React Render
        requestRef.current = requestAnimationFrame(animate);
    };

    // Simple interaction to "move" hero visually (no gameplay effect yet, just sprite test)
    const handlePointerMove = (e: React.PointerEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        // Simple smoothing for sprite direction
        if (Math.abs(x - lastMouseX.current) > 1) {
             // In a real movement implementation, we'd update hero.pos.x here
             // For now, we rely on rendering logic to pick sprite based on mouse vs center
        }
        lastMouseX.current = x;
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
    }, []);

    // --- RENDER HELPERS ---

    const renderEntity = (e: GameEntity) => {
        if (e.type === 'HERO') {
            const h = gameState.current.hero.heroRef;
            // Determine sprite frame based on "Mouse Position" (simulated aiming)
            // Center is 50. 
            // If aiming Left (<45): Frame 1
            // If aiming Right (>55): Frame 2
            // If aiming Up-Left (<50): Frame 3
            // If aiming Up-Right (>50): Frame 4
            // Default "Shooting Up" mode for this game style usually implies Frame 3 or 4
            
            // Logic: 
            // - If actively moving side-to-side (not implemented in this loop yet), use profile.
            // - Since we are shooting UP, use Back-Left or Back-Right.
            // - Let's use simple toggling or mouse influence.
            
            let bgPos = '66.66% 0'; // Frame 3 (Up-Left) Default
            if (lastMouseX.current > 50) bgPos = '100% 0'; // Frame 4 (Up-Right)
            if (lastMouseX.current < 25) bgPos = '0% 0'; // Frame 1 (Left)
            if (lastMouseX.current > 75) bgPos = '33.33% 0'; // Frame 2 (Right)
            
            // If specific sprite sheet exists, use it with cropping
            if (h.sprites && h.sprites.sheet) {
                return (
                    <div
                        key={e.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: `${e.pos.x}%`,
                            top: `${e.pos.y}%`,
                            width: `${e.width * 1.5}%`, // Sprites often need to be slightly larger visuals
                            height: `${e.height * 1.5}%`,
                            backgroundImage: `url(${h.sprites.sheet})`,
                            backgroundSize: '400% 100%', // 4 Frames
                            backgroundPosition: bgPos,
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated'
                        }}
                    />
                );
            } else if (h.image?.url) {
                // Fallback to portrait (cutout circle)
                return (
                    <div
                        key={e.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: `${e.pos.x}%`,
                            top: `${e.pos.y}%`,
                            width: `${e.width}%`,
                            height: `${e.height}%`,
                        }}
                    >
                        <img src={h.image.url} className="w-full h-full object-cover rounded-full border-2 border-white shadow-[0_0_10px_cyan]" />
                    </div>
                );
            }
        }

        return (
            <div
                key={e.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform will-change-transform shadow-[0_0_10px_currentColor]"
                style={{
                    left: `${e.pos.x}%`,
                    top: `${e.pos.y}%`,
                    width: `${e.width}%`,
                    height: `${e.height}%`,
                    color: e.color
                }}
            >
                {e.type === 'ENEMY' ? (
                    <div className="w-full h-full flex items-center justify-center text-2xl animate-pulse">
                        {e.color === '#ef4444' ? '☄️' : '🛸'}
                    </div>
                ) : e.type === 'TOWER' ? (
                    <div className="w-full h-full bg-slate-900 border-2 border-current rounded-lg flex flex-col items-center justify-center relative">
                        {/* @ts-ignore */}
                        <div className="text-xl">{TOWER_TYPES[e.configId].icon}</div>
                        {/* Level Stars */}
                        {/* @ts-ignore */}
                        <div className="absolute -bottom-2 flex gap-0.5">{Array(e.level).fill(0).map((_,i) => <div key={i} className="w-1 h-1 bg-yellow-400 rounded-full"/>)}</div>
                        {/* Upgrade Progress Bar */}
                        {/* @ts-ignore */}
                        <div className="absolute -top-2 w-full h-1 bg-gray-700 rounded"><div className="h-full bg-green-500" style={{width: `${(e.upgradeProgress/5)*100}%`}}></div></div>
                    </div>
                ) : (
                    <div className="w-full h-full bg-current rounded-full blur-[1px]" />
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-950 text-white font-sans overflow-hidden select-none" onPointerMove={handlePointerMove}>
            
            {/* --- GAME HUD --- */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-yellow-500 text-black font-black px-2 py-0.5 rounded text-sm">LVL {gameState.current.level}</span>
                        <div className="w-32 h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
                            <div className="h-full bg-yellow-500 transition-all duration-300" 
                                 style={{ width: `${(gameState.current.xp / gameState.current.xpToNext) * 100}%` }}></div>
                        </div>
                        <span className="text-xs font-mono text-yellow-500">{gameState.current.xp}/{gameState.current.xpToNext}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">Basis Integrität</div>
                    <div className="w-32 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
                        <div className={`h-full transition-all duration-300 ${gameState.current.hero.hp < gameState.current.hero.maxHp * 0.3 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}
                             style={{ width: `${(gameState.current.hero.hp / gameState.current.hero.maxHp) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* --- GAME LAYER --- */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Background Stars/Grid */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80"></div>
                </div>

                {/* Render All Entities */}
                {renderEntity(gameState.current.hero)}
                {gameState.current.towers.map(renderEntity)}
                {gameState.current.enemies.map(renderEntity)}
                {gameState.current.projectiles.map(renderEntity)}

                {/* Tower Slots Placeholders (if empty) */}
                {Object.entries(TOWER_SLOTS).map(([key, pos]) => {
                    // @ts-ignore
                    if (gameState.current.towers.some(t => t.positionSlot === key)) return null;
                    return (
                        <div key={key} className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-slate-800 border-dashed rounded-lg flex items-center justify-center opacity-30" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                            <div className="text-[8px]">{key}</div>
                        </div>
                    );
                })}
            </div>

            {/* --- START OVERLAY --- */}
            {gameState.current.status === 'MENU' && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
                    <Hexagon className="w-16 h-16 text-cyan-400 animate-spin-slow mb-4" />
                    <h1 className="text-3xl font-black italic uppercase tracking-wider text-white mb-2">Invasion Protocol</h1>
                    <p className="text-slate-400 text-sm mb-8 max-w-xs">Verteidige die Basis. Baue Türme. Überlebe 20 Level.</p>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8 flex items-center gap-4 w-full max-w-sm">
                        <img src={initialHero.image.url} className="w-16 h-16 rounded-lg object-cover bg-black" />
                        <div className="text-left">
                            <div className="text-xs text-slate-500 uppercase font-bold">Aktiver Held</div>
                            <div className="text-lg font-black text-white">{initialHero.name}</div>
                            <div className="text-xs text-cyan-400">DMG: {Math.floor(initialHero.powerstats.power/2)}</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => gameState.current.status = 'PLAYING'}
                        className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xl rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.6)] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Play className="fill-black" /> Starten
                    </button>
                    <button onClick={onBack} className="mt-6 text-slate-500 hover:text-white text-sm font-bold uppercase">Zurück zur Basis</button>
                </div>
            )}

            {/* --- CARD SELECTION OVERLAY --- */}
            {showCards && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 pointer-events-auto">
                    <h2 className="text-2xl font-black text-yellow-400 uppercase italic mb-1 animate-bounce">Level Up!</h2>
                    <p className="text-slate-400 text-sm mb-8">Wähle ein Upgrade-Modul</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                        {gameState.current.availableCards.map((card, idx) => (
                            <button
                                key={card.id}
                                onClick={() => handleCardSelect(card)}
                                className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-cyan-400 p-6 rounded-2xl flex flex-col items-center text-center transition-all hover:-translate-y-2 group"
                            >
                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-3xl shadow-inner group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                    {card.type === 'NEW_TOWER' ? '🏗️' : card.type === 'UPGRADE_TOWER' ? '⏫' : '💊'}
                                </div>
                                <h3 className="font-black text-white uppercase mb-2">{card.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{card.description}</p>
                                {card.targetSlot && <div className="mt-4 text-[10px] bg-black/30 px-2 py-1 rounded font-mono text-cyan-500">Slot: {card.targetSlot}</div>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* --- GAME OVER / VICTORY --- */}
            {(gameState.current.status === 'GAME_OVER' || gameState.current.status === 'VICTORY') && (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center pointer-events-auto">
                    <div className="text-6xl mb-4">{gameState.current.status === 'VICTORY' ? '🏆' : '💀'}</div>
                    <h2 className={`text-4xl font-black uppercase italic mb-2 ${gameState.current.status === 'VICTORY' ? 'text-yellow-400' : 'text-red-500'}`}>
                        {gameState.current.status === 'VICTORY' ? 'Mission Erfüllt!' : 'Kritischer Fehler'}
                    </h2>
                    <p className="text-slate-400 mb-8">Erreichtes Level: {gameState.current.level}</p>
                    <button onClick={onBack} className="px-8 py-3 bg-white text-black font-black rounded-xl uppercase hover:bg-slate-200">
                        Zurück zur Basis
                    </button>
                </div>
            )}

        </div>
    );
};

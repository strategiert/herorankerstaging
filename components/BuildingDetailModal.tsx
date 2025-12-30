
import React, { useState } from 'react';
import { 
  X, Zap, Shield, Users, BarChart3, Lock, 
  Unlock, Timer, ArrowUpCircle, Activity, 
  Sword, Crosshair, Plane, Radio, Settings, Palette, Check, Gem, UserPlus, ChevronRight,
  Clock, ArrowRight, Star, UserCheck, Microchip, Box
} from 'lucide-react';
import { BuildingState, BuildingType } from '../types/economy';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { calculateCost, calculateBuildTime, formatDuration, calculateXpGain, calculateProduction } from '../utils/engine';
import { useGame } from '../context/GameContext';
import { useInventory } from '../context/InventoryContext'; // Import inventory context
import { Hero } from '../types';

interface BuildingDetailModalProps {
  building: BuildingState;
  onClose: () => void;
}

// ... (Existing TrainingConsole & AssignmentConsole components remain the same, just hidden for brevity in this XML block but assumed to be there. I will include full file content to be safe) ...

const TrainingConsole = ({ building }: { building: BuildingState }) => {
    const [selectedUnit, setSelectedUnit] = useState(0);
    const [amount, setAmount] = useState(10);
    
    // Mock Units for visual match
    const UNITS = [
        { id: 1, name: 'Rekrut', level: 1, power: 10, img: '🔫' },
        { id: 2, name: 'Soldat', level: 5, power: 25, img: '🪖' },
        { id: 3, name: 'Elite', level: 10, power: 60, img: '👮' },
        { id: 4, name: 'Exo', level: 15, power: 150, img: '🦾' },
        { id: 5, name: 'Mech', level: 20, power: 300, img: '🤖' },
    ];

    const currentUnit = UNITS[selectedUnit];
    const isLocked = building.level < currentUnit.level;

    return (
        <div className="space-y-4">
            <div className="bg-slate-100 p-3 rounded-xl flex justify-between items-center text-slate-800 shadow-sm border border-slate-200">
                <div className="text-center">
                    <div className="text-xs font-bold text-slate-500 uppercase">Kampfkraft</div>
                    <div className="text-xl font-black bg-blue-100 text-blue-600 px-2 rounded">{currentUnit.power}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs font-bold text-slate-500 uppercase">Angriff</div>
                    <div className="text-lg font-black">{Math.floor(currentUnit.power * 0.6)}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs font-bold text-slate-500 uppercase">HP</div>
                    <div className="text-lg font-black">{Math.floor(currentUnit.power * 1.2)}</div>
                </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {UNITS.map((u, idx) => (
                    <button
                        key={u.id}
                        onClick={() => setSelectedUnit(idx)}
                        className={`
                            relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden
                            ${selectedUnit === idx ? 'border-yellow-400 bg-yellow-50 shadow-md transform scale-105 z-10' : 'border-slate-200 bg-white hover:bg-slate-50'}
                        `}
                    >
                        <div className="text-2xl">{u.img}</div>
                        <div className="text-[9px] font-bold uppercase mt-1">Lv.{u.level}</div>
                        {building.level < u.level && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div className="absolute top-0 left-0 bg-black/50 text-white text-[8px] px-1 rounded-br">
                            v.{u.id}
                        </div>
                    </button>
                ))}
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-4xl border border-slate-200 shadow-inner">
                        {currentUnit.img}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-slate-700">{currentUnit.name}</span>
                            <span className="font-mono text-slate-500">{amount}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max="100" 
                            value={amount} 
                            onChange={(e) => setAmount(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="text-xs text-slate-400 mt-1 flex justify-between">
                            <span>Ausbildung läuft:</span>
                            <span className="font-mono">00:05:00</span>
                        </div>
                    </div>
                </div>
                <button 
                    disabled={isLocked}
                    className={`
                        w-full py-3 rounded-xl font-black text-lg uppercase tracking-wider shadow-lg active:scale-95 transition-all
                        ${isLocked ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-400 text-white border-b-4 border-blue-700 active:border-b-0 active:translate-y-1'}
                    `}
                >
                    {isLocked ? `Benötigt Lv. ${currentUnit.level}` : 'Ausbilden'}
                </button>
            </div>
        </div>
    );
};

const AssignmentConsole = ({ building }: { building: BuildingState }) => {
    const { state, assignHero } = useGame();
    const assignedHero = state.heroes.find(h => h.assignedBuildingId === building.id);
    const availableHeroes = state.heroes.filter(h => !h.assignedBuildingId || h.assignedBuildingId === building.id);

    return (
        <div className="space-y-4">
            <div className={`p-4 rounded-xl border-2 flex items-center gap-4 ${assignedHero ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                {assignedHero ? (
                    <>
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500 shadow-md">
                            <img src={assignedHero.image.url} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-black text-slate-800 uppercase">{assignedHero.name}</span>
                                <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold">{assignedHero.specialty}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Produktion Boost: <span className="text-green-600 font-bold">+{Math.floor(1 + (assignedHero.powerstats.intelligence / 1000) * 100)}%</span></div>
                            <button onClick={() => assignHero(assignedHero.id, null)} className="mt-2 text-[10px] text-red-500 font-bold uppercase hover:underline">Abziehen</button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full py-2 text-slate-400">
                        <UserPlus className="w-8 h-8 mb-1" />
                        <span className="text-xs font-bold uppercase">Kein Commander zugewiesen</span>
                    </div>
                )}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase px-1">Verfügbare Commander</div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {availableHeroes.length === 0 ? (
                    <div className="text-center p-4 text-slate-400 italic text-xs">Keine freien Helden verfügbar.</div>
                ) : (
                    availableHeroes.map(hero => {
                        const isAssignedHere = hero.id === assignedHero?.id;
                        if (isAssignedHere) return null; 
                        const bonus = Math.floor((1 + (hero.powerstats.intelligence / 1000) + (hero.specialty === 'PROD' ? 0.2 : 0)) * 100 - 100);
                        return (
                            <button key={hero.id} onClick={() => assignHero(hero.id, building.id)} className="w-full flex items-center gap-3 p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all group">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 border border-slate-300">
                                    <img src={hero.image.url} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-slate-700 text-xs truncate">{hero.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[9px] px-1 rounded font-bold ${hero.specialty === 'PROD' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{hero.specialty}</span>
                                        <span className="text-[10px] text-green-600 font-bold">+{bonus}%</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    <Check className="w-4 h-4" />
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// --- PRODUCTION COMPONENT (NEW) ---
const ProductionConsole = ({ building }: { building: BuildingState }) => {
    const { state, deductResources } = useGame();
    const { addItem } = useInventory();
    
    const ITEMS = [
        { id: 'chip_atk', name: 'Angriffs-Chip', cost: { nanosteel: 500 }, desc: '+ATK für Invasion', icon: <Microchip className="w-6 h-6 text-red-500" /> },
        { id: 'chip_spd', name: 'Speed-Chip', cost: { nanosteel: 500 }, desc: '+Attack Speed', icon: <Zap className="w-6 h-6 text-yellow-500" /> },
        { id: 'item_rep', name: 'Reparatur-Kit', cost: { biomass: 200 }, desc: 'Heilt Basis im Kampf', icon: <Box className="w-6 h-6 text-green-500" /> },
    ];

    const handleProduce = (item: any) => {
        if(deductResources(item.cost)) {
            // Add to inventory directly (simplified for MVP)
            addItem({
                id: crypto.randomUUID(),
                templateId: item.id,
                name: item.name,
                category: 'consumable',
                rarity: 'grey',
                description: item.desc
            }, 1);
            alert(`${item.name} produziert!`);
        }
    };

    return (
        <div className="space-y-3">
            <div className="text-xs text-slate-500 font-bold uppercase mb-2">Verfügbare Blaupausen</div>
            {ITEMS.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                        {item.icon}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                    <button 
                        onClick={() => handleProduce(item)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase shadow-md active:scale-95 transition-all"
                    >
                        {item.cost.nanosteel ? `${item.cost.nanosteel} Nano` : `${item.cost.biomass} Bio`}
                    </button>
                </div>
            ))}
        </div>
    );
};

export const BuildingDetailModal: React.FC<BuildingDetailModalProps> = ({ building, onClose }) => {
  const { state, startUpgrade, speedUpBuilding } = useGame();
  const def = BUILDING_DEFINITIONS[building.type];
  const [tab, setTab] = useState<'info' | 'upgrade' | 'training' | 'assign' | 'production'>('upgrade');

  if (!def) return null;

  const nextCost = calculateCost(def, building.level);
  const nextTime = calculateBuildTime(def, building.level);
  const canAfford = state.resources.credits >= (nextCost.credits || 0) &&
                    state.resources.nanosteel >= (nextCost.nanosteel || 0) &&
                    state.resources.biomass >= (nextCost.biomass || 0);

  const isMaxLevel = building.level >= def.maxLevel;
  const isUpgrading = building.status === 'UPGRADING';

  // Requirements Check
  const reqs = [
      { label: `Hauptquartier Lv. ${building.level + 1}`, met: true },
      { label: `${nextCost.credits} Credits`, met: state.resources.credits >= (nextCost.credits || 0) },
      { label: `${nextCost.nanosteel} Nanosteel`, met: state.resources.nanosteel >= (nextCost.nanosteel || 0) },
      { label: `${nextCost.biomass} Biomass`, met: state.resources.biomass >= (nextCost.biomass || 0) },
  ].filter(r => !r.label.startsWith('0 '));

  const handleUpgrade = () => {
    startUpgrade(building.id);
    onClose();
  };

  const assignedHero = state.heroes.find(h => h.assignedBuildingId === building.id);
  const currProd = calculateProduction(def, building.level, assignedHero);
  const nextProd = calculateProduction(def, building.level + 1, assignedHero);
  
  const resourceKey = def.resource || 'credits';
  // @ts-ignore
  const currVal = currProd[resourceKey] || 0;
  // @ts-ignore
  const nextVal = nextProd[resourceKey] || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#f0f4f8] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-slate-800 p-4 pb-12 relative">
            <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            <div className="flex justify-center mb-[-40px]">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-b from-blue-400 to-blue-600 rounded-2xl shadow-lg border-4 border-white flex items-center justify-center transform rotate-3 overflow-hidden">
                        {assignedHero ? (
                            <img src={assignedHero.image.url} className="w-full h-full object-cover" />
                        ) : (
                            <Settings className="w-12 h-12 text-white/90" />
                        )}
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-yellow-400 text-yellow-900 font-black text-xs px-2 py-1 rounded-lg shadow-sm border border-yellow-200">
                        Lv.{building.level}
                    </div>
                </div>
            </div>
        </div>

        {/* TITLE & TABS */}
        <div className="pt-12 px-6 pb-2 text-center bg-white border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{def.name}</h2>
            {assignedHero && <div className="text-[10px] text-blue-500 font-bold uppercase mt-1">Cmdr. {assignedHero.name}</div>}
            
            <div className="flex justify-center gap-2 mt-4 mb-2 overflow-x-auto no-scrollbar py-1">
                {def.type === 'MILITARY' && (
                    <button onClick={() => setTab('training')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${tab === 'training' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                        Ausbildung
                    </button>
                )}
                {/* Enable Production tab for factories */}
                {(def.type === 'PRODUCTION' || def.id === 'WORKSHOP') && (
                    <button onClick={() => setTab('production')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${tab === 'production' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                        Fertigung
                    </button>
                )}
                <button onClick={() => setTab('upgrade')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${tab === 'upgrade' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                    Verbessern
                </button>
                <button onClick={() => setTab('assign')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${tab === 'assign' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                    Stationierung
                </button>
                <button onClick={() => setTab('info')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${tab === 'info' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                    Info
                </button>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#f0f4f8]">
            
            {tab === 'training' && <TrainingConsole building={building} />}
            {tab === 'assign' && <AssignmentConsole building={building} />}
            {tab === 'production' && <ProductionConsole building={building} />}

            {tab === 'upgrade' && (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Produktion / Std</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-700">{currVal}</span>
                                <ArrowRight className="w-3 h-3 text-green-500" />
                                <span className="font-mono font-bold text-green-600">{nextVal}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase">Kampfkraft</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-700">{building.level * 100}</span>
                                <ArrowRight className="w-3 h-3 text-green-500" />
                                <span className="font-mono font-bold text-green-600">{(building.level + 1) * 100}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">Voraussetzungen</div>
                        {reqs.map((req, i) => (
                            <div key={i} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${req.met ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {req.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    </div>
                                    <span className={`text-sm font-bold ${req.met ? 'text-slate-700' : 'text-red-500'}`}>{req.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {isUpgrading ? (
                            <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col items-center justify-center text-blue-800">
                                <div className="font-bold uppercase text-xs mb-1">Upgrade läuft</div>
                                <div className="font-mono text-xl font-black">{formatDuration(300)}</div>
                                <button onClick={() => speedUpBuilding(building.id, 60)} className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500">Beschleunigen</button>
                            </div>
                        ) : (
                            <>
                                <button className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 rounded-xl py-3 px-2 flex flex-col items-center justify-center border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 transition-all shadow-sm">
                                    <span className="text-[10px] font-black uppercase">Jetzt beenden</span>
                                    <div className="flex items-center gap-1 font-black text-sm"><Gem className="w-3 h-3" /> 50</div>
                                </button>
                                <button 
                                    onClick={handleUpgrade}
                                    disabled={!canAfford}
                                    className={`
                                        rounded-xl py-3 px-2 flex flex-col items-center justify-center border-b-4 active:border-b-0 active:translate-y-1 transition-all shadow-sm
                                        ${canAfford ? 'bg-green-500 hover:bg-green-400 text-white border-green-700' : 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed'}
                                    `}
                                >
                                    <span className="text-[10px] font-black uppercase">Verbessern</span>
                                    <div className="flex items-center gap-1 font-black text-sm"><Clock className="w-3 h-3" /> {formatDuration(nextTime)}</div>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {tab === 'info' && (
                <div className="text-center p-8 text-slate-500 italic">
                    <p>{def.description}</p>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

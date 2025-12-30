
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Database, Loader2, RefreshCw, AlertTriangle, Copy, 
  CheckSquare, Square, Shield, Hammer, User, LayoutDashboard, Zap, Search, ChevronRight, Brain, Activity, Dumbbell,
  Coins, Leaf, Box, Gem, ArrowUpCircle, Clock, Terminal, ChevronUp, Construction, Sparkles, MessageSquare, Image as ImageIcon, Video, Eye, Wand2,
  Dice5, Layers, Book, Film, Cpu, Sword, Rocket, Trash2, Unlock, Lock, Star, TowerControl as Tower, Settings, X, 
  Home, Factory, Warehouse, Radio, FlaskConical, Container, Signal, PlusCircle, Move, ZoomIn, ZoomOut, Maximize, AlertCircle, RefreshCcw, Menu,
  ChevronLeft, ArrowRight, Hexagon, Gamepad2
} from 'lucide-react';
import { Hero, ExternalHero, ViewState, EquipmentLoadout, WikiHero } from './types';
import { fetchRawHeroes, listTables, SCHEMA_SQL, REQUIRED_TABLE_NAME, saveHero, fetchMyHeroes, updateConnection, isConfigured } from './services/supabaseService';
import { transformHero, generateStrategicAdvice, chatWithAi, analyzeImage, generateProImage, editImage, generateVeoVideo, animateHeroPortrait } from './services/geminiService';
import { FULL_HERO_DATA } from './services/fullHeroData';
import { GameProvider, useGame } from './context/GameContext';
import { InventoryProvider, useInventory, EquipmentItem, EquipmentSlot, ItemRarity } from './context/InventoryContext';
import { BuildingType, Resources, BuildingCategory, BuildingState, ResourceType } from './types/economy';
import { calculateCost, calculateBuildTime, formatDuration, calculateProduction } from './utils/engine';
import { BUILDING_DEFINITIONS } from './data/buildings';
import { STATION_MAP_CONFIG } from './data/mapConfig';
import { SKIN_DATABASE } from './data/skins';
import { getMapBackgroundStyle, getMapAssetPath, getRemoteMapPath, getLogoPath } from './utils/assets';
import { StatsRadar } from './components/StatsRadar';
import { Nanoforge } from './components/Nanoforge';
import { SpireScreen } from './components/SpireScreen';
import { SaveManager } from './components/SaveManager';
import { ProfileScreen } from './components/ProfileScreen'; 
import { RecruitmentCenter } from './components/RecruitmentCenter';
import { BuildingDetailModal } from './components/BuildingDetailModal';
import { BuildingTile } from './components/BuildingTile'; 
import { SpireProvider, Item } from './context/SpireContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MissionProvider } from './context/MissionContext'; 
import { AnimationProvider } from './context/AnimationContext';
import { AssistantProvider, useAssistant } from './context/AssistantContext';
import { AssistantUI } from './components/AssistantUI';
import { InvasionScreen } from './components/InvasionScreen';

// --- OFFLINE TOAST COMPONENT ---
const OfflineToast = () => {
    const { offlineGains, clearOfflineGains } = useGame();
    const { triggerEvent } = useAssistant();

    useEffect(() => {
        if (offlineGains) {
            triggerEvent('offline_gains', `Spieler war ${offlineGains.seconds}s weg.`);
        }
    }, [offlineGains]);

    if (!offlineGains) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-slate-900/95 border border-green-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-green-400">
                        <Clock className="w-5 h-5" />
                        <h3 className="font-bold font-mono">WELCOME BACK COMMANDER</h3>
                    </div>
                    <button onClick={clearOfflineGains} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                </div>
                <p className="text-slate-400 text-xs mb-3">
                    Systeme liefen für <span className="text-white font-bold">{formatDuration(offlineGains.seconds)}</span> im Autopilot.
                </p>
                <div className="flex gap-3">
                    {offlineGains.resources.credits > 0 && (
                        <div className="bg-slate-800 px-3 py-1 rounded-lg flex items-center gap-2 border border-slate-700">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-white font-bold text-sm">+{offlineGains.resources.credits}</span>
                        </div>
                    )}
                    {offlineGains.resources.biomass > 0 && (
                        <div className="bg-slate-800 px-3 py-1 rounded-lg flex items-center gap-2 border border-slate-700">
                            <Leaf className="w-4 h-4 text-green-500" />
                            <span className="text-white font-bold text-sm">+{offlineGains.resources.biomass}</span>
                        </div>
                    )}
                    {offlineGains.resources.nanosteel > 0 && (
                        <div className="bg-slate-800 px-3 py-1 rounded-lg flex items-center gap-2 border border-slate-700">
                            <Box className="w-4 h-4 text-blue-500" />
                            <span className="text-white font-bold text-sm">+{offlineGains.resources.nanosteel}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... (ResourceDetailsModal, ConstructionModal, ResourceDisplay, InteractiveMap - unchanged logic, just cleaner imports if needed) ...
// For brevity in this answer, assuming these are defined above or imported. 
// I will include them here to ensure the file is complete.

const ResourceDetailsModal = ({ resource, onClose, onSelectBuilding }: { resource: ResourceType, onClose: () => void, onSelectBuilding: (b: BuildingState) => void }) => {
    const { state } = useGame();
    // Config for display
    const config = {
        credits: { icon: Coins, name: 'Credits', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
        biomass: { icon: Leaf, name: 'Biomass', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
        nanosteel: { icon: Box, name: 'Nanosteel', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
        gems: { icon: Gem, name: 'Gems', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' }
    }[resource];

    if (!config) return null;
    const Icon = config.icon;

    const producers = state.buildings.filter(b => {
        const def = BUILDING_DEFINITIONS[b.type];
        return def && def.resource === resource && b.level > 0;
    });

    const availableDefs = Object.values(BUILDING_DEFINITIONS).filter(d => d.resource === resource);

    let totalProd = 0;
    producers.forEach(b => {
        const def = BUILDING_DEFINITIONS[b.type];
        if (def) {
            const prod = calculateProduction(def, b.level);
            // @ts-ignore
            totalProd += prod[resource] || 0;
        }
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 pointer-events-none">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-top-4">
                <div className={`p-4 flex items-center justify-between border-b border-slate-800 ${config.bg}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-900 border ${config.border}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold uppercase tracking-wide">{config.name}</h3>
                            <div className="text-xs text-slate-400 font-mono">
                                Total: <span className={config.color}>+{totalProd}/h</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full"><X className="w-4 h-4"/></button>
                </div>
                <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2 custom-scrollbar">
                    {producers.length > 0 ? (
                        <>
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Aktive Produktion</div>
                            {producers.map(b => {
                                const def = BUILDING_DEFINITIONS[b.type];
                                const prod = calculateProduction(def, b.level);
                                // @ts-ignore
                                const amount = prod[resource] || 0;
                                return (
                                    <button 
                                        key={b.id}
                                        onClick={() => onSelectBuilding(b)}
                                        className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl transition-all group"
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-white font-bold text-xs group-hover:text-blue-400 transition-colors">{def.name}</span>
                                            <span className="text-[10px] text-slate-500">Level {b.level}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono font-bold ${config.color}`}>+{amount}/h</span>
                                            <ArrowRight className="w-4 h-4 text-slate-600" />
                                        </div>
                                    </button>
                                );
                            })}
                        </>
                    ) : (
                        <div className="text-center py-6 text-slate-500 text-xs italic">
                            Keine aktiven Gebäude für diese Ressource.
                        </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Mögliche Quellen</div>
                        {availableDefs.map(def => (
                            <div key={def.id} className="flex items-center gap-2 text-xs text-slate-400 py-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                {def.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConstructionModal = ({ onClose, slotId, allowedTypes }: { onClose: () => void, slotId: string, allowedTypes?: string[] }) => {
    const { state, constructBuilding } = useGame();
    const { triggerEvent } = useAssistant();

    const available = Object.values(BUILDING_DEFINITIONS).filter(def => {
        if (allowedTypes && !allowedTypes.includes(def.id)) return false;
        if (def.type === 'HQ') {
             const hasHQ = state.buildings.some(b => b.type === 'COMMAND_CENTER');
             return !hasHQ && slotId === 'slot_center_core';
        }
        const count = state.buildings.filter(b => b.type === def.id).length;
        if (def.maxCount && count >= def.maxCount) return false;
        return true;
    });

    const handleBuild = (type: BuildingType) => { 
        constructBuilding(type, slotId); 
        triggerEvent('build_start', `Bau gestartet: ${type}`);
        onClose(); 
    };
    
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#f0f4f8] sm:rounded-2xl rounded-t-2xl w-full max-w-lg h-[80vh] sm:h-auto sm:max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10">
                <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-slate-800">
                        <Hammer className="w-5 h-5 text-blue-600" />
                        <h2 className="font-black text-lg uppercase tracking-wide">Bau-Menü</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {available.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 italic">Keine Gebäude verfügbar für diesen Slot.</div>
                    ) : (
                        available.map(def => {
                            const cost = calculateCost(def, 0); const time = calculateBuildTime(def, 0);
                            const canAfford = state.resources.credits >= cost.credits && state.resources.nanosteel >= cost.nanosteel && state.resources.biomass >= cost.biomass;
                            return (
                                <div key={def.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start"><h3 className="font-black text-slate-800 text-sm uppercase">{def.name}</h3><span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{formatDuration(time)}</span></div>
                                    <p className="text-xs text-slate-500 leading-snug">{def.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {cost.credits > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${state.resources.credits >= cost.credits ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>{cost.credits} Cr</span>}
                                        {cost.nanosteel > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${state.resources.nanosteel >= cost.nanosteel ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>{cost.nanosteel} Ns</span>}
                                        {cost.biomass > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${state.resources.biomass >= cost.biomass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{cost.biomass} Bio</span>}
                                    </div>
                                    <button onClick={() => handleBuild(def.id as BuildingType)} disabled={!canAfford} className={`w-full py-3 mt-1 rounded-lg font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] ${canAfford ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>{canAfford ? 'Errichten' : 'Ressourcen fehlen'}</button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const ResourceDisplay = ({ onSelect }: { onSelect: (r: ResourceType) => void }) => {
  const { state, storageCaps } = useGame();
  const res = state.resources;
  
  const Item = ({ icon: Icon, val, cap, bg, text, type }: any) => (
    <button 
        onClick={() => onSelect(type)}
        className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${bg} border border-white/10 shadow-lg backdrop-blur-md relative overflow-hidden group active:scale-95 transition-transform`}
    >
       <div className="absolute bottom-0 left-0 right-0 bg-black/10 transition-all duration-500" style={{ height: `${Math.min(100, (val / cap) * 100)}%` }}></div>
       <div className="relative z-10 flex flex-col items-center"><Icon className={`w-5 h-5 ${text} mb-1`} /><span className="font-black text-[10px] text-slate-800">{val >= 10000 ? (val / 1000).toFixed(1) + 'k' : Math.floor(val)}</span></div>
    </button>
  );

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 pointer-events-none pointer-events-auto">
      <Item icon={Coins} val={res.credits} cap={storageCaps.credits} bg="bg-yellow-100/90" text="text-yellow-600" type="credits" />
      <Item icon={Leaf} val={res.biomass} cap={storageCaps.biomass} bg="bg-green-100/90" text="text-green-600" type="biomass" />
      <Item icon={Box} val={res.nanosteel} cap={storageCaps.nanosteel} bg="bg-blue-100/90" text="text-blue-600" type="nanosteel" />
      <Item icon={Gem} val={res.gems} cap={999999999} bg="bg-purple-100/90" text="text-purple-600" type="gems" />
    </div>
  );
};

interface InteractiveMapProps {
    selectedBuilding: BuildingState | null;
    setSelectedBuilding: (b: BuildingState | null) => void;
    showBuildModal: boolean;
    setShowBuildModal: (s: boolean) => void;
    selectedSlot: {id: string, allowed?: string[]} | null;
    setSelectedSlot: (s: {id: string, allowed?: string[]} | null) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
    selectedBuilding, 
    setSelectedBuilding,
    showBuildModal,
    setShowBuildModal,
    selectedSlot,
    setSelectedSlot
}) => {
  const { state, speedUpBuilding } = useGame();
  const { triggerEvent } = useAssistant();
  const [mapSrc, setMapSrc] = useState(getMapAssetPath());
  const [mapError, setMapError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: -500, y: -200, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const lastTouchDistance = useRef<number | null>(null);

  const clampTransform = (x: number, y: number, scale: number) => {
      if (!containerRef.current || !containerRef.current.parentElement) return { x, y, scale };
      const container = containerRef.current.parentElement;
      const cW = container.clientWidth;
      const cH = container.clientHeight;
      const mapW = STATION_MAP_CONFIG.map.sizePx.w;
      const mapH = STATION_MAP_CONFIG.map.sizePx.h;
      const scaledW = mapW * scale;
      const scaledH = mapH * scale;
      let newX = x;
      let newY = y;
      if (scaledW <= cW) newX = (cW - scaledW) / 2;
      else newX = Math.min(0, Math.max(cW - scaledW, x));
      if (scaledH <= cH) newY = (cH - scaledH) / 2;
      else newY = Math.min(0, Math.max(cH - scaledH, y));
      return { x: newX, y: newY, scale };
  };

  useEffect(() => {
      if (containerRef.current && containerRef.current.parentElement) {
          const parent = containerRef.current.parentElement;
          const mapW = STATION_MAP_CONFIG.map.sizePx.w;
          const mapH = STATION_MAP_CONFIG.map.sizePx.h;
          const initialScale = 0.8;
          const initialX = (parent.clientWidth - mapW * initialScale) / 2;
          const initialY = (parent.clientHeight - mapH * initialScale) / 2;
          setTransform(clampTransform(initialX, initialY, initialScale));
      }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; 
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    dragDistanceRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
    setTransform(prev => clampTransform(newX, newY, prev.scale));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      if (e.touches.length === 1) {
          setIsDragging(true);
          dragStartRef.current = { x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y };
          dragDistanceRef.current = 0;
      } else if (e.touches.length === 2) {
          setIsDragging(false);
          const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          lastTouchDistance.current = dist;
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
          const touch = e.touches[0];
          const newX = touch.clientX - dragStartRef.current.x;
          const newY = touch.clientY - dragStartRef.current.y;
          dragDistanceRef.current += 5;
          setTransform(prev => clampTransform(newX, newY, prev.scale));
      } else if (e.touches.length === 2) {
          const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          if (lastTouchDistance.current !== null && lastTouchDistance.current > 0) {
              const delta = dist - lastTouchDistance.current;
              const zoomFactor = delta * 0.005; 
              setTransform(prev => {
                  const newScale = Math.min(2.0, Math.max(0.4, prev.scale + zoomFactor));
                  return clampTransform(prev.x, prev.y, newScale);
              });
          }
          lastTouchDistance.current = dist;
      }
  };

  const handleTouchEnd = () => { setIsDragging(false); lastTouchDistance.current = null; };
  const handleZoom = (delta: number) => setTransform(prev => { const newScale = Math.min(2.0, Math.max(0.4, prev.scale + delta)); return clampTransform(prev.x, prev.y, newScale); });

  const handleSlotClick = (slot: typeof STATION_MAP_CONFIG.map.slots[0]) => {
      if (dragDistanceRef.current > 10) return;
      const existing = state.buildings.find(b => b.slotId === slot.id);
      if (existing) {
          setSelectedBuilding(existing);
          triggerEvent('building_select', `Ausgewählt: ${existing.type}`);
      } else {
          setSelectedSlot({ id: slot.id, allowed: slot.allowed });
          setShowBuildModal(true);
      }
  };

  return (
    <div className="flex-1 relative overflow-hidden bg-[#0f172a] h-full cursor-grab active:cursor-grabbing touch-none select-none" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onDragStart={(e) => e.preventDefault()}>
        <div ref={containerRef} className="absolute origin-top-left transition-transform duration-75 ease-linear will-change-transform" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, width: STATION_MAP_CONFIG.map.sizePx.w, height: STATION_MAP_CONFIG.map.sizePx.h, touchAction: 'none' }}>
            {!mapError ? <img src={mapSrc} alt="Map" className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" onError={() => { if(mapSrc.startsWith('/')) setMapSrc(getRemoteMapPath()); else setMapError(true); }} draggable={false} /> : <div className="absolute inset-0" style={getMapBackgroundStyle()}></div>}
            {STATION_MAP_CONFIG.map.slots.map(slot => {
                const building = state.buildings.find(b => b.slotId === slot.id);
                const w = slot.footprint.w * STATION_MAP_CONFIG.map.sizePx.w;
                const h = slot.footprint.h * STATION_MAP_CONFIG.map.sizePx.h;
                const left = (slot.anchor.x * STATION_MAP_CONFIG.map.sizePx.w) - (w / 2);
                const top = (slot.anchor.y * STATION_MAP_CONFIG.map.sizePx.h) - (h / 2);
                const zIndex = Math.floor(slot.sortY * 1000);
                return (
                    <div key={slot.id} className="absolute building-slot group" style={{ left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px`, zIndex: zIndex }} onClick={(e) => { e.stopPropagation(); handleSlotClick(slot); }} draggable={false}>
                        {building ? <BuildingTile building={building} onSelect={() => handleSlotClick(slot)} onSpeedUp={speedUpBuilding} /> : <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"><div className="w-full h-full border-4 border-dashed border-blue-400/50 bg-blue-500/10 rounded-3xl flex items-center justify-center animate-pulse"><PlusCircle className="w-12 h-12 text-blue-400" /></div></div>}
                    </div>
                );
            })}
        </div>
        <div className="absolute bottom-24 right-6 flex flex-col gap-2 z-20 pointer-events-auto">
            <button onClick={() => handleZoom(0.2)} className="w-10 h-10 bg-slate-900/80 backdrop-blur border border-slate-700 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95"><ZoomIn className="w-5 h-5"/></button>
            <button onClick={() => handleZoom(-0.2)} className="w-10 h-10 bg-slate-900/80 backdrop-blur border border-slate-700 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95"><ZoomOut className="w-5 h-5"/></button>
        </div>
        {showBuildModal && selectedSlot && <ConstructionModal onClose={() => setShowBuildModal(false)} slotId={selectedSlot.id} allowedTypes={selectedSlot.allowed} />}
        {selectedBuilding && <BuildingDetailModal building={selectedBuilding} onClose={() => setSelectedBuilding(null)} />}
    </div>
  );
};

const DbSetupModal = ({ onClose }: { onClose: () => void }) => { return null; };

// --- GAMES SELECTION VIEW ---
const GamesView = ({ onNavigate }: { onNavigate: (v: string) => void }) => {
    const games = [
        { id: 'invasion', name: 'Invasion Protocol', desc: 'Tower Defense', icon: Hexagon, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
        { id: 'spire', name: 'The Spire', desc: 'Endless Roguelike', icon: Tower, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
        { id: 'forge', name: 'Warp Gate', desc: 'Hero Recruitment', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
    ];

    return (
        <div className="h-full bg-slate-900 p-6 flex flex-col items-center justify-center pb-24">
            <h2 className="text-2xl font-black text-white uppercase italic mb-8 flex items-center gap-2">
                <Gamepad2 className="w-8 h-8 text-green-400" /> Simulations
            </h2>
            <div className="grid gap-4 w-full max-w-md">
                {games.map(game => (
                    <button 
                        key={game.id}
                        onClick={() => onNavigate(game.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${game.bg} ${game.border} hover:bg-slate-800 transition-all active:scale-95`}
                    >
                        <div className={`w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center ${game.color}`}>
                            <game.icon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-black text-white text-lg uppercase">{game.name}</div>
                            <div className="text-slate-400 text-xs font-bold">{game.desc}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-600 ml-auto" />
                    </button>
                ))}
            </div>
        </div>
    );
};

const AppContent = () => {
  const [view, setView] = useState<ViewState | 'invasion' | 'games'>('station');
  const [selectedHero, setSelectedHero] = useState<Hero | WikiHero | null>(null);
  
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingState | null>(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{id: string, allowed?: string[]} | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);

  const [importedHeroes, setImportedHeroes] = useState<ExternalHero[]>([]);
  const [showDbSetup, setShowDbSetup] = useState(false); 
  
  const { state: gameState, addHero, incrementHeroCount } = useGame(); 
  const { inventory } = useInventory();
  const { user, guestId } = useAuth();
  const { triggerEvent } = useAssistant();
  const effectiveUserId = user ? user.id : guestId;

  useEffect(() => { 
      if (isConfigured()) loadData(); 
      // Initial greeting
      setTimeout(() => triggerEvent('app_start', 'Spieler ist eingeloggt.'), 2000);
  }, [effectiveUserId]);

  const loadData = async () => {
    try {
      const rawHeroes = await fetchRawHeroes(500);
      setImportedHeroes(rawHeroes);
      const playerHeroes = await fetchMyHeroes(effectiveUserId);
      playerHeroes.forEach(h => addHero(h));
    } catch (e: any) { console.error("Datenbank Fehler:", e.message); } 
  };
  
  const handleHeroRecruited = (newHero: Hero) => { addHero(newHero); triggerEvent('recruit_success', newHero.name); };

  // Helper to distinguish types
  const isHero = (h: Hero | WikiHero): h is Hero => 'powerstats' in h;

  // Bottom Navigation Component
  const NavButton = ({ icon: Icon, label, target, active, center = false }: any) => (
      <button 
        onClick={() => setView(target)}
        className={`flex flex-col items-center justify-center gap-1 transition-all ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'} ${center ? '-mt-8' : ''}`}
      >
          <div className={`${center ? 'w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)] border-4 border-slate-900 text-white' : ''}`}>
             <Icon className={`${center ? 'w-8 h-8' : 'w-6 h-6'}`} />
          </div>
          {!center && <span className="text-[10px] font-bold uppercase">{label}</span>}
      </button>
  );

  return (
    <div className="flex flex-col h-screen bg-[#f0f4f8] text-slate-900 font-sans overflow-hidden select-none relative">
        <main className="flex-1 overflow-hidden relative">
            <OfflineToast />
            <AssistantUI />
            
            {/* FLOATING HUD TOP LEFT */}
            <div className="fixed top-4 left-4 z-50 flex items-center gap-2 pointer-events-auto">
                <img src={getLogoPath()} className="w-12 h-12 object-contain drop-shadow-lg" alt="Logo" onError={(e) => e.currentTarget.style.display = 'none'} />
                <SaveManager onSchemaError={() => setShowDbSetup(true)} onProfileClick={() => setView('profile')} />
            </div>
            
            {/* RESOURCE BAR */}
            <ResourceDisplay onSelect={setSelectedResource} />
            
            {selectedResource && (
                <ResourceDetailsModal 
                    resource={selectedResource} 
                    onClose={() => setSelectedResource(null)}
                    onSelectBuilding={(b) => {
                        setSelectedResource(null);
                        setSelectedBuilding(b);
                        setView('station');
                    }}
                />
            )}

            {/* VIEWS */}
            {view === 'games' && <GamesView onNavigate={(v) => setView(v as any)} />}
            {view === 'forge' && <div className="absolute inset-0 z-30 bg-slate-900 animate-in fade-in zoom-in-95 duration-300"><RecruitmentCenter importedHeroes={importedHeroes} onHeroRecruited={handleHeroRecruited} /></div>}
            
            {view === 'station' && (
                <div className="h-full flex flex-col bg-[#f0f4f8] overflow-hidden">
                    <InteractiveMap 
                        selectedBuilding={selectedBuilding}
                        setSelectedBuilding={setSelectedBuilding}
                        showBuildModal={showBuildModal}
                        setShowBuildModal={setShowBuildModal}
                        selectedSlot={selectedSlot}
                        setSelectedSlot={setSelectedSlot}
                    />
                </div>
            )}
            
            {view === 'detail' && (
                <div className="absolute inset-0 z-30 bg-slate-950 animate-in slide-in-from-left duration-300">
                    <div className="h-full pt-20 px-4 pb-24 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-wider">Meine Armee</h2>
                            <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">{gameState.heroes.length} Einheiten</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {gameState.heroes.map(h => (
                                <div key={h.id} onClick={() => setSelectedHero(h)} className="aspect-[3/4] bg-slate-900 rounded-xl relative overflow-hidden cursor-pointer border border-slate-800 hover:border-blue-500 transition-colors group shadow-lg">
                                    {h.image.url ? (
                                        <img src={h.image.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-800 text-slate-600">?</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-black border border-white/10">LV {h.level}</div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <div className="text-white text-xs font-black truncate uppercase">{h.name}</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-bold">{h.specialty}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {gameState.heroes.length === 0 && (
                            <div className="text-center text-slate-600 mt-12 italic">Keine Helden rekrutiert. Besuche das Portal.</div>
                        )}
                    </div>
                </div>
            )}
            
            {view === 'nanoforge' && <div className="absolute inset-0 z-30 bg-slate-900 animate-in slide-in-from-left duration-300"><div className="h-full pt-16 pb-24"><Nanoforge /></div></div>}
            {view === 'spire' && <div className="absolute inset-0 z-30 bg-[#020617] animate-in zoom-in-95 duration-500"><SpireScreen myHeroes={gameState.heroes} onNavigateToRecruit={() => setView('forge')} /></div>}
            {view === 'profile' && <div className="absolute inset-0 z-50"><ProfileScreen onClose={() => setView('station')} /></div>}
            
            {view === 'invasion' && (
                <div className="absolute inset-0 z-40 bg-slate-950 animate-in zoom-in-90 duration-300">
                    <InvasionScreen onBack={() => setView('games')} />
                </div>
            )}

            {/* HERO OVERLAY */}
            {selectedHero && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden flex shadow-2xl border border-slate-700">
                        {/* LEFT COLUMN: HERO IMAGE & NAME */}
                        <div className="w-1/2 bg-slate-950 relative hidden md:block">
                            {(isHero(selectedHero) ? selectedHero.image?.url : selectedHero.image) ? (
                                <img src={isHero(selectedHero) ? selectedHero.image.url : selectedHero.image} className="w-full h-full object-cover opacity-80" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700 text-6xl font-black">?</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                            
                            <div className="absolute bottom-8 left-8">
                                {'level' in selectedHero && (
                                    <div className="bg-yellow-500 text-black font-black text-xs px-2 py-1 rounded inline-block mb-2">LVL {selectedHero.level}</div>
                                )}
                                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedHero.name}</h1>
                                <p className="text-slate-400 text-xs font-bold uppercase mt-1">
                                    {isHero(selectedHero) ? `${selectedHero.appearance?.race} // ${selectedHero.biography?.alignment}` : `${selectedHero.universe}`}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN (Mobile Full) */}
                        <div className="w-full md:w-1/2 bg-slate-900 flex flex-col relative">
                            <button onClick={() => setSelectedHero(null)} className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 border border-slate-700 z-10"><X className="w-5 h-5"/></button>
                            
                            {/* Mobile Header Image */}
                            <div className="h-48 md:hidden relative shrink-0">
                                {(isHero(selectedHero) ? selectedHero.image?.url : selectedHero.image) && (
                                    <img src={isHero(selectedHero) ? selectedHero.image.url : selectedHero.image} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <h1 className="text-2xl font-black text-white uppercase italic">{selectedHero.name}</h1>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                        <div className="text-xs text-slate-500 font-bold uppercase">Stärke</div>
                                        <div className="text-lg font-black text-white">
                                            {isHero(selectedHero) ? selectedHero.powerstats?.strength : selectedHero.stats?.strength}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                        <div className="text-xs text-slate-500 font-bold uppercase">Intelligenz</div>
                                        <div className="text-lg font-black text-white">
                                            {isHero(selectedHero) ? selectedHero.powerstats?.intelligence : selectedHero.stats?.intelligence}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                        <div className="text-xs text-slate-500 font-bold uppercase">Geschwindigkeit</div>
                                        <div className="text-lg font-black text-white">
                                            {isHero(selectedHero) ? selectedHero.powerstats?.speed : selectedHero.stats?.speed}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                        <div className="text-xs text-slate-500 font-bold uppercase">Power</div>
                                        <div className="text-lg font-black text-white">
                                            {isHero(selectedHero) ? selectedHero.powerstats?.power : 0}
                                        </div>
                                    </div>
                                </div>

                                {/* Skills / Bio */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Biografie & Analyse</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {selectedHero.description || "Keine weiteren Daten verfügbar."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showDbSetup && <div className="absolute inset-0 z-[100]"><DbSetupModal onClose={() => setShowDbSetup(false)} /></div>}
        </main>

        {/* --- BOTTOM NAVIGATION BAR --- */}
        <nav className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 z-50 shrink-0 safe-pb relative">
            <NavButton icon={Menu} label="Menü" target="profile" active={view === 'profile'} />
            <NavButton icon={User} label="Armee" target="detail" active={view === 'detail'} />
            <NavButton icon={Home} label="" target="station" active={view === 'station'} center />
            <NavButton icon={Gamepad2} label="Games" target="games" active={['games', 'invasion', 'spire', 'forge'].includes(view)} />
            <NavButton icon={Box} label="Lager" target="nanoforge" active={view === 'nanoforge'} />
        </nav>
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
        <GameProvider>
        <InventoryProvider>
            <AnimationProvider>
                <AssistantProvider>
                    <AppContentWithSpire />
                </AssistantProvider>
            </AnimationProvider>
        </InventoryProvider>
        </GameProvider>
    </AuthProvider>
  );
};

const rarityMap: Record<string, ItemRarity> = { 'common': 'grey', 'uncommon': 'green', 'rare': 'blue', 'epic': 'purple', 'legendary': 'orange' };

const AppContentWithSpire = () => {
    const { addItem } = useInventory();
    useEffect(() => { }, []);
    return (
        <SpireProvider unlockedHeroes={[]} onAddItem={(item) => { addItem({ id: crypto.randomUUID(), templateId: item.id, name: item.name, category: 'material', rarity: rarityMap[item.rarity] || 'grey', description: item.description }, item.quantity); }}>
            <MissionProvider><AppContent /></MissionProvider>
        </SpireProvider>
    );
};

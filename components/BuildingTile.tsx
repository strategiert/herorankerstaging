
import React, { useState, useEffect } from 'react';
import { BuildingState, BuildingType } from '../types/economy';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { SKIN_DATABASE } from '../data/skins';
import { BuildingVisuals } from './BuildingVisuals';
import { getBuildingAssetPath, getRemoteBuildingPath } from '../utils/assets';
import { Settings, Home, Factory, Warehouse, User, Shield, Radio, FlaskConical, Square, Hammer, ArrowBigUp, Check, Coins, Box, Leaf } from 'lucide-react';
import { formatDuration, calculateCost } from '../utils/engine';
import { useGame } from '../context/GameContext';

interface BuildingTileProps {
  building: BuildingState;
  onSelect: (b: BuildingState) => void;
  onSpeedUp: (id: string, seconds: number) => void;
}

const getIcon = (type: string) => {
    switch (type) {
      case 'HQ': return Home;
      case 'PRODUCTION': return Factory;
      case 'STORAGE': return Warehouse;
      case 'MILITARY': return User; 
      case 'DEFENSE': return Shield;
      case 'UTILITY': return Radio;
      case 'RESEARCH': return FlaskConical;
      default: return Square;
    }
};

export const BuildingTile: React.FC<BuildingTileProps> = ({ building, onSelect, onSpeedUp }) => {
  const { state } = useGame();
  const def = BUILDING_DEFINITIONS[building.type];
  const [imgSrc, setImgSrc] = useState(getBuildingAssetPath(building.type, building.activeSkin));
  const [imgError, setImgError] = useState(false);
  
  const assignedHero = state.heroes.find(h => h.assignedBuildingId === building.id);

  useEffect(() => {
      setImgError(false);
      setImgSrc(getBuildingAssetPath(building.type, building.activeSkin));
  }, [building.type, building.activeSkin]);

  if (!def) return null;

  const skin = SKIN_DATABASE[building.activeSkin || 'default'];
  const isUpgrading = building.status === 'UPGRADING';
  const isConstruction = building.level === 0;
  const Icon = getIcon(def.type);
  
  const nextCost = calculateCost(def, building.level);
  const canAfford = state.resources.credits >= (nextCost.credits || 0) &&
                    state.resources.nanosteel >= (nextCost.nanosteel || 0) &&
                    state.resources.biomass >= (nextCost.biomass || 0);
  
  const isMaxLevel = building.level >= def.maxLevel;
  const showUpgradeArrow = !isUpgrading && !isMaxLevel && canAfford && building.level > 0;

  let ResourceIcon = null;
  let resourceColor = "";
  if (def.resource === 'credits') { ResourceIcon = Coins; resourceColor = "text-yellow-500 bg-yellow-100 border-yellow-300"; }
  if (def.resource === 'biomass') { ResourceIcon = Leaf; resourceColor = "text-green-500 bg-green-100 border-green-300"; }
  if (def.resource === 'nanosteel') { ResourceIcon = Box; resourceColor = "text-blue-500 bg-blue-100 border-blue-300"; }

  const showCollect = !isUpgrading && building.level > 0 && def.type === 'PRODUCTION' && Math.random() > 0.7;

  let timeLeft = 0;
  if (isUpgrading && building.finishTime) {
     timeLeft = Math.max(0, Math.ceil((building.finishTime - Date.now()) / 1000));
  }

  const handleError = () => {
      // Logic: If local fails, try remote. If remote fails (or we are already on remote), show SVG.
      const localPath = getBuildingAssetPath(building.type, building.activeSkin);
      
      if (imgSrc === localPath) {
          // Switch to Remote
          const remoteUrl = getRemoteBuildingPath(building.type, building.activeSkin);
          console.warn(`[Asset Missing] Local failed: ${localPath}. Trying remote: ${remoteUrl}`);
          setImgSrc(remoteUrl);
      } else {
          // Both failed
          console.warn(`[Asset Failed] Could not load image for ${building.type}. Switching to Hologram Mode.`);
          setImgError(true);
      }
  };

  return (
    <div 
        onClick={() => onSelect(building)}
        className={`
            relative aspect-square rounded-2xl p-2 cursor-pointer transition-all active:scale-95 group overflow-visible
            ${imgError ? 'bg-slate-900/50 border border-slate-700/50 shadow-inner' : ''} 
            ${!imgError ? 'hover:scale-105 duration-300' : ''}
        `}
    >
        <div className="absolute -top-8 left-0 right-0 flex justify-center gap-1 z-40 pointer-events-none">
            {showUpgradeArrow && (
                <div className="animate-bounce bg-green-500 border-2 border-white text-white rounded-md p-1 shadow-lg flex flex-col items-center">
                    <ArrowBigUp className="w-5 h-5 fill-current" />
                </div>
            )}
            {showCollect && ResourceIcon && (
                <div className={`animate-[pulse_2s_infinite] border-2 rounded-full p-1.5 shadow-lg ${resourceColor} bg-white`}>
                    <ResourceIcon className="w-4 h-4 fill-current" />
                </div>
            )}
        </div>

        <div className="absolute inset-0 p-2 flex items-center justify-center">
            {isConstruction ? (
                <div className="w-full h-full relative flex items-center justify-center">
                    <div className="absolute inset-2 border-2 border-blue-400/50 border-dashed rounded-xl animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-4 border-2 border-blue-400/30 border-dashed rounded-lg animate-[spin_8s_linear_infinite_reverse]"></div>
                    <Hammer className="w-12 h-12 text-blue-400 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-[shine_2s_infinite]" style={{ backgroundSize: '100% 200%' }}></div>
                </div>
            ) : !imgError ? (
                <img 
                    src={imgSrc} 
                    alt={def.name} 
                    className="w-full h-full object-contain drop-shadow-2xl z-10"
                    onError={handleError} 
                />
            ) : (
                <div className="w-full h-full opacity-80">
                    {/* Fallback SVG */}
                    <BuildingVisuals type={building.type} skinId={building.activeSkin || 'default'} level={building.level} />
                </div>
            )}
        </div>

        {!isConstruction && (
            <div className="absolute top-0 right-0 z-20 bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-lg border border-slate-700 shadow-md">
                Lv.{building.level}
            </div>
        )}

        {!imgError && !isConstruction && !assignedHero && (
            <div className="absolute top-2 left-2 z-20 w-6 h-6 rounded-full bg-black/40 backdrop-blur flex items-center justify-center border border-white/10 shadow-lg">
                <Icon className={`w-3 h-3 ${skin.iconClass}`} />
            </div>
        )}

        {assignedHero && !isConstruction && (
            <div className="absolute top-2 left-2 z-20 w-8 h-8 rounded-full bg-slate-900 border-2 border-blue-500 shadow-lg overflow-hidden animate-in zoom-in duration-300">
                <img src={assignedHero.image.url} className="w-full h-full object-cover" />
            </div>
        )}

        <div className="absolute -bottom-4 left-0 right-0 z-20 transition-all duration-300 group-hover:bottom-2 opacity-0 group-hover:opacity-100 flex justify-center pointer-events-none">
            <div className="bg-black/80 backdrop-blur rounded px-2 py-1 text-center border border-white/10">
                <div className="text-[9px] font-bold text-white uppercase truncate shadow-black drop-shadow-md">{def.name}</div>
            </div>
        </div>

        {isUpgrading && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur rounded-full px-2 py-1 border border-blue-500/50 shadow-xl z-30 flex items-center gap-2 whitespace-nowrap min-w-[80px] justify-center">
                <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                <span className="text-[10px] font-bold text-white font-mono">{formatDuration(timeLeft)}</span>
            </div>
        )}
    </div>
  );
};

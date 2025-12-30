import React from 'react';
import { BuildingType } from '../types/economy';

interface BuildingVisualProps {
  type: BuildingType;
  skinId: string;
  level: number;
}

const PALETTES: Record<string, { primary: string, secondary: string, accent: string, glow: string, bg: string }> = {
  'default': { primary: '#475569', secondary: '#334155', accent: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', bg: '#cbd5e1' },
  'void': { primary: '#1e1b4b', secondary: '#0f172a', accent: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.6)', bg: '#312e81' },
  'cyber': { primary: '#2e1065', secondary: '#020617', accent: '#06b6d4', glow: 'rgba(6, 182, 212, 0.8)', bg: '#4c1d95' },
  'gold': { primary: '#854d0e', secondary: '#422006', accent: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)', bg: '#fef08a' },
  'banana': { primary: '#eab308', secondary: '#713f12', accent: '#fef08a', glow: 'rgba(234, 179, 8, 0.8)', bg: '#fde047' },
};

// --- BUILDING SHAPES ---

const HQShape = ({ p }: { p: any }) => (
  <g transform="translate(50, 80)">
    {/* Base */}
    <path d="M-40,0 L40,0 L30,-20 L-30,-20 Z" fill={p.secondary} stroke={p.primary} strokeWidth="2" />
    {/* Mid Tower */}
    <rect x="-20" y="-60" width="40" height="40" fill={p.primary} stroke={p.accent} strokeWidth="2" />
    {/* Top Spire */}
    <path d="M-10,-60 L10,-60 L0,-80 Z" fill={p.accent} className="animate-pulse" />
    {/* Windows */}
    <rect x="-10" y="-50" width="20" height="5" fill={p.glow} />
    <rect x="-10" y="-40" width="20" height="5" fill={p.glow} />
    {/* Antenna */}
    <line x1="0" y1="-80" x2="0" y2="-90" stroke={p.secondary} strokeWidth="1" />
    <circle cx="0" cy="-90" r="2" fill="red" className="animate-ping" />
  </g>
);

const FactoryShape = ({ p }: { p: any }) => (
  <g transform="translate(50, 80)">
    {/* Main Hall */}
    <rect x="-40" y="-40" width="60" height="40" fill={p.primary} stroke={p.secondary} strokeWidth="2" />
    <path d="M-40,-40 L-20,-55 L0,-40 L20,-55 L20,-40" fill={p.bg} stroke={p.secondary} />
    {/* Chimney */}
    <rect x="25" y="-60" width="10" height="60" fill={p.secondary} />
    <rect x="23" y="-62" width="14" height="4" fill={p.accent} />
    {/* Smoke */}
    <circle cx="30" cy="-70" r="3" fill="rgba(255,255,255,0.4)" className="animate-[float_3s_ease-in-out_infinite]" />
    <circle cx="35" cy="-80" r="4" fill="rgba(255,255,255,0.3)" className="animate-[float_4s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
    {/* Door */}
    <rect x="-20" y="-20" width="20" height="20" fill="#0f172a" />
    <rect x="-20" y="-20" width="20" height="2" fill={p.accent} />
  </g>
);

const StorageShape = ({ p }: { p: any }) => (
  <g transform="translate(50, 80)">
    {/* Silo 1 */}
    <rect x="-35" y="-50" width="30" height="50" rx="5" fill={p.primary} stroke={p.secondary} strokeWidth="2" />
    <rect x="-30" y="-40" width="20" height="30" fill={p.glow} opacity="0.3" />
    {/* Silo 2 */}
    <rect x="5" y="-50" width="30" height="50" rx="5" fill={p.primary} stroke={p.secondary} strokeWidth="2" />
    <rect x="10" y="-40" width="20" height="30" fill={p.glow} opacity="0.3" />
    {/* Pipes */}
    <path d="M-5,-30 L5,-30" stroke={p.accent} strokeWidth="4" />
    <path d="M-5,-10 L5,-10" stroke={p.accent} strokeWidth="4" />
  </g>
);

const BarracksShape = ({ p }: { p: any }) => (
  <g transform="translate(50, 80)">
    {/* Bunkers */}
    <path d="M-40,0 L-20,-30 L20,-30 L40,0 Z" fill={p.primary} stroke={p.secondary} strokeWidth="2" />
    {/* Windows */}
    <rect x="-25" y="-15" width="10" height="5" fill={p.accent} />
    <rect x="-5" y="-15" width="10" height="5" fill={p.accent} />
    <rect x="15" y="-15" width="10" height="5" fill={p.accent} />
    {/* Flag Pole */}
    <line x1="0" y1="-30" x2="0" y2="-60" stroke={p.secondary} strokeWidth="2" />
    <path d="M0,-60 L20,-50 L0,-40 Z" fill={p.accent} className="animate-[pulse_3s_ease-in-out_infinite]" />
  </g>
);

const RadarShape = ({ p }: { p: any }) => (
  <g transform="translate(50, 80)">
    {/* Base */}
    <rect x="-20" y="-30" width="40" height="30" fill={p.secondary} />
    {/* Dish Stand */}
    <line x1="0" y1="-30" x2="0" y2="-45" stroke={p.primary} strokeWidth="4" />
    {/* Dish (Rotating group) */}
    <g transform="translate(0, -45)">
        <path d="M-25,-15 Q0,10 25,-15" fill="none" stroke={p.primary} strokeWidth="3" />
        <line x1="0" y1="0" x2="0" y2="-15" stroke={p.accent} strokeWidth="2" />
        <circle cx="0" cy="-15" r="2" fill={p.glow} className="animate-ping" />
        {/* Signal Waves */}
        <path d="M-10,-25 Q0,-35 10,-25" fill="none" stroke={p.accent} strokeWidth="1" opacity="0.6" className="animate-[ping_2s_infinite]" />
    </g>
  </g>
);

const ShieldShape = ({ p }: { p: any }) => (
  <g transform="translate(50, 80)">
    {/* Generator Core */}
    <circle cx="0" cy="-20" r="15" fill={p.primary} stroke={p.secondary} strokeWidth="2" />
    <circle cx="0" cy="-20" r="8" fill={p.accent} className="animate-pulse" />
    {/* Emitters */}
    <path d="M-20,0 L-30,-30" stroke={p.secondary} strokeWidth="3" />
    <path d="M20,0 L30,-30" stroke={p.secondary} strokeWidth="3" />
    {/* Field Dome */}
    <path d="M-40,0 Q0,-80 40,0" fill="none" stroke={p.glow} strokeWidth="2" strokeDasharray="4 2" className="animate-[pulse_4s_infinite]" />
  </g>
);

const LabShape = ({ p }: { p: any }) => (
  <g transform="translate(50, 80)">
    {/* Main Cube */}
    <rect x="-30" y="-40" width="60" height="40" fill={p.bg} stroke={p.primary} strokeWidth="2" />
    {/* Glass Dome */}
    <path d="M-20,-40 Q0,-60 20,-40" fill={p.glow} stroke={p.accent} strokeWidth="1" opacity="0.7" />
    {/* Details */}
    <circle cx="0" cy="-45" r="5" fill={p.accent} className="animate-spin" style={{ transformOrigin: '0 -45px' }} />
    <rect x="-10" y="-20" width="20" height="20" fill={p.secondary} />
  </g>
);

const DefenseShape = ({ p }: { p: any }) => (
  <g transform="translate(50, 80)">
    <rect x="-20" y="-20" width="40" height="20" fill={p.secondary} />
    {/* Turret */}
    <circle cx="0" cy="-20" r="15" fill={p.primary} />
    <rect x="0" y="-25" width="30" height="6" fill={p.primary} />
    <rect x="30" y="-25" width="2" height="6" fill={p.accent} />
  </g>
);

// --- MAIN RENDERER ---

export const BuildingVisuals: React.FC<BuildingVisualProps> = ({ type, skinId, level }) => {
  const p = PALETTES[skinId] || PALETTES['default'];
  
  const getShape = () => {
    switch(type) {
        case 'COMMAND_CENTER': return <HQShape p={p} />;
        case 'NANO_FOUNDRY': 
        case 'TERRA_FACTORY':
        case 'AERO_DOCK':
        case 'CYBER_UPLINK': return <FactoryShape p={p} />;
        case 'NANO_VAULT':
        case 'BIO_SILO':
        case 'CREDIT_TERMINAL': return <StorageShape p={p} />;
        case 'BARRACKS': 
        case 'MED_BAY': return <BarracksShape p={p} />;
        case 'RADAR_STATION':
        case 'ALLIANCE_HUB': return <RadarShape p={p} />;
        case 'SHIELD_GENERATOR': return <ShieldShape p={p} />;
        case 'TECH_LAB': return <LabShape p={p} />;
        default: return <DefenseShape p={p} />;
    }
  };

  return (
    <div className={`w-full h-full relative ${skinId === 'void' ? 'opacity-90' : ''}`}>
        {/* Glow Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div 
                className="w-2/3 h-2/3 rounded-full blur-xl" 
                style={{ backgroundColor: p.glow }}
            ></div>
        </div>

        {/* SVG Graphic */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg relative z-10">
            {getShape()}
            
            {/* Banana Skin Exclusive: Floating Bananas */}
            {skinId === 'banana' && (
                <g>
                    <text x="10" y="20" className="text-[10px] animate-[float_3s_infinite]">🍌</text>
                    <text x="80" y="40" className="text-[10px] animate-[float_4s_infinite]" style={{ animationDelay: '1s'}}>🍌</text>
                </g>
            )}
        </svg>
    </div>
  );
};

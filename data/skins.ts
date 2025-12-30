import { Resources } from "../types/economy";

export interface SkinDefinition {
    id: string;
    name: string;
    description: string;
    cost: Partial<Resources>;
    styleClass: string; // Tailwind classes for the container
    iconClass: string; // Tailwind classes for the icon itself
    effect?: 'pulse' | 'glitch' | 'sparkle' | 'banana';
}

export const SKIN_DATABASE: Record<string, SkinDefinition> = {
    'default': {
        id: 'default',
        name: 'Classic Chrome',
        description: 'Standard issue Nanosteel-Verkleidung. Funktional und robust.',
        cost: {},
        styleClass: 'bg-white border-slate-100',
        iconClass: 'text-slate-600'
    },
    'void': {
        id: 'void',
        name: 'Void Shadow',
        description: 'Absorbiert 99% des Lichts. Perfekt für Stealth-Operationen.',
        cost: { credits: 25000 },
        styleClass: 'bg-slate-950 border-purple-900/50 shadow-[0_0_15px_rgba(88,28,135,0.4)]',
        iconClass: 'text-purple-400'
    },
    'cyber': {
        id: 'cyber',
        name: 'Cyber-Punk',
        description: 'Instabile Neon-Shader mit experimentellen Holo-Emitter.',
        cost: { credits: 50000, nanosteel: 5000 },
        styleClass: 'bg-fuchsia-950 border-cyan-400 shadow-[0_0_10px_#06b6d4]',
        iconClass: 'text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]',
        effect: 'glitch'
    },
    'gold': {
        id: 'gold',
        name: 'Royal Gold',
        description: 'Pures Gold-Plating. Zeig dem Universum deinen Reichtum.',
        cost: { credits: 1000000 },
        styleClass: 'bg-yellow-50 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]',
        iconClass: 'text-yellow-600',
        effect: 'sparkle'
    },
    'banana': {
        id: 'banana',
        name: 'Nano-Banan Elite',
        description: 'Angetrieben durch einen instabilen Kalium-Kern. Das ultimative Statussymbol.',
        cost: { gems: 50 }, // "Nano Bananen" are Gems
        styleClass: 'bg-yellow-400 border-yellow-600 shadow-[0_0_30px_rgba(250,204,21,0.6)]',
        iconClass: 'text-yellow-900',
        effect: 'banana'
    }
};
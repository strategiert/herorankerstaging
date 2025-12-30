
import React, { useState } from 'react';
import { Hammer, Zap, Shield, Cpu, Rocket, Sword, Box, Search, Layers, Lock, Unlock, ArrowUp } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useInventory, EquipmentItem, ItemRarity, EquipmentSlot } from '../context/InventoryContext';
import { useAssistant } from '../context/AssistantContext';

// --- Configuration ---

const BLUEPRINTS: { 
    id: string; 
    name: string; 
    slot: EquipmentSlot; 
    cost: { nanosteel: number, credits: number }; 
    desc: string;
    tier: number;
    icon: any;
}[] = [
    { id: 'bp_wpn_plasma', name: 'Plasma Rifle', slot: 'weapon', cost: { nanosteel: 150, credits: 50 }, desc: 'Standard issue weapon.', tier: 1, icon: Sword },
    { id: 'bp_arm_composite', name: 'Composite Plate', slot: 'armor', cost: { nanosteel: 200, credits: 100 }, desc: 'Basic protection.', tier: 1, icon: Shield },
    { id: 'bp_chp_ai', name: 'Combat A.I.', slot: 'chip', cost: { nanosteel: 100, credits: 200 }, desc: 'Response booster.', tier: 1, icon: Cpu },
    { id: 'bp_prp_ion', name: 'Ion Thrusters', slot: 'propulsion', cost: { nanosteel: 150, credits: 150 }, desc: 'Mobility upgrade.', tier: 1, icon: Rocket },
];

const RARITY_STYLES: Record<ItemRarity, { border: string, bg: string, text: string }> = {
    'grey': { border: 'border-slate-300', bg: 'bg-slate-100', text: 'text-slate-600' },
    'green': { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-600' },
    'blue': { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-600' },
    'purple': { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-600' },
    'orange': { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-600' },
};

const rollRarity = (): ItemRarity => {
    const roll = Math.random() * 100;
    if (roll < 50) return 'grey';
    if (roll < 80) return 'green';
    if (roll < 95) return 'blue';
    if (roll < 99) return 'purple';
    return 'orange';
};

// --- Sub-Components ---

interface ItemTileProps {
  item: EquipmentItem;
  onClick?: () => void;
}

const ItemTile: React.FC<ItemTileProps> = ({ item, onClick }) => {
    const style = RARITY_STYLES[item.rarity];
    const SlotIcon = item.slot === 'weapon' ? Sword : item.slot === 'armor' ? Shield : item.slot === 'chip' ? Cpu : Rocket;

    return (
        <div onClick={onClick} className={`
            relative aspect-square rounded-xl border-2 ${style.border} ${style.bg}
            flex flex-col items-center justify-center cursor-pointer shadow-sm
            active:scale-95 transition-transform overflow-hidden
        `}>
             <div className="absolute top-1 right-1 bg-black/20 rounded-md px-1 text-[9px] font-bold text-slate-700">
                L{item.level}
             </div>
             <SlotIcon className={`w-8 h-8 ${style.text} drop-shadow-sm`} />
             <div className={`
                absolute bottom-0 left-0 right-0 py-1 text-[9px] text-center font-bold uppercase truncate px-1
                bg-white/80 backdrop-blur-sm text-slate-700
             `}>
                {item.name}
             </div>
             {item.equippedToId && (
                 <div className="absolute top-1 left-1">
                     <Lock className="w-3 h-3 text-slate-400" />
                 </div>
             )}
        </div>
    );
};

// --- Main Component ---

export const Nanoforge = () => {
    const { deductResources } = useGame();
    const { addItem, inventory } = useInventory();
    const { triggerEvent } = useAssistant(); // K.O.R.A. Integration
    
    const [view, setView] = useState<'craft' | 'storage'>('storage');
    const [craftingId, setCraftingId] = useState<string | null>(null);

    const handleCraft = async (bp: typeof BLUEPRINTS[0]) => {
        if (!deductResources(bp.cost)) {
            alert("Nicht genug Ressourcen!");
            return;
        }

        setCraftingId(bp.id);
        
        // Quick "pop" delay
        await new Promise(r => setTimeout(r, 600));

        const rarity = rollRarity();
        const multiplier = rarity === 'orange' ? 3 : rarity === 'purple' ? 2 : rarity === 'blue' ? 1.5 : rarity === 'green' ? 1.2 : 1;
        const baseStat = Math.floor(10 * multiplier); 

        const newItem: EquipmentItem = {
            id: crypto.randomUUID(),
            templateId: bp.id,
            name: `${bp.name}`,
            category: 'equipment',
            rarity: rarity,
            slot: bp.slot,
            level: 1,
            description: bp.desc,
            stats: {}
        };

        if (bp.slot === 'weapon') newItem.stats = { atk: baseStat };
        if (bp.slot === 'armor') newItem.stats = { def: baseStat, hp: baseStat * 5 };
        if (bp.slot === 'chip') newItem.stats = { atk: Math.floor(baseStat/2), spd: Math.floor(baseStat/2) };
        if (bp.slot === 'propulsion') newItem.stats = { spd: baseStat, hp: baseStat * 2 };

        addItem(newItem);
        setCraftingId(null);
        setView('storage'); // Switch to storage to see new item
        
        // Trigger K.O.R.A.
        triggerEvent('craft_item', `Gegenstand hergestellt: ${bp.name} (${rarity}).`);
    };

    return (
        <div className="h-full flex flex-col bg-[#f0f4f8] text-slate-800 font-sans">
            {/* Top Bar Tabs */}
            <div className="flex p-2 gap-2 bg-white shadow-sm z-10">
                <button 
                    onClick={() => setView('storage')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2
                    ${view === 'storage' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    <Box className="w-4 h-4"/> Inventar
                </button>
                <button 
                    onClick={() => setView('craft')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2
                    ${view === 'craft' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    <Hammer className="w-4 h-4"/> Fertigung
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {view === 'storage' ? (
                    inventory.equipment.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-40">
                            <Box className="w-16 h-16 text-slate-400 mb-2" />
                            <p className="font-bold text-slate-500">Leer</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                            {/* Reverse to show newest first */}
                            {[...inventory.equipment].reverse().map(item => (
                                <ItemTile key={item.id} item={item} />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="space-y-3">
                        {BLUEPRINTS.map(bp => (
                            <div key={bp.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                    <bp.icon className="w-8 h-8 text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-800 text-sm uppercase">{bp.name}</h3>
                                    <p className="text-xs text-slate-500 mb-2 truncate">{bp.desc}</p>
                                    <div className="flex gap-2 text-[10px] font-bold text-slate-400">
                                        <span className="flex items-center gap-1"><Box className="w-3 h-3"/> {bp.cost.nanosteel}</span>
                                        <span className="flex items-center gap-1"><Zap className="w-3 h-3"/> {bp.cost.credits}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleCraft(bp)}
                                    disabled={craftingId !== null}
                                    className={`
                                        h-10 px-4 rounded-lg font-bold text-xs shadow-md uppercase tracking-wide
                                        ${craftingId === bp.id ? 'bg-slate-300 text-white' : 'bg-green-500 text-white hover:bg-green-600 game-btn border-green-700'}
                                    `}
                                >
                                    {craftingId === bp.id ? '...' : 'Craft'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

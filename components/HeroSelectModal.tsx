
import React, { useState } from 'react';
import { SpireHero, Faction, FACTION_COLORS, FACTION_ICONS, FACTION_EFFECTIVENESS } from '../context/SpireContext';
import { Check, X, UserPlus } from 'lucide-react';

interface HeroSelectModalProps {
  heroes: SpireHero[];
  enemyFaction: Faction;
  onSelect: (hero: SpireHero) => void;
  onClose: () => void;
  onNavigateToRecruit?: () => void;
}

export function HeroSelectModal({ heroes, enemyFaction, onSelect, onClose, onNavigateToRecruit }: HeroSelectModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Get the counter faction for the current enemy
  const counterFaction = Object.entries(FACTION_EFFECTIVENESS).find(
    ([_, value]) => value.strongAgainst === enemyFaction
  )?.[0] as Faction | undefined;

  const selectedHero = heroes.find(h => h.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black text-white italic uppercase">Champion Wählen</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Intel Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Gegner Fraktion</span>
                    <div className="flex items-center gap-1 font-black text-white">
                        <span>{FACTION_ICONS[enemyFaction]}</span>
                        <span>{enemyFaction}</span>
                    </div>
                </div>
                <div className="text-2xl text-slate-600">➜</div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Empfohlen</span>
                    {counterFaction ? (
                        <div className="flex items-center gap-1 font-black text-green-400 animate-pulse">
                            <span>{counterFaction}</span>
                            <span>{FACTION_ICONS[counterFaction]}</span>
                        </div>
                    ) : (
                        <span>-</span>
                    )}
                </div>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {heroes.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
                    <p className="text-xs font-bold uppercase mb-3">Keine einsatzbereiten Einheiten</p>
                    {onNavigateToRecruit && (
                        <button 
                            onClick={() => { onClose(); onNavigateToRecruit(); }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase shadow-lg flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" /> Rekrutieren
                        </button>
                    )}
                </div>
            )}
            {heroes.map(hero => {
                const isCounter = hero.faction === counterFaction;
                const isSelected = selectedId === hero.id;
                
                return (
                    <button 
                        key={hero.id}
                        onClick={() => setSelectedId(hero.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all relative overflow-hidden ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}
                    >
                        <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-2xl border border-slate-700 overflow-hidden shrink-0">
                            {hero.image}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="font-black text-white truncate text-sm">{hero.name}</div>
                                {isCounter && <span className="bg-green-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded">+25% DMG</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/30 border border-white/10`} style={{ color: FACTION_COLORS[hero.faction] }}>
                                    {FACTION_ICONS[hero.faction]} {hero.faction}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">PWR {hero.power}</span>
                            </div>
                        </div>
                        {isSelected && <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
                    </button>
                );
            })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
            <button 
                onClick={() => selectedHero && onSelect(selectedHero)}
                disabled={!selectedHero}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase text-lg rounded-xl shadow-lg active:scale-95 transition-all"
            >
                In den Kampf
            </button>
        </div>
      </div>
    </div>
  );
}

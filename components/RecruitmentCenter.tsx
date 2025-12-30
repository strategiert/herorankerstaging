
import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Hexagon, Loader2, UserPlus, AlertCircle, Database, Ticket } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useInventory } from '../context/InventoryContext';
import { ExternalHero, Hero } from '../types';
import { transformHero } from '../services/geminiService';
import { saveHero } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { useAssistant } from '../context/AssistantContext';

interface RecruitmentCenterProps {
  importedHeroes: ExternalHero[];
  onHeroRecruited: (hero: Hero) => void;
}

export const RecruitmentCenter: React.FC<RecruitmentCenterProps> = ({ importedHeroes, onHeroRecruited }) => {
  const { state, deductResources, incrementHeroCount } = useGame();
  const { inventory, removeItem } = useInventory();
  const { user, guestId } = useAuth();
  const { triggerEvent } = useAssistant(); // K.O.R.A. Integration
  const effectiveUserId = user ? user.id : guestId;

  const [isAnimating, setIsAnimating] = useState(false);
  const [result, setResult] = useState<Hero | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pullType, setPullType] = useState<'standard' | 'elite' | null>(null);

  // Costs
  const STANDARD_COST = { credits: 1000 };
  const ELITE_COST = { gems: 100 };

  // Check for tickets
  const standardTicketCount = inventory.consumables.filter(i => i.templateId === 'recruit_ticket').length;

  const handleSummon = async (type: 'standard' | 'elite') => {
    if (importedHeroes.length === 0) {
      setError("Keine DNA-Daten in der Datenbank gefunden.");
      return;
    }

    let costPaid = false;

    // Logic: Use Ticket FIRST if available for Standard
    if (type === 'standard' && standardTicketCount > 0) {
       const ticket = inventory.consumables.find(i => i.templateId === 'recruit_ticket');
       if(ticket) {
           costPaid = true;
           removeItem('recruit_ticket'); // This assumes removeItem logic handles it.
       }
    } 
    
    if (!costPaid) {
        const cost = type === 'standard' ? STANDARD_COST : ELITE_COST;
        if (!deductResources(cost)) return;
    }

    setPullType(type);
    setIsAnimating(true);
    setResult(null);
    setError(null);
    
    // Trigger K.O.R.A. start
    triggerEvent('recruit_start', 'Suche nach neuen Biologischen Einheiten gestartet.');

    try {
      const randomIndex = Math.floor(Math.random() * importedHeroes.length);
      const baseHero = importedHeroes[randomIndex];
      const newHero = await transformHero(baseHero);
      
      await saveHero(newHero, effectiveUserId);
      incrementHeroCount(); // Track for Missions
      
      setResult(newHero);
      onHeroRecruited(newHero); 
      
      // Trigger K.O.R.A. success
      triggerEvent('recruit_success', `Rekrutierung erfolgreich: ${newHero.name} (${newHero.appearance.race}).`);

    } catch (e: any) {
      console.error(e);
      setError("Beschwörung fehlgeschlagen: " + e.message);
      triggerEvent('recruit_error', 'Fehler in der Gen-Sequenzierung.');
    } finally {
      setIsAnimating(false);
    }
  };

  const reset = () => {
    setResult(null);
    setPullType(null);
  };

  // --- RENDER STATES ---

  if (isAnimating) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="w-64 h-64 border-4 border-blue-500/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-32 h-32 bg-blue-500 blur-2xl rounded-full animate-pulse"></div>
               <Hexagon className="w-16 h-16 text-white animate-spin duration-700" fill="currentColor" />
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-black text-white tracking-widest animate-pulse uppercase">
            {pullType === 'elite' ? 'PRIORITY SIGNAL DETECTED' : 'SCANNING MULTIVERSE...'}
          </h2>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-slate-900 to-slate-900"></div>
        <div className="relative z-10 w-full max-w-md animate-in zoom-in duration-500">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/50 rounded-2xl p-1 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
             <div className="relative aspect-[3/4] bg-black rounded-xl overflow-hidden mb-4">
                <img src={result.image.url} className="w-full h-full object-cover" alt={result.name} />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                   <h1 className="text-3xl font-black text-white italic uppercase leading-none mb-1">{result.name}</h1>
                   <p className="text-slate-300 text-sm font-bold uppercase">{result.appearance.race}</p>
                </div>
             </div>
             <div className="p-4 pt-0">
                <button onClick={reset} className="w-full py-4 bg-amber-500 text-black font-black text-lg uppercase rounded-xl shadow-lg active:scale-95 transition-transform">AKZEPTIEREN</button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#f0f4f8] overflow-y-auto custom-scrollbar">
      <div className="bg-slate-900 text-white p-6 pb-12 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-10 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black italic tracking-tighter mb-2 flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" /> WARPGATE
          </h1>
          <p className="text-slate-400 text-sm max-w-xs">Beschwöre legendäre Helden aus dem Multiversum.</p>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-6 pb-20 space-y-4">
        {error && <div className="bg-red-100 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-bold shadow-sm"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}

        {/* Standard Pull */}
        <div className="bg-white rounded-2xl p-1 shadow-md border border-slate-100 overflow-hidden">
           <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-t-xl relative overflow-hidden">
              <h3 className="text-white font-black text-xl uppercase italic relative z-10">Standard Signal</h3>
              <p className="text-blue-100 text-xs font-bold uppercase relative z-10">Häufig: Human, Soldier, Droid</p>
           </div>
           <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                 <div className="text-slate-500 text-xs font-bold uppercase">Kosten</div>
                 {standardTicketCount > 0 ? (
                     <div className="flex items-center gap-2 text-green-600 font-black text-sm bg-green-100 px-3 py-1 rounded-full border border-green-200">
                        <Ticket className="w-4 h-4 fill-current" />
                        {standardTicketCount} Ticket(s)
                     </div>
                 ) : (
                     <div className="flex items-center gap-1 text-yellow-600 font-black text-lg">
                        <Zap className="w-4 h-4 fill-current" /> 1,000
                     </div>
                 )}
              </div>
              <button 
                onClick={() => handleSummon('standard')}
                disabled={standardTicketCount === 0 && (state.resources.credits < STANDARD_COST.credits || importedHeroes.length === 0)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {standardTicketCount > 0 ? 'Ticket benutzen' : (state.resources.credits < STANDARD_COST.credits ? 'Nicht genug Credits' : 'Beschwören')}
              </button>
           </div>
        </div>

        {/* Elite Pull */}
        <div className="bg-white rounded-2xl p-1 shadow-md border border-slate-100 overflow-hidden">
           <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4 rounded-t-xl relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase shadow-sm z-20">High Voltage</div>
              <h3 className="text-white font-black text-xl uppercase italic relative z-10">Elite Frequenz</h3>
              <p className="text-purple-100 text-xs font-bold uppercase relative z-10">Häufig: Cosmic, Mutant, Deity</p>
           </div>
           <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                 <div className="text-slate-500 text-xs font-bold uppercase">Kosten</div>
                 <div className="flex items-center gap-1 text-purple-600 font-black text-lg">
                    <Hexagon className="w-4 h-4 fill-current" /> 100
                 </div>
              </div>
              <button 
                onClick={() => handleSummon('elite')}
                disabled={state.resources.gems < ELITE_COST.gems || importedHeroes.length === 0}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {state.resources.gems < ELITE_COST.gems ? 'Nicht genug Gems' : 'Elite Beschwörung'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import { Cloud, Check, Loader2, AlertCircle, UserCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useInventory } from '../context/InventoryContext';
import { useSpire } from '../context/SpireContext';
import { loadSaveGame, saveGameToCloud } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';

interface SaveManagerProps {
    onSchemaError?: () => void;
    onProfileClick?: () => void;
}

export const SaveManager: React.FC<SaveManagerProps> = ({ onSchemaError, onProfileClick }) => {
    const { state: gameState, loadState: loadGame } = useGame();
    const { inventory, loadInventory } = useInventory();
    const { currentFloor, highScore, loadSpireState } = useSpire();
    const { user, guestId, loading: authLoading } = useAuth();
    
    // Determine effective User ID: either authenticated user ID or local guest ID
    const effectiveUserId = user ? user.id : guestId;

    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'loading'>('loading');
    const hasLoadedRef = useRef(false);

    // Function to perform save
    const performSave = async () => {
        if (authLoading) return;
        setStatus('saving');
        try {
            // Construct full save object
            const saveData = {
                game: gameState,
                inventory: inventory,
                spire: { currentFloor, highScore }
            };

            const { success, error } = await saveGameToCloud(effectiveUserId, saveData);
            if (success) {
                setStatus('saved');
                setTimeout(() => setStatus('idle'), 2000);
            } else {
                setStatus('error');
                // Check for Schema Errors (42703 = column missing, 42P01 = table missing)
                if (error && (error.code === '42703' || error.code === '42P01' || error.code === 'PGRST205')) {
                    if (onSchemaError) onSchemaError();
                }
            }
        } catch (e) {
            console.error("Manual save failed", e);
            setStatus('error');
        }
    };

    // 1. Initial Load from Cloud (When User changes or on mount)
    useEffect(() => {
        if (authLoading) return; // Wait for auth check

        const init = async () => {
            // Reset loaded state when switching users so we can reload data
            hasLoadedRef.current = false; 
            setStatus('loading');
            
            try {
                console.log(`Checking cloud save for User: ${effectiveUserId} (${user ? 'Authenticated' : 'Guest'})`);
                const data = await loadSaveGame(effectiveUserId);
                
                if (data) {
                    // Overwrite local state with cloud state
                    if (data.game) loadGame(data.game);
                    if (data.inventory) loadInventory(data.inventory);
                    if (data.spire) loadSpireState(data.spire);
                    console.log("Save game loaded successfully");
                    setStatus('idle');
                } else {
                    console.log("No cloud save found for this ID. Initializing database record...");
                    // If no save found, SAVE IMMEDIATELY to create the record
                    // This prevents "No save found" persisting until the next interval
                    hasLoadedRef.current = true; // Mark as loaded so performSave works
                    await performSave(); 
                }
            } catch (e) {
                console.error("Failed to load save:", e);
                setStatus('error');
            } finally {
                hasLoadedRef.current = true;
            }
        };
        init();
    }, [effectiveUserId, authLoading]); 

    // 2. Periodic Save (Every 30 seconds)
    useEffect(() => {
        if (!hasLoadedRef.current) return; 

        const interval = setInterval(performSave, 30000);
        return () => clearInterval(interval);
    }, [gameState, inventory, currentFloor, highScore, effectiveUserId, onSchemaError, authLoading]);

    // UI Indicator
    return (
        <div className="fixed top-2 right-2 z-50 flex items-center gap-2 pointer-events-auto">
            {/* Profile Button */}
            <button 
                onClick={onProfileClick}
                className={`flex items-center justify-center w-8 h-8 rounded-full border text-white hover:bg-black/60 transition-colors shadow-lg active:scale-95 overflow-hidden ${user ? 'bg-green-600 border-green-400' : 'bg-black/40 backdrop-blur-md border-white/10'}`}
                title={user ? `Angemeldet als ${user.email}` : "Gast-Modus (Nicht gesichert)"}
            >
                {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <UserCircle className="w-5 h-5" />
                )}
            </button>

            {/* Save Status Button */}
            <button 
                onClick={performSave}
                disabled={status === 'saving' || status === 'loading'}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-xs font-bold text-white shadow-lg select-none hover:bg-black/60 transition-colors active:scale-95 cursor-pointer"
            >
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                        <span className="opacity-80 hidden sm:inline">Loading...</span>
                    </>
                )}
                {status === 'saving' && (
                    <>
                        <Cloud className="w-3 h-3 animate-pulse text-yellow-400" />
                        <span className="opacity-80 hidden sm:inline">Saving...</span>
                    </>
                )}
                {status === 'saved' && (
                    <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 hidden sm:inline">Saved</span>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span className="text-red-400 hidden sm:inline">Offline</span>
                    </>
                )}
                {status === 'idle' && (
                    <>
                        <Cloud className={`w-3 h-3 ${user ? 'text-green-400' : 'text-slate-400'}`} />
                        <span className="text-slate-400 hidden sm:inline">Sync</span>
                    </>
                )}
            </button>
        </div>
    );
};
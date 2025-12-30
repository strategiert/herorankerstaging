
import { supabase, isConfigured } from './supabaseService';
import { GameState } from '../types/economy';
import { InventoryState } from '../context/InventoryContext';
import { SpireState } from '../context/SpireContext';

export interface UserSaveData {
    user_id: string;
    email?: string; // Optional, hard to get via simple query join depending on structure
    game_state: GameState;
    inventory_state: InventoryState;
    spire_state: SpireState;
    updated_at: string;
}

// Prüft, ob der aktuelle User der Admin ist (Client-Side Check für UI, Server-Side via RLS)
export const checkIsAdmin = async () => {
    if (!isConfigured()) return false;
    const { data: { user } } = await supabase.auth.getUser();
    // Hier kannst du auch eine Liste von Emails prüfen
    // WICHTIG: Das ist nur für die UI. Die echte Sicherheit kommt von der Datenbank Policy.
    const adminEmails = ['klausarentde@gmail.com']; 
    // HINWEIS AN DEN NUTZER: Trage hier deine Email ein, damit der Button im Profil erscheint.
    
    return user && adminEmails.includes(user.email || '');
};

export const fetchAllSaves = async (): Promise<UserSaveData[]> => {
    if (!isConfigured()) throw new Error("DB not connected");

    const { data, error } = await supabase
        .from('save_games')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50); // Limit to avoid crashing browser with massive JSONs

    if (error) throw new Error(error.message);
    return data as UserSaveData[];
};

export const overwriteUserSave = async (userId: string, data: Partial<UserSaveData>) => {
    if (!isConfigured()) throw new Error("DB not connected");

    // Construct the update payload carefully
    const updatePayload: any = {
        updated_at: new Date().toISOString()
    };
    
    if (data.game_state) updatePayload.game_state = data.game_state;
    if (data.inventory_state) updatePayload.inventory_state = data.inventory_state;
    if (data.spire_state) updatePayload.spire_state = data.spire_state;

    const { error } = await supabase
        .from('save_games')
        .update(updatePayload)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
};

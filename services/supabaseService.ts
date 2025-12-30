import { createClient } from '@supabase/supabase-js';
import { ExternalHero, Hero } from '../types';
import { GameState } from '../types/economy';
import { InventoryState } from '../context/InventoryContext';
import { SpireState } from '../context/SpireContext';

// --- WICHTIGE KONFIGURATION ---
// Damit Spieler das Spiel direkt starten können, trage hier deine Supabase Daten ein.
// Diese Daten sind "public" (öffentlich) sicher, solange RLS (Row Level Security) in der Datenbank aktiv ist.

const MANUAL_URL = 'https://uwzmldtoiulcezexsclo.supabase.co'; 
const MANUAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3em1sZHRvaXVsY2V6ZXhzY2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NTQxNTksImV4cCI6MjA4MjQzMDE1OX0.j4NL27vw0wRZUgPiF2yy-wMyNwXVnUlTibauiqIn0hk';

// ------------------------------

const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
  } catch (e) { }
  return '';
};

// Helper to clean inputs (remove whitespace, trailing slash)
const cleanConfig = (val: string | null | undefined) => {
    if (!val) return '';
    return val.trim().replace(/\/$/, '');
};

// PRIORITY LOGIC:
// 1. Vite Environment Variables (Best Practice für Produktion)
// 2. Hardcoded Manual Variables (Einfachste Lösung für dich jetzt)
// 3. LocalStorage (Fallback, falls der User es manuell eingegeben hat)

const supabaseUrl = cleanConfig(getEnv('VITE_SUPABASE_URL')) || cleanConfig(MANUAL_URL) || cleanConfig(localStorage.getItem('sb_url'));
const supabaseKey = cleanConfig(getEnv('VITE_SUPABASE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')) || cleanConfig(MANUAL_KEY) || cleanConfig(localStorage.getItem('sb_key'));

export const isConfigured = () => {
    return supabaseUrl.length > 0 && supabaseKey.length > 0;
};

export const updateConnection = (url: string, key: string) => {
    localStorage.setItem('sb_url', url.trim().replace(/\/$/, ''));
    localStorage.setItem('sb_key', key.trim());
    window.location.reload();
};

// Create client only if configured to avoid errors
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder', 
    {
        auth: {
            persistSession: true, 
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: localStorage
        }
    }
);

// --- AUTH FUNCTIONS ---

export const signInWithGoogle = async () => {
  if (!isConfigured()) return { error: { message: "Datenbank nicht verbunden." } };
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, 
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!isConfigured()) return { error: { message: "Datenbank nicht verbunden." } };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!isConfigured()) return { error: { message: "Datenbank nicht verbunden." } };
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  if (!isConfigured()) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (!isConfigured()) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// --- DATA FUNCTIONS ---

export const REQUIRED_TABLE_NAME = 'superheroes_raw';
export const MY_HEROES_TABLE = 'my_heroes';
export const SAVE_GAME_TABLE = 'save_games';

export const SCHEMA_SQL = `
-- SYSTEM REPAIR & SETUP SCRIPT
-- Führe dieses Skript im Supabase SQL Editor aus.

-- 1. Tabelle 'my_heroes' (Die Armee der Spieler)
DROP TABLE IF EXISTS my_heroes;
CREATE TABLE my_heroes (
    id text PRIMARY KEY,                   -- UUID des Helden
    user_id text NOT NULL,                 -- Wem gehört der Held?
    data jsonb NOT NULL DEFAULT '{}'::jsonb, 
    created_at timestamptz DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE my_heroes ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder darf lesen/schreiben, solange er seine ID benutzt (für Gäste & Auth)
CREATE POLICY "Enable access for users based on ID" ON my_heroes
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Tabelle 'save_games' (Basis, Inventar, Spire)
DROP TABLE IF EXISTS save_games;
CREATE TABLE save_games (
    user_id text PRIMARY KEY,              -- ID des Spielers
    game_state jsonb DEFAULT '{}'::jsonb,
    inventory_state jsonb DEFAULT '{}'::jsonb,
    spire_state jsonb DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE save_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable access for users based on ID" ON save_games
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Fix Berechtigungen für 'superheroes_raw' (Katalog)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'superheroes_raw') THEN
        ALTER TABLE "superheroes_raw" ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Enable read access for all users" ON "superheroes_raw";
        CREATE POLICY "Enable read access for all users" ON "superheroes_raw" FOR SELECT USING (true);
    END IF;
END
$$;
`;

export const listTables = async (): Promise<string[]> => {
  if (!isConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) return [];
    return data ? data.map((row: any) => row.table_name) : [];
  } catch (e) {
    return [];
  }
};

// Robust utility to remove surrounding quotes and 'None' strings
const cleanStr = (val: any): string => {
  if (typeof val !== 'string') return '';
  let cleaned = val.replace(/^['"]+|['"]+$/g, '').trim();
  if (cleaned.toLowerCase() === 'none' || cleaned === '-') return '';
  return cleaned;
};

// Helper to calculate total stats for comparison
const getPowerScore = (h: ExternalHero) => {
    return (h.intelligence || 0) + (h.strength || 0) + (h.speed || 0) + 
           (h.durability || 0) + (h.power || 0) + (h.combat || 0);
};

export const fetchRawHeroes = async (limit = 1000, offset = 0): Promise<ExternalHero[]> => {
  if (!isConfigured()) {
      throw new Error("API_KEY_MISSING");
  }

  const { data, error } = await supabase
    .from(REQUIRED_TABLE_NAME) 
    .select('*')
    .range(offset, offset + limit - 1);

  if (error) {
      const msg = error.message || JSON.stringify(error);
      if (error.code === 'PGRST205' || error.code === '42P01') {
            throw new Error(`Tabelle '${REQUIRED_TABLE_NAME}' nicht gefunden.`);
      }
      if (msg.includes('Failed to fetch')) {
          throw new Error('Verbindung fehlgeschlagen. Bitte URL/Key prüfen.');
      }
      throw new Error(`Supabase Error (${error.code || 'ERR'}): ${msg}`);
  }

  if (!data) return [];

  const processedHeroes: ExternalHero[] = data.map((record: any) => {
    
    const getVal = (keys: string[]) => {
        for(const k of keys) {
            if (record[k] !== undefined && record[k] !== null) return record[k];
            if (record[k.toLowerCase()] !== undefined && record[k.toLowerCase()] !== null) return record[k.toLowerCase()];
        }
        return undefined;
    };

    return {
        name: cleanStr(getVal(['Character', 'character', 'name', 'Name'])) || 'Unknown',
        full_name: cleanStr(getVal(['full_name', 'FullName', 'Real_Name', 'Alter_Egos', 'alter_egos'])) || 'Unknown',
        race: cleanStr(getVal(['race', 'Race', 'Species'])) || 'Unknown',
        publisher: cleanStr(getVal(['publisher', 'Publisher'])) || 'Unknown',
        alignment: cleanStr(getVal(['alignment', 'Alignment'])) || 'neutral',
        
        intelligence: Number(getVal(['intelligence', 'Intelligence'])) || 0,
        strength: Number(getVal(['strength', 'Strength'])) || 0,
        speed: Number(getVal(['speed', 'Speed'])) || 0,
        durability: Number(getVal(['durability', 'Durability'])) || 0,
        power: Number(getVal(['power', 'Power'])) || 0,
        combat: Number(getVal(['combat', 'Combat'])) || 0,
        
        description: cleanStr(getVal(['description', 'Description', 'History'])),
        image: cleanStr(getVal(['image_url', 'image', 'Image', 'url']))
    };
  });

  // SMART DEDUPLICATION
  const uniqueHeroes = new Map<string, ExternalHero>();
  
  processedHeroes.forEach(hero => {
      if (!hero.name || hero.name === 'Unknown') return;

      const existing = uniqueHeroes.get(hero.name);
      
      if (!existing) {
          uniqueHeroes.set(hero.name, hero);
      } else {
          const scoreNew = getPowerScore(hero);
          const scoreExisting = getPowerScore(existing);
          
          if (scoreNew > scoreExisting) {
              uniqueHeroes.set(hero.name, hero);
          } else if (scoreNew === scoreExisting && !existing.image && hero.image) {
              uniqueHeroes.set(hero.name, hero);
          }
      }
  });

  return Array.from(uniqueHeroes.values());
};

// --- HEROES SYNC ---

export const fetchMyHeroes = async (userId: string): Promise<Hero[]> => {
    if (!isConfigured()) return [];
    
    const { data, error } = await supabase
        .from(MY_HEROES_TABLE)
        .select('*')
        .eq('user_id', userId) // Filter by user
        .order('created_at', { ascending: false });

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('data')) {
            console.warn("Spalte 'data' fehlt in 'my_heroes'. Tabelle muss neu erstellt werden.");
            return [];
        }
        if (error.code === 'PGRST205' || error.code === '42P01') {
            console.warn(`Tabelle '${MY_HEROES_TABLE}' noch nicht erstellt.`);
            throw new Error('TABLE_MISSING');
        }
        // Column not found (usually user_id missing)
        if (error.code === '42703') {
             console.error("Datenbank Schema veraltet. Bitte SQL-Reparatur ausführen.");
             throw new Error("SCHEMA_MISMATCH");
        }
        console.error("Fetch My Heroes Error:", error.message || JSON.stringify(error));
        throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    return data ? data.map((row: any) => row.data) : [];
};

export const saveHero = async (hero: Hero, userId: string): Promise<void> => {
    if (!isConfigured()) return;

    const { error } = await supabase
        .from(MY_HEROES_TABLE)
        .upsert({
            id: hero.id,
            user_id: userId, // Associate with user
            data: hero
        });

    if (error) {
        if (error.code === 'PGRST204' || error.code === '42703') {
             console.error("SCHEMA FEHLER: Die Tabelle 'my_heroes' hat die falsche Struktur.");
             return;
        }
        if (error.code === 'PGRST205' || error.code === '42P01') {
             console.error("Tabelle 'my_heroes' existiert nicht.");
             return; 
        }
        console.error(`Fehler beim Speichern (${error.code}):`, error.message || JSON.stringify(error));
    }
};

// --- FULL SAVE GAME SYNC ---

export interface FullSaveData {
    game: GameState;
    inventory: InventoryState;
    spire: Partial<SpireState>;
}

export const loadSaveGame = async (userId: string): Promise<FullSaveData | null> => {
    if (!isConfigured()) return null;

    const { data, error } = await supabase
        .from(SAVE_GAME_TABLE)
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No rows found, new user
        if (error.code === 'PGRST205' || error.code === '42P01' || error.code === '42703') {
             console.warn(`Tabelle '${SAVE_GAME_TABLE}' defekt oder fehlt.`);
             return null;
        }
        console.error("Load Game Error:", JSON.stringify(error));
        return null;
    }

    return {
        game: data.game_state,
        inventory: data.inventory_state,
        spire: data.spire_state
    };
};

export const saveGameToCloud = async (userId: string, data: FullSaveData): Promise<{ success: boolean; error?: any }> => {
    if (!isConfigured()) return { success: false, error: 'Not configured' };

    const { error } = await supabase
        .from(SAVE_GAME_TABLE)
        .upsert({
            user_id: userId,
            game_state: data.game,
            inventory_state: data.inventory,
            spire_state: data.spire,
            updated_at: new Date().toISOString()
        });

    if (error) {
        if (error.code === '42703' || error.code === '42P01') {
            console.error("CRITICAL: Datenbank-Struktur falsch.");
        } else {
            console.error("Cloud Save Error:", JSON.stringify(error));
        }
        return { success: false, error };
    }
    return { success: true };
};

export const seedDatabase = async (onProgress?: (msg: string) => void) => {
    console.warn("Seeding disabled.");
    return 0;
};
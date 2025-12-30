
import { BuildingType } from '../types/economy';

// Fallback Repo (falls lokal keine Bilder da sind)
// Wir nutzen hier Platzhalter-Bilder, damit es nicht "kaputt" aussieht, wenn eigene Bilder fehlen.
const REMOTE_FALLBACK_MAP = 'https://images.unsplash.com/photo-1465101162946-43580211a95a?q=80&w=2306&auto=format&fit=crop'; 

// Path to building images: /assets/buildings/TYPE_skin.png
// NOTE: Files in 'public' are served at root path.
export const getBuildingAssetPath = (type: BuildingType, skinId: string = 'default'): string => {
  // Try clean relative path for Vite
  return `assets/buildings/${type}_${skinId}.png`;
};

export const getRemoteBuildingPath = (type: BuildingType, skinId: string = 'default'): string => {
    // Falls das GitHub Repo nicht existiert, könnten wir hier generische Icons zurückgeben
    // Für jetzt lassen wir es, damit der User merkt, dass er eigene Bilder braucht.
    return `https://raw.githubusercontent.com/strategiert/Heroranker/main/public/assets/buildings/${type}_${skinId}.png`;
};

// Path to map background
export const getMapAssetPath = (): string => {
  return `assets/map/station_map.png`;
};

export const getRemoteMapPath = (): string => {
    return REMOTE_FALLBACK_MAP;
};

export const getLogoPath = (): string => {
    return `assets/logo/logo_nobg.png`;
};

// Fallback CSS background if no image is found (The "Blue" Style)
// Made darker and cooler to look like a purposeful "Holographic Grid"
export const getMapBackgroundStyle = () => {
  return {
      backgroundImage: `
        radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.1) 0%, transparent 60%),
        linear-gradient(0deg, transparent 24%, rgba(56, 189, 248, 0.03) 25%, rgba(56, 189, 248, 0.03) 26%, transparent 27%, transparent 74%, rgba(56, 189, 248, 0.03) 75%, rgba(56, 189, 248, 0.03) 76%, transparent 77%, transparent),
        linear-gradient(90deg, transparent 24%, rgba(56, 189, 248, 0.03) 25%, rgba(56, 189, 248, 0.03) 26%, transparent 27%, transparent 74%, rgba(56, 189, 248, 0.03) 75%, rgba(56, 189, 248, 0.03) 76%, transparent 77%, transparent)
      `,
      backgroundSize: '100% 100%, 40px 40px, 40px 40px',
      backgroundColor: '#020617' // Very dark slate
  };
};

# Infinite Spire - Integration Guide

## 📁 Dateistruktur

```
src/
├── components/
│   └── Spire/
│       ├── index.ts              # Exports
│       ├── SpireScreen.tsx       # Hauptkomponente
│       ├── LockOnBar.tsx         # Timing-Minigame
│       ├── VictoryScreen.tsx     # Loot/Victory Modal
│       └── HeroSelectModal.tsx   # Heldenauswahl
└── contexts/
    └── SpireContext.tsx          # State Management
```

## 🚀 Quick Start

### 1. Integration in deine App

```tsx
import React from 'react';
import { SpireProvider, SpireScreen, Hero } from './components/Spire';
import { useGame } from './contexts/GameContext'; // Dein bestehender Context

function SpirePage() {
  const { unlockedHeroes, addItem } = useGame();
  
  return (
    <SpireProvider 
      unlockedHeroes={unlockedHeroes} 
      onAddItem={addItem}
    >
      <SpireScreen unlockedHeroes={unlockedHeroes} />
    </SpireProvider>
  );
}
```

### 2. Hero-Datenformat

Stelle sicher, dass deine Heroes dieses Format haben:

```tsx
interface Hero {
  id: string;
  name: string;
  image: string;          // Emoji oder Bild-URL
  faction: Faction;       // 'Mechanoid' | 'Terraguard' | 'Solaris' | 'Voidborn' | 'Neutral'
  power: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  abilities: string[];
}

// Beispiel:
const exampleHero: Hero = {
  id: 'hero_1',
  name: 'Der Null-Vektor',
  image: '🤖',
  faction: 'Mechanoid',
  power: 535,
  maxHp: 150,
  currentHp: 150,
  attack: 45,
  defense: 20,
  abilities: ['Laser Beam', 'Shield Matrix', 'Overclock'],
};
```

### 3. Item-System Integration

Der `onAddItem` Callback erhält Items in diesem Format:

```tsx
interface Item {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  description: string;
}

// In deinem GameContext:
const addItem = (item: Item) => {
  setInventory(prev => {
    const existing = prev.find(i => i.id === item.id);
    if (existing) {
      return prev.map(i => 
        i.id === item.id 
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    }
    return [...prev, item];
  });
};
```

## ⚔️ Gameplay-Features

### Fraktions-System (Rock-Paper-Scissors)

```
Mechanoid  →  beats Voidborn   →  beats Solaris    →  beats Terraguard  →  beats Mechanoid
   🤖    ─────►     👁️     ─────►     ☀️     ─────►       🛡️       ─────►      🤖
```

**Bonus:** +20% Schaden wenn der Hero die richtige Counter-Fraktion hat.

### Timing-Minigame (LockOnBar)

- Klick auf "LOCK ON" startet den bewegenden Cursor
- Klick auf "FIRE" wenn der Cursor in der gelben Zone ist
- **Critical Hit:** 2x Schaden + Screen Shake
- **Miss:** 0.5x Schaden

Schwierigkeit skaliert mit Floor:
- Floor 1-4: Große Sweet-Spot Zone, langsamer Cursor
- Floor 5+: Zone wird kleiner, Cursor schneller

### Loot-System

Drop-Chancen basieren auf Floor-Level:
- **Common:** 80-100% (Scrap Metal, Credits)
- **Uncommon:** 30%+ (Energy Cell)
- **Rare:** 5-25% (Rare Alloy)
- **Epic:** 0-10% (Void Shard)
- **Legendary:** 50% nur bei Boss-Floors (jede 10. Etage)

## 🎨 Styling-Anpassungen

Die Komponenten nutzen Tailwind CSS. Wichtige Klassen:

```css
/* Dark Sci-Fi Theme */
.spire-bg {
  @apply bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950;
}

/* Faction Colors (bereits in SpireContext definiert) */
const FACTION_COLORS = {
  Mechanoid: '#3B82F6', // Blue
  Terraguard: '#22C55E', // Green
  Solaris: '#F59E0B',   // Amber
  Voidborn: '#A855F7',  // Purple
  Neutral: '#6B7280',   // Gray
};
```

## 🔧 Erweiterungsmöglichkeiten

### 1. Daily Challenges hinzufügen

```tsx
// In SpireContext.tsx erweitern:
interface DailyChallenge {
  id: string;
  description: string;
  requirement: (state: SpireState) => boolean;
  reward: Item[];
  expiresAt: Date;
}

const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'no_heal',
    description: 'Erreiche Floor 10 ohne Healing',
    requirement: (state) => state.currentFloor >= 10,
    reward: [{ ...ITEM_DATABASE.void_shard, quantity: 1 }],
    expiresAt: getEndOfDay(),
  },
  // ...
];
```

### 2. Boss-Modifikatoren

```tsx
interface EnemyModifier {
  id: string;
  name: string;
  icon: string;
  effect: (enemy: Enemy) => Enemy;
}

const BOSS_MODIFIERS: EnemyModifier[] = [
  {
    id: 'regenerating',
    name: 'Regenerating',
    icon: '💚',
    effect: (enemy) => ({ ...enemy, regeneration: 0.05 }),
  },
  {
    id: 'armored',
    name: 'Heavily Armored',
    icon: '🛡️',
    effect: (enemy) => ({ ...enemy, defense: enemy.defense * 1.5 }),
  },
];
```

### 3. Prestige-System

```tsx
interface PrestigeBonus {
  damageBonus: number;    // +5% pro Prestige
  hpBonus: number;        // +10% pro Prestige
  lootBonus: number;      // +2% Drop-Chance pro Prestige
}

// Nach Floor 50 Reset ermöglichen für permanente Boni
```

## 📝 Bekannte Limitierungen

1. **Keine Persistenz:** Spire-Fortschritt wird nicht gespeichert (nur Highscore in localStorage)
2. **Single Hero:** Aktuell nur 1 Hero pro Kampf (Team-System möglich)
3. **Keine Animationen:** Framer Motion nicht implementiert (nur CSS Transitions)

## 🐛 Debugging

```tsx
// Debug-Mode aktivieren
const SpireDebug = () => {
  const spire = useSpire();
  console.log('Spire State:', spire);
  return null;
};

// In SpireProvider einfügen:
<SpireProvider>
  <SpireDebug />
  <SpireScreen />
</SpireProvider>
```

---

**Viel Spaß beim Erweitern!** 🎮

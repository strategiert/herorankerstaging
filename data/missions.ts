import { BuildingType } from '../types/economy';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'BUILD' | 'RECRUIT' | 'BATTLE_FLOOR' | 'COLLECT_RESOURCE';
  targetId?: string | number; // BuildingType or Floor Number
  targetValue: number; // Level or Count
  rewards: {
    credits?: number;
    biomass?: number;
    nanosteel?: number;
    gems?: number;
    items?: { id: string, amount: number }[]; // id must match inventory templateId
  };
}

export const CHAPTER_1_MISSIONS: Mission[] = [
  {
    id: 'm1_upgrade_hq',
    title: 'Basis etablieren',
    description: 'Upgrade deine Neuronale Zitadelle (HQ) auf Level 2, um die Systemkapazität zu erhöhen.',
    type: 'BUILD',
    targetId: BuildingType.COMMAND_CENTER,
    targetValue: 2,
    rewards: {
      credits: 500,
      biomass: 500,
      items: [{ id: 'recruit_ticket', amount: 1 }]
    }
  },
  {
    id: 'm2_recruit_hero',
    title: 'Erste Rekrutierung',
    description: 'Benutze dein Rekrutierungs-Ticket im Warp-Gate (Portal), um deinen ersten Champion zu beschwören.',
    type: 'RECRUIT',
    targetValue: 1,
    rewards: {
      credits: 1000,
      nanosteel: 500,
      items: [{ id: 'speedup_5m', amount: 3 }]
    }
  },
  {
    id: 'm3_build_barracks',
    title: 'Militärinfrastruktur',
    description: 'Errichte einen Klon-Replikator, um deine Support-Truppen zu klonen.',
    type: 'BUILD',
    targetId: BuildingType.BARRACKS, 
    targetValue: 1,
    rewards: {
      biomass: 1000,
      gems: 50
    }
  },
  {
    id: 'm4_spire_floor_2',
    title: 'Spire Besteigung',
    description: 'Besiege die Wächter im Infinite Spire und erreiche Etage 2.',
    type: 'BATTLE_FLOOR',
    targetValue: 2,
    rewards: {
      credits: 2000,
      items: [{ id: 'recruit_ticket', amount: 2 }]
    }
  },
  {
    id: 'm5_upgrade_resources',
    title: 'Wirtschaftsboom',
    description: 'Bringe deine Quanten-Schmelze auf Level 3, um die Nanosteel-Produktion zu sichern.',
    type: 'BUILD',
    targetId: BuildingType.NANO_FOUNDRY,
    targetValue: 3,
    rewards: {
      nanosteel: 2000,
      biomass: 2000
    }
  }
];
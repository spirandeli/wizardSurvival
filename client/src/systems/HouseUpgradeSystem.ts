import type { GameStateSnapshot } from '@shared/types';
import { getItemDef } from '../data/items';
import { InventorySystem } from './InventorySystem';

export interface HouseTierConfig {
  level: 1 | 2 | 3;
  name: string;
  description: string;
  goldCost: number;
  materials: { itemId: string; quantity: number }[];
  perkLabel: string;
}

export const HOUSE_TIERS: HouseTierConfig[] = [
  {
    level: 1,
    name: 'Cabana Simples',
    description: 'Moradia inicial na Fazenda da Névoa.',
    goldCost: 0,
    materials: [],
    perkLabel: 'Descanso noturno padrão',
  },
  {
    level: 2,
    name: 'Chalé do Mago',
    description: 'Parede reforçada e bancada acolhedora com aura restauradora.',
    goldCost: 120,
    materials: [
      { itemId: 'madeira', quantity: 10 },
      { itemId: 'pedra', quantity: 8 },
    ],
    perkLabel: '+15 Stamina Máxima permanente',
  },
  {
    level: 3,
    name: 'Observatório da Névoa',
    description: 'Cúpula cristalina para sintonia lunar dentro de casa.',
    goldCost: 260,
    materials: [
      { itemId: 'barra_cobre', quantity: 5 },
      { itemId: 'quartzo_refinado', quantity: 4 },
      { itemId: 'madeira', quantity: 12 },
    ],
    perkLabel: '+20 Mana Máxima permanente e +10 HP Máximo',
  },
];

export function upgradeHouse(
  state: GameStateSnapshot,
  inv: InventorySystem
): { ok: boolean; message: string; newLevel?: number } {
  const current = state.houseLevel ?? 1;
  if (current >= 3) {
    return { ok: false, message: 'Sua casa já está no nível máximo (Observatório da Névoa)!' };
  }

  const nextLevel = (current + 1) as 2 | 3;
  const tier = HOUSE_TIERS.find((t) => t.level === nextLevel);
  if (!tier) return { ok: false, message: 'Melhoria indisponível.' };

  if (state.gold < tier.goldCost) {
    return { ok: false, message: `Ouro insuficiente (${tier.goldCost} G necessários).` };
  }
  for (const req of tier.materials) {
    if (!inv.hasItem(req.itemId, req.quantity)) {
      const def = getItemDef(req.itemId);
      return {
        ok: false,
        message: `Faltam materiais: ${req.quantity}x ${def?.name ?? req.itemId}.`,
      };
    }
  }

  state.gold -= tier.goldCost;
  for (const req of tier.materials) {
    inv.removeItem(req.itemId, req.quantity);
  }
  state.houseLevel = nextLevel;

  if (nextLevel === 2) {
    state.vitals.maxStamina += 15;
    state.vitals.stamina = Math.min(state.vitals.maxStamina, state.vitals.stamina + 15);
  } else if (nextLevel === 3) {
    state.vitals.maxMana += 20;
    state.vitals.mana = Math.min(state.vitals.maxMana, state.vitals.mana + 20);
    state.vitals.maxHp += 10;
    state.vitals.hp = Math.min(state.vitals.maxHp, state.vitals.hp + 10);
  }

  return {
    ok: true,
    newLevel: nextLevel,
    message: `Casa ampliada para ${tier.name}! (${tier.perkLabel})`,
  };
}


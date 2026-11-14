import type { ElementType, GameStateSnapshot, UnicornCreature } from '@shared/types';
import { InventorySystem } from './InventorySystem';

export const ALL_ELEMENTS: readonly ElementType[] = [
  'terra',
  'agua',
  'ar',
  'fogo',
  'arcano',
];

export const ELEMENT_LABELS: Record<ElementType, string> = {
  terra: 'Terra',
  agua: 'Água',
  ar: 'Ar',
  fogo: 'Fogo',
  arcano: 'Arcano',
};

export const WEAPON_ENCHANT_STEP = 6;
export const WEAPON_ENCHANT_MAX = 24;
export const ARMOR_RES_STEP = 0.12;
export const ARMOR_RES_MAX = 0.48;

export function rollUnicornEnchants(rng: () => number = Math.random): ElementType[] {
  const result: ElementType[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.min(ALL_ELEMENTS.length - 1, Math.floor(rng() * ALL_ELEMENTS.length));
    const el = ALL_ELEMENTS[idx] ?? 'arcano';
    result.push(el);
  }
  return result;
}

export class EnchantmentSystem {
  constructor(
    private state: GameStateSnapshot,
    private inventory: InventorySystem
  ) {}

  getUnicorn(unicornId: string): UnicornCreature | undefined {
    return this.state.unicorns.find((u) => u.id === unicornId);
  }

  rerollUnicorn(
    unicornId: string,
    rng: () => number = Math.random
  ): { ok: boolean; message: string; rolledEnchants?: ElementType[] } {
    const unicorn = this.getUnicorn(unicornId);
    if (!unicorn) {
      return { ok: false, message: 'Unicórnio não encontrado na fazenda.' };
    }
    if (!this.inventory.hasItem('quartzo_refinado', 1)) {
      return {
        ok: false,
        message: 'Requer 1x Quartzo Refinado para sintonizar novos encantos no Unicórnio.',
      };
    }

    this.inventory.removeItem('quartzo_refinado', 1);
    unicorn.rolledEnchants = rollUnicornEnchants(rng);
    return {
      ok: true,
      message: `${unicorn.name} sintonizou novos encantos: ${unicorn.rolledEnchants
        .map((e) => ELEMENT_LABELS[e])
        .join(', ')}.`,
      rolledEnchants: unicorn.rolledEnchants,
    };
  }

  applyEnchant(
    unicornId: string,
    slotIndex: number,
    target: 'weapon' | 'armor'
  ): { ok: boolean; message: string } {
    const unicorn = this.getUnicorn(unicornId);
    if (!unicorn) {
      return { ok: false, message: 'Choque ao menos 1 Unicórnio antes de encantar.' };
    }
    const element = unicorn.rolledEnchants[slotIndex];
    if (!element) {
      return { ok: false, message: 'Slot de encanto inválido.' };
    }
    if (!this.inventory.hasItem('leite_unicornio', 1)) {
      return {
        ok: false,
        message: 'Requer 1x Leite de Unicórnio para catalisar o encanto elemental.',
      };
    }

    if (target === 'weapon') {
      const current = this.state.enchantments.weaponBonus[element] ?? 0;
      if (current >= WEAPON_ENCHANT_MAX) {
        return {
          ok: false,
          message: `Bônus ofensivo de ${ELEMENT_LABELS[element]} já está no máximo (+${WEAPON_ENCHANT_MAX}).`,
        };
      }
      this.inventory.removeItem('leite_unicornio', 1);
      const next = Math.min(WEAPON_ENCHANT_MAX, current + WEAPON_ENCHANT_STEP);
      this.state.enchantments.weaponBonus[element] = next;
      this.state.flags.applied_unicorn_enchant = true;
      return {
        ok: true,
        message: `Cajado encantado com +${WEAPON_ENCHANT_STEP} Dano de ${ELEMENT_LABELS[element]} (total +${next})!`,
      };
    }

    const currentRes = this.state.enchantments.armorResistanceBonus[element] ?? 0;
    if (currentRes >= ARMOR_RES_MAX) {
      return {
        ok: false,
        message: `Resistência de ${ELEMENT_LABELS[element]} da armadura já está no máximo (${Math.round(
          ARMOR_RES_MAX * 100
        )}%).`,
      };
    }

    this.inventory.removeItem('leite_unicornio', 1);
    const nextRes = Math.min(ARMOR_RES_MAX, Number((currentRes + ARMOR_RES_STEP).toFixed(2)));
    this.state.enchantments.armorResistanceBonus[element] = nextRes;
    this.state.flags.applied_unicorn_enchant = true;
    return {
      ok: true,
      message: `Armadura encantada com +${Math.round(
        ARMOR_RES_STEP * 100
      )}% Resistência a ${ELEMENT_LABELS[element]} (total ${Math.round(nextRes * 100)}%)!`,
    };
  }
}

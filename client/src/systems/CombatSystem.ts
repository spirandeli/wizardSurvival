import type { ElementType, GameStateSnapshot } from '@shared/types';
import { getItemDef } from '../data/items';

export interface DamageInput {
  basePhysical: number;
  elementalDamage?: Partial<Record<ElementType, number>>;
  targetResistances?: Partial<Record<ElementType, number>>;
}

export interface DamageBreakdown {
  physicalDamage: number;
  elementalDamage: number;
  totalDamage: number;
}

export function calculateElementalDamage(input: DamageInput): DamageBreakdown {
  const physicalDamage = Math.max(0, Math.round(input.basePhysical));
  let elementalDamage = 0;

  if (input.elementalDamage) {
    for (const [element, rawValue] of Object.entries(input.elementalDamage) as [
      ElementType,
      number | undefined,
    ][]) {
      if (!rawValue || rawValue <= 0) continue;
      const rawResistance = input.targetResistances?.[element] ?? 0;
      const clampedResistance = Math.max(0, Math.min(0.85, rawResistance));
      elementalDamage += Math.round(rawValue * (1 - clampedResistance));
    }
  }

  return {
    physicalDamage,
    elementalDamage,
    totalDamage: Math.max(1, physicalDamage + elementalDamage),
  };
}

export class CombatSystem {
  static getPlayerAttackStats(state: GameStateSnapshot): {
    basePhysical: number;
    elementalDamage: Partial<Record<ElementType, number>>;
  } {
    const weapon = state.equippedWeaponId ? getItemDef(state.equippedWeaponId) : undefined;
    const merged: Partial<Record<ElementType, number>> = { ...(weapon?.elementalDamage ?? {}) };
    for (const [el, val] of Object.entries(state.enchantments?.weaponBonus ?? {}) as [
      ElementType,
      number | undefined,
    ][]) {
      if (val && val > 0) {
        merged[el] = (merged[el] ?? 0) + val;
      }
    }
    if (state.flags?.npc_perk_lyra_50) {
      for (const el of Object.keys(merged) as ElementType[]) {
        const val = merged[el];
        if (val && val > 0) {
          merged[el] = Math.max(1, Math.round(val * 1.1));
        }
      }
    }
    return {
      basePhysical: weapon?.attackPower ?? 8,
      elementalDamage: merged,
    };
  }

  static getPlayerResistances(state: GameStateSnapshot): Partial<Record<ElementType, number>> {
    const armor = state.equippedArmorId ? getItemDef(state.equippedArmorId) : undefined;
    const merged: Partial<Record<ElementType, number>> = { ...(armor?.elementalResistance ?? {}) };
    for (const [el, val] of Object.entries(state.enchantments?.armorResistanceBonus ?? {}) as [
      ElementType,
      number | undefined,
    ][]) {
      if (val && val > 0) {
        merged[el] = Math.min(0.85, (merged[el] ?? 0) + val);
      }
    }
    return merged;
  }

  static applyDamageToPlayer(
    state: GameStateSnapshot,
    basePhysical: number,
    elementalDamage?: Partial<Record<ElementType, number>>
  ): { finalDamage: number; fainted: boolean } {
    const resistances = CombatSystem.getPlayerResistances(state);
    const breakdown = calculateElementalDamage({
      basePhysical,
      elementalDamage,
      targetResistances: resistances,
    });

    state.vitals.hp = Math.max(0, state.vitals.hp - breakdown.totalDamage);
    return {
      finalDamage: breakdown.totalDamage,
      fainted: state.vitals.hp <= 0,
    };
  }

  static applyCozyFaintPenalty(state: GameStateSnapshot): { goldLost: number } {
    const goldLost = Math.min(state.gold, 25);
    state.gold = Math.max(0, state.gold - goldLost);
    state.vitals.hp = state.vitals.maxHp;
    state.vitals.stamina = state.vitals.maxStamina;
    state.vitals.mana = state.vitals.maxMana;
    return { goldLost };
  }
}

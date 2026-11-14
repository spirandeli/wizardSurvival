import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import {
  calculateElementalDamage,
  CombatSystem,
} from '../client/src/systems/CombatSystem.js';

describe('CombatSystem, Dano Elemental e Desmaio Cozy', () => {
  it('calcula dano físico + elemental mitigado por resistência da armadura', () => {
    const semResistencia = calculateElementalDamage({
      basePhysical: 10,
      elementalDamage: { terra: 20, arcano: 10 },
      targetResistances: {},
    });
    expect(semResistencia.totalDamage).toBe(40);

    const comResistencia = calculateElementalDamage({
      basePhysical: 10,
      elementalDamage: { terra: 20, arcano: 10 },
      targetResistances: { terra: 0.5, arcano: 0.99 }, // 0.99 deve ser limitado a 0.85
    });
    // terra: 20 * 0.5 = 10; arcano: round(10 * 0.15) = 2; fisico: 10 -> 22
    expect(comResistencia.totalDamage).toBe(22);
  });

  it('aplica resistência da armadura equipada e executa desmaio cozy sem perder inventário', () => {
    const state = createInitialGameState();
    state.equippedArmorId = 'armadura_granito_runico'; // 40% terra
    state.vitals.hp = 15;
    state.gold = 100;

    const hit = CombatSystem.applyDamageToPlayer(state, 10, { terra: 20 });
    // 10 + round(20 * 0.6) = 22 -> HP zera
    expect(hit.finalDamage).toBe(22);
    expect(hit.fainted).toBe(true);
    expect(state.vitals.hp).toBe(0);

    const invSnapshotBefore = JSON.stringify(state.inventory);
    const faintRes = CombatSystem.applyCozyFaintPenalty(state);

    expect(faintRes.goldLost).toBe(25);
    expect(state.gold).toBe(75);
    expect(state.vitals.hp).toBe(state.vitals.maxHp);
    expect(state.vitals.stamina).toBe(state.vitals.maxStamina);
    expect(state.vitals.mana).toBe(state.vitals.maxMana);
    expect(JSON.stringify(state.inventory)).toBe(invSnapshotBefore);
  });

  it('aplica bônus de +10% em dano elemental quando npc_perk_lyra_50 está ativo', () => {
    const state = createInitialGameState();
    state.equippedWeaponId = 'cajado_arcano_estelar';

    const baseStats = CombatSystem.getPlayerAttackStats(state);
    state.flags.npc_perk_lyra_50 = true;
    const boostedStats = CombatSystem.getPlayerAttackStats(state);

    expect(boostedStats.elementalDamage.arcano).toBeGreaterThan(
      baseStats.elementalDamage.arcano ?? 0
    );
  });
});

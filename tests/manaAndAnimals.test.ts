import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { AnimalSystem } from '../client/src/systems/AnimalSystem.js';
import { CraftingSystem } from '../client/src/systems/CraftingSystem.js';
import { InventorySystem } from '../client/src/systems/InventorySystem.js';
import { ManaSystem } from '../client/src/systems/ManaSystem.js';

describe('ManaSystem, AnimalSystem (Ovos/Mini-Dragão) e CraftingSystem', () => {
  it('consome Mana no Teleporte sem alterar a Stamina', () => {
    const state = createInitialGameState();
    const mana = new ManaSystem(state);
    const initialStamina = state.vitals.stamina;

    expect(mana.canCast('teleporte').ok).toBe(false);
    expect(mana.unlockSpell('teleporte')).toBe(true);
    expect(mana.consumeForSpell('teleporte')).toBe(true);

    expect(state.vitals.mana).toBe(45);
    expect(state.vitals.stamina).toBe(initialStamina);
  });

  it('coleta 3 ovos no porão, fabrica Incubadora, choca Mini-Dragão e libera fundição', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const animals = new AnimalSystem(state, inv);
    const crafting = new CraftingSystem(state, inv);

    // Coleta única dos 3 ovos do porão
    expect(animals.collectBasementEggs().ok).toBe(true);
    expect(inv.countItem('ovo_mini_dragao')).toBe(3);
    expect(animals.collectBasementEggs().ok).toBe(false);

    // Fundição bloqueada antes de chocar um Mini-Dragão
    expect(crafting.craft('fundir_barra_cobre').ok).toBe(false);

    // Fabrica Incubadora Arcana
    expect(crafting.craft('craft_incubadora_arcana').ok).toBe(true);
    expect(inv.countItem('incubadora_arcana')).toBe(1);

    // Inicia incubação no dia 1 e vira para o dia 2
    expect(animals.startIncubation(1).ok).toBe(true);
    expect(inv.countItem('ovo_mini_dragao')).toBe(2);

    const hatched = animals.processEndOfDay(2);
    expect(hatched.hatchedCount).toBe(1);
    expect(state.miniDragonsCount).toBe(1);

    // Sem bancada de fundição (atalho C), fundição é bloqueada
    expect(crafting.craft('fundir_barra_cobre').ok).toBe(false);

    // Na Bancada de Fundição, inicia a forja com tempo real e coleta após concluir
    const forgeTile = { tileX: 20, tileY: 12 };
    expect(crafting.craft('fundir_barra_cobre', forgeTile).ok).toBe(true);
    expect(inv.countItem('barra_cobre')).toBe(0);
    expect(crafting.tickForgeJobs(3000)).toHaveLength(0);
    expect(crafting.tickForgeJobs(3000)).toHaveLength(1);
    expect(crafting.collectReadyForgeJob(forgeTile.tileX, forgeTile.tileY).ok).toBe(true);
    expect(inv.countItem('barra_cobre')).toBe(1);
  });

  it('desbloqueia e consome mana para as 3 magias dos guardiões com redução do Guardião dos Céus', () => {
    const state = createInitialGameState();
    const mana = new ManaSystem(state);

    expect(mana.canCast('pilar_telurico').ok).toBe(false);
    expect(mana.unlockSpell('pilar_telurico')).toBe(true);
    expect(mana.unlockSpell('mare_curativa')).toBe(true);
    expect(mana.unlockSpell('raio_estelar')).toBe(true);

    expect(mana.getSpellCost('pilar_telurico')).toBe(14);
    expect(mana.consumeForSpell('pilar_telurico')).toBe(true);
    expect(state.vitals.mana).toBe(46);

    state.flags.sky_guardian_blessed = true;
    expect(mana.getSpellCost('mare_curativa')).toBe(Math.round(18 * 0.75));
    expect(mana.getSpellCost('raio_estelar')).toBe(Math.round(16 * 0.75));
  });
});


import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { CombatSystem } from '../client/src/systems/CombatSystem.js';
import { CraftingSystem } from '../client/src/systems/CraftingSystem.js';
import { generateDungeonFloor, isFloorReachable } from '../client/src/systems/DungeonGenerator.js';
import { InventorySystem } from '../client/src/systems/InventorySystem.js';
import { QuestSystem } from '../client/src/systems/QuestSystem.js';

describe('Plano V2 — Fase 3 (Ato III: Omena, Núcleo do Mundo e Endgame)', () => {
  it('gera andares da Fortaleza Dimensional de Omena alcançáveis com sentinelas e sondas', () => {
    for (let floor = 1; floor <= 3; floor++) {
      const layout = generateDungeonFloor('fortaleza_omena', floor, 4242);
      expect(layout.dungeonId).toBe('fortaleza_omena');
      expect(layout.requiresCrystalPuzzle).toBe(false);
      expect(isFloorReachable(layout, layout.startTile, layout.exitTile)).toBe(true);
      const kinds = new Set(layout.enemySpawns.map((s) => s.kind));
      expect(kinds.has('sentinela_omena') || kinds.has('sonda_ufologica')).toBe(true);
    }
  });

  it('prepara Elixir do Solstício de Névoa e aplica bônus do Cetro do Núcleo do Mundo', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const crafting = new CraftingSystem(state, inv);

    inv.addItem('tonico_nevoa', 1);
    inv.addItem('leite_unicornio', 2);
    inv.addItem('flor_de_sombra', 2);

    const craftRes = crafting.craft('preparar_elixir_solsticio');
    expect(craftRes.ok).toBe(true);
    expect(inv.hasItem('elixir_solsticio', 1)).toBe(true);

    state.equippedWeaponId = 'cetro_nucleo_mundo';
    state.enchantments.weaponBonus = { arcano: 4 };
    const stats = CombatSystem.getPlayerAttackStats(state);
    expect(stats.basePhysical).toBe(28);
    expect(stats.elementalDamage.arcano).toBe(18);
    expect(stats.elementalDamage.terra).toBe(8);
    expect(stats.elementalDamage.agua).toBe(8);
    expect(stats.elementalDamage.ar).toBe(8);
  });

  it('avança toda a campanha do Ato III (3.1 a 3.4) e desbloqueia o Modo Endgame', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const quests = new QuestSystem(state, inv);

    // Ativa e conclui 2.4 -> inicia 3.1
    quests.activateQuest('2.4_luzes_no_ceu');
    state.flags.talked_lyra_varginha = true;
    state.flags.sky_guardian_blessed = true;
    expect(quests.evaluateMainCampaign()).toContain('2.4 Luzes no Céu');
    expect(quests.getStatus('3.1_paginas_faltantes')).toBe('active');

    // 3.1 As Páginas Faltantes
    state.flags.inspected_lupin_gap1 = true;
    state.flags.talked_celeste_lupin_pages = true;
    const goldBefore31 = state.gold;
    expect(quests.evaluateMainCampaign()).toContain('3.1 As Páginas Faltantes');
    expect(state.gold).toBe(goldBefore31 + 220);
    expect(inv.countItem('elixir_solsticio')).toBe(1);
    expect(quests.getStatus('3.2_aliancas_solsticio')).toBe('active');

    // 3.2 Alianças & Festival do Solstício
    state.flags.seu_zeca_reconciled_solstice = true;
    state.flags.guardians_attuned = true;
    const goldBefore32 = state.gold;
    expect(quests.evaluateMainCampaign()).toContain('3.2 Alianças & Festival do Solstício');
    expect(state.flags.prepared_elixir_solsticio).toBe(true);
    expect(state.gold).toBe(goldBefore32 + 280);
    expect(inv.countItem('elixir_solsticio')).toBe(3);
    expect(quests.getStatus('3.3_rompimento_selo_final')).toBe('active');

    // 3.3 Rompimento do Selo Final
    state.flags.omena_portal_opened = true;
    const goldBefore33 = state.gold;
    expect(quests.evaluateMainCampaign()).toContain('3.3 O Rompimento do Selo Final');
    expect(state.gold).toBe(goldBefore33 + 300);
    expect(quests.getStatus('3.4_batalha_omena')).toBe('active');

    // 3.4 Batalha Final contra Omena & Endgame
    state.flags.omena_defeated = true;
    const goldBefore34 = state.gold;
    expect(quests.evaluateMainCampaign()).toContain('3.4 Omena e o Núcleo do Mundo');
    expect(state.gold).toBe(goldBefore34 + 800);
    expect(inv.hasItem('cetro_nucleo_mundo', 1)).toBe(true);
    expect(state.flags.act3_completed).toBe(true);
    expect(state.flags.endgame_unlocked).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { generateDungeonFloor, isFloorReachable } from '../client/src/systems/DungeonGenerator.js';
import { FarmingSystem } from '../client/src/systems/FarmingSystem.js';
import { GridSystem } from '../client/src/systems/GridSystem.js';
import { InventorySystem } from '../client/src/systems/InventorySystem.js';
import { ManaSystem } from '../client/src/systems/ManaSystem.js';
import { QuestSystem } from '../client/src/systems/QuestSystem.js';

describe('Plano V2 — Fase 2 (Chapada, Varginha, Bênçãos e Missões)', () => {
  it('gera andares da Chapada dos Veadeiros com 3 cristais alcançáveis em ordem (1 -> 2 -> 3)', () => {
    for (let floor = 1; floor <= 3; floor++) {
      const layout = generateDungeonFloor('chapada', floor, 2026);
      expect(layout.dungeonId).toBe('chapada');
      expect(layout.requiresCrystalPuzzle).toBe(true);
      expect(layout.crystalNodes.map((n) => n.order)).toEqual([1, 2, 3]);
      expect(isFloorReachable(layout, layout.startTile, layout.exitTile)).toBe(true);

      for (const node of layout.crystalNodes) {
        expect(isFloorReachable(layout, layout.startTile, node)).toBe(true);
        const colGid = layout.collisionGids[node.tileY * layout.width + node.tileX];
        expect(colGid).toBe(0);
      }

      const kinds = new Set(layout.enemySpawns.map((s) => s.kind));
      expect(kinds.has('serpente_cristal') || kinds.has('espectro_ruina')).toBe(true);
    }
  });

  it('gera andares de Varginha alcançáveis com sondas ufológicas', () => {
    const layout = generateDungeonFloor('varginha', 1, 777);
    expect(layout.dungeonId).toBe('varginha');
    expect(layout.requiresCrystalPuzzle).toBe(false);
    expect(layout.crystalNodes).toHaveLength(0);
    expect(isFloorReachable(layout, layout.startTile, layout.exitTile)).toBe(true);
    const kinds = new Set(layout.enemySpawns.map((s) => s.kind));
    expect(kinds.has('sonda_ufologica') || kinds.has('espectro_ruina')).toBe(true);
  });

  it('aplica Bênção das Águas na rega automática e Maestria dos Ventos no custo de Mana', () => {
    const state = createInitialGameState();
    const grid = new GridSystem(state.tiles);
    const inv = new InventorySystem(state);
    const farming = new FarmingSystem(state, grid, inv);
    const mana = new ManaSystem(state);

    // Sem bênção das águas, solo arado seca em dia ensolarado
    expect(farming.tillTile('fazenda', 15, 15, true).ok).toBe(true);
    expect(farming.waterTile('fazenda', 15, 15).ok).toBe(true);
    farming.processEndOfDay('Ensolarado');
    expect(grid.getTile('fazenda', 15, 15)?.isWatered).toBe(false);

    // Com Bênção das Águas, solo arado permanece hidratado mesmo em dia ensolarado
    state.flags.water_guardian_blessed = true;
    farming.processEndOfDay('Ensolarado');
    expect(grid.getTile('fazenda', 15, 15)?.isWatered).toBe(true);

    // Maestria dos Ventos reduz custo de Mana em 25%
    mana.unlockSpell('fagulha_arcana');
    mana.unlockSpell('teleporte');
    expect(mana.getSpellCost('fagulha_arcana')).toBe(8);
    expect(mana.getSpellCost('teleporte')).toBe(15);

    state.flags.sky_guardian_blessed = true;
    expect(mana.getSpellCost('fagulha_arcana')).toBe(6);
    expect(mana.getSpellCost('teleporte')).toBe(11);
    const beforeMana = mana.getMana();
    expect(mana.consumeForSpell('fagulha_arcana')).toBe(true);
    expect(mana.getMana()).toBe(beforeMana - 6);
  });

  it('completa cadeia principal 2.3 -> 2.4 e missões secundárias de Lyra e Bento', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const quests = new QuestSystem(state, inv);

    quests.activateQuest('2.2_brilho_dos_encantos');
    state.unicorns.push({ id: 'uni_1', name: 'Lumiar', rolledEnchants: ['agua'], lastMilkDay: 0 });
    inv.addItem('bancada_encantamento', 1);
    state.flags.applied_unicorn_enchant = true;
    expect(quests.evaluateMainCampaign()).toContain('2.2 O Brilho dos Encantos');
    expect(quests.getStatus('2.3_portal_das_aguas')).toBe('active');

    // 2.3 Portal das Águas
    state.flags.water_guardian_blessed = true;
    const goldBefore23 = state.gold;
    expect(quests.evaluateMainCampaign()).toContain('2.3 O Portal das Águas');
    expect(state.gold).toBe(goldBefore23 + 320);
    expect(inv.hasItem('tonico_nevoa', 1)).toBe(true);
    expect(quests.getStatus('2.4_luzes_no_ceu')).toBe('active');

    // 2.4 Luzes no Céu exige diálogo com Lyra + Guardião dos Céus
    state.flags.sky_guardian_blessed = true;
    expect(quests.evaluateMainCampaign()).toHaveLength(0);
    state.flags.talked_lyra_varginha = true;
    const goldBefore24 = state.gold;
    expect(quests.evaluateMainCampaign()).toContain('2.4 Luzes no Céu');
    expect(state.gold).toBe(goldBefore24 + 400);
    expect(state.flags.act2_completed).toBe(true);

    // Side Quest: Os Fragmentos do Diário (Lyra)
    inv.addItem('fragmento_diario', 3);
    const sqDiary = quests.tryTurnInSideQuest('sq_fragmentos_diario');
    expect(sqDiary.ok).toBe(true);
    expect(inv.hasItem('fragmento_diario', 1)).toBe(false);
    expect(inv.countItem('liga_estelar')).toBeGreaterThanOrEqual(4); // 2 de 2.2 + 2 de Lyra

    // Side Quest: As Ferramentas do Antigo Protetor (Bento)
    inv.addItem('tonico_nevoa', 1);
    inv.addItem('leite_unicornio', 2);
    inv.addItem('liga_estelar', 1);
    const sqTools = quests.tryTurnInSideQuest('sq_ferramentas_avancadas');
    expect(sqTools.ok).toBe(true);
    expect(state.flags.tools_upgraded_bento).toBe(true);
    expect(state.npcAffinity.bento).toBeGreaterThanOrEqual(25);
  });
});

import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { AnimalSystem } from '../client/src/systems/AnimalSystem.js';
import { CombatSystem } from '../client/src/systems/CombatSystem.js';
import { CraftingSystem } from '../client/src/systems/CraftingSystem.js';
import { EnchantmentSystem } from '../client/src/systems/EnchantmentSystem.js';
import { InventorySystem } from '../client/src/systems/InventorySystem.js';
import { QuestSystem } from '../client/src/systems/QuestSystem.js';

describe('Fase 1 (V2): Unicórnios, Encantamentos Elementais e Ato II (2.1–2.2)', () => {
  it('exige 3 Mini-Dragões para Liga Estelar e libera Unicórnio + Encantamentos no Combate', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const animals = new AnimalSystem(state, inv);
    const crafting = new CraftingSystem(state, inv);
    const ench = new EnchantmentSystem(state, inv);

    inv.addItem('barra_cobre', 4);
    inv.addItem('quartzo_refinado', 5);

    // Com apenas 1 Mini-Dragão, Liga Estelar fica bloqueada
    state.miniDragonsCount = 1;
    expect(crafting.craft('forjar_liga_estelar').ok).toBe(false);

    // Com 3 Mini-Dragões, forja Liga Estelar na Bancada de Fundição e constrói Bancada de Encantamento
    state.miniDragonsCount = 3;
    const forgeTile = { tileX: 21, tileY: 12 };
    expect(crafting.craft('forjar_liga_estelar', forgeTile).ok).toBe(true);
    expect(crafting.completeAllForgeJobs()).toHaveLength(1);
    expect(crafting.collectReadyForgeJob(forgeTile.tileX, forgeTile.tileY).ok).toBe(true);
    expect(inv.countItem('liga_estelar')).toBe(1);
    expect(crafting.craft('craft_bancada_encantamento').ok).toBe(true);
    expect(inv.countItem('bancada_encantamento')).toBe(1);

    // Incubação do Unicórnio com 3 encantos rolados
    inv.addItem('ovo_unicornio', 1);
    expect(animals.startIncubation(1, 'ovo_unicornio').ok).toBe(true);
    const hatchRes = animals.processEndOfDay(2, () => 0.25); // elemento 'agua'
    expect(hatchRes.hatchedUnicornsCount).toBe(1);
    expect(state.unicorns).toHaveLength(1);
    const unicorn = state.unicorns[0];
    if (!unicorn) throw new Error('Unicórnio não criado');
    expect(unicorn.rolledEnchants).toHaveLength(3);

    // Coleta diária de Leite de Unicórnio (1x por dia)
    expect(animals.collectUnicornMilk(unicorn.id, 2).ok).toBe(true);
    expect(animals.collectUnicornMilk(unicorn.id, 2).ok).toBe(false);
    expect(animals.collectUnicornMilk(unicorn.id, 3).ok).toBe(true);
    expect(inv.countItem('leite_unicornio')).toBe(2);

    // Aplica encanto em Arma e Armadura e verifica impacto no CombatSystem
    const el = unicorn.rolledEnchants[0];
    if (!el) throw new Error('Encanto ausente');

    expect(ench.applyEnchant(unicorn.id, 0, 'weapon').ok).toBe(true);
    expect(ench.applyEnchant(unicorn.id, 0, 'armor').ok).toBe(true);
    expect(CombatSystem.getPlayerAttackStats(state).elementalDamage[el]).toBeGreaterThanOrEqual(6);
    expect(CombatSystem.getPlayerResistances(state)[el]).toBeGreaterThanOrEqual(0.12);

    // Re-rolar encantos consome 1x Quartzo Refinado
    expect(ench.rerollUnicorn(unicorn.id, () => 0.99).ok).toBe(true);
    expect(inv.countItem('quartzo_refinado')).toBe(0);
    expect(unicorn.rolledEnchants).toEqual(['arcano', 'arcano', 'arcano']);
  });

  it('conclui Missões 2.1, 2.2 e missões secundárias da vila (Ísis, Seu Zeca e Celeste)', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const quests = new QuestSystem(state, inv);

    quests.activateQuest('2.1_fumaca_na_cerca');
    state.miniDragonsCount = 3;
    state.flags.forged_liga_estelar = true;
    state.flags.talked_seu_zeca_smoke = true;

    expect(quests.evaluateMainCampaign()).toContain('2.1 Fumaça na Cerca (Ato II)');
    expect(inv.countItem('ovo_unicornio')).toBe(1);
    expect(quests.getStatus('2.2_brilho_dos_encantos')).toBe('active');

    state.unicorns.push({
      id: 'uni_1',
      name: 'Lumia',
      rolledEnchants: ['fogo', 'terra', 'arcano'],
      lastMilkDay: 1,
    });
    inv.addItem('bancada_encantamento', 1);
    state.flags.applied_unicorn_enchant = true;
    expect(quests.evaluateMainCampaign()).toContain('2.2 O Brilho dos Encantos');
    expect(inv.countItem('liga_estelar')).toBe(2);

    // Side quests da vila
    inv.addItem('lupulo_estelar', 2);
    inv.addItem('barra_cobre', 3);
    inv.addItem('flor_de_sombra', 2);
    inv.addItem('raiz_de_quartzo', 2);

    expect(quests.tryTurnInSideQuest('sq_acorde_perdido').ok).toBe(true);
    expect(quests.tryTurnInSideQuest('sq_trator_zeca').ok).toBe(true);
    expect(quests.tryTurnInSideQuest('sq_tonico_nevoa').ok).toBe(true);
    expect(inv.countItem('tonico_nevoa')).toBe(2);
  });

  it('permite usar safras mágicas como catalisador elemental na sintonização de unicórnios', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const ench = new EnchantmentSystem(state, inv);

    state.unicorns.push({
      id: 'uni_cat',
      name: 'Estrela',
      rolledEnchants: ['fogo', 'fogo', 'fogo'],
      lastMilkDay: 1,
    });
    inv.addItem('quartzo_refinado', 1);
    inv.addItem('raiz_de_quartzo', 1);

    const res = ench.rerollUnicorn('uni_cat', () => 0.99, 'raiz_de_quartzo');
    expect(res.ok).toBe(true);
    expect(res.rolledEnchants?.[0]).toBe('terra');
    expect(inv.countItem('raiz_de_quartzo')).toBe(0);
    expect(inv.countItem('quartzo_refinado')).toBe(0);
  });
});

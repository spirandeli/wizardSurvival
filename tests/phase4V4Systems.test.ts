import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { AnimalSystem } from '../client/src/systems/AnimalSystem.js';
import { FarmingSystem, rollHarvestQuality } from '../client/src/systems/FarmingSystem.js';
import { GridSystem } from '../client/src/systems/GridSystem.js';
import {
  hasActiveBuff,
  InventorySystem,
  tickActiveBuffs,
} from '../client/src/systems/InventorySystem.js';
import { getVillagerShopDiscount } from '../client/src/systems/NPCSystem.js';
import { isMeteorShowerNight, TimeSystem } from '../client/src/systems/TimeSystem.js';

describe('Sistemas V4 — Qualidade, Buffs, Afinidade Animal, Meteoros e Descontos', () => {
  it('calcula raridades de colheita com rollHarvestQuality e aplica bônus em harvestTile sem duplicar item', () => {
    const state = createInitialGameState();
    state.time.moonPhase = 'Nova';

    expect(rollHarvestQuality(state, () => 0.01)).toEqual({
      quality: 'quartzo_estelar',
      goldBonus: 45,
      manaBonus: 8,
    });
    expect(rollHarvestQuality(state, () => 0.1)).toEqual({
      quality: 'ouro',
      goldBonus: 25,
      manaBonus: 0,
    });
    expect(rollHarvestQuality(state, () => 0.25)).toEqual({
      quality: 'prata',
      goldBonus: 10,
      manaBonus: 0,
    });
    expect(rollHarvestQuality(state, () => 0.9)).toEqual({
      quality: 'normal',
      goldBonus: 0,
      manaBonus: 0,
    });

    // Lua Cheia + Bênção da Terra ampliam a faixa de Prata
    state.time.moonPhase = 'Cheia';
    state.flags.earth_guardian_blessed = true;
    expect(rollHarvestQuality(state, () => 0.42).quality).toBe('prata');

    const grid = new GridSystem(state.tiles);
    const inv = new InventorySystem(state);
    const farm = new FarmingSystem(state, grid, inv);
    const tile = grid.getOrCreateTile('fazenda', 6, 9);
    tile.isTilled = true;
    tile.cropId = 'raiz_de_quartzo';
    tile.isReadyToHarvest = true;

    const goldBefore = state.gold;
    state.vitals.mana = 10;
    const res = farm.harvestTile('fazenda', 6, 9, 'Cheia', () => 0.01);

    expect(res.ok).toBe(true);
    expect(res.quality).toBe('quartzo_estelar');
    expect(inv.countItem('raiz_de_quartzo')).toBe(1);
    expect(state.gold).toBe(goldBefore + 45);
    expect(state.vitals.mana).toBe(18);
  });

  it('ativa buffs via consumeRestoreItem, reduz gasto de stamina com Fôlego e expira após duração', () => {
    const state = createInitialGameState();
    const grid = new GridSystem(state.tiles);
    const inv = new InventorySystem(state);
    const farm = new FarmingSystem(state, grid, inv);

    state.vitals.stamina = state.vitals.maxStamina - 20;
    inv.addItem('pocao_energia_menor', 1);
    const energyIdx = state.inventory.findIndex((s) => s?.itemId === 'pocao_energia_menor');
    expect(inv.consumeRestoreItem(energyIdx).ok).toBe(true);
    expect(hasActiveBuff(state, 'folego')).toBe(true);

    const stamBeforeTill = state.vitals.stamina;
    expect(farm.tillTile('fazenda', 6, 9, true).ok).toBe(true);
    expect(state.vitals.stamina).toBe(stamBeforeTill - 1);

    state.vitals.mana = state.vitals.maxMana - 20;
    inv.addItem('tonico_nevoa', 1);
    const brisaIdx = state.inventory.findIndex((s) => s?.itemId === 'tonico_nevoa');
    expect(inv.consumeRestoreItem(brisaIdx).ok).toBe(true);
    expect(hasActiveBuff(state, 'brisa')).toBe(true);

    // Avança 46s: folego (45s) expira, brisa (60s) permanece ativa
    expect(tickActiveBuffs(state, 46_000)).toBe(true);
    expect(hasActiveBuff(state, 'folego')).toBe(false);
    expect(hasActiveBuff(state, 'brisa')).toBe(true);
  });

  it('permite carinho diário em Unicórnios (dobro de leite >= 50♥) e Mini-Dragões (+6 Mana)', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const animal = new AnimalSystem(state, inv);

    state.unicorns.push({
      id: 'u1',
      name: 'Lumia',
      rolledEnchants: ['terra'],
      lastMilkDay: 0,
      affinity: 40,
    });

    const firstPet = animal.petUnicorn('u1', 2);
    expect(firstPet.ok).toBe(true);
    expect(firstPet.affinity).toBe(55);
    expect(animal.petUnicorn('u1', 2).ok).toBe(false);

    const milk = animal.collectUnicornMilk('u1', 2);
    expect(milk.ok).toBe(true);
    expect(inv.countItem('leite_unicornio')).toBe(2);

    state.miniDragonsCount = 1;
    state.vitals.mana = 10;
    expect(animal.petMiniDragons(2).ok).toBe(true);
    expect(state.vitals.mana).toBe(16);
    expect(animal.petMiniDragons(2).ok).toBe(false);
  });

  it('detecta corretamente noites de Chuva de Meteoros na Lua Cheia ou dia 7 ensolarado', () => {
    expect(isMeteorShowerNight({ day: 15, moonPhase: 'Cheia', weather: 'Nublado' })).toBe(true);
    expect(isMeteorShowerNight({ day: 7, moonPhase: 'Nova', weather: 'Ensolarado' })).toBe(true);
    expect(isMeteorShowerNight({ day: 2, moonPhase: 'Nova', weather: 'Nublado' })).toBe(false);

    const state = createInitialGameState();
    state.time.moonPhase = 'Cheia';
    const timeSys = new TimeSystem(state.time);
    expect(timeSys.isMeteorShowerNight()).toBe(true);
  });

  it('aplica faixas progressivas de desconto de amizade nas lojas', () => {
    const state = createInitialGameState();
    state.npcAffinity.bento = 20;
    expect(getVillagerShopDiscount(state, 'bento')).toBe(0);

    state.npcAffinity.bento = 30;
    expect(getVillagerShopDiscount(state, 'bento')).toBe(0.05);

    state.npcAffinity.bento = 45;
    expect(getVillagerShopDiscount(state, 'bento')).toBe(0.1);

    state.npcAffinity.celeste = 50;
    expect(getVillagerShopDiscount(state, 'celeste')).toBe(0.15);

    state.npcAffinity.bento = 95;
    expect(getVillagerShopDiscount(state, 'bento')).toBe(0.2);
  });
});


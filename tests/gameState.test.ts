import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { INVENTORY_SIZE, TILE_SIZE } from '../client/src/config/gameConfig.js';
import { rollFishCatch } from '../client/src/systems/FishingSystem.js';
import { upgradeHouse } from '../client/src/systems/HouseUpgradeSystem.js';
import { InventorySystem } from '../client/src/systems/InventorySystem.js';

describe('Estado Inicial do Jogo', () => {
  it('inicializa com recursos vitais separados, calendário PT-BR e missão inicial ativa', () => {
    const state = createInitialGameState();

    expect(TILE_SIZE).toBe(32);
    expect(state.inventory).toHaveLength(INVENTORY_SIZE);
    expect(state.time.season).toBe('Primavera');
    expect(state.time.moonPhase).toBe('Nova');
    expect(state.vitals.hp).toBe(100);
    expect(state.vitals.stamina).toBe(100);
    expect(state.vitals.mana).toBe(60);
    expect(state.questStates['1.1_raizes_na_neblina']?.status).toBe('active');
    expect(state.inventory[4]).toEqual({ itemId: 'semente_raiz_quartzo', quantity: 6 });
  });

  it('executa upgrade progressivo da Casa e calcula raridade de pesca com Leite de Unicórnio', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);

    state.gold = 10;
    expect(upgradeHouse(state, inv).ok).toBe(false);
    state.gold = 500;
    inv.addItem('madeira', 25);
    inv.addItem('pedra', 10);
    inv.addItem('barra_cobre', 6);
    inv.addItem('quartzo_refinado', 4);

    const up2 = upgradeHouse(state, inv);
    expect(up2.ok).toBe(true);
    expect(state.houseLevel).toBe(2);
    expect(state.vitals.maxStamina).toBe(115);

    const up3 = upgradeHouse(state, inv);
    expect(up3.ok).toBe(true);
    expect(state.houseLevel).toBe(3);
    expect(state.vitals.maxMana).toBe(80);
    expect(state.vitals.maxHp).toBe(110);
    expect(upgradeHouse(state, inv).ok).toBe(false);

    expect(
      rollFishCatch({
        isNightOrEvening: true,
        weather: 'Chuva',
        moonPhase: 'Cheia',
        usingUnicornMilkBait: true,
        rng: () => 0.1,
      })
    ).toBe('peixe_prisma');

    expect(
      rollFishCatch({
        isNightOrEvening: false,
        weather: 'Ensolarado',
        moonPhase: 'Nova',
        usingUnicornMilkBait: false,
        rng: () => 0.99,
      })
    ).toBe('truta_nevoa');
  });
});


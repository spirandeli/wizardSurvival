import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { CraftingSystem } from '../client/src/systems/CraftingSystem.js';
import { FarmingSystem } from '../client/src/systems/FarmingSystem.js';
import { GridSystem } from '../client/src/systems/GridSystem.js';
import { InventorySystem } from '../client/src/systems/InventorySystem.js';

describe('FarmingSystem e InventorySystem', () => {
  it('ara, rega, planta Raiz de Quartzo, cresce na virada do dia e vende na Caixa de Remessas', () => {
    const state = createInitialGameState();
    const grid = new GridSystem(state.tiles);
    const inv = new InventorySystem(state);
    const farm = new FarmingSystem(state, grid, inv);

    expect(farm.tillTile('fazenda', 6, 9, false).ok).toBe(false);
    expect(farm.tillTile('fazenda', 6, 9, true).ok).toBe(true);
    expect(farm.waterTile('fazenda', 6, 9).ok).toBe(true);
    expect(farm.plantSeed('fazenda', 6, 9, 'semente_raiz_quartzo', 'Primavera').ok).toBe(true);

    // Dia 1 -> Dia 2
    const night1 = farm.processEndOfDay('Ensolarado');
    expect(night1.cropsGrown).toBe(1);
    expect(night1.cropsReady).toBe(0);
    expect(grid.getTile('fazenda', 6, 9)?.isWatered).toBe(false);

    // Rega no dia 2 -> fica pronta no dia 3
    expect(farm.waterTile('fazenda', 6, 9).ok).toBe(true);
    const night2 = farm.processEndOfDay('Chuva');
    expect(night2.cropsReady).toBe(1);
    expect(grid.getTile('fazenda', 6, 9)?.isReadyToHarvest).toBe(true);
    // Chuva mantém o solo arado regado para o dia seguinte
    expect(grid.getTile('fazenda', 6, 9)?.isWatered).toBe(true);

    expect(farm.harvestTile('fazenda', 6, 9, 'Nova').ok).toBe(true);
    expect(inv.countItem('raiz_de_quartzo')).toBe(1);

    const slotIdx = state.inventory.findIndex((s) => s?.itemId === 'raiz_de_quartzo');
    expect(inv.depositToShippingBin(slotIdx).ok).toBe(true);

    const goldBefore = state.gold;
    const settled = inv.settleShippingBin();
    expect(settled.itemsSold).toBe(1);
    expect(settled.totalGold).toBe(45);
    expect(state.gold).toBe(goldBefore + 45);
  });

  it('exige Lua Minguante para colher Flor de Sombra', () => {
    const state = createInitialGameState();
    const grid = new GridSystem(state.tiles);
    const inv = new InventorySystem(state);
    const farm = new FarmingSystem(state, grid, inv);

    inv.addItem('semente_flor_sombra', 1);
    farm.tillTile('fazenda', 7, 9, true);
    farm.plantSeed('fazenda', 7, 9, 'semente_flor_sombra', 'Primavera');

    const tile = grid.getTile('fazenda', 7, 9);
    if (!tile) throw new Error('Tile ausente');
    tile.isReadyToHarvest = true;

    expect(farm.harvestTile('fazenda', 7, 9, 'Cheia').ok).toBe(false);
    expect(farm.harvestTile('fazenda', 7, 9, 'Minguante').ok).toBe(true);
    expect(inv.countItem('flor_de_sombra')).toBe(1);
  });

  it('desbloqueia Aspersor Bávaro com Rafael 50+ e rega canteiros 3x3 na virada do dia', () => {
    const state = createInitialGameState();
    const grid = new GridSystem(state.tiles);
    const inv = new InventorySystem(state);
    const farm = new FarmingSystem(state, grid, inv);
    const crafting = new CraftingSystem(state, inv);

    inv.addItem('barra_cobre', 2);
    inv.addItem('quartzo_refinado', 2);
    inv.addItem('prego', 4);

    expect(crafting.craft('craft_aspersor_bavario').ok).toBe(false);

    state.flags.npc_perk_rafael_50 = true;
    expect(crafting.craft('craft_aspersor_bavario').ok).toBe(true);
    expect(inv.countItem('aspersor_bavario')).toBe(1);

    farm.tillTile('fazenda', 5, 9, true);
    farm.tillTile('fazenda', 7, 11, true);
    expect(farm.placeObject('fazenda', 6, 10, 'aspersor_bavario', true).ok).toBe(true);

    farm.processEndOfDay('Ensolarado');
    expect(grid.getTile('fazenda', 5, 9)?.isWatered).toBe(true);
    expect(grid.getTile('fazenda', 7, 11)?.isWatered).toBe(true);
  });
});


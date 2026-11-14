import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../client/src/config/gameConfig.js';
import { GridSystem, makeTileKey } from '../client/src/systems/GridSystem.js';

describe('GridSystem (32x32)', () => {
  it('converte coordenadas de mundo para tile e centro do tile', () => {
    const grid = new GridSystem();
    expect(grid.worldToTile(0, 0)).toEqual({ tileX: 0, tileY: 0 });
    expect(grid.worldToTile(TILE_SIZE * 3 + 15, TILE_SIZE * 5 + 31)).toEqual({
      tileX: 3,
      tileY: 5,
    });
    expect(grid.tileToWorldCenter(2, 4)).toEqual({
      x: 2 * TILE_SIZE + TILE_SIZE / 2,
      y: 4 * TILE_SIZE + TILE_SIZE / 2,
    });
  });

  it('calcula corretamente o tile alvo nas 4 direções cardeais', () => {
    const grid = new GridSystem();
    const x = 10 * TILE_SIZE + 16;
    const y = 8 * TILE_SIZE + 16;

    expect(grid.getTargetTile(x, y, 'up')).toEqual({ tileX: 10, tileY: 7 });
    expect(grid.getTargetTile(x, y, 'down')).toEqual({ tileX: 10, tileY: 9 });
    expect(grid.getTargetTile(x, y, 'left')).toEqual({ tileX: 9, tileY: 8 });
    expect(grid.getTargetTile(x, y, 'right')).toEqual({ tileX: 11, tileY: 8 });
  });

  it('armazena e serializa estados de solo por mapa e coordenada', () => {
    const grid = new GridSystem();
    const tile = grid.getOrCreateTile('fazenda', 6, 9);
    tile.isTilled = true;
    tile.isWatered = true;
    tile.cropId = 'raiz_de_quartzo';

    const serialized = grid.toRecord();
    expect(serialized[makeTileKey('fazenda', 6, 9)]?.cropId).toBe('raiz_de_quartzo');

    const restored = new GridSystem(serialized);
    expect(restored.getTile('fazenda', 6, 9)?.isWatered).toBe(true);
    expect(restored.getTile('casa', 6, 9)).toBeUndefined();
  });
});


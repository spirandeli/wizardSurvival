import { describe, expect, it } from 'vitest';
import {
  generateMachuPicchuFloor,
  isFloorReachable,
  MACHU_GID,
} from '../client/src/systems/DungeonGenerator.js';

describe('DungeonGenerator (Machu Picchu Procedural)', () => {
  it('gera andares deterministicamente pela mesma seed e garante caminho válido da entrada à escada', () => {
    const a1 = generateMachuPicchuFloor(1, 2026);
    const a2 = generateMachuPicchuFloor(1, 2026);
    expect(a1).toEqual(a2);

    for (const seed of [101, 555, 1047, 8888]) {
      for (let floor = 1; floor <= 3; floor++) {
        const layout = generateMachuPicchuFloor(floor, seed);
        expect(isFloorReachable(layout, layout.startTile, layout.exitTile)).toBe(true);

        const exitIdx = layout.exitTile.tileY * layout.width + layout.exitTile.tileX;
        expect(layout.groundGids[exitIdx]).toBe(MACHU_GID.STAIRS);
        expect(layout.enemySpawns.length).toBeGreaterThan(0);

        for (const enemy of layout.enemySpawns) {
          expect(enemy.tileX === layout.startTile.tileX && enemy.tileY === layout.startTile.tileY).toBe(
            false
          );
        }

        expect(layout.treasureChests.length).toBeGreaterThanOrEqual(1);
        expect(layout.loreTotems.length).toBe(1);
        for (const poi of [...layout.treasureChests, ...layout.loreTotems, ...layout.healingFountains]) {
          const idx = poi.tileY * layout.width + poi.tileX;
          expect(layout.collisionGids[idx]).toBe(0);
          expect(poi.tileX === layout.exitTile.tileX && poi.tileY === layout.exitTile.tileY).toBe(false);
        }
      }
    }
  });
});

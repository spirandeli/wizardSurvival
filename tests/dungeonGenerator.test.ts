import { describe, expect, it } from 'vitest';
import {
  generateMachuPicchuFloor,
  getUnlockedDungeonCheckpoints,
  isFloorReachable,
  MACHU_GID,
  recordDungeonCheckpoint,
  TOTAL_PROCEDURAL_FLOORS,
} from '../client/src/systems/DungeonGenerator.js';

describe('DungeonGenerator (Machu Picchu Procedural — 10 Andares)', () => {
  it('gera os 10 andares deterministicamente pela mesma seed e garante santuários nos andares 5 e 10', () => {
    expect(TOTAL_PROCEDURAL_FLOORS).toBe(10);
    const a1 = generateMachuPicchuFloor(1, 2026);
    const a2 = generateMachuPicchuFloor(1, 2026);
    expect(a1).toEqual(a2);

    const seenKinds = new Set<string>();
    for (const seed of [101, 555, 1047]) {
      for (let floor = 1; floor <= TOTAL_PROCEDURAL_FLOORS; floor++) {
        const layout = generateMachuPicchuFloor(floor, seed);
        expect(isFloorReachable(layout, layout.startTile, layout.exitTile)).toBe(true);

        const exitIdx = layout.exitTile.tileY * layout.width + layout.exitTile.tileX;
        expect(layout.groundGids[exitIdx]).toBe(MACHU_GID.STAIRS);
        expect(layout.enemySpawns.length).toBeGreaterThan(0);

        for (const enemy of layout.enemySpawns) {
          seenKinds.add(enemy.kind);
          expect(enemy.tileX === layout.startTile.tileX && enemy.tileY === layout.startTile.tileY).toBe(
            false
          );
        }

        expect(layout.treasureChests.length).toBeGreaterThanOrEqual(1);
        expect(layout.loreTotems.length).toBe(1);
        expect(layout.loreTotems[0]?.loreId).toBe(`machu_picchu_f${floor}`);
        if (floor === 5 || floor === 10) {
          expect(layout.healingFountains.length).toBeGreaterThanOrEqual(1);
          expect(layout.treasureChests.length).toBeGreaterThanOrEqual(2);
        }
        for (const poi of [...layout.treasureChests, ...layout.loreTotems, ...layout.healingFountains]) {
          const idx = poi.tileY * layout.width + poi.tileX;
          expect(layout.collisionGids[idx]).toBe(0);
          expect(poi.tileX === layout.exitTile.tileX && poi.tileY === layout.exitTile.tileY).toBe(false);
        }
      }
    }
    expect(seenKinds.has('escaravelho_inca')).toBe(true);
    expect(seenKinds.has('totem_condor')).toBe(true);
    expect(seenKinds.has('colosso_granito')).toBe(true);
  });

  it('desbloqueia e lista checkpoints rúnicos nos andares 5, 10 e Boss (11)', () => {
    const flags: Record<string, boolean> = {};
    expect(getUnlockedDungeonCheckpoints(flags, 'machu_picchu')).toEqual([1]);
    expect(recordDungeonCheckpoint(flags, 'machu_picchu', 4)).toBeNull();
    expect(recordDungeonCheckpoint(flags, 'machu_picchu', 5)).toBe(5);
    expect(recordDungeonCheckpoint(flags, 'machu_picchu', 5)).toBeNull();
    expect(recordDungeonCheckpoint(flags, 'machu_picchu', 10)).toBe(10);
    expect(recordDungeonCheckpoint(flags, 'machu_picchu', 11)).toBe(11);
    expect(getUnlockedDungeonCheckpoints(flags, 'machu_picchu')).toEqual([1, 5, 10, 11]);
  });
});

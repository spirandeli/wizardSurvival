import { TILE_SIZE } from '../config/gameConfig';
import type { TileState } from '@shared/types';

export type CardinalDirection = 'down' | 'up' | 'left' | 'right';

export interface TileCoord {
  tileX: number;
  tileY: number;
}

export function makeTileKey(mapId: string, tileX: number, tileY: number): string {
  return `${mapId}:${tileX},${tileY}`;
}

export class GridSystem {
  private tiles = new Map<string, TileState>();

  constructor(initialTiles?: Record<string, TileState>) {
    if (initialTiles) {
      this.loadFromRecord(initialTiles);
    }
  }

  worldToTile(worldX: number, worldY: number): TileCoord {
    return {
      tileX: Math.floor(worldX / TILE_SIZE),
      tileY: Math.floor(worldY / TILE_SIZE),
    };
  }

  tileToWorldCenter(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: tileY * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  getTargetTile(worldX: number, worldY: number, facing: CardinalDirection): TileCoord {
    const base = this.worldToTile(worldX, worldY);
    switch (facing) {
      case 'up':
        return { tileX: base.tileX, tileY: base.tileY - 1 };
      case 'down':
        return { tileX: base.tileX, tileY: base.tileY + 1 };
      case 'left':
        return { tileX: base.tileX - 1, tileY: base.tileY };
      case 'right':
        return { tileX: base.tileX + 1, tileY: base.tileY };
    }
  }

  getTile(mapId: string, tileX: number, tileY: number): TileState | undefined {
    return this.tiles.get(makeTileKey(mapId, tileX, tileY));
  }

  setTile(mapId: string, state: TileState): void {
    this.tiles.set(makeTileKey(mapId, state.tileX, state.tileY), state);
  }

  getOrCreateTile(mapId: string, tileX: number, tileY: number): TileState {
    const key = makeTileKey(mapId, tileX, tileY);
    const existing = this.tiles.get(key);
    if (existing) return existing;

    const fresh: TileState = {
      tileX,
      tileY,
      isTilled: false,
      isWatered: false,
      cropId: null,
      daysGrown: 0,
      currentStage: 0,
      isReadyToHarvest: false,
    };
    this.tiles.set(key, fresh);
    return fresh;
  }

  entries(): IterableIterator<[string, TileState]> {
    return this.tiles.entries();
  }

  loadFromRecord(record: Record<string, TileState>): void {
    this.tiles.clear();
    for (const [key, value] of Object.entries(record)) {
      this.tiles.set(key, { ...value });
    }
  }

  toRecord(): Record<string, TileState> {
    const out: Record<string, TileState> = {};
    for (const [key, value] of this.tiles.entries()) {
      out[key] = { ...value };
    }
    return out;
  }
}


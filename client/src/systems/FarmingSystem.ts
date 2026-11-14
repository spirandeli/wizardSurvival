import type { GameStateSnapshot, MoonPhase, Season, WeatherType } from '@shared/types';
import { getCropDef } from '../data/crops';
import { getItemDef } from '../data/items';
import { GridSystem } from './GridSystem';
import { hasActiveBuff, InventorySystem } from './InventorySystem';

export type CropQuality = 'normal' | 'prata' | 'ouro' | 'quartzo_estelar';

export interface HarvestQualityRoll {
  quality: CropQuality;
  goldBonus: number;
  manaBonus: number;
}

export function rollHarvestQuality(
  state: GameStateSnapshot,
  rng: () => number = Math.random
): HarvestQualityRoll {
  let boost = 0;
  if (state.time.moonPhase === 'Cheia') boost += 0.14;
  if (state.flags.earth_guardian_blessed) boost += 0.08;
  if (state.flags.water_guardian_blessed) boost += 0.06;

  const roll = rng();
  if (roll < 0.06 + boost * 0.45) {
    return { quality: 'quartzo_estelar', goldBonus: 45, manaBonus: 8 };
  }
  if (roll < 0.18 + boost * 0.7) {
    return { quality: 'ouro', goldBonus: 25, manaBonus: 0 };
  }
  if (roll < 0.36 + boost) {
    return { quality: 'prata', goldBonus: 10, manaBonus: 0 };
  }
  return { quality: 'normal', goldBonus: 0, manaBonus: 0 };
}

export interface FarmActionResult {
  ok: boolean;
  message: string;
  quality?: CropQuality;
  goldBonus?: number;
}

export class FarmingSystem {
  constructor(
    private state: GameStateSnapshot,
    private grid: GridSystem,
    private inventory: InventorySystem
  ) {}

  tillTile(mapId: string, tileX: number, tileY: number, isFarmable: boolean): FarmActionResult {
    if (!isFarmable) {
      return { ok: false, message: 'Este solo não pode ser arado.' };
    }
    const existing = this.grid.getTile(mapId, tileX, tileY);
    if (existing?.placedItemId || existing?.cropId) {
      return { ok: false, message: 'Há algo ocupando este espaço.' };
    }
    if (existing?.isTilled) {
      return { ok: false, message: 'Esta terra já está arada.' };
    }
    const tillCost = hasActiveBuff(this.state, 'folego') ? 1 : 2;
    if (this.state.vitals.stamina < tillCost) {
      return { ok: false, message: 'Stamina insuficiente!' };
    }

    this.state.vitals.stamina -= tillCost;
    const tile = this.grid.getOrCreateTile(mapId, tileX, tileY);
    tile.isTilled = true;
    if (this.state.time.weather === 'Chuva') {
      tile.isWatered = true;
    }
    this.syncTilesToState();
    return { ok: true, message: 'Terra arada!' };
  }

  waterTile(mapId: string, tileX: number, tileY: number): FarmActionResult {
    const tile = this.grid.getTile(mapId, tileX, tileY);
    if (!tile || !tile.isTilled) {
      return { ok: false, message: 'Are a terra antes de regar.' };
    }
    if (tile.isWatered) {
      return { ok: false, message: 'Este solo já foi regado hoje.' };
    }
    if (this.state.vitals.stamina < 1) {
      return { ok: false, message: 'Stamina insuficiente!' };
    }

    this.state.vitals.stamina -= 1;
    tile.isWatered = true;
    this.syncTilesToState();
    return { ok: true, message: 'Solo regado!' };
  }

  plantSeed(
    mapId: string,
    tileX: number,
    tileY: number,
    seedItemId: string,
    season: Season
  ): FarmActionResult {
    const itemDef = getItemDef(seedItemId);
    if (!itemDef || itemDef.category !== 'seed' || !itemDef.cropId) {
      return { ok: false, message: 'Item selecionado não é uma semente.' };
    }

    const cropDef = getCropDef(itemDef.cropId);
    if (!cropDef) {
      return { ok: false, message: 'Cultivo não encontrado.' };
    }
    if (!cropDef.seasons.includes(season)) {
      return {
        ok: false,
        message: `${cropDef.name} não cresce na estação ${season}.`,
      };
    }

    const tile = this.grid.getTile(mapId, tileX, tileY);
    if (!tile || !tile.isTilled) {
      return { ok: false, message: 'Prepare a terra com a enxada antes de plantar.' };
    }
    if (tile.cropId || tile.placedItemId) {
      return { ok: false, message: 'Este espaço já está ocupado.' };
    }

    if (!this.inventory.removeItem(seedItemId, 1)) {
      return { ok: false, message: 'Sem sementes disponíveis.' };
    }

    tile.cropId = cropDef.id;
    tile.daysGrown = 0;
    tile.currentStage = 0;
    tile.isReadyToHarvest = false;
    if (cropDef.id === 'raiz_de_quartzo') {
      this.state.flags.planted_raiz_quartzo = true;
    }
    this.syncTilesToState();
    return { ok: true, message: `${cropDef.name} plantada!` };
  }

  harvestTile(
    mapId: string,
    tileX: number,
    tileY: number,
    moonPhase: MoonPhase,
    rng: () => number = Math.random
  ): FarmActionResult {
    const tile = this.grid.getTile(mapId, tileX, tileY);
    if (!tile || !tile.cropId || !tile.isReadyToHarvest) {
      return { ok: false, message: 'Ainda não está pronto para colheita.' };
    }

    const cropDef = getCropDef(tile.cropId);
    if (!cropDef) {
      return { ok: false, message: 'Cultivo inválido.' };
    }

    if (cropDef.requiredMoonPhase && cropDef.requiredMoonPhase !== moonPhase) {
      return {
        ok: false,
        message: `${cropDef.name} só pode ser colhida na Lua ${cropDef.requiredMoonPhase}.`,
      };
    }

    const leftover = this.inventory.addItem(cropDef.harvestItemId, 1);
    if (leftover > 0) {
      return { ok: false, message: 'Mochila cheia!' };
    }

    const qualityRoll = rollHarvestQuality(this.state, rng);
    if (qualityRoll.goldBonus > 0) {
      this.state.gold += qualityRoll.goldBonus;
    }
    if (qualityRoll.manaBonus > 0) {
      this.state.vitals.mana = Math.min(
        this.state.vitals.maxMana,
        this.state.vitals.mana + qualityRoll.manaBonus
      );
    }

    tile.cropId = null;
    tile.daysGrown = 0;
    tile.currentStage = 0;
    tile.isReadyToHarvest = false;
    this.syncTilesToState();

    const suffix =
      qualityRoll.quality === 'quartzo_estelar'
        ? ` ✨ Quartzo Estelar (+${qualityRoll.goldBonus} G, +${qualityRoll.manaBonus} Mana)!`
        : qualityRoll.quality === 'ouro'
        ? ` ★ Ouro (+${qualityRoll.goldBonus} G)!`
        : qualityRoll.quality === 'prata'
        ? ` ☆ Prata (+${qualityRoll.goldBonus} G)!`
        : '!';

    return {
      ok: true,
      message: `Colheu 1x ${cropDef.name}${suffix}`,
      quality: qualityRoll.quality,
      goldBonus: qualityRoll.goldBonus,
    };
  }

  placeObject(mapId: string, tileX: number, tileY: number, itemId: string, canPlace: boolean): FarmActionResult {
    if (!canPlace) {
      return { ok: false, message: 'Não é possível construir aqui.' };
    }
    const def = getItemDef(itemId);
    if (!def || def.category !== 'placeable') {
      return { ok: false, message: 'Este item não pode ser posicionado no mundo.' };
    }
    const existing = this.grid.getTile(mapId, tileX, tileY);
    if (existing?.cropId || existing?.placedItemId) {
      return { ok: false, message: 'Este espaço já está ocupado.' };
    }
    if (!this.inventory.removeItem(itemId, 1)) {
      return { ok: false, message: 'Item ausente na mochila.' };
    }

    const tile = this.grid.getOrCreateTile(mapId, tileX, tileY);
    tile.isTilled = false;
    tile.isWatered = false;
    tile.placedItemId = itemId;
    this.syncTilesToState();
    return { ok: true, message: `${def.name} posicionada!` };
  }

  processEndOfDay(nextDayWeather: WeatherType): { cropsGrown: number; cropsReady: number } {
    let cropsGrown = 0;
    let cropsReady = 0;
    const earthBlessed = Boolean(this.state.flags.earth_guardian_blessed);
    const waterBlessed = Boolean(this.state.flags.water_guardian_blessed);

    for (const [, tile] of this.grid.entries()) {
      if (tile.cropId) {
        const cropDef = getCropDef(tile.cropId);
        if (cropDef && (tile.isWatered || earthBlessed) && !tile.isReadyToHarvest) {
          tile.daysGrown += 1;
          cropsGrown += 1;

          const ratio = Math.min(1, tile.daysGrown / cropDef.daysToGrow);
          tile.currentStage = Math.min(
            cropDef.totalStages,
            Math.floor(ratio * cropDef.totalStages)
          );
          if (tile.daysGrown >= cropDef.daysToGrow) {
            tile.isReadyToHarvest = true;
            tile.currentStage = cropDef.totalStages;
            cropsReady += 1;
          }
        }
      }

      if (tile.isTilled) {
        tile.isWatered = nextDayWeather === 'Chuva' || waterBlessed;
      }
    }

    // Aspersores Bávaros 3x3 regam automaticamente os canteiros adjacentes ao amanhecer
    for (const [key, tile] of this.grid.entries()) {
      if (tile.placedItemId !== 'aspersor_bavario') continue;
      const mapId = key.split(':')[0] ?? 'fazenda';
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const adj = this.grid.getTile(mapId, tile.tileX + dx, tile.tileY + dy);
          if (adj && adj.isTilled) {
            adj.isWatered = true;
          }
        }
      }
    }

    this.syncTilesToState();
    return { cropsGrown, cropsReady };
  }

  private syncTilesToState(): void {
    this.state.tiles = this.grid.toRecord();
  }
}


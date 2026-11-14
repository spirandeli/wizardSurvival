import type { GameStateSnapshot, InventorySlot } from '@shared/types';
import {
  INVENTORY_SIZE,
  SAVE_VERSION,
  START_MINUTE_OF_DAY,
  TILE_SIZE,
} from '../config/gameConfig';

export function createInitialGameState(): GameStateSnapshot {
  const inventory: (InventorySlot | null)[] = Array.from(
    { length: INVENTORY_SIZE },
    () => null
  );

  inventory[0] = { itemId: 'enxada_antiga', quantity: 1 };
  inventory[1] = { itemId: 'regador_simples', quantity: 1 };
  inventory[2] = { itemId: 'picareta_simples', quantity: 1 };
  inventory[3] = { itemId: 'machado_simples', quantity: 1 };
  inventory[4] = { itemId: 'semente_raiz_quartzo', quantity: 6 };
  inventory[5] = { itemId: 'pedra', quantity: 12 };
  inventory[6] = { itemId: 'madeira', quantity: 12 };
  inventory[7] = { itemId: 'prego', quantity: 6 };
  inventory[8] = { itemId: 'minerio_cobre', quantity: 6 };

  return {
    version: SAVE_VERSION,
    mapId: 'fazenda',
    playerX: 28 * TILE_SIZE + TILE_SIZE / 2,
    playerY: 9 * TILE_SIZE + TILE_SIZE / 2,
    gold: 150,
    vitals: {
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      mana: 60,
      maxMana: 60,
    },
    time: {
      day: 1,
      season: 'Primavera',
      year: 1,
      minuteOfDay: START_MINUTE_OF_DAY,
      moonPhase: 'Nova',
      weather: 'Neblina',
      nextDayWeather: 'Ensolarado',
    },
    inventory,
    shippingBin: [],
    selectedHotbarIndex: 0,
    equippedWeaponId: 'cajado_aprendiz',
    equippedArmorId: 'tunica_neblina',
    tiles: {},
    unlockedSpells: [],
    discoveredWaypoints: ['fazenda', 'casa'],
    incubatingEggs: [],
    miniDragonsCount: 0,
    unicorns: [],
    enchantments: {
      weaponBonus: {},
      armorResistanceBonus: {},
    },
    questStates: {
      '1.1_raizes_na_neblina': { status: 'active', progress: 0 },
    },
    npcAffinity: {
      celeste: 0,
      bento: 0,
      isis: 0,
      lyra: 0,
      seu_zeca: 0,
      prefeito_arlindo: 0,
      seu_damiao: 0,
      rafael: 0,
    },
    flags: {},
    houseLevel: 1,
    compendium: {
      enemiesDefeated: {},
      fishesCaught: {},
      cropsHarvested: {},
      loreRead: [],
    },
  };
}

export function normalizeLoadedState(raw: GameStateSnapshot): GameStateSnapshot {
  const base = createInitialGameState();
  return {
    ...base,
    ...raw,
    vitals: { ...base.vitals, ...raw.vitals },
    time: { ...base.time, ...raw.time },
    shippingBin: Array.isArray(raw.shippingBin) ? raw.shippingBin : [],
    discoveredWaypoints: Array.isArray(raw.discoveredWaypoints)
      ? raw.discoveredWaypoints
      : base.discoveredWaypoints,
    incubatingEggs: Array.isArray(raw.incubatingEggs) ? raw.incubatingEggs : [],
    miniDragonsCount: typeof raw.miniDragonsCount === 'number' ? raw.miniDragonsCount : 0,
    unicorns: Array.isArray(raw.unicorns) ? raw.unicorns : [],
    enchantments:
      raw.enchantments && typeof raw.enchantments === 'object'
        ? {
            weaponBonus: raw.enchantments.weaponBonus ?? {},
            armorResistanceBonus: raw.enchantments.armorResistanceBonus ?? {},
          }
        : { weaponBonus: {}, armorResistanceBonus: {} },
    houseLevel: raw.houseLevel === 2 || raw.houseLevel === 3 ? raw.houseLevel : 1,
    compendium: {
      enemiesDefeated: raw.compendium?.enemiesDefeated ?? {},
      fishesCaught: raw.compendium?.fishesCaught ?? {},
      cropsHarvested: raw.compendium?.cropsHarvested ?? {},
      loreRead: Array.isArray(raw.compendium?.loreRead) ? raw.compendium.loreRead : [],
    },
  };
}

export class GameStateStore {
  private state: GameStateSnapshot;

  constructor(initialState?: GameStateSnapshot) {
    this.state = initialState ?? createInitialGameState();
  }

  getState(): GameStateSnapshot {
    return this.state;
  }

  replaceState(nextState: GameStateSnapshot): void {
    this.state = normalizeLoadedState(nextState);
  }
}

export const gameState = new GameStateStore();

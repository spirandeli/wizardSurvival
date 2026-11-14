export type Season = 'Primavera' | 'Verão' | 'Outono' | 'Inverno';

export type MoonPhase = 'Nova' | 'Crescente' | 'Cheia' | 'Minguante';

export type WeatherType = 'Ensolarado' | 'Nublado' | 'Neblina' | 'Chuva';

export type ElementType = 'terra' | 'agua' | 'ar' | 'fogo' | 'arcano';

export type ActiveBuffId = 'brisa' | 'folego' | 'harmonia';

export interface ItemBuff {
  id: ActiveBuffId;
  label: string;
  durationSec: number;
}

export interface ActiveBuffState {
  id: ActiveBuffId;
  label: string;
  remainingMs: number;
}

export type ItemCategory =
  | 'tool'
  | 'weapon'
  | 'armor'
  | 'seed'
  | 'crop'
  | 'resource'
  | 'consumable'
  | 'placeable'
  | 'egg';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  iconFrame: number;
  sellPrice: number;
  buyPrice?: number;
  maxStack: number;
  energyRestore?: number;
  manaRestore?: number;
  hpRestore?: number;
  cropId?: string;
  attackPower?: number;
  elementalDamage?: Partial<Record<ElementType, number>>;
  elementalResistance?: Partial<Record<ElementType, number>>;
  toolKind?: 'hoe' | 'water' | 'pickaxe' | 'axe' | 'fishing';
  visualColor?: string;
  elementTheme?: ElementType;
  buff?: ItemBuff;
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export interface TileState {
  tileX: number;
  tileY: number;
  isTilled: boolean;
  isWatered: boolean;
  cropId: string | null;
  daysGrown: number;
  currentStage: number;
  isReadyToHarvest: boolean;
  placedItemId?: string;
}

export interface UserPublic {
  id: number;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface PlayerVitals {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  mana: number;
  maxMana: number;
}

export interface GameTimeSnapshot {
  day: number;
  season: Season;
  year: number;
  minuteOfDay: number;
  moonPhase: MoonPhase;
  weather: WeatherType;
  nextDayWeather: WeatherType;
}

export interface IncubatingEgg {
  eggItemId: string;
  hatchDay: number;
}

export interface UnicornCreature {
  id: string;
  name: string;
  rolledEnchants: ElementType[];
  lastMilkDay: number;
  affinity?: number;
  lastPetDay?: number;
}

export interface EnchantmentState {
  weaponBonus: Partial<Record<ElementType, number>>;
  armorResistanceBonus: Partial<Record<ElementType, number>>;
}

export interface ActiveBounty {
  id: string;
  npcId: string;
  title: string;
  description: string;
  kind: 'delivery' | 'hunt' | 'fish';
  targetId: string;
  targetQty: number;
  progress: number;
  rewardGold: number;
  rewardAffinity: number;
  completed: boolean;
}

export interface CompendiumState {
  enemiesDefeated: Record<string, number>;
  fishesCaught: Record<string, number>;
  cropsHarvested: Record<string, number>;
  loreRead: string[];
}

export interface ForgeJob {
  id: string;
  recipeId: string;
  outputItemId: string;
  outputQuantity: number;
  tileX: number;
  tileY: number;
  totalDurationMs: number;
  remainingMs: number;
  status: 'forging' | 'ready';
}

export interface GameStateSnapshot {
  version: number;
  mapId: string;
  playerX: number;
  playerY: number;
  gold: number;
  vitals: PlayerVitals;
  time: GameTimeSnapshot;
  inventory: (InventorySlot | null)[];
  shippingBin: InventorySlot[];
  selectedHotbarIndex: number;
  equippedWeaponId: string | null;
  equippedArmorId: string | null;
  tiles: Record<string, TileState>;
  unlockedSpells: string[];
  discoveredWaypoints: string[];
  incubatingEggs: IncubatingEgg[];
  miniDragonsCount: number;
  unicorns: UnicornCreature[];
  enchantments: EnchantmentState;
  questStates: Record<string, { status: 'locked' | 'active' | 'completed'; progress: number }>;
  pinnedQuestId?: string;
  npcAffinity: Record<string, number>;
  flags: Record<string, boolean>;
  dailyBounties?: { dayKey: string; items: ActiveBounty[] };
  houseLevel?: 1 | 2 | 3;
  compendium?: CompendiumState;
  forgeJobs?: ForgeJob[];
  activeBuffs?: ActiveBuffState[];
  lastDragonPetDay?: number;
}

export interface SaveRecord {
  id: number;
  userId: number;
  slotName: string;
  version: number;
  state: GameStateSnapshot;
  updatedAt: string;
}


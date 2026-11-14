import Phaser from 'phaser';
import type { ElementType } from '@shared/types';
import { CAMERA_ZOOM, TILE_SIZE } from '../config/gameConfig';
import { DUNGEON_DETAIL_FRAMES, OMENA_PROPS_FRAMES } from '../config/spriteSheets';
import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getTiledProperty, type PortalTrigger } from '../core/TiledTypes';
import { Enemy, type EnemyKind } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { AnimalSystem } from '../systems/AnimalSystem';
import { audioSystem } from '../systems/AudioSystem';
import { calculateElementalDamage, CombatSystem } from '../systems/CombatSystem';
import {
  generateDungeonFloor,
  MACHU_GID,
  recordDungeonCheckpoint,
  TOTAL_PROCEDURAL_FLOORS,
  type DungeonFloorLayout,
  type DungeonId,
} from '../systems/DungeonGenerator';
import { getItemDef } from '../data/items';
import { CraftingSystem } from '../systems/CraftingSystem';
import { FarmingSystem } from '../systems/FarmingSystem';
import { GridSystem } from '../systems/GridSystem';
import { hasActiveBuff, InventorySystem, tickActiveBuffs } from '../systems/InventorySystem';
import { ManaSystem } from '../systems/ManaSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { TimeSystem } from '../systems/TimeSystem';

export interface DungeonSceneData {
  dungeonId?: DungeonId;
  floor?: number;
  seed?: number;
  unstableRift?: boolean;
}

interface DungeonThemeConfig {
  dungeonTitle: string;
  arenaTitle: string;
  arenaMapKey: 'arena_terra' | 'arena_aguas' | 'arena_ceus' | 'arena_omena';
  bossSpawnName: string;
  bossKind: EnemyKind;
  bossLabel: string;
  blessedFlag:
  | 'earth_guardian_blessed'
  | 'water_guardian_blessed'
  | 'sky_guardian_blessed'
  | 'omena_defeated';
  projectileTexture: string;
  element: ElementType;
  floorHint: string;
  freedSpeaker: string;
  freedTitle: string;
  freedColor: string;
  freedLines: string[];
  freedToast: string;
}

const DUNGEON_THEMES: Record<DungeonId, DungeonThemeConfig> = {
  machu_picchu: {
    dungeonTitle: 'Machu Picchu',
    arenaTitle: 'Machu Picchu — Altar do Guardião da Terra',
    arenaMapKey: 'arena_terra',
    bossSpawnName: 'boss_guardiao_terra',
    bossKind: 'guardiao_terra',
    bossLabel: 'Guardião da Terra (Corrompido)',
    blessedFlag: 'earth_guardian_blessed',
    projectileTexture: 'enemy_rock_bolt',
    element: 'terra',
    floorHint: '[Espaço] Cajado • [Q] Fagulha • [Shift] Dash • [E] Minerar/Descer',
    freedSpeaker: 'Guardião da Terra',
    freedTitle: 'Espírito Antigo de Machu Picchu',
    freedColor: '#5bc26e',
    freedLines: [
      'O transe sombrio de Omena se dissipou... Obrigado, jovem guardião de Lupin.',
      'Como gratidão, abençoo o solo da sua fazenda em São Tomé dos Números: suas plantações crescerão em harmonia com a terra mesmo nos dias sem rega.',
      'Use o portal ao sul para retornar ao porão com segurança.',
    ],
    freedToast: 'Bênção da Terra ativa! Safras da fazenda crescem automaticamente à noite.',
  },
  chapada: {
    dungeonTitle: 'Chapada dos Veadeiros',
    arenaTitle: 'Chapada dos Veadeiros — Lago Sagrado das Águas',
    arenaMapKey: 'arena_aguas',
    bossSpawnName: 'boss_guardiao_aguas',
    bossKind: 'guardiao_aguas',
    bossLabel: 'Guardião das Águas (Corrompido)',
    blessedFlag: 'water_guardian_blessed',
    projectileTexture: 'water_bolt',
    element: 'agua',
    floorHint: '[E] Harmonizar Cristais (1 → 2 → 3) • [Espaço] Cajado • [Q] Fagulha',
    freedSpeaker: 'Guardião das Águas',
    freedTitle: 'Espírito Cristalino da Chapada',
    freedColor: '#38bdf8',
    freedLines: [
      'As águas voltaram a cantar nos cânions de quartzo... O véu de Omena se desfez!',
      'Receba a Bênção das Águas: fontes subterrâneas e chuvas brandas manterão seu solo arado em São Tomé sempre regado automaticamente.',
      'Atravessando o portal ao sul, você retornará ao porão.',
    ],
    freedToast: 'Bênção das Águas ativa! Canteiros arados da fazenda ficam regados automaticamente.',
  },
  varginha: {
    dungeonTitle: 'Varginha',
    arenaTitle: 'Varginha — Núcleo da Tempestade Eterna',
    arenaMapKey: 'arena_ceus',
    bossSpawnName: 'boss_guardiao_ceus',
    bossKind: 'guardiao_ceus',
    bossLabel: 'Guardião dos Céus (Corrompido)',
    blessedFlag: 'sky_guardian_blessed',
    projectileTexture: 'wind_bolt',
    element: 'ar',
    floorHint: '[Espaço] Cajado • [Q] Fagulha • Cuidado com as sondas! • [E] Minerar/Descer',
    freedSpeaker: 'Guardião dos Céus',
    freedTitle: 'Vigia Estelar de Varginha',
    freedColor: '#818cf8',
    freedLines: [
      'A tempestade estelar acalmou. As frequências de Omena já não controlam os ventos de Minas!',
      'Concedo a Maestria dos Ventos: +20 Mana Máxima, -25% no custo de Mana das magias e passos mais velozes.',
      'Com os três Guardiões despertos, leve esta força de volta a Lupin!',
    ],
    freedToast: 'Maestria dos Ventos ativa! +20 Mana Máxima, -25% custo de magia e maior velocidade!',
  },
  fortaleza_omena: {
    dungeonTitle: 'Fortaleza Dimensional de Omena',
    arenaTitle: 'Núcleo do Mundo — Confronto Final contra Omena',
    arenaMapKey: 'arena_omena',
    bossSpawnName: 'boss_omena',
    bossKind: 'omena',
    bossLabel: 'Omena, Tecelão das Sombras — Fase 1/3',
    blessedFlag: 'omena_defeated',
    projectileTexture: 'omena_bolt',
    element: 'arcano',
    floorHint: '[Espaço] Cajado • [Q] Fagulha • [Shift] Dash • Rumo ao Núcleo do Mundo!',
    freedSpeaker: 'Núcleo do Mundo & Guardiões',
    freedTitle: 'Harmonia Restaurada',
    freedColor: '#f5b942',
    freedLines: [
      'A sombra de Omena foi expelida da fortaleza dimensional antes de tocar o Núcleo do Mundo!',
      'Os três Guardiões — Terra, Águas e Céus — entrelaçam suas forças no Cetro do Núcleo do Mundo.',
      'Parabéns! Você salvou São Tomé dos Números e desbloqueou o Modo Endgame. Use o portal ao sul para voltar e celebrar com a vila!',
    ],
    freedToast: 'Omena derrotado! Cetro do Núcleo do Mundo e Modo Endgame desbloqueados!',
  },
};

export class DungeonScene extends Phaser.Scene {
  private dungeonId: DungeonId = 'machu_picchu';
  private floor = 1;
  private seed = 1047;
  private isBossFloor = false;
  private player!: Player;
  private gridSystem!: GridSystem;
  private inventorySystem!: InventorySystem;
  private craftingSystem!: CraftingSystem;
  private manaSystem!: ManaSystem;
  private enemies: Enemy[] = [];
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private collisionLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private floorLayout: DungeonFloorLayout | null = null;
  private bossPortals: PortalTrigger[] = [];
  private bossBarBg: Phaser.GameObjects.Rectangle | null = null;
  private bossBarFill: Phaser.GameObjects.Rectangle | null = null;
  private bossLabel: Phaser.GameObjects.Text | null = null;
  private dungeonPromptText: Phaser.GameObjects.Text | null = null;
  private crystalPuzzleStep = 0;
  private crystalNodesVisuals = new Map<
    1 | 2 | 3,
    { sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite; badge: Phaser.GameObjects.Text }
  >();
  private stairsLockMarker: Phaser.GameObjects.Rectangle | null = null;
  private stormParticles: Phaser.GameObjects.Rectangle[] = [];
  private omenaLastPhase: 1 | 2 | 3 = 1;
  private activeTrapGid: number = MACHU_GID.TRAP;
  private activeOreGid: number = MACHU_GID.ORE;
  private oreHpMap = new Map<string, number>();

  private attackKey: Phaser.Input.Keyboard.Key | null = null;
  private spellKey: Phaser.Input.Keyboard.Key | null = null;
  private earthSpellKey: Phaser.Input.Keyboard.Key | null = null;
  private waterSpellKey: Phaser.Input.Keyboard.Key | null = null;
  private skySpellKey: Phaser.Input.Keyboard.Key | null = null;
  private interactKey: Phaser.Input.Keyboard.Key | null = null;
  private invKey: Phaser.Input.Keyboard.Key | null = null;
  private craftKey: Phaser.Input.Keyboard.Key | null = null;
  private questKey: Phaser.Input.Keyboard.Key | null = null;
  private hotbarKeys: Phaser.Input.Keyboard.Key[] = [];
  private unstableRift = false;
  private chestNodes: {
    tileX: number;
    tileY: number;
    opened: boolean;
    visual: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
    label: Phaser.GameObjects.Text;
  }[] = [];
  private breakableProps: {
    x: number;
    y: number;
    broken: boolean;
    sprite: Phaser.GameObjects.Image;
  }[] = [];
  private loreNodes: {
    tileX: number;
    tileY: number;
    loreId: string;
    read: boolean;
    visual: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
  }[] = [];
  private fountainNodes: {
    tileX: number;
    tileY: number;
    used: boolean;
    visual: Phaser.GameObjects.Sprite | Phaser.GameObjects.Ellipse;
    label: Phaser.GameObjects.Text;
  }[] = [];
  private attackCooldownMs = 0;
  private spellCooldownMs = 0;
  private trapCooldownMs = 0;
  private harmoniaRegenMs = 0;
  private isExiting = false;
  private isDialogueOpen = false;

  constructor() {
    super({ key: 'DungeonScene' });
  }

  create(data?: DungeonSceneData): void {
    this.dungeonId = data?.dungeonId ?? 'machu_picchu';
    this.floor = data?.floor ?? 1;
    this.seed = data?.seed ?? (gameState.getState().time.day * 97 + 1047);
    this.unstableRift = Boolean(data?.unstableRift);
    this.harmoniaRegenMs = 0;
    this.isBossFloor = this.floor > TOTAL_PROCEDURAL_FLOORS;
    this.enemies = [];
    this.bossPortals = [];
    this.chestNodes = [];
    this.breakableProps = [];
    this.loreNodes = [];
    this.fountainNodes = [];
    this.crystalPuzzleStep = 0;
    this.crystalNodesVisuals.clear();
    this.stairsLockMarker = null;
    this.stormParticles = [];
    this.omenaLastPhase = 1;
    this.activeTrapGid = MACHU_GID.TRAP;
    this.activeOreGid = MACHU_GID.ORE;
    this.dungeonPromptText = null;
    this.isExiting = false;
    this.isDialogueOpen = false;
    this.bossBarBg = null;
    this.bossBarFill = null;
    this.bossLabel = null;

    const theme = DUNGEON_THEMES[this.dungeonId];
    const state = gameState.getState();
    this.gridSystem = new GridSystem(state.tiles);
    this.inventorySystem = new InventorySystem(state);
    this.craftingSystem = new CraftingSystem(state, this.inventorySystem);
    this.manaSystem = new ManaSystem(state);
    this.manaSystem.unlockSpell('fagulha_arcana');

    this.playerProjectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();

    if (this.isBossFloor) {
      this.setupBossArena();
    } else {
      this.setupProceduralFloor();
    }

    if (this.dungeonId === 'varginha') {
      this.createVarginhaStormEffect();
    }

    this.player.syncEquipmentVisuals(state.equippedWeaponId, state.equippedArmorId);
    this.dungeonPromptText = this.add
      .text(0, 0, '', {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#fef08a',
        backgroundColor: '#14121d',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(5200)
      .setVisible(false);
    this.bindInputs();
    this.bindCombatCollisions();
    this.bindBusEvents();

    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    this.cameras.main.fadeIn(220, 20, 18, 29);

    const newlyUnlockedCp = recordDungeonCheckpoint(state.flags, this.dungeonId, this.floor);
    if (newlyUnlockedCp !== null) {
      const cpLabel =
        newlyUnlockedCp > TOTAL_PROCEDURAL_FLOORS
          ? 'Arena do Guardião'
          : `Santuário (Andar ${newlyUnlockedCp})`;
      EventBus.emit('SHOW_TOAST', {
        message: `✨ Elevador Rúnico sintonizado: ${cpLabel} desbloqueado para viagens rápidas!`,
        kind: 'success',
      });
    }

    const riftSuffix = this.unstableRift ? ' [Fenda Instável]' : '';
    const sanctuarySuffix =
      !this.isBossFloor && (this.floor === 5 || this.floor === 10) ? ' • Santuário' : '';
    const mapLabel = this.isBossFloor
      ? `${theme.arenaTitle}${riftSuffix}`
      : `${theme.dungeonTitle} — Andar ${this.floor}/${TOTAL_PROCEDURAL_FLOORS}${sanctuarySuffix}${riftSuffix}`;

    EventBus.emit('MAP_CHANGED', {
      mapId: this.isBossFloor ? theme.arenaMapKey : this.dungeonId,
      mapLabel,
    });
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
    EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
    EventBus.emit('SHOW_TOAST', {
      message: this.isBossFloor
        ? `${theme.bossLabel}! [Espaço/Clique] Ataque • [Q] Fagulha (${this.manaSystem.getSpellCost('fagulha_arcana')} Mana) • [Shift] Dash`
        : this.floor === 5 || this.floor === 10
        ? `Santuário do Andar ${this.floor}/${TOTAL_PROCEDURAL_FLOORS}! Fonte de Cura e Baús reforçados aguardam.`
        : `Andar ${this.floor}/${TOTAL_PROCEDURAL_FLOORS}: ${theme.floorHint}`,
      kind: 'info',
    });
  }

  update(_time: number, delta: number): void {
    const completedForgeJobs = this.craftingSystem.tickForgeJobs(delta);
    if (completedForgeJobs.length > 0) {
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      EventBus.emit('SHOW_TOAST', {
        message: 'Forja na fazenda concluída! Colete na Bancada de Fundição [E].',
        kind: 'success',
      });
      EventBus.emit('FORGE_UPDATED');
    }
    if (this.isExiting) return;

    const liveState = gameState.getState();
    if (tickActiveBuffs(liveState, delta)) {
      EventBus.emit('VITALS_UPDATED', { vitals: liveState.vitals });
    }
    if (hasActiveBuff(liveState, 'harmonia') && liveState.vitals.mana < liveState.vitals.maxMana) {
      this.harmoniaRegenMs += delta;
      if (this.harmoniaRegenMs >= 3000) {
        this.harmoniaRegenMs = 0;
        liveState.vitals.mana = Math.min(liveState.vitals.maxMana, liveState.vitals.mana + 1);
        EventBus.emit('VITALS_UPDATED', { vitals: liveState.vitals });
      }
    } else {
      this.harmoniaRegenMs = 0;
    }

    if (this.attackCooldownMs > 0) this.attackCooldownMs = Math.max(0, this.attackCooldownMs - delta);
    if (this.spellCooldownMs > 0) this.spellCooldownMs = Math.max(0, this.spellCooldownMs - delta);
    if (this.trapCooldownMs > 0) this.trapCooldownMs = Math.max(0, this.trapCooldownMs - delta);

    if (this.dungeonId === 'varginha') {
      this.updateVarginhaStormEffect(delta);
    }

    if (this.isDialogueOpen) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.dungeonPromptText?.setVisible(false);
      return;
    }

    this.player.updateMovement(delta);

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.updateAI(
        delta,
        this.player.x,
        this.player.y,
        (ox, oy, tx, ty) => {
          this.spawnEnemyProjectile(enemy, ox, oy, tx, ty);
        },
        (tx, ty, radius, phase) => {
          this.handleBossTelegraph(enemy, tx, ty, radius, phase);
        }
      );
    }

    this.hotbarKeys.forEach((key, idx) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        this.inventorySystem.selectHotbarSlot(idx);
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: idx });
      }
    });
    if (this.invKey && Phaser.Input.Keyboard.JustDown(this.invKey)) {
      EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'mochila' });
    }
    if (this.craftKey && Phaser.Input.Keyboard.JustDown(this.craftKey)) {
      EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'criacao' });
    }
    if (this.questKey && Phaser.Input.Keyboard.JustDown(this.questKey)) {
      EventBus.emit('OPEN_QUEST_MODAL');
    }

    if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.performMeleeAttack();
    }
    if (this.spellKey && Phaser.Input.Keyboard.JustDown(this.spellKey)) {
      this.performArcaneBolt();
    }
    if (this.earthSpellKey && Phaser.Input.Keyboard.JustDown(this.earthSpellKey)) {
      this.castSpellById('pilar_telurico');
    }
    if (this.waterSpellKey && Phaser.Input.Keyboard.JustDown(this.waterSpellKey)) {
      this.castSpellById('mare_curativa');
    }
    if (this.skySpellKey && Phaser.Input.Keyboard.JustDown(this.skySpellKey)) {
      this.castSpellById('raio_estelar');
    }
    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.handleDungeonInteract();
    }

    this.checkFloorHazardsAndPortals();
  }

  private getDungeonTilesetMapping(): {
    tilesetKey: string;
    floorGid: number;
    wallGid: number;
    trapGid: number;
    oreGid: number;
    stairsGid: number;
    arenaMap: Record<number, number>;
  } {
    if (this.dungeonId === 'machu_picchu' && this.textures.exists('machu_picchu_tileset')) {
      return {
        tilesetKey: 'machu_picchu_tileset',
        floorGid: 1,
        wallGid: 2,
        trapGid: 3,
        oreGid: 4,
        stairsGid: 5,
        arenaMap: {
          28: 1,
          29: 2,
          27: 6,
          16: 5,
        },
      };
    }
    if (this.dungeonId === 'chapada' && this.textures.exists('chapada_tileset')) {
      return {
        tilesetKey: 'chapada_tileset',
        floorGid: 1,
        wallGid: 2,
        trapGid: 3,
        oreGid: 4,
        stairsGid: 5,
        arenaMap: {
          7: 1,
          11: 2,
          23: 8,
          3: 6,
          27: 1,
          16: 5,
        },
      };
    }
    if (this.dungeonId === 'varginha' && this.textures.exists('varginha_tileset')) {
      return {
        tilesetKey: 'varginha_tileset',
        floorGid: 1,
        wallGid: 2,
        trapGid: 3,
        oreGid: 4,
        stairsGid: 5,
        arenaMap: {
          28: 1,
          29: 2,
          11: 8,
          27: 6,
          8: 1,
          16: 5,
        },
      };
    }
    if (this.dungeonId === 'fortaleza_omena' && this.textures.exists('varginha_tileset')) {
      return {
        tilesetKey: 'varginha_tileset',
        floorGid: 9,
        wallGid: 10,
        trapGid: 11,
        oreGid: 4,
        stairsGid: 13,
        arenaMap: {
          7: 9,
          29: 10,
          23: 12,
          27: 14,
          8: 9,
          16: 13,
        },
      };
    }
    return {
      tilesetKey: 'sao_tome_tileset',
      floorGid: MACHU_GID.FLOOR,
      wallGid: MACHU_GID.WALL,
      trapGid: MACHU_GID.TRAP,
      oreGid: MACHU_GID.ORE,
      stairsGid: MACHU_GID.STAIRS,
      arenaMap: {},
    };
  }

  private setupProceduralFloor(): void {
    const layout = generateDungeonFloor(this.dungeonId, this.floor, this.seed);
    this.floorLayout = layout;
    const tileCfg = this.getDungeonTilesetMapping();
    this.activeTrapGid = tileCfg.trapGid;
    this.activeOreGid = tileCfg.oreGid;

    const map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: layout.width,
      height: layout.height,
    });
    const tileset = map.addTilesetImage(
      tileCfg.tilesetKey,
      tileCfg.tilesetKey,
      TILE_SIZE,
      TILE_SIZE,
      1,
      2,
      1
    );
    if (!tileset) throw new Error('Tileset não carregado.');

    const ground = map.createBlankLayer('Chao', tileset);
    const collisions = map.createBlankLayer('Colisoes', tileset);
    if (!ground || !collisions) throw new Error('Falha ao criar camadas procedurais.');

    for (let y = 0; y < layout.height; y++) {
      for (let x = 0; x < layout.width; x++) {
        const idx = y * layout.width + x;
        const rawG = layout.groundGids[idx] ?? MACHU_GID.FLOOR;
        const rawC = layout.collisionGids[idx] ?? 0;

        let gGid = rawG;
        if (tileCfg.tilesetKey !== 'sao_tome_tileset') {
          if (rawG === MACHU_GID.TRAP) gGid = tileCfg.trapGid;
          else if (rawG === MACHU_GID.STAIRS) gGid = tileCfg.stairsGid;
          else gGid = tileCfg.floorGid;
        }
        ground.putTileAt(gGid, x, y);

        if (rawC > 0) {
          let cGid = rawC;
          if (tileCfg.tilesetKey !== 'sao_tome_tileset') {
            cGid = rawC === MACHU_GID.ORE ? tileCfg.oreGid : tileCfg.wallGid;
          }
          collisions.putTileAt(cGid, x, y);
        }
      }
    }

    ground.setDepth(0);
    collisions.setDepth(2);
    collisions.setCollisionByExclusion([-1, 0]);
    this.groundLayer = ground;
    this.collisionLayer = collisions;

    const startCenter = this.gridSystem.tileToWorldCenter(
      layout.startTile.tileX,
      layout.startTile.tileY
    );
    const hasSanctuaryV4 = this.textures.exists('dungeon_sanctuary_elevator_v4_sheet');
    const isSanctuaryFloor = this.floor === 5 || this.floor === 10;
    const isCheckpointFloor =
      this.floor === 1 || this.floor === 4 || this.floor === 7 || this.floor === 10;
    if (hasSanctuaryV4) {
      const elevatorPedestal = this.add
        .sprite(startCenter.x, startCenter.y, 'dungeon_sanctuary_elevator_v4_sheet', 0)
        .setDepth(1);
      if (isCheckpointFloor && this.anims.exists('runic_elevator_active_anim')) {
        elevatorPedestal.play('runic_elevator_active_anim');
      }
    }

    this.player = new Player(this, startCenter.x, startCenter.y);
    this.physics.add.collider(this.player, collisions);

    this.physics.world.setBounds(0, 0, layout.width * TILE_SIZE, layout.height * TILE_SIZE);
    this.cameras.main.setBounds(0, 0, layout.width * TILE_SIZE, layout.height * TILE_SIZE);

    for (const spawn of layout.enemySpawns) {
      const pos = this.gridSystem.tileToWorldCenter(spawn.tileX, spawn.tileY);
      const enemy = new Enemy(this, pos.x, pos.y, spawn.kind);
      if (this.unstableRift) enemy.applyRiftBoost(1.4, 1.35);
      this.physics.add.collider(enemy, collisions);
      this.enemies.push(enemy);
    }

    const hasDetailSheet = this.textures.exists('dungeons_details_sheet');

    for (const chest of layout.treasureChests) {
      const pos = this.gridSystem.tileToWorldCenter(chest.tileX, chest.tileY);
      const visual =
        hasSanctuaryV4 && isSanctuaryFloor
          ? this.add
            .sprite(pos.x, pos.y - 4, 'dungeon_sanctuary_elevator_v4_sheet', 6)
            .setDepth(pos.y)
          : hasDetailSheet
          ? this.add
            .sprite(pos.x, pos.y - 2, 'dungeons_details_sheet', DUNGEON_DETAIL_FRAMES.CHEST_CLOSED)
            .setDepth(pos.y)
          : this.add
            .rectangle(pos.x, pos.y, 18, 14, 0x7c4d2b, 0.95)
            .setStrokeStyle(2, 0xf5b942, 1)
            .setDepth(pos.y);
      const label = this.add
        .text(pos.x, pos.y - 18, 'Baú [E]', {
          fontSize: '10px',
          color: '#fef08a',
          backgroundColor: '#1b1726',
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(pos.y + 10);
      this.chestNodes.push({ ...chest, opened: false, visual, label });
    }

    const exitCenter = this.gridSystem.tileToWorldCenter(layout.exitTile.tileX, layout.exitTile.tileY);
    if (hasSanctuaryV4 && isSanctuaryFloor) {
      this.add
        .sprite(exitCenter.x, exitCenter.y - 4, 'dungeon_sanctuary_elevator_v4_sheet', 3)
        .setDepth(3);
    }

    if (hasDetailSheet) {
      // Pad de saída animado
      if ((!isSanctuaryFloor || !hasSanctuaryV4) && this.anims.exists('dungeon_portal_anim')) {
        const portalPad = this.add
          .sprite(exitCenter.x, exitCenter.y, 'dungeons_details_sheet', DUNGEON_DETAIL_FRAMES.PORTAL_PAD_1)
          .setAlpha(0.92)
          .setDepth(3);
        portalPad.play('dungeon_portal_anim');
      }

      // Chão rachado (dungeons de pedra), tochas em paredes e vasos/caixotes quebráveis
      let torchesPlaced = 0;
      let potsPlaced = 0;
      const allowStoneFloorCracks =
        this.dungeonId === 'machu_picchu' || this.dungeonId === 'chapada';
      for (let y = 1; y < layout.height - 1; y++) {
        for (let x = 1; x < layout.width - 1; x++) {
          const isWalkable = !collisions.getTileAt(x, y);
          if (!isWalkable) continue;
          const hash = (x * 31 + y * 17 + this.seed) % 29;
          const pos = this.gridSystem.tileToWorldCenter(x, y);
          if (allowStoneFloorCracks && hash === 3) {
            this.add
              .image(pos.x, pos.y, 'dungeons_details_sheet', DUNGEON_DETAIL_FRAMES.FLOOR_CRACKED)
              .setAlpha(0.75)
              .setDepth(1);
          }

          const hasWallAbove = Boolean(collisions.getTileAt(x, y - 1));
          if (hasWallAbove && torchesPlaced < 8 && (x + y) % 5 === 0 && this.anims.exists('dungeon_torch_anim')) {
            const torch = this.add
              .sprite(pos.x, pos.y - TILE_SIZE * 0.55, 'dungeons_details_sheet', DUNGEON_DETAIL_FRAMES.TORCH_1)
              .setScale(0.85)
              .setDepth(pos.y + 6);
            torch.play('dungeon_torch_anim');
            torchesPlaced++;
          }

          const nearStartOrExit =
            Math.hypot(x - layout.startTile.tileX, y - layout.startTile.tileY) <= 2 ||
            Math.hypot(x - layout.exitTile.tileX, y - layout.exitTile.tileY) <= 2;
          const occupiedByChest = layout.treasureChests.some((c) => c.tileX === x && c.tileY === y);
          if (!nearStartOrExit && !occupiedByChest && potsPlaced < 5 && (x * 7 + y * 13 + this.seed) % 37 === 0) {
            const propFrame =
              potsPlaced % 2 === 0 ? DUNGEON_DETAIL_FRAMES.CLAY_POT : DUNGEON_DETAIL_FRAMES.WOOD_CRATE;
            const sprite = this.add
              .image(pos.x, pos.y, 'dungeons_details_sheet', propFrame)
              .setScale(0.85)
              .setDepth(pos.y);
            this.breakableProps.push({ x: pos.x, y: pos.y, broken: false, sprite });
            potsPlaced++;
          }
        }
      }
    }

    const qs = new QuestSystem(gameState.getState(), this.inventorySystem);
    for (const totem of layout.loreTotems) {
      const pos = this.gridSystem.tileToWorldCenter(totem.tileX, totem.tileY);
      const alreadyRead = Boolean(gameState.getState().compendium?.loreRead.includes(totem.loreId));
      const visual = this.textures.exists('crystal_pillars_sheet')
        ? this.add
          .sprite(pos.x, pos.y - 6, 'crystal_pillars_sheet', alreadyRead ? 0 : 3)
          .setTint(alreadyRead ? 0x94a3b8 : 0xffffff)
          .setDepth(pos.y)
        : this.add
          .rectangle(pos.x, pos.y - 2, 12, 22, alreadyRead ? 0x334155 : 0x2b2640, 0.96)
          .setStrokeStyle(2, alreadyRead ? 0x64748b : 0x7e8ce0, 1)
          .setDepth(pos.y);
      if (
        !alreadyRead &&
        visual instanceof Phaser.GameObjects.Sprite &&
        this.anims.exists('crystal_pillar_pulse')
      ) {
        visual.play('crystal_pillar_pulse');
      }
      const label = this.add
        .text(pos.x, pos.y - 22, alreadyRead ? 'Estela (Lida)' : 'Estela [E]', {
          fontSize: '10px',
          color: alreadyRead ? '#94a3b8' : '#c7d2fe',
          backgroundColor: '#1b1726',
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(pos.y + 10);
      this.loreNodes.push({ ...totem, read: alreadyRead, visual, label });
    }
    void qs;

    for (const fount of layout.healingFountains) {
      const pos = this.gridSystem.tileToWorldCenter(fount.tileX, fount.tileY);
      let visual: Phaser.GameObjects.Sprite | Phaser.GameObjects.Ellipse;
      if (hasSanctuaryV4) {
        visual = this.add
          .sprite(pos.x, pos.y - 4, 'dungeon_sanctuary_elevator_v4_sheet', 4)
          .setDepth(pos.y);
      } else if (this.textures.exists('omena_world_props_sheet') && this.anims.exists('nucleo_mundo_pulse')) {
        visual = this.add
          .sprite(pos.x, pos.y - 2, 'omena_world_props_sheet', 0)
          .setScale(0.72)
          .setDepth(pos.y);
        visual.play('nucleo_mundo_pulse');
      } else {
        visual = this.add
          .ellipse(pos.x, pos.y + 2, 20, 14, 0x38bdf8, 0.72)
          .setStrokeStyle(2, 0x5bc26e, 0.95)
          .setDepth(pos.y);
      }
      const label = this.add
        .text(pos.x, pos.y - 18, 'Fonte [E]', {
          fontSize: '10px',
          color: '#67e8f9',
          backgroundColor: '#1b1726',
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(pos.y + 10);
      this.fountainNodes.push({ ...fount, used: false, visual, label });
    }

    if (layout.requiresCrystalPuzzle) {
      for (const node of layout.crystalNodes) {
        const pos = this.gridSystem.tileToWorldCenter(node.tileX, node.tileY);
        const sprite = this.textures.exists('crystal_pillars_sheet')
          ? this.add.sprite(pos.x, pos.y - 6, 'crystal_pillars_sheet', node.order - 1).setDepth(pos.y)
          : this.add.image(pos.x, pos.y, `crystal_pillar_${node.order}`).setDepth(pos.y);
        const badge = this.add
          .text(pos.x, pos.y - 20, String(node.order), {
            fontSize: '12px',
            color: '#e0f2fe',
            backgroundColor: '#0f172a',
            padding: { x: 4, y: 1 },
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(pos.y + 10);
        this.crystalNodesVisuals.set(node.order, { sprite, badge });
      }

      const exitCenter = this.gridSystem.tileToWorldCenter(
        layout.exitTile.tileX,
        layout.exitTile.tileY
      );
      this.stairsLockMarker = this.add
        .rectangle(exitCenter.x, exitCenter.y, TILE_SIZE - 4, TILE_SIZE - 4, 0xe05263, 0.45)
        .setDepth(15);
    }
  }

  private setupBossArena(): void {
    const theme = DUNGEON_THEMES[this.dungeonId];
    const sourceMap = this.make.tilemap({ key: theme.arenaMapKey });
    const tileCfg = this.getDungeonTilesetMapping();

    let chao: Phaser.Tilemaps.TilemapLayer | null = null;
    let deco: Phaser.Tilemaps.TilemapLayer | null = null;
    let cols: Phaser.Tilemaps.TilemapLayer | null = null;
    let activeMap = sourceMap;

    if (tileCfg.tilesetKey !== 'sao_tome_tileset') {
      const themedMap = this.make.tilemap({
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        width: sourceMap.width,
        height: sourceMap.height,
      });
      const themedTileset = themedMap.addTilesetImage(
        tileCfg.tilesetKey,
        tileCfg.tilesetKey,
        TILE_SIZE,
        TILE_SIZE,
        1,
        2,
        1
      );
      if (!themedTileset) throw new Error('Tileset temático da arena não carregado.');

      chao = themedMap.createBlankLayer('Chao', themedTileset);
      deco = themedMap.createBlankLayer('Decoracao', themedTileset);
      cols = themedMap.createBlankLayer('Colisoes', themedTileset);

      const copyMappedLayer = (
        srcName: string,
        dstLayer: Phaser.Tilemaps.TilemapLayer | null,
        fallbackGid: number
      ) => {
        const srcData = sourceMap.getLayer(srcName)?.data;
        if (!srcData || !dstLayer) return;
        for (let y = 0; y < sourceMap.height; y++) {
          for (let x = 0; x < sourceMap.width; x++) {
            const tile = srcData[y]?.[x];
            if (tile && tile.index > 0) {
              const mapped = tileCfg.arenaMap[tile.index] ?? fallbackGid;
              if (mapped > 0) dstLayer.putTileAt(mapped, x, y);
            }
          }
        }
      };

      copyMappedLayer('Chao', chao, tileCfg.floorGid);
      copyMappedLayer('Decoracao', deco, 0);
      copyMappedLayer('Colisoes', cols, tileCfg.wallGid);

      if (tileCfg.tilesetKey === 'machu_picchu_tileset' && chao && deco && cols) {
        for (const [px, py] of [
          [4, 4],
          [15, 4],
          [4, 11],
          [15, 11],
        ] as const) {
          cols.putTileAt(9, px, py);
        }
        cols.putTileAt(12, 9, 0);
        cols.putTileAt(12, 10, 0);
        deco.putTileAt(10, 7, 1);
        deco.putTileAt(10, 12, 1);
        deco.putTileAt(11, 2, 1);
        deco.putTileAt(11, 17, 1);
        for (const py of [6, 7, 8, 9]) {
          chao.putTileAt(8, 7, py);
          chao.putTileAt(8, 12, py);
        }
      }

      activeMap = themedMap;
    } else {
      const tileset = sourceMap.addTilesetImage('sao_tome_tileset', 'sao_tome_tileset');
      if (!tileset) throw new Error('Tileset não carregado.');
      chao = sourceMap.createLayer('Chao', tileset, 0, 0);
      deco = sourceMap.createLayer('Decoracao', tileset, 0, 0);
      cols = sourceMap.createLayer('Colisoes', tileset, 0, 0);
    }

    chao?.setDepth(0);
    deco?.setDepth(1);
    cols?.setDepth(2);
    cols?.setCollisionByExclusion([-1, 0]);
    this.groundLayer = chao;
    this.collisionLayer = cols;

    const spawnsLayer = sourceMap.getObjectLayer('Spawns');
    const pSpawn = spawnsLayer?.objects.find((o) => o.name === 'default');
    const px = (pSpawn?.x ?? 10 * TILE_SIZE) + TILE_SIZE / 2;
    const py = (pSpawn?.y ?? 13 * TILE_SIZE) + TILE_SIZE / 2;
    this.player = new Player(this, px, py);
    if (cols) this.physics.add.collider(this.player, cols);

    this.physics.world.setBounds(0, 0, activeMap.widthInPixels, activeMap.heightInPixels);
    this.cameras.main.setBounds(0, 0, activeMap.widthInPixels, activeMap.heightInPixels);

    const portalLayer = sourceMap.getObjectLayer('Portais');
    portalLayer?.objects.forEach((obj) => {
      const targetMap = getTiledProperty<string>(obj.properties, 'targetMap');
      const targetTileX = getTiledProperty<number>(obj.properties, 'targetTileX');
      const targetTileY = getTiledProperty<number>(obj.properties, 'targetTileY');
      const label = getTiledProperty<string>(obj.properties, 'label') ?? obj.name;
      if (targetMap && typeof targetTileX === 'number' && typeof targetTileY === 'number') {
        this.bossPortals.push({
          name: obj.name,
          x: obj.x ?? 0,
          y: obj.y ?? 0,
          width: obj.width ?? TILE_SIZE,
          height: obj.height ?? TILE_SIZE,
          targetMap,
          targetTileX,
          targetTileY,
          label,
        });
      }
    });

    if (this.textures.exists('dungeons_details_sheet')) {
      if (this.anims.exists('dungeon_portal_anim')) {
        for (const p of this.bossPortals) {
          const portalPad = this.add
            .sprite(p.x + p.width / 2, p.y + p.height / 2, 'dungeons_details_sheet', DUNGEON_DETAIL_FRAMES.PORTAL_PAD_1)
            .setAlpha(0.92)
            .setDepth(3);
          portalPad.play('dungeon_portal_anim');
        }
      }
      if (this.anims.exists('dungeon_torch_anim')) {
        const torchTiles: ReadonlyArray<readonly [number, number]> = [
          [5, 3],
          [14, 3],
          [5, 11],
          [14, 11],
        ];
        for (const [tx, ty] of torchTiles) {
          const torch = this.add
            .sprite(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, 'dungeons_details_sheet', DUNGEON_DETAIL_FRAMES.TORCH_1)
            .setScale(0.9)
            .setDepth(ty * TILE_SIZE + 20);
          torch.play('dungeon_torch_anim');
        }
      }
    }

    if (this.dungeonId === 'fortaleza_omena') {
      if (this.textures.exists('omena_world_props_sheet') && this.anims.exists('nucleo_mundo_pulse')) {
        const worldCore = this.add
          .sprite(10 * TILE_SIZE, 8 * TILE_SIZE, 'omena_world_props_sheet', OMENA_PROPS_FRAMES.NUCLEO_START)
          .setDepth(4);
        worldCore.play('nucleo_mundo_pulse');
      } else {
        const worldCore = this.add.image(10 * TILE_SIZE, 8 * TILE_SIZE, 'nucleo_mundo').setDepth(4);
        this.tweens.add({
          targets: worldCore,
          scale: 1.15,
          alpha: 0.82,
          duration: 1300,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    const shouldSpawnBoss =
      !gameState.getState().flags[theme.blessedFlag] ||
      (this.dungeonId === 'fortaleza_omena' && Boolean(gameState.getState().flags.endgame_unlocked));

    if (shouldSpawnBoss) {
      const bSpawn = spawnsLayer?.objects.find((o) => o.name === theme.bossSpawnName);
      const bx = (bSpawn?.x ?? 10 * TILE_SIZE) + TILE_SIZE;
      const by = (bSpawn?.y ?? 5 * TILE_SIZE) + TILE_SIZE;
      const boss = new Enemy(this, bx, by, theme.bossKind);
      if (this.unstableRift) boss.applyRiftBoost(1.4, 1.35);
      if (cols) this.physics.add.collider(boss, cols);
      this.enemies.push(boss);
      const title =
        this.dungeonId === 'fortaleza_omena' && gameState.getState().flags.endgame_unlocked
          ? `Eco de Omena (Endgame${this.unstableRift ? ' — Fenda Instável' : ''}) — Fase 1/3`
          : `${theme.bossLabel}${this.unstableRift ? ' [Fenda Instável]' : ''}`;
      this.createBossHealthBar(boss, title);
    }
  }

  private createBossHealthBar(boss: Enemy, titleText: string): void {
    const cx = this.scale.width / 2;
    this.bossLabel = this.add
      .text(cx, 68, titleText, {
        fontSize: '14px',
        color: '#f5b942',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(4500);
    this.bossBarBg = this.add
      .rectangle(cx, 88, 280, 12, 0x1b1726, 0.9)
      .setScrollFactor(0)
      .setDepth(4500);
    this.bossBarFill = this.add
      .rectangle(cx - 140, 88, 280, 10, 0xe05263, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(4501);
    this.updateBossBar(boss);
  }

  private updateBossBar(boss: Enemy): void {
    if (!this.bossBarFill) return;
    const ratio = Math.max(0, boss.hp / Math.max(1, boss.effectiveMaxHp));
    this.bossBarFill.width = 280 * ratio;
  }

  private bindInputs(): void {
    const unlockAudio = () => audioSystem.unlock();
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);

    const kb = this.input.keyboard;
    if (kb) {
      this.attackKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.spellKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      this.earthSpellKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.waterSpellKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.F);
      this.skySpellKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.V);
      this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.invKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      this.craftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      this.questKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);

      const codes = [
        Phaser.Input.Keyboard.KeyCodes.ONE,
        Phaser.Input.Keyboard.KeyCodes.TWO,
        Phaser.Input.Keyboard.KeyCodes.THREE,
        Phaser.Input.Keyboard.KeyCodes.FOUR,
        Phaser.Input.Keyboard.KeyCodes.FIVE,
        Phaser.Input.Keyboard.KeyCodes.SIX,
        Phaser.Input.Keyboard.KeyCodes.SEVEN,
        Phaser.Input.Keyboard.KeyCodes.EIGHT,
        Phaser.Input.Keyboard.KeyCodes.NINE,
        Phaser.Input.Keyboard.KeyCodes.ZERO,
        Phaser.Input.Keyboard.KeyCodes.MINUS,
        Phaser.Input.Keyboard.KeyCodes.PLUS,
      ];
      this.hotbarKeys = codes.map((c) => kb.addKey(c));
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isExiting || this.isDialogueOpen) return;
      if (pointer.leftButtonDown()) {
        this.performMeleeAttack();
      } else if (pointer.rightButtonDown()) {
        this.performArcaneBolt();
      }
    });
  }

  private bindCombatCollisions(): void {
    this.physics.add.overlap(this.player, this.enemies, (_p, eObj) => {
      const enemy = eObj as Enemy;
      if (!enemy.active || this.player.isInvulnerable() || !enemy.canTouchAttack()) return;
      const scale = enemy.damageScale;
      const scaledElem: Partial<Record<ElementType, number>> = {};
      for (const [k, v] of Object.entries(enemy.stats.elementalDamage) as [ElementType, number | undefined][]) {
        if (v) scaledElem[k] = Math.round(v * scale);
      }
      this.damagePlayer(Math.round(enemy.stats.physicalDamage * scale), scaledElem);
    });

    this.physics.add.overlap(this.playerProjectiles, this.enemies, (obj1, obj2) => {
      const enemy = obj1 instanceof Enemy ? obj1 : (obj2 as Enemy);
      const proj = (obj1 instanceof Enemy ? obj2 : obj1) as Phaser.Physics.Arcade.Image;
      if (!proj.active || !enemy.active) return;

      const hitSet = proj.getData('hitEnemies') as Set<Enemy> | undefined;
      if (hitSet) {
        if (hitSet.has(enemy)) return;
        hitSet.add(enemy);
      }

      const projX = proj.x;
      const projY = proj.y;
      const extraElem = (proj.getData('extraElemental') as Partial<Record<ElementType, number>> | undefined) ?? {
        arcano: 14,
      };
      const basePhysical = (proj.getData('basePhysical') as number | undefined) ?? 6;

      if (!hitSet) {
        proj.destroy();
      }

      const stats = CombatSystem.getPlayerAttackStats(gameState.getState());
      const dmg = calculateElementalDamage({
        basePhysical,
        elementalDamage: { ...extraElem, ...(stats.elementalDamage ?? {}) },
        targetResistances: enemy.stats.resistances,
      });
      this.damageEnemy(enemy, dmg.totalDamage, projX, projY);
    });

    this.physics.add.overlap(this.player, this.enemyProjectiles, (_p, projObj) => {
      const proj = projObj as Phaser.Physics.Arcade.Image;
      if (!proj.active) return;
      const elem = (proj.getData('element') as ElementType | undefined) ?? 'terra';
      const phys = (proj.getData('physDmg') as number | undefined) ?? 10;
      const elemDmg = (proj.getData('elemDmg') as number | undefined) ?? 8;
      proj.destroy();
      if (!this.player.isInvulnerable()) {
        this.damagePlayer(phys, { [elem]: elemDmg });
      }
    });

    if (this.collisionLayer) {
      this.physics.add.collider(this.playerProjectiles, this.collisionLayer, (projObj) => {
        (projObj as Phaser.GameObjects.GameObject).destroy();
      });
      this.physics.add.collider(this.enemyProjectiles, this.collisionLayer, (projObj) => {
        (projObj as Phaser.GameObjects.GameObject).destroy();
      });
    }
  }

  private bindBusEvents(): void {
    const onOpen = () => {
      this.isDialogueOpen = true;
    };
    const onClose = () => {
      this.isDialogueOpen = false;
    };
    const onSelectSlot = ({ index }: { index: number }) => {
      this.inventorySystem.selectHotbarSlot(index);
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
    };
    const onCraft = ({
      recipeId,
      forgeTile,
    }: {
      recipeId: string;
      forgeTile?: { tileX: number; tileY: number };
    }) => {
      const res = this.craftingSystem.craft(recipeId, forgeTile);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'craft' : 'error' });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
      EventBus.emit('FORGE_UPDATED');
    };
    const onEquipItem = ({ itemId, fromSlot }: { itemId: string; fromSlot?: number }) => {
      const state = gameState.getState();
      const res = this.inventorySystem.equipItem(itemId, fromSlot);
      if (!res.ok) {
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'error' });
        return;
      }
      this.player.syncEquipmentVisuals(state.equippedWeaponId, state.equippedArmorId);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'success' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
    };
    const onUnequipItem = ({ slot }: { slot: 'weapon' | 'armor' }) => {
      const state = gameState.getState();
      const res = this.inventorySystem.unequipGear(slot);
      if (!res.ok) {
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'error' });
        return;
      }
      this.player.syncEquipmentVisuals(state.equippedWeaponId, state.equippedArmorId);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'info' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
    };
    const onSwapSlots = ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number }) => {
      if (this.inventorySystem.swapSlots(fromIndex, toIndex)) {
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
      }
    };
    const onUseSlot = ({ slotIndex }: { slotIndex: number }) => {
      if (this.isExiting || this.isDialogueOpen) return;
      this.useInventorySlot(slotIndex);
    };
    const onCastSpell = ({ spellId }: { spellId: string }) => {
      if (this.isExiting || this.isDialogueOpen) return;
      this.castSpellById(spellId);
    };

    EventBus.on('OPEN_DIALOGUE', onOpen);
    EventBus.on('CLOSE_DIALOGUE', onClose);
    EventBus.on('SELECT_HOTBAR_SLOT', onSelectSlot);
    EventBus.on('CRAFT_ITEM', onCraft);
    EventBus.on('EQUIP_ITEM', onEquipItem);
    EventBus.on('UNEQUIP_ITEM', onUnequipItem);
    EventBus.on('SWAP_INVENTORY_SLOTS', onSwapSlots);
    EventBus.on('USE_INVENTORY_SLOT', onUseSlot);
    EventBus.on('CAST_SPELL', onCastSpell);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('OPEN_DIALOGUE', onOpen);
      EventBus.off('CLOSE_DIALOGUE', onClose);
      EventBus.off('SELECT_HOTBAR_SLOT', onSelectSlot);
      EventBus.off('CRAFT_ITEM', onCraft);
      EventBus.off('EQUIP_ITEM', onEquipItem);
      EventBus.off('UNEQUIP_ITEM', onUnequipItem);
      EventBus.off('SWAP_INVENTORY_SLOTS', onSwapSlots);
      EventBus.off('USE_INVENTORY_SLOT', onUseSlot);
      EventBus.off('CAST_SPELL', onCastSpell);
    });
  }

  private useInventorySlot(slotIndex: number): void {
    const state = gameState.getState();
    const slot = state.inventory[slotIndex];
    if (!slot) return;
    const itemDef = getItemDef(slot.itemId);
    if (!itemDef) return;

    if (itemDef.category === 'armor' || itemDef.category === 'weapon') {
      if (itemDef.category === 'weapon' && state.equippedWeaponId === itemDef.id) {
        this.performArcaneBolt();
        return;
      }
      const res = this.inventorySystem.equipFromSlot(slotIndex);
      if (res.ok) {
        this.player.syncEquipmentVisuals(state.equippedWeaponId, state.equippedArmorId);
      }
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'interact' : 'error' });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      return;
    }

    if (itemDef.category === 'consumable' || itemDef.category === 'crop') {
      const res = this.inventorySystem.consumeRestoreItem(slotIndex);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'magic' : 'error' });
      EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'info' });
      return;
    }

    if (itemDef.id === 'picareta_simples') {
      if (slotIndex >= 0 && slotIndex < 12) {
        this.inventorySystem.selectHotbarSlot(slotIndex);
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: slotIndex });
      }
      this.handleDungeonInteract();
    }
  }

  private performMeleeAttack(): void {
    if (this.attackCooldownMs > 0) return;
    this.attackCooldownMs = 340;
    const state = gameState.getState();
    const weaponDef = state.equippedWeaponId ? getItemDef(state.equippedWeaponId) : undefined;
    this.player.playAction('swing', state.equippedWeaponId ?? undefined);

    const dir = this.player.getFacingVector();
    const hitX = this.player.x + dir.x * 26;
    const hitY = this.player.y + dir.y * 26;

    let arc: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    if (this.textures.exists('combat_vfx_a_sheet')) {
      const slash = this.add.sprite(hitX, hitY, 'combat_vfx_a_sheet', 4).setDepth(4000);
      if (this.anims.exists('slash_arc_anim')) slash.play('slash_arc_anim');
      arc = slash;
    } else {
      arc = this.add.image(hitX, hitY, 'slash_arc').setDepth(4000);
    }
    if (weaponDef?.visualColor) {
      arc.setTint(Number.parseInt(weaponDef.visualColor.replace('#', ''), 16));
    }
    arc.setRotation(Math.atan2(dir.y, dir.x));
    this.time.delayedCall(160, () => arc.destroy());
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });

    const stats = CombatSystem.getPlayerAttackStats(gameState.getState());
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y);
      const hitRadius = enemy.stats.isBoss ? 46 : 30;
      if (dist <= hitRadius) {
        const dmg = calculateElementalDamage({
          basePhysical: stats.basePhysical,
          elementalDamage: stats.elementalDamage,
          targetResistances: enemy.stats.resistances,
        });
        this.damageEnemy(enemy, dmg.totalDamage, this.player.x, this.player.y);
      }
    }

    for (const prop of this.breakableProps) {
      if (prop.broken) continue;
      if (Phaser.Math.Distance.Between(hitX, hitY, prop.x, prop.y) <= 30) {
        prop.broken = true;
        this.tweens.add({
          targets: prop.sprite,
          scale: 0.2,
          alpha: 0,
          duration: 160,
          onComplete: () => prop.sprite.destroy(),
        });
        const bonusGold = 4 + Math.floor(Math.random() * 5);
        state.gold += bonusGold;
        EventBus.emit('GOLD_UPDATED', { gold: state.gold });
        this.showFloatingNumber(prop.x, prop.y - 10, `+${bonusGold} G`, '#fde047');
      }
    }
  }

  private performArcaneBolt(): void {
    if (this.spellCooldownMs > 0) return;
    if (!this.manaSystem.consumeForSpell('fagulha_arcana')) {
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
      EventBus.emit('SHOW_TOAST', { message: 'Mana insuficiente para Fagulha Arcana!', kind: 'error' });
      return;
    }

    this.spellCooldownMs = 360;
    const state = gameState.getState();
    const weaponDef = state.equippedWeaponId ? getItemDef(state.equippedWeaponId) : undefined;
    this.player.playAction('cast', state.equippedWeaponId ?? undefined);
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });

    const dir = this.player.getFacingVector();
    const useWaterBolt =
      Boolean(
        weaponDef?.elementTheme === 'agua' ||
        typeof weaponDef?.elementalDamage?.agua === 'number' ||
        weaponDef?.id.includes('aguas') ||
        weaponDef?.id.includes('mar')
      ) &&
      this.textures.exists('combat_vfx_b_sheet') &&
      this.anims.exists('water_bolt_anim');
    const useWindBolt =
      Boolean(
        weaponDef?.elementTheme === 'ar' ||
        typeof weaponDef?.elementalDamage?.ar === 'number' ||
        weaponDef?.id.includes('ceus') ||
        weaponDef?.id.includes('vento')
      ) &&
      this.textures.exists('combat_vfx_b_sheet') &&
      this.anims.exists('wind_bolt_anim');
    const useVfxSheet = this.textures.exists('combat_vfx_a_sheet');
    const boltTex = useWaterBolt || useWindBolt ? 'combat_vfx_b_sheet' : useVfxSheet ? 'combat_vfx_a_sheet' : 'arcane_bolt';
    const boltFrame = useWaterBolt ? 0 : useWindBolt ? 4 : useVfxSheet ? 0 : undefined;
    const boltAnim = useWaterBolt
      ? 'water_bolt_anim'
      : useWindBolt
        ? 'wind_bolt_anim'
        : 'arcane_bolt_anim';

    const bolt = this.playerProjectiles.create(
      this.player.x + dir.x * 16,
      this.player.y + dir.y * 16,
      boltTex,
      boltFrame
    ) as Phaser.Physics.Arcade.Sprite;
    bolt.setDepth(3500);
    if (useWaterBolt || useWindBolt || useVfxSheet) {
      bolt.setRotation(Math.atan2(dir.y, dir.x));
      if (this.anims.exists(boltAnim)) bolt.play(boltAnim);
    }
    if (!useWaterBolt && !useWindBolt && weaponDef?.visualColor) {
      bolt.setTint(Number.parseInt(weaponDef.visualColor.replace('#', ''), 16));
    }
    bolt.setVelocity(dir.x * 320, dir.y * 320);
    this.time.delayedCall(1400, () => {
      if (bolt.active) bolt.destroy();
    });
  }

  private castSpellById(spellId: string): void {
    if (spellId === 'fagulha_arcana') {
      this.performArcaneBolt();
      return;
    }
    if (this.spellCooldownMs > 0) return;

    const check = this.manaSystem.canCast(spellId);
    if (!check.ok) {
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
      EventBus.emit('SHOW_TOAST', { message: check.reason ?? 'Não foi possível conjurar.', kind: 'error' });
      return;
    }

    if (spellId === 'pilar_telurico') {
      this.performEarthPillarSpell();
    } else if (spellId === 'mare_curativa') {
      this.performHealingTideSpell();
    } else if (spellId === 'raio_estelar') {
      this.performStarRaySpell();
    }
  }

  private performEarthPillarSpell(): void {
    if (!this.manaSystem.consumeForSpell('pilar_telurico')) return;
    this.spellCooldownMs = 420;
    const state = gameState.getState();
    this.player.playAction('cast', state.equippedWeaponId ?? undefined);
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
    this.cameras.main.shake(130, 0.005);

    const ring = this.add.circle(this.player.x, this.player.y, 18, 0xd4a373, 0.28).setStrokeStyle(3, 0xf5b942, 0.9).setDepth(3400);
    this.tweens.add({
      targets: ring,
      scale: 4.5,
      alpha: 0,
      duration: 280,
      onComplete: () => ring.destroy(),
    });

    const stats = CombatSystem.getPlayerAttackStats(state);
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= 96) {
        const dmg = calculateElementalDamage({
          basePhysical: 14,
          elementalDamage: { terra: 20, ...(stats.elementalDamage ?? {}) },
          targetResistances: enemy.stats.resistances,
        });
        this.damageEnemy(enemy, dmg.totalDamage, this.player.x, this.player.y);
      }
    }

    // Estilhaça veios de minério adjacentes em área
    if (this.collisionLayer) {
      const center = this.gridSystem.worldToTile(this.player.x, this.player.y);
      let brokenOres = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const tile = this.collisionLayer.getTileAt(center.tileX + dx, center.tileY + dy);
          if (tile && tile.index === this.activeOreGid) {
            this.collisionLayer.removeTileAt(tile.x, tile.y);
            const oreItem = Math.random() < 0.5 ? 'minerio_cobre' : 'quartzo_bruto';
            this.inventorySystem.addItem(oreItem, 2);
            brokenOres++;
          }
        }
      }
      if (brokenOres > 0) {
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        EventBus.emit('SHOW_TOAST', {
          message: `Pilar Telúrico estilhaçou ${brokenOres} veio(s) de minério!`,
          kind: 'success',
        });
      }
    }
  }

  private performHealingTideSpell(): void {
    if (!this.manaSystem.consumeForSpell('mare_curativa')) return;
    this.spellCooldownMs = 450;
    const state = gameState.getState();
    this.player.playAction('cast', state.equippedWeaponId ?? undefined);
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });

    const beforeHp = state.vitals.hp;
    state.vitals.hp = Math.min(state.vitals.maxHp, state.vitals.hp + 25);
    const healed = state.vitals.hp - beforeHp;
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });

    if (healed > 0) {
      this.showFloatingNumber(this.player.x, this.player.y - 24, `+${healed} HP`, '#4ade80');
    }

    const wave = this.add.circle(this.player.x, this.player.y, 20, 0x38bdf8, 0.22).setStrokeStyle(3, 0x7dd3fc, 0.95).setDepth(3400);
    this.tweens.add({
      targets: wave,
      scale: 5.2,
      alpha: 0,
      duration: 320,
      onComplete: () => wave.destroy(),
    });

    let cleared = 0;
    for (const projObj of this.enemyProjectiles.getChildren()) {
      const proj = projObj as Phaser.Physics.Arcade.Image;
      if (proj.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, proj.x, proj.y) <= 120) {
        proj.destroy();
        cleared++;
      }
    }
    if (cleared > 0) {
      EventBus.emit('SHOW_TOAST', {
        message: `Maré Curativa dissipou ${cleared} projétil(eis) e curou ${healed} HP!`,
        kind: 'success',
      });
    }
  }

  private performStarRaySpell(): void {
    if (!this.manaSystem.consumeForSpell('raio_estelar')) return;
    this.spellCooldownMs = 340;
    this.attackCooldownMs = 0;
    this.player.resetDashCooldown();

    const state = gameState.getState();
    this.player.playAction('cast', state.equippedWeaponId ?? undefined);
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });

    const dir = this.player.getFacingVector();
    const useWindSheet =
      this.textures.exists('combat_vfx_b_sheet') && this.anims.exists('wind_bolt_anim');
    const useVfxSheet = this.textures.exists('combat_vfx_a_sheet');
    const ray = this.playerProjectiles.create(
      this.player.x + dir.x * 16,
      this.player.y + dir.y * 16,
      useWindSheet ? 'combat_vfx_b_sheet' : useVfxSheet ? 'combat_vfx_a_sheet' : 'arcane_bolt',
      useWindSheet ? 4 : useVfxSheet ? 0 : undefined
    ) as Phaser.Physics.Arcade.Sprite;
    ray.setDepth(3550);
    ray.setTint(useWindSheet ? 0xffffff : 0xf5b942);
    ray.setScale(1.45, 0.95);
    ray.setRotation(Math.atan2(dir.y, dir.x));
    if (useWindSheet) {
      ray.play('wind_bolt_anim');
    } else if (useVfxSheet && this.anims.exists('arcane_bolt_anim')) {
      ray.play('arcane_bolt_anim');
    }
    ray.setData('hitEnemies', new Set<Enemy>());
    ray.setData('basePhysical', 10);
    ray.setData('extraElemental', { ar: 22, arcano: 10 });
    ray.setVelocity(dir.x * 460, dir.y * 460);
    this.time.delayedCall(1200, () => {
      if (ray.active) ray.destroy();
    });
  }

  private handleBossTelegraph(
    enemy: Enemy,
    tx: number,
    ty: number,
    radius: number,
    phase: 1 | 2 | 3
  ): void {
    const clampedX = Math.max(TILE_SIZE * 2, Math.min((this.physics.world.bounds.width || 640) - TILE_SIZE * 2, tx));
    const clampedY = Math.max(TILE_SIZE * 2, Math.min((this.physics.world.bounds.height || 480) - TILE_SIZE * 2, ty));
    const theme = DUNGEON_THEMES[this.dungeonId];

    const zone = this.add
      .circle(clampedX, clampedY, radius, 0xe05263, 0.16)
      .setStrokeStyle(2, 0xf87171, 0.95)
      .setDepth(3100);
    const inner = this.add.circle(clampedX, clampedY, 4, 0xf87171, 0.45).setDepth(3101);

    this.tweens.add({
      targets: inner,
      radius,
      scale: radius / 4,
      alpha: 0.18,
      duration: 720,
    });

    this.time.delayedCall(720, () => {
      if (!zone.scene) return;
      zone.destroy();
      inner.destroy();
      if (this.isExiting || !enemy.active) return;

      const burst = this.add.circle(clampedX, clampedY, radius, 0xf87171, 0.45).setDepth(3200);
      this.tweens.add({
        targets: burst,
        alpha: 0,
        scale: 1.15,
        duration: 220,
        onComplete: () => burst.destroy(),
      });

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, clampedX, clampedY);
      if (dist <= radius && !this.player.isInvulnerable()) {
        const phys = Math.round((11 + phase * 3) * enemy.damageScale);
        const elemDmg = Math.round((12 + phase * 3) * enemy.damageScale);
        this.damagePlayer(phys, { [theme.element]: elemDmg });
      }
    });
  }

  private showFloatingNumber(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        fontSize: '13px',
        color,
        fontStyle: 'bold',
        stroke: '#100e1a',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(4200);
    this.tweens.add({
      targets: label,
      y: y - 22,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.Out',
      onComplete: () => label.destroy(),
    });
  }

  private spawnEnemyProjectile(
    enemy: Enemy,
    ox: number,
    oy: number,
    tx: number,
    ty: number
  ): void {
    const theme = DUNGEON_THEMES[this.dungeonId];
    const baseAngle = Math.atan2(ty - oy, tx - ox);
    const tex = enemy.stats.boltTexture ?? theme.projectileTexture;
    const speed = enemy.stats.isBoss ? 225 : 180;

    let spreadAngles: ReadonlyArray<number> = [0];
    if (enemy.kind === 'omena') {
      const phase = enemy.getBossPhase();
      if (phase === 2) spreadAngles = [-0.2, 0.2];
      else if (phase === 3) spreadAngles = [-0.32, 0, 0.32];
    }

    for (const offset of spreadAngles) {
      const angle = baseAngle + offset;
      const useRockSheet =
        tex === 'enemy_rock_bolt' && this.textures.exists('combat_vfx_a_sheet');
      const useVfxBSheet =
        this.textures.exists('combat_vfx_b_sheet') &&
        (tex === 'water_bolt' || tex === 'wind_bolt' || tex === 'omena_bolt');
      const vfxBFrame = tex === 'water_bolt' ? 0 : tex === 'wind_bolt' ? 4 : 8;
      const vfxBAnim =
        tex === 'water_bolt' ? 'water_bolt_anim' : tex === 'wind_bolt' ? 'wind_bolt_anim' : 'omena_bolt_anim';
      const bolt = this.enemyProjectiles.create(
        ox,
        oy,
        useVfxBSheet ? 'combat_vfx_b_sheet' : useRockSheet ? 'combat_vfx_a_sheet' : tex,
        useVfxBSheet ? vfxBFrame : useRockSheet ? 8 : undefined
      ) as Phaser.Physics.Arcade.Sprite;
      bolt.setDepth(3500);
      if (useVfxBSheet && this.anims.exists(vfxBAnim)) {
        bolt.setRotation(angle);
        bolt.play(vfxBAnim);
      } else if (useRockSheet && this.anims.exists('enemy_rock_bolt_anim')) {
        bolt.play('enemy_rock_bolt_anim');
      }
      bolt.setData('element', theme.element);
      bolt.setData('physDmg', Math.round((enemy.stats.isBoss ? 10 : 5) * enemy.damageScale));
      bolt.setData('elemDmg', Math.round((enemy.stats.isBoss ? 9 : 6) * enemy.damageScale));
      bolt.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.time.delayedCall(2200, () => {
        if (bolt.active) bolt.destroy();
      });
    }
  }

  private damageEnemy(enemy: Enemy, amount: number, sourceX: number, sourceY: number): void {
    const dx = enemy.x - sourceX;
    const dy = enemy.y - sourceY;
    const len = Math.max(1, Math.hypot(dx, dy));
    const dead = enemy.takeDamage(amount, dx / len, dy / len);

    this.showFloatingNumber(
      enemy.x + (Math.random() * 10 - 5),
      enemy.y - 18,
      `-${amount}`,
      amount >= 25 ? '#fb7185' : '#fef08a'
    );
    this.cameras.main.shake(55, 0.0022);

    if (enemy.stats.isBoss) {
      this.updateBossBar(enemy);
      if (enemy.kind === 'omena' && !dead) {
        const nextPhase = enemy.getBossPhase();
        if ((nextPhase === 2 || nextPhase === 3) && nextPhase > this.omenaLastPhase) {
          this.omenaLastPhase = nextPhase;
          this.handleOmenaPhaseShift(enemy, nextPhase);
        }
      }
    }

    if (dead) {
      const wasBoss = enemy.stats.isBoss;
      const enemyKind = enemy.kind;
      enemy.playDeathAndDestroy();

      const qs = new QuestSystem(gameState.getState(), this.inventorySystem);
      qs.recordEnemyDefeated(enemyKind);
      EventBus.emit('QUESTS_UPDATED');

      if (wasBoss) {
        for (const helper of this.enemies) {
          if (helper.active && helper !== enemy) helper.playDeathAndDestroy();
        }
        this.onGuardianFreed();
      } else {
        const eliteKinds: ReadonlySet<EnemyKind> = new Set([
          'colosso_granito',
          'salamandra_abissal',
          'anomalia_magnetica',
          'executor_omena',
        ]);
        const tier2Kinds: ReadonlySet<EnemyKind> = new Set([
          'totem_condor',
          'morcego_estalactite',
          'androide_xenotecnico',
          'arauto_abismo',
        ]);
        let drop = 'pedra';
        let dropQty = 1;
        if (eliteKinds.has(enemyKind)) {
          drop = Math.random() < 0.45 ? 'liga_estelar' : 'quartzo_refinado';
          const goldDrop = this.unstableRift ? 28 : 16;
          gameState.getState().gold += goldDrop;
          EventBus.emit('GOLD_UPDATED', { gold: gameState.getState().gold });
        } else if (tier2Kinds.has(enemyKind)) {
          drop = Math.random() < 0.5 ? 'quartzo_bruto' : 'minerio_cobre';
          dropQty = this.unstableRift ? 2 : 1;
        } else {
          drop = this.unstableRift
            ? Math.random() < 0.45
              ? 'quartzo_bruto'
              : 'minerio_cobre'
            : Math.random() < 0.5
              ? 'pedra'
              : 'minerio_cobre';
        }
        this.inventorySystem.addItem(drop, dropQty);
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
      }
    }
  }

  private handleOmenaPhaseShift(boss: Enemy, phase: 2 | 3): void {
    const prefix = gameState.getState().flags.endgame_unlocked
      ? 'Eco de Omena (Endgame)'
      : 'Omena, Tecelão das Sombras';
    this.bossLabel?.setText(`${prefix} — Fase ${phase}/3`);
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });

    if (phase === 2) {
      EventBus.emit('SHOW_TOAST', {
        message: 'Omena entrou na Fase 2/3 — Rajadas Duplas Dimensionais!',
        kind: 'info',
      });
      return;
    }

    EventBus.emit('SHOW_TOAST', {
      message: 'Omena entrou na Fase 3/3 — Fúria do Núcleo e Sentinela invocada!',
      kind: 'error',
    });
    const spawnX = Math.max(TILE_SIZE * 3, Math.min(TILE_SIZE * 17, boss.x + 48));
    const spawnY = Math.max(TILE_SIZE * 3, Math.min(TILE_SIZE * 12, boss.y + 32));
    const helper = new Enemy(this, spawnX, spawnY, 'sentinela_omena');
    if (this.unstableRift) helper.applyRiftBoost(1.4, 1.35);
    if (this.collisionLayer) this.physics.add.collider(helper, this.collisionLayer);
    this.enemies.push(helper);
  }

  private damagePlayer(physical: number, elemental: Partial<Record<ElementType, number>>): void {
    const state = gameState.getState();
    const res = CombatSystem.applyDamageToPlayer(state, physical, elemental);
    this.player.grantInvulnerability(650);
    this.showFloatingNumber(this.player.x, this.player.y - 22, `-${res.finalDamage}`, '#f87171');
    this.cameras.main.shake(110, 0.0045);
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
    EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
    EventBus.emit('SHOW_TOAST', { message: `-${res.finalDamage} HP!`, kind: 'error' });

    if (res.fainted) {
      this.handleCozyFaint();
    }
  }

  private handleCozyFaint(): void {
    if (this.isExiting) return;
    this.isExiting = true;

    const state = gameState.getState();
    const dayFinished = state.time.day;
    const seasonFinished = state.time.season;

    CombatSystem.applyCozyFaintPenalty(state);
    const { totalGold, itemsSold } = this.inventorySystem.settleShippingBin();
    const nextTime = new TimeSystem(state.time).advanceDay();
    const farming = new FarmingSystem(state, this.gridSystem, this.inventorySystem);
    const { cropsGrown, cropsReady } = farming.processEndOfDay(nextTime.weather);
    const animals = new AnimalSystem(state, this.inventorySystem);
    const { hatchedCount } = animals.processEndOfDay(animals.getAbsoluteDay());

    state.mapId = 'casa';
    state.playerX = 3 * TILE_SIZE + TILE_SIZE / 2;
    state.playerY = 3 * TILE_SIZE + TILE_SIZE / 2;

    this.scene.start('DaySummaryScene', {
      dayFinished,
      season: seasonFinished,
      itemsSold,
      goldEarned: totalGold,
      cropsGrown,
      cropsReady,
      hatchedMiniDragons: hatchedCount,
      reason: 'fainted',
    });
  }

  private handleDungeonInteract(): void {
    const feet = this.player.getFeetWorldPosition();
    const target = this.gridSystem.getTargetTile(feet.x, feet.y, this.player.facing);

    // Puzzle harmônico dos 3 cristais na Chapada dos Veadeiros
    if (this.floorLayout?.requiresCrystalPuzzle) {
      for (const node of this.floorLayout.crystalNodes) {
        const center = this.gridSystem.tileToWorldCenter(node.tileX, node.tileY);
        if (Phaser.Math.Distance.Between(feet.x, feet.y, center.x, center.y) <= 44) {
          this.activateCrystalNode(node.order);
          return;
        }
      }
    }

    // Baús de suprimentos nos andares procedurais
    for (const chest of this.chestNodes) {
      if (chest.opened) continue;
      const center = this.gridSystem.tileToWorldCenter(chest.tileX, chest.tileY);
      if (Phaser.Math.Distance.Between(feet.x, feet.y, center.x, center.y) <= 44) {
        chest.opened = true;
        if (chest.visual instanceof Phaser.GameObjects.Sprite) {
          if (chest.visual.texture.key === 'dungeon_sanctuary_elevator_v4_sheet') {
            chest.visual.setFrame(7);
          } else if (this.anims.exists('dungeon_chest_open_anim')) {
            chest.visual.play('dungeon_chest_open_anim');
          }
        } else if (chest.visual instanceof Phaser.GameObjects.Rectangle) {
          chest.visual.setFillStyle(0x3f2e22, 0.7).setStrokeStyle(1, 0x78716c, 0.8);
        }
        chest.label.setText('Baú (Vazio)').setColor('#94a3b8');
        const state = gameState.getState();
        const bonusGold = (25 + this.floor * 10) * (this.unstableRift ? 2 : 1);
        state.gold += bonusGold;
        const lootPool = this.unstableRift
          ? ['quartzo_refinado', 'pocao_mana_menor', 'liga_estelar']
          : ['pocao_mana_menor', 'pocao_energia_menor', 'quartzo_bruto', 'minerio_cobre'];
        const lootId = lootPool[Math.floor(Math.random() * lootPool.length)] ?? 'pocao_mana_menor';
        const lootDef = getItemDef(lootId);
        this.inventorySystem.addItem(lootId, 1);
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
        EventBus.emit('GOLD_UPDATED', { gold: state.gold });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        EventBus.emit('SHOW_TOAST', {
          message: `Baú aberto! +${bonusGold} G e 1x ${lootDef?.name ?? lootId}!`,
          kind: 'success',
        });
        return;
      }
    }

    // Estelas / Totens de Lore
    for (const lore of this.loreNodes) {
      const center = this.gridSystem.tileToWorldCenter(lore.tileX, lore.tileY);
      if (Phaser.Math.Distance.Between(feet.x, feet.y, center.x, center.y) <= 44) {
        const state = gameState.getState();
        const qs = new QuestSystem(state, this.inventorySystem);
        const firstRead = qs.recordLoreRead(lore.loreId);
        lore.read = true;
        if (lore.visual instanceof Phaser.GameObjects.Rectangle) {
          lore.visual.setFillStyle(0x334155, 0.96).setStrokeStyle(2, 0x64748b, 1);
        } else {
          if (lore.visual instanceof Phaser.GameObjects.Sprite) lore.visual.stop();
          lore.visual.setTint(0x94a3b8);
        }
        lore.label.setText('Estela (Lida)').setColor('#94a3b8');
        if (firstRead) {
          this.manaSystem.restoreMana(15);
          state.vitals.stamina = Math.min(state.vitals.maxStamina, state.vitals.stamina + 10);
          EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
        }
        const FLOOR_LORE: Record<DungeonId, readonly string[]> = {
          machu_picchu: [
            'Andar 1 — "Os primeiros degraus de granito ainda guardam o calor dos antigos observatórios solares."',
            'Andar 2 — "Quando o solo adormece sob aço frio, somente o Pilar Telúrico devolve o pulso às raízes do mundo."',
            'Andar 3 — "Escaravelhos dourados poliam os condutos subterrâneos para que a seiva de Quartzo fluísse até Minas Gerais."',
            'Andar 4 — "Sob os terraços ocultos, descobrimos que Machu Picchu e São Tomé dos Números repousam sobre a mesma veia telúrica."',
            'Andar 5 (Santuário) — "Neste altar intermediário, os peregrinos agradeciam às pedras antes de descerem às câmaras solares."',
            'Andar 6 — "Os Totens do Condor cantavam para acordar sementes antigas durante os invernos mais rigorosos."',
            'Andar 7 — "Quando Omena tocou a fenda da Terra, até os colossos de obsidiana perderam o sono tranquilo."',
            'Andar 8 — "Lupin escreveu aqui à margem: as pedras não guardam rancor, apenas aguardam mãos pacientes que plantem de novo."',
            'Andar 9 — "A poucos passos do altar, o pulsar do Guardião da Terra já aquece o pó de quartzo sob suas botas."',
            'Andar 10 (Ante-Câmara) — "Respire fundo na última fonte sagrada: além destas escadas aguarda o espírito milenar da montanha."',
          ],
          chapada: [
            'Andar 1 — "A água que brota nestas grutas traz consigo a memória da chuva que rega a Fazenda da Névoa."',
            'Andar 2 — "As águas da Chapada cantam em três tons; quem purifica a correnteza encontra a Maré Curativa."',
            'Andar 3 — "Limoches de quartzo rosa nascem onde gotas de neblina repousam por séculos sobre cristais puros."',
            'Andar 4 — "Os antigos guardiões da Chapada trocavam sementes de Lúpulo Estelar com os camponeses da Serra da Mantiqueira."',
            'Andar 5 (Santuário) — "Lago Silencioso: aqui os viajantes descansavam os pés e afinavam seus frascos na fonte límpida."',
            'Andar 6 — "Morcegos de ametista enxergam pelo eco das notas musicais que você desperta nos pilares 1, 2 e 3."',
            'Andar 7 — "Mais fundo que a luz do dia, salamandras de diamante protegem os desvios da corrente subterrânea."',
            'Andar 8 — "Quando a névoa de Omena congelou os poços, as plantações da superfície começaram a perder o brilho."',
            'Andar 9 — "Ouça a melodia crescente: cada cristal afinado abre o caminho até o lago central do Guardião."',
            'Andar 10 (Ante-Câmara) — "As águas puras deste santuário preparam o seu espírito para harmonizar o Guardião das Águas."',
          ],
          varginha: [
            'Andar 1 — "Frequências metálicas zumbem nas paredes: esta não é uma caverna comum, mas um posto de escuta estelar."',
            'Andar 2 — "Além das frequências de Omena, o Raio Estelar rasga a tempestade e renova o passo do guardião."',
            'Andar 3 — "Drones cinzentos foram programados originalmente para mapear chuvas e rotas migratórias sobre o sul de Minas."',
            'Andar 4 — "Registros de Lyra indicam que um farol caído nos arredores de Varginha alimentava a bruma protetora da vila."',
            'Andar 5 (Santuário) — "Módulo de Repouso: uma câmara estabilizada onde o vento estelar acalma a fadiga do viajante."',
            'Andar 6 — "Autômatos xenotécnicos ainda patrulham os corredores repetindo sinais de socorro de séculos atrás."',
            'Andar 7 — "Anomalias eletromagnéticas distorcem a bússola, mas nunca enganam quem segue a luz serena de Lupin."',
            'Andar 8 — "Os arquivos revelam que Omena não invadiu de fora: ele temia perder este mundo perfeito no tempo."',
            'Andar 9 — "Relâmpagos silenciosos riscam o teto de quartzo — o Núcleo da Tempestade Eterna está logo adiante."',
            'Andar 10 (Ante-Câmara) — "Última estação antes da cúpula dos ventos. Recarregue sua mana e siga com coragem."',
          ],
          fortaleza_omena: [
            'Andar 1 — "Página do Diário de Omena: Eles chamam de preservação estática o que eu chamo de paz eterna... mas o Núcleo resiste."',
            'Andar 2 — "Aqui, o próprio tempo foi tecido em fios de quartzo escuro para que nenhuma estação jamais passasse."',
            'Andar 3 — "Sombras errantes são fragmentos de sonhos antigos que Omena tentou guardar em vidros imóveis."',
            'Andar 4 — "Mas um jardim sem estações não floresce, e uma vila sem manhãs não colhe o pão de cada dia."',
            'Andar 5 (Santuário) — "Mesmo na fortaleza de Omena, brota uma centelha da Fonte de São Tomé lembrando-o do lar."',
            'Andar 6 — "Arautos carmesins guardam as páginas perdidas do grimório que Lupin confiou ao primeiro Protetor."',
            'Andar 7 — "O seu cajado ressoa com as três bênçãos — Terra, Águas e Céus — respondendo em uníssono."',
            'Andar 8 — "Executores reais protegem os anéis internos; cada vitória aqui fortalece a colheita em São Tomé."',
            'Andar 9 — "A bruma pesada se abre. Omena espera onde todas as linhas ley convergem sob o Núcleo do Mundo."',
            'Andar 10 (Ante-Câmara) — "Última estela antes do Trono de Omena. Mostre que a mudança e o cuidado vencem a estagnação!"',
          ],
        };
        const floorIndex = Math.max(0, Math.min(9, this.floor - 1));
        const loreLine = FLOOR_LORE[this.dungeonId][floorIndex] ?? FLOOR_LORE[this.dungeonId][0]!;
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
        EventBus.emit('QUESTS_UPDATED');
        EventBus.emit('OPEN_DIALOGUE', {
          speaker: 'Estela Antiga',
          title: `${DUNGEON_THEMES[this.dungeonId].dungeonTitle} — Andar ${this.floor}/${TOTAL_PROCEDURAL_FLOORS}`,
          portraitColor: '#7e8ce0',
          lines: [
            loreLine,
            firstRead
              ? 'Ao decifrar o glifo pela primeira vez, você recupera +15 Mana e +10 Stamina!'
              : 'Você já registrou esta inscrição no seu Compêndio Arcano.',
          ],
        });
        return;
      }
    }

    // Fontes da Vida / Mana
    for (const fount of this.fountainNodes) {
      if (fount.used) continue;
      const center = this.gridSystem.tileToWorldCenter(fount.tileX, fount.tileY);
      if (Phaser.Math.Distance.Between(feet.x, feet.y, center.x, center.y) <= 44) {
        fount.used = true;
        if (fount.visual instanceof Phaser.GameObjects.Ellipse) {
          fount.visual.setFillStyle(0x334155, 0.45).setStrokeStyle(1, 0x64748b, 0.7);
        } else if (fount.visual.texture.key === 'dungeon_sanctuary_elevator_v4_sheet') {
          fount.visual.setFrame(5).clearTint().setAlpha(0.9);
        } else {
          fount.visual.stop();
          fount.visual.setTint(0x64748b).setAlpha(0.55);
        }
        fount.label.setText('Fonte (Seca)').setColor('#94a3b8');
        const state = gameState.getState();
        state.vitals.hp = Math.min(state.vitals.maxHp, state.vitals.hp + 35);
        this.manaSystem.restoreMana(20);
        this.showFloatingNumber(this.player.x, this.player.y - 24, '+35 HP / +20 Mana', '#4ade80');
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
        EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
        EventBus.emit('SHOW_TOAST', {
          message: 'Fonte da Vida purificou suas forças (+35 HP, +20 Mana)!',
          kind: 'success',
        });
        return;
      }
    }

    // Mineração de veios de minério com múltiplos golpes
    const colTile = this.collisionLayer?.getTileAt(target.tileX, target.tileY);
    if (colTile && colTile.index === this.activeOreGid) {
      if (this.player.isActionLocked()) return;
      const state = gameState.getState();
      if (state.vitals.stamina < 2) {
        EventBus.emit('SHOW_TOAST', { message: 'Stamina insuficiente para minerar!', kind: 'error' });
        return;
      }
      state.vitals.stamina -= 2;
      this.player.playAction('swing', 'picareta_simples');
      EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });

      const oreKey = `${this.floor}_${target.tileX}_${target.tileY}`;
      const baseHp = 3 - (state.flags.tools_upgraded_bento ? 1 : 0);
      const currentHp = this.oreHpMap.get(oreKey) ?? Math.max(1, baseHp);
      const nextHp = currentHp - 1;
      const oreCenter = this.gridSystem.tileToWorldCenter(target.tileX, target.tileY);

      if (nextHp > 0) {
        this.oreHpMap.set(oreKey, nextHp);
        this.showFloatingNumber(oreCenter.x, oreCenter.y - 12, '⛏️', '#fbbf24');
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
        return;
      }

      this.oreHpMap.delete(oreKey);
      this.collisionLayer?.removeTileAt(target.tileX, target.tileY);
      const oreItem = Math.random() < 0.55 ? 'minerio_cobre' : 'quartzo_bruto';
      const yieldQty = state.flags.tools_upgraded_bento ? 3 : 2;
      this.inventorySystem.addItem(oreItem, yieldQty);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'craft' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      EventBus.emit('SHOW_TOAST', {
        message: `Minerou ${yieldQty}x ${oreItem === 'minerio_cobre' ? 'Minério de Cobre' : 'Quartzo Bruto'}!`,
        kind: 'success',
      });
      return;
    }

    // Descida ao próximo andar com [E] perto da escadaria
    if (this.floorLayout) {
      const exitCenter = this.gridSystem.tileToWorldCenter(
        this.floorLayout.exitTile.tileX,
        this.floorLayout.exitTile.tileY
      );
      if (Phaser.Math.Distance.Between(feet.x, feet.y, exitCenter.x, exitCenter.y) <= 42) {
        this.descendNextFloor();
        return;
      }
    }

    // Portal de retorno da arena do Guardião ao pressionar [E]
    if (this.isBossFloor) {
      const bossAlive = this.enemies.some((e) => e.active && !e.isDying);
      if (!bossAlive) {
        const margin = 20;
        for (const portal of this.bossPortals) {
          const nearPortal =
            feet.x >= portal.x - margin &&
            feet.x <= portal.x + portal.width + margin &&
            feet.y >= portal.y - margin &&
            feet.y <= portal.y + portal.height + margin;
          if (nearPortal) {
            this.isExiting = true;
            this.dungeonPromptText?.setVisible(false);
            EventBus.emit('AUDIO_PLAY_SFX', { kind: 'portal' });
            this.scene.start('WorldScene', {
              mapId: portal.targetMap,
              spawnTileX: portal.targetTileX,
              spawnTileY: portal.targetTileY,
            });
            return;
          }
        }
      }
    }

    // Caso contrário, usa consumível ou equipa/usa cajado ou roupa selecionada na Hotbar
    const selected = this.inventorySystem.getSelectedSlot();
    if (selected) {
      const def = getItemDef(selected.itemId);
      if (
        def &&
        (def.category === 'consumable' ||
          def.category === 'crop' ||
          def.category === 'weapon' ||
          def.category === 'armor')
      ) {
        this.useInventorySlot(gameState.getState().selectedHotbarIndex);
      }
    }
  }

  private activateCrystalNode(order: 1 | 2 | 3): void {
    if (!this.floorLayout) return;
    if (order <= this.crystalPuzzleStep) {
      EventBus.emit('SHOW_TOAST', { message: `Cristal ${order} já harmonizado.`, kind: 'info' });
      return;
    }

    if (order === this.crystalPuzzleStep + 1) {
      this.crystalPuzzleStep = order;
      const visual = this.crystalNodesVisuals.get(order);
      if (visual) {
        if (this.textures.exists('crystal_pillars_sheet')) {
          visual.sprite.setTexture('crystal_pillars_sheet', 3);
          if (
            visual.sprite instanceof Phaser.GameObjects.Sprite &&
            this.anims.exists('crystal_pillar_pulse')
          ) {
            visual.sprite.play('crystal_pillar_pulse');
          }
        } else {
          visual.sprite.setTexture('crystal_pillar_active');
        }
        visual.badge.setColor('#fef08a');
      }
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });

      if (this.crystalPuzzleStep >= this.floorLayout.crystalNodes.length) {
        this.stairsLockMarker?.destroy();
        this.stairsLockMarker = null;
        EventBus.emit('SHOW_TOAST', {
          message: 'Harmonia completa (1 → 2 → 3)! A escadaria para o próximo andar abriu!',
          kind: 'success',
        });
      } else {
        EventBus.emit('SHOW_TOAST', {
          message: `Cristal ${order}/3 harmonizado! Procure o Cristal ${order + 1}.`,
          kind: 'success',
        });
      }
      return;
    }

    // Ordem errada reseta a sequência
    this.crystalPuzzleStep = 0;
    for (const [nodeOrder, visual] of this.crystalNodesVisuals.entries()) {
      if (this.textures.exists('crystal_pillars_sheet')) {
        if (visual.sprite instanceof Phaser.GameObjects.Sprite) {
          visual.sprite.stop();
        }
        visual.sprite.setTexture('crystal_pillars_sheet', nodeOrder - 1);
      } else {
        visual.sprite.setTexture(`crystal_pillar_${nodeOrder}`);
      }
      visual.badge.setColor('#e0f2fe');
    }
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
    EventBus.emit('SHOW_TOAST', {
      message: 'Ordem incorreta! Ressonância quebrada — ative na ordem 1 → 2 → 3.',
      kind: 'error',
    });
  }

  private areStairsLocked(): boolean {
    if (!this.floorLayout?.requiresCrystalPuzzle) return false;
    return this.crystalPuzzleStep < this.floorLayout.crystalNodes.length;
  }

  private checkFloorHazardsAndPortals(): void {
    const feet = this.player.getFeetWorldPosition();
    const tile = this.gridSystem.worldToTile(feet.x, feet.y);
    const theme = DUNGEON_THEMES[this.dungeonId];

    if (this.groundLayer) {
      const gTile = this.groundLayer.getTileAt(tile.tileX, tile.tileY);
      if (gTile && gTile.index === this.activeTrapGid && this.trapCooldownMs === 0 && !this.player.isInvulnerable()) {
        this.trapCooldownMs = 900;
        this.damagePlayer(8, { [theme.element]: 5 });
        return;
      }
    }

    if (this.dungeonPromptText) {
      let promptLabel = '';
      let px = 0;
      let py = 0;

      if (this.floorLayout) {
        const exitCenter = this.gridSystem.tileToWorldCenter(
          this.floorLayout.exitTile.tileX,
          this.floorLayout.exitTile.tileY
        );
        if (Phaser.Math.Distance.Between(feet.x, feet.y, exitCenter.x, exitCenter.y) <= 42) {
          promptLabel = this.areStairsLocked()
            ? 'Escadaria selada (harmonize os 3 cristais)'
            : '[E] Descer próximo andar';
          px = exitCenter.x;
          py = exitCenter.y - 24;
        }
      }

      if (!promptLabel && this.isBossFloor && !this.enemies.some((e) => e.active)) {
        const margin = 20;
        for (const portal of this.bossPortals) {
          const nearPortal =
            feet.x >= portal.x - margin &&
            feet.x <= portal.x + portal.width + margin &&
            feet.y >= portal.y - margin &&
            feet.y <= portal.y + portal.height + margin;
          if (nearPortal) {
            promptLabel = `[E] ${portal.label}`;
            px = portal.x + portal.width / 2;
            py = portal.y - 16;
            break;
          }
        }
      }

      if (promptLabel) {
        this.dungeonPromptText.setText(promptLabel).setPosition(px, py).setVisible(true);
      } else {
        this.dungeonPromptText.setVisible(false);
      }
    }
  }

  private descendNextFloor(): void {
    if (this.isExiting) return;
    if (this.areStairsLocked()) {
      EventBus.emit('SHOW_TOAST', {
        message: 'Harmonize os 3 cristais (1 → 2 → 3) antes de descer!',
        kind: 'error',
      });
      return;
    }
    this.isExiting = true;
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'portal' });
    this.cameras.main.fadeOut(200, 20, 18, 29);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({
        dungeonId: this.dungeonId,
        floor: this.floor + 1,
        seed: this.seed,
        unstableRift: this.unstableRift,
      });
    });
  }

  private onGuardianFreed(): void {
    this.bossBarBg?.destroy();
    this.bossBarFill?.destroy();
    this.bossLabel?.destroy();

    const theme = DUNGEON_THEMES[this.dungeonId];
    const state = gameState.getState();
    const alreadyBlessed = Boolean(state.flags[theme.blessedFlag]);
    state.flags[theme.blessedFlag] = true;

    let unlockedSpellMsg = '';
    if (this.dungeonId === 'machu_picchu' && this.manaSystem.unlockSpell('pilar_telurico')) {
      unlockedSpellMsg = 'Nova magia desbloqueada: [R] Pilar Telúrico!';
    } else if (this.dungeonId === 'chapada' && this.manaSystem.unlockSpell('mare_curativa')) {
      unlockedSpellMsg = 'Nova magia desbloqueada: [F] Maré Curativa!';
    } else if (this.dungeonId === 'varginha') {
      if (!alreadyBlessed) {
        state.vitals.maxMana += 20;
        state.vitals.mana = Math.min(state.vitals.maxMana, state.vitals.mana + 20);
        EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
      }
      if (this.manaSystem.unlockSpell('raio_estelar')) {
        unlockedSpellMsg = 'Nova magia desbloqueada: [V] Raio Estelar!';
      }
    }

    if (this.unstableRift) {
      state.gold += 80;
      this.inventorySystem.addItem('liga_estelar', 1);
    }

    if (this.dungeonId === 'fortaleza_omena') {
      state.flags.endgame_unlocked = true;
      state.flags.act3_completed = true;
    }

    const qs = new QuestSystem(state, this.inventorySystem);
    qs.evaluateMainCampaign();
    EventBus.emit('GOLD_UPDATED', { gold: state.gold });
    EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
    EventBus.emit('QUESTS_UPDATED');

    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });

    const lines = unlockedSpellMsg ? [...theme.freedLines, unlockedSpellMsg] : theme.freedLines;
    EventBus.emit('OPEN_DIALOGUE', {
      speaker: theme.freedSpeaker,
      title: theme.freedTitle,
      portraitColor: theme.freedColor,
      lines,
      onComplete: () => {
        EventBus.emit('SHOW_TOAST', {
          message: this.unstableRift
            ? `${theme.freedToast} Bônus da Fenda Instável: +80 G e 1x Liga Estelar!`
            : unlockedSpellMsg
              ? `${theme.freedToast} ${unlockedSpellMsg}`
              : theme.freedToast,
          kind: 'success',
        });
      },
    });
  }

  private createVarginhaStormEffect(): void {
    const cam = this.cameras.main;
    const width = this.physics.world.bounds.width || cam.width;
    const height = this.physics.world.bounds.height || cam.height;
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x312e81, 0.14)
      .setDepth(3900);

    for (let i = 0; i < 28; i++) {
      const streak = this.add
        .rectangle(
          Math.random() * width,
          Math.random() * height,
          12 + Math.random() * 14,
          2,
          0x818cf8,
          0.42
        )
        .setDepth(3950);
      streak.setRotation(-0.28);
      this.stormParticles.push(streak);
    }
  }

  private updateVarginhaStormEffect(deltaMs: number): void {
    const width = this.physics.world.bounds.width || 800;
    const height = this.physics.world.bounds.height || 600;
    const dt = deltaMs / 1000;
    for (const p of this.stormParticles) {
      p.x -= 190 * dt;
      p.y += 55 * dt;
      if (p.x < -20) p.x = width + 10;
      if (p.y > height + 10) p.y = -10;
    }
  }
}

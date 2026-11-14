import Phaser from 'phaser';
import { CAMERA_ZOOM, TILE_SIZE } from '../config/gameConfig';
import {
  COMPANION_FRAMES,
  CREATURES_FIRE_FRAMES,
  INTERIOR_FRAMES,
  MODULAR_BUILDING_FRAMES,
  NATURE_EXTENDED_FRAMES,
  NPC_ACTIVITY_ROWS,
  OMENA_PROPS_FRAMES,
  PETS_EXTENDED_FRAMES,
} from '../config/spriteSheets';
import { EventBus, type DialogueTurn } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getTiledProperty, type PortalTrigger } from '../core/TiledTypes';
import { getCropDef } from '../data/crops';
import { getItemDef } from '../data/items';
import {
  getFloorPulseTurns,
  getIntroArrivalTurns,
  getLupinAwakeningTurns,
  getOmenaUltimatumAct2Turns,
  getOmenaVisionAct1Turns,
  getSolsticeFestivalTurns,
  getTrapdoorConspiracyTurns,
} from '../data/storyScenes';
import { NPC } from '../entities/NPC';
import type { DungeonId } from '../systems/DungeonGenerator';
import { Player } from '../entities/Player';
import { AnimalSystem } from '../systems/AnimalSystem';
import { audioSystem } from '../systems/AudioSystem';
import { CraftingSystem } from '../systems/CraftingSystem';
import { DayNightSystem } from '../systems/DayNightSystem';
import { FarmingSystem } from '../systems/FarmingSystem';
import { GridSystem, makeTileKey } from '../systems/GridSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { ManaSystem } from '../systems/ManaSystem';
import { NPCSystem } from '../systems/NPCSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { TimeSystem } from '../systems/TimeSystem';

export interface WorldSceneData {
  mapId?: string;
  spawnTileX?: number;
  spawnTileY?: number;
}

const MAP_LABELS: Record<string, string> = {
  fazenda: 'Fazenda da Névoa',
  casa: 'Interior da Casa',
  porao: 'Porão do Antigo Protetor',
  cidade: 'Praça de São Tomé dos Números',
  ferraria: 'Ferraria do Bento',
  botica: 'Botica da Celeste',
  pub_pedra: 'Pub de Pedra da Ísis',
};

const WAYPOINT_SPAWNS: Record<string, { tileX: number; tileY: number }> = {
  fazenda: { tileX: 28, tileY: 9 },
  casa: { tileX: 7, tileY: 9 },
  porao: { tileX: 7, tileY: 11 },
  cidade: { tileX: 14, tileY: 11 },
};

const RAFAEL_CAMERA_TILE = { tileX: 57, tileY: 25 };

interface DiaryFragmentSpot {
  flag: 'diary_frag_cidade_found' | 'diary_frag_porao_found' | 'diary_frag_fazenda_found';
  mapId: string;
  tileX: number;
  tileY: number;
  desc: string;
}

const DIARY_FRAGMENT_SPOTS: ReadonlyArray<DiaryFragmentSpot> = [
  { flag: 'diary_frag_cidade_found', mapId: 'cidade', tileX: 25, tileY: 16, desc: 'na Praça de São Tomé' },
  { flag: 'diary_frag_porao_found', mapId: 'porao', tileX: 3, tileY: 10, desc: 'no canto sul do Porão' },
  { flag: 'diary_frag_fazenda_found', mapId: 'fazenda', tileX: 23, tileY: 41, desc: 'na clareira sul da Fazenda' },
];

interface PoraoPortalConfig {
  tileX: number;
  tileY: number;
  dungeonId: DungeonId;
  label: string;
  repairedFlag: 'portal_terra_repaired' | 'portal_aguas_repaired' | 'portal_ceus_repaired';
  prereqFlag?: 'earth_guardian_blessed' | 'talked_lyra_varginha';
  prereqMsg?: string;
  cost: ReadonlyArray<{ itemId: string; qty: number; label: string }>;
}

const PORAO_PORTALS: ReadonlyArray<PoraoPortalConfig> = [
  {
    tileX: 3,
    tileY: 2,
    dungeonId: 'machu_picchu',
    label: 'Portal da Terra (Machu Picchu)',
    repairedFlag: 'portal_terra_repaired',
    cost: [
      { itemId: 'pedra', qty: 5, label: '5 Pedras' },
      { itemId: 'madeira', qty: 5, label: '5 Madeiras' },
      { itemId: 'prego', qty: 2, label: '2 Pregos' },
    ],
  },
  {
    tileX: 7,
    tileY: 2,
    dungeonId: 'chapada',
    label: 'Portal das Águas (Chapada dos Veadeiros)',
    repairedFlag: 'portal_aguas_repaired',
    prereqFlag: 'earth_guardian_blessed',
    prereqMsg: 'Liberte primeiro o Guardião da Terra em Machu Picchu para estabilizar este portal.',
    cost: [
      { itemId: 'leite_unicornio', qty: 3, label: '3x Leite de Unicórnio' },
      { itemId: 'madeira', qty: 8, label: '8x Madeira' },
      { itemId: 'pedra', qty: 8, label: '8x Pedra' },
    ],
  },
  {
    tileX: 12,
    tileY: 2,
    dungeonId: 'varginha',
    label: 'Portal dos Céus (Varginha)',
    repairedFlag: 'portal_ceus_repaired',
    prereqFlag: 'talked_lyra_varginha',
    prereqMsg: 'Converse com Lyra em São Tomé ou no Pub para sintonizar a frequência de Varginha.',
    cost: [
      { itemId: 'liga_estelar', qty: 2, label: '2x Liga Estelar' },
      { itemId: 'quartzo_refinado', qty: 3, label: '3x Quartzo Refinado' },
      { itemId: 'leite_unicornio', qty: 2, label: '2x Leite de Unicórnio' },
    ],
  },
];

export class WorldScene extends Phaser.Scene {
  private mapId = 'fazenda';
  private map!: Phaser.Tilemaps.Tilemap;
  private chaoLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private decoracaoLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private colisoesLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private player!: Player;
  private gridSystem!: GridSystem;
  private timeSystem!: TimeSystem;
  private dayNightSystem!: DayNightSystem;
  private inventorySystem!: InventorySystem;
  private farmingSystem!: FarmingSystem;
  private manaSystem!: ManaSystem;
  private animalSystem!: AnimalSystem;
  private craftingSystem!: CraftingSystem;
  private npcSystem!: NPCSystem;
  private questSystem!: QuestSystem;

  private tileCursor!: Phaser.GameObjects.Image;
  private portalPromptText: Phaser.GameObjects.Text | null = null;
  private placedColliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private dynamicTileSprites = new Map<string, Phaser.GameObjects.GameObject[]>();
  private petSprites: (Phaser.GameObjects.Image | Phaser.GameObjects.Sprite)[] = [];
  private unicornSprites: Array<{
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    unicornId: string;
    tileX: number;
    tileY: number;
  }> = [];
  private npcSprites: NPC[] = [];
  private remoSprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | null = null;
  private lupinSprite: Phaser.GameObjects.Sprite | null = null;
  private basementEggSprites: Phaser.GameObjects.Image[] = [];
  private cameraGlintSprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | null = null;
  private diaryFragmentSprites: Array<{
    flag: DiaryFragmentSpot['flag'];
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  }> = [];
  private omenaPortalSprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | null = null;
  private treeOverlaySprites = new Map<string, Phaser.GameObjects.Image>();
  private boulderOverlaySprites = new Map<string, Phaser.GameObjects.Image>();
  private treeHpMap = new Map<string, number>();
  private rockHpMap = new Map<string, number>();
  private forgeReadyMarkers = new Map<string, Phaser.GameObjects.Text>();
  private forgeUiAccumMs = 0;
  private dragonForgeFireAccumMs = 0;
  private timeVisualSprites: Array<{
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    dayFrame: number;
    nightFrame: number;
  }> = [];
  private wildlifeSprites: Phaser.GameObjects.Sprite[] = [];
  private wildlifeIsNight = false;
  private rainSplashAccumMs = 0;
  private npcActivityCheckMs = 0;

  private interactKey: Phaser.Input.Keyboard.Key | null = null;
  private giftKey: Phaser.Input.Keyboard.Key | null = null;
  private spellKey: Phaser.Input.Keyboard.Key | null = null;
  private invKey: Phaser.Input.Keyboard.Key | null = null;
  private craftKey: Phaser.Input.Keyboard.Key | null = null;
  private questKey: Phaser.Input.Keyboard.Key | null = null;
  private tpKey: Phaser.Input.Keyboard.Key | null = null;
  private hotbarKeys: Phaser.Input.Keyboard.Key[] = [];

  private portals: PortalTrigger[] = [];
  private isTransitioning = false;
  private isDialogueOpen = false;
  private portalCooldownMs = 450;
  private dialogueCooldownMs = 0;
  private spellCooldownMs = 0;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(data?: WorldSceneData): void {
    this.isTransitioning = false;
    this.isDialogueOpen = false;
    this.portalCooldownMs = 450;
    this.dialogueCooldownMs = 0;
    this.portals = [];
    this.portalPromptText = null;
    this.placedColliders = this.physics.add.staticGroup();
    this.dynamicTileSprites.clear();
    this.petSprites = [];
    this.unicornSprites = [];
    this.npcSprites = [];
    this.remoSprite = null;
    this.lupinSprite = null;
    this.basementEggSprites = [];
    this.cameraGlintSprite = null;
    this.diaryFragmentSprites = [];
    this.omenaPortalSprite = null;
    this.treeOverlaySprites.clear();
    this.boulderOverlaySprites.clear();
    this.treeHpMap.clear();
    this.rockHpMap.clear();
    this.forgeReadyMarkers.forEach((m) => m.destroy());
    this.forgeReadyMarkers.clear();
    this.forgeUiAccumMs = 0;
    this.dragonForgeFireAccumMs = 0;
    this.timeVisualSprites = [];
    this.wildlifeSprites = [];
    this.wildlifeIsNight = false;
    this.rainSplashAccumMs = 0;
    this.npcActivityCheckMs = 0;

    const state = gameState.getState();
    this.mapId = data?.mapId ?? state.mapId ?? 'fazenda';
    state.mapId = this.mapId;

    if (WAYPOINT_SPAWNS[this.mapId] && !state.discoveredWaypoints.includes(this.mapId)) {
      state.discoveredWaypoints.push(this.mapId);
    }

    this.gridSystem = new GridSystem(state.tiles);
    this.timeSystem = new TimeSystem(state.time);
    this.inventorySystem = new InventorySystem(state);
    this.farmingSystem = new FarmingSystem(state, this.gridSystem, this.inventorySystem);
    this.manaSystem = new ManaSystem(state);
    this.animalSystem = new AnimalSystem(state, this.inventorySystem);
    this.craftingSystem = new CraftingSystem(state, this.inventorySystem);
    this.npcSystem = new NPCSystem(state, this.inventorySystem);
    this.questSystem = new QuestSystem(state, this.inventorySystem);

    if (state.flags.ato1_completed && this.questSystem.getStatus('2.1_fumaca_na_cerca') === 'locked') {
      this.questSystem.activateQuest('2.1_fumaca_na_cerca');
    }
    if (state.flags.act2_completed && this.questSystem.getStatus('3.1_paginas_faltantes') === 'locked') {
      this.questSystem.activateQuest('3.1_paginas_faltantes');
    }

    this.map = this.make.tilemap({ key: this.mapId });
    const tileset = this.map.addTilesetImage('sao_tome_tileset', 'sao_tome_tileset');
    if (!tileset) {
      throw new Error(`Tileset 'sao_tome_tileset' não encontrado no mapa '${this.mapId}'.`);
    }

    this.chaoLayer = this.map.createLayer('Chao', tileset, 0, 0);
    this.decoracaoLayer = this.map.createLayer('Decoracao', tileset, 0, 0);
    this.colisoesLayer = this.map.createLayer('Colisoes', tileset, 0, 0);

    this.chaoLayer?.setDepth(0);
    this.decoracaoLayer?.setDepth(1);
    this.colisoesLayer?.setDepth(2);
    this.refreshForgeBenchMarkers();

    if (this.colisoesLayer) {
      this.colisoesLayer.setCollisionByExclusion([-1, 0]);
    }

    const spawnPos = this.resolveSpawnPosition(this.map, data);
    this.player = new Player(this, spawnPos.x, spawnPos.y);
    this.player.syncEquipmentVisuals(state.equippedWeaponId, state.equippedArmorId);
    state.playerX = spawnPos.x;
    state.playerY = spawnPos.y;

    if (this.colisoesLayer) {
      this.physics.add.collider(this.player, this.colisoesLayer);
    }
    if (this.placedColliders) {
      this.physics.add.collider(this.player, this.placedColliders);
    }

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);

    this.dayNightSystem = new DayNightSystem(this);
    this.dayNightSystem.updateLighting(this.mapId, state.time.minuteOfDay, state.time.weather);

    this.tileCursor = this.add.image(0, 0, 'tile_cursor').setDepth(5000).setAlpha(0.85);
    this.portalPromptText = this.add
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

    this.renderDynamicMapTiles();
    this.renderModularWorldOverlays();
    this.renderCompanionsAndPets();
    this.renderMapNpcs();
    this.spawnAmbientFireflies();
    this.loadPortals(this.map);
    this.renderCasaFloorPulse();
    this.bindInputs();
    this.bindBusEvents();
    this.evaluateAndNotifyQuests();

    this.cameras.main.fadeIn(220, 20, 18, 29);
    EventBus.emit('MAP_CHANGED', {
      mapId: this.mapId,
      mapLabel: MAP_LABELS[this.mapId] ?? this.mapId,
    });
    EventBus.emit('TIME_TICK', { time: state.time });
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
    EventBus.emit('GOLD_UPDATED', { gold: state.gold });
    EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });

    this.time.delayedCall(260, () => {
      if (!this.isTransitioning && !this.isDialogueOpen) {
        this.checkAndTriggerStoryCutscenes();
      }
    });
  }

  update(timeMs: number, delta: number): void {
    if (this.isTransitioning) return;

    if (this.portalCooldownMs > 0) {
      this.portalCooldownMs = Math.max(0, this.portalCooldownMs - delta);
    }
    if (this.dialogueCooldownMs > 0) {
      this.dialogueCooldownMs = Math.max(0, this.dialogueCooldownMs - delta);
    }
    if (this.spellCooldownMs > 0) {
      this.spellCooldownMs = Math.max(0, this.spellCooldownMs - delta);
    }

    if (this.remoSprite) {
      this.remoSprite.y = 4 * TILE_SIZE + 2 + Math.sin(timeMs / 400) * 4;
    }
    if (this.lupinSprite) {
      this.lupinSprite.y = 4 * TILE_SIZE - 4 + Math.cos(timeMs / 360) * 3;
    }
    this.petSprites.forEach((sprite, idx) => {
      sprite.y += Math.sin(timeMs / 450 + idx * 1.4) * 0.12;
    });

    if (this.isDialogueOpen) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.portalPromptText?.setVisible(false);
      return;
    }

    this.player.updateMovement(delta);

    const state = gameState.getState();
    state.playerX = this.player.x;
    state.playerY = this.player.y;

    const tickRes = this.timeSystem.tick(delta);
    if (tickRes.timeChanged) {
      EventBus.emit('TIME_TICK', { time: state.time });
      this.dayNightSystem.updateLighting(this.mapId, state.time.minuteOfDay, state.time.weather);
    }
    this.updateVisualAmbience(delta);
    if (tickRes.exhausted) {
      this.sleepAndAdvanceDay('exhausted');
      return;
    }

    const feet = this.player.getFeetWorldPosition();
    const target = this.gridSystem.getTargetTile(feet.x, feet.y, this.player.facing);
    const cursorCenter = this.gridSystem.tileToWorldCenter(target.tileX, target.tileY);
    this.tileCursor.setPosition(cursorCenter.x, cursorCenter.y);

    this.handleKeyboardShortcuts(target.tileX, target.tileY);
    this.updatePortalPrompt(target.tileX, target.tileY);
  }

  private resolveSpawnPosition(
    map: Phaser.Tilemaps.Tilemap,
    data?: WorldSceneData
  ): { x: number; y: number } {
    if (typeof data?.spawnTileX === 'number' && typeof data?.spawnTileY === 'number') {
      return this.gridSystem.tileToWorldCenter(data.spawnTileX, data.spawnTileY);
    }

    const state = gameState.getState();
    if (data?.mapId === undefined && state.playerX > 0 && state.playerY > 0) {
      return { x: state.playerX, y: state.playerY };
    }

    const spawnsLayer = map.getObjectLayer('Spawns');
    const defaultSpawn = spawnsLayer?.objects.find((obj) => obj.name === 'default');
    if (defaultSpawn && typeof defaultSpawn.x === 'number' && typeof defaultSpawn.y === 'number') {
      return {
        x: defaultSpawn.x + TILE_SIZE / 2,
        y: defaultSpawn.y + TILE_SIZE / 2,
      };
    }

    return this.gridSystem.tileToWorldCenter(5, 5);
  }

  private loadPortals(map: Phaser.Tilemaps.Tilemap): void {
    const portalLayer = map.getObjectLayer('Portais');
    if (!portalLayer) return;

    for (const obj of portalLayer.objects) {
      const targetMap = getTiledProperty<string>(obj.properties, 'targetMap');
      const targetTileX = getTiledProperty<number>(obj.properties, 'targetTileX');
      const targetTileY = getTiledProperty<number>(obj.properties, 'targetTileY');
      const label = getTiledProperty<string>(obj.properties, 'label') ?? obj.name;

      if (
        targetMap &&
        typeof targetTileX === 'number' &&
        typeof targetTileY === 'number' &&
        typeof obj.x === 'number' &&
        typeof obj.y === 'number'
      ) {
        this.portals.push({
          name: obj.name,
          x: obj.x,
          y: obj.y,
          width: obj.width ?? TILE_SIZE,
          height: obj.height ?? TILE_SIZE,
          targetMap,
          targetTileX,
          targetTileY,
          label,
        });
      }
    }
  }

  private bindInputs(): void {
    const unlockAudio = () => audioSystem.unlock();
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);

    const kb = this.input.keyboard;
    if (kb) {
      this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.giftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.G);
      this.spellKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      this.invKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      this.craftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      this.questKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);
      this.tpKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.T);

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
      if (
        !pointer.leftButtonDown() ||
        this.isTransitioning ||
        this.isDialogueOpen ||
        this.dialogueCooldownMs > 0
      ) {
        return;
      }
      const feet = this.player.getFeetWorldPosition();
      const target = this.gridSystem.getTargetTile(feet.x, feet.y, this.player.facing);
      this.handleTileInteraction(target.tileX, target.tileY, false);
    });
  }

  private bindBusEvents(): void {
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
      this.refreshForgeBenchMarkers();
      this.evaluateAndNotifyQuests();
    };

    const onTeleport = ({ targetMap }: { targetMap: string }) => {
      if (targetMap === this.mapId) return;
      if (!this.manaSystem.consumeForSpell('teleporte')) {
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
        EventBus.emit('SHOW_TOAST', { message: 'Mana insuficiente para Teleportar!', kind: 'error' });
        return;
      }

      const state = gameState.getState();
      state.flags.used_teleport = true;
      this.evaluateAndNotifyQuests();

      const spawn = WAYPOINT_SPAWNS[targetMap] ?? { tileX: 7, tileY: 8 };
      EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      this.transitionTo({
        name: `tp_${targetMap}`,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        targetMap,
        targetTileX: spawn.tileX,
        targetTileY: spawn.tileY,
        label: `Teleporte: ${MAP_LABELS[targetMap] ?? targetMap}`,
      });
    };

    const onDialogueOpen = () => {
      this.isDialogueOpen = true;
    };
    const onDialogueClose = () => {
      this.isDialogueOpen = false;
      this.dialogueCooldownMs = 200;
      this.interactKey?.reset();
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
      const changed = this.inventorySystem.swapSlots(fromIndex, toIndex);
      if (changed) {
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
      }
    };

    const onUseSlot = ({ slotIndex }: { slotIndex: number }) => {
      if (this.isTransitioning || this.isDialogueOpen) return;
      this.useInventorySlot(slotIndex);
    };

    EventBus.on('SELECT_HOTBAR_SLOT', onSelectSlot);
    EventBus.on('CRAFT_ITEM', onCraft);
    EventBus.on('CAST_TELEPORT', onTeleport);
    EventBus.on('OPEN_DIALOGUE', onDialogueOpen);
    EventBus.on('CLOSE_DIALOGUE', onDialogueClose);
    EventBus.on('EQUIP_ITEM', onEquipItem);
    EventBus.on('UNEQUIP_ITEM', onUnequipItem);
    EventBus.on('SWAP_INVENTORY_SLOTS', onSwapSlots);
    EventBus.on('USE_INVENTORY_SLOT', onUseSlot);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('SELECT_HOTBAR_SLOT', onSelectSlot);
      EventBus.off('CRAFT_ITEM', onCraft);
      EventBus.off('CAST_TELEPORT', onTeleport);
      EventBus.off('OPEN_DIALOGUE', onDialogueOpen);
      EventBus.off('CLOSE_DIALOGUE', onDialogueClose);
      EventBus.off('EQUIP_ITEM', onEquipItem);
      EventBus.off('UNEQUIP_ITEM', onUnequipItem);
      EventBus.off('SWAP_INVENTORY_SLOTS', onSwapSlots);
      EventBus.off('USE_INVENTORY_SLOT', onUseSlot);
    });
  }

  private handleKeyboardShortcuts(targetX: number, targetY: number): void {
    this.hotbarKeys.forEach((key, idx) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        this.inventorySystem.selectHotbarSlot(idx);
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: idx });
      }
    });

    if (this.spellKey && Phaser.Input.Keyboard.JustDown(this.spellKey)) {
      const equippedWeapon = gameState.getState().equippedWeaponId;
      if (equippedWeapon) {
        this.castWorldStaffMagic(equippedWeapon);
      } else {
        EventBus.emit('SHOW_TOAST', {
          message: 'Equipe um cajado para conjurar magia com [Q].',
          kind: 'info',
        });
      }
    }
    if (this.invKey && Phaser.Input.Keyboard.JustDown(this.invKey)) {
      EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'mochila' });
    }
    if (this.craftKey && Phaser.Input.Keyboard.JustDown(this.craftKey)) {
      EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'criacao' });
    }
    if (this.questKey && Phaser.Input.Keyboard.JustDown(this.questKey)) {
      EventBus.emit('OPEN_QUEST_MODAL');
    }
    if (this.tpKey && Phaser.Input.Keyboard.JustDown(this.tpKey)) {
      EventBus.emit('OPEN_TELEPORT_MODAL');
    }
    if (this.giftKey && Phaser.Input.Keyboard.JustDown(this.giftKey)) {
      this.tryGiftNpcNearTile(targetX, targetY);
    }
    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (this.dialogueCooldownMs === 0) {
        this.handleTileInteraction(targetX, targetY, true);
      }
    }
  }

  private findNpcAtTile(tileX: number, tileY: number): NPC | undefined {
    return (
      this.npcSprites.find((npc) => {
        const liveX = Math.floor(npc.x / TILE_SIZE);
        const liveY = Math.floor((npc.y + 6) / TILE_SIZE);
        return (
          (Math.abs(liveX - tileX) <= 1 && Math.abs(liveY - tileY) <= 1 && liveX === tileX && liveY === tileY) ||
          (npc.tileX === tileX && npc.tileY === tileY)
        );
      }) ??
      this.npcSprites.find((npc) => {
        const liveX = Math.floor(npc.x / TILE_SIZE);
        const liveY = Math.floor((npc.y + 6) / TILE_SIZE);
        return (
          Math.abs(liveX - tileX) + Math.abs(liveY - tileY) <= 1 ||
          Math.abs(npc.tileX - tileX) + Math.abs(npc.tileY - tileY) <= 1
        );
      })
    );
  }

  private tryGiftNpcNearTile(tileX: number, tileY: number): void {
    const npc = this.findNpcAtTile(tileX, tileY);
    if (!npc) return;
    const selected = this.inventorySystem.getSelectedSlot();
    if (!selected) {
      EventBus.emit('SHOW_TOAST', { message: 'Selecione um item na hotbar para presentear [G].', kind: 'info' });
      return;
    }

    const res = this.npcSystem.giveGift(npc.npcDef.id, selected.itemId);
    EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'magic' : 'error' });
    EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
    EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
  }

  private handleTileInteraction(tileX: number, tileY: number, isInteractKey = false): void {
    const state = gameState.getState();
    EventBus.emit('TILE_INTERACT', { mapId: this.mapId, tileX, tileY });

    // 0. Interação com NPCs da cidade/fazenda
    const npc = this.findNpcAtTile(tileX, tileY);
    if (npc) {
      this.interactWithNpc(npc);
      return;
    }

    // 0.2 Interação com Unicórnios no cercado da fazenda (coleta Leite de Unicórnio)
    const unicornEntry = this.unicornSprites.find(
      (u) => Math.abs(u.tileX - tileX) <= 1 && Math.abs(u.tileY - tileY) <= 1
    );
    if (unicornEntry && this.mapId === 'fazenda') {
      const res = this.animalSystem.collectUnicornMilk(
        unicornEntry.unicornId,
        this.animalSystem.getAbsoluteDay()
      );
      if (
        res.ok &&
        unicornEntry.sprite instanceof Phaser.GameObjects.Sprite &&
        this.anims.exists('unicorn_idle')
      ) {
        unicornEntry.sprite.play('unicorn_idle');
      }
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'magic' : 'interact' });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'info' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      return;
    }

    // 0.5 Câmera perdida de Rafael na Fazenda
    if (
      this.mapId === 'fazenda' &&
      !state.flags.camera_rafael_found &&
      Math.abs(tileX - RAFAEL_CAMERA_TILE.tileX) <= 1 &&
      Math.abs(tileY - RAFAEL_CAMERA_TILE.tileY) <= 1
    ) {
      state.flags.camera_rafael_found = true;
      this.inventorySystem.addItem('camera_rafael', 1);
      this.questSystem.discoverSideQuest('sq_camera_neblina');
      this.cameraGlintSprite?.destroy();
      this.cameraGlintSprite = null;
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      EventBus.emit('QUESTS_UPDATED');
      this.refreshNpcIndicators();
      EventBus.emit('SHOW_TOAST', {
        message: 'Encontrou a Câmera de Alta Tecnologia de Rafael! Entregue a ele na cidade.',
        kind: 'success',
      });
      return;
    }

    // 0.5b Fragmentos do Diário Antigo espalhados pelo mundo
    const fragmentSpot = DIARY_FRAGMENT_SPOTS.find(
      (s) =>
        s.mapId === this.mapId &&
        !state.flags[s.flag] &&
        Math.abs(tileX - s.tileX) <= 1 &&
        Math.abs(tileY - s.tileY) <= 1
    );
    if (fragmentSpot) {
      state.flags[fragmentSpot.flag] = true;
      this.inventorySystem.addItem('fragmento_diario', 1);
      this.questSystem.discoverSideQuest('sq_fragmentos_diario');
      const entryIdx = this.diaryFragmentSprites.findIndex((e) => e.flag === fragmentSpot.flag);
      if (entryIdx !== -1) {
        this.diaryFragmentSprites[entryIdx]?.sprite.destroy();
        this.diaryFragmentSprites.splice(entryIdx, 1);
      }
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      EventBus.emit('QUESTS_UPDATED');
      this.refreshNpcIndicators();
      EventBus.emit('SHOW_TOAST', {
        message: `Encontrou 1x Fragmento do Diário Antigo (${fragmentSpot.desc})! Entregue 3 para Lyra.`,
        kind: 'success',
      });
      return;
    }

    // 0.5c Portal Dimensional de Omena no centro das runas do Porão (7, 6)
    if (
      this.mapId === 'porao' &&
      state.flags.omena_portal_opened &&
      Math.abs(tileX - 7) <= 1 &&
      Math.abs(tileY - 6) <= 1
    ) {
      this.enterDungeon('fortaleza_omena');
      return;
    }

    // 0.6 Alçapão secundário da Ferraria do Bento
    const decoTile = this.decoracaoLayer?.getTileAt(tileX, tileY);
    if (this.mapId === 'ferraria' && decoTile?.index === 16) {
      if (!state.flags.bento_trapdoor_inspected) {
        state.flags.bento_trapdoor_inspected = true;
        this.inventorySystem.addItem('moldes_protetor', 1);
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        EventBus.emit('SHOW_TOAST', {
          message: 'Você recuperou os Moldes do Antigo Protetor no alçapão da ferraria!',
          kind: 'success',
        });
        this.evaluateAndNotifyQuests();
      } else {
        EventBus.emit('SHOW_TOAST', { message: 'Os moldes antigos já foram coletados.', kind: 'info' });
      }
      return;
    }

    // 0.7 Portais e portas só entram ao pressionar [E]
    if (isInteractKey && this.portalCooldownMs === 0) {
      const portal = this.findInteractablePortal(tileX, tileY);
      if (portal) {
        this.transitionTo(portal);
        return;
      }
    }

    // 1. Verifica objetos estáticos de colisão do mapa Tiled
    const colTile = this.colisoesLayer?.getTileAt(tileX, tileY);
    if (colTile) {
      if (colTile.index === 15) {
        const portal = this.findInteractablePortal(tileX, tileY);
        EventBus.emit('SHOW_TOAST', {
          message: portal ? `Pressione [E] para ${portal.label}.` : 'Pressione [E] para usar a porta.',
          kind: 'info',
        });
        return;
      }
      if (colTile.index === 17) {
        const houseLvl = state.houseLevel ?? 1;
        EventBus.emit('OPEN_DIALOGUE', {
          turns: [
            {
              speaker: 'Moradia da Névoa',
              title: `Nível ${houseLvl}/3`,
              portraitColor: '#f5b942',
              mood: 'normal',
              text: 'Sua cama está arrumada e as estrelas anunciam o fim de mais um dia em São Tomé.',
              choices: [
                {
                  label: 'Dormir até o amanhecer (Encerrar o dia)',
                  tag: 'Descansar',
                  onSelect: () => this.sleepAndAdvanceDay('sleep'),
                },
                {
                  label: 'Reforma & Ampliação da Casa',
                  tag: `Nível ${houseLvl}/3`,
                  onSelect: () => EventBus.emit('OPEN_HOUSE_UPGRADE_MODAL'),
                },
                {
                  label: 'Ficar acordado mais um pouco',
                  tag: 'Voltar',
                },
              ],
            },
          ],
        });
        return;
      }
      if (colTile.index === 18) {
        const res = this.inventorySystem.depositToShippingBin(state.selectedHotbarIndex);
        EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'interact' : 'error' });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        return;
      }
      if (colTile.index === 19) {
        if (this.mapId === 'cidade') {
          const sq = this.questSystem.tryTurnInSideQuest('sq_fonte_numeros');
          EventBus.emit('AUDIO_PLAY_SFX', { kind: sq.ok ? 'magic' : 'interact' });
          EventBus.emit('SHOW_TOAST', { message: sq.message, kind: sq.ok ? 'success' : 'info' });
          EventBus.emit('GOLD_UPDATED', { gold: state.gold });
          EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
          EventBus.emit('QUESTS_UPDATED');
          return;
        }
        this.triggerLupinAndRemoAltar();
        return;
      }
      if (colTile.index === 21) {
        const res = this.animalSystem.collectBasementEggs();
        if (res.ok) {
          this.player.playAction('cast');
          this.basementEggSprites.forEach((egg) => egg.destroy());
          this.basementEggSprites = [];
          this.colisoesLayer?.removeTileAt(tileX, tileY);
        }
        EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'magic' : 'interact' });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'info' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        this.evaluateAndNotifyQuests();
        return;
      }
      if (colTile.index === 20) {
        if (this.mapId === 'porao') {
          const portalCfg = PORAO_PORTALS.find((p) => p.tileX === tileX && p.tileY === tileY);
          if (portalCfg) {
            this.handlePoraoPortalInteraction(portalCfg);
            return;
          }
        }
        EventBus.emit('SHOW_TOAST', {
          message: 'Pedestal antigo inativo.',
          kind: 'info',
        });
        return;
      }
      if (colTile.index === 22) {
        if (this.mapId === 'botica') {
          EventBus.emit('OPEN_SHOP_MODAL', { shopId: 'botica' });
          return;
        }
        if (this.mapId === 'ferraria') {
          EventBus.emit('OPEN_SHOP_MODAL', { shopId: 'ferraria' });
          return;
        }
        if (this.mapId === 'pub_pedra') {
          EventBus.emit('OPEN_SHOP_MODAL', { shopId: 'pub' });
          return;
        }
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
        EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'criacao' });
        return;
      }
      if (colTile.index === 24) {
        if (this.mapId === 'cidade') {
          EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
          EventBus.emit('OPEN_BULLETIN_BOARD_MODAL');
          return;
        }
        EventBus.emit('SHOW_TOAST', {
          message:
            'Placa: Leste → São Tomé dos Números • Oeste → Pedreira de Quartzo • Sul → Lagoa e Rio Místico.',
          kind: 'info',
        });
        return;
      }
      if (colTile.index === 4) {
        this.handleFishingSpot();
        return;
      }
      if (colTile.index === 14 || colTile.index === 31) {
        this.handleFarmRockMining(tileX, tileY, colTile.index === 31);
        return;
      }
      if (colTile.index === 13 && this.mapId === 'fazenda') {
        this.handleTreeChopping(tileX, tileY);
        return;
      }
    }

    // 2. Verifica objetos colocados pelo jogador (Incubadora / Bancada de Fundição / Encantamento)
    const tileState = this.gridSystem.getTile(this.mapId, tileX, tileY);
    if (tileState?.placedItemId === 'incubadora_arcana') {
      const hotbarSel = this.inventorySystem.getSelectedSlot()?.itemId;
      const preferredEgg =
        hotbarSel === 'ovo_unicornio' || hotbarSel === 'ovo_mini_dragao' ? hotbarSel : undefined;
      const res = this.animalSystem.startIncubation(
        this.animalSystem.getAbsoluteDay(),
        preferredEgg
      );
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'magic' : 'error' });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      return;
    }
    if (tileState?.placedItemId === 'bancada_fundicao') {
      const readyJob = this.craftingSystem.getForgeJobAt(tileX, tileY);
      if (readyJob?.status === 'ready') {
        const res = this.craftingSystem.collectReadyForgeJob(tileX, tileY);
        EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'craft' : 'error' });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        EventBus.emit('FORGE_UPDATED');
        this.refreshForgeBenchMarkers();
        this.evaluateAndNotifyQuests();
        return;
      }
      EventBus.emit('OPEN_INVENTORY_MODAL', {
        tab: 'criacao',
        station: 'fundicao',
        forgeTile: { tileX, tileY },
      });
      return;
    }
    if (tileState?.placedItemId === 'bancada_encantamento') {
      EventBus.emit('OPEN_ENCHANTMENT_MODAL');
      return;
    }

    // 3. Colheita pronta no tile alvo
    if (tileState?.cropId && tileState.isReadyToHarvest) {
      const harvestedCropId = tileState.cropId;
      const res = this.farmingSystem.harvestTile(this.mapId, tileX, tileY, state.time.moonPhase);
      if (res.ok) {
        this.questSystem.recordCropHarvested(harvestedCropId);
      }
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'farm' : 'error' });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      this.refreshSingleTileVisual(tileX, tileY);
      this.evaluateAndNotifyQuests();
      return;
    }

    // 4. Uso do item selecionado na Hotbar
    const selected = this.inventorySystem.getSelectedSlot();
    if (!selected) return;
    this.executeWorldItemUse(selected.itemId, state.selectedHotbarIndex, tileX, tileY, colTile);
  }

  private useInventorySlot(slotIndex: number): void {
    if (this.player.isActionLocked()) return;
    const state = gameState.getState();
    const slot = state.inventory[slotIndex];
    if (!slot) return;
    const itemDef = getItemDef(slot.itemId);
    if (!itemDef) return;

    if (itemDef.category === 'armor' || itemDef.category === 'weapon') {
      if (itemDef.category === 'weapon' && state.equippedWeaponId === itemDef.id) {
        this.castWorldStaffMagic(itemDef.id);
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
      if (res.ok) {
        this.player.playAction('eat', itemDef.id);
      }
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'magic' : 'error' });
      EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'info' });
      return;
    }

    const feet = this.player.getFeetWorldPosition();
    const target = this.gridSystem.getTargetTile(feet.x, feet.y, this.player.facing);
    if (slotIndex >= 0 && slotIndex < 12) {
      this.inventorySystem.selectHotbarSlot(slotIndex);
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: slotIndex });
    }
    this.handleTileInteraction(target.tileX, target.tileY);
  }

  private executeWorldItemUse(
    itemId: string,
    slotIndex: number,
    tileX: number,
    tileY: number,
    colTile: Phaser.Tilemaps.Tile | null | undefined
  ): void {
    if (this.player.isActionLocked()) return;
    const state = gameState.getState();
    const itemDef = getItemDef(itemId);
    if (!itemDef) return;

    if (itemDef.category === 'armor') {
      const res = this.inventorySystem.equipFromSlot(slotIndex);
      if (res.ok) {
        this.player.syncEquipmentVisuals(state.equippedWeaponId, state.equippedArmorId);
      }
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'interact' : 'error' });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      return;
    }

    if (itemDef.category === 'weapon') {
      if (state.equippedWeaponId !== itemDef.id) {
        const res = this.inventorySystem.equipFromSlot(slotIndex);
        if (res.ok) {
          this.player.syncEquipmentVisuals(state.equippedWeaponId, state.equippedArmorId);
        }
        EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'interact' : 'error' });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      } else {
        this.castWorldStaffMagic(itemDef.id);
      }
      return;
    }

    if (itemDef.category === 'consumable' || itemDef.category === 'crop') {
      const res = this.inventorySystem.consumeRestoreItem(slotIndex);
      if (res.ok) {
        this.player.playAction('eat', itemDef.id);
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
        EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'success' });
        return;
      }
    }

    const groundTile = this.chaoLayer?.getTileAt(tileX, tileY);
    const isFarmable = this.mapId === 'fazenda' && groundTile?.index === 5;
    const isPlaceableGround =
      this.mapId === 'fazenda' && groundTile !== null && groundTile !== undefined && !colTile;

    if (itemDef.id === 'enxada_antiga') {
      this.player.playAction('swing', itemDef.id);
      const res = this.farmingSystem.tillTile(this.mapId, tileX, tileY, isFarmable);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'farm' : 'error' });
      EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
      this.refreshSingleTileVisual(tileX, tileY);
      if (!res.ok) EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'error' });
      return;
    }

    if (itemDef.id === 'regador_simples') {
      this.player.playAction('swing', itemDef.id);
      const res = this.farmingSystem.waterTile(this.mapId, tileX, tileY);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'farm' : 'error' });
      EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
      this.refreshSingleTileVisual(tileX, tileY);
      if (!res.ok) EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'error' });
      return;
    }

    if (itemDef.id === 'picareta_simples') {
      if (colTile?.index === 14 || colTile?.index === 31) {
        this.handleFarmRockMining(tileX, tileY, colTile.index === 31);
        return;
      }
      this.player.playAction('swing', itemDef.id);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
      EventBus.emit('SHOW_TOAST', {
        message: 'Aproxime-se de uma rocha ou veio de minério para minerar.',
        kind: 'info',
      });
      return;
    }

    if (itemDef.id === 'machado_simples') {
      if (colTile?.index === 13 && this.mapId === 'fazenda') {
        this.handleTreeChopping(tileX, tileY);
        return;
      }
      this.player.playAction('swing', itemDef.id);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
      EventBus.emit('SHOW_TOAST', {
        message: 'Aproxime-se de uma árvore cortável na fazenda para extrair madeira.',
        kind: 'info',
      });
      return;
    }

    if (itemDef.id === 'vara_pesca_simples') {
      if (colTile?.index === 4 || groundTile?.index === 4) {
        this.handleFishingSpot();
      } else {
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
        EventBus.emit('SHOW_TOAST', {
          message: 'Aproxime-se de uma margem de água para pescar.',
          kind: 'info',
        });
      }
      return;
    }

    if (itemDef.category === 'seed') {
      const res = this.farmingSystem.plantSeed(
        this.mapId,
        tileX,
        tileY,
        itemDef.id,
        state.time.season
      );
      if (res.ok) {
        this.player.playAction('plant', itemDef.id);
      }
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'farm' : 'error' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      this.refreshSingleTileVisual(tileX, tileY);
      if (!res.ok) {
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'error' });
      } else {
        this.evaluateAndNotifyQuests();
      }
      return;
    }

    if (itemDef.category === 'placeable') {
      if (itemDef.id !== 'aspersor_bavario') {
        const feet = this.player.getFeetWorldPosition();
        const playerTile = this.gridSystem.worldToTile(feet.x, feet.y);
        if (playerTile.tileX === tileX && playerTile.tileY === tileY) {
          EventBus.emit('SHOW_TOAST', {
            message: 'Afaste-se um passo para posicionar esta estrutura.',
            kind: 'error',
          });
          return;
        }
      }
      const res = this.farmingSystem.placeObject(
        this.mapId,
        tileX,
        tileY,
        itemDef.id,
        isPlaceableGround
      );
      if (res.ok) {
        this.player.playAction('hold', itemDef.id);
      }
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'craft' : 'error' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      this.refreshSingleTileVisual(tileX, tileY);
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
      this.evaluateAndNotifyQuests();
    }
  }

  private castWorldStaffMagic(weaponId?: string): void {
    if (this.spellCooldownMs > 0) return;
    const state = gameState.getState();
    const staffId = weaponId ?? state.equippedWeaponId ?? undefined;
    const cost = this.manaSystem.getSpellCost('fagulha_arcana');

    if (state.vitals.mana < cost) {
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
      EventBus.emit('SHOW_TOAST', {
        message: 'Mana insuficiente para conjurar magia!',
        kind: 'error',
      });
      return;
    }

    state.vitals.mana -= cost;
    this.spellCooldownMs = 380;
    this.player.playAction('cast', staffId);
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });

    const dir = this.player.getFacingVector();
    const staffDef = staffId ? getItemDef(staffId) : undefined;
    const tintNum = staffDef?.visualColor
      ? Number.parseInt(staffDef.visualColor.replace('#', ''), 16)
      : 0x38bdf8;

    // Fora da dungeon, a magia dispara o projétil visual sem causar dano em nada.
    const useVfxSheet = this.textures.exists('combat_vfx_a_sheet');
    const bolt = (
      useVfxSheet
        ? this.physics.add
          .sprite(this.player.x + dir.x * 16, this.player.y + dir.y * 16, 'combat_vfx_a_sheet', 0)
          .setRotation(Math.atan2(dir.y, dir.x))
        : this.physics.add.image(
          this.player.x + dir.x * 16,
          this.player.y + dir.y * 16,
          'arcane_bolt'
        )
    )
      .setDepth(4200)
      .setTint(tintNum);
    if (useVfxSheet && bolt instanceof Phaser.Physics.Arcade.Sprite && this.anims.exists('arcane_bolt_anim')) {
      bolt.play('arcane_bolt_anim');
    }
    bolt.setVelocity(dir.x * 240, dir.y * 240);

    const pulse = this.add
      .circle(this.player.x + dir.x * 12, this.player.y + dir.y * 12, 8, tintNum, 0.35)
      .setDepth(4190);
    this.tweens.add({
      targets: pulse,
      scale: 2,
      alpha: 0,
      duration: 240,
      onComplete: () => pulse.destroy(),
    });

    if (this.colisoesLayer) {
      this.physics.add.collider(bolt, this.colisoesLayer, () => {
        if (bolt.active) bolt.destroy();
      });
    }
    this.time.delayedCall(900, () => {
      if (bolt.active) bolt.destroy();
    });
  }

  private interactWithNpc(npc: NPC): void {
    const state = gameState.getState();
    const npcId = npc.npcDef.id;

    // Evento jogável do Festival do Solstício de Névoa (3.2) na Praça Central
    if (
      this.mapId === 'cidade' &&
      (npcId === 'prefeito_arlindo' || npcId === 'seu_zeca') &&
      this.questSystem.getStatus('3.2_aliancas_solsticio') === 'active' &&
      !state.flags.seu_zeca_reconciled_solstice
    ) {
      const hasElixir = this.inventorySystem.hasItem('elixir_solsticio', 1);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      EventBus.emit('OPEN_DIALOGUE', {
        turns: getSolsticeFestivalTurns(hasElixir, () => {
          state.flags.seu_zeca_reconciled_solstice = true;
          state.flags.prepared_elixir_solsticio = true;
          state.npcAffinity.seu_zeca = Math.min(100, (state.npcAffinity.seu_zeca ?? 0) + 25);
          EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
          EventBus.emit('SHOW_TOAST', {
            message: 'Festival do Solstício celebrado! Seu Zeca agora é aliado.',
            kind: 'success',
          });
        }),
        onComplete: () => {
          EventBus.emit('GOLD_UPDATED', { gold: state.gold });
          EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
          this.evaluateAndNotifyQuests();
        },
      });
      return;
    }

    // Evento cruzado: A Conspiração do Alçapão (Bento + Lyra na Ferraria)
    if (
      this.mapId === 'ferraria' &&
      npcId === 'bento' &&
      state.flags.bento_trapdoor_inspected &&
      (state.npcAffinity.lyra ?? 0) >= 20 &&
      !state.flags.seen_trapdoor_conspiracy
    ) {
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      EventBus.emit('OPEN_DIALOGUE', {
        turns: getTrapdoorConspiracyTurns(() => {
          state.flags.seen_trapdoor_conspiracy = true;
          state.npcAffinity.bento = Math.min(100, (state.npcAffinity.bento ?? 0) + 15);
          state.npcAffinity.lyra = Math.min(100, (state.npcAffinity.lyra ?? 0) + 15);
          EventBus.emit('SHOW_TOAST', {
            message: 'Conspiração do Alçapão descoberta! (+15 Amizade com Bento e Lyra)',
            kind: 'success',
          });
        }),
        onComplete: () => {
          this.evaluateAndNotifyQuests();
        },
      });
      return;
    }

    const talk = this.npcSystem.talkToNpc(npcId, {
      mapId: this.mapId,
      minuteOfDay: state.time.minuteOfDay,
    });
    const newlyDiscoveredSide = this.questSystem.discoverSideQuestsForNpc(npcId);
    const affinity = this.npcSystem.getAffinity(npcId);
    const titleStr = `${npc.npcDef.role} • Amizade: ${affinity}/100 (Presente: [G])`;

    const turns: DialogueTurn[] = [
      {
        speaker: npc.npcDef.name,
        title: titleStr,
        portraitColor: npc.npcDef.portraitColor,
        text: talk.text,
      },
    ];

    for (const sqDef of newlyDiscoveredSide) {
      turns.push({
        speaker: npc.npcDef.name,
        title: `Nova Missão Secundária: ${sqDef.title}`,
        portraitColor: npc.npcDef.portraitColor,
        mood: 'alegre',
        text: `${sqDef.description} (${sqDef.objectiveHint})`,
      });
    }

    if (talk.milestoneTriggered) {
      turns.push(...talk.milestoneTriggered.turns);
      if (talk.milestoneTriggered.perkSummary) {
        turns.push({
          speaker: 'Marco de Amizade',
          title: talk.milestoneTriggered.title,
          portraitColor: '#5bc26e',
          mood: 'alegre',
          text: `Benefício desbloqueado: ${talk.milestoneTriggered.perkSummary}`,
        });
      }
    }

    // Benefício diário da Ísis (50+) no Pub de Pedra à noite
    const dayKey = `${state.time.year}_${state.time.season}_${state.time.day}`;
    if (
      npcId === 'isis' &&
      this.npcSystem.hasPerk('isis') &&
      this.mapId === 'pub_pedra' &&
      state.time.minuteOfDay >= 1020 &&
      !state.flags[`isis_perk_used_${dayKey}`]
    ) {
      state.flags[`isis_perk_used_${dayKey}`] = true;
      state.vitals.stamina = Math.min(state.vitals.maxStamina, state.vitals.stamina + 10);
      EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
      turns.push({
        speaker: 'Ísis',
        title: 'Ritmo Telúrico do Pub',
        portraitColor: npc.npcDef.portraitColor,
        mood: 'alegre',
        text: 'Tome esse acorde revigorante na conta da casa! (+10 Stamina recuperada)',
      });
    }

    // Benefício diário do Seu Zeca (50+)
    if (
      npcId === 'seu_zeca' &&
      this.npcSystem.hasPerk('seu_zeca') &&
      !state.flags[`zeca_gift_${dayKey}`]
    ) {
      state.flags[`zeca_gift_${dayKey}`] = true;
      this.inventorySystem.addItem('raiz_de_quartzo', 1);
      turns.push({
        speaker: 'Seu Zeca',
        title: 'Partilha do Paiol',
        portraitColor: npc.npcDef.portraitColor,
        mood: 'alegre',
        text: 'Separei uma Raiz de Quartzo fresquinha da minha cerca pra você, vizinho! (+1 Raiz de Quartzo)',
      });
    }

    const pushSideQuestChoice = (questId: string, label: string, readyText: string) => {
      const turn = turns[turns.length - 1];
      if (!turn) return;
      turn.choices = turn.choices ?? [];
      turn.choices.push({
        label,
        tag: 'Entregar Missão',
        onSelect: () => {
          const sq = this.questSystem.tryTurnInSideQuest(questId);
          EventBus.emit('AUDIO_PLAY_SFX', { kind: sq.ok ? 'magic' : 'error' });
          EventBus.emit('SHOW_TOAST', { message: sq.message, kind: sq.ok ? 'success' : 'error' });
        },
        nextTurns: [
          {
            speaker: npc.npcDef.name,
            title: titleStr,
            portraitColor: npc.npcDef.portraitColor,
            mood: 'alegre',
            text: readyText,
          },
        ],
      });
    };

    if (npcId === 'prefeito_arlindo') {
      state.flags.talked_prefeito_arlindo = true;
      if (
        this.questSystem.getStatus('sq_fonte_numeros') !== 'completed' &&
        this.inventorySystem.hasItem('pedra', 5) &&
        this.inventorySystem.hasItem('quartzo_refinado', 2)
      ) {
        pushSideQuestChoice(
          'sq_fonte_numeros',
          'Entregar 5x Pedra e 2x Quartzo Refinado para a Fonte dos Números',
          'Magnífico! As águas da Fonte dos Números voltaram a brilhar no centro da praça!'
        );
      }
    } else if (
      npcId === 'seu_damiao' &&
      this.questSystem.getStatus('sq_peixe_prisma') !== 'completed' &&
      this.inventorySystem.hasItem('peixe_prisma', 1)
    ) {
      pushSideQuestChoice(
        'sq_peixe_prisma',
        'Entregar 1x Peixe-Prisma ao Seu Damião',
        'Que escama estelar! Nunca pensei que veria um Peixe-Prisma tão vivo novamente!'
      );
    } else if (
      npcId === 'rafael' &&
      this.questSystem.getStatus('sq_camera_neblina') !== 'completed' &&
      this.inventorySystem.hasItem('camera_rafael', 1)
    ) {
      pushSideQuestChoice(
        'sq_camera_neblina',
        'Devolver a Câmera de Alta Tecnologia ao Rafael',
        'Minha câmera! Valeu demais — e ainda salvou o cartão com as fotos do céu!'
      );
    } else if (
      npcId === 'isis' &&
      this.questSystem.getStatus('sq_acorde_perdido') !== 'completed' &&
      this.inventorySystem.hasItem('lupulo_estelar', 2) &&
      this.inventorySystem.hasItem('barra_cobre', 1)
    ) {
      pushSideQuestChoice(
        'sq_acorde_perdido',
        'Entregar 2x Lúpulo Estelar e 1x Barra de Cobre para o som do Pub',
        'Isso!! Escuta esse grave estelar reverberando! Nenhum espectro chega perto agora!'
      );
    } else if (npcId === 'celeste') {
      if (
        this.questSystem.getStatus('sq_tonico_nevoa') !== 'completed' &&
        this.inventorySystem.hasItem('flor_de_sombra', 2) &&
        this.inventorySystem.hasItem('raiz_de_quartzo', 2)
      ) {
        pushSideQuestChoice(
          'sq_tonico_nevoa',
          'Entregar 2x Flor de Sombra e 2x Raiz de Quartzo para o Tônico contra a Névoa',
          'As pétalas da Lua Minguante reagiram perfeitamente! Aqui estão seus Tônicos.'
        );
      }
      if (this.questSystem.getStatus('3.1_paginas_faltantes') === 'active' || state.flags.inspected_lupin_gap1) {
        state.flags.talked_celeste_lupin_pages = true;
        turns.push({
          speaker: 'Celeste',
          title: 'Segredo das Páginas Faltantes',
          portraitColor: npc.npcDef.portraitColor,
          mood: 'misterio',
          text: '"Essas páginas faltando no Lupin relatam o último sacrifício do Antigo Protetor: ele exauriu a própria mana selando a fortaleza de Omena antes de partir."',
        });
        turns.push({
          speaker: 'Celeste',
          title: 'Preparo do Solstício',
          portraitColor: npc.npcDef.portraitColor,
          mood: 'normal',
          text: '"Para o Festival do Solstício de Névoa na Praça, prepare um Elixir do Solstício de Névoa na criação [C] (ou adquira na Botica) e celebre o brinde com Seu Zeca!"',
        });
      }
    } else if (npcId === 'lyra') {
      if (this.questSystem.getStatus('2.4_luzes_no_ceu') === 'active' || state.flags.water_guardian_blessed) {
        state.flags.talked_lyra_varginha = true;
        turns.push({
          speaker: 'Lyra',
          title: 'Coordenadas de Varginha',
          portraitColor: npc.npcDef.portraitColor,
          mood: 'alegre',
          text: '"Meus receptores sintonizaram a fenda de Varginha! Use 2x Liga Estelar, 3x Quartzo Refinado e 2x Leite de Unicórnio no 3º portal do porão."',
        });
      }
      if (
        this.questSystem.getStatus('sq_fragmentos_diario') !== 'completed' &&
        this.inventorySystem.hasItem('fragmento_diario', 3)
      ) {
        pushSideQuestChoice(
          'sq_fragmentos_diario',
          'Entregar os 3 Fragmentos do Diário Antigo para Lyra',
          'Incrível! Todas as notas celestes do Antigo Protetor estão aqui! Leve essas Ligas Estelares.'
        );
      }
    } else if (
      npcId === 'bento' &&
      this.questSystem.getStatus('sq_ferramentas_avancadas') !== 'completed' &&
      this.inventorySystem.hasItem('tonico_nevoa', 1) &&
      this.inventorySystem.hasItem('leite_unicornio', 2) &&
      this.inventorySystem.hasItem('liga_estelar', 1)
    ) {
      pushSideQuestChoice(
        'sq_ferramentas_avancadas',
        'Temperar suas ferramentas (1x Tônico, 2x Leite de Unicórnio, 1x Liga Estelar)',
        'Aço e magia em perfeita tempera! Suas ferramentas agora rendem recursos extras!'
      );
    } else if (npcId === 'seu_zeca') {
      if (this.questSystem.getStatus('2.1_fumaca_na_cerca') === 'active') {
        state.flags.talked_seu_zeca_smoke = true;
        turns.push({
          speaker: 'Seu Zeca',
          title: 'Na Cerca da Fazenda',
          portraitColor: npc.npcDef.portraitColor,
          mood: 'normal',
          text: '"Hmm... se você domou até esses três lagartinhos cuspindo fogo e forjou Liga Estelar sem queimar minha cerca, talvez eu tenha exagerado."',
        });
      }
      if (
        this.questSystem.getStatus('sq_trator_zeca') !== 'completed' &&
        state.miniDragonsCount >= 2 &&
        this.inventorySystem.hasItem('barra_cobre', 2)
      ) {
        pushSideQuestChoice(
          'sq_trator_zeca',
          'Soldar o trator do Seu Zeca com 2x Barra de Cobre e os Mini-Dragões',
          'Olha esse motor roncar! Seus bichinhos têm fogo de precisão mesmo, vizinho!'
        );
      }
    }

    // Se há escolha de entrega no último turno, incluir opção de conversar depois
    const lastTurn = turns[turns.length - 1];
    if (lastTurn?.choices && lastTurn.choices.length > 0) {
      lastTurn.choices.push({
        label: 'Guardar itens por enquanto',
        tag: 'Depois',
      });
    } else if (npcId === 'bento' && lastTurn) {
      lastTurn.choices = [
        {
          label: 'Ver reforma e ampliação da Casa da Fazenda',
          tag: 'Carpintaria',
          onSelect: () => EventBus.emit('OPEN_HOUSE_UPGRADE_MODAL'),
        },
        {
          label: 'Só passei para conversar',
          tag: 'Voltar',
        },
      ];
    }

    if (state.flags.endgame_unlocked && !(lastTurn?.choices && lastTurn.choices.length > 0)) {
      turns.push({
        speaker: npc.npcDef.name,
        title: titleStr,
        portraitColor: npc.npcDef.portraitColor,
        mood: 'alegre',
        text: 'Graças a você, o Núcleo do Mundo está seguro e São Tomé dos Números brilha no Festival do Solstício!',
      });
    }

    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
    EventBus.emit('OPEN_DIALOGUE', {
      turns,
      onComplete: () => {
        EventBus.emit('GOLD_UPDATED', { gold: state.gold });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        this.evaluateAndNotifyQuests();
      },
    });
  }

  private handleFishingSpot(): void {
    if (this.player.isActionLocked()) return;
    const state = gameState.getState();
    if (!this.inventorySystem.hasItem('vara_pesca_simples', 1)) {
      EventBus.emit('SHOW_TOAST', {
        message: 'Você precisa da Vara de Pesca (Missão 1.1 com o Prefeito Arlindo).',
        kind: 'info',
      });
      return;
    }
    if (state.vitals.stamina < 2) {
      EventBus.emit('SHOW_TOAST', { message: 'Stamina insuficiente para pescar!', kind: 'error' });
      return;
    }
    this.player.playAction('swing', 'vara_pesca_simples');
    const isNightOrEvening = state.time.minuteOfDay >= 18 * 60;
    this.time.delayedCall(350, () => {
      EventBus.emit('OPEN_FISHING_MODAL', { isNightOrEvening });
    });
  }

  private shakeSpriteFeedback(sprite: Phaser.GameObjects.Image | undefined): void {
    if (!sprite || !sprite.active) return;
    const originX = sprite.x;
    sprite.setTint(0xfef08a);
    this.time.delayedCall(90, () => {
      if (sprite.active) sprite.clearTint();
    });
    this.tweens.add({
      targets: sprite,
      x: originX + 3,
      duration: 45,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (sprite.active) sprite.x = originX;
      },
    });
  }

  private handleFarmRockMining(tileX: number, tileY: number, isOreVein = false): void {
    if (this.player.isActionLocked()) return;
    const selected = this.inventorySystem.getSelectedSlot();
    if (selected?.itemId !== 'picareta_simples') {
      EventBus.emit('SHOW_TOAST', {
        message: 'Equipe a Picareta Simples para minerar rochas e veios.',
        kind: 'info',
      });
      return;
    }
    const state = gameState.getState();
    if (state.vitals.stamina < 2) {
      EventBus.emit('SHOW_TOAST', { message: 'Stamina insuficiente!', kind: 'error' });
      return;
    }
    state.vitals.stamina -= 2;
    this.player.playAction('swing', 'picareta_simples');
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });

    const boulderKey = makeTileKey(this.mapId, tileX, tileY);
    const boulderSprite = this.boulderOverlaySprites.get(boulderKey);
    const baseHp = (isOreVein ? 3 : 2) - (state.flags.tools_upgraded_bento ? 1 : 0);
    const currentHp = this.rockHpMap.get(boulderKey) ?? Math.max(1, baseHp);
    const nextHp = currentHp - 1;

    if (nextHp > 0) {
      this.rockHpMap.set(boulderKey, nextHp);
      this.shakeSpriteFeedback(boulderSprite);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
      return;
    }

    this.rockHpMap.delete(boulderKey);
    this.colisoesLayer?.removeTileAt(tileX, tileY);
    if (boulderSprite) {
      boulderSprite.destroy();
      this.boulderOverlaySprites.delete(boulderKey);
    }
    const toolBonus = state.flags.tools_upgraded_bento ? 1 : 0;
    if (isOreVein) {
      this.inventorySystem.addItem('minerio_cobre', 2 + toolBonus);
      this.inventorySystem.addItem('pedra', 2 + toolBonus);
      this.inventorySystem.addItem('quartzo_bruto', 1);
    } else {
      this.inventorySystem.addItem('pedra', 3 + toolBonus);
      this.inventorySystem.addItem('quartzo_bruto', 1);
    }
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'craft' });
    EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
    const bonusNote = toolBonus > 0 ? ' (+Bento)' : '';
    EventBus.emit('SHOW_TOAST', {
      message: isOreVein
        ? `Extraiu ${2 + toolBonus}x Minério de Cobre, ${2 + toolBonus}x Pedra e 1x Quartzo Bruto${bonusNote}!`
        : `Coletou ${3 + toolBonus}x Pedra e 1x Quartzo Bruto${bonusNote}!`,
      kind: 'success',
    });
  }

  private handleTreeChopping(tileX: number, tileY: number): void {
    if (this.player.isActionLocked()) return;
    const isBorderTree =
      tileX <= 0 || tileY <= 0 || tileX >= this.map.width - 1 || tileY >= this.map.height - 1;
    if (isBorderTree) {
      EventBus.emit('SHOW_TOAST', {
        message: 'Árvore da cerca limite da propriedade.',
        kind: 'info',
      });
      return;
    }

    const selected = this.inventorySystem.getSelectedSlot();
    if (selected?.itemId !== 'machado_simples') {
      EventBus.emit('SHOW_TOAST', {
        message: 'Equipe o Machado Simples para cortar árvores internas.',
        kind: 'info',
      });
      return;
    }

    const state = gameState.getState();
    if (state.vitals.stamina < 2) {
      EventBus.emit('SHOW_TOAST', { message: 'Stamina insuficiente!', kind: 'error' });
      return;
    }
    state.vitals.stamina -= 2;
    this.player.playAction('swing', 'machado_simples');
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });

    const treeKey = makeTileKey(this.mapId, tileX, tileY);
    const treeSprite = this.treeOverlaySprites.get(treeKey);
    const baseHp = 4 - (state.flags.tools_upgraded_bento ? 1 : 0);
    const currentHp = this.treeHpMap.get(treeKey) ?? Math.max(1, baseHp);
    const nextHp = currentHp - 1;

    if (nextHp > 0) {
      this.treeHpMap.set(treeKey, nextHp);
      this.shakeSpriteFeedback(treeSprite);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'farm' });
      return;
    }

    this.treeHpMap.delete(treeKey);
    this.colisoesLayer?.removeTileAt(tileX, tileY);
    if (treeSprite) {
      this.treeOverlaySprites.delete(treeKey);
      this.tweens.add({
        targets: treeSprite,
        angle: this.player.facing === 'left' ? -75 : 75,
        alpha: 0,
        duration: 280,
        ease: 'Quad.easeIn',
        onComplete: () => treeSprite.destroy(),
      });
    }
    if (this.textures.exists('nature_extended_sheet')) {
      const center = this.gridSystem.tileToWorldCenter(tileX, tileY);
      this.add
        .image(center.x, center.y, 'nature_extended_sheet', NATURE_EXTENDED_FRAMES.TREE_STUMP)
        .setDepth(center.y - 4);
    }
    const woodYield = 3 + (state.flags.tools_upgraded_bento ? 1 : 0);
    this.inventorySystem.addItem('madeira', woodYield);
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'farm' });
    EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
    EventBus.emit('SHOW_TOAST', { message: `Coletou ${woodYield}x Madeira!`, kind: 'success' });
  }

  private triggerLupinAndRemoAltar(): void {
    const state = gameState.getState();
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });

    if (!state.flags.lupin_awakened) {
      EventBus.emit('OPEN_DIALOGUE', {
        turns: getLupinAwakeningTurns((flag) => {
          state.flags[flag] = true;
        }),
        onComplete: () => {
          state.flags.lupin_awakened = true;
          this.manaSystem.unlockSpell('teleporte');
          this.inventorySystem.addItem('pocao_mana_menor', 1);
          this.renderCompanionsAndPets();
          EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
          EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
          EventBus.emit('SHOW_TOAST', {
            message: 'Magia desbloqueada: Teleporte Telúrico ([T])! +1 Poção de Mana Menor.',
            kind: 'success',
          });
          this.evaluateAndNotifyQuests();
        },
      });
      return;
    }

    if (
      this.questSystem.getStatus('3.1_paginas_faltantes') === 'active' &&
      !state.flags.inspected_lupin_gap1
    ) {
      EventBus.emit('OPEN_DIALOGUE', {
        speaker: 'Remo & Lupin',
        title: 'Ato III — Primeira Lacuna do Grimório',
        portraitColor: '#c084fc',
        lines: [
          'Remo: "Espere... Agora que os três Guardiões estão livres, o selo entre estes capítulos de Lupin se soltou, mas há páginas arrancadas!"',
          'Remo: "Fala do preço que o Antigo Protetor pagou contra Omena. Vá falar com Celeste na Botica — ela guardou registros antigos sobre esse ritual."',
        ],
        onComplete: () => {
          state.flags.inspected_lupin_gap1 = true;
          this.evaluateAndNotifyQuests();
        },
      });
      return;
    }

    if (
      this.questSystem.getStatus('3.2_aliancas_solsticio') === 'active' &&
      !state.flags.guardians_attuned
    ) {
      const allThree =
        state.flags.earth_guardian_blessed &&
        state.flags.water_guardian_blessed &&
        state.flags.sky_guardian_blessed;
      if (allThree) {
        EventBus.emit('OPEN_DIALOGUE', {
          speaker: 'Remo & Guardiões',
          title: 'Ato III — Sintonização do Solstício',
          portraitColor: '#38bdf8',
          lines: [
            'Os ecos da Terra, das Águas e dos Céus vibram em uníssono sobre as runas do porão!',
            'Remo: "Os três Guardiões estão sintonizados com você. Garanta o Elixir do Solstício de Névoa e sele a paz com Seu Zeca para o rompimento final."',
          ],
          onComplete: () => {
            state.flags.guardians_attuned = true;
            this.evaluateAndNotifyQuests();
          },
        });
        return;
      }
    }

    if (
      this.questSystem.getStatus('3.3_rompimento_selo_final') === 'active' &&
      !state.flags.omena_portal_opened
    ) {
      if (!this.inventorySystem.hasItem('liga_estelar', 1)) {
        EventBus.emit('OPEN_DIALOGUE', {
          speaker: 'Remo & Lupin',
          title: 'Ato III — Segunda Lacuna e Selo Final',
          portraitColor: '#f5b942',
          lines: [
            'Remo: "A segunda lacuna do grimório revela o feitiço de Teleporte Ancestral até a fortaleza de Omena!"',
            'Remo: "Traga 1x Liga Estelar para canalizarmos os 3 Guardiões aqui no Altar e abrir o portal final no centro das runas."',
          ],
        });
        return;
      }

      EventBus.emit('OPEN_DIALOGUE', {
        speaker: 'Remo & Lupin',
        title: 'Ato III — Abertura da Fortaleza de Omena',
        portraitColor: '#c084fc',
        lines: [
          'As três correntes elementais envolvem a Liga Estelar sobre o Altar de Lupin, rasgando o véu dimensional!',
          'O Portal Final da Fortaleza de Omena surgiu sobre as runas do centro do porão (tile 7,6). Prepare suas poções e pressione [E] sobre ele quando estiver pronto!',
        ],
        onComplete: () => {
          this.inventorySystem.removeItem('liga_estelar', 1);
          state.flags.omena_portal_opened = true;
          EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
          this.renderCompanionsAndPets();
          this.evaluateAndNotifyQuests();
        },
      });
      return;
    }

    const tpCost = this.manaSystem.getSpellCost('teleporte');
    EventBus.emit('OPEN_DIALOGUE', {
      speaker: 'Remo',
      title: 'Guia de Lupin',
      portraitColor: '#a78bfa',
      lines: [
        `Use [T] para abrir o Teleporte Telúrico usando ${tpCost} de Mana. Pressione [J] a qualquer momento para revisar o Diário de Missões.${state.flags.omena_portal_opened
          ? ' O Portal Dimensional de Omena está aberto logo abaixo no centro das runas!'
          : ''
        }`,
      ],
    });
  }

  private handlePoraoPortalInteraction(cfg: PoraoPortalConfig): void {
    const state = gameState.getState();

    if (!state.flags[cfg.repairedFlag]) {
      if (cfg.prereqFlag && !state.flags[cfg.prereqFlag]) {
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
        EventBus.emit('SHOW_TOAST', {
          message: cfg.prereqMsg ?? 'Requisito prévio pendente para este portal.',
          kind: 'info',
        });
        return;
      }

      const missing = cfg.cost.filter((c) => !this.inventorySystem.hasItem(c.itemId, c.qty));
      if (missing.length > 0) {
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
        EventBus.emit('SHOW_TOAST', {
          message: `${cfg.label}: requer ${cfg.cost.map((c) => c.label).join(', ')} para reparar.`,
          kind: 'info',
        });
        return;
      }

      for (const req of cfg.cost) {
        this.inventorySystem.removeItem(req.itemId, req.qty);
      }
      state.flags[cfg.repairedFlag] = true;
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      EventBus.emit('SHOW_TOAST', {
        message: `${cfg.label} restaurado! Interaja novamente para entrar.`,
        kind: 'success',
      });
      return;
    }

    this.enterDungeon(cfg.dungeonId);
  }

  private enterDungeon(dungeonId: DungeonId): void {
    const startRun = (unstableRift: boolean) => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'portal' });
      this.cameras.main.fadeOut(220, 20, 18, 29);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('DungeonScene', { dungeonId, floor: 1, unstableRift });
      });
    };

    if (gameState.getState().flags.endgame_unlocked) {
      EventBus.emit('OPEN_DIALOGUE', {
        turns: [
          {
            speaker: 'Fenda Telúrica',
            title: 'Modo Endgame — Seleção de Intensidade',
            portraitColor: '#7e8ce0',
            mood: 'misterio',
            text: 'O portal vibra com energia pós-solstício. Como você deseja atravessar a fenda?',
            choices: [
              {
                label: 'Fenda Calma (Padrão)',
                tag: 'Normal',
                onSelect: () => startRun(false),
              },
              {
                label: 'Fenda Instável (+40% Vida/Dano, Loot & Ouro Bônus)',
                tag: 'Desafio Endgame',
                onSelect: () => startRun(true),
              },
              {
                label: 'Recuar por enquanto',
                tag: 'Cancelar',
              },
            ],
          },
        ],
      });
      return;
    }

    startRun(false);
  }

  private evaluateAndNotifyQuests(): void {
    const state = gameState.getState();
    const completed = this.questSystem.evaluateMainCampaign();
    if (completed.length > 0) {
      EventBus.emit('GOLD_UPDATED', { gold: state.gold });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      EventBus.emit('SHOW_TOAST', {
        message: `Missão Concluída: ${completed.join(', ')}!`,
        kind: 'success',
      });
    }
    this.refreshNpcIndicators();
    EventBus.emit('QUESTS_UPDATED');
  }

  private sleepAndAdvanceDay(reason: 'sleep' | 'exhausted'): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const state = gameState.getState();
    const dayFinished = state.time.day;
    const seasonFinished = state.time.season;

    const { totalGold, itemsSold } = this.inventorySystem.settleShippingBin();
    const nextTime = this.timeSystem.advanceDay();
    const { cropsGrown, cropsReady } = this.farmingSystem.processEndOfDay(nextTime.weather);
    const { hatchedCount, hatchedUnicornsCount } = this.animalSystem.processEndOfDay(
      this.animalSystem.getAbsoluteDay()
    );
    this.craftingSystem.completeAllForgeJobs();

    state.vitals.hp = state.vitals.maxHp;
    state.vitals.stamina = state.vitals.maxStamina;
    state.vitals.mana = state.vitals.maxMana;
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
      hatchedUnicorns: hatchedUnicornsCount,
      reason,
    });
  }

  private renderDynamicMapTiles(): void {
    const prefix = `${this.mapId}:`;
    for (const [key, tile] of this.gridSystem.entries()) {
      if (key.startsWith(prefix)) {
        this.refreshSingleTileVisual(tile.tileX, tile.tileY);
      }
    }
  }

  private refreshSingleTileVisual(tileX: number, tileY: number): void {
    const key = makeTileKey(this.mapId, tileX, tileY);
    const prev = this.dynamicTileSprites.get(key);
    if (prev) {
      prev.forEach((img) => img.destroy());
      this.dynamicTileSprites.delete(key);
    }

    const tile = this.gridSystem.getTile(this.mapId, tileX, tileY);
    if (!tile) return;

    const center = this.gridSystem.tileToWorldCenter(tileX, tileY);
    const created: Phaser.GameObjects.GameObject[] = [];

    if (tile.isTilled) {
      const soilKey = tile.isWatered ? 'soil_watered' : 'soil_tilled';
      created.push(this.add.image(center.x, center.y, soilKey).setDepth(3));
    }

    if (tile.cropId) {
      const stageIdx = Math.min(3, Math.max(0, tile.currentStage));
      if (this.textures.exists('crops_sheet')) {
        const cropRow =
          tile.cropId === 'raiz_de_quartzo' ? 0 : tile.cropId === 'lupulo_estelar' ? 1 : 2;
        created.push(
          this.add
            .image(center.x, center.y - 6, 'crops_sheet', cropRow * 4 + stageIdx)
            .setDepth(center.y)
        );
      } else {
        const cropImg = this.add
          .image(center.x, center.y, `crop_stage_${stageIdx}`)
          .setDepth(center.y);
        const cropDef = getCropDef(tile.cropId);
        if (cropDef && tile.isReadyToHarvest) {
          cropImg.setTint(Phaser.Display.Color.HexStringToColor(cropDef.colorHex).color);
        }
        created.push(cropImg);
      }
    }

    if (tile.placedItemId) {
      if (
        tile.placedItemId === 'incubadora_arcana' &&
        this.textures.exists('workbenches_animated_sheet')
      ) {
        const inc = this.add
          .sprite(center.x, center.y - 6, 'workbenches_animated_sheet', 0)
          .setDepth(center.y);
        if (this.anims.exists('incubadora_active_anim')) {
          inc.play('incubadora_active_anim');
        }
        created.push(inc);
      } else if (
        tile.placedItemId === 'bancada_fundicao' &&
        this.textures.exists('workbenches_animated_sheet')
      ) {
        const forge = this.add
          .sprite(center.x, center.y - 6, 'workbenches_animated_sheet', 4)
          .setDepth(center.y);
        if (this.anims.exists('forja_active_anim')) {
          forge.play('forja_active_anim');
        }
        created.push(forge);
      } else if (
        (tile.placedItemId === 'incubadora_arcana' || tile.placedItemId === 'bancada_fundicao') &&
        this.textures.exists('creatures_fire_sheet')
      ) {
        const frame =
          tile.placedItemId === 'incubadora_arcana'
            ? CREATURES_FIRE_FRAMES.INCUBADORA
            : CREATURES_FIRE_FRAMES.FORJA;
        created.push(
          this.add.image(center.x, center.y - 6, 'creatures_fire_sheet', frame).setDepth(center.y)
        );
      } else if (
        tile.placedItemId === 'bancada_encantamento' &&
        this.textures.exists('workbenches_animated_sheet')
      ) {
        const altar = this.add
          .sprite(center.x, center.y - 6, 'workbenches_animated_sheet', 8)
          .setDepth(center.y);
        if (this.anims.exists('bancada_encantamento_active')) {
          altar.play('bancada_encantamento_active');
        }
        created.push(altar);
      } else if (
        tile.placedItemId === 'bancada_encantamento' &&
        this.textures.exists('world_objects_sheet')
      ) {
        const altar = this.add
          .sprite(center.x, center.y - 6, 'world_objects_sheet', 0)
          .setDepth(center.y);
        if (this.anims.exists('bancada_encantamento_idle')) {
          altar.play('bancada_encantamento_idle');
        }
        created.push(altar);
      } else if (
        tile.placedItemId === 'aspersor_bavario' &&
        this.textures.exists('props_living_v2_sheet')
      ) {
        const sprinkler = this.add
          .sprite(center.x, center.y - 2, 'props_living_v2_sheet', 0)
          .setDepth(center.y);
        if (this.anims.exists('aspersor_spin_anim')) {
          sprinkler.play('aspersor_spin_anim');
        }
        created.push(sprinkler);
      } else if (tile.placedItemId === 'aspersor_bavario') {
        const sprinkler = this.add
          .circle(center.x, center.y, 7, 0x38bdf8, 0.9)
          .setStrokeStyle(2, 0xd4a373, 1)
          .setDepth(center.y);
        created.push(sprinkler);
      } else {
        const texKey = `obj_${tile.placedItemId}`;
        if (this.textures.exists(texKey)) {
          created.push(this.add.image(center.x, center.y, texKey).setDepth(center.y));
        }
      }

      if (tile.placedItemId !== 'aspersor_bavario' && this.placedColliders) {
        const colliderZone = this.add.zone(center.x, center.y + 2, 26, 20);
        this.physics.add.existing(colliderZone, true);
        this.placedColliders.add(colliderZone);
        created.push(colliderZone);
      }
    }

    if (created.length > 0) {
      this.dynamicTileSprites.set(key, created);
    }
  }

  private renderCompanionsAndPets(): void {
    const state = gameState.getState();

    if (this.mapId === 'porao' && state.flags.lupin_awakened && !this.remoSprite) {
      if (this.textures.exists('companions_sheet')) {
        const remo = this.add
          .sprite(8 * TILE_SIZE + 16, 4 * TILE_SIZE + 2, 'companions_sheet', COMPANION_FRAMES.REMO_START)
          .setDepth(1000);
        if (this.anims.exists('remo_fade')) remo.play('remo_fade');
        this.remoSprite = remo;

        const lupin = this.add
          .sprite(7 * TILE_SIZE + 16, 4 * TILE_SIZE - 4, 'companions_sheet', COMPANION_FRAMES.LUPIN_START)
          .setDepth(1000);
        if (this.anims.exists('lupin_float')) lupin.play('lupin_float');
        this.lupinSprite = lupin;
      } else {
        this.remoSprite = this.add
          .image(8 * TILE_SIZE + 16, 4 * TILE_SIZE + 8, 'companion_remo')
          .setDepth(1000);
      }
    }

    if (this.mapId === 'porao' && state.flags.eggs_collected_porao) {
      const nestTile = this.colisoesLayer?.getTileAt(12, 9);
      if (nestTile?.index === 21) {
        this.colisoesLayer?.removeTileAt(12, 9);
      }
    }

    if (
      this.mapId === 'porao' &&
      !state.flags.eggs_collected_porao &&
      this.basementEggSprites.length === 0 &&
      this.textures.exists('creatures_fire_sheet')
    ) {
      const eggFrames = [
        CREATURES_FIRE_FRAMES.EGG_EMBER,
        CREATURES_FIRE_FRAMES.EGG_CRYSTAL,
        CREATURES_FIRE_FRAMES.EGG_VOLCANIC,
      ];
      eggFrames.forEach((frame, idx) => {
        const ex = (11.5 + idx * 0.5) * TILE_SIZE + 16;
        const ey = 9 * TILE_SIZE + 10;
        const egg = this.add
          .image(ex, ey, 'creatures_fire_sheet', frame)
          .setScale(0.62)
          .setDepth(ey + 10);
        this.basementEggSprites.push(egg);
      });
    }

    if (this.mapId === 'fazenda' && this.petSprites.length === 0 && state.miniDragonsCount > 0) {
      const isNight = state.time.minuteOfDay >= 20 * 60 || state.time.minuteOfDay < 6 * 60;
      for (let i = 0; i < state.miniDragonsCount; i++) {
        const px = (42 + i * 2) * TILE_SIZE + 16;
        const py = 8 * TILE_SIZE + 16;
        if (this.textures.exists('pets_extended_sheet')) {
          const dragon = this.add
            .sprite(px, py - 4, 'pets_extended_sheet', PETS_EXTENDED_FRAMES.DRAGON_WALK_START)
            .setDepth(py);
          const animKey = isNight ? 'dragon_sleep_ext' : 'dragon_walk_ext';
          if (this.anims.exists(animKey)) dragon.play(animKey);
          this.petSprites.push(dragon);
        } else if (this.textures.exists('creatures_fire_sheet')) {
          const dragon = this.add
            .sprite(px, py - 4, 'creatures_fire_sheet', CREATURES_FIRE_FRAMES.DRAGON_IDLE_START)
            .setDepth(py);
          if (this.anims.exists('mini_dragon_idle')) dragon.play('mini_dragon_idle');
          this.petSprites.push(dragon);
        } else {
          const dragon = this.add.image(px, py, 'pet_mini_dragao').setDepth(py);
          this.petSprites.push(dragon);
        }
      }
    }

    if (this.mapId === 'fazenda' && this.unicornSprites.length === 0 && state.unicorns.length > 0) {
      const absDay = this.animalSystem.getAbsoluteDay();
      const isNight = state.time.minuteOfDay >= 20 * 60 || state.time.minuteOfDay < 6 * 60;
      state.unicorns.forEach((unicorn, i) => {
        const tileX = 41 + i * 2;
        const tileY = 6;
        const ux = tileX * TILE_SIZE + 16;
        const uy = tileY * TILE_SIZE + 16;
        let sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
        if (this.textures.exists('pets_extended_sheet')) {
          const uni = this.add
            .sprite(ux, uy - 4, 'pets_extended_sheet', PETS_EXTENDED_FRAMES.UNICORN_GRAZE_START)
            .setDepth(uy);
          const ready = unicorn.lastMilkDay < absDay;
          const anim = isNight
            ? 'unicorn_sleep_ext'
            : ready
            ? 'unicorn_ready_ext'
            : 'unicorn_graze_ext';
          if (this.anims.exists(anim)) uni.play(anim);
          sprite = uni;
        } else if (this.textures.exists('pet_unicornio_sheet')) {
          const uni = this.add.sprite(ux, uy - 4, 'pet_unicornio_sheet', 0).setDepth(uy);
          const ready = unicorn.lastMilkDay < absDay;
          const anim = ready ? 'unicorn_ready' : 'unicorn_idle';
          if (this.anims.exists(anim)) uni.play(anim);
          sprite = uni;
        } else {
          sprite = this.add.image(ux, uy, 'pet_unicornio').setDepth(uy);
        }
        this.petSprites.push(sprite);
        this.unicornSprites.push({ sprite, unicornId: unicorn.id, tileX, tileY });
      });
    }

    if (this.mapId === 'fazenda' && !state.flags.camera_rafael_found && !this.cameraGlintSprite) {
      const cx = RAFAEL_CAMERA_TILE.tileX * TILE_SIZE + 16;
      const cy = RAFAEL_CAMERA_TILE.tileY * TILE_SIZE + 16;
      if (this.textures.exists('world_objects_sheet')) {
        const cam = this.add.sprite(cx, cy - 2, 'world_objects_sheet', 4).setScale(0.75).setDepth(cy);
        if (this.anims.exists('camera_rafael_glint')) cam.play('camera_rafael_glint');
        this.cameraGlintSprite = cam;
      } else {
        this.cameraGlintSprite = this.add.image(cx, cy, 'camera_glint').setDepth(cy);
      }
    }

    if (this.diaryFragmentSprites.length === 0) {
      for (const spot of DIARY_FRAGMENT_SPOTS) {
        if (spot.mapId === this.mapId && !state.flags[spot.flag]) {
          const fx = spot.tileX * TILE_SIZE + 16;
          const fy = spot.tileY * TILE_SIZE + 16;
          let sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
          if (this.textures.exists('world_objects_sheet')) {
            const page = this.add.sprite(fx, fy - 2, 'world_objects_sheet', 8).setScale(0.72).setDepth(fy);
            if (this.anims.exists('diary_fragment_glint')) page.play('diary_fragment_glint');
            sprite = page;
          } else {
            sprite = this.add.image(fx, fy, 'camera_glint').setTint(0x38bdf8).setDepth(fy);
          }
          this.diaryFragmentSprites.push({ flag: spot.flag, sprite });
        }
      }
    }

    if (this.mapId === 'porao' && state.flags.omena_portal_opened && !this.omenaPortalSprite) {
      const px = 7 * TILE_SIZE + 16;
      const py = 6 * TILE_SIZE + 16;
      if (this.textures.exists('omena_world_props_sheet') && this.anims.exists('portal_omena_spin')) {
        const portal = this.add
          .sprite(px, py, 'omena_world_props_sheet', OMENA_PROPS_FRAMES.PORTAL_START)
          .setDepth(500);
        portal.play('portal_omena_spin');
        this.omenaPortalSprite = portal;
      } else {
        this.omenaPortalSprite = this.add.image(px, py, 'portal_omena').setDepth(500);
        this.tweens.add({
          targets: this.omenaPortalSprite,
          angle: 360,
          duration: 4200,
          repeat: -1,
        });
      }
    }
  }

  private renderModularWorldOverlays(): void {
    const state = gameState.getState();
    const isNight = state.time.minuteOfDay >= 18 * 60 || state.time.minuteOfDay < 6 * 60;

    if (this.textures.exists('nature_extended_sheet') && (this.mapId === 'fazenda' || this.mapId === 'cidade')) {
      for (let y = 0; y < this.map.height; y++) {
        for (let x = 0; x < this.map.width; x++) {
          const colTile = this.colisoesLayer?.getTileAt(x, y);
          const chaoTile = this.chaoLayer?.getTileAt(x, y);
          const decoTile = this.decoracaoLayer?.getTileAt(x, y);
          const center = this.gridSystem.tileToWorldCenter(x, y);

          if ((colTile?.index === 4 || chaoTile?.index === 4) && (x + y) % 3 === 0) {
            if (this.anims.exists('water_shimmer_anim')) {
              const shimmer = this.add
                .sprite(center.x, center.y, 'nature_extended_sheet', NATURE_EXTENDED_FRAMES.WATER_SHIMMER_1)
                .setAlpha(0.5)
                .setDepth(3);
              shimmer.play('water_shimmer_anim');
            }
          }

          // Margens de rio e orla arenosa junto à água (sem cobrir pontes/pier)
          if (!colTile && chaoTile?.index !== 4 && this.colisoesLayer?.getTileAt(x, y + 1)?.index === 4) {
            const bankFrame =
              x < 24 && this.mapId === 'fazenda'
                ? NATURE_EXTENDED_FRAMES.SHORELINE
                : NATURE_EXTENDED_FRAMES.RIVERBANK;
            this.add
              .image(center.x, center.y + 4, 'nature_extended_sheet', bankFrame)
              .setAlpha(0.85)
              .setDepth(2);
          }

          // Variações orgânicas de grama/flores em prados abertos (fora da terra arável GID 5)
          if (chaoTile?.index === 1 && !decoTile && !colTile) {
            const hash = (x * 41 + y * 23) % 31;
            if (hash === 2 || hash === 11 || hash === 19) {
              const grassFrames = [
                NATURE_EXTENDED_FRAMES.GRASS_ALT,
                NATURE_EXTENDED_FRAMES.GRASS_TALL,
                NATURE_EXTENDED_FRAMES.GRASS_FLOWERS,
              ] as const;
              const gf = grassFrames[hash % grassFrames.length] ?? NATURE_EXTENDED_FRAMES.GRASS_ALT;
              this.add.image(center.x, center.y, 'nature_extended_sheet', gf).setAlpha(0.85).setDepth(1);
            }
          }

          if (colTile?.index === 13) {
            const isBorder = x <= 0 || y <= 0 || x >= this.map.width - 1 || y >= this.map.height - 1;
            if (!isBorder || (x + y) % 2 === 0) {
              const treeFrames = [
                NATURE_EXTENDED_FRAMES.TREE_OAK_A,
                NATURE_EXTENDED_FRAMES.TREE_OAK_B,
                NATURE_EXTENDED_FRAMES.TREE_OAK_C,
                NATURE_EXTENDED_FRAMES.TREE_IPE_PURPLE,
              ];
              const frame = treeFrames[(x * 3 + y * 5) % treeFrames.length];
              const treeImg = this.add
                .image(center.x, center.y - 6, 'nature_extended_sheet', frame)
                .setScale(1.12)
                .setDepth(center.y + 6);
              if (!isBorder) {
                this.treeOverlaySprites.set(makeTileKey(this.mapId, x, y), treeImg);
              }
            }
          } else if (colTile?.index === 31) {
            colTile.setVisible(false);
            const boulderImg = this.add
              .image(center.x, center.y, 'nature_extended_sheet', NATURE_EXTENDED_FRAMES.RUNE_BOULDER)
              .setScale(1.06)
              .setDepth(center.y + 2);
            this.boulderOverlaySprites.set(makeTileKey(this.mapId, x, y), boulderImg);
          }
        }
      }

      if (this.mapId === 'cidade') {
        this.add
          .image(15 * TILE_SIZE + 16, 10 * TILE_SIZE + 16, 'nature_extended_sheet', NATURE_EXTENDED_FRAMES.COBBLE_ARCH)
          .setDepth(2);
      }
    }

    if (this.mapId === 'fazenda') {
      if (this.textures.exists('buildings_modular_sheet')) {
        for (let x = 24; x <= 31; x++) {
          const roofFrame =
            x === 24
              ? MODULAR_BUILDING_FRAMES.RED_ROOF_LEFT
              : x === 31
              ? MODULAR_BUILDING_FRAMES.RED_ROOF_RIGHT
              : x === 29
              ? MODULAR_BUILDING_FRAMES.RED_ROOF_CHIMNEY
              : MODULAR_BUILDING_FRAMES.RED_ROOF_MID;
          this.add.image(x * TILE_SIZE + 16, 4 * TILE_SIZE + 16, 'buildings_modular_sheet', roofFrame).setDepth(3);
          this.add
            .image(x * TILE_SIZE + 16, 5 * TILE_SIZE + 16, 'buildings_modular_sheet', MODULAR_BUILDING_FRAMES.RED_ROOF_GABLE)
            .setDepth(3);

          const wallFrame =
            x === 24
              ? MODULAR_BUILDING_FRAMES.WALL_LEFT
              : x === 31
              ? MODULAR_BUILDING_FRAMES.WALL_RIGHT
              : x === 26 || x === 30
              ? MODULAR_BUILDING_FRAMES.WALL_IVY_FLOWER
              : MODULAR_BUILDING_FRAMES.WALL_MID;
          this.add.image(x * TILE_SIZE + 16, 6 * TILE_SIZE + 16, 'buildings_modular_sheet', wallFrame).setDepth(3);
        }

        if (this.anims.exists('chimney_smoke_anim')) {
          const smoke = this.add
            .sprite(29 * TILE_SIZE + 16, 3 * TILE_SIZE + 16, 'buildings_modular_sheet', MODULAR_BUILDING_FRAMES.CHIMNEY_SMOKE_1)
            .setDepth(4);
          smoke.play('chimney_smoke_anim');
        }

        for (const wx of [25, 29]) {
          const win = this.add
            .image(
              wx * TILE_SIZE + 16,
              6 * TILE_SIZE + 16,
              'buildings_modular_sheet',
              isNight ? MODULAR_BUILDING_FRAMES.WINDOW_LIT : MODULAR_BUILDING_FRAMES.WINDOW_DARK
            )
            .setDepth(4);
          this.timeVisualSprites.push({
            sprite: win,
            dayFrame: MODULAR_BUILDING_FRAMES.WINDOW_DARK,
            nightFrame: MODULAR_BUILDING_FRAMES.WINDOW_LIT,
          });
        }

        this.add
          .image(28 * TILE_SIZE + 16, 7 * TILE_SIZE + 16, 'buildings_modular_sheet', MODULAR_BUILDING_FRAMES.WALL_THRESHOLD)
          .setDepth(2);
        this.add
          .image(28 * TILE_SIZE + 16, 7 * TILE_SIZE + 16, 'buildings_modular_sheet', MODULAR_BUILDING_FRAMES.DOOR_SINGLE)
          .setDepth(3);

        if (this.anims.exists('wall_lantern_anim')) {
          for (const lx of [27, 29]) {
            const lantern = this.add
              .sprite(lx * TILE_SIZE + 16, 7 * TILE_SIZE + 12, 'buildings_modular_sheet', MODULAR_BUILDING_FRAMES.WALL_LANTERN_1)
              .setScale(0.7)
              .setDepth(5);
            lantern.play('wall_lantern_anim');
          }
        }
      }
    }

    if (this.mapId === 'cidade') {
      if (this.textures.exists('buildings_modular_sheet')) {
        const shops = [
          { signX: 5, doorX: 6, chimneyX: 7, signFrame: MODULAR_BUILDING_FRAMES.SIGN_FORGE, roofDark: true },
          { signX: 13, doorX: 14, chimneyX: 15, signFrame: MODULAR_BUILDING_FRAMES.SIGN_BOTICA, roofDark: false },
          { signX: 21, doorX: 22, chimneyX: 24, signFrame: MODULAR_BUILDING_FRAMES.SIGN_PUB, roofDark: true },
        ];
        for (const s of shops) {
          this.add
            .image(
              s.chimneyX * TILE_SIZE + 16,
              3 * TILE_SIZE + 16,
              'buildings_modular_sheet',
              s.roofDark ? MODULAR_BUILDING_FRAMES.DARK_ROOF : MODULAR_BUILDING_FRAMES.RED_ROOF_CHIMNEY
            )
            .setDepth(3);
          this.add
            .image(s.doorX * TILE_SIZE + 16, 5 * TILE_SIZE + 16, 'buildings_modular_sheet', MODULAR_BUILDING_FRAMES.DOOR_DOUBLE)
            .setDepth(3);
          this.add
            .image(s.signX * TILE_SIZE + 16, 5 * TILE_SIZE + 10, 'buildings_modular_sheet', s.signFrame)
            .setScale(0.85)
            .setDepth(5);
          const win = this.add
            .image(
              (s.doorX + 1) * TILE_SIZE + 16,
              4 * TILE_SIZE + 16,
              'buildings_modular_sheet',
              isNight ? MODULAR_BUILDING_FRAMES.WINDOW_LIT : MODULAR_BUILDING_FRAMES.WINDOW_DARK
            )
            .setDepth(4);
          this.timeVisualSprites.push({
            sprite: win,
            dayFrame: MODULAR_BUILDING_FRAMES.WINDOW_DARK,
            nightFrame: MODULAR_BUILDING_FRAMES.WINDOW_LIT,
          });
          if (this.anims.exists('chimney_smoke_anim')) {
            const smoke = this.add
              .sprite(s.chimneyX * TILE_SIZE + 16, 2 * TILE_SIZE + 16, 'buildings_modular_sheet', MODULAR_BUILDING_FRAMES.CHIMNEY_SMOKE_1)
              .setDepth(4);
            smoke.play('chimney_smoke_anim');
          }
        }
      }

      if (this.textures.exists('nature_extended_sheet')) {
        const lampCoords: ReadonlyArray<readonly [number, number]> = [
          [10, 9],
          [20, 9],
          [12, 13],
          [18, 13],
          [13, 17],
          [16, 17],
        ];
        for (const [lx, ly] of lampCoords) {
          const lamp = this.add
            .image(
              lx * TILE_SIZE + 16,
              ly * TILE_SIZE + 8,
              'nature_extended_sheet',
              isNight ? NATURE_EXTENDED_FRAMES.STREET_LAMP_LIT : NATURE_EXTENDED_FRAMES.STREET_LAMP_OFF
            )
            .setDepth(ly * TILE_SIZE + 12);
          this.timeVisualSprites.push({
            sprite: lamp,
            dayFrame: NATURE_EXTENDED_FRAMES.STREET_LAMP_OFF,
            nightFrame: NATURE_EXTENDED_FRAMES.STREET_LAMP_LIT,
          });
        }
      }
    }

    if (
      this.textures.exists('interiors_sheet') &&
      (this.mapId === 'casa' || this.mapId === 'ferraria' || this.mapId === 'botica' || this.mapId === 'pub_pedra')
    ) {
      const midX = Math.floor(this.map.width / 2);
      for (let rx = midX - 2; rx <= midX + 2; rx++) {
        for (let ry = 5; ry <= 7; ry++) {
          const rugFrame =
            rx === midX - 2
              ? INTERIOR_FRAMES.RUG_LEFT
              : rx === midX && ry === 6
              ? INTERIOR_FRAMES.RUG_DIAMOND
              : INTERIOR_FRAMES.RUG_MID;
          this.add
            .image(rx * TILE_SIZE + 16, ry * TILE_SIZE + 16, 'interiors_sheet', rugFrame)
            .setAlpha(0.85)
            .setDepth(3);
        }
      }

      if (this.mapId === 'casa') {
        this.add
          .image(2 * TILE_SIZE + 16, 2 * TILE_SIZE + 16, 'interiors_sheet', INTERIOR_FRAMES.BED_ARCANE)
          .setDepth(2 * TILE_SIZE + 16);
        this.add
          .image(4 * TILE_SIZE + 16, 1 * TILE_SIZE + 16, 'interiors_sheet', INTERIOR_FRAMES.BOOKSHELF)
          .setDepth(1 * TILE_SIZE + 16);
        this.add
          .image(5 * TILE_SIZE + 16, 0 * TILE_SIZE + 20, 'interiors_sheet', INTERIOR_FRAMES.WINDOW_HERBS)
          .setDepth(24);
        if (this.anims.exists('fireplace_burn_anim')) {
          const fp = this.add
            .sprite(6 * TILE_SIZE + 16, 1 * TILE_SIZE + 14, 'interiors_sheet', INTERIOR_FRAMES.FIREPLACE_1)
            .setDepth(1 * TILE_SIZE + 16);
          fp.play('fireplace_burn_anim');
        }
        this.add
          .image(9 * TILE_SIZE + 16, 1 * TILE_SIZE + 16, 'interiors_sheet', INTERIOR_FRAMES.STOVE_CAULDRON)
          .setDepth(1 * TILE_SIZE + 16);
        this.add
          .image(3 * TILE_SIZE + 16, 5 * TILE_SIZE + 16, 'interiors_sheet', INTERIOR_FRAMES.TABLE_CRYSTAL)
          .setDepth(5 * TILE_SIZE + 16);
        this.add
          .image(2 * TILE_SIZE + 16, 5 * TILE_SIZE + 16, 'interiors_sheet', INTERIOR_FRAMES.ARMCHAIR)
          .setDepth(5 * TILE_SIZE + 16);
      } else {
        this.add
          .image(midX * TILE_SIZE + 16, 3 * TILE_SIZE + 16, 'interiors_sheet', INTERIOR_FRAMES.COUNTER_SHOP)
          .setDepth(3 * TILE_SIZE + 16);
        this.add
          .image(2 * TILE_SIZE + 16, 1 * TILE_SIZE + 16, 'interiors_sheet', INTERIOR_FRAMES.BARREL_SACKS)
          .setDepth(1 * TILE_SIZE + 16);
        this.add
          .image(
            (this.map.width - 3) * TILE_SIZE + 16,
            1 * TILE_SIZE + 16,
            'interiors_sheet',
            this.mapId === 'botica' ? INTERIOR_FRAMES.POTION_SHELF : INTERIOR_FRAMES.BOOKSHELF
          )
          .setDepth(1 * TILE_SIZE + 16);
        if (this.anims.exists('fireplace_burn_anim')) {
          const fp = this.add
            .sprite(midX * TILE_SIZE + 16, 1 * TILE_SIZE + 12, 'interiors_sheet', INTERIOR_FRAMES.FIREPLACE_1)
            .setDepth(1 * TILE_SIZE + 16);
          fp.play('fireplace_burn_anim');
        }
      }
    }
  }

  private refreshForgeBenchMarkers(): void {
    this.forgeReadyMarkers.forEach((marker) => marker.destroy());
    this.forgeReadyMarkers.clear();
    if (this.mapId !== 'fazenda') return;

    for (const job of this.craftingSystem.getForgeJobs()) {
      if (job.status !== 'ready') continue;
      const key = makeTileKey(this.mapId, job.tileX, job.tileY);
      const center = this.gridSystem.tileToWorldCenter(job.tileX, job.tileY);
      const marker = this.add
        .text(center.x, center.y - 26, '✨ Pronto!', {
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#fde047',
          backgroundColor: 'rgba(15, 23, 42, 0.82)',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(center.y + 40);
      this.tweens.add({
        targets: marker,
        y: center.y - 31,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.forgeReadyMarkers.set(key, marker);
    }
  }

  private updateVisualAmbience(deltaMs: number): void {
    const state = gameState.getState();

    // Atualiza temporizador da Forja em tempo real
    const completedForgeJobs = this.craftingSystem.tickForgeJobs(deltaMs);
    const hasForgingJob = this.craftingSystem.getForgeJobs().some((j) => j.status === 'forging');
    if (completedForgeJobs.length > 0) {
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      EventBus.emit('SHOW_TOAST', {
        message: 'Forja concluída! Interaja com a Bancada de Fundição [E] para coletar.',
        kind: 'success',
      });
      EventBus.emit('FORGE_UPDATED');
      this.refreshForgeBenchMarkers();
      this.evaluateAndNotifyQuests();
      this.forgeUiAccumMs = 0;
    } else if (hasForgingJob) {
      this.forgeUiAccumMs += deltaMs;
      if (this.forgeUiAccumMs >= 500) {
        this.forgeUiAccumMs = 0;
        EventBus.emit('FORGE_UPDATED');
      }
    }

    const isNight = state.time.minuteOfDay >= 18 * 60 || state.time.minuteOfDay < 6 * 60;

    if (isNight !== this.wildlifeIsNight) {
      this.spawnAmbientFireflies();
      for (const item of this.timeVisualSprites) {
        if (item.sprite.scene) {
          item.sprite.setFrame(isNight ? item.nightFrame : item.dayFrame);
        }
      }
      const petsSleep = state.time.minuteOfDay >= 20 * 60 || state.time.minuteOfDay < 6 * 60;
      if (this.textures.exists('pets_extended_sheet')) {
        for (const pet of this.petSprites) {
          if (pet instanceof Phaser.GameObjects.Sprite && pet.texture.key === 'pets_extended_sheet') {
            const animKey = pet.anims.currentAnim?.key ?? '';
            if (animKey.startsWith('dragon_')) {
              const target = petsSleep ? 'dragon_sleep_ext' : 'dragon_walk_ext';
              if (this.anims.exists(target)) pet.play(target, true);
            }
          }
        }
        const absDay = this.animalSystem.getAbsoluteDay();
        for (const u of this.unicornSprites) {
          if (u.sprite instanceof Phaser.GameObjects.Sprite && u.sprite.texture.key === 'pets_extended_sheet') {
            const uData = state.unicorns.find((entry) => entry.id === u.unicornId);
            const ready = uData ? uData.lastMilkDay < absDay : false;
            const target = petsSleep
              ? 'unicorn_sleep_ext'
              : ready
              ? 'unicorn_ready_ext'
              : 'unicorn_graze_ext';
            if (this.anims.exists(target)) u.sprite.play(target, true);
          }
        }
      }
    }

    if (
      state.time.weather === 'Chuva' &&
      (this.mapId === 'fazenda' || this.mapId === 'cidade') &&
      this.textures.exists('ambient_life_vfx_sheet') &&
      this.anims.exists('rain_splash_anim')
    ) {
      this.rainSplashAccumMs += deltaMs;
      if (this.rainSplashAccumMs >= 180) {
        this.rainSplashAccumMs = 0;
        const cam = this.cameras.main;
        const rx = cam.worldView.x + Math.random() * cam.worldView.width;
        const ry = cam.worldView.y + Math.random() * cam.worldView.height;
        const splash = this.add
          .sprite(rx, ry, 'ambient_life_vfx_sheet', 12)
          .setAlpha(0.65)
          .setDepth(4400);
        splash.play('rain_splash_anim');
        splash.once('animationcomplete', () => splash.destroy());
      }
    }

    this.npcActivityCheckMs += deltaMs;
    if (this.npcActivityCheckMs >= 1000) {
      this.npcActivityCheckMs = 0;
      const inWorkHours = state.time.minuteOfDay >= 9 * 60 && state.time.minuteOfDay <= 17 * 60;
      for (const npc of this.npcSprites) {
        const hasActivity =
          typeof NPC_ACTIVITY_ROWS[npc.npcDef.id] === 'number' ||
          this.anims.exists(`npc_${npc.npcDef.id}_work`);
        npc.setWorkingActivity(hasActivity && inWorkHours);
      }

      // Bancadas vivas e partículas de trabalho na Fazenda
      if (this.mapId === 'fazenda') {
        for (const tile of Object.values(state.tiles)) {
          if (!tile.placedItemId) continue;
          const center = this.gridSystem.tileToWorldCenter(tile.tileX, tile.tileY);
          if (tile.placedItemId === 'incubadora_arcana' && state.incubatingEggs.length > 0) {
            const bubble = this.add
              .circle(center.x + (Math.random() * 14 - 7), center.y - 6, 2.2, 0x38bdf8, 0.85)
              .setDepth(center.y + 18);
            this.tweens.add({
              targets: bubble,
              y: center.y - 24,
              alpha: 0,
              scale: 1.4,
              duration: 900,
              onComplete: () => bubble.destroy(),
            });
          } else if (tile.placedItemId === 'bancada_fundicao') {
            const ember = this.add
              .circle(center.x + (Math.random() * 12 - 6), center.y - 8, 2, 0xf97316, 0.9)
              .setDepth(center.y + 18);
            this.tweens.add({
              targets: ember,
              x: ember.x + (Math.random() * 10 - 5),
              y: center.y - 26,
              alpha: 0,
              duration: 780,
              onComplete: () => ember.destroy(),
            });
          } else if (tile.placedItemId === 'bancada_encantamento') {
            const spark = this.add
              .circle(center.x + (Math.random() * 16 - 8), center.y - 10, 1.8, 0xc084fc, 0.85)
              .setDepth(center.y + 18);
            this.tweens.add({
              targets: spark,
              y: center.y - 24,
              alpha: 0,
              duration: 850,
              onComplete: () => spark.destroy(),
            });
          } else if (tile.placedItemId === 'aspersor_bavario') {
            for (const angle of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
              const drop = this.add
                .circle(center.x, center.y - 2, 1.8, 0x38bdf8, 0.8)
                .setDepth(center.y + 15);
              this.tweens.add({
                targets: drop,
                x: center.x + Math.cos(angle + state.time.minuteOfDay) * 20,
                y: center.y + Math.sin(angle + state.time.minuteOfDay) * 14,
                alpha: 0,
                duration: 620,
                onComplete: () => drop.destroy(),
              });
            }
          }
        }
      }

      // Peixes saltando no rio / sapos na margem (Fazenda e Cidade)
      if (!isNight && (this.mapId === 'fazenda' || this.mapId === 'cidade') && Math.random() < 0.42) {
        const waterSpot =
          this.mapId === 'fazenda'
            ? { x: (51 + Math.floor(Math.random() * 5)) * TILE_SIZE + 16, y: (14 + Math.floor(Math.random() * 16)) * TILE_SIZE + 16 }
            : { x: (4 + Math.floor(Math.random() * 6)) * TILE_SIZE + 16, y: (20 + Math.floor(Math.random() * 3)) * TILE_SIZE + 16 };
        if (this.textures.exists('wildlife_fauna_v2_sheet') && this.anims.exists('fish_leap_anim')) {
          const fish = this.add
            .sprite(waterSpot.x, waterSpot.y, 'wildlife_fauna_v2_sheet', 4)
            .setDepth(waterSpot.y + 20);
          fish.play('fish_leap_anim');
          fish.once('animationcomplete', () => fish.destroy());
        } else if (this.textures.exists('ambient_life_vfx_sheet') && this.anims.exists('rain_splash_anim')) {
          const splash = this.add
            .sprite(waterSpot.x, waterSpot.y, 'ambient_life_vfx_sheet', 12)
            .setDepth(waterSpot.y + 20);
          splash.play('rain_splash_anim');
          splash.once('animationcomplete', () => splash.destroy());
        }
      }
    }

    // Atualização autônoma contínua dos NPCs (patrulha em 4 direções, trabalho e reação ao jogador)
    for (const npc of this.npcSprites) {
      npc.updateAutonomous(deltaMs, this.player.x, this.player.y, (wx, wy) => {
        const tx = Math.floor(wx / TILE_SIZE);
        const ty = Math.floor(wy / TILE_SIZE);
        if (tx < 1 || ty < 1 || tx >= this.map.width - 1 || ty >= this.map.height - 1) return false;
        return !this.colisoesLayer?.getTileAt(tx, ty);
      });
    }

    // Movimentação autônoma viva dos Mini-Dragões e Unicórnios na Fazenda
    const petsSleep = state.time.minuteOfDay >= 20 * 60 || state.time.minuteOfDay < 6 * 60;
    const dtSec = deltaMs / 1000;
    const activeForgingJobs =
      this.mapId === 'fazenda'
        ? this.craftingSystem.getForgeJobs().filter((j) => j.status === 'forging')
        : [];
    this.dragonForgeFireAccumMs += deltaMs;
    const emitDragonFire = this.dragonForgeFireAccumMs >= 320;
    if (emitDragonFire) {
      this.dragonForgeFireAccumMs = 0;
    }

    this.petSprites.forEach((pet, idx) => {
      if (!(pet instanceof Phaser.GameObjects.Sprite) || !pet.active) return;
      let homeX = pet.getData('homeX') as number | undefined;
      let homeY = pet.getData('homeY') as number | undefined;
      if (typeof homeX !== 'number' || typeof homeY !== 'number') {
        homeX = pet.x;
        homeY = pet.y;
        pet.setData('homeX', homeX);
        pet.setData('homeY', homeY);
        pet.setData('phase', idx * 1.7 + 0.4);
      }

      const assignedJob = activeForgingJobs[idx % Math.max(1, activeForgingJobs.length)];
      if (activeForgingJobs.length > 0 && assignedJob && idx < activeForgingJobs.length) {
        const forgeCenter = this.gridSystem.tileToWorldCenter(assignedJob.tileX, assignedJob.tileY);
        const targetX = forgeCenter.x - 18;
        const targetY = forgeCenter.y - 6;
        const dx = targetX - pet.x;
        const dy = targetY - pet.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 6) {
          const step = Math.min(dist, 92 * dtSec);
          pet.setPosition(pet.x + (dx / dist) * step, pet.y + (dy / dist) * step);
          pet.setFlipX(dx < 0);
          const moveAnim = this.anims.exists('dragon_walk_ext')
            ? 'dragon_walk_ext'
            : 'mini_dragon_idle';
          if (pet.anims.currentAnim?.key !== moveAnim && this.anims.exists(moveAnim)) {
            pet.play(moveAnim, true);
          }
        } else {
          pet.setPosition(targetX, targetY + Math.sin(this.time.now * 0.008) * 2);
          pet.setFlipX(false);
          const workAnim = this.anims.exists('mini_dragon_idle')
            ? 'mini_dragon_idle'
            : 'dragon_walk_ext';
          if (pet.anims.currentAnim?.key !== workAnim && this.anims.exists(workAnim)) {
            pet.play(workAnim, true);
          }
          if (emitDragonFire) {
            const flame = this.add
              .circle(pet.x + 10, pet.y - 2, 3.2, 0xf97316, 0.95)
              .setDepth(forgeCenter.y + 22);
            this.tweens.add({
              targets: flame,
              x: forgeCenter.x + (Math.random() * 6 - 3),
              y: forgeCenter.y - 8 + (Math.random() * 6 - 3),
              scale: 1.5,
              alpha: 0,
              duration: 280,
              onComplete: () => flame.destroy(),
            });
          }
        }
        pet.setDepth(pet.y + 8);
        return;
      }

      if (petsSleep) {
        if (this.anims.exists('dragon_sleep_ext') && pet.anims.currentAnim?.key !== 'dragon_sleep_ext') {
          pet.play('dragon_sleep_ext', true);
        }
        return;
      }

      const nextPhase = ((pet.getData('phase') as number) ?? 0) + dtSec * (0.95 + (idx % 3) * 0.22);
      pet.setData('phase', nextPhase);
      const offsetX = Math.sin(nextPhase) * 24;
      const offsetY = Math.cos(nextPhase * 0.75) * 11;
      const desiredX = homeX + offsetX;
      const desiredY = homeY + offsetY;
      const dx = desiredX - pet.x;
      const dy = desiredY - pet.y;
      const dist = Math.hypot(dx, dy);
      const vx = dist > 18 ? dx : Math.cos(nextPhase) * 24;
      const flying = dist > 18 || Math.sin(nextPhase * 0.5) > 0.45;
      const targetAnim =
        flying && this.anims.exists('dragon_fly_side_ext')
          ? 'dragon_fly_side_ext'
          : flying && this.anims.exists('mini_dragon_idle')
          ? 'mini_dragon_idle'
          : this.anims.exists('dragon_walk_ext')
          ? 'dragon_walk_ext'
          : 'mini_dragon_idle';
      if (pet.anims.currentAnim?.key !== targetAnim && this.anims.exists(targetAnim)) {
        pet.play(targetAnim, true);
      }
      pet.setFlipX(vx < 0);
      if (dist > 18) {
        const step = Math.min(dist, 92 * dtSec);
        pet.setPosition(pet.x + (dx / dist) * step, pet.y + (dy / dist) * step);
      } else {
        pet.setPosition(desiredX, desiredY - (flying ? 6 : 0));
      }
      pet.setDepth(pet.y + 8);
    });

    const absDay = this.animalSystem.getAbsoluteDay();
    this.unicornSprites.forEach((u, idx) => {
      const sprite = u.sprite;
      if (!(sprite instanceof Phaser.GameObjects.Sprite) || !sprite.active) return;
      let homeX = sprite.getData('homeX') as number | undefined;
      let homeY = sprite.getData('homeY') as number | undefined;
      if (typeof homeX !== 'number' || typeof homeY !== 'number') {
        homeX = sprite.x;
        homeY = sprite.y;
        sprite.setData('homeX', homeX);
        sprite.setData('homeY', homeY);
        sprite.setData('phase', idx * 2.1 + 0.8);
      }
      if (petsSleep) {
        if (this.anims.exists('unicorn_sleep_ext') && sprite.anims.currentAnim?.key !== 'unicorn_sleep_ext') {
          sprite.play('unicorn_sleep_ext', true);
        }
        return;
      }
      const nextPhase = ((sprite.getData('phase') as number) ?? 0) + dtSec * (0.72 + (idx % 2) * 0.18);
      sprite.setData('phase', nextPhase);
      const pauseCycle = Math.sin(nextPhase * 0.6);
      const uData = state.unicorns.find((entry) => entry.id === u.unicornId);
      const ready = uData ? uData.lastMilkDay < absDay : false;
      if (pauseCycle > 0.35) {
        const idleAnim = ready
          ? this.anims.exists('unicorn_ready_ext')
            ? 'unicorn_ready_ext'
            : 'unicorn_ready'
          : this.anims.exists('unicorn_graze_ext')
          ? 'unicorn_graze_ext'
          : 'unicorn_idle';
        if (sprite.anims.currentAnim?.key !== idleAnim && this.anims.exists(idleAnim)) {
          sprite.play(idleAnim, true);
        }
      } else {
        const offsetX = Math.sin(nextPhase) * 26;
        const offsetY = Math.cos(nextPhase * 0.8) * 10;
        const vx = Math.cos(nextPhase);
        sprite.setFlipX(vx < 0);
        sprite.setPosition(homeX + offsetX, homeY + offsetY);
        u.tileX = Math.floor(sprite.x / TILE_SIZE);
        u.tileY = Math.floor((sprite.y + 6) / TILE_SIZE);
        const walkAnim = this.anims.exists('unicorn_walk') ? 'unicorn_walk' : 'unicorn_graze_ext';
        if (sprite.anims.currentAnim?.key !== walkAnim && this.anims.exists(walkAnim)) {
          sprite.play(walkAnim, true);
        }
      }
      sprite.setDepth(sprite.y + 8);
    });

    // Reação da fauna ambiente (pássaros e bichos fogem/voam quando o jogador se aproxima)
    for (const w of this.wildlifeSprites) {
      if (!(w instanceof Phaser.GameObjects.Sprite) || !w.active) continue;
      const prevX = (w.getData('prevX') as number | undefined) ?? w.x;
      if (Math.abs(w.x - prevX) > 0.15) {
        w.setFlipX(w.x < prevX);
      }
      w.setData('prevX', w.x);

      const dPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, w.x, w.y);
      if (dPlayer < 64 && w.anims.currentAnim?.key === 'sparrow_fly') {
        const awayAngle = Math.atan2(w.y - this.player.y, w.x - this.player.x);
        w.x += Math.cos(awayAngle) * 55 * dtSec;
        w.y += Math.sin(awayAngle) * 55 * dtSec - 18 * dtSec;
      }
    }
  }

  private spawnAmbientFireflies(): void {
    if (this.mapId !== 'fazenda' && this.mapId !== 'cidade') return;
    for (const s of this.wildlifeSprites) {
      s.destroy();
    }
    this.wildlifeSprites = [];

    const state = gameState.getState();
    const isNight = state.time.minuteOfDay >= 18 * 60 || state.time.minuteOfDay < 6 * 60;
    this.wildlifeIsNight = isNight;

    const count = this.mapId === 'fazenda' ? 24 : 12;
    const maxW = this.map.widthInPixels;
    const maxH = this.map.heightInPixels;
    const hasSheet = this.textures.exists('ambient_life_vfx_sheet');
    const hasFaunaV2 = this.textures.exists('wildlife_fauna_v2_sheet');

    for (let i = 0; i < count; i++) {
      const fx = ((i * 197 + 73) % Math.max(64, maxW - 64)) + 32;
      const fy = ((i * 131 + 59) % Math.max(64, maxH - 64)) + 32;
      if (hasFaunaV2 && i % 3 === 1) {
        const dayFauna = ['dragonfly_hover_anim', 'butterfly_v2_fly_anim', 'sparrow_peck_anim', 'squirrel_sniff_anim', 'frog_idle_anim'] as const;
        const faunaAnim = isNight ? 'owl_perch_anim' : (dayFauna[i % dayFauna.length] ?? 'butterfly_v2_fly_anim');
        if (this.anims.exists(faunaAnim)) {
          const sprite = this.add
            .sprite(fx, fy, 'wildlife_fauna_v2_sheet')
            .setDepth(faunaAnim === 'dragonfly_hover_anim' || faunaAnim === 'butterfly_v2_fly_anim' ? 4500 : fy);
          sprite.play(faunaAnim);
          this.wildlifeSprites.push(sprite);
          if (faunaAnim === 'dragonfly_hover_anim' || faunaAnim === 'butterfly_v2_fly_anim') {
            this.tweens.add({
              targets: sprite,
              x: fx + (i % 2 === 0 ? 32 : -32),
              y: fy + (i % 3 === 0 ? -16 : 14),
              duration: 2400 + (i % 4) * 400,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          }
          continue;
        }
      }
      if (hasSheet) {
        const dayAnims = ['butterfly_fly', 'sparrow_fly', 'petals_swirl'] as const;
        const animKey = isNight ? 'firefly_glow' : (dayAnims[i % dayAnims.length] ?? 'butterfly_fly');
        if (this.anims.exists(animKey)) {
          const sprite = this.add
            .sprite(fx, fy, 'ambient_life_vfx_sheet')
            .setAlpha(isNight ? 0.85 : 0.9)
            .setDepth(4500);
          sprite.play(animKey);
          this.wildlifeSprites.push(sprite);
          this.tweens.add({
            targets: sprite,
            x: fx + (i % 2 === 0 ? 28 : -28),
            y: fy + (i % 3 === 0 ? -18 : 14),
            duration: 2600 + (i % 5) * 450,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          continue;
        }
      }

      const color = i % 3 === 0 ? 0x4deeea : 0xfef08a;
      const mote = this.add.circle(fx, fy, 2, color, 0.55).setDepth(4500);
      this.tweens.add({
        targets: mote,
        x: fx + (i % 2 === 0 ? 18 : -18),
        y: fy - 14,
        alpha: 0.15,
        duration: 2400 + (i % 5) * 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private renderCasaFloorPulse(): void {
    if (this.mapId !== 'casa') return;
    if (this.questSystem.getStatus('1.2_segredo_assoalho') !== 'active') return;
    const trapPortal = this.portals.find((p) => p.targetMap === 'porao');
    if (!trapPortal) return;

    const cx = trapPortal.x + trapPortal.width / 2;
    const cy = trapPortal.y + trapPortal.height / 2;
    const ring = this.add.circle(cx, cy, 18, 0xa855f7, 0.22).setStrokeStyle(2, 0xc084fc, 0.75).setDepth(12);
    this.tweens.add({
      targets: ring,
      scale: 1.35,
      alpha: 0.08,
      duration: 950,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private checkAndTriggerStoryCutscenes(): void {
    const state = gameState.getState();

    // 1. Abertura na Fazenda (Dia 1)
    if (this.mapId === 'fazenda' && !state.flags.seen_intro_arrival) {
      state.flags.seen_intro_arrival = true;
      EventBus.emit('OPEN_DIALOGUE', {
        turns: getIntroArrivalTurns((flag) => {
          state.flags[flag] = true;
        }),
      });
      return;
    }

    // 2. Pulsações do assoalho na Casa (Missão 1.2)
    if (
      this.mapId === 'casa' &&
      this.questSystem.getStatus('1.2_segredo_assoalho') === 'active' &&
      !state.flags.seen_floor_pulse_1_2
    ) {
      state.flags.seen_floor_pulse_1_2 = true;
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      EventBus.emit('OPEN_DIALOGUE', {
        turns: getFloorPulseTurns(),
      });
      return;
    }

    // 3. Primeira aparição astral de Omena no Porão após libertar Guardião da Terra (1.5)
    if (
      this.mapId === 'porao' &&
      state.flags.earth_guardian_blessed &&
      !state.flags.seen_omena_vision_act1
    ) {
      state.flags.seen_omena_vision_act1 = true;
      const shadow = this.add.circle(7 * TILE_SIZE + 16, 6 * TILE_SIZE + 16, 22, 0xe05263, 0.38).setDepth(900);
      this.tweens.add({
        targets: shadow,
        scale: 1.4,
        alpha: 0.15,
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'portal' });
      EventBus.emit('OPEN_DIALOGUE', {
        turns: getOmenaVisionAct1Turns(),
        onComplete: () => {
          shadow.destroy();
        },
      });
      return;
    }

    // 4. Ultimato de Omena no Porão após concluir Ato II (2.4)
    if (
      this.mapId === 'porao' &&
      state.flags.act2_completed &&
      !state.flags.seen_omena_ultimatum_act2
    ) {
      state.flags.seen_omena_ultimatum_act2 = true;
      const rift = this.add.circle(7 * TILE_SIZE + 16, 6 * TILE_SIZE + 16, 26, 0x9333ea, 0.45).setDepth(900);
      this.tweens.add({
        targets: rift,
        scale: 1.5,
        alpha: 0.2,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'portal' });
      EventBus.emit('OPEN_DIALOGUE', {
        turns: getOmenaUltimatumAct2Turns(),
        onComplete: () => {
          rift.destroy();
        },
      });
    }
  }

  private renderMapNpcs(): void {
    const state = gameState.getState();
    const placements = this.npcSystem.getNpcsForMap(this.mapId, state.time.minuteOfDay);

    for (const placement of placements) {
      const sprite = new NPC(this, placement.tileX, placement.tileY, placement.npc);
      this.physics.add.collider(this.player, sprite);
      this.npcSprites.push(sprite);
    }

    if (this.mapId === 'cidade') {
      const bx = 9 * TILE_SIZE + TILE_SIZE / 2;
      const by = 14 * TILE_SIZE - 8;
      this.add
        .text(bx, by, 'Quadro de Avisos [E]', {
          fontSize: '10px',
          color: '#f5b942',
          backgroundColor: 'rgba(20, 18, 29, 0.85)',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(2000);
    }

    this.refreshNpcIndicators();
  }

  private refreshNpcIndicators(): void {
    for (const npc of this.npcSprites) {
      npc.setQuestIndicator(this.questSystem.getNpcQuestIndicator(npc.npcDef.id));
    }
  }

  private findInteractablePortal(targetX: number, targetY: number): PortalTrigger | null {
    const feet = this.player.getFeetWorldPosition();
    const targetCenter = this.gridSystem.tileToWorldCenter(targetX, targetY);

    for (const portal of this.portals) {
      const targetInside =
        targetCenter.x >= portal.x &&
        targetCenter.x <= portal.x + portal.width &&
        targetCenter.y >= portal.y &&
        targetCenter.y <= portal.y + portal.height;
      const feetInside =
        feet.x >= portal.x &&
        feet.x <= portal.x + portal.width &&
        feet.y >= portal.y &&
        feet.y <= portal.y + portal.height;

      if (targetInside || feetInside) {
        return portal;
      }
    }

    const margin = 20;
    for (const portal of this.portals) {
      const nearPortal =
        feet.x >= portal.x - margin &&
        feet.x <= portal.x + portal.width + margin &&
        feet.y >= portal.y - margin &&
        feet.y <= portal.y + portal.height + margin;
      if (nearPortal) {
        return portal;
      }
    }

    return null;
  }

  private updatePortalPrompt(targetX: number, targetY: number): void {
    if (!this.portalPromptText) return;
    if (this.isTransitioning || this.isDialogueOpen) {
      this.portalPromptText.setVisible(false);
      return;
    }

    const portal = this.findInteractablePortal(targetX, targetY);
    if (!portal) {
      this.portalPromptText.setVisible(false);
      return;
    }

    const feet = this.player.getFeetWorldPosition();
    const promptX = Phaser.Math.Clamp(
      portal.x + portal.width / 2,
      74,
      Math.max(74, this.map.widthInPixels - 74)
    );
    const promptY =
      portal.height > TILE_SIZE
        ? Math.max(20, feet.y - 28)
        : Math.max(18, portal.y - 12);

    this.portalPromptText
      .setText(`[E] ${portal.label}`)
      .setPosition(promptX, promptY)
      .setVisible(true);
  }

  private transitionTo(portal: PortalTrigger): void {
    this.isTransitioning = true;
    this.portalPromptText?.setVisible(false);
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'portal' });
    EventBus.emit('SHOW_TOAST', { message: portal.label, kind: 'info' });

    this.cameras.main.fadeOut(200, 20, 18, 29);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({
        mapId: portal.targetMap,
        spawnTileX: portal.targetTileX,
        spawnTileY: portal.targetTileY,
      });
    });
  }
}

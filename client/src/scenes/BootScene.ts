import Phaser from 'phaser';
import { TILE_SIZE } from '../config/gameConfig';
import {
  COMPANION_FRAMES,
  CREATURES_FIRE_FRAMES,
  MODULAR_BUILDING_FRAMES,
  INTERIOR_FRAMES,
  NATURE_EXTENDED_FRAMES,
  DUNGEON_DETAIL_FRAMES,
  NPC_ACTIVITY_PART2_ROWS,
  NPC_ACTIVITY_ROWS,
  NPC_SHEET_COLS,
} from '../config/spriteSheets';
import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getNpcList } from '../data/npcs';
import type { CardinalDirection } from '../systems/GridSystem';

function paintTile(
  gidIndex: number,
  draw: (x: number, y: number) => void
): void {
  const col = gidIndex % 8;
  const row = Math.floor(gidIndex / 8);
  draw(col * TILE_SIZE, row * TILE_SIZE);
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.tilemapTiledJSON('fazenda', '/assets/maps/fazenda.json');
    this.load.tilemapTiledJSON('casa', '/assets/maps/casa.json');
    this.load.tilemapTiledJSON('porao', '/assets/maps/porao.json');
    this.load.tilemapTiledJSON('arena_terra', '/assets/maps/arena_terra.json');
    this.load.tilemapTiledJSON('arena_aguas', '/assets/maps/arena_aguas.json');
    this.load.tilemapTiledJSON('arena_ceus', '/assets/maps/arena_ceus.json');
    this.load.tilemapTiledJSON('arena_omena', '/assets/maps/arena_omena.json');
    this.load.tilemapTiledJSON('cidade', '/assets/maps/cidade.json');
    this.load.tilemapTiledJSON('ferraria', '/assets/maps/ferraria.json');
    this.load.tilemapTiledJSON('botica', '/assets/maps/botica.json');
    this.load.tilemapTiledJSON('pub_pedra', '/assets/maps/pub_pedra.json');

    this.load.image('sao_tome_tileset', '/assets/tilesets/sao_tome_tileset.png');
    this.load.image('machu_picchu_tileset', '/assets/tilesets/machu_picchu_tileset.png');
    this.load.image('chapada_tileset', '/assets/tilesets/chapada_tileset.png');
    this.load.image('varginha_tileset', '/assets/tilesets/varginha_tileset.png');
    this.load.image('soil_tilled', '/assets/sprites/soil_tilled.png');
    this.load.image('soil_watered', '/assets/sprites/soil_watered.png');

    this.load.spritesheet('player_sheet', '/assets/sprites/player.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('npcs_sheet', '/assets/sprites/npcs.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('companions_sheet', '/assets/sprites/companions.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('creatures_fire_sheet', '/assets/sprites/creatures_fire.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('enemy_golem_sheet', '/assets/sprites/enemy_golem.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('enemy_wisp_sheet', '/assets/sprites/enemy_wisp.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('boss_earth_guardian_sheet', '/assets/sprites/boss_earth_guardian.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('enemy_serpente_sheet', '/assets/sprites/enemy_serpente.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('enemy_sonda_sheet', '/assets/sprites/enemy_sonda.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('boss_water_guardian_sheet', '/assets/sprites/boss_water_guardian.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('boss_sky_guardian_sheet', '/assets/sprites/boss_sky_guardian.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('pet_unicornio_sheet', '/assets/sprites/pet_unicornio.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('world_objects_sheet', '/assets/sprites/world_objects.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('crops_sheet', '/assets/sprites/crops_sheet.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('crystal_pillars_sheet', '/assets/sprites/crystal_pillars.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('combat_vfx_a_sheet', '/assets/sprites/combat_vfx_a.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('items_icons_sheet', '/assets/sprites/items_icons.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('combat_vfx_b_sheet', '/assets/sprites/combat_vfx_b.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('enemy_sentinela_sheet', '/assets/sprites/enemy_sentinela_omena.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('boss_omena_sheet', '/assets/sprites/boss_omena.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('omena_world_props_sheet', '/assets/sprites/omena_world_props.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('player_idle_sprint_sheet', '/assets/sprites/player_idle_sprint.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('player_tools_side_sheet', '/assets/sprites/player_tools_side.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('player_tools_vertical_sheet', '/assets/sprites/player_tools_vertical.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('player_empty_hands_sheet', '/assets/sprites/player_empty_hands_base.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('tools_vfx_sheet', '/assets/sprites/tools_vfx.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('ambient_life_vfx_sheet', '/assets/sprites/ambient_life_vfx.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('npcs_activities_sheet', '/assets/sprites/npcs_activities.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('pets_extended_sheet', '/assets/sprites/pets_extended.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('buildings_modular_sheet', '/assets/tilesets/sao_tome_buildings_modular.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.spritesheet('interiors_sheet', '/assets/tilesets/sao_tome_interiors.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.spritesheet('nature_extended_sheet', '/assets/tilesets/sao_tome_nature_extended.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.spritesheet('dungeons_details_sheet', '/assets/tilesets/dungeons_details.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });

    // Lotes v2: Movimentação de NPCs, Atividades, Inimigos/Chefes Ext, Companheiros, Pets, Fauna e Bancadas
    for (const npcId of [
      'celeste',
      'bento',
      'isis',
      'lyra',
      'seu_zeca',
      'prefeito_arlindo',
      'seu_damiao',
      'rafael',
    ]) {
      this.load.spritesheet(`npc_${npcId}_move_sheet`, `/assets/sprites/npc_${npcId}_move.png`, {
        frameWidth: 48,
        frameHeight: 48,
      });
    }
    this.load.spritesheet('npcs_activities_part2_sheet', '/assets/sprites/npcs_activities_part2.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('enemies_earth_ext_sheet', '/assets/sprites/enemies_earth_ext.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('enemies_crystal_sky_ext_sheet', '/assets/sprites/enemies_crystal_sky_ext.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('enemies_omena_ext_sheet', '/assets/sprites/enemies_omena_ext.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('boss_earth_guardian_ext_sheet', '/assets/sprites/boss_earth_guardian_ext.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('bosses_elemental_ext_sheet', '/assets/sprites/bosses_elemental_ext.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('boss_omena_ext_sheet', '/assets/sprites/boss_omena_ext.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('companions_ext_sheet', '/assets/sprites/companions_ext.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('pets_movement_ext_sheet', '/assets/sprites/pets_movement_ext.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('wildlife_fauna_v2_sheet', '/assets/sprites/wildlife_fauna_v2.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('workbenches_animated_sheet', '/assets/sprites/workbenches_animated.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('props_living_v2_sheet', '/assets/sprites/props_living_v2.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create(): void {
    this.createProceduralTileset();
    this.createProceduralPlayerSprites();
    this.createProceduralNpcSprites();
    this.createProceduralFarmAndCreatureSprites();
    this.createProceduralCombatSprites();
    this.createCursorTexture();
    this.createToolAndStaffTextures();
    this.registerSpriteAnimations();

    const state = gameState.getState();
    EventBus.emit('GAME_READY', { state });
    this.scene.start('WorldScene', { mapId: state.mapId });
  }

  private createProceduralTileset(): void {
    if (this.textures.exists('sao_tome_tileset')) return;

    const canvasTex = this.textures.createCanvas('sao_tome_tileset', 256, 128);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    const fillGrassBg = (x: number, y: number) => {
      ctx.fillStyle = '#487a4b';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#538a56';
      ctx.fillRect(x + 2, y + 4, 4, 2);
      ctx.fillRect(x + 18, y + 10, 5, 2);
      ctx.fillRect(x + 8, y + 22, 4, 2);
      ctx.fillRect(x + 23, y + 26, 4, 2);
      ctx.fillStyle = '#3b663e';
      ctx.fillRect(x + 12, y + 14, 2, 3);
      ctx.fillRect(x + 26, y + 5, 2, 3);
    };

    const fillBase = (idx: number, color: string, accent?: string) => {
      paintTile(idx, (x, y) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        if (accent) {
          ctx.fillStyle = accent;
          ctx.fillRect(x + 4, y + 6, 4, 4);
          ctx.fillRect(x + 20, y + 18, 4, 4);
        }
      });
    };

    // Row 0 (GIDs 1..8)
    paintTile(0, (x, y) => {
      // 1: Grama da serra
      fillGrassBg(x, y);
    });
    paintTile(1, (x, y) => {
      // 2: Grama com flores silvestres
      fillGrassBg(x, y);
      for (const [fx, fy, c] of [
        [6, 7, '#c084fc'],
        [20, 12, '#fde047'],
        [10, 22, '#f8fafc'],
        [22, 24, '#a78bfa'],
      ] as const) {
        ctx.fillStyle = '#2d5230';
        ctx.fillRect(x + fx, y + fy + 3, 2, 3);
        ctx.fillStyle = c;
        ctx.fillRect(x + fx - 1, y + fy, 4, 3);
        ctx.fillRect(x + fx, y + fy - 1, 2, 4);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + fx, y + fy, 2, 2);
      }
    });
    paintTile(2, (x, y) => {
      // 3: Caminho de quartzo (lajes irregulares)
      ctx.fillStyle = '#9a8468';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#bfa888';
      ctx.fillRect(x + 2, y + 2, 13, 12);
      ctx.fillRect(x + 17, y + 3, 13, 10);
      ctx.fillRect(x + 3, y + 16, 11, 13);
      ctx.fillRect(x + 16, y + 15, 14, 14);
      ctx.fillStyle = '#d8c5a8';
      ctx.fillRect(x + 3, y + 3, 10, 3);
      ctx.fillRect(x + 18, y + 4, 9, 2);
      ctx.fillRect(x + 17, y + 16, 10, 3);
    });
    paintTile(3, (x, y) => {
      // 4: Água mística com reflexos
      ctx.fillStyle = '#225999';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#2b6cb0';
      ctx.fillRect(x + 2, y + 2, 28, 28);
      ctx.fillStyle = '#63b3ed';
      ctx.fillRect(x + 5, y + 8, 10, 2);
      ctx.fillRect(x + 16, y + 17, 11, 2);
      ctx.fillRect(x + 7, y + 25, 8, 2);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(x + 8, y + 8, 4, 1);
      ctx.fillRect(x + 20, y + 17, 4, 1);
    });
    paintTile(4, (x, y) => {
      // 5: Solo arável
      ctx.fillStyle = '#5c7c4a';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#708f57';
      ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      ctx.fillStyle = '#5a7343';
      ctx.fillRect(x + 5, y + 7, 3, 2);
      ctx.fillRect(x + 21, y + 14, 3, 2);
      ctx.fillRect(x + 11, y + 24, 3, 2);
    });
    paintTile(5, (x, y) => {
      // 6: Assoalho de madeira
      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#70472a';
      ctx.fillRect(x, y + 7, TILE_SIZE, 1);
      ctx.fillRect(x, y + 15, TILE_SIZE, 1);
      ctx.fillRect(x, y + 23, TILE_SIZE, 1);
      ctx.fillRect(x, y + 31, TILE_SIZE, 1);
      ctx.fillRect(x + 12, y, 1, 8);
      ctx.fillRect(x + 24, y + 8, 1, 8);
      ctx.fillRect(x + 8, y + 16, 1, 8);
      ctx.fillRect(x + 20, y + 24, 1, 8);
      ctx.fillStyle = '#9f6f49';
      ctx.fillRect(x + 2, y + 2, 8, 2);
      ctx.fillRect(x + 14, y + 18, 10, 2);
    });
    paintTile(6, (x, y) => {
      // 7: Piso pedra porão
      ctx.fillStyle = '#252133';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#342f47';
      ctx.fillRect(x + 1, y + 1, 14, 14);
      ctx.fillRect(x + 17, y + 1, 14, 14);
      ctx.fillRect(x + 1, y + 17, 14, 14);
      ctx.fillRect(x + 17, y + 17, 14, 14);
      ctx.fillStyle = '#443e5c';
      ctx.fillRect(x + 2, y + 2, 11, 2);
      ctx.fillRect(x + 18, y + 18, 11, 2);
    });
    paintTile(7, (x, y) => {
      // 8: Tapete místico
      ctx.fillStyle = '#6f324b';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#8b4360';
      ctx.fillRect(x + 3, y + 3, 26, 26);
      ctx.strokeStyle = '#d69e2e';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, 22, 22);
    });

    // Row 1 (GIDs 9..16)
    paintTile(8, (x, y) => {
      // 9: Parede casa com janela acolhedora
      ctx.fillStyle = '#cfc5b4';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#5a3a24';
      ctx.fillRect(x, y, TILE_SIZE, 3);
      ctx.fillRect(x, y + 28, TILE_SIZE, 4);
      ctx.fillStyle = '#8b8378';
      ctx.fillRect(x + 6, y + 8, 20, 14);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(x + 8, y + 10, 7, 10);
      ctx.fillRect(x + 17, y + 10, 7, 10);
      ctx.fillStyle = '#5a3a24';
      ctx.fillRect(x + 15, y + 8, 2, 14);
    });
    paintTile(9, (x, y) => {
      // 10: Telhado em telhas
      ctx.fillStyle = '#7c3f2c';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#5b2c1e';
      for (let ry = 4; ry < TILE_SIZE; ry += 7) {
        ctx.fillRect(x, y + ry, TILE_SIZE, 2);
      }
      ctx.fillStyle = '#9b523b';
      ctx.fillRect(x + 2, y + 1, 28, 3);
      ctx.fillRect(x + 4, y + 9, 24, 2);
      ctx.fillRect(x + 2, y + 16, 26, 2);
    });
    fillBase(10, '#433d57', '#2f2a3e'); // 11: Parede interna
    paintTile(11, (x, y) => {
      // 12: Cerca de madeira sobre grama
      fillGrassBg(x, y);
      ctx.fillStyle = '#54351c';
      ctx.fillRect(x + 4, y + 7, 6, 21);
      ctx.fillRect(x + 22, y + 7, 6, 21);
      ctx.fillStyle = '#7c512f';
      ctx.fillRect(x + 5, y + 8, 4, 18);
      ctx.fillRect(x + 23, y + 8, 4, 18);
      ctx.fillRect(x, y + 12, TILE_SIZE, 4);
      ctx.fillRect(x, y + 20, TILE_SIZE, 4);
      ctx.fillStyle = '#9a6840';
      ctx.fillRect(x + 1, y + 12, TILE_SIZE - 2, 1);
      ctx.fillRect(x + 1, y + 20, TILE_SIZE - 2, 1);
    });
    paintTile(12, (x, y) => {
      // 13: Árvore frondosa com sombra e copa dupla
      fillGrassBg(x, y);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(x + 5, y + 24, 22, 6);
      ctx.fillStyle = '#4e311c';
      ctx.fillRect(x + 12, y + 16, 8, 13);
      ctx.fillStyle = '#6b4428';
      ctx.fillRect(x + 14, y + 17, 3, 11);
      ctx.fillStyle = '#1e4625';
      ctx.fillRect(x + 3, y + 5, 26, 17);
      ctx.fillStyle = '#2d6336';
      ctx.fillRect(x + 5, y + 3, 22, 16);
      ctx.fillStyle = '#40824a';
      ctx.fillRect(x + 7, y + 4, 14, 9);
      ctx.fillStyle = '#68b06e';
      ctx.fillRect(x + 9, y + 5, 6, 4);
    });
    paintTile(13, (x, y) => {
      // 14: Rocha de quartzo cristalino
      fillGrassBg(x, y);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x + 5, y + 24, 22, 5);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + 5, y + 9, 22, 17);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 7, y + 7, 18, 15);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x + 10, y + 9, 8, 7);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(x + 19, y + 11, 4, 5);
    });
    paintTile(14, (x, y) => {
      // 15: Porta de madeira arqueada
      ctx.fillStyle = '#8b8378';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#4a2c18';
      ctx.fillRect(x + 4, y + 2, 24, 29);
      ctx.fillStyle = '#6e4527';
      ctx.fillRect(x + 6, y + 4, 20, 26);
      ctx.fillStyle = '#4a2c18';
      ctx.fillRect(x + 15, y + 4, 2, 26);
      ctx.fillStyle = '#f5b942';
      ctx.fillRect(x + 20, y + 15, 4, 4);
    });
    paintTile(15, (x, y) => {
      // 16: Alçapão / Escada com brilho arcano
      ctx.fillStyle = '#6f472b';
      ctx.fillRect(x + 2, y + 2, 28, 28);
      ctx.fillStyle = '#1f1b2e';
      ctx.fillRect(x + 6, y + 6, 20, 20);
      ctx.fillStyle = '#4deeea';
      ctx.fillRect(x + 13, y + 13, 6, 6);
    });

    // Row 2 (GIDs 17..24)
    paintTile(16, (x, y) => {
      // 17: Cama
      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(x + 2, y + 2, 28, 28);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + 4, y + 4, 24, 8);
      ctx.fillStyle = '#5e6ad2';
      ctx.fillRect(x + 4, y + 12, 24, 16);
    });
    paintTile(17, (x, y) => {
      // 18: Caixa de Remessas
      fillGrassBg(x, y);
      ctx.fillStyle = '#6e441c';
      ctx.fillRect(x + 3, y + 5, 26, 24);
      ctx.fillStyle = '#9c6631';
      ctx.fillRect(x + 5, y + 7, 22, 19);
      ctx.fillStyle = '#f5b942';
      ctx.fillRect(x + 5, y + 11, 22, 3);
      ctx.fillRect(x + 14, y + 12, 4, 5);
    });
    paintTile(18, (x, y) => {
      // 19: Altar de Lupin / Fonte dos Números
      ctx.fillStyle = '#4a4366';
      ctx.fillRect(x + 3, y + 4, 26, 24);
      ctx.fillStyle = '#4deeea';
      ctx.fillRect(x + 9, y + 9, 14, 10);
      ctx.fillStyle = '#f5b942';
      ctx.fillRect(x + 12, y + 11, 8, 6);
    });
    paintTile(19, (x, y) => {
      // 20: Pedestal de Portal Quebrado
      ctx.fillStyle = '#3c364f';
      ctx.fillRect(x + 2, y + 2, 28, 28);
      ctx.fillStyle = '#7e8ce0';
      ctx.fillRect(x + 8, y + 6, 16, 4);
      ctx.fillRect(x + 8, y + 22, 16, 4);
    });
    paintTile(20, (x, y) => {
      // 21: Ninho dos 3 Ovos de Mini-Dragão
      ctx.fillStyle = '#5b4430';
      ctx.fillRect(x + 2, y + 6, 28, 22);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 6, y + 10, 6, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + 13, y + 12, 6, 8);
      ctx.fillRect(x + 20, y + 10, 6, 8);
    });
    paintTile(21, (x, y) => {
      // 22: Mesa / Bancada
      ctx.fillStyle = '#6f4826';
      ctx.fillRect(x + 2, y + 6, 28, 22);
      ctx.fillStyle = '#a47449';
      ctx.fillRect(x + 3, y + 6, 26, 14);
      ctx.fillStyle = '#4deeea';
      ctx.fillRect(x + 8, y + 9, 5, 6);
      ctx.fillStyle = '#f5b942';
      ctx.fillRect(x + 18, y + 10, 7, 4);
    });
    paintTile(22, (x, y) => {
      // 23: Ponte de madeira com corrimão
      ctx.fillStyle = '#225999';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#7d532f';
      ctx.fillRect(x + 1, y, 30, TILE_SIZE);
      ctx.fillStyle = '#a47449';
      for (let py = 1; py < TILE_SIZE; py += 6) {
        ctx.fillRect(x + 3, y + py, 26, 4);
      }
      ctx.fillStyle = '#5c3b1e';
      ctx.fillRect(x + 1, y, 3, TILE_SIZE);
      ctx.fillRect(x + 28, y, 3, TILE_SIZE);
    });
    paintTile(23, (x, y) => {
      // 24: Placa de sinalização
      fillGrassBg(x, y);
      ctx.fillStyle = '#6b4428';
      ctx.fillRect(x + 14, y + 16, 4, 14);
      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(x + 4, y + 5, 24, 13);
      ctx.fillStyle = '#e6c79c';
      ctx.fillRect(x + 6, y + 7, 20, 9);
      ctx.fillStyle = '#5c3b1e';
      ctx.fillRect(x + 8, y + 9, 14, 2);
      ctx.fillRect(x + 8, y + 12, 10, 2);
    });

    // Row 3 (GIDs 25..32)
    fillBase(24, '#7d5636', '#664328'); // 25: Terra arada seca
    fillBase(25, '#4c321e', '#3a2414'); // 26: Terra arada regada
    paintTile(26, (x, y) => {
      // 27: Runa arcana no chão
      ctx.fillStyle = '#2b273a';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#4deeea';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 6, y + 6, 20, 20);
      ctx.fillStyle = '#a78bfa';
      ctx.fillRect(x + 14, y + 14, 4, 4);
    });
    fillBase(27, '#756f66', '#5e5850'); // 28: Piso inca Machu Picchu
    fillBase(28, '#4a453f', '#2f2b27'); // 29: Parede granito inca
    paintTile(29, (x, y) => {
      // 30: Armadilha de espinhos incas
      ctx.fillStyle = '#756f66';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#e05263';
      ctx.fillRect(x + 6, y + 6, 5, 5);
      ctx.fillRect(x + 21, y + 6, 5, 5);
      ctx.fillRect(x + 6, y + 21, 5, 5);
      ctx.fillRect(x + 21, y + 21, 5, 5);
    });
    paintTile(30, (x, y) => {
      // 31: Veio de minério (cobre & quartzo)
      fillGrassBg(x, y);
      ctx.fillStyle = '#3f3a35';
      ctx.fillRect(x + 3, y + 7, 26, 20);
      ctx.fillStyle = '#5c554d';
      ctx.fillRect(x + 5, y + 5, 22, 18);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x + 8, y + 10, 6, 6);
      ctx.fillRect(x + 19, y + 17, 5, 5);
      ctx.fillStyle = '#4deeea';
      ctx.fillRect(x + 17, y + 8, 6, 6);
      ctx.fillStyle = '#cffafe';
      ctx.fillRect(x + 19, y + 9, 2, 2);
    });
    paintTile(31, (x, y) => {
      // 32: Escada / Portal de descida
      ctx.fillStyle = '#332f2b';
      ctx.fillRect(x + 2, y + 2, 28, 28);
      ctx.fillStyle = '#a89f91';
      ctx.fillRect(x + 6, y + 7, 20, 4);
      ctx.fillRect(x + 6, y + 14, 20, 4);
      ctx.fillRect(x + 6, y + 21, 20, 4);
    });

    canvasTex.refresh();
  }

  private createProceduralPlayerSprites(): void {
    const dirs: CardinalDirection[] = ['down', 'up', 'left', 'right'];
    for (const dir of dirs) {
      for (const isWalk of [false, true]) {
        const key = isWalk ? `player_${dir}_walk` : `player_${dir}`;
        if (this.textures.exists(key)) continue;

        const g = this.make.graphics({ x: 0, y: 0 });
        const bobY = isWalk ? -1 : 0;
        // Sombra nos pés
        g.fillStyle(0x000000, 0.35);
        g.fillEllipse(16, 29, 18, 6);
        // Botas (passo alternado no frame de caminhada)
        g.fillStyle(0x4a2c18, 1);
        g.fillRect(10, isWalk ? 24 : 25, 4, 4);
        g.fillRect(18, isWalk ? 26 : 25, 4, 4);
        // Túnica de bruxo-fazendeiro
        g.fillStyle(0x2f5a44, 1);
        g.fillRect(8, 14 + bobY, 16, 12);
        g.fillStyle(0x3f7558, 1);
        g.fillRect(10, 14 + bobY, 12, 10);
        // Cinto dourado
        g.fillStyle(0xf5b942, 1);
        g.fillRect(9, 21 + bobY, 14, 2);
        // Cabeça
        g.fillStyle(0xf2c9a0, 1);
        g.fillRect(10, 6 + bobY, 12, 9);
        // Chapéu / capuz de bruxo acolhedor
        g.fillStyle(0x352d52, 1);
        g.fillRect(7, 5 + bobY, 18, 3);
        g.fillRect(10, 1 + bobY, 12, 5);
        g.fillStyle(0x4deeea, 1);
        g.fillRect(10, 5 + bobY, 12, 1);
        // Olhos / indicador de direção
        g.fillStyle(0x14121d, 1);
        if (dir === 'down') {
          g.fillRect(12, 10 + bobY, 2, 2);
          g.fillRect(18, 10 + bobY, 2, 2);
        } else if (dir === 'left') {
          g.fillRect(11, 10 + bobY, 2, 2);
        } else if (dir === 'right') {
          g.fillRect(19, 10 + bobY, 2, 2);
        } else {
          g.fillStyle(0x4deeea, 1);
          g.fillRect(14, 16 + bobY, 4, 4);
        }
        g.generateTexture(key, TILE_SIZE, TILE_SIZE);
        g.destroy();
      }
    }
  }

  private createCursorTexture(): void {
    if (!this.textures.exists('tile_cursor')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.lineStyle(2, 0x4deeea, 0.9);
      g.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
      g.generateTexture('tile_cursor', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('camera_glint')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(8, 11, 16, 11);
      g.fillStyle(0x4deeea, 1);
      g.fillCircle(16, 16, 3);
      g.generateTexture('camera_glint', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }
  }

  private createToolAndStaffTextures(): void {
    const drawHandle = (g: Phaser.GameObjects.Graphics, color = 0x8b5e3c) => {
      g.lineStyle(3, 0x14121d, 1);
      g.lineBetween(4, 20, 17, 7);
      g.lineStyle(2, color, 1);
      g.lineBetween(4, 20, 17, 7);
    };

    const specs: Array<{ key: string; draw: (g: Phaser.GameObjects.Graphics) => void }> = [
      {
        key: 'item_hand_enxada_antiga',
        draw: (g) => {
          drawHandle(g);
          g.fillStyle(0x94a3b8, 1);
          g.fillRect(13, 3, 7, 3);
          g.fillRect(18, 5, 2, 5);
        },
      },
      {
        key: 'item_hand_regador_simples',
        draw: (g) => {
          g.fillStyle(0x64748b, 1);
          g.fillRect(6, 10, 10, 9);
          g.fillRect(16, 8, 5, 4);
          g.fillStyle(0x4deeea, 1);
          g.fillCircle(21, 9, 2);
        },
      },
      {
        key: 'item_hand_picareta_simples',
        draw: (g) => {
          drawHandle(g);
          g.fillStyle(0xcbd5e1, 1);
          g.fillRect(11, 3, 10, 3);
          g.fillStyle(0x4deeea, 1);
          g.fillRect(19, 6, 3, 3);
        },
      },
      {
        key: 'item_hand_machado_simples',
        draw: (g) => {
          drawHandle(g);
          g.fillStyle(0xe2e8f0, 1);
          g.fillRect(13, 3, 7, 7);
        },
      },
      {
        key: 'item_hand_vara_pesca_simples',
        draw: (g) => {
          drawHandle(g, 0xc29b61);
          g.lineStyle(1, 0xe2e8f0, 0.9);
          g.lineBetween(17, 7, 19, 19);
          g.fillStyle(0x4deeea, 1);
          g.fillCircle(19, 20, 2);
        },
      },
      {
        key: 'item_hand_cajado_aprendiz',
        draw: (g) => {
          drawHandle(g, 0x8b5e3c);
          g.fillStyle(0x4deeea, 1);
          g.fillCircle(18, 6, 4);
        },
      },
      {
        key: 'item_hand_cajado_quartzo_terra',
        draw: (g) => {
          drawHandle(g, 0xb45309);
          g.fillStyle(0xf5b942, 1);
          g.fillCircle(18, 6, 4);
        },
      },
      {
        key: 'item_hand_cajado_arcano_estelar',
        draw: (g) => {
          drawHandle(g, 0x4338ca);
          g.fillStyle(0xc084fc, 1);
          g.fillCircle(18, 6, 4);
        },
      },
      {
        key: 'item_hand_cetro_nucleo_mundo',
        draw: (g) => {
          drawHandle(g, 0xf59e0b);
          g.fillStyle(0x4deeea, 1);
          g.fillCircle(18, 6, 5);
          g.fillStyle(0xfef08a, 1);
          g.fillCircle(18, 6, 2);
        },
      },
    ];

    for (const spec of specs) {
      if (this.textures.exists(spec.key)) continue;
      const g = this.make.graphics({ x: 0, y: 0 });
      spec.draw(g);
      g.generateTexture(spec.key, 24, 24);
      g.destroy();
    }
  }

  private createProceduralNpcSprites(): void {
    for (const npc of getNpcList()) {
      const key = `npc_${npc.id}`;
      if (this.textures.exists(key)) continue;

      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x000000, 0.35);
      g.fillEllipse(16, 28, 18, 7);
      g.fillStyle(npc.bodyColor, 1);
      g.fillRect(9, 13, 14, 14);
      g.fillStyle(0xf2c9a0, 1);
      g.fillRect(10, 4, 12, 10);
      g.fillStyle(0x1f1b2e, 1);
      g.fillRect(9, 3, 14, 4);
      g.fillRect(12, 9, 2, 2);
      g.fillRect(18, 9, 2, 2);
      g.generateTexture(key, TILE_SIZE, TILE_SIZE);
      g.destroy();
    }
  }

  private createProceduralFarmAndCreatureSprites(): void {
    if (!this.textures.exists('soil_tilled')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x7d5636, 1);
      g.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      g.fillStyle(0x5e3e24, 1);
      g.fillRect(5, 8, 22, 3);
      g.fillRect(5, 16, 22, 3);
      g.fillRect(5, 24, 22, 3);
      g.generateTexture('soil_tilled', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('soil_watered')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x4a2f1b, 1);
      g.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      g.fillStyle(0x362010, 1);
      g.fillRect(5, 8, 22, 3);
      g.fillRect(5, 16, 22, 3);
      g.fillRect(5, 24, 22, 3);
      g.generateTexture('soil_watered', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    // Estágios de crescimento 0..3
    const stageRadii = [3, 6, 9, 12];
    stageRadii.forEach((radius, idx) => {
      const key = `crop_stage_${idx}`;
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3b8c47, 1);
      g.fillCircle(16, 20, radius);
      if (idx >= 3) {
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(16, 12, 5);
      }
      g.generateTexture(key, TILE_SIZE, TILE_SIZE);
      g.destroy();
    });

    if (!this.textures.exists('obj_incubadora_arcana')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x4b4466, 1);
      g.fillRect(4, 6, 24, 22);
      g.fillStyle(0x4deeea, 0.85);
      g.fillCircle(16, 15, 7);
      g.lineStyle(2, 0xf5b942, 1);
      g.strokeRect(4, 6, 24, 22);
      g.generateTexture('obj_incubadora_arcana', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('obj_bancada_fundicao')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x524b5c, 1);
      g.fillRect(3, 6, 26, 22);
      g.fillStyle(0xef4444, 1);
      g.fillRect(9, 14, 14, 10);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(12, 16, 8, 6);
      g.generateTexture('obj_bancada_fundicao', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('companion_remo')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x1b1726, 1);
      g.fillEllipse(16, 19, 14, 12);
      g.fillCircle(16, 11, 6);
      // Orelhas
      g.fillTriangle(10, 9, 12, 3, 15, 7);
      g.fillTriangle(17, 7, 20, 3, 22, 9);
      // Olhos brilhantes estilo Cheshire
      g.fillStyle(0xf5b942, 1);
      g.fillRect(13, 10, 2, 2);
      g.fillRect(18, 10, 2, 2);
      // Sorriso irônico
      g.fillStyle(0xa78bfa, 1);
      g.fillRect(14, 13, 5, 1);
      g.generateTexture('companion_remo', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('pet_mini_dragao')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xd9463e, 1);
      g.fillEllipse(16, 19, 16, 12);
      g.fillCircle(16, 12, 6);
      // Asinhas cobre
      g.fillStyle(0xf59e0b, 1);
      g.fillTriangle(4, 15, 11, 13, 10, 20);
      g.fillTriangle(28, 15, 21, 13, 22, 20);
      // Olhos e fagulha
      g.fillStyle(0xfef08a, 1);
      g.fillRect(14, 11, 2, 2);
      g.fillRect(18, 11, 2, 2);
      g.generateTexture('pet_mini_dragao', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('obj_bancada_encantamento')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x312e4a, 1);
      g.fillRect(4, 8, 24, 20);
      g.lineStyle(2, 0xc084fc, 1);
      g.strokeRect(4, 8, 24, 20);
      g.fillStyle(0x4deeea, 1);
      g.fillTriangle(16, 3, 10, 16, 22, 16);
      g.fillStyle(0xf5b942, 1);
      g.fillRect(9, 20, 14, 3);
      g.generateTexture('obj_bancada_encantamento', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('pet_unicornio')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(16, 28, 18, 6);
      // Corpo perolado
      g.fillStyle(0xf8fafc, 1);
      g.fillEllipse(16, 19, 16, 11);
      g.fillCircle(12, 12, 6);
      // Crina mística lilás/ciano
      g.fillStyle(0xc084fc, 1);
      g.fillRect(14, 9, 5, 6);
      g.fillStyle(0x4deeea, 1);
      g.fillRect(21, 17, 5, 4);
      // Chifre dourado
      g.fillStyle(0xf5b942, 1);
      g.fillTriangle(9, 8, 11, 1, 13, 8);
      // Olho
      g.fillStyle(0x1f1b2e, 1);
      g.fillRect(9, 11, 2, 2);
      g.generateTexture('pet_unicornio', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }
  }

  private createProceduralCombatSprites(): void {
    if (!this.textures.exists('enemy_golem_pedra')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x6b6661, 1);
      g.fillRect(5, 6, 22, 22);
      g.fillStyle(0x4d7c4f, 1);
      g.fillRect(7, 5, 18, 5);
      g.fillStyle(0xe05263, 1);
      g.fillRect(10, 12, 4, 4);
      g.fillRect(18, 12, 4, 4);
      g.generateTexture('enemy_golem_pedra', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('enemy_espectro_ruina')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x5b21b6, 0.9);
      g.fillCircle(16, 15, 10);
      g.fillStyle(0x4deeea, 1);
      g.fillRect(12, 13, 3, 3);
      g.fillRect(18, 13, 3, 3);
      g.generateTexture('enemy_espectro_ruina', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('boss_guardiao_terra')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x57534e, 1);
      g.fillRect(6, 8, 52, 48);
      g.fillStyle(0x3f6b54, 1);
      g.fillRect(8, 6, 48, 12);
      g.fillStyle(0xf5b942, 1);
      g.fillRect(18, 26, 8, 6);
      g.fillRect(38, 26, 8, 6);
      g.fillStyle(0xa855f7, 1);
      g.fillRect(28, 14, 8, 8);
      g.generateTexture('boss_guardiao_terra', 64, 64);
      g.destroy();
    }

    if (!this.textures.exists('arcane_bolt')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x4deeea, 1);
      g.fillCircle(8, 8, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 3);
      g.generateTexture('arcane_bolt', 16, 16);
      g.destroy();
    }

    if (!this.textures.exists('enemy_rock_bolt')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xd97706, 1);
      g.fillCircle(8, 8, 6);
      g.fillStyle(0xe05263, 1);
      g.fillCircle(8, 8, 3);
      g.generateTexture('enemy_rock_bolt', 16, 16);
      g.destroy();
    }

    if (!this.textures.exists('slash_arc')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.lineStyle(4, 0xf5b942, 0.95);
      g.beginPath();
      g.arc(16, 16, 12, -Math.PI * 0.45, Math.PI * 0.45, false);
      g.strokePath();
      g.generateTexture('slash_arc', 32, 32);
      g.destroy();
    }

    if (!this.textures.exists('enemy_serpente_cristal')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x0ea5e9, 1);
      g.fillEllipse(16, 18, 22, 12);
      g.fillCircle(22, 11, 6);
      g.fillStyle(0xbae6fd, 1);
      g.fillTriangle(12, 7, 15, 1, 18, 7);
      g.fillStyle(0xfef08a, 1);
      g.fillRect(23, 9, 3, 3);
      g.generateTexture('enemy_serpente_cristal', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('enemy_sonda_ufologica')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x64748b, 1);
      g.fillEllipse(16, 18, 26, 10);
      g.fillStyle(0x38bdf8, 0.95);
      g.fillCircle(16, 13, 6);
      g.fillStyle(0x4ade80, 1);
      g.fillCircle(9, 18, 2);
      g.fillCircle(16, 20, 2);
      g.fillCircle(23, 18, 2);
      g.generateTexture('enemy_sonda_ufologica', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('boss_guardiao_aguas')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x0369a1, 1);
      g.fillCircle(32, 34, 24);
      g.fillStyle(0x38bdf8, 1);
      g.fillCircle(32, 26, 16);
      g.fillStyle(0xe0f2fe, 1);
      g.fillRect(21, 22, 6, 5);
      g.fillRect(37, 22, 6, 5);
      g.fillStyle(0x4deeea, 1);
      g.fillTriangle(26, 10, 32, 2, 38, 10);
      g.generateTexture('boss_guardiao_aguas', 64, 64);
      g.destroy();
    }

    if (!this.textures.exists('boss_guardiao_ceus')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x312e81, 1);
      g.fillEllipse(32, 36, 52, 20);
      g.fillStyle(0x818cf8, 1);
      g.fillCircle(32, 24, 15);
      g.fillStyle(0x4ade80, 1);
      g.fillCircle(16, 36, 4);
      g.fillCircle(32, 39, 4);
      g.fillCircle(48, 36, 4);
      g.fillStyle(0xfef08a, 1);
      g.fillRect(24, 21, 5, 4);
      g.fillRect(35, 21, 5, 4);
      g.generateTexture('boss_guardiao_ceus', 64, 64);
      g.destroy();
    }

    for (const [key, outer, inner] of [
      ['water_bolt', 0x0284c7, 0xbae6fd],
      ['wind_bolt', 0x6366f1, 0x4ade80],
      ['omena_bolt', 0x9333ea, 0xf43f5e],
    ] as const) {
      if (!this.textures.exists(key)) {
        const g = this.make.graphics({ x: 0, y: 0 });
        g.fillStyle(outer, 1);
        g.fillCircle(8, 8, 6);
        g.fillStyle(inner, 1);
        g.fillCircle(8, 8, 3);
        g.generateTexture(key, 16, 16);
        g.destroy();
      }
    }

    for (const [key, bodyColor, tipColor] of [
      ['crystal_pillar_1', 0x0284c7, 0x7dd3fc],
      ['crystal_pillar_2', 0x7c3aed, 0xc4b5fd],
      ['crystal_pillar_3', 0x059669, 0x6ee7b7],
      ['crystal_pillar_active', 0xf5b942, 0xfef08a],
    ] as const) {
      if (!this.textures.exists(key)) {
        const g = this.make.graphics({ x: 0, y: 0 });
        g.fillStyle(0x334155, 1);
        g.fillRect(6, 22, 20, 8);
        g.fillStyle(bodyColor, 1);
        g.fillTriangle(8, 22, 16, 3, 24, 22);
        g.fillStyle(tipColor, 1);
        g.fillTriangle(12, 20, 16, 7, 20, 20);
        g.generateTexture(key, TILE_SIZE, TILE_SIZE);
        g.destroy();
      }
    }

    if (!this.textures.exists('enemy_sentinela_omena')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3b0764, 1);
      g.fillRect(7, 6, 18, 22);
      g.fillStyle(0xa855f7, 1);
      g.fillTriangle(6, 12, 16, 2, 26, 12);
      g.fillStyle(0xf43f5e, 1);
      g.fillRect(11, 13, 4, 3);
      g.fillRect(17, 13, 4, 3);
      g.generateTexture('enemy_sentinela_omena', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }

    if (!this.textures.exists('boss_omena')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x1e1b4b, 1);
      g.fillTriangle(8, 58, 32, 10, 56, 58);
      g.fillStyle(0x581c87, 1);
      g.fillCircle(32, 22, 14);
      g.fillStyle(0xf43f5e, 1);
      g.fillRect(24, 19, 6, 4);
      g.fillRect(34, 19, 6, 4);
      g.fillStyle(0xf5b942, 1);
      g.fillTriangle(22, 10, 26, 2, 30, 10);
      g.fillTriangle(34, 10, 38, 2, 42, 10);
      g.generateTexture('boss_omena', 64, 64);
      g.destroy();
    }

    if (!this.textures.exists('nucleo_mundo')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x38bdf8, 0.35);
      g.fillCircle(24, 24, 22);
      g.fillStyle(0x4deeea, 0.9);
      g.fillCircle(24, 24, 14);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(24, 24, 7);
      g.generateTexture('nucleo_mundo', 48, 48);
      g.destroy();
    }

    if (!this.textures.exists('portal_omena')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x581c87, 0.85);
      g.fillCircle(16, 16, 14);
      g.fillStyle(0xc084fc, 1);
      g.fillCircle(16, 16, 9);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(16, 16, 4);
      g.generateTexture('portal_omena', TILE_SIZE, TILE_SIZE);
      g.destroy();
    }
  }

  private registerSpriteAnimations(): void {
    const ensureAnim = (
      key: string,
      sheetKey: string,
      frames: number[],
      frameRate: number,
      repeat: number
    ) => {
      if (this.anims.exists(key) || !this.textures.exists(sheetKey)) return;
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: sheetKey, frame })),
        frameRate,
        repeat,
      });
    };

    if (this.textures.exists('player_sheet')) {
      ensureAnim('player_idle_down', 'player_sheet', [0], 1, 0);
      ensureAnim('player_idle_up', 'player_sheet', [4], 1, 0);
      ensureAnim('player_idle_left', 'player_sheet', [8], 1, 0);
      ensureAnim('player_idle_right', 'player_sheet', [12], 1, 0);

      ensureAnim('player_walk_down', 'player_sheet', [0, 1, 2, 3], 8, -1);
      ensureAnim('player_walk_up', 'player_sheet', [4, 5, 6, 7], 8, -1);
      ensureAnim('player_walk_left', 'player_sheet', [8, 9, 10, 11], 8, -1);
      ensureAnim('player_walk_right', 'player_sheet', [12, 13, 14, 15], 8, -1);

      ensureAnim('player_swing', 'player_sheet', [16, 17, 18, 19], 14, 0);
      ensureAnim('player_cast', 'player_sheet', [20, 21, 22, 23], 12, 0);
    }

    if (this.textures.exists('npcs_sheet')) {
      for (const [npcId, col] of Object.entries(NPC_SHEET_COLS)) {
        const moveSheetKey = `npc_${npcId}_move_sheet`;
        if (this.textures.exists(moveSheetKey)) {
          ensureAnim(`npc_${npcId}_walk_down`, moveSheetKey, [0, 1, 2, 3], 7, -1);
          ensureAnim(`npc_${npcId}_walk_up`, moveSheetKey, [4, 5, 6, 7], 7, -1);
          ensureAnim(`npc_${npcId}_side`, moveSheetKey, [8, 9, 10, 11], 7, -1);
          ensureAnim(`npc_${npcId}_walk_side`, moveSheetKey, [8, 9, 10, 11], 7, -1);
          ensureAnim(`npc_${npcId}_idle`, moveSheetKey, [12, 13, 14, 15], 3, -1);
        } else {
          ensureAnim(`npc_${npcId}_idle`, 'npcs_sheet', [col, col + 8], 2, -1);
          ensureAnim(`npc_${npcId}_side`, 'npcs_sheet', [col + 16, col + 24, col + 32, col + 24], 6, -1);
          ensureAnim(`npc_${npcId}_walk_side`, 'npcs_sheet', [col + 16, col + 24, col + 32, col + 24], 6, -1);
          ensureAnim(`npc_${npcId}_walk_down`, 'npcs_sheet', [col, col + 8, col + 16, col + 8], 5, -1);
          ensureAnim(`npc_${npcId}_walk_up`, 'npcs_sheet', [col + 16, col + 24, col + 32, col + 24], 6, -1);
        }
      }
    }

    if (this.textures.exists('companions_sheet')) {
      ensureAnim(
        'remo_fade',
        'companions_sheet',
        [
          COMPANION_FRAMES.REMO_START,
          COMPANION_FRAMES.REMO_START + 1,
          COMPANION_FRAMES.REMO_START + 2,
          COMPANION_FRAMES.REMO_END,
          COMPANION_FRAMES.REMO_START + 2,
          COMPANION_FRAMES.REMO_START + 1,
        ],
        4,
        -1
      );
      ensureAnim(
        'lupin_float',
        'companions_sheet',
        [
          COMPANION_FRAMES.LUPIN_START,
          COMPANION_FRAMES.LUPIN_START + 1,
          COMPANION_FRAMES.LUPIN_START + 2,
          COMPANION_FRAMES.LUPIN_END,
        ],
        6,
        -1
      );
    }

    if (this.textures.exists('creatures_fire_sheet')) {
      ensureAnim(
        'mini_dragon_idle',
        'creatures_fire_sheet',
        [
          CREATURES_FIRE_FRAMES.DRAGON_IDLE_START,
          CREATURES_FIRE_FRAMES.DRAGON_IDLE_START + 1,
          CREATURES_FIRE_FRAMES.DRAGON_IDLE_START,
          CREATURES_FIRE_FRAMES.DRAGON_IDLE_START + 2,
          CREATURES_FIRE_FRAMES.DRAGON_IDLE_END,
        ],
        5,
        -1
      );
    }

    if (this.textures.exists('enemy_golem_sheet')) {
      ensureAnim('golem_walk', 'enemy_golem_sheet', [0, 1, 2, 3, 5, 6, 7, 8], 7, -1);
      ensureAnim('golem_windup', 'enemy_golem_sheet', [10, 11, 12], 8, 0);
      ensureAnim('golem_smash', 'enemy_golem_sheet', [10, 11, 12, 13, 14, 18], 10, 0);
      ensureAnim('golem_hurt', 'enemy_golem_sheet', [15, 16], 9, 0);
      ensureAnim('golem_death', 'enemy_golem_sheet', [16, 17, 18, 14], 8, 0);
    }

    if (this.textures.exists('enemy_wisp_sheet')) {
      ensureAnim('wisp_float', 'enemy_wisp_sheet', [0, 1, 2, 3, 4, 5, 6, 7], 8, -1);
      ensureAnim('wisp_windup', 'enemy_wisp_sheet', [6, 7, 8], 9, 0);
      ensureAnim('wisp_burst', 'enemy_wisp_sheet', [8, 9, 10, 11], 10, 0);
      ensureAnim('wisp_hurt', 'enemy_wisp_sheet', [7, 8], 10, 0);
      ensureAnim('wisp_death', 'enemy_wisp_sheet', [8, 9, 10, 11], 10, 0);
    }

    if (this.textures.exists('boss_earth_guardian_sheet')) {
      ensureAnim('boss_earth_idle', 'boss_earth_guardian_sheet', [0, 1, 2], 5, -1);
      ensureAnim('boss_earth_windup', 'boss_earth_guardian_sheet', [2, 3, 4], 7, 0);
      ensureAnim('boss_earth_attack', 'boss_earth_guardian_sheet', [3, 4, 5, 0], 8, 0);
      ensureAnim('boss_earth_hurt', 'boss_earth_guardian_sheet', [3, 5], 8, 0);
      ensureAnim('boss_earth_death', 'boss_earth_guardian_sheet', [3, 4, 5], 6, 0);
    }

    if (this.textures.exists('enemy_serpente_sheet')) {
      ensureAnim('serpente_idle', 'enemy_serpente_sheet', [0, 1, 2, 3], 6, -1);
      ensureAnim('serpente_windup', 'enemy_serpente_sheet', [4, 5], 8, 0);
      ensureAnim('serpente_attack', 'enemy_serpente_sheet', [4, 5, 6, 7, 0], 10, 0);
      ensureAnim('serpente_hurt', 'enemy_serpente_sheet', [8, 9], 9, 0);
      ensureAnim('serpente_death', 'enemy_serpente_sheet', [9, 10, 11], 8, 0);
    }

    if (this.textures.exists('enemy_sonda_sheet')) {
      ensureAnim('sonda_hover', 'enemy_sonda_sheet', [0, 1, 2, 3], 6, -1);
      ensureAnim('sonda_windup', 'enemy_sonda_sheet', [4, 5, 6], 9, 0);
      ensureAnim('sonda_attack', 'enemy_sonda_sheet', [4, 5, 6, 7, 0], 10, 0);
      ensureAnim('sonda_hurt', 'enemy_sonda_sheet', [8, 9], 10, 0);
      ensureAnim('sonda_death', 'enemy_sonda_sheet', [9, 10, 11], 8, 0);
    }

    if (this.textures.exists('boss_water_guardian_sheet')) {
      ensureAnim('boss_water_idle', 'boss_water_guardian_sheet', [0, 1, 2, 3, 4, 5], 6, -1);
      ensureAnim('boss_water_windup', 'boss_water_guardian_sheet', [6, 7], 8, 0);
      ensureAnim('boss_water_attack', 'boss_water_guardian_sheet', [6, 7, 8, 9, 10, 0], 9, 0);
      ensureAnim('boss_water_hurt', 'boss_water_guardian_sheet', [9, 10], 8, 0);
      ensureAnim('boss_water_death', 'boss_water_guardian_sheet', [9, 10, 11], 6, 0);
    }

    if (this.textures.exists('boss_sky_guardian_sheet')) {
      ensureAnim('boss_sky_idle', 'boss_sky_guardian_sheet', [0, 1, 2, 3, 4, 5], 6, -1);
      ensureAnim('boss_sky_windup', 'boss_sky_guardian_sheet', [6, 7], 8, 0);
      ensureAnim('boss_sky_attack', 'boss_sky_guardian_sheet', [6, 7, 8, 9, 10, 0], 9, 0);
      ensureAnim('boss_sky_hurt', 'boss_sky_guardian_sheet', [8, 9], 8, 0);
      ensureAnim('boss_sky_death', 'boss_sky_guardian_sheet', [9, 10, 11], 6, 0);
    }

    if (this.textures.exists('pet_unicornio_sheet')) {
      ensureAnim('unicorn_idle', 'pet_unicornio_sheet', [0, 1, 2, 3], 5, -1);
      ensureAnim('unicorn_walk', 'pet_unicornio_sheet', [4, 5, 6, 7], 6, -1);
      ensureAnim('unicorn_ready', 'pet_unicornio_sheet', [8, 9, 10, 11, 10, 9], 6, -1);
    }

    if (this.textures.exists('world_objects_sheet')) {
      ensureAnim('bancada_encantamento_idle', 'world_objects_sheet', [0, 1, 2, 3], 5, -1);
      ensureAnim('camera_rafael_glint', 'world_objects_sheet', [4, 5, 6, 7], 6, -1);
      ensureAnim('diary_fragment_glint', 'world_objects_sheet', [8, 9, 10, 11], 6, -1);
    }

    if (this.textures.exists('crystal_pillars_sheet')) {
      ensureAnim('crystal_pillar_pulse', 'crystal_pillars_sheet', [4, 5, 6, 7], 6, -1);
    }

    if (this.textures.exists('combat_vfx_a_sheet')) {
      ensureAnim('arcane_bolt_anim', 'combat_vfx_a_sheet', [0, 1, 2, 3], 12, -1);
      ensureAnim('slash_arc_anim', 'combat_vfx_a_sheet', [4, 5, 6, 7], 24, 0);
      ensureAnim('enemy_rock_bolt_anim', 'combat_vfx_a_sheet', [8, 9, 10, 11], 10, -1);
    }

    if (this.textures.exists('combat_vfx_b_sheet')) {
      ensureAnim('water_bolt_anim', 'combat_vfx_b_sheet', [0, 1, 2, 3], 12, -1);
      ensureAnim('wind_bolt_anim', 'combat_vfx_b_sheet', [4, 5, 6, 7], 14, -1);
      ensureAnim('omena_bolt_anim', 'combat_vfx_b_sheet', [8, 9, 10, 11], 12, -1);
    }

    if (this.textures.exists('enemy_sentinela_sheet')) {
      ensureAnim('sentinela_idle', 'enemy_sentinela_sheet', [0, 1, 2, 3], 7, -1);
      ensureAnim('sentinela_windup', 'enemy_sentinela_sheet', [4, 5, 6], 9, 0);
      ensureAnim('sentinela_attack', 'enemy_sentinela_sheet', [4, 5, 6, 7, 0], 11, 0);
      ensureAnim('sentinela_hurt', 'enemy_sentinela_sheet', [8, 9], 9, 0);
      ensureAnim('sentinela_death', 'enemy_sentinela_sheet', [9, 10, 11], 8, 0);
    }

    if (this.textures.exists('boss_omena_sheet')) {
      ensureAnim('omena_idle', 'boss_omena_sheet', [0, 1, 2, 3, 4, 5], 6, -1);
      ensureAnim('omena_windup', 'boss_omena_sheet', [6, 7], 8, 0);
      ensureAnim('omena_attack', 'boss_omena_sheet', [6, 7, 8, 9, 10, 0], 10, 0);
      ensureAnim('omena_hurt', 'boss_omena_sheet', [9, 10], 8, 0);
      ensureAnim('omena_death', 'boss_omena_sheet', [9, 10, 11], 6, 0);
    }

    if (this.textures.exists('omena_world_props_sheet')) {
      ensureAnim('nucleo_mundo_pulse', 'omena_world_props_sheet', [0, 1, 2, 3], 5, -1);
      ensureAnim('portal_omena_spin', 'omena_world_props_sheet', [4, 5, 6, 7], 7, -1);
    }

    if (this.textures.exists('player_idle_sprint_sheet')) {
      ensureAnim('player_breathe_down', 'player_idle_sprint_sheet', [0, 1, 2, 3], 4, -1);
      ensureAnim('player_breathe_up', 'player_idle_sprint_sheet', [4, 5, 6, 7], 4, -1);
      ensureAnim('player_breathe_left', 'player_idle_sprint_sheet', [8, 9, 10, 11], 4, -1);
      ensureAnim('player_sprint_right', 'player_idle_sprint_sheet', [12, 13, 14, 15], 12, -1);
    }

    if (this.textures.exists('player_tools_side_sheet')) {
      ensureAnim('player_hoe_side', 'player_tools_side_sheet', [0, 1, 2, 3], 12, 0);
      ensureAnim('player_water_side', 'player_tools_side_sheet', [4, 5, 6, 7], 10, 0);
      ensureAnim('player_pickaxe_side', 'player_tools_side_sheet', [8, 9, 10, 11], 12, 0);
      ensureAnim('player_axe_side', 'player_tools_side_sheet', [12, 13, 14, 15], 12, 0);
      ensureAnim('player_fish_side', 'player_tools_side_sheet', [16, 17, 18, 19], 8, 0);
      ensureAnim('player_staff_side', 'player_tools_side_sheet', [20, 21, 22, 23], 12, 0);
    }

    if (this.textures.exists('player_tools_vertical_sheet')) {
      ensureAnim('player_hoe_down', 'player_tools_vertical_sheet', [0, 1, 2, 3], 12, 0);
      ensureAnim('player_hoe_up', 'player_tools_vertical_sheet', [4, 5, 6, 7], 12, 0);
      ensureAnim('player_water_down', 'player_tools_vertical_sheet', [8, 9, 10, 11], 10, 0);
      ensureAnim('player_water_up', 'player_tools_vertical_sheet', [12, 13, 14, 15], 10, 0);
      ensureAnim('player_axe_down', 'player_tools_vertical_sheet', [16, 17, 18, 19], 12, 0);
      ensureAnim('player_axe_up', 'player_tools_vertical_sheet', [20, 21, 22, 23], 12, 0);
    }

    if (this.textures.exists('player_empty_hands_sheet')) {
      ensureAnim('player_empty_down', 'player_empty_hands_sheet', [0, 1, 2, 3], 12, 0);
      ensureAnim('player_empty_up', 'player_empty_hands_sheet', [4, 5, 6, 7], 12, 0);
      ensureAnim('player_empty_side', 'player_empty_hands_sheet', [8, 9, 10, 11], 12, 0);
      ensureAnim('player_empty_left', 'player_empty_hands_sheet', [12, 13, 14, 15], 12, 0);
    }

    if (this.textures.exists('tools_vfx_sheet')) {
      ensureAnim('vfx_hoe_dirt', 'tools_vfx_sheet', [0, 1, 2, 3], 12, 0);
      ensureAnim('vfx_water_splash', 'tools_vfx_sheet', [4, 5, 6, 7], 12, 0);
      ensureAnim('vfx_pickaxe_spark', 'tools_vfx_sheet', [8, 9, 8], 12, 0);
      ensureAnim('vfx_axe_chips', 'tools_vfx_sheet', [10, 11, 10], 12, 0);
      ensureAnim('vfx_fishing_bobber', 'tools_vfx_sheet', [12, 13, 14, 15], 10, 0);
    }

    if (this.textures.exists('ambient_life_vfx_sheet')) {
      ensureAnim('butterfly_fly', 'ambient_life_vfx_sheet', [0, 1, 2, 3], 8, -1);
      ensureAnim('firefly_glow', 'ambient_life_vfx_sheet', [4, 5, 6, 7], 6, -1);
      ensureAnim('sparrow_fly', 'ambient_life_vfx_sheet', [8, 9, 10, 11], 10, -1);
      ensureAnim('rain_splash_anim', 'ambient_life_vfx_sheet', [12, 13, 14, 15], 12, 0);
      ensureAnim('petals_swirl', 'ambient_life_vfx_sheet', [16, 17, 18, 19], 7, -1);
    }

    if (this.textures.exists('npcs_activities_sheet')) {
      for (const [npcId, row] of Object.entries(NPC_ACTIVITY_ROWS)) {
        const start = row * 4;
        ensureAnim(`npc_${npcId}_work`, 'npcs_activities_sheet', [start, start + 1, start + 2, start + 3], 6, -1);
      }
    }

    if (this.textures.exists('npcs_activities_part2_sheet')) {
      for (const [npcId, row] of Object.entries(NPC_ACTIVITY_PART2_ROWS)) {
        const start = row * 4;
        ensureAnim(`npc_${npcId}_work`, 'npcs_activities_part2_sheet', [start, start + 1, start + 2, start + 3], 6, -1);
      }
    } else if (this.textures.exists('npcs_sheet')) {
      for (const npcId of Object.keys(NPC_ACTIVITY_PART2_ROWS)) {
        const col = NPC_SHEET_COLS[npcId];
        if (typeof col === 'number') {
          ensureAnim(`npc_${npcId}_work`, 'npcs_sheet', [col, col + 8, col + 24, col + 8], 4, -1);
        }
      }
    }

    if (this.textures.exists('pets_extended_sheet')) {
      ensureAnim('dragon_walk_ext', 'pets_extended_sheet', [0, 1, 2, 3], 7, -1);
      ensureAnim('dragon_sleep_ext', 'pets_extended_sheet', [4, 5, 6, 7], 4, -1);
      ensureAnim('unicorn_graze_ext', 'pets_extended_sheet', [8, 9, 10, 11], 5, -1);
      ensureAnim('unicorn_sleep_ext', 'pets_extended_sheet', [12, 13, 14, 15], 4, -1);
      ensureAnim('unicorn_ready_ext', 'pets_extended_sheet', [16, 17, 18, 19], 6, -1);
    }

    if (this.textures.exists('buildings_modular_sheet')) {
      ensureAnim(
        'chimney_smoke_anim',
        'buildings_modular_sheet',
        [
          MODULAR_BUILDING_FRAMES.CHIMNEY_SMOKE_1,
          MODULAR_BUILDING_FRAMES.CHIMNEY_SMOKE_2,
          MODULAR_BUILDING_FRAMES.CHIMNEY_SMOKE_3,
          MODULAR_BUILDING_FRAMES.CHIMNEY_SMOKE_4,
        ],
        5,
        -1
      );
      ensureAnim(
        'wall_lantern_anim',
        'buildings_modular_sheet',
        [MODULAR_BUILDING_FRAMES.WALL_LANTERN_1, MODULAR_BUILDING_FRAMES.WALL_LANTERN_2],
        4,
        -1
      );
    }

    if (this.textures.exists('interiors_sheet')) {
      ensureAnim(
        'fireplace_burn_anim',
        'interiors_sheet',
        [
          INTERIOR_FRAMES.FIREPLACE_1,
          INTERIOR_FRAMES.FIREPLACE_2,
          INTERIOR_FRAMES.FIREPLACE_3,
          INTERIOR_FRAMES.FIREPLACE_4,
        ],
        7,
        -1
      );
    }

    if (this.textures.exists('nature_extended_sheet')) {
      ensureAnim(
        'water_shimmer_anim',
        'nature_extended_sheet',
        [
          NATURE_EXTENDED_FRAMES.WATER_SHIMMER_1,
          NATURE_EXTENDED_FRAMES.WATER_SHIMMER_2,
          NATURE_EXTENDED_FRAMES.WATER_SHIMMER_3,
          NATURE_EXTENDED_FRAMES.WATER_SHIMMER_4,
        ],
        4,
        -1
      );
    }

    if (this.textures.exists('dungeons_details_sheet')) {
      ensureAnim(
        'dungeon_torch_anim',
        'dungeons_details_sheet',
        [
          DUNGEON_DETAIL_FRAMES.TORCH_1,
          DUNGEON_DETAIL_FRAMES.TORCH_2,
          DUNGEON_DETAIL_FRAMES.TORCH_3,
          DUNGEON_DETAIL_FRAMES.TORCH_4,
        ],
        8,
        -1
      );
      ensureAnim(
        'dungeon_chest_open_anim',
        'dungeons_details_sheet',
        [
          DUNGEON_DETAIL_FRAMES.CHEST_CLOSED,
          DUNGEON_DETAIL_FRAMES.CHEST_OPEN_1,
          DUNGEON_DETAIL_FRAMES.CHEST_OPEN_2,
          DUNGEON_DETAIL_FRAMES.CHEST_OPEN,
        ],
        10,
        0
      );
      ensureAnim(
        'dungeon_portal_anim',
        'dungeons_details_sheet',
        [
          DUNGEON_DETAIL_FRAMES.PORTAL_PAD_1,
          DUNGEON_DETAIL_FRAMES.PORTAL_PAD_2,
          DUNGEON_DETAIL_FRAMES.PORTAL_PAD_3,
          DUNGEON_DETAIL_FRAMES.PORTAL_PAD_4,
        ],
        6,
        -1
      );
    }

    if (this.textures.exists('workbenches_animated_sheet')) {
      ensureAnim('incubadora_active_anim', 'workbenches_animated_sheet', [0, 1, 2, 3], 6, -1);
      ensureAnim('forja_active_anim', 'workbenches_animated_sheet', [4, 5, 6, 7], 7, -1);
      ensureAnim('bancada_encantamento_active', 'workbenches_animated_sheet', [8, 9, 10, 11], 7, -1);
      ensureAnim('cauldron_bubble_anim', 'workbenches_animated_sheet', [12, 13], 5, -1);
      ensureAnim('anvil_glow_anim', 'workbenches_animated_sheet', [14, 15], 5, -1);
    }

    if (this.textures.exists('props_living_v2_sheet')) {
      ensureAnim('aspersor_spin_anim', 'props_living_v2_sheet', [0, 1, 2, 3], 8, -1);
      ensureAnim('shipping_bin_glint_anim', 'props_living_v2_sheet', [4, 5, 6, 7], 5, -1);
      ensureAnim('fountain_ripple_anim', 'props_living_v2_sheet', [8, 9, 10, 11], 6, -1);
    }

    if (this.textures.exists('wildlife_fauna_v2_sheet')) {
      ensureAnim('frog_idle_anim', 'wildlife_fauna_v2_sheet', [0, 1], 3, -1);
      ensureAnim('frog_hop_anim', 'wildlife_fauna_v2_sheet', [2, 3, 0], 8, 0);
      ensureAnim('fish_leap_anim', 'wildlife_fauna_v2_sheet', [4, 5, 6, 7], 9, 0);
      ensureAnim('squirrel_sniff_anim', 'wildlife_fauna_v2_sheet', [8, 9], 4, -1);
      ensureAnim('squirrel_hop_anim', 'wildlife_fauna_v2_sheet', [10, 11], 10, -1);
      ensureAnim('owl_perch_anim', 'wildlife_fauna_v2_sheet', [12, 13], 3, -1);
      ensureAnim('owl_fly_anim', 'wildlife_fauna_v2_sheet', [14, 15], 8, -1);
      ensureAnim('sparrow_peck_anim', 'wildlife_fauna_v2_sheet', [16, 17, 18, 17], 6, -1);
      ensureAnim('dragonfly_hover_anim', 'wildlife_fauna_v2_sheet', [20, 21], 10, -1);
      ensureAnim('butterfly_v2_fly_anim', 'wildlife_fauna_v2_sheet', [22, 23], 8, -1);
    }

    if (this.textures.exists('companions_ext_sheet')) {
      ensureAnim('remo_walk_ext', 'companions_ext_sheet', [0, 1, 2, 3], 7, -1);
      ensureAnim('remo_groom_ext', 'companions_ext_sheet', [4, 5, 4], 4, 0);
      ensureAnim('remo_pounce_ext', 'companions_ext_sheet', [6], 6, 0);
      ensureAnim('remo_sleep_ext', 'companions_ext_sheet', [7], 2, -1);
      ensureAnim('lupin_flip_ext', 'companions_ext_sheet', [8, 9, 10, 11], 8, -1);
      ensureAnim('lupin_fly_ext', 'companions_ext_sheet', [12, 13], 6, -1);
      ensureAnim('lupin_compass_ext', 'companions_ext_sheet', [14, 15], 5, 0);
    }

    if (this.textures.exists('pets_movement_ext_sheet')) {
      ensureAnim('dragon_walk_down_ext', 'pets_movement_ext_sheet', [0, 1], 6, -1);
      ensureAnim('dragon_walk_up_ext', 'pets_movement_ext_sheet', [2, 3], 6, -1);
      ensureAnim('dragon_fly_side_ext', 'pets_movement_ext_sheet', [4, 5, 6, 7], 8, -1);
      ensureAnim('unicorn_walk_down_ext', 'pets_movement_ext_sheet', [8, 9], 6, -1);
      ensureAnim('unicorn_walk_up_ext', 'pets_movement_ext_sheet', [10, 11], 6, -1);
      ensureAnim('unicorn_gallop_side_ext', 'pets_movement_ext_sheet', [12, 13, 14, 15], 9, -1);
    }

    if (this.textures.exists('enemies_earth_ext_sheet')) {
      ensureAnim('golem_walk_up_ext', 'enemies_earth_ext_sheet', [0, 1, 2, 3], 7, -1);
      ensureAnim('golem_slam_ext', 'enemies_earth_ext_sheet', [4, 5, 6, 7], 9, 0);
      ensureAnim('wisp_dash_ext', 'enemies_earth_ext_sheet', [8, 9, 10, 11], 9, 0);
      ensureAnim('wisp_death_ext', 'enemies_earth_ext_sheet', [12, 13, 14, 15], 9, 0);
    }

    if (this.textures.exists('enemies_crystal_sky_ext_sheet')) {
      ensureAnim('serpente_walk_down_ext', 'enemies_crystal_sky_ext_sheet', [0, 1], 6, -1);
      ensureAnim('serpente_walk_up_ext', 'enemies_crystal_sky_ext_sheet', [2, 3], 6, -1);
      ensureAnim('serpente_lunge_ext', 'enemies_crystal_sky_ext_sheet', [4, 5, 6, 7], 10, 0);
      ensureAnim('sonda_tilt_ext', 'enemies_crystal_sky_ext_sheet', [8, 9, 10, 11], 7, -1);
      ensureAnim('sonda_overcharge_ext', 'enemies_crystal_sky_ext_sheet', [12, 13, 14, 15], 10, 0);
    }

    if (this.textures.exists('enemies_omena_ext_sheet')) {
      ensureAnim('sentinela_walk_down_ext', 'enemies_omena_ext_sheet', [0, 1, 2, 3], 7, -1);
      ensureAnim('sentinela_walk_up_ext', 'enemies_omena_ext_sheet', [4, 5, 6, 7], 7, -1);
      ensureAnim('sentinela_blink_ext', 'enemies_omena_ext_sheet', [8, 9, 10, 11], 10, 0);
      ensureAnim('sentinela_nova_ext', 'enemies_omena_ext_sheet', [12, 13, 14, 15], 10, 0);
    }

    if (this.textures.exists('boss_earth_guardian_ext_sheet')) {
      ensureAnim('boss_earth_walk_down_ext', 'boss_earth_guardian_ext_sheet', [0, 1, 2], 6, -1);
      ensureAnim('boss_earth_walk_up_ext', 'boss_earth_guardian_ext_sheet', [3, 4, 5], 6, -1);
      ensureAnim('boss_earth_quake_ext', 'boss_earth_guardian_ext_sheet', [6, 7, 8, 9], 8, 0);
      ensureAnim('boss_earth_stagger_ext', 'boss_earth_guardian_ext_sheet', [10], 6, 0);
      ensureAnim('boss_earth_purified_ext', 'boss_earth_guardian_ext_sheet', [11], 4, -1);
    }

    if (this.textures.exists('bosses_elemental_ext_sheet')) {
      ensureAnim('boss_water_surge_ext', 'bosses_elemental_ext_sheet', [0, 1], 7, -1);
      ensureAnim('boss_water_walk_up_ext', 'bosses_elemental_ext_sheet', [2, 3], 6, -1);
      ensureAnim('boss_water_whirlpool_ext', 'bosses_elemental_ext_sheet', [4], 8, 0);
      ensureAnim('boss_water_hurt_ext', 'bosses_elemental_ext_sheet', [5], 8, 0);
      ensureAnim('boss_sky_swoop_ext', 'bosses_elemental_ext_sheet', [6, 7], 8, -1);
      ensureAnim('boss_sky_walk_up_ext', 'bosses_elemental_ext_sheet', [8, 9], 7, -1);
      ensureAnim('boss_sky_storm_ext', 'bosses_elemental_ext_sheet', [10], 8, 0);
      ensureAnim('boss_sky_purified_ext', 'bosses_elemental_ext_sheet', [11], 4, -1);
    }

    if (this.textures.exists('boss_omena_ext_sheet')) {
      ensureAnim('omena_glide_side_ext', 'boss_omena_ext_sheet', [0, 1], 7, -1);
      ensureAnim('omena_walk_up_ext', 'boss_omena_ext_sheet', [2, 3], 7, -1);
      ensureAnim('omena_teleport_ext', 'boss_omena_ext_sheet', [4, 5], 9, 0);
      ensureAnim('omena_cataclysm_ext', 'boss_omena_ext_sheet', [6, 7, 8], 9, 0);
      ensureAnim('omena_stagger_ext', 'boss_omena_ext_sheet', [9], 6, 0);
      ensureAnim('omena_dissolve_ext', 'boss_omena_ext_sheet', [10, 11], 5, 0);
    }
  }
}

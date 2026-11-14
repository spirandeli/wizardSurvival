import Phaser from 'phaser';
import { TILE_SIZE } from '../config/gameConfig';
import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getItemDef } from '../data/items';
import type { CardinalDirection } from '../systems/GridSystem';
import type { StepSurface } from '../systems/AudioSystem';
import { hasActiveBuff } from '../systems/InventorySystem';

const FACING_STEP_FRAME: Record<CardinalDirection, number> = {
  down: 1,
  up: 5,
  left: 9,
  right: 13,
};

export type PlayerActionKind = 'swing' | 'cast' | 'plant' | 'eat' | 'hold';

interface MovementKeys {
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  shift: Phaser.Input.Keyboard.Key;
}

const FACING_OVERLAY_COL: Record<CardinalDirection, number> = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
};

const ARMOR_OVERLAY_ROWS: Record<string, number> = {
  tunica_neblina: 0,
  armadura_granito_runico: 1,
  manto_escama_dragao: 2,
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  public facing: CardinalDirection = 'down';
  private keys: MovementKeys | null = null;
  private moveSpeed = 156;
  private dashSpeed = 370;
  private dashTimerMs = 0;
  private dashCooldownMs = 0;
  private invulnerableTimerMs = 0;
  private actionTimerMs = 0;
  private dashDirX = 0;
  private dashDirY = 1;
  private stepAccumulator = 0;
  private walkAnimAccumulator = 0;
  private walkFrame = false;
  private readonly useSpriteSheet: boolean;
  private armorAura: Phaser.GameObjects.Ellipse;
  private equipmentOverlay: Phaser.GameObjects.Sprite | null = null;
  private armorOverlayRow: number | null = null;
  private heldItemSprite: Phaser.GameObjects.Image | null = null;
  private stepSurfaceResolver?: () => StepSurface;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const hasSheet = scene.textures.exists('player_sheet');
    super(scene, x, y, hasSheet ? 'player_sheet' : 'player_down', hasSheet ? 0 : undefined);
    this.useSpriteSheet = hasSheet;
    this.armorAura = scene.add.ellipse(x, y + 16, 22, 10, 0x4deeea, 0).setDepth(y - 1);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 12);
    body.setOffset(hasSheet ? 15 : 7, hasSheet ? 34 : 20);
    body.setCollideWorldBounds(true);

    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.keys = {
        w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        shift: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      };
    }

    this.setDepth(this.getSortY());
  }

  getSortY(): number {
    return this.y + (this.useSpriteSheet ? 22 : 12);
  }

  setStepSurfaceResolver(resolver: () => StepSurface): void {
    this.stepSurfaceResolver = resolver;
  }

  syncEquipmentVisuals(weaponId: string | null, armorId: string | null): void {
    const armorDef = armorId ? getItemDef(armorId) : undefined;
    if (armorDef?.visualColor) {
      const color = Phaser.Display.Color.HexStringToColor(armorDef.visualColor).color;
      this.armorAura.setFillStyle(color, 0.36);
      this.armorAura.setStrokeStyle(1, color, 0.7);
    } else {
      this.armorAura.setFillStyle(0x000000, 0);
      this.armorAura.setStrokeStyle(0, 0x000000, 0);
    }
    if (weaponId) {
      this.setData('equippedWeaponId', weaponId);
    } else {
      this.setData('equippedWeaponId', null);
    }

    this.armorOverlayRow = armorId ? (ARMOR_OVERLAY_ROWS[armorId] ?? null) : null;
    if (this.armorOverlayRow !== null && this.scene.textures.exists('player_equipment_overlays_sheet')) {
      const col = FACING_OVERLAY_COL[this.facing];
      const frameIdx = this.armorOverlayRow * 4 + col;
      if (!this.equipmentOverlay) {
        this.equipmentOverlay = this.scene.add
          .sprite(this.x, this.y, 'player_equipment_overlays_sheet', frameIdx)
          .setDepth(this.getSortY() + 0.05);
      } else {
        this.equipmentOverlay.setVisible(true).setFrame(frameIdx);
      }
    } else {
      this.equipmentOverlay?.setVisible(false);
    }
  }

  private syncEquipmentOverlayTransform(sortY: number): void {
    if (!this.equipmentOverlay || this.armorOverlayRow === null) return;
    if (!this.useSpriteSheet) {
      this.equipmentOverlay.setVisible(false);
      return;
    }
    const frameIdx = this.armorOverlayRow * 4 + FACING_OVERLAY_COL[this.facing];
    this.equipmentOverlay
      .setVisible(this.visible)
      .setPosition(this.x, this.y)
      .setAlpha(this.alpha)
      .setDepth(sortY + 0.05);
    if (this.equipmentOverlay.frame.name !== String(frameIdx)) {
      this.equipmentOverlay.setFrame(frameIdx);
    }
  }

  isActionLocked(): boolean {
    return this.actionTimerMs > 0;
  }

  playAction(action: PlayerActionKind, itemId?: string): void {
    const isCast =
      action === 'cast' || Boolean(itemId?.startsWith('cajado_') || itemId?.startsWith('cetro_'));
    const isPickaxe = action === 'swing' && itemId === 'picareta_simples';
    const isHorizontal = this.facing === 'left' || this.facing === 'right';

    this.actionTimerMs =
      action === 'eat' || action === 'hold'
        ? 300
        : action === 'plant'
        ? 250
        : itemId === 'regador_simples'
        ? 340
        : itemId === 'vara_pesca_simples'
        ? 380
        : isCast
        ? 320
        : 280;

    let animKey: string | null = null;
    let flipX = false;
    let drawsToolInSprite = false;

    if (this.useSpriteSheet) {
      if (isCast) {
        if (isHorizontal && this.scene.anims.exists('player_staff_side')) {
          animKey = 'player_staff_side';
          flipX = this.facing === 'left';
          drawsToolInSprite = true;
        } else if (!isHorizontal) {
          const verticalCastKey = this.facing === 'up' ? 'player_cast_up' : 'player_cast_down';
          if (this.scene.anims.exists(verticalCastKey)) {
            animKey = verticalCastKey;
            drawsToolInSprite = true;
          } else if (this.scene.anims.exists('player_cast')) {
            animKey = 'player_cast';
            drawsToolInSprite = true;
          }
        } else if (this.scene.anims.exists('player_cast')) {
          animKey = 'player_cast';
          flipX = this.facing === 'left';
          drawsToolInSprite = true;
        }
      } else if (action === 'plant' && this.scene.anims.exists('player_plant_seed')) {
        animKey = 'player_plant_seed';
      } else if (action === 'eat' && this.scene.anims.exists('player_eat_drink')) {
        animKey = 'player_eat_drink';
      } else if (action === 'hold' && this.scene.anims.exists('player_hold_item')) {
        animKey = 'player_hold_item';
      } else if (isPickaxe) {
        if (isHorizontal && this.scene.anims.exists('player_pickaxe_side')) {
          animKey = 'player_pickaxe_side';
          flipX = this.facing === 'left';
          drawsToolInSprite = true;
        } else if (this.scene.anims.exists('player_swing')) {
          animKey = 'player_swing';
          flipX = this.facing === 'left';
          drawsToolInSprite = true;
        }
      } else if (itemId === 'enxada_antiga') {
        const key = isHorizontal ? 'player_hoe_side' : `player_hoe_${this.facing}`;
        if (this.scene.anims.exists(key)) {
          animKey = key;
          flipX = this.facing === 'left';
          drawsToolInSprite = true;
        }
      } else if (itemId === 'regador_simples') {
        const key = isHorizontal ? 'player_water_side' : `player_water_${this.facing}`;
        if (this.scene.anims.exists(key)) {
          animKey = key;
          flipX = this.facing === 'left';
          drawsToolInSprite = true;
        }
      } else if (itemId === 'machado_simples') {
        const key = isHorizontal ? 'player_axe_side' : `player_axe_${this.facing}`;
        if (this.scene.anims.exists(key)) {
          animKey = key;
          flipX = this.facing === 'left';
          drawsToolInSprite = true;
        }
      } else if (itemId === 'vara_pesca_simples' && isHorizontal) {
        if (this.scene.anims.exists('player_fish_side')) {
          animKey = 'player_fish_side';
          flipX = this.facing === 'left';
          drawsToolInSprite = true;
        }
      }
    }

    if (itemId) {
      const visualAction: PlayerActionKind = isCast ? 'cast' : action;
      if (!drawsToolInSprite || action === 'eat' || action === 'plant' || action === 'hold') {
        this.showHeldToolEffect(itemId, visualAction);
      }
      this.spawnToolActionParticles(itemId, visualAction);
    }

    if (!this.useSpriteSheet) return;

    if (animKey) {
      this.setFlipX(flipX);
      this.play(animKey, true);
      return;
    }

    const emptyAnimKey =
      this.facing === 'left'
        ? 'player_empty_left'
        : this.facing === 'right'
        ? 'player_empty_side'
        : `player_empty_${this.facing}`;
    if (this.scene.anims.exists(emptyAnimKey)) {
      this.setFlipX(false);
      this.play(emptyAnimKey, true);
      return;
    }

    // Fallback final caso nenhuma folha esteja carregada.
    this.anims.stop();
    this.setFlipX(false);
    this.setFrame(FACING_STEP_FRAME[this.facing]);
  }

  private showHeldToolEffect(itemId: string, action: PlayerActionKind): void {
    const iconFrame = getItemDef(itemId)?.iconFrame;
    const hasIconSheet =
      typeof iconFrame === 'number' && this.scene.textures.exists('items_icons_sheet');
    const texKey = `item_hand_${itemId}`;
    if (!hasIconSheet && !this.scene.textures.exists(texKey)) return;

    this.heldItemSprite?.destroy();

    const dir = this.getFacingVector();
    let ox = this.x + dir.x * 16;
    let oy = this.y + dir.y * 14 + 2;
    const sprite = hasIconSheet
      ? this.scene.add.image(ox, oy, 'items_icons_sheet', iconFrame)
      : this.scene.add.image(ox, oy, texKey);

    const baseScale = hasIconSheet ? 0.56 : 1;
    sprite.setDepth(this.y + 12).setScale(baseScale);

    const flipLeft = this.facing === 'left';
    if (flipLeft && action === 'swing') sprite.setFlipX(true);

    let startAngle = -35;
    let endAngle = flipLeft ? -105 : 55;
    let targetX = ox + dir.x * 8;
    let targetY = oy + dir.y * 8;
    let targetScale = baseScale * 1.08;
    let duration = 240;

    if (action === 'eat') {
      ox = this.x;
      oy = this.y - 10;
      sprite.setPosition(ox, oy);
      startAngle = -8;
      endAngle = 8;
      targetX = this.x;
      targetY = this.y - 24;
      targetScale = baseScale * 0.9;
      duration = 280;
    } else if (action === 'hold') {
      ox = this.x;
      oy = this.y - 22;
      sprite.setPosition(ox, oy);
      startAngle = 0;
      endAngle = 0;
      targetX = this.x;
      targetY = this.y - 30;
      targetScale = baseScale * 1.05;
      duration = 280;
    } else if (action === 'plant') {
      ox = this.x + dir.x * 12;
      oy = this.y + dir.y * 10 - 2;
      sprite.setPosition(ox, oy);
      startAngle = -15;
      endAngle = 25;
      targetX = this.x + dir.x * 26;
      targetY = this.y + dir.y * 24 + 8;
      targetScale = baseScale * 0.72;
      duration = 240;
    } else if (itemId === 'regador_simples') {
      startAngle = flipLeft ? 10 : -10;
      endAngle = flipLeft ? -42 : 42;
      targetX = ox + dir.x * 10;
      targetY = oy + dir.y * 4;
      duration = 300;
    } else if (itemId === 'enxada_antiga') {
      startAngle = flipLeft ? 50 : -50;
      endAngle = flipLeft ? -35 : 35;
      targetX = ox + dir.x * 12;
      targetY = oy + dir.y * 12 + 4;
      duration = 250;
    } else if (itemId === 'machado_simples') {
      startAngle = flipLeft ? 85 : -85;
      endAngle = flipLeft ? -75 : 75;
      targetX = ox + dir.x * 11;
      targetY = oy + dir.y * 8;
      duration = 230;
    } else if (itemId === 'vara_pesca_simples') {
      startAngle = flipLeft ? 75 : -75;
      endAngle = flipLeft ? -18 : 18;
      targetX = ox + dir.x * 14;
      targetY = oy + dir.y * 10 - 2;
      duration = 320;
    } else if (action === 'cast') {
      startAngle = -14;
      endAngle = 14;
      targetY = oy - 6;
      targetScale = baseScale * 1.18;
      duration = 260;
    }

    sprite.setAngle(startAngle);
    this.heldItemSprite = sprite;

    this.scene.tweens.add({
      targets: sprite,
      x: targetX,
      y: targetY,
      angle: endAngle,
      scale: targetScale,
      alpha: action === 'eat' || action === 'plant' ? 0.25 : 0.94,
      duration,
      onComplete: () => {
        if (this.heldItemSprite === sprite) {
          this.heldItemSprite = null;
        }
        sprite.destroy();
      },
    });
  }

  private spawnToolActionParticles(itemId: string, action: PlayerActionKind): void {
    const dir = this.getFacingVector();
    const tx = this.x + dir.x * 26;
    const ty = this.y + dir.y * 24 + 6;

    if (action === 'eat') {
      for (let i = 0; i < 6; i++) {
        const glow = this.scene.add
          .circle(this.x + (i - 2.5) * 4, this.y - 6, 2, i % 2 === 0 ? 0x5bc26e : 0xfef08a, 0.95)
          .setDepth(this.y + 15);
        this.scene.tweens.add({
          targets: glow,
          y: this.y - 26,
          alpha: 0,
          duration: 320 + i * 25,
          onComplete: () => glow.destroy(),
        });
      }
      return;
    }

    if (action === 'plant') {
      for (let i = 0; i < 4; i++) {
        const seedSpark = this.scene.add
          .circle(tx + (i - 1.5) * 4, ty - 4, 2, 0x86efac, 0.95)
          .setDepth(this.y + 14);
        this.scene.tweens.add({
          targets: seedSpark,
          y: ty + 6,
          alpha: 0,
          duration: 240,
          onComplete: () => seedSpark.destroy(),
        });
      }
      return;
    }

    const vfxMap: Record<string, string> = {
      enxada_antiga: 'vfx_hoe_dirt',
      regador_simples: 'vfx_water_splash',
      picareta_simples: 'vfx_pickaxe_spark',
      machado_simples: 'vfx_axe_chips',
      vara_pesca_simples: 'vfx_fishing_bobber',
    };
    const vfxAnimKey = vfxMap[itemId];
    if (vfxAnimKey && this.scene.textures.exists('tools_vfx_sheet') && this.scene.anims.exists(vfxAnimKey)) {
      const fxX = itemId === 'vara_pesca_simples' ? tx + dir.x * 12 : tx;
      const fxY = itemId === 'vara_pesca_simples' ? ty + dir.y * 8 : ty;
      const vfxSprite = this.scene.add
        .sprite(fxX, fxY, 'tools_vfx_sheet')
        .setDepth(this.y + 15);
      vfxSprite.play(vfxAnimKey);
      vfxSprite.once('animationcomplete', () => vfxSprite.destroy());
      return;
    }

    if (itemId === 'regador_simples') {
      for (let i = 0; i < 6; i++) {
        const drop = this.scene.add
          .circle(tx + (i - 2.5) * 3, ty - 10 + (i % 2) * 3, 2, 0x38bdf8, 0.9)
          .setDepth(this.y + 14);
        this.scene.tweens.add({
          targets: drop,
          y: ty + 8,
          alpha: 0,
          duration: 280 + i * 25,
          onComplete: () => drop.destroy(),
        });
      }
      return;
    }

    if (itemId === 'enxada_antiga') {
      for (let i = 0; i < 5; i++) {
        const clod = this.scene.add
          .rectangle(tx + (i - 2) * 4, ty, 3, 3, 0x92400e, 0.95)
          .setDepth(this.y + 14);
        this.scene.tweens.add({
          targets: clod,
          x: clod.x + (i - 2) * 4,
          y: ty - 7 + (i % 2) * 4,
          alpha: 0,
          duration: 240,
          onComplete: () => clod.destroy(),
        });
      }
      return;
    }

    if (itemId === 'machado_simples') {
      for (let i = 0; i < 5; i++) {
        const chip = this.scene.add
          .rectangle(tx + (i - 2) * 3, ty - 2, 4, 2, 0xd97706, 0.95)
          .setDepth(this.y + 14);
        this.scene.tweens.add({
          targets: chip,
          x: chip.x + (i - 2) * 5,
          y: ty + 4,
          angle: 90,
          alpha: 0,
          duration: 230,
          onComplete: () => chip.destroy(),
        });
      }
      return;
    }

    if (itemId === 'picareta_simples') {
      for (let i = 0; i < 5; i++) {
        const spark = this.scene.add
          .circle(tx + (i - 2) * 3, ty, 2, i % 2 === 0 ? 0xfbbf24 : 0x4deeea, 0.95)
          .setDepth(this.y + 14);
        this.scene.tweens.add({
          targets: spark,
          x: spark.x + (i - 2) * 5,
          y: ty - 6,
          alpha: 0,
          duration: 220,
          onComplete: () => spark.destroy(),
        });
      }
      return;
    }

    if (itemId === 'vara_pesca_simples') {
      const ring = this.scene.add
        .circle(tx + dir.x * 12, ty + dir.y * 8, 3, 0x38bdf8, 0.45)
        .setStrokeStyle(1.5, 0xe0f2fe, 0.9)
        .setDepth(this.y + 14);
      this.scene.tweens.add({
        targets: ring,
        scale: 2.8,
        alpha: 0,
        duration: 360,
        onComplete: () => ring.destroy(),
      });
    }
  }

  isInvulnerable(): boolean {
    return this.invulnerableTimerMs > 0 || this.dashTimerMs > 0;
  }

  grantInvulnerability(ms: number): void {
    this.invulnerableTimerMs = Math.max(this.invulnerableTimerMs, ms);
  }

  resetDashCooldown(): void {
    this.dashCooldownMs = 0;
  }

  updateMovement(deltaMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.dashCooldownMs > 0) this.dashCooldownMs = Math.max(0, this.dashCooldownMs - deltaMs);
    if (this.invulnerableTimerMs > 0) {
      this.invulnerableTimerMs = Math.max(0, this.invulnerableTimerMs - deltaMs);
      this.setAlpha(this.invulnerableTimerMs % 120 < 60 ? 0.55 : 1);
    } else if (this.alpha < 1) {
      this.setAlpha(1);
    }

    if (this.dashTimerMs > 0) {
      this.dashTimerMs = Math.max(0, this.dashTimerMs - deltaMs);
      if (this.useSpriteSheet && this.scene.anims.exists('player_sprint_right')) {
        this.setFlipX(this.dashDirX < 0);
        this.play('player_sprint_right', true);
      }
      body.setVelocity(this.dashDirX * this.dashSpeed, this.dashDirY * this.dashSpeed);
      const sortY = this.getSortY();
      this.setDepth(sortY);
      this.armorAura.setPosition(this.x, this.y + (this.useSpriteSheet ? 17 : 10));
      this.armorAura.setDepth(sortY - 1);
      this.syncEquipmentOverlayTransform(sortY);
      if (this.dashTimerMs === 0) {
        this.setFlipX(false);
      }
      return;
    }

    if (this.actionTimerMs > 0) {
      this.actionTimerMs = Math.max(0, this.actionTimerMs - deltaMs);
      body.setVelocity(0, 0);
      const sortY = this.getSortY();
      this.setDepth(sortY);
      this.syncEquipmentOverlayTransform(sortY);
      if (this.actionTimerMs === 0) {
        this.setFlipX(false);
      }
      return;
    }

    if (!this.keys) {
      body.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;

    if (this.keys.a.isDown || this.keys.left.isDown) vx -= 1;
    if (this.keys.d.isDown || this.keys.right.isDown) vx += 1;
    if (this.keys.w.isDown || this.keys.up.isDown) vy -= 1;
    if (this.keys.s.isDown || this.keys.down.isDown) vy += 1;

    if (Phaser.Input.Keyboard.JustDown(this.keys.shift) && this.dashCooldownMs === 0) {
      const dir = this.resolveDashDirection(vx, vy);
      this.dashDirX = dir.x;
      this.dashDirY = dir.y;
      this.dashTimerMs = 190;
      this.dashCooldownMs = 850;
      this.invulnerableTimerMs = Math.max(this.invulnerableTimerMs, 260);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
      body.setVelocity(this.dashDirX * this.dashSpeed, this.dashDirY * this.dashSpeed);
      return;
    }

    if (vx !== 0 || vy !== 0) {
      const length = Math.hypot(vx, vy);
      const curState = gameState.getState();
      let speedMult = curState.flags.sky_guardian_blessed ? 1.15 : 1;
      if (hasActiveBuff(curState, 'brisa')) speedMult += 0.15;
      const speed = Math.round(this.moveSpeed * speedMult);
      vx = (vx / length) * speed;
      vy = (vy / length) * speed;

      if (Math.abs(vx) > Math.abs(vy)) {
        this.facing = vx < 0 ? 'left' : 'right';
      } else {
        this.facing = vy < 0 ? 'up' : 'down';
      }

      if (this.useSpriteSheet) {
        this.setFlipX(false);
        this.play(`player_walk_${this.facing}`, true);
      } else {
        this.walkAnimAccumulator += deltaMs;
        if (this.walkAnimAccumulator >= 165) {
          this.walkAnimAccumulator = 0;
          this.walkFrame = !this.walkFrame;
        }
        const walkKey = `player_${this.facing}_walk`;
        const targetTex =
          this.walkFrame && this.scene.textures.exists(walkKey)
            ? walkKey
            : `player_${this.facing}`;
        this.setTexture(targetTex);
      }

      this.stepAccumulator += deltaMs;
      if (this.stepAccumulator >= 340) {
        this.stepAccumulator = 0;
        const surface = this.stepSurfaceResolver ? this.stepSurfaceResolver() : 'grass';
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'step', surface });
      }
    } else {
      this.stepAccumulator = 0;
      this.walkAnimAccumulator = 0;
      this.walkFrame = false;
      if (this.useSpriteSheet) {
        const breatheKey =
          this.facing === 'right' ? 'player_breathe_left' : `player_breathe_${this.facing}`;
        if (this.scene.anims.exists(breatheKey)) {
          this.setFlipX(this.facing === 'right');
          this.play(breatheKey, true);
        } else {
          this.setFlipX(false);
          this.play(`player_idle_${this.facing}`, true);
        }
      } else {
        this.setTexture(`player_${this.facing}`);
      }
    }

    body.setVelocity(vx, vy);
    const sortY = this.getSortY();
    this.setDepth(sortY);
    this.armorAura.setPosition(this.x, this.y + (this.useSpriteSheet ? 17 : 10));
    this.armorAura.setDepth(sortY - 1);
    this.syncEquipmentOverlayTransform(sortY);
  }

  override destroy(fromScene?: boolean): void {
    this.armorAura.destroy();
    this.equipmentOverlay?.destroy();
    this.heldItemSprite?.destroy();
    this.equipmentOverlay = null;
    this.heldItemSprite = null;
    super.destroy(fromScene);
  }

  getFeetWorldPosition(): { x: number; y: number } {
    return {
      x: this.x,
      y: this.y + (this.useSpriteSheet ? TILE_SIZE * 0.5 : TILE_SIZE * 0.25),
    };
  }

  getFacingVector(): { x: number; y: number } {
    switch (this.facing) {
      case 'up':
        return { x: 0, y: -1 };
      case 'down':
        return { x: 0, y: 1 };
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
    }
  }

  private resolveDashDirection(vx: number, vy: number): { x: number; y: number } {
    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      return { x: vx / len, y: vy / len };
    }
    return this.getFacingVector();
  }
}

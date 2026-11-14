import Phaser from 'phaser';
import type { ElementType } from '@shared/types';

export type EnemyKind =
  | 'golem_pedra'
  | 'espectro_ruina'
  | 'serpente_cristal'
  | 'sonda_ufologica'
  | 'sentinela_omena'
  | 'guardiao_terra'
  | 'guardiao_aguas'
  | 'guardiao_ceus'
  | 'omena';

interface EnemyStats {
  texture: string;
  sheetKey: string;
  idleAnim: string;
  windupAnim?: string;
  attackAnim?: string;
  hurtAnim?: string;
  deathAnim?: string;
  maxHp: number;
  speed: number;
  physicalDamage: number;
  elementalDamage: Partial<Record<ElementType, number>>;
  resistances: Partial<Record<ElementType, number>>;
  isBoss: boolean;
  canFireRanged?: boolean;
  rangedIntervalMs?: number;
  boltTexture?: string;
}

const ENEMY_CONFIGS: Record<EnemyKind, EnemyStats> = {
  golem_pedra: {
    texture: 'enemy_golem_pedra',
    sheetKey: 'enemy_golem_sheet',
    idleAnim: 'golem_walk',
    windupAnim: 'golem_windup',
    attackAnim: 'golem_smash',
    hurtAnim: 'golem_hurt',
    deathAnim: 'golem_death',
    maxHp: 45,
    speed: 62,
    physicalDamage: 10,
    elementalDamage: { terra: 6 },
    resistances: { terra: 0.3 },
    isBoss: false,
  },
  espectro_ruina: {
    texture: 'enemy_espectro_ruina',
    sheetKey: 'enemy_wisp_sheet',
    idleAnim: 'wisp_float',
    windupAnim: 'wisp_windup',
    attackAnim: 'wisp_burst',
    hurtAnim: 'wisp_hurt',
    deathAnim: 'wisp_death',
    maxHp: 32,
    speed: 88,
    physicalDamage: 6,
    elementalDamage: { arcano: 8 },
    resistances: { arcano: 0.25 },
    isBoss: false,
  },
  serpente_cristal: {
    texture: 'enemy_serpente_cristal',
    sheetKey: 'enemy_serpente_sheet',
    idleAnim: 'serpente_idle',
    windupAnim: 'serpente_windup',
    attackAnim: 'serpente_attack',
    hurtAnim: 'serpente_hurt',
    deathAnim: 'serpente_death',
    maxHp: 42,
    speed: 102,
    physicalDamage: 9,
    elementalDamage: { agua: 8 },
    resistances: { agua: 0.3 },
    isBoss: false,
  },
  sonda_ufologica: {
    texture: 'enemy_sonda_ufologica',
    sheetKey: 'enemy_sonda_sheet',
    idleAnim: 'sonda_hover',
    windupAnim: 'sonda_windup',
    attackAnim: 'sonda_attack',
    hurtAnim: 'sonda_hurt',
    deathAnim: 'sonda_death',
    maxHp: 48,
    speed: 82,
    physicalDamage: 7,
    elementalDamage: { ar: 10 },
    resistances: { ar: 0.3 },
    isBoss: false,
    canFireRanged: true,
    rangedIntervalMs: 2500,
    boltTexture: 'wind_bolt',
  },
  guardiao_terra: {
    texture: 'boss_guardiao_terra',
    sheetKey: 'boss_earth_guardian_sheet',
    idleAnim: 'boss_earth_idle',
    windupAnim: 'boss_earth_windup',
    attackAnim: 'boss_earth_attack',
    hurtAnim: 'boss_earth_hurt',
    deathAnim: 'boss_earth_death',
    maxHp: 220,
    speed: 74,
    physicalDamage: 14,
    elementalDamage: { terra: 12 },
    resistances: { terra: 0.35 },
    isBoss: true,
    canFireRanged: true,
    rangedIntervalMs: 2100,
    boltTexture: 'enemy_rock_bolt',
  },
  guardiao_aguas: {
    texture: 'boss_guardiao_aguas',
    sheetKey: 'boss_water_guardian_sheet',
    idleAnim: 'boss_water_idle',
    windupAnim: 'boss_water_windup',
    attackAnim: 'boss_water_attack',
    hurtAnim: 'boss_water_hurt',
    deathAnim: 'boss_water_death',
    maxHp: 260,
    speed: 82,
    physicalDamage: 14,
    elementalDamage: { agua: 14 },
    resistances: { agua: 0.4 },
    isBoss: true,
    canFireRanged: true,
    rangedIntervalMs: 1900,
    boltTexture: 'water_bolt',
  },
  guardiao_ceus: {
    texture: 'boss_guardiao_ceus',
    sheetKey: 'boss_sky_guardian_sheet',
    idleAnim: 'boss_sky_idle',
    windupAnim: 'boss_sky_windup',
    attackAnim: 'boss_sky_attack',
    hurtAnim: 'boss_sky_hurt',
    deathAnim: 'boss_sky_death',
    maxHp: 290,
    speed: 92,
    physicalDamage: 15,
    elementalDamage: { ar: 16 },
    resistances: { ar: 0.4 },
    isBoss: true,
    canFireRanged: true,
    rangedIntervalMs: 1700,
    boltTexture: 'wind_bolt',
  },
  sentinela_omena: {
    texture: 'enemy_sentinela_omena',
    sheetKey: 'enemy_sentinela_sheet',
    idleAnim: 'sentinela_idle',
    windupAnim: 'sentinela_windup',
    attackAnim: 'sentinela_attack',
    hurtAnim: 'sentinela_hurt',
    deathAnim: 'sentinela_death',
    maxHp: 62,
    speed: 94,
    physicalDamage: 12,
    elementalDamage: { arcano: 12, fogo: 6 },
    resistances: { arcano: 0.35 },
    isBoss: false,
    canFireRanged: true,
    rangedIntervalMs: 2200,
    boltTexture: 'omena_bolt',
  },
  omena: {
    texture: 'boss_omena',
    sheetKey: 'boss_omena_sheet',
    idleAnim: 'omena_idle',
    windupAnim: 'omena_windup',
    attackAnim: 'omena_attack',
    hurtAnim: 'omena_hurt',
    deathAnim: 'omena_death',
    maxHp: 420,
    speed: 86,
    physicalDamage: 18,
    elementalDamage: { arcano: 16, fogo: 12 },
    resistances: { terra: 0.25, agua: 0.25, ar: 0.25 },
    isBoss: true,
    canFireRanged: true,
    rangedIntervalMs: 1600,
    boltTexture: 'omena_bolt',
  },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public readonly kind: EnemyKind;
  public readonly stats: EnemyStats;
  public hp: number;
  public effectiveMaxHp: number;
  public damageScale = 1;
  public isDying = false;
  private readonly spawnX: number;
  private readonly spawnY: number;
  private patrolAngle = Math.random() * Math.PI * 2;
  private patrolTimerMs = 800 + Math.random() * 900;
  private patrolMoving = true;
  private windupRemainingMs = 0;
  private pendingRangedTarget: { x: number; y: number } | null = null;
  private attackCooldownMs = 0;
  private rangedCooldownMs = 1600;
  private specialCooldownMs = 4400;
  private hitFlashMs = 0;
  private readonly useSpriteSheet: boolean;
  private hpBarBg: Phaser.GameObjects.Rectangle | null = null;
  private hpBarFill: Phaser.GameObjects.Rectangle | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
    const cfg = ENEMY_CONFIGS[kind];
    const hasSheet = scene.textures.exists(cfg.sheetKey);
    super(scene, x, y, hasSheet ? cfg.sheetKey : cfg.texture, hasSheet ? 0 : undefined);
    this.kind = kind;
    this.stats = cfg;
    this.hp = cfg.maxHp;
    this.effectiveMaxHp = cfg.maxHp;
    this.spawnX = x;
    this.spawnY = y;
    this.useSpriteSheet = hasSheet;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (cfg.isBoss) {
      body.setSize(46, 36);
      body.setOffset(9, hasSheet ? 26 : 18);
    } else if (hasSheet) {
      body.setSize(22, 18);
      body.setOffset(13, kind === 'espectro_ruina' ? 20 : 28);
    } else {
      body.setSize(22, 18);
      body.setOffset(5, 10);
    }
    body.setCollideWorldBounds(true);

    if (!cfg.isBoss) {
      this.hpBarBg = scene.add
        .rectangle(x, y - 22, 26, 4, 0x100e1a, 0.85)
        .setDepth(3800)
        .setVisible(false);
      this.hpBarFill = scene.add
        .rectangle(x - 12, y - 22, 24, 2.5, 0xe05263, 1)
        .setOrigin(0, 0.5)
        .setDepth(3801)
        .setVisible(false);
    }

    if (hasSheet && scene.anims.exists(cfg.idleAnim)) {
      this.play(cfg.idleAnim);
    }
    this.setDepth(this.y);
  }

  applyRiftBoost(hpMult: number, dmgMult: number): void {
    this.effectiveMaxHp = Math.round(this.stats.maxHp * hpMult);
    this.hp = this.effectiveMaxHp;
    this.damageScale = dmgMult;
  }

  updateAI(
    deltaMs: number,
    playerX: number,
    playerY: number,
    onBossFire?: (originX: number, originY: number, targetX: number, targetY: number) => void,
    onBossTelegraph?: (targetX: number, targetY: number, radius: number, phase: 1 | 2 | 3) => void
  ): void {
    if (this.isDying || !this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.attackCooldownMs > 0) this.attackCooldownMs = Math.max(0, this.attackCooldownMs - deltaMs);

    if (this.hitFlashMs > 0) {
      this.hitFlashMs = Math.max(0, this.hitFlashMs - deltaMs);
      if (this.hitFlashMs === 0) this.clearTint();
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    const aggroRange = this.stats.isBoss ? 520 : 260;
    const phase = this.getBossPhase();
    const speedMult = this.kind === 'omena' ? (phase === 3 ? 1.35 : phase === 2 ? 1.18 : 1) : 1;

    // Handle active ranged windup before firing projectile
    if (this.windupRemainingMs > 0) {
      this.windupRemainingMs = Math.max(0, this.windupRemainingMs - deltaMs);
      body.setVelocity(0, 0);
      if (this.windupRemainingMs === 0 && this.pendingRangedTarget && onBossFire) {
        this.playAttackOnce();
        onBossFire(this.x, this.y, this.pendingRangedTarget.x, this.pendingRangedTarget.y);
        this.pendingRangedTarget = null;
      }
    } else if (dist < aggroRange && dist > 8) {
      const vx = (dx / dist) * this.stats.speed * speedMult;
      const vy = (dy / dist) * this.stats.speed * speedMult;
      body.setVelocity(vx, vy);
      if (this.useSpriteSheet && Math.abs(dx) > 6) {
        this.setFlipX(dx < 0);
      }
    } else {
      // Autonomous patrol around spawn point when player is out of aggro range
      this.patrolTimerMs -= deltaMs;
      if (this.patrolTimerMs <= 0) {
        this.patrolMoving = !this.patrolMoving;
        this.patrolTimerMs = this.patrolMoving
          ? 1100 + Math.random() * 900
          : 700 + Math.random() * 800;
        if (this.patrolMoving) {
          const toSpawnX = this.spawnX - this.x;
          const toSpawnY = this.spawnY - this.y;
          if (Math.hypot(toSpawnX, toSpawnY) > 54) {
            this.patrolAngle = Math.atan2(toSpawnY, toSpawnX);
          } else {
            this.patrolAngle += (Math.random() - 0.5) * Math.PI * 1.2;
          }
        }
      }
      if (this.patrolMoving) {
        const patrolSpeed = this.stats.speed * 0.42;
        const pvx = Math.cos(this.patrolAngle) * patrolSpeed;
        const pvy = Math.sin(this.patrolAngle) * patrolSpeed;
        body.setVelocity(pvx, pvy);
        if (this.useSpriteSheet && Math.abs(pvx) > 4) {
          this.setFlipX(pvx < 0);
        }
      } else {
        body.setVelocity(0, 0);
      }
    }

    if (this.stats.canFireRanged && onBossFire && dist < 440 && this.windupRemainingMs === 0) {
      this.rangedCooldownMs -= deltaMs;
      if (this.rangedCooldownMs <= 0) {
        const baseInterval = this.stats.rangedIntervalMs ?? 2100;
        this.rangedCooldownMs =
          this.kind === 'omena'
            ? phase === 3
              ? 950
              : phase === 2
              ? 1250
              : baseInterval
            : baseInterval;
        this.pendingRangedTarget = { x: playerX, y: playerY };
        this.windupRemainingMs = 240;
        this.playWindupOnce();
      }
    }

    if (this.stats.isBoss && onBossTelegraph && dist < 440) {
      this.specialCooldownMs -= deltaMs;
      if (this.specialCooldownMs <= 0) {
        this.specialCooldownMs = this.kind === 'omena' && phase === 3 ? 3300 : 4700;
        const radius = phase === 3 ? 52 : 42;
        this.playWindupOnce();
        onBossTelegraph(playerX, playerY, radius, phase);
      }
    }

    if (this.hpBarBg && this.hpBarFill) {
      const showBar = this.hp < this.effectiveMaxHp && !this.isDying;
      this.hpBarBg.setVisible(showBar).setPosition(this.x, this.y - 22);
      this.hpBarFill
        .setVisible(showBar)
        .setPosition(this.x - 12, this.y - 22)
        .setSize(Math.max(1, Math.round(24 * (this.hp / Math.max(1, this.effectiveMaxHp)))), 2.5);
    }

    this.setDepth(this.y);
  }

  playWindupOnce(): void {
    if (!this.useSpriteSheet || !this.stats.windupAnim) return;
    if (!this.scene.anims.exists(this.stats.windupAnim)) return;
    this.play(this.stats.windupAnim, true);
  }

  playAttackOnce(): void {
    if (!this.useSpriteSheet || !this.stats.attackAnim) return;
    if (!this.scene.anims.exists(this.stats.attackAnim)) return;
    this.play(this.stats.attackAnim, true);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.active && !this.isDying && this.scene.anims.exists(this.stats.idleAnim)) {
        this.play(this.stats.idleAnim, true);
      }
    });
  }

  playHurtOnce(): void {
    if (!this.useSpriteSheet || !this.stats.hurtAnim || this.isDying) return;
    if (!this.scene.anims.exists(this.stats.hurtAnim)) return;
    this.play(this.stats.hurtAnim, true);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.active && !this.isDying && this.scene.anims.exists(this.stats.idleAnim)) {
        this.play(this.stats.idleAnim, true);
      }
    });
  }

  playDeathAndDestroy(): void {
    if (this.isDying) return;
    this.isDying = true;
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }
    this.hpBarBg?.setVisible(false);
    this.hpBarFill?.setVisible(false);
    this.clearTint();

    if (
      this.useSpriteSheet &&
      this.stats.deathAnim &&
      this.scene.anims.exists(this.stats.deathAnim)
    ) {
      this.play(this.stats.deathAnim, true);
      this.scene.tweens.add({
        targets: this,
        alpha: 0.15,
        duration: 420,
        onComplete: () => {
          if (this.active) this.destroy();
        },
      });
    } else {
      this.destroy();
    }
  }

  canTouchAttack(): boolean {
    if (this.isDying || this.attackCooldownMs > 0) return false;
    this.attackCooldownMs = 750;
    this.playAttackOnce();
    return true;
  }

  getBossPhase(): 1 | 2 | 3 {
    if (!this.stats.isBoss) return 1;
    const ratio = this.hp / Math.max(1, this.effectiveMaxHp);
    if (ratio <= 0.33) return 3;
    if (ratio <= 0.66) return 2;
    return 1;
  }

  takeDamage(amount: number, knockX: number, knockY: number): boolean {
    if (this.isDying) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashMs = 95;
    this.setTintFill(0xffffff);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(knockX * 140, knockY * 140);
    if (this.hp > 0) {
      this.playHurtOnce();
    }
    return this.hp <= 0;
  }

  override destroy(fromScene?: boolean): void {
    this.hpBarBg?.destroy();
    this.hpBarFill?.destroy();
    this.hpBarBg = null;
    this.hpBarFill = null;
    super.destroy(fromScene);
  }
}

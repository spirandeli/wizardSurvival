import Phaser from 'phaser';
import type { ElementType } from '@shared/types';

export type EnemyKind =
  | 'golem_pedra'
  | 'espectro_ruina'
  | 'serpente_cristal'
  | 'sonda_ufologica'
  | 'sentinela_omena'
  | 'escaravelho_inca'
  | 'totem_condor'
  | 'colosso_granito'
  | 'lodo_quartzo'
  | 'morcego_estalactite'
  | 'salamandra_abissal'
  | 'drone_alfa'
  | 'androide_xenotecnico'
  | 'anomalia_magnetica'
  | 'sombra_errante'
  | 'arauto_abismo'
  | 'executor_omena'
  | 'guardiao_terra'
  | 'guardiao_aguas'
  | 'guardiao_ceus'
  | 'omena';

interface EnemyStats {
  texture: string;
  sheetKey: string;
  idleAnim: string;
  walkUpAnim?: string;
  walkDownAnim?: string;
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
  tint?: number;
  baseScale?: number;
}

const ENEMY_CONFIGS: Record<EnemyKind, EnemyStats> = {
  golem_pedra: {
    texture: 'enemy_golem_pedra',
    sheetKey: 'enemy_golem_sheet',
    idleAnim: 'golem_walk',
    walkUpAnim: 'golem_walk_up_ext',
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
    walkUpAnim: 'serpente_walk_up_ext',
    walkDownAnim: 'serpente_walk_down_ext',
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
    walkUpAnim: 'boss_earth_walk_up_ext',
    walkDownAnim: 'boss_earth_walk_down_ext',
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
    walkUpAnim: 'boss_water_walk_up_ext',
    walkDownAnim: 'boss_water_surge_ext',
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
    walkUpAnim: 'boss_sky_walk_up_ext',
    walkDownAnim: 'boss_sky_swoop_ext',
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
    walkUpAnim: 'sentinela_walk_up_ext',
    walkDownAnim: 'sentinela_walk_down_ext',
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
  // Machu Picchu — 3 novas criaturas
  escaravelho_inca: {
    texture: 'enemy_golem_pedra',
    sheetKey: 'enemy_escaravelho_inca_sheet',
    idleAnim: 'escaravelho_inca_idle',
    walkUpAnim: 'escaravelho_inca_walk_up',
    windupAnim: 'escaravelho_inca_windup',
    attackAnim: 'escaravelho_inca_attack',
    hurtAnim: 'escaravelho_inca_hurt',
    deathAnim: 'escaravelho_inca_death',
    maxHp: 38,
    speed: 98,
    physicalDamage: 9,
    elementalDamage: { terra: 6 },
    resistances: { terra: 0.35 },
    isBoss: false,
    tint: 0xfbbf24,
    baseScale: 0.85,
  },
  totem_condor: {
    texture: 'enemy_espectro_ruina',
    sheetKey: 'enemy_totem_condor_sheet',
    idleAnim: 'totem_condor_idle',
    walkUpAnim: 'totem_condor_walk_up',
    windupAnim: 'totem_condor_windup',
    attackAnim: 'totem_condor_attack',
    hurtAnim: 'totem_condor_hurt',
    deathAnim: 'totem_condor_death',
    maxHp: 54,
    speed: 84,
    physicalDamage: 8,
    elementalDamage: { terra: 8, fogo: 6 },
    resistances: { terra: 0.25, fogo: 0.25 },
    isBoss: false,
    canFireRanged: true,
    rangedIntervalMs: 2400,
    boltTexture: 'enemy_rock_bolt',
    tint: 0xf97316,
    baseScale: 1.04,
  },
  colosso_granito: {
    texture: 'enemy_golem_pedra',
    sheetKey: 'enemy_colosso_granito_sheet',
    idleAnim: 'colosso_granito_idle',
    walkUpAnim: 'colosso_granito_walk_up',
    windupAnim: 'colosso_granito_windup',
    attackAnim: 'colosso_granito_attack',
    hurtAnim: 'colosso_granito_hurt',
    deathAnim: 'colosso_granito_death',
    maxHp: 82,
    speed: 56,
    physicalDamage: 15,
    elementalDamage: { terra: 10 },
    resistances: { terra: 0.45 },
    isBoss: false,
    tint: 0xa8a29e,
    baseScale: 1.18,
  },
  // Chapada Diamantina — 3 novas criaturas
  lodo_quartzo: {
    texture: 'enemy_espectro_ruina',
    sheetKey: 'enemy_lodo_quartzo_sheet',
    idleAnim: 'lodo_quartzo_idle',
    walkUpAnim: 'lodo_quartzo_walk_up',
    windupAnim: 'lodo_quartzo_windup',
    attackAnim: 'lodo_quartzo_attack',
    hurtAnim: 'lodo_quartzo_hurt',
    deathAnim: 'lodo_quartzo_death',
    maxHp: 36,
    speed: 82,
    physicalDamage: 8,
    elementalDamage: { agua: 7 },
    resistances: { agua: 0.35 },
    isBoss: false,
    tint: 0xf472b6,
    baseScale: 0.88,
  },
  morcego_estalactite: {
    texture: 'enemy_sonda_ufologica',
    sheetKey: 'enemy_morcego_estalactite_sheet',
    idleAnim: 'morcego_estalactite_idle',
    walkUpAnim: 'morcego_estalactite_walk_up',
    windupAnim: 'morcego_estalactite_windup',
    attackAnim: 'morcego_estalactite_attack',
    hurtAnim: 'morcego_estalactite_hurt',
    deathAnim: 'morcego_estalactite_death',
    maxHp: 50,
    speed: 116,
    physicalDamage: 8,
    elementalDamage: { agua: 7, ar: 6 },
    resistances: { agua: 0.25, ar: 0.2 },
    isBoss: false,
    canFireRanged: true,
    rangedIntervalMs: 2250,
    boltTexture: 'water_bolt',
    tint: 0xc084fc,
    baseScale: 0.94,
  },
  salamandra_abissal: {
    texture: 'enemy_serpente_cristal',
    sheetKey: 'enemy_salamandra_abissal_sheet',
    idleAnim: 'salamandra_abissal_idle',
    walkUpAnim: 'salamandra_abissal_walk_up',
    windupAnim: 'salamandra_abissal_windup',
    attackAnim: 'salamandra_abissal_attack',
    hurtAnim: 'salamandra_abissal_hurt',
    deathAnim: 'salamandra_abissal_death',
    maxHp: 86,
    speed: 96,
    physicalDamage: 14,
    elementalDamage: { agua: 12 },
    resistances: { agua: 0.45 },
    isBoss: false,
    tint: 0x22d3ee,
    baseScale: 1.15,
  },
  // Varginha — 3 novas criaturas
  drone_alfa: {
    texture: 'enemy_sonda_ufologica',
    sheetKey: 'enemy_drone_alfa_sheet',
    idleAnim: 'drone_alfa_idle',
    walkUpAnim: 'drone_alfa_walk_up',
    windupAnim: 'drone_alfa_windup',
    attackAnim: 'drone_alfa_attack',
    hurtAnim: 'drone_alfa_hurt',
    deathAnim: 'drone_alfa_death',
    maxHp: 39,
    speed: 114,
    physicalDamage: 7,
    elementalDamage: { ar: 8 },
    resistances: { ar: 0.3 },
    isBoss: false,
    canFireRanged: true,
    rangedIntervalMs: 2150,
    boltTexture: 'wind_bolt',
    tint: 0x38bdf8,
    baseScale: 0.84,
  },
  androide_xenotecnico: {
    texture: 'enemy_sentinela_omena',
    sheetKey: 'enemy_androide_xenotecnico_sheet',
    idleAnim: 'androide_xenotecnico_idle',
    walkUpAnim: 'androide_xenotecnico_walk_up',
    windupAnim: 'androide_xenotecnico_windup',
    attackAnim: 'androide_xenotecnico_attack',
    hurtAnim: 'androide_xenotecnico_hurt',
    deathAnim: 'androide_xenotecnico_death',
    maxHp: 72,
    speed: 90,
    physicalDamage: 12,
    elementalDamage: { ar: 8, arcano: 7 },
    resistances: { ar: 0.35, arcano: 0.2 },
    isBoss: false,
    tint: 0xa3e635,
    baseScale: 1.0,
  },
  anomalia_magnetica: {
    texture: 'enemy_espectro_ruina',
    sheetKey: 'enemy_anomalia_magnetica_sheet',
    idleAnim: 'anomalia_magnetica_idle',
    walkUpAnim: 'anomalia_magnetica_walk_up',
    windupAnim: 'anomalia_magnetica_windup',
    attackAnim: 'anomalia_magnetica_attack',
    hurtAnim: 'anomalia_magnetica_hurt',
    deathAnim: 'anomalia_magnetica_death',
    maxHp: 90,
    speed: 98,
    physicalDamage: 11,
    elementalDamage: { ar: 10, arcano: 10 },
    resistances: { ar: 0.4, arcano: 0.3 },
    isBoss: false,
    canFireRanged: true,
    rangedIntervalMs: 1950,
    boltTexture: 'wind_bolt',
    tint: 0x818cf8,
    baseScale: 1.16,
  },
  // Fortaleza de Omena — 3 novas criaturas
  sombra_errante: {
    texture: 'enemy_espectro_ruina',
    sheetKey: 'enemy_sombra_errante_sheet',
    idleAnim: 'sombra_errante_idle',
    walkUpAnim: 'sombra_errante_walk_up',
    windupAnim: 'sombra_errante_windup',
    attackAnim: 'sombra_errante_attack',
    hurtAnim: 'sombra_errante_hurt',
    deathAnim: 'sombra_errante_death',
    maxHp: 56,
    speed: 112,
    physicalDamage: 11,
    elementalDamage: { arcano: 11 },
    resistances: { arcano: 0.35 },
    isBoss: false,
    tint: 0xa855f7,
    baseScale: 0.92,
  },
  arauto_abismo: {
    texture: 'enemy_sonda_ufologica',
    sheetKey: 'enemy_arauto_abismo_sheet',
    idleAnim: 'arauto_abismo_idle',
    walkUpAnim: 'arauto_abismo_walk_up',
    windupAnim: 'arauto_abismo_windup',
    attackAnim: 'arauto_abismo_attack',
    hurtAnim: 'arauto_abismo_hurt',
    deathAnim: 'arauto_abismo_death',
    maxHp: 78,
    speed: 92,
    physicalDamage: 12,
    elementalDamage: { arcano: 11, fogo: 9 },
    resistances: { arcano: 0.35, fogo: 0.3 },
    isBoss: false,
    canFireRanged: true,
    rangedIntervalMs: 2050,
    boltTexture: 'omena_bolt',
    tint: 0xf43f5e,
    baseScale: 1.05,
  },
  executor_omena: {
    texture: 'enemy_sentinela_omena',
    sheetKey: 'enemy_executor_omena_sheet',
    idleAnim: 'executor_omena_idle',
    walkUpAnim: 'executor_omena_walk_up',
    windupAnim: 'executor_omena_windup',
    attackAnim: 'executor_omena_attack',
    hurtAnim: 'executor_omena_hurt',
    deathAnim: 'executor_omena_death',
    maxHp: 105,
    speed: 96,
    physicalDamage: 16,
    elementalDamage: { arcano: 12, fogo: 10 },
    resistances: { arcano: 0.4, fogo: 0.35 },
    isBoss: false,
    canFireRanged: true,
    rangedIntervalMs: 1850,
    boltTexture: 'omena_bolt',
    tint: 0xdc2626,
    baseScale: 1.2,
  },
  omena: {
    texture: 'boss_omena',
    sheetKey: 'boss_omena_sheet',
    idleAnim: 'omena_idle',
    walkUpAnim: 'omena_walk_up_ext',
    walkDownAnim: 'omena_glide_side_ext',
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

const TEXTURE_TO_FALLBACK_SHEET: Record<string, string> = {
  enemy_golem_pedra: 'enemy_golem_sheet',
  enemy_espectro_ruina: 'enemy_wisp_sheet',
  enemy_serpente_cristal: 'enemy_serpente_sheet',
  enemy_sonda_ufologica: 'enemy_sonda_sheet',
  enemy_sentinela_omena: 'enemy_sentinela_sheet',
};

function resolveEnemySheetKey(scene: Phaser.Scene, cfg: EnemyStats): { key: string | null; isDedicated: boolean } {
  if (scene.textures.exists(cfg.sheetKey)) {
    return { key: cfg.sheetKey, isDedicated: true };
  }
  const fallback = TEXTURE_TO_FALLBACK_SHEET[cfg.texture];
  if (fallback && scene.textures.exists(fallback)) {
    return { key: fallback, isDedicated: false };
  }
  return { key: null, isDedicated: false };
}

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
  private readonly usingDedicatedSheet: boolean;
  private hpBarBg: Phaser.GameObjects.Rectangle | null = null;
  private hpBarFill: Phaser.GameObjects.Rectangle | null = null;
  private groundShadow: Phaser.GameObjects.Ellipse | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
    const cfg = ENEMY_CONFIGS[kind];
    const resolved = resolveEnemySheetKey(scene, cfg);
    const hasSheet = resolved.key !== null;
    super(scene, x, y, resolved.key ?? cfg.texture, hasSheet ? 0 : undefined);
    this.kind = kind;
    this.stats = cfg;
    this.hp = cfg.maxHp;
    this.effectiveMaxHp = cfg.maxHp;
    this.spawnX = x;
    this.spawnY = y;
    this.useSpriteSheet = hasSheet;
    this.usingDedicatedSheet = resolved.isDedicated;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (cfg.isBoss) {
      body.setSize(46, 36);
      body.setOffset(9, hasSheet ? 26 : 18);
    } else if (hasSheet) {
      body.setSize(22, 18);
      body.setOffset(13, resolved.key === 'enemy_wisp_sheet' ? 20 : 28);
    } else {
      body.setSize(22, 18);
      body.setOffset(5, 10);
    }
    body.setCollideWorldBounds(true);

    if (cfg.baseScale && cfg.baseScale !== 1) {
      this.setScale(cfg.baseScale);
    }
    this.restoreBaseTint();

    const shadowW = cfg.isBoss ? 40 : Math.round(22 * (cfg.baseScale ?? 1));
    const shadowH = cfg.isBoss ? 14 : Math.round(9 * (cfg.baseScale ?? 1));
    this.groundShadow = scene.add
      .ellipse(x, y + (cfg.isBoss ? 22 : 16), shadowW, shadowH, 0x0b0914, 0.32)
      .setDepth(this.y - 0.05);

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
    this.groundShadow
      ?.setPosition(this.x, this.y + (this.stats.isBoss ? 22 : 16))
      .setDepth(this.y - 0.05);
    this.setDepth(this.y);
  }

  private restoreBaseTint(): void {
    if (!this.usingDedicatedSheet && this.stats.tint) {
      this.setTint(this.stats.tint);
    } else if (this.stats.tint && this.stats.sheetKey === ENEMY_CONFIGS[this.kind].sheetKey && !this.usingDedicatedSheet) {
      this.setTint(this.stats.tint);
    } else {
      this.clearTint();
    }
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
      if (this.hitFlashMs === 0) this.restoreBaseTint();
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
      this.updateDirectionalAnim(vx, vy);
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
        this.updateDirectionalAnim(pvx, pvy);
      } else {
        body.setVelocity(0, 0);
        this.updateDirectionalAnim(0, 0);
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

    this.groundShadow
      ?.setPosition(this.x, this.y + (this.stats.isBoss ? 22 : 16))
      .setDepth(this.y - 0.05);
    this.setDepth(this.y);
  }

  private updateDirectionalAnim(vx: number, vy: number): void {
    if (!this.useSpriteSheet || this.isDying) return;
    const cur = this.anims.currentAnim?.key;
    if (
      cur === this.stats.windupAnim ||
      cur === this.stats.attackAnim ||
      cur === this.stats.hurtAnim
    ) {
      return;
    }
    let desired = this.stats.idleAnim;
    if (vy < -10 && Math.abs(vy) >= Math.abs(vx) * 0.75 && this.stats.walkUpAnim) {
      desired = this.stats.walkUpAnim;
    } else if (vy > 10 && Math.abs(vy) >= Math.abs(vx) * 0.75 && this.stats.walkDownAnim) {
      desired = this.stats.walkDownAnim;
    }
    if (cur !== desired && this.scene.anims.exists(desired)) {
      this.play(desired, true);
    }
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
    this.groundShadow?.setVisible(false);
    this.restoreBaseTint();

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
    this.groundShadow?.destroy();
    this.hpBarBg = null;
    this.hpBarFill = null;
    this.groundShadow = null;
    super.destroy(fromScene);
  }
}

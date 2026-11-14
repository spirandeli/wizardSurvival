import Phaser from 'phaser';
import { TILE_SIZE } from '../config/gameConfig';
import { NPC_SHEET_COLS } from '../config/spriteSheets';
import type { NpcDefinition } from '../data/npcs';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  public readonly npcDef: NpcDefinition;
  public readonly tileX: number;
  public readonly tileY: number;
  private readonly anchorX: number;
  private readonly anchorY: number;
  private readonly hasSheet: boolean;
  private label: Phaser.GameObjects.Text;
  private indicatorLabel: Phaser.GameObjects.Text;
  private indicatorBobPhase = 0;
  private workingActive = false;
  private patrolTargetX: number;
  private patrolTargetY: number;
  private patrolPauseMs = 1400;
  private patrolWaypoints: Array<{ x: number; y: number }> = [];
  private patrolIndex = 0;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number, npcDef: NpcDefinition) {
    const col = NPC_SHEET_COLS[npcDef.id];
    const hasSheet = scene.textures.exists('npcs_sheet') && typeof col === 'number';
    const texKey = `npc_${npcDef.id}`;
    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;
    const initialY = hasSheet ? wy - 6 : wy;

    super(
      scene,
      wx,
      initialY,
      hasSheet ? 'npcs_sheet' : scene.textures.exists(texKey) ? texKey : 'player_down',
      hasSheet ? col : undefined
    );
    this.npcDef = npcDef;
    this.tileX = tileX;
    this.tileY = tileY;
    this.anchorX = wx;
    this.anchorY = initialY;
    this.hasSheet = hasSheet;
    this.patrolTargetX = wx;
    this.patrolTargetY = initialY;
    this.patrolPauseMs = 900 + ((col ?? 1) * 430) % 1800;

    // Define gentle autonomous patrol offsets around the schedule anchor
    const spanX = TILE_SIZE * 1.35;
    const spanY = TILE_SIZE * 0.65;
    this.patrolWaypoints = [
      { x: wx, y: initialY },
      { x: wx + spanX, y: initialY },
      { x: wx + spanX * 0.5, y: initialY + spanY },
      { x: wx - spanX * 0.85, y: initialY },
    ];

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(20, 14);
    body.setOffset(hasSheet ? 14 : 6, hasSheet ? 32 : 18);

    if (hasSheet && scene.anims.exists(`npc_${npcDef.id}_idle`)) {
      this.play(`npc_${npcDef.id}_idle`);
    }

    this.setDepth(wy);
    this.label = scene.add
      .text(wx, hasSheet ? wy - 30 : wy - 22, npcDef.name, {
        fontSize: '10px',
        color: '#f3efe6',
        backgroundColor: 'rgba(20, 18, 29, 0.78)',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(wy + 10);

    this.indicatorLabel = scene.add
      .text(wx, hasSheet ? wy - 44 : wy - 36, '', {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f5b942',
        backgroundColor: 'rgba(20, 18, 29, 0.88)',
        padding: { x: 4, y: 1 },
      })
      .setOrigin(0.5)
      .setDepth(wy + 12)
      .setVisible(false);
  }

  setQuestIndicator(kind: '!' | '?' | null): void {
    if (!kind) {
      this.indicatorLabel.setVisible(false);
      return;
    }
    this.indicatorLabel
      .setText(kind)
      .setColor(kind === '?' ? '#5bc26e' : '#f5b942')
      .setVisible(true);
  }

  /**
   * Switches between the NPC's dedicated work-activity animation and standard idle animation.
   */
  setWorkingActivity(active: boolean): void {
    this.workingActive = active;
    if (!active) {
      const idleKey = `npc_${this.npcDef.id}_idle`;
      if (this.anims.currentAnim?.key !== idleKey && this.scene.anims.exists(idleKey)) {
        this.play(idleKey, true);
      }
    }
  }

  /**
   * Updates autonomous NPC patrol, idle/work cycles, player facing, and floating labels.
   */
  updateAutonomous(
    deltaMs: number,
    playerX: number,
    playerY: number,
    canWalkTile?: (worldX: number, worldY: number) => boolean
  ): void {
    this.indicatorBobPhase += deltaMs * 0.0048;
    const distToPlayer = Math.hypot(playerX - this.x, playerY - this.y);
    const id = this.npcDef.id;
    const idleKey = `npc_${id}_idle`;
    const workKey = `npc_${id}_work`;
    const sideKey = this.scene.anims.exists(`npc_${id}_walk_side`)
      ? `npc_${id}_walk_side`
      : `npc_${id}_side`;
    const downKey = this.scene.anims.exists(`npc_${id}_walk_down`) ? `npc_${id}_walk_down` : idleKey;
    const upKey = this.scene.anims.exists(`npc_${id}_walk_up`) ? `npc_${id}_walk_up` : sideKey;

    if (distToPlayer < 46) {
      // Pause and face the player when nearby
      if (Math.abs(playerX - this.x) > 6) {
        this.setFlipX(playerX < this.x);
      }
      if (this.anims.currentAnim?.key !== idleKey && this.scene.anims.exists(idleKey)) {
        this.play(idleKey, true);
      }
    } else if (this.patrolPauseMs > 0) {
      this.patrolPauseMs -= deltaMs;
      const pauseAnim =
        this.workingActive && this.scene.anims.exists(workKey) ? workKey : idleKey;
      if (this.anims.currentAnim?.key !== pauseAnim && this.scene.anims.exists(pauseAnim)) {
        this.play(pauseAnim, true);
      }
      if (this.patrolPauseMs <= 0 && this.patrolWaypoints.length > 0) {
        this.patrolIndex = (this.patrolIndex + 1) % this.patrolWaypoints.length;
        const wp = this.patrolWaypoints[this.patrolIndex] ?? { x: this.anchorX, y: this.anchorY };
        if (!canWalkTile || canWalkTile(wp.x, wp.y + 6)) {
          this.patrolTargetX = wp.x;
          this.patrolTargetY = wp.y;
        } else {
          this.patrolTargetX = this.anchorX;
          this.patrolTargetY = this.anchorY;
        }
      }
    } else {
      const dx = this.patrolTargetX - this.x;
      const dy = this.patrolTargetY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 2.5) {
        this.setPosition(this.patrolTargetX, this.patrolTargetY);
        this.patrolPauseMs = this.workingActive ? 2800 : 1800;
      } else {
        const speed = 28 * (deltaMs / 1000);
        const nx = this.x + (dx / dist) * Math.min(dist, speed);
        const ny = this.y + (dy / dist) * Math.min(dist, speed);
        if (!canWalkTile || canWalkTile(nx, ny + 6)) {
          this.setPosition(nx, ny);
          if (Math.abs(dx) >= Math.abs(dy)) {
            this.setFlipX(dx < 0);
            if (this.anims.currentAnim?.key !== sideKey && this.scene.anims.exists(sideKey)) {
              this.play(sideKey, true);
            }
          } else {
            const vKey = dy > 0 ? downKey : upKey;
            if (this.anims.currentAnim?.key !== vKey && this.scene.anims.exists(vKey)) {
              this.play(vKey, true);
            }
          }
        } else {
          this.patrolTargetX = this.anchorX;
          this.patrolTargetY = this.anchorY;
          this.patrolPauseMs = 1500;
        }
      }
    }

    const body = this.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) {
      body.updateFromGameObject();
      body.setSize(20, 14);
      body.setOffset(this.hasSheet ? 14 : 6, this.hasSheet ? 32 : 18);
    }

    const wy = this.hasSheet ? this.y + 6 : this.y;
    this.setDepth(wy);
    this.label.setPosition(this.x, this.hasSheet ? wy - 30 : wy - 22).setDepth(wy + 10);
    const bobOffset = Math.sin(this.indicatorBobPhase) * 2.5;
    this.indicatorLabel
      .setPosition(this.x, (this.hasSheet ? wy - 44 : wy - 36) + bobOffset)
      .setDepth(wy + 12);
  }

  destroy(fromScene?: boolean): void {
    this.label.destroy();
    this.indicatorLabel.destroy();
    super.destroy(fromScene);
  }
}


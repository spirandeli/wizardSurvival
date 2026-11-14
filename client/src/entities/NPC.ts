import Phaser from 'phaser';
import { TILE_SIZE } from '../config/gameConfig';
import { NPC_SHEET_COLS } from '../config/spriteSheets';
import type { NpcDefinition } from '../data/npcs';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  public readonly npcDef: NpcDefinition;
  public readonly tileX: number;
  public readonly tileY: number;
  private label: Phaser.GameObjects.Text;
  private indicatorLabel: Phaser.GameObjects.Text;
  private baseIndicatorY: number;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number, npcDef: NpcDefinition) {
    const col = NPC_SHEET_COLS[npcDef.id];
    const hasSheet = scene.textures.exists('npcs_sheet') && typeof col === 'number';
    const texKey = `npc_${npcDef.id}`;
    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;

    super(
      scene,
      wx,
      hasSheet ? wy - 6 : wy,
      hasSheet ? 'npcs_sheet' : scene.textures.exists(texKey) ? texKey : 'player_down',
      hasSheet ? col : undefined
    );
    this.npcDef = npcDef;
    this.tileX = tileX;
    this.tileY = tileY;

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

    this.baseIndicatorY = hasSheet ? wy - 44 : wy - 36;
    this.indicatorLabel = scene.add
      .text(wx, this.baseIndicatorY, '', {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f5b942',
        backgroundColor: 'rgba(20, 18, 29, 0.88)',
        padding: { x: 4, y: 1 },
      })
      .setOrigin(0.5)
      .setDepth(wy + 12)
      .setVisible(false);

    scene.tweens.add({
      targets: this.indicatorLabel,
      y: this.baseIndicatorY - 4,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
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
    const workKey = `npc_${this.npcDef.id}_work`;
    const idleKey = `npc_${this.npcDef.id}_idle`;
    const targetKey = active && this.scene.anims.exists(workKey) ? workKey : idleKey;
    if (this.anims.currentAnim?.key === targetKey || !this.scene.anims.exists(targetKey)) {
      return;
    }
    this.play(targetKey, true);
  }

  destroy(fromScene?: boolean): void {
    this.label.destroy();
    this.indicatorLabel.destroy();
    super.destroy(fromScene);
  }
}


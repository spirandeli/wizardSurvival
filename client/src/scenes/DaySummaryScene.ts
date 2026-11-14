import Phaser from 'phaser';
import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { SaveManager } from '../core/SaveManager';

export interface DaySummaryData {
  dayFinished: number;
  season: string;
  itemsSold: number;
  goldEarned: number;
  cropsGrown: number;
  cropsReady: number;
  hatchedMiniDragons: number;
  hatchedUnicorns?: number;
  reason?: 'sleep' | 'exhausted' | 'fainted';
}

export class DaySummaryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DaySummaryScene' });
  }

  create(data: DaySummaryData): void {
    const state = gameState.getState();
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x100e1a, 1);

    const titleText =
      data.reason === 'fainted'
        ? `Desmaio na Dungeon — Fim do Dia ${data.dayFinished}`
        : data.reason === 'exhausted'
          ? `Exaustão às 02:00 — Fim do Dia ${data.dayFinished}`
          : `Resumo do Dia ${data.dayFinished} (${data.season})`;

    this.add
      .text(width / 2, 110, titleText, {
        fontSize: '26px',
        color: '#f5b942',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const lines = [
      `Itens vendidos na Caixa de Remessas: ${data.itemsSold} (+${data.goldEarned} Ouro)`,
      `Safras regadas que cresceram: ${data.cropsGrown} (${data.cropsReady} prontas para colheita)`,
      `Chocados na Incubadora: ${data.hatchedMiniDragons} Mini-Dragão(ões) • ${data.hatchedUnicorns ?? 0} Unicórnio(s)`,
      ``,
      `Amanhã: Dia ${state.time.day} de ${state.time.season} • Lua ${state.time.moonPhase} • Clima: ${state.time.weather}`,
      `Ouro atual: ${state.gold} G • Mini-Dragões: ${state.miniDragonsCount} • Unicórnios: ${state.unicorns.length}`,
    ];

    this.add
      .text(width / 2, 265, lines.join('\n'), {
        fontSize: '16px',
        color: '#f3efe6',
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5);

    const saveStatus = this.add
      .text(width / 2, 410, 'Salvando progresso na sua conta...', {
        fontSize: '14px',
        color: '#4deeea',
      })
      .setOrigin(0.5);

    void SaveManager.saveGame(state)
      .then(() => {
        saveStatus.setText('✓ Progresso salvo no banco SQLite!');
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
        saveStatus.setText(`Aviso ao salvar: ${msg}`).setColor('#ff7b89');
      });

    const continueBtn = this.add
      .text(width / 2, 490, '[ Pressione ESPAÇO ou clique para acordar ]', {
        fontSize: '16px',
        color: '#5bc26e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const proceed = () => {
      EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
      EventBus.emit('TIME_TICK', { time: state.time });
      EventBus.emit('GOLD_UPDATED', { gold: state.gold });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      this.scene.start('WorldScene', {
        mapId: 'casa',
        spawnTileX: 3,
        spawnTileY: 3,
      });
    };

    continueBtn.once('pointerdown', proceed);
    this.input.keyboard?.once('keydown-SPACE', proceed);
    this.input.keyboard?.once('keydown-ENTER', proceed);
  }
}


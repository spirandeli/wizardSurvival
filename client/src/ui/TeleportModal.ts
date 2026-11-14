import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import {
  getUnlockedDungeonCheckpoints,
  TOTAL_PROCEDURAL_FLOORS,
  type DungeonId,
} from '../systems/DungeonGenerator';
import { ManaSystem, SPELLS } from '../systems/ManaSystem';

const WAYPOINT_LABELS: Record<string, string> = {
  fazenda: 'Fazenda da Névoa',
  casa: 'Interior da Casa',
  porao: 'Porão do Antigo Protetor',
  cidade: 'Praça de São Tomé dos Números',
};

const DUNGEON_CP_NAMES: ReadonlyArray<{ id: DungeonId; label: string }> = [
  { id: 'machu_picchu', label: 'Machu Picchu (Terra)' },
  { id: 'chapada', label: 'Chapada (Águas)' },
  { id: 'varginha', label: 'Varginha (Céus)' },
  { id: 'fortaleza_omena', label: 'Fortaleza de Omena' },
];

export class TeleportModal {
  private root: HTMLElement;
  private isOpen = false;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'teleport-modal';
    this.root.className = 'modal-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    EventBus.on('OPEN_TELEPORT_MODAL', () => {
      if (this.isOpen) {
        this.close();
        return;
      }
      this.open();
    });
  }

  open(): void {
    const state = gameState.getState();
    const manaSys = new ManaSystem(state);
    if (!manaSys.hasSpell('teleporte')) {
      EventBus.emit('SHOW_TOAST', {
        message: 'Desperte o grimório Lupin no porão para aprender o Teleporte.',
        kind: 'info',
      });
      return;
    }

    this.isOpen = true;
    this.root.style.display = 'flex';
    this.render();
  }

  close(): void {
    this.isOpen = false;
    this.root.style.display = 'none';
  }

  destroy(): void {
    this.root.remove();
  }

  private render(): void {
    const state = gameState.getState();
    const manaCost = SPELLS.teleporte?.manaCost ?? 15;
    const canAfford = state.vitals.mana >= manaCost;

    const buttonsHtml = state.discoveredWaypoints
      .map((wp) => {
        const isCurrent = state.mapId === wp;
        const label = WAYPOINT_LABELS[wp] ?? wp;
        return `
          <button type="button" class="tp-btn" data-wp="${wp}" ${
            isCurrent || !canAfford ? 'disabled' : ''
          }>
            <span>✦ ${label}</span>
            <span>${isCurrent ? 'Local atual' : `${manaCost} Mana`}</span>
          </button>
        `;
      })
      .join('');

    const checkpointsHtml = DUNGEON_CP_NAMES.map((d) => {
      const unlocked = getUnlockedDungeonCheckpoints(state.flags, d.id);
      const badges = [1, 5, 10, TOTAL_PROCEDURAL_FLOORS + 1]
        .map((f) => {
          const ok = unlocked.includes(f);
          const lbl = f > TOTAL_PROCEDURAL_FLOORS ? 'Arena' : `A.${f}`;
          return `<span class="badge-pill" style="opacity:${ok ? '1' : '0.38'}">${ok ? '✓' : '🔒'} ${lbl}</span>`;
        })
        .join(' ');
      return `
        <div class="tp-checkpoint-row">
          <strong>${d.label}</strong>
          <div class="tp-checkpoint-badges">${badges}</div>
        </div>
      `;
    }).join('');

    this.root.innerHTML = `
      <div class="modal-card tp-card">
        <div class="modal-header">
          <h2 class="tp-title">Teleporte Telúrico (Lupin)</h2>
          <button type="button" id="tp-close-btn" class="modal-close">✕</button>
        </div>
        <p class="tp-subtitle">Mana atual: <strong>${state.vitals.mana}/${state.vitals.maxMana}</strong> • Custo: ${manaCost} Mana</p>
        <div class="tp-list">${buttonsHtml}</div>
        <div class="tp-checkpoints-box">
          <p class="tp-subtitle" style="margin-top:12px">Elevadores Rúnicos Sintonizados (acesse pelos Portais do Porão):</p>
          ${checkpointsHtml}
        </div>
      </div>
    `;

    this.root.querySelector('#tp-close-btn')?.addEventListener('click', () => this.close());

    this.root.querySelectorAll<HTMLButtonElement>('.tp-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetMap = btn.dataset.wp;
        if (targetMap) {
          this.close();
          EventBus.emit('CAST_TELEPORT', { targetMap });
        }
      });
    });
  }
}


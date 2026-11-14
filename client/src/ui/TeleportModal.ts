import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { ManaSystem, SPELLS } from '../systems/ManaSystem';

const WAYPOINT_LABELS: Record<string, string> = {
  fazenda: 'Fazenda da Névoa',
  casa: 'Interior da Casa',
  porao: 'Porão do Antigo Protetor',
  cidade: 'Praça de São Tomé dos Números',
};

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

    this.root.innerHTML = `
      <div class="modal-card tp-card">
        <div class="modal-header">
          <h2 class="tp-title">Teleporte Telúrico (Lupin)</h2>
          <button type="button" id="tp-close-btn" class="modal-close">✕</button>
        </div>
        <p class="tp-subtitle">Mana atual: <strong>${state.vitals.mana}/${state.vitals.maxMana}</strong> • Custo: ${manaCost} Mana</p>
        <div class="tp-list">${buttonsHtml}</div>
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


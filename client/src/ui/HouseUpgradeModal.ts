import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getItemDef } from '../data/items';
import { HOUSE_TIERS, upgradeHouse } from '../systems/HouseUpgradeSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { renderItemIconHtml } from './ItemIcon';

export class HouseUpgradeModal {
  private root: HTMLElement;
  private isOpen = false;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'house-upgrade-modal';
    this.root.className = 'modal-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    EventBus.on('OPEN_HOUSE_UPGRADE_MODAL', () => {
      if (this.isOpen) {
        this.close();
        return;
      }
      this.open();
    });
  }

  open(): void {
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
    const inv = new InventorySystem(state);
    const currentLevel = state.houseLevel ?? 1;
    const currentTier = HOUSE_TIERS.find((t) => t.level === currentLevel) ?? HOUSE_TIERS[0]!;
    const nextTier = HOUSE_TIERS.find((t) => t.level === currentLevel + 1);

    this.root.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="tp-title">Reforma da Moradia — Fazenda da Névoa</h2>
          <button type="button" id="house-close-btn" class="modal-close">✕</button>
        </div>

        <div class="quest-row status-completed">
          <div class="quest-top">
            <span class="quest-title">Nível Atual: ${currentLevel}/3 — ${currentTier.name}</span>
            <span class="quest-badge">${state.gold} G disponíveis</span>
          </div>
          <p class="quest-desc">${currentTier.description}</p>
          <p class="quest-reward">Benefício atual: ${currentTier.perkLabel}</p>
        </div>

        ${nextTier
        ? `
          <h3 class="quest-section-title">Próxima Ampliação: Nível ${nextTier.level} — ${nextTier.name}</h3>
          <div class="quest-row status-active">
            <p class="quest-desc">${nextTier.description}</p>
            <p class="quest-reward">Benefício permanente: ${nextTier.perkLabel}</p>
            <div class="house-req-list">
              <span class="badge-pill ${state.gold >= nextTier.goldCost ? 'perk' : ''}">💰 ${nextTier.goldCost} G</span>
              ${nextTier.materials
          .map((m) => {
            const have = inv.countItem(m.itemId);
            const def = getItemDef(m.itemId);
            return `<span class="badge-pill ${have >= m.quantity ? 'perk' : ''}">
                    ${renderItemIconHtml(m.itemId, 16)} ${def?.name ?? m.itemId}: ${have}/${m.quantity}
                  </span>`;
          })
          .join('')}
            </div>
            <div style="margin-top:10px;display:flex;gap:8px;">
              <button type="button" id="house-upgrade-btn" class="rpg-btn">🔨 Ampliar Moradia</button>
            </div>
          </div>
        `
        : `<p class="quest-empty">✨ Sua casa atingiu o ápice mágico! Todas as bênçãos estruturais estão ativas.</p>`
      }
      </div>
    `;

    this.root.querySelector('#house-close-btn')?.addEventListener('click', () => this.close());
    this.root.querySelector('#house-upgrade-btn')?.addEventListener('click', () => {
      const res = upgradeHouse(state, inv);
      EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'craft' : 'error' });
      EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
      if (res.ok) {
        EventBus.emit('GOLD_UPDATED', { gold: state.gold });
        EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        this.render();
      }
    });
  }
}

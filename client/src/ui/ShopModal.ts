import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getItemDef } from '../data/items';
import { InventorySystem } from '../systems/InventorySystem';
import { getVillagerShopDiscount } from '../systems/NPCSystem';
import { renderItemIconHtml } from './ItemIcon';

export type ShopId = 'botica' | 'ferraria' | 'pub';

interface ShopCatalog {
  title: string;
  items: string[];
}

const SHOPS: Record<ShopId, ShopCatalog> = {
  botica: {
    title: 'Botica Estelar da Celeste',
    items: [
      'semente_raiz_quartzo',
      'semente_lupulo_estelar',
      'semente_flor_sombra',
      'pocao_mana_menor',
      'pocao_cura_menor',
      'tonico_nevoa',
      'elixir_solsticio',
      'ovo_unicornio',
    ],
  },
  ferraria: {
    title: 'Ferraria do Bento "Bigorna"',
    items: ['prego', 'pocao_energia_menor'],
  },
  pub: {
    title: 'Pub de Pedra da Ísis',
    items: ['pocao_energia_menor', 'pocao_mana_menor', 'semente_lupulo_estelar'],
  },
};

export class ShopModal {
  private root: HTMLElement;
  private currentShopId: ShopId = 'botica';

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'shop-modal';
    this.root.className = 'modal-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    EventBus.on('OPEN_SHOP_MODAL', ({ shopId }) => {
      if (this.root.style.display === 'flex' && this.currentShopId === shopId) {
        this.close();
        return;
      }
      this.currentShopId = shopId;
      this.open();
    });
  }

  open(): void {
    this.root.style.display = 'flex';
    this.render();
  }

  close(): void {
    this.root.style.display = 'none';
  }

  destroy(): void {
    this.root.remove();
  }

  private render(): void {
    const state = gameState.getState();
    const shop = SHOPS[this.currentShopId];
    const ownerNpcId =
      this.currentShopId === 'botica'
        ? 'celeste'
        : this.currentShopId === 'ferraria'
          ? 'bento'
          : 'isis';
    const discountRate = getVillagerShopDiscount(state, ownerNpcId);
    const discountPct = Math.round(discountRate * 100);

    const rowsHtml = shop.items
      .map((itemId) => {
        const def = getItemDef(itemId);
        if (!def) return '';
        const basePrice = def.buyPrice ?? Math.max(15, def.sellPrice * 2);
        const price = discountRate > 0 ? Math.max(1, Math.round(basePrice * (1 - discountRate))) : basePrice;
        const canAfford = state.gold >= price;

        return `
          <div class="recipe-row">
            <div class="recipe-main">
              <div class="recipe-icon-box">${renderItemIconHtml(def.id, 36)}</div>
              <div>
                <div class="recipe-title">${def.name}</div>
                <div class="recipe-ing">${def.description}</div>
              </div>
            </div>
            <button type="button" class="recipe-btn buy-btn" data-item="${def.id}" data-price="${price}" ${canAfford ? '' : 'disabled'
          }>
              Comprar (${price} G${discountPct > 0 ? ` -${discountPct}%` : ''})
            </button>
          </div>
        `;
      })
      .join('');

    this.root.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="tp-title">${shop.title}</h2>
          <button type="button" id="shop-close-btn" class="modal-close">✕</button>
        </div>
        <p class="tp-subtitle">Seu Ouro: <strong>${state.gold} G</strong>${discountPct > 0 ? ` • <span style="color:#5bc26e">★ Desconto de Amizade (-${discountPct}%) ativo!</span>` : ''
      }</p>
        <div class="recipes-list">${rowsHtml}</div>
      </div>
    `;

    this.root.querySelector('#shop-close-btn')?.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('.buy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.item;
        const price = Number(btn.dataset.price);
        if (!itemId || Number.isNaN(price) || state.gold < price) return;

        const inv = new InventorySystem(state);
        const leftover = inv.addItem(itemId, 1);
        if (leftover > 0) {
          EventBus.emit('SHOW_TOAST', { message: 'Mochila cheia!', kind: 'error' });
          return;
        }
        state.gold -= price;
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'craft' });
        EventBus.emit('GOLD_UPDATED', { gold: state.gold });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        EventBus.emit('SHOW_TOAST', {
          message: `Comprou 1x ${getItemDef(itemId)?.name ?? itemId}!`,
          kind: 'success',
        });
        this.render();
      });
    });
  }
}

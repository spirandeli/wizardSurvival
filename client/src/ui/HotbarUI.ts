import type { ItemDefinition } from '@shared/types';
import { HOTBAR_SIZE } from '../config/gameConfig';
import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getItemDef } from '../data/items';
import { renderItemIconHtml } from './ItemIcon';
import { UI_SVG } from './UiIcons';

const SHORTCUT_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];

function getActionHint(def: ItemDefinition | undefined, isWeaponEquipped: boolean): string {
  if (!def) return 'Selecione um espaço do cinto ou abra a Mochila [I]';
  switch (def.category) {
    case 'tool':
      return '[Clique / E] Usar ferramenta';
    case 'weapon':
      return isWeaponEquipped
        ? '[Clique / E] Lançar magia • [Espaço] Golpe'
        : '[Clique / E] Equipar cajado';
    case 'armor':
      return '[Clique / E] Vestir roupa';
    case 'consumable':
    case 'crop':
      return def.hpRestore || def.manaRestore || def.energyRestore
        ? '[Clique / E] Consumir'
        : def.description;
    case 'seed':
      return '[Clique / E] Plantar em solo arado';
    case 'placeable':
      return '[Clique / E] Posicionar na fazenda';
    default:
      return '[G] Presentear NPC • [E] Caixa de Remessas';
  }
}

export class HotbarUI {
  private root: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'hotbar-root';
    this.root.className = 'hotbar-root ui-interactive';
    parent.appendChild(this.root);

    this.render();

    EventBus.on('INVENTORY_UPDATED', () => this.render());
    EventBus.on('GAME_READY', () => this.render());
  }

  destroy(): void {
    this.root.remove();
  }

  private render(): void {
    const state = gameState.getState();
    const selected = state.selectedHotbarIndex;
    const hasTeleport = state.unlockedSpells.includes('teleporte');

    const slotsHtml = Array.from({ length: HOTBAR_SIZE }, (_, idx) => {
      const slot = state.inventory[idx];
      const def = slot ? getItemDef(slot.itemId) : undefined;
      const isSelected = idx === selected;
      const qtyHtml = slot && slot.quantity > 1 ? `<span class="slot-qty">${slot.quantity}</span>` : '';
      const iconHtml = def ? renderItemIconHtml(def.id, 30) : '<span class="slot-empty-dot"></span>';

      return `
        <button type="button" class="hotbar-slot cat-border-${def?.category ?? 'empty'} ${
          isSelected ? 'selected' : ''
        }" data-slot="${idx}" title="${
          def ? `${def.name} — ${def.description} (Clique novamente ou botão direito para usar)` : 'Espaço vazio'
        }">
          <span class="slot-key">${SHORTCUT_LABELS[idx] ?? ''}</span>
          <span class="slot-icon-wrap">${iconHtml}</span>
          ${qtyHtml}
        </button>
      `;
    }).join('');

    const currentSlot = state.inventory[selected];
    const currentDef = currentSlot ? getItemDef(currentSlot.itemId) : undefined;
    const isEquippedWeapon = Boolean(currentDef && state.equippedWeaponId === currentDef.id);
    const hint = getActionHint(currentDef, isEquippedWeapon);

    this.root.innerHTML = `
      <div class="hotbar-banner">
        <span class="hotbar-item-name">${currentDef ? currentDef.name : 'Mão vazia'}</span>
        <span class="hotbar-item-hint">${hint}</span>
      </div>
      <div class="hotbar-shell">
        <div class="hotbar-slots">${slotsHtml}</div>
        <div class="hotbar-dock">
          <button type="button" id="dock-btn-inv" class="dock-btn" title="Mochila & Equipamentos [I]">
            ${UI_SVG.bag}<span>I</span>
          </button>
          <button type="button" id="dock-btn-craft" class="dock-btn" title="Criação & Fundição [C]">
            ${UI_SVG.craft}<span>C</span>
          </button>
          <button type="button" id="dock-btn-quest" class="dock-btn" title="Grimório & Missões [J]">
            ${UI_SVG.quest}<span>J</span>
          </button>
          <button type="button" id="dock-btn-tp" class="dock-btn ${hasTeleport ? '' : 'locked'}" title="${
            hasTeleport ? 'Teleporte Telúrico [T]' : 'Desperte Lupin no porão para liberar'
          }">
            ${UI_SVG.teleport}<span>T</span>
          </button>
        </div>
      </div>
    `;

    this.root.querySelectorAll<HTMLButtonElement>('.hotbar-slot').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.slot);
        if (Number.isNaN(idx)) return;
        if (idx === state.selectedHotbarIndex && state.inventory[idx]) {
          EventBus.emit('USE_INVENTORY_SLOT', { slotIndex: idx });
        } else {
          EventBus.emit('SELECT_HOTBAR_SLOT', { index: idx });
        }
      });

      btn.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        const idx = Number(btn.dataset.slot);
        if (Number.isNaN(idx)) return;
        EventBus.emit('SELECT_HOTBAR_SLOT', { index: idx });
        if (state.inventory[idx]) {
          EventBus.emit('USE_INVENTORY_SLOT', { slotIndex: idx });
        }
      });
    });

    this.root.querySelector('#dock-btn-inv')?.addEventListener('click', () => {
      EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'mochila' });
    });
    this.root.querySelector('#dock-btn-craft')?.addEventListener('click', () => {
      EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'criacao' });
    });
    this.root.querySelector('#dock-btn-quest')?.addEventListener('click', () => {
      EventBus.emit('OPEN_QUEST_MODAL');
    });
    this.root.querySelector('#dock-btn-tp')?.addEventListener('click', () => {
      EventBus.emit('OPEN_TELEPORT_MODAL');
    });
  }
}

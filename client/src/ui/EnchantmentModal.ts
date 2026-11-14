import type { ElementType } from '@shared/types';
import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import {
  ALL_ELEMENTS,
  ELEMENT_LABELS,
  EnchantmentSystem,
} from '../systems/EnchantmentSystem';
import { InventorySystem } from '../systems/InventorySystem';

export class EnchantmentModal {
  private root: HTMLElement;
  private isOpen = false;
  private onOpenHandler: () => void;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'enchantment-modal';
    this.root.className = 'modal-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    this.onOpenHandler = () => {
      if (this.isOpen) {
        this.close();
        return;
      }
      this.open();
    };

    EventBus.on('OPEN_ENCHANTMENT_MODAL', this.onOpenHandler);
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
    EventBus.off('OPEN_ENCHANTMENT_MODAL', this.onOpenHandler);
    this.root.remove();
  }

  private render(): void {
    const state = gameState.getState();
    const inv = new InventorySystem(state);
    const milkCount = inv.countItem('leite_unicornio');
    const quartzCount = inv.countItem('quartzo_refinado');

    const bonusBadges = ALL_ELEMENTS.map((el: ElementType) => {
      const dmg = state.enchantments.weaponBonus[el] ?? 0;
      const res = Math.round((state.enchantments.armorResistanceBonus[el] ?? 0) * 100);
      if (dmg === 0 && res === 0) return '';
      return `<span class="quest-badge">${ELEMENT_LABELS[el]}: +${dmg} Dano / ${res}% Res.</span>`;
    })
      .filter(Boolean)
      .join(' ');

    const unicornsHtml =
      state.unicorns.length === 0
        ? `<p class="quest-empty">Você ainda não possui Unicórnios na fazenda. Consiga um Ovo de Unicórnio (Missão 2.1 ou Botica da Celeste após o Ato I) e choque-o na Incubadora Arcana.</p>`
        : state.unicorns
            .map((u) => {
              const slotsHtml = u.rolledEnchants
                .map((el, idx) => {
                  return `
                    <div class="enchant-slot">
                      <span class="enchant-el">✦ ${ELEMENT_LABELS[el]}</span>
                      <div class="enchant-actions">
                        <button type="button" class="recipe-btn apply-enchant-btn" data-uid="${u.id}" data-slot="${idx}" data-target="weapon" ${
                          milkCount < 1 ? 'disabled' : ''
                        }>+Arma</button>
                        <button type="button" class="recipe-btn apply-enchant-btn" data-uid="${u.id}" data-slot="${idx}" data-target="armor" ${
                          milkCount < 1 ? 'disabled' : ''
                        }>+Armadura</button>
                      </div>
                    </div>
                  `;
                })
                .join('');

              return `
                <div class="quest-card">
                  <div class="quest-header">
                    <span class="quest-title">🦄 ${u.name}</span>
                    <button type="button" class="hud-btn reroll-unicorn-btn" data-uid="${u.id}" ${
                      quartzCount < 1 ? 'disabled' : ''
                    }>Re-rolar 3 Encantos (1x Quartzo Refinado)</button>
                  </div>
                  <div class="enchant-grid">${slotsHtml}</div>
                </div>
              `;
            })
            .join('');

    this.root.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="tp-title">✨ Bancada de Encantamento (Unicórnios)</h2>
          <button type="button" id="ench-close-btn" class="modal-close">✕</button>
        </div>
        <p class="tp-subtitle">
          Cada encanto consome <strong>1x Leite de Unicórnio</strong> (você tem: <strong>${milkCount}</strong>) • Quartzo Refinado: <strong>${quartzCount}</strong>
        </p>
        <div class="enchant-summary">${bonusBadges || '<span class="quest-empty">Nenhum bônus elemental aplicado ainda.</span>'}</div>
        <div class="quests-list">${unicornsHtml}</div>
      </div>
    `;

    this.root.querySelector('#ench-close-btn')?.addEventListener('click', () => this.close());

    this.root.querySelectorAll<HTMLButtonElement>('.apply-enchant-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.uid;
        const slot = Number(btn.dataset.slot);
        const target = btn.dataset.target as 'weapon' | 'armor' | undefined;
        if (!uid || Number.isNaN(slot) || !target) return;

        const enchSys = new EnchantmentSystem(state, inv);
        const res = enchSys.applyEnchant(uid, slot, target);
        EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'magic' : 'error' });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        EventBus.emit('QUESTS_UPDATED');
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('.reroll-unicorn-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.uid;
        if (!uid) return;
        const enchSys = new EnchantmentSystem(state, inv);
        const res = enchSys.rerollUnicorn(uid);
        EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'magic' : 'error' });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        this.render();
      });
    });
  }
}

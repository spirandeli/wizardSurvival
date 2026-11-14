import type { ElementType, ItemDefinition } from '@shared/types';
import { HOTBAR_SIZE } from '../config/gameConfig';
import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getItemDef } from '../data/items';
import { RECIPES, type RecipeDefinition } from '../data/recipes';
import { CombatSystem } from '../systems/CombatSystem';
import { CraftingSystem } from '../systems/CraftingSystem';
import { ELEMENT_LABELS } from '../systems/EnchantmentSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { getCategoryLabelPt, renderItemIconHtml } from './ItemIcon';
import { renderGuardianPaperDollSvg, UI_SVG } from './UiIcons';

const SHORTCUT_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];

type CraftFilter = 'all' | 'stations' | 'gear' | 'alchemy';

function formatItemStats(def: ItemDefinition): string[] {
  const parts: string[] = [];
  if (def.attackPower) parts.push(`Ataque: +${def.attackPower}`);
  if (def.elementalDamage) {
    for (const [el, val] of Object.entries(def.elementalDamage) as [ElementType, number][]) {
      if (val) parts.push(`${ELEMENT_LABELS[el] ?? el}: +${val} Dano`);
    }
  }
  if (def.elementalResistance) {
    for (const [el, val] of Object.entries(def.elementalResistance) as [ElementType, number][]) {
      if (val) parts.push(`${ELEMENT_LABELS[el] ?? el}: +${Math.round(val * 100)}% Res.`);
    }
  }
  if (def.hpRestore) parts.push(`Restaura +${def.hpRestore} HP`);
  if (def.manaRestore) parts.push(`Restaura +${def.manaRestore} Mana`);
  if (def.energyRestore) parts.push(`Restaura +${def.energyRestore} Stamina`);
  if (def.sellPrice > 0) parts.push(`Venda: ${def.sellPrice} G`);
  return parts;
}

function matchesCraftFilter(recipe: RecipeDefinition, filter: CraftFilter): boolean {
  if (filter === 'all') return true;
  const out = getItemDef(recipe.outputItemId);
  if (filter === 'stations') return out?.category === 'placeable';
  if (filter === 'gear') return out?.category === 'weapon' || out?.category === 'armor';
  if (filter === 'alchemy') {
    return out?.category === 'consumable' || out?.category === 'resource';
  }
  return true;
}

export class InventoryModal {
  private root: HTMLElement;
  private isOpen = false;
  private activeTab: 'mochila' | 'criacao' = 'mochila';
  private inspectedSlotIndex: number = 0;
  private moveSourceSlot: number | null = null;
  private craftFilter: CraftFilter = 'all';

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'inventory-modal';
    this.root.className = 'modal-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    EventBus.on('OPEN_INVENTORY_MODAL', ({ tab }) => {
      if (this.isOpen && (!tab || tab === this.activeTab)) {
        this.close();
        return;
      }
      this.activeTab = tab ?? 'mochila';
      this.open();
    });

    EventBus.on('INVENTORY_UPDATED', () => {
      if (this.isOpen) this.render();
    });
  }

  open(): void {
    this.isOpen = true;
    this.moveSourceSlot = null;
    this.inspectedSlotIndex = gameState.getState().selectedHotbarIndex;
    this.root.style.display = 'flex';
    this.render();
  }

  close(): void {
    this.isOpen = false;
    this.moveSourceSlot = null;
    this.root.style.display = 'none';
  }

  isVisible(): boolean {
    return this.isOpen;
  }

  destroy(): void {
    this.root.remove();
  }

  private renderSlotCell(idx: number, showShortcut: boolean): string {
    const state = gameState.getState();
    const slot = state.inventory[idx];
    const def = slot ? getItemDef(slot.itemId) : undefined;
    const isInspected = idx === this.inspectedSlotIndex;
    const isMoveSource = idx === this.moveSourceSlot;
    const isHotbarSelected = idx === state.selectedHotbarIndex;

    const classes = [
      'inv-slot',
      def ? `cat-border-${def.category}` : 'empty',
      isInspected ? 'inspected' : '',
      isHotbarSelected ? 'hotbar-active' : '',
      isMoveSource ? 'move-source' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `
      <div class="${classes}" data-slot="${idx}" draggable="${slot ? 'true' : 'false'}" title="${
        def ? `${def.name} — ${def.description}` : 'Espaço vazio (arraste um item aqui)'
      }">
        ${showShortcut ? `<span class="inv-slot-key">${SHORTCUT_LABELS[idx] ?? ''}</span>` : ''}
        ${def ? renderItemIconHtml(def.id, 34) : ''}
        ${slot && slot.quantity > 1 ? `<span class="inv-slot-qty">${slot.quantity}</span>` : ''}
      </div>
    `;
  }

  private render(): void {
    const state = gameState.getState();
    const invSys = new InventorySystem(state);
    const craftSys = new CraftingSystem(state, invSys);

    const weaponDef = state.equippedWeaponId ? getItemDef(state.equippedWeaponId) : undefined;
    const armorDef = state.equippedArmorId ? getItemDef(state.equippedArmorId) : undefined;
    const atkStats = CombatSystem.getPlayerAttackStats(state);
    const resStats = CombatSystem.getPlayerResistances(state);

    const elemDamageHtml = (
      Object.entries(atkStats.elementalDamage) as [ElementType, number | undefined][]
    )
      .filter(([, v]) => (v ?? 0) > 0)
      .map(
        ([el, val]) =>
          `<span class="stat-badge dmg">${ELEMENT_LABELS[el] ?? el} +${val}</span>`
      )
      .join('');

    const elemResHtml = (
      Object.entries(resStats) as [ElementType, number | undefined][]
    )
      .filter(([, v]) => (v ?? 0) > 0)
      .map(
        ([el, val]) =>
          `<span class="stat-badge res">${ELEMENT_LABELS[el] ?? el} ${Math.round((val ?? 0) * 100)}%</span>`
      )
      .join('');

    const hotbarSlotsHtml = Array.from({ length: HOTBAR_SIZE }, (_, idx) =>
      this.renderSlotCell(idx, true)
    ).join('');

    const backpackSlotsHtml = Array.from(
      { length: Math.max(0, state.inventory.length - HOTBAR_SIZE) },
      (_, offset) => this.renderSlotCell(HOTBAR_SIZE + offset, false)
    ).join('');

    const inspectedSlot = state.inventory[this.inspectedSlotIndex] ?? null;
    const inspectedDef = inspectedSlot ? getItemDef(inspectedSlot.itemId) : undefined;
    const inspectedStats = inspectedDef ? formatItemStats(inspectedDef) : [];
    const isInspectedInHotbar = this.inspectedSlotIndex < HOTBAR_SIZE;
    const canUseInspected = Boolean(
      inspectedDef &&
        (inspectedDef.category === 'tool' ||
          inspectedDef.category === 'weapon' ||
          inspectedDef.category === 'armor' ||
          ((inspectedDef.category === 'consumable' || inspectedDef.category === 'crop') &&
            (inspectedDef.hpRestore || inspectedDef.manaRestore || inspectedDef.energyRestore)))
    );

    const primaryActionLabel =
      inspectedDef?.category === 'weapon'
        ? 'Equipar Cajado'
        : inspectedDef?.category === 'armor'
          ? 'Vestir Roupa'
          : 'Usar Item';

    const recipesHtml = RECIPES.filter((r) => matchesCraftFilter(r, this.craftFilter))
      .map((recipe) => {
        const check = craftSys.canCraft(recipe);
        const outDef = getItemDef(recipe.outputItemId);
        const ingChips = recipe.ingredients
          .map((ing) => {
            const ingDef = getItemDef(ing.itemId);
            const owned = invSys.countItem(ing.itemId);
            const enough = owned >= ing.quantity;
            return `
              <span class="ing-chip ${enough ? 'ok' : 'missing'}" title="${ingDef?.name ?? ing.itemId}">
                ${renderItemIconHtml(ing.itemId, 16)}
                <span>${ingDef?.name ?? ing.itemId} <strong>${owned}/${ing.quantity}</strong></span>
              </span>
            `;
          })
          .join('');

        const minDragons = recipe.minMiniDragons ?? (recipe.requiresMiniDragon ? 1 : 0);
        return `
          <div class="recipe-row">
            <div class="recipe-main">
              <div class="recipe-icon-box">${renderItemIconHtml(recipe.outputItemId, 36)}</div>
              <div>
                <div class="recipe-title">
                  ${recipe.name}
                  ${recipe.outputQuantity > 1 ? `<span class="recipe-mult">×${recipe.outputQuantity}</span>` : ''}
                  ${
                    minDragons > 0
                      ? `<span class="tag-dragon">${UI_SVG.dragon} Requer ${minDragons} Dragão(ões)</span>`
                      : ''
                  }
                </div>
                <div class="recipe-desc">${outDef?.description ?? ''}</div>
                <div class="recipe-ing-chips">${ingChips}</div>
              </div>
            </div>
            <button type="button" class="recipe-btn" data-recipe="${recipe.id}" ${check.ok ? '' : 'disabled'}>
              ${check.ok ? 'Fabricar' : check.reason ?? 'Indisponível'}
            </button>
          </div>
        `;
      })
      .join('');

    this.root.innerHTML = `
      <div class="modal-card inv-modal-card">
        <div class="modal-header">
          <div class="modal-tabs">
            <button type="button" class="modal-tab ${this.activeTab === 'mochila' ? 'active' : ''}" data-tab="mochila">
              ${UI_SVG.bag} Mochila &amp; Equipamentos
            </button>
            <button type="button" class="modal-tab ${this.activeTab === 'criacao' ? 'active' : ''}" data-tab="criacao">
              ${UI_SVG.craft} Criação &amp; Fundição
            </button>
          </div>
          <button type="button" id="modal-close-btn" class="modal-close">✕</button>
        </div>

        ${
          this.activeTab === 'mochila'
            ? `
          <div class="inv-rpg-layout">
            <aside class="inv-guardian-panel">
              <div class="guardian-header">
                <span class="guardian-name">Tomé — Guardião</span>
                <span class="guardian-gold">${UI_SVG.gold} ${state.gold} G</span>
              </div>

              <div class="paperdoll-frame">
                ${renderGuardianPaperDollSvg(state.equippedWeaponId, state.equippedArmorId)}
              </div>

              <div class="gear-slots-col">
                <div class="gear-slot-card ${weaponDef ? 'equipped' : 'empty'}">
                  <div class="gear-slot-icon">${
                    weaponDef ? renderItemIconHtml(weaponDef.id, 32) : '<span class="gear-placeholder">🪄</span>'
                  }</div>
                  <div class="gear-slot-info">
                    <small>Cajado Equipado</small>
                    <strong>${weaponDef?.name ?? 'Desarmado'}</strong>
                  </div>
                  ${
                    weaponDef
                      ? `<button type="button" class="gear-unequip-btn" data-unequip="weapon" title="Guardar cajado na mochila">Guardar</button>`
                      : ''
                  }
                </div>

                <div class="gear-slot-card ${armorDef ? 'equipped' : 'empty'}">
                  <div class="gear-slot-icon">${
                    armorDef ? renderItemIconHtml(armorDef.id, 32) : '<span class="gear-placeholder">🛡</span>'
                  }</div>
                  <div class="gear-slot-info">
                    <small>Roupa / Armadura</small>
                    <strong>${armorDef?.name ?? 'Sem proteção'}</strong>
                  </div>
                  ${
                    armorDef
                      ? `<button type="button" class="gear-unequip-btn" data-unequip="armor" title="Guardar roupa na mochila">Guardar</button>`
                      : ''
                  }
                </div>
              </div>

              <div class="guardian-stats-box">
                <div class="stat-line">
                  <span>Ataque Base</span>
                  <strong>${atkStats.basePhysical}</strong>
                </div>
                <div class="stat-badges-wrap">
                  ${elemDamageHtml || '<span class="stat-muted">Sem bônus elemental de ataque</span>'}
                </div>
                <div class="stat-line">
                  <span>Resistências</span>
                </div>
                <div class="stat-badges-wrap">
                  ${elemResHtml || '<span class="stat-muted">Nenhuma resistência elemental</span>'}
                </div>
                <div class="companion-mini-row">
                  <span title="Mini-Dragões">${UI_SVG.dragon} ${state.miniDragonsCount}</span>
                  <span title="Unicórnios">${UI_SVG.unicorn} ${state.unicorns.length}</span>
                  <span title="Ovos Incubando">🥚 ${state.incubatingEggs.length}</span>
                </div>
              </div>
            </aside>

            <section class="inv-bag-panel">
              <div class="bag-section-head">
                <h4>Cinto Rápido (Hotbar 1–12)</h4>
                <span class="bag-tip">${
                  this.moveSourceSlot !== null
                    ? 'Clique no espaço de destino para trocar!'
                    : 'Arraste os itens ou dê duplo clique para usar/equipar'
                }</span>
              </div>
              <div class="inv-grid-6">${hotbarSlotsHtml}</div>

              <div class="bag-section-head second">
                <h4>Mochila Interna (13–24)</h4>
                <span class="bag-tip">Mova ferramentas, poções e roupas para o Cinto</span>
              </div>
              <div class="inv-grid-6">${backpackSlotsHtml}</div>

              <div class="inv-inspector">
                ${
                  inspectedDef && inspectedSlot
                    ? `
                  <div class="inspector-icon">${renderItemIconHtml(inspectedDef.id, 44)}</div>
                  <div class="inspector-body">
                    <div class="inspector-title-row">
                      <strong>${inspectedDef.name}</strong>
                      <span class="inspector-cat">${getCategoryLabelPt(inspectedDef.category)}</span>
                      ${inspectedSlot.quantity > 1 ? `<span class="inspector-qty">×${inspectedSlot.quantity}</span>` : ''}
                    </div>
                    <p class="inspector-desc">${inspectedDef.description}</p>
                    ${
                      inspectedStats.length > 0
                        ? `<div class="inspector-stats">${inspectedStats.map((s) => `<span>${s}</span>`).join('')}</div>`
                        : ''
                    }
                  </div>
                  <div class="inspector-actions">
                    ${
                      canUseInspected
                        ? `<button type="button" id="inv-use-btn" class="inv-act-btn primary">${primaryActionLabel}</button>`
                        : ''
                    }
                    <button type="button" id="inv-move-section-btn" class="inv-act-btn">
                      ${isInspectedInHotbar ? 'Guardar na Mochila' : 'Enviar p/ Hotbar'}
                    </button>
                    <button type="button" id="inv-swap-mode-btn" class="inv-act-btn ${
                      this.moveSourceSlot === this.inspectedSlotIndex ? 'active' : ''
                    }">
                      ${this.moveSourceSlot === this.inspectedSlotIndex ? 'Cancelar Troca' : 'Trocar Lugar'}
                    </button>
                  </div>
                `
                    : `
                  <div class="inspector-empty">
                    Selecione um item na mochila ou arraste entre os espaços para organizar seu cinto rápido.
                  </div>
                `
                }
              </div>
            </section>
          </div>
        `
            : `
          <div class="craft-filters">
            <button type="button" class="craft-filter-btn ${this.craftFilter === 'all' ? 'active' : ''}" data-filter="all">Todas</button>
            <button type="button" class="craft-filter-btn ${this.craftFilter === 'stations' ? 'active' : ''}" data-filter="stations">Bancadas</button>
            <button type="button" class="craft-filter-btn ${this.craftFilter === 'gear' ? 'active' : ''}" data-filter="gear">Forja &amp; Equip.</button>
            <button type="button" class="craft-filter-btn ${this.craftFilter === 'alchemy' ? 'active' : ''}" data-filter="alchemy">Alquimia &amp; Lingotes</button>
          </div>
          <div class="recipes-list">${recipesHtml}</div>
        `
        }
      </div>
    `;

    this.bindModalEvents();
  }

  private bindModalEvents(): void {
    this.root.querySelector('#modal-close-btn')?.addEventListener('click', () => this.close());

    this.root.querySelectorAll<HTMLButtonElement>('.modal-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextTab = btn.dataset.tab as 'mochila' | 'criacao' | undefined;
        if (nextTab) {
          this.activeTab = nextTab;
          this.render();
        }
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('.craft-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter as CraftFilter | undefined;
        if (f) {
          this.craftFilter = f;
          this.render();
        }
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('.gear-unequip-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gearSlot = btn.dataset.unequip as 'weapon' | 'armor' | undefined;
        if (gearSlot) {
          EventBus.emit('UNEQUIP_ITEM', { slot: gearSlot });
        }
      });
    });

    this.root.querySelectorAll<HTMLElement>('.inv-slot').forEach((el) => {
      const idx = Number(el.dataset.slot);
      if (Number.isNaN(idx)) return;

      el.addEventListener('click', (ev) => {
        if (this.moveSourceSlot !== null) {
          if (this.moveSourceSlot !== idx) {
            EventBus.emit('SWAP_INVENTORY_SLOTS', { fromIndex: this.moveSourceSlot, toIndex: idx });
            this.inspectedSlotIndex = idx;
          }
          this.moveSourceSlot = null;
          this.render();
          return;
        }

        if (ev.shiftKey) {
          const invSys = new InventorySystem(gameState.getState());
          const res = invSys.moveToHotbarOrBag(idx);
          if (res.ok && typeof res.targetIndex === 'number') {
            this.inspectedSlotIndex = res.targetIndex;
            EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
            EventBus.emit('INVENTORY_UPDATED', {
              selectedIndex: gameState.getState().selectedHotbarIndex,
            });
          } else {
            EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'error' });
          }
          return;
        }

        this.inspectedSlotIndex = idx;
        if (idx < HOTBAR_SIZE) {
          EventBus.emit('SELECT_HOTBAR_SLOT', { index: idx });
        } else {
          this.render();
        }
      });

      el.addEventListener('dblclick', () => {
        const slot = gameState.getState().inventory[idx];
        if (!slot) return;
        const def = getItemDef(slot.itemId);
        if (!def) return;
        if (
          def.category === 'weapon' ||
          def.category === 'armor' ||
          def.category === 'consumable' ||
          (def.category === 'crop' && (def.hpRestore || def.manaRestore || def.energyRestore))
        ) {
          EventBus.emit('USE_INVENTORY_SLOT', { slotIndex: idx });
        } else {
          const invSys = new InventorySystem(gameState.getState());
          const res = invSys.moveToHotbarOrBag(idx);
          if (res.ok && typeof res.targetIndex === 'number') {
            this.inspectedSlotIndex = res.targetIndex;
            EventBus.emit('INVENTORY_UPDATED', {
              selectedIndex: gameState.getState().selectedHotbarIndex,
            });
          }
        }
      });

      el.addEventListener('dragstart', (ev) => {
        if (!gameState.getState().inventory[idx]) {
          ev.preventDefault();
          return;
        }
        ev.dataTransfer?.setData('text/plain', String(idx));
        el.classList.add('dragging');
      });

      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
      });

      el.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        el.classList.add('drag-over');
      });

      el.addEventListener('dragleave', () => {
        el.classList.remove('drag-over');
      });

      el.addEventListener('drop', (ev) => {
        ev.preventDefault();
        el.classList.remove('drag-over');
        const raw = ev.dataTransfer?.getData('text/plain');
        const fromIndex = raw !== undefined ? Number(raw) : NaN;
        if (!Number.isNaN(fromIndex) && fromIndex !== idx) {
          this.inspectedSlotIndex = idx;
          EventBus.emit('SWAP_INVENTORY_SLOTS', { fromIndex, toIndex: idx });
        }
      });
    });

    this.root.querySelector('#inv-use-btn')?.addEventListener('click', () => {
      EventBus.emit('USE_INVENTORY_SLOT', { slotIndex: this.inspectedSlotIndex });
    });

    this.root.querySelector('#inv-move-section-btn')?.addEventListener('click', () => {
      const invSys = new InventorySystem(gameState.getState());
      const res = invSys.moveToHotbarOrBag(this.inspectedSlotIndex);
      if (res.ok && typeof res.targetIndex === 'number') {
        this.inspectedSlotIndex = res.targetIndex;
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
        EventBus.emit('INVENTORY_UPDATED', {
          selectedIndex: gameState.getState().selectedHotbarIndex,
        });
      } else {
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'error' });
      }
    });

    this.root.querySelector('#inv-swap-mode-btn')?.addEventListener('click', () => {
      this.moveSourceSlot =
        this.moveSourceSlot === this.inspectedSlotIndex ? null : this.inspectedSlotIndex;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('.recipe-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const recipeId = btn.dataset.recipe;
        if (recipeId) {
          EventBus.emit('CRAFT_ITEM', { recipeId });
        }
      });
    });
  }
}

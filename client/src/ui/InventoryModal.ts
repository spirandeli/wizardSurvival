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
import {
  renderHubCompendioTab,
  renderHubGrimorioTab,
  renderHubQuestsTab,
  renderHubVillagersTab,
  type QuestsTabViewState,
} from './QuestLogModal';
import { renderGuardianPaperDollSvg, UI_SVG } from './UiIcons';

const SHORTCUT_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];

type HubTab = 'mochila' | 'criacao' | 'missoes' | 'moradores' | 'grimorio' | 'compendio';
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
  private tooltipEl: HTMLElement;
  private isOpen = false;
  private activeTab: HubTab = 'mochila';
  private inspectedSlotIndex: number = 0;
  private moveSourceSlot: number | null = null;
  private craftFilter: CraftFilter = 'all';
  private craftSearch = '';
  private craftOnlyReady = false;
  private craftStation: 'manual' | 'fundicao' = 'manual';
  private forgeTile?: { tileX: number; tileY: number };
  private questsView: QuestsTabViewState = { selectedQuestId: null, showCompleted: false };
  private villagersSortByAffinity = true;
  private onKeyDownBound: (ev: KeyboardEvent) => void;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'inventory-modal';
    this.root.className = 'modal-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'hub-tooltip';
    this.tooltipEl.style.display = 'none';
    parent.appendChild(this.tooltipEl);

    this.onKeyDownBound = (ev: KeyboardEvent) => {
      if (!this.isOpen) return;
      if (ev.key === 'Escape') {
        this.close();
        return;
      }
      if (
        (ev.key === 'r' || ev.key === 'R') &&
        this.activeTab === 'mochila' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        const invSys = new InventorySystem(gameState.getState());
        const { moved } = invSys.sortBackpack();
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
        EventBus.emit('SHOW_TOAST', {
          message: moved > 0 ? 'Mochila organizada!' : 'Mochila já está organizada.',
          kind: 'success',
        });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
      }
    };
    window.addEventListener('keydown', this.onKeyDownBound);

    EventBus.on('OPEN_INVENTORY_MODAL', ({ tab, station, forgeTile }) => {
      const nextTab: HubTab = tab ?? 'mochila';
      const nextStation = station ?? 'manual';
      const sameBench =
        this.forgeTile?.tileX === forgeTile?.tileX && this.forgeTile?.tileY === forgeTile?.tileY;
      if (
        this.isOpen &&
        nextTab === this.activeTab &&
        nextStation === this.craftStation &&
        sameBench
      ) {
        this.close();
        return;
      }
      this.activeTab = nextTab;
      this.craftStation = nextStation;
      this.forgeTile = nextStation === 'fundicao' ? forgeTile : undefined;
      this.open();
    });

    EventBus.on('INVENTORY_UPDATED', () => {
      if (this.isOpen) this.render();
    });

    EventBus.on('FORGE_UPDATED', () => {
      if (this.isOpen && this.activeTab === 'criacao') this.render();
    });

    EventBus.on('QUESTS_UPDATED', () => {
      if (
        this.isOpen &&
        (this.activeTab === 'missoes' ||
          this.activeTab === 'moradores' ||
          this.activeTab === 'grimorio' ||
          this.activeTab === 'compendio')
      ) {
        this.render();
      }
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
    this.hideTooltip();
    this.root.style.display = 'none';
  }

  isVisible(): boolean {
    return this.isOpen;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    this.tooltipEl.remove();
    this.root.remove();
  }

  private showTooltip(slotIndex: number, clientX: number, clientY: number): void {
    const slot = gameState.getState().inventory[slotIndex];
    const def = slot ? getItemDef(slot.itemId) : undefined;
    if (!slot || !def) {
      this.hideTooltip();
      return;
    }

    const stats = formatItemStats(def);
    this.tooltipEl.innerHTML = `
      <div class="hub-tt-head">
        <strong>${def.name}</strong>
        <span class="hub-tt-cat">${getCategoryLabelPt(def.category)}</span>
      </div>
      <p class="hub-tt-desc">${def.description}</p>
      ${stats.length > 0 ? `<div class="hub-tt-stats">${stats.map((s) => `<span>${s}</span>`).join('')}</div>` : ''}
      <div class="hub-tt-hint">Duplo clique: usar/equipar • Shift+Clique: mover • Dir.: dividir pilha</div>
    `;
    this.tooltipEl.style.display = 'block';
    this.positionTooltip(clientX, clientY);
  }

  private positionTooltip(clientX: number, clientY: number): void {
    const pad = 14;
    const rect = this.tooltipEl.getBoundingClientRect();
    let left = clientX + pad;
    let top = clientY + pad;
    if (left + rect.width > window.innerWidth - 8) {
      left = Math.max(8, clientX - rect.width - pad);
    }
    if (top + rect.height > window.innerHeight - 8) {
      top = Math.max(8, clientY - rect.height - pad);
    }
    this.tooltipEl.style.left = `${left}px`;
    this.tooltipEl.style.top = `${top}px`;
  }

  private hideTooltip(): void {
    this.tooltipEl.style.display = 'none';
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
      <div class="${classes}" data-slot="${idx}" draggable="${slot ? 'true' : 'false'}">
        ${showShortcut ? `<span class="inv-slot-key">${SHORTCUT_LABELS[idx] ?? ''}</span>` : ''}
        ${def ? renderItemIconHtml(def.id, 34) : ''}
        ${slot && slot.quantity > 1 ? `<span class="inv-slot-qty">${slot.quantity}</span>` : ''}
      </div>
    `;
  }

  private renderBackpackTab(): string {
    const state = gameState.getState();
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

    return `
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
              <span title="Ovos Incubando">${UI_SVG.egg} ${state.incubatingEggs.length}</span>
            </div>
          </div>
        </aside>

        <section class="inv-bag-panel">
          <div class="bag-section-head">
            <h4>Cinto Rápido (Hotbar 1–12)</h4>
            <div class="inv-toolbar">
              <button type="button" id="inv-sort-btn" class="hub-util-btn" title="Agrupar e ordenar itens da Mochila Interna">
                ⇅ Organizar Mochila
              </button>
              <button type="button" id="inv-trash-zone" class="hub-util-btn trash" title="Arraste um item aqui ou clique com um item selecionado para descartar (retorna 15% do valor)">
                🗑 Lixeira
              </button>
            </div>
          </div>
          <div class="inv-grid-6">${hotbarSlotsHtml}</div>

          <div class="bag-section-head second">
            <h4>Mochila Interna (13–24)</h4>
            <span class="bag-tip">${
              this.moveSourceSlot !== null
                ? 'Clique no espaço de destino para trocar!'
                : 'Arraste • Shift+Clique: mover • Clique Direito: dividir pilha'
            }</span>
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
                ${
                  inspectedSlot.quantity >= 2
                    ? `<button type="button" id="inv-split-btn" class="inv-act-btn">Dividir</button>`
                    : ''
                }
                <button type="button" id="inv-swap-mode-btn" class="inv-act-btn ${
                  this.moveSourceSlot === this.inspectedSlotIndex ? 'active' : ''
                }">
                  ${this.moveSourceSlot === this.inspectedSlotIndex ? 'Cancelar' : 'Trocar'}
                </button>
              </div>
            `
                : `
              <div class="inspector-empty">
                Passe o mouse ou selecione um item para inspecionar atributos, dividir pilhas ou enviar à lixeira.
              </div>
            `
            }
          </div>
        </section>
      </div>
    `;
  }

  private renderCraftTab(): string {
    const state = gameState.getState();
    const invSys = new InventorySystem(state);
    const craftSys = new CraftingSystem(state, invSys);

    const activeForgeJob =
      this.craftStation === 'fundicao' && this.forgeTile
        ? craftSys.getForgeJobAt(this.forgeTile.tileX, this.forgeTile.tileY)
        : undefined;

    const forgeStatusBanner = activeForgeJob
      ? `<div class="recipe-row craft-ready" style="margin-bottom: 8px;">
          <div class="recipe-main">
            <div class="recipe-icon-box">${renderItemIconHtml(activeForgeJob.outputItemId, 36)}</div>
            <div>
              <div class="recipe-title">${
                activeForgeJob.status === 'ready'
                  ? 'Forja Concluída!'
                  : `Forjando (${Math.ceil(activeForgeJob.remainingMs / 1000)}s restantes)`
              }</div>
              <div class="recipe-desc">${
                activeForgeJob.status === 'ready'
                  ? 'Feche e interaja com a Bancada [E] para coletar o item.'
                  : 'Um Mini-Dragão está aquecendo a fornalha...'
              }</div>
            </div>
          </div>
        </div>`
      : '';

    const searchLower = this.craftSearch.trim().toLowerCase();
    const stationRecipes = RECIPES.filter((r) => r.station === this.craftStation);
    const filteredRecipes = stationRecipes.filter((r) => {
      if (!matchesCraftFilter(r, this.craftFilter)) return false;
      if (this.craftOnlyReady && !craftSys.canCraft(r).ok) return false;
      if (searchLower) {
        const out = getItemDef(r.outputItemId);
        const hay = `${r.name} ${out?.description ?? ''}`.toLowerCase();
        if (!hay.includes(searchLower)) return false;
      }
      return true;
    });

    const recipesHtml =
      forgeStatusBanner +
      (filteredRecipes.length === 0
        ? '<p class="quest-empty">Nenhuma receita corresponde aos filtros atuais.</p>'
        : filteredRecipes
            .map((recipe) => {
              const check = craftSys.canCraft(recipe);
              const benchBusy = Boolean(activeForgeJob);
              const canTrigger = check.ok && !benchBusy;
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
              const durationSec = recipe.forgeDurationMs ? Math.round(recipe.forgeDurationMs / 1000) : 0;
              const btnLabel = benchBusy
                ? activeForgeJob?.status === 'ready'
                  ? 'Colete na Bancada [E]'
                  : 'Forja Ocupada'
                : check.ok
                  ? recipe.station === 'fundicao'
                    ? `Forjar (${durationSec}s)`
                    : 'Fabricar'
                  : check.reason ?? 'Indisponível';

              return `
              <div class="recipe-row ${canTrigger ? 'craft-ready' : ''}">
                <div class="recipe-main">
                  <div class="recipe-icon-box">${renderItemIconHtml(recipe.outputItemId, 36)}</div>
                  <div>
                    <div class="recipe-title">
                      ${recipe.name}
                      ${recipe.outputQuantity > 1 ? `<span class="recipe-mult">×${recipe.outputQuantity}</span>` : ''}
                      ${durationSec > 0 ? `<span class="tag-dragon">⏱ ${durationSec}s</span>` : ''}
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
                <button type="button" class="recipe-btn" data-recipe="${recipe.id}" ${canTrigger ? '' : 'disabled'}>
                  ${btnLabel}
                </button>
              </div>
            `;
            })
            .join(''));

    return `
      <div class="craft-toolbar">
        <div class="craft-filters">
          <button type="button" class="craft-filter-btn ${this.craftFilter === 'all' ? 'active' : ''}" data-filter="all">Todas</button>
          <button type="button" class="craft-filter-btn ${this.craftFilter === 'stations' ? 'active' : ''}" data-filter="stations">Bancadas</button>
          <button type="button" class="craft-filter-btn ${this.craftFilter === 'gear' ? 'active' : ''}" data-filter="gear">Forja &amp; Equip.</button>
          <button type="button" class="craft-filter-btn ${this.craftFilter === 'alchemy' ? 'active' : ''}" data-filter="alchemy">Alquimia &amp; Lingotes</button>
        </div>
        <div class="craft-search-wrap">
          <input type="text" id="craft-search-input" class="craft-search-input" placeholder="Buscar receita..." value="${this.craftSearch.replace(/"/g, '&quot;')}" />
          <button type="button" id="craft-only-ready-btn" class="hub-util-btn ${this.craftOnlyReady ? 'active' : ''}">
            ✓ Fabricáveis
          </button>
        </div>
      </div>
      <div class="recipes-list">${recipesHtml}</div>
    `;
  }

  private render(): void {
    this.hideTooltip();
    const state = gameState.getState();

    let tabBody = '';
    if (this.activeTab === 'mochila') {
      tabBody = this.renderBackpackTab();
    } else if (this.activeTab === 'criacao') {
      tabBody = this.renderCraftTab();
    } else if (this.activeTab === 'missoes') {
      tabBody = renderHubQuestsTab(this.questsView);
    } else if (this.activeTab === 'moradores') {
      tabBody = renderHubVillagersTab(this.villagersSortByAffinity);
    } else if (this.activeTab === 'grimorio') {
      tabBody = renderHubGrimorioTab();
    } else {
      tabBody = renderHubCompendioTab();
    }

    this.root.innerHTML = `
      <div class="modal-card inv-modal-card hub-modal-card">
        <div class="modal-header hub-header">
          <div class="modal-tabs hub-tabs">
            <button type="button" class="modal-tab ${this.activeTab === 'mochila' ? 'active' : ''}" data-tab="mochila">
              ${UI_SVG.bag} Mochila
            </button>
            <button type="button" class="modal-tab ${this.activeTab === 'criacao' ? 'active' : ''}" data-tab="criacao">
              ${UI_SVG.craft} Criação
            </button>
            <button type="button" class="modal-tab ${this.activeTab === 'missoes' ? 'active' : ''}" data-tab="missoes">
              ${UI_SVG.quest} Missões
            </button>
            <button type="button" class="modal-tab ${this.activeTab === 'moradores' ? 'active' : ''}" data-tab="moradores">
              ${UI_SVG.villagers} Moradores
            </button>
            <button type="button" class="modal-tab ${this.activeTab === 'grimorio' ? 'active' : ''}" data-tab="grimorio">
              ${UI_SVG.grimoire} Grimório
            </button>
            <button type="button" class="modal-tab ${this.activeTab === 'compendio' ? 'active' : ''}" data-tab="compendio">
              ${UI_SVG.compendium} Compêndio
            </button>
          </div>
          <div class="hub-header-meta">
            <span class="hub-meta-pill">${UI_SVG.gold} <strong>${state.gold} G</strong></span>
            <span class="hub-meta-pill">Dia ${state.time.day} • ${state.time.season}</span>
            <button type="button" id="modal-close-btn" class="modal-close" title="Fechar [Esc]">✕</button>
          </div>
        </div>
        <div class="hub-body">${tabBody}</div>
      </div>
    `;

    this.bindModalEvents();
  }

  private handleDiscardSlot(slotIndex: number): void {
    const state = gameState.getState();
    const slot = state.inventory[slotIndex];
    if (!slot) {
      EventBus.emit('SHOW_TOAST', { message: 'Selecione ou arraste um item para descartar.', kind: 'info' });
      return;
    }
    const invSys = new InventorySystem(state);
    const res = invSys.discardSlot(slotIndex);
    if (res.ok) {
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
      EventBus.emit('SHOW_TOAST', {
        message:
          res.refundGold > 0
            ? `Descartou ${res.removedName} (+${res.refundGold} G reciclado).`
            : `Descartou ${res.removedName}.`,
        kind: 'info',
      });
      if (res.refundGold > 0) {
        EventBus.emit('GOLD_UPDATED', { gold: state.gold });
      }
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
    }
  }

  private bindModalEvents(): void {
    this.root.querySelector('#modal-close-btn')?.addEventListener('click', () => this.close());

    this.root.querySelectorAll<HTMLButtonElement>('.modal-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextTab = btn.dataset.tab as HubTab | undefined;
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

    const searchInput = this.root.querySelector<HTMLInputElement>('#craft-search-input');
    searchInput?.addEventListener('input', () => {
      this.craftSearch = searchInput.value;
      const cursorPos = searchInput.selectionStart ?? this.craftSearch.length;
      this.render();
      const nextInput = this.root.querySelector<HTMLInputElement>('#craft-search-input');
      nextInput?.focus();
      nextInput?.setSelectionRange(cursorPos, cursorPos);
    });

    this.root.querySelector('#craft-only-ready-btn')?.addEventListener('click', () => {
      this.craftOnlyReady = !this.craftOnlyReady;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('.gear-unequip-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gearSlot = btn.dataset.unequip as 'weapon' | 'armor' | undefined;
        if (gearSlot) {
          EventBus.emit('UNEQUIP_ITEM', { slot: gearSlot });
        }
      });
    });

    this.root.querySelector('#inv-sort-btn')?.addEventListener('click', () => {
      const invSys = new InventorySystem(gameState.getState());
      const { moved } = invSys.sortBackpack();
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
      EventBus.emit('SHOW_TOAST', {
        message: moved > 0 ? 'Mochila organizada!' : 'Mochila já está organizada.',
        kind: 'success',
      });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
    });

    const trashZone = this.root.querySelector<HTMLElement>('#inv-trash-zone');
    if (trashZone) {
      trashZone.addEventListener('click', () => {
        this.handleDiscardSlot(this.inspectedSlotIndex);
      });
      trashZone.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        trashZone.classList.add('drag-over');
      });
      trashZone.addEventListener('dragleave', () => {
        trashZone.classList.remove('drag-over');
      });
      trashZone.addEventListener('drop', (ev) => {
        ev.preventDefault();
        trashZone.classList.remove('drag-over');
        const raw = ev.dataTransfer?.getData('text/plain');
        const fromIndex = raw !== undefined ? Number(raw) : NaN;
        if (!Number.isNaN(fromIndex)) {
          this.handleDiscardSlot(fromIndex);
        }
      });
    }

    this.root.querySelectorAll<HTMLElement>('.inv-slot').forEach((el) => {
      const idx = Number(el.dataset.slot);
      if (Number.isNaN(idx)) return;

      el.addEventListener('mouseenter', (ev) => this.showTooltip(idx, ev.clientX, ev.clientY));
      el.addEventListener('mousemove', (ev) => {
        if (this.tooltipEl.style.display === 'block') {
          this.positionTooltip(ev.clientX, ev.clientY);
        }
      });
      el.addEventListener('mouseleave', () => this.hideTooltip());

      el.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        const invSys = new InventorySystem(gameState.getState());
        const res = invSys.splitStack(idx);
        if (res.ok) {
          EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
          EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
        } else {
          EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'info' });
        }
      });

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
        this.hideTooltip();
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

    this.root.querySelector('#inv-split-btn')?.addEventListener('click', () => {
      const invSys = new InventorySystem(gameState.getState());
      const res = invSys.splitStack(this.inspectedSlotIndex);
      if (res.ok) {
        EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: gameState.getState().selectedHotbarIndex });
      } else {
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: 'info' });
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
          EventBus.emit('CRAFT_ITEM', { recipeId, forgeTile: this.forgeTile });
        }
      });
    });

    // Eventos das abas de Missões e Moradores
    this.root.querySelectorAll<HTMLButtonElement>('[data-quest-select]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.questSelect;
        if (qid) {
          this.questsView.selectedQuestId = qid;
          this.render();
        }
      });
    });

    this.root.querySelector('#qlist-toggle-completed')?.addEventListener('click', () => {
      this.questsView.showCompleted = !this.questsView.showCompleted;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-pin-quest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.pinQuest;
        const st = gameState.getState();
        st.pinnedQuestId = st.pinnedQuestId === qid ? undefined : qid;
        EventBus.emit('PIN_QUEST', { questId: st.pinnedQuestId });
        EventBus.emit('QUESTS_UPDATED');
        this.render();
      });
    });

    this.root.querySelector('#villagers-sort-btn')?.addEventListener('click', () => {
      this.villagersSortByAffinity = !this.villagersSortByAffinity;
      this.render();
    });
  }
}

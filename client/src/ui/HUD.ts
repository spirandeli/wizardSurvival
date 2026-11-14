import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getItemDef } from '../data/items';
import { QUESTS } from '../data/quests';
import { InventorySystem } from '../systems/InventorySystem';
import { ManaSystem, SPELLS } from '../systems/ManaSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { formatGameTime } from '../systems/TimeSystem';
import { renderItemIconHtml } from './ItemIcon';
import { getMoonSvg, getWeatherSvg, UI_SVG } from './UiIcons';

export class HUD {
  private root: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'hud-root';
    this.root.className = 'hud-root';
    parent.appendChild(this.root);

    this.render();

    EventBus.on('TIME_TICK', () => this.render());
    EventBus.on('VITALS_UPDATED', () => this.render());
    EventBus.on('GOLD_UPDATED', () => this.render());
    EventBus.on('GAME_READY', () => this.render());
    EventBus.on('QUESTS_UPDATED', () => this.render());
    EventBus.on('INVENTORY_UPDATED', () => this.render());
  }

  destroy(): void {
    this.root.remove();
  }

  private render(): void {
    const state = gameState.getState();
    const { time, vitals, gold, miniDragonsCount, unicorns } = state;
    const activeMainQuest = QUESTS.find(
      (q) => q.kind === 'principal' && state.questStates[q.id]?.status === 'active'
    );
    const invSys = new InventorySystem(state);
    const questSys = new QuestSystem(state, invSys);
    const pendingStep = activeMainQuest
      ? questSys.getStepProgress(activeMainQuest.id).find((s) => !s.done)
      : undefined;

    const hpPct = Math.max(0, Math.min(100, Math.round((vitals.hp / vitals.maxHp) * 100)));
    const stamPct = Math.max(
      0,
      Math.min(100, Math.round((vitals.stamina / vitals.maxStamina) * 100))
    );
    const manaPct = Math.max(0, Math.min(100, Math.round((vitals.mana / vitals.maxMana) * 100)));

    const weaponDef = state.equippedWeaponId ? getItemDef(state.equippedWeaponId) : undefined;
    const armorDef = state.equippedArmorId ? getItemDef(state.equippedArmorId) : undefined;
    const manaSys = new ManaSystem(state);
    const spellOrder = ['fagulha_arcana', 'pilar_telurico', 'mare_curativa', 'raio_estelar', 'teleporte'];
    const unlockedSpellsHtml = spellOrder
      .filter((id) => manaSys.hasSpell(id) && SPELLS[id])
      .map((id) => {
        const sp = SPELLS[id];
        if (!sp) return '';
        const cost = manaSys.getSpellCost(id);
        const canAfford = vitals.mana >= cost;
        return `<button type="button" class="hud-spell-pill ${canAfford ? '' : 'low-mana'}" data-spell-id="${sp.id}" title="${sp.name} (${cost} Mana) — ${sp.description}">
          <kbd>${sp.hotkey}</kbd>
          <span>${sp.name.split(' ')[0]}</span>
          <small>${cost}m</small>
        </button>`;
      })
      .join('');

    this.root.innerHTML = `
      <div class="hud-almanac ui-interactive">
        <div class="hud-almanac-top">
          <div class="hud-day-badge">
            <span class="hud-day-num">Dia ${time.day}</span>
            <span class="hud-season">${time.season}</span>
          </div>
          <span class="hud-time">${formatGameTime(time.minuteOfDay)}</span>
        </div>

        <div class="hud-env-row">
          <span class="hud-chip" title="Fase da Lua">${getMoonSvg(time.moonPhase)} Lua ${time.moonPhase}</span>
          <span class="hud-chip" title="Previsão Atual">${getWeatherSvg(time.weather)} ${time.weather}</span>
        </div>

        <div class="hud-economy-row">
          <span class="hud-gold">${UI_SVG.gold} <strong>${gold} G</strong></span>
          <span class="hud-companions">
            <span class="hud-comp-pill" title="Mini-Dragões">${UI_SVG.dragon} ${miniDragonsCount}</span>
            <span class="hud-comp-pill" title="Unicórnios">${UI_SVG.unicorn} ${unicorns.length}</span>
          </span>
        </div>

        ${activeMainQuest
        ? `<button type="button" id="hud-quest-btn" class="hud-quest-hint" title="${activeMainQuest.objectiveHint}">
                <div>✦ ${activeMainQuest.title}</div>
                ${pendingStep
          ? `<div class="hud-quest-step">↳ ${pendingStep.label}${pendingStep.target > 1 ? ` (${pendingStep.current}/${pendingStep.target})` : ''
          }</div>`
          : ''
        }
              </button>`
        : state.flags.endgame_unlocked
          ? `<button type="button" id="hud-quest-btn" class="hud-quest-hint endgame" title="Campanha concluída! Explore portais e crie livremente.">★ Guardião de São Tomé</button>`
          : ''
      }
      </div>

      <div class="hud-vitals-dock ui-interactive">
        <div class="hud-gear-strip">
          <button type="button" class="hud-gear-pill" id="hud-gear-weapon" title="${weaponDef ? `${weaponDef.name} — ${weaponDef.description}` : 'Sem cajado equipado'
      }">
            <span class="hud-gear-icon">${weaponDef ? renderItemIconHtml(weaponDef.id, 22) : '<span class="gear-empty">—</span>'
      }</span>
            <span class="hud-gear-text">
              <small>Cajado</small>
              <strong>${weaponDef ? weaponDef.name : 'Nenhum'}</strong>
            </span>
          </button>
          <button type="button" class="hud-gear-pill" id="hud-gear-armor" title="${armorDef ? `${armorDef.name} — ${armorDef.description}` : 'Sem roupa equipada'
      }">
            <span class="hud-gear-icon">${armorDef ? renderItemIconHtml(armorDef.id, 22) : '<span class="gear-empty">—</span>'
      }</span>
            <span class="hud-gear-text">
              <small>Roupa</small>
              <strong>${armorDef ? armorDef.name : 'Nenhuma'}</strong>
            </span>
          </button>
        </div>

        <div class="hud-vitals-card">
          <div class="vital-row">
            <span class="vital-icon-wrap" title="Vida (HP)">${UI_SVG.heart}</span>
            <div class="vital-bar"><div class="vital-fill hp" style="width:${hpPct}%"></div></div>
            <span class="vital-num">${vitals.hp}/${vitals.maxHp}</span>
          </div>
          <div class="vital-row">
            <span class="vital-icon-wrap" title="Stamina">${UI_SVG.stamina}</span>
            <div class="vital-bar"><div class="vital-fill stamina" style="width:${stamPct}%"></div></div>
            <span class="vital-num">${vitals.stamina}/${vitals.maxStamina}</span>
          </div>
          <div class="vital-row">
            <span class="vital-icon-wrap" title="Mana Arcana">${UI_SVG.mana}</span>
            <div class="vital-bar"><div class="vital-fill mana" style="width:${manaPct}%"></div></div>
            <span class="vital-num">${vitals.mana}/${vitals.maxMana}</span>
          </div>
        </div>
        ${unlockedSpellsHtml ? `<div class="hud-spells-strip">${unlockedSpellsHtml}</div>` : ''}
      </div>
    `;

    this.root.querySelector('#hud-quest-btn')?.addEventListener('click', () => {
      EventBus.emit('OPEN_QUEST_MODAL');
    });
    this.root.querySelector('#hud-gear-weapon')?.addEventListener('click', () => {
      EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'mochila' });
    });
    this.root.querySelector('#hud-gear-armor')?.addEventListener('click', () => {
      EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'mochila' });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-spell-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const spellId = btn.dataset.spellId;
        if (!spellId) return;
        if (spellId === 'teleporte') {
          EventBus.emit('OPEN_TELEPORT_MODAL');
        } else {
          EventBus.emit('CAST_SPELL', { spellId });
        }
      });
    });
  }
}

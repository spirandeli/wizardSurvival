import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getItemDef } from '../data/items';
import { rollFishCatch } from '../systems/FishingSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { QuestSystem } from '../systems/QuestSystem';
import { renderItemIconHtml } from './ItemIcon';

export class FishingModal {
  private root: HTMLElement;
  private isOpen = false;
  private isNightOrEvening = false;
  private useBait = false;
  private cursorPct = 10;
  private direction = 1;
  private zoneStartPct = 36;
  private zoneWidthPct = 28;
  private rafId: number | null = null;
  private lastTick = 0;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'fishing-modal';
    this.root.className = 'modal-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    EventBus.on('OPEN_FISHING_MODAL', ({ isNightOrEvening }) => {
      this.open(isNightOrEvening);
    });
  }

  isVisible(): boolean {
    return this.isOpen;
  }

  open(isNightOrEvening: boolean): void {
    const state = gameState.getState();
    const inv = new InventorySystem(state);
    if (!inv.hasItem('vara_pesca_simples', 1)) {
      EventBus.emit('SHOW_TOAST', {
        message: 'Você precisa da Vara de Pesca (Missão 1.1 com o Prefeito Arlindo).',
        kind: 'info',
      });
      return;
    }
    if (state.vitals.stamina < 2) {
      EventBus.emit('SHOW_TOAST', { message: 'Stamina insuficiente para pescar!', kind: 'error' });
      return;
    }

    this.isNightOrEvening = isNightOrEvening;
    this.isOpen = true;
    this.useBait = inv.hasItem('leite_unicornio', 1) && this.useBait;
    this.cursorPct = 12;
    this.direction = 1;
    this.recomputeTargetZone();
    this.root.style.display = 'flex';
    this.render();
    this.startLoop();
  }

  close(): void {
    this.isOpen = false;
    this.stopLoop();
    this.root.style.display = 'none';
  }

  destroy(): void {
    this.stopLoop();
    this.root.remove();
  }

  tryStrike(): void {
    if (!this.isOpen) return;
    const state = gameState.getState();
    const inv = new InventorySystem(state);
    if (state.vitals.stamina < 2) {
      EventBus.emit('SHOW_TOAST', { message: 'Stamina esgotada!', kind: 'error' });
      this.close();
      return;
    }

    let baitUsed = false;
    if (this.useBait && inv.removeItem('leite_unicornio', 1)) {
      baitUsed = true;
    }
    state.vitals.stamina = Math.max(0, state.vitals.stamina - 2);

    const hit =
      this.cursorPct >= this.zoneStartPct &&
      this.cursorPct <= this.zoneStartPct + this.zoneWidthPct;

    if (!hit) {
      EventBus.emit('AUDIO_PLAY_SFX', { kind: 'error' });
      EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
      EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
      EventBus.emit('SHOW_TOAST', {
        message: 'O peixe escapou da linha! Tente fisgar dentro da faixa verde.',
        kind: 'info',
      });
      this.close();
      return;
    }

    const fishId = rollFishCatch({
      isNightOrEvening: this.isNightOrEvening,
      weather: state.time.weather,
      moonPhase: state.time.moonPhase,
      usingUnicornMilkBait: baitUsed,
    });
    inv.addItem(fishId, 1);

    const qs = new QuestSystem(state, inv);
    qs.recordFishCaught(fishId);

    const fishDef = getItemDef(fishId);
    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'magic' });
    EventBus.emit('VITALS_UPDATED', { vitals: state.vitals });
    EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
    EventBus.emit('QUESTS_UPDATED');
    EventBus.emit('SHOW_TOAST', {
      message: `Fisgou 1x ${fishDef?.name ?? fishId}!${baitUsed ? ' (Isca de Unicórnio)' : ''}`,
      kind: 'success',
    });
    this.close();
  }

  private recomputeTargetZone(): void {
    const state = gameState.getState();
    let width = 24;
    if (state.flags.npc_perk_damiao_50) width += 14;
    if (this.useBait) width += 10;
    this.zoneWidthPct = Math.min(58, width);
    this.zoneStartPct = Math.round(14 + Math.random() * (86 - this.zoneWidthPct - 14));
  }

  private startLoop(): void {
    this.stopLoop();
    this.lastTick = performance.now();
    const tick = (now: number) => {
      if (!this.isOpen) return;
      const dt = Math.min(0.05, (now - this.lastTick) / 1000);
      this.lastTick = now;

      const speedPctPerSec = this.isNightOrEvening ? 128 : 108;
      this.cursorPct += this.direction * speedPctPerSec * dt;
      if (this.cursorPct >= 97) {
        this.cursorPct = 97;
        this.direction = -1;
      } else if (this.cursorPct <= 3) {
        this.cursorPct = 3;
        this.direction = 1;
      }

      const needle = this.root.querySelector<HTMLElement>('#fishing-needle');
      if (needle) {
        needle.style.left = `${this.cursorPct}%`;
      }
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private render(): void {
    const state = gameState.getState();
    const inv = new InventorySystem(state);
    const hasBait = inv.hasItem('leite_unicornio', 1);
    const baitCount = inv.countItem('leite_unicornio');

    this.root.innerHTML = `
      <div class="modal-card fishing-card">
        <div class="modal-header">
          <h2 class="tp-title">Pesca nas Águas de São Tomé</h2>
          <button type="button" id="fishing-close-btn" class="modal-close">✕</button>
        </div>

        <div class="fishing-conditions">
          <span class="badge-pill">${this.isNightOrEvening ? '🌙 Noite (+Peixe-Prisma)' : '☀️ Dia'}</span>
          <span class="badge-pill">🌦️ ${state.time.weather}</span>
          <span class="badge-pill">🌕 Lua ${state.time.moonPhase}</span>
          ${state.flags.npc_perk_damiao_50 ? '<span class="badge-pill perk">🎣 Damião 50+ (Zona +14%)</span>' : ''}
        </div>

        <p class="tp-sub">Aperte <strong>[Espaço]</strong> ou clique em <strong>Fisgar!</strong> quando a boia passar na faixa verde.</p>

        <div class="fishing-meter">
          <div class="fishing-zone" style="left:${this.zoneStartPct}%;width:${this.zoneWidthPct}%"></div>
          <div id="fishing-needle" class="fishing-needle" style="left:${this.cursorPct}%"></div>
        </div>

        <label class="fishing-bait-row ${hasBait ? '' : 'disabled'}">
          <input type="checkbox" id="fishing-bait-toggle" ${this.useBait && hasBait ? 'checked' : ''} ${hasBait ? '' : 'disabled'
      } />
          ${renderItemIconHtml('leite_unicornio', 20)}
          <span>Usar 1x Leite de Unicórnio como Isca Mágica (${baitCount} disp.) — +Raridade &amp; Zona +10%</span>
        </label>

        <div class="fishing-actions">
          <button type="button" id="fishing-strike-btn" class="rpg-btn">🎣 Fisgar Agora [Espaço]</button>
          <button type="button" id="fishing-cancel-btn" class="rpg-btn secondary">Recolher Vara</button>
        </div>
      </div>
    `;

    this.root.querySelector('#fishing-close-btn')?.addEventListener('click', () => this.close());
    this.root.querySelector('#fishing-cancel-btn')?.addEventListener('click', () => this.close());
    this.root.querySelector('#fishing-strike-btn')?.addEventListener('click', () => this.tryStrike());
    this.root
      .querySelector<HTMLInputElement>('#fishing-bait-toggle')
      ?.addEventListener('change', (ev) => {
        this.useBait = (ev.target as HTMLInputElement).checked;
        this.recomputeTargetZone();
        const zone = this.root.querySelector<HTMLElement>('.fishing-zone');
        if (zone) {
          zone.style.left = `${this.zoneStartPct}%`;
          zone.style.width = `${this.zoneWidthPct}%`;
        }
      });
  }
}

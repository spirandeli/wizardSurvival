import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { NPCS } from '../data/npcs';
import { QUESTS } from '../data/quests';
import { InventorySystem } from '../systems/InventorySystem';
import { QuestSystem } from '../systems/QuestSystem';

export class BulletinBoardModal {
  private root: HTMLElement;
  private isOpen = false;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'bulletin-board-modal';
    this.root.className = 'modal-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    EventBus.on('OPEN_BULLETIN_BOARD_MODAL', () => {
      if (this.isOpen) {
        this.close();
        return;
      }
      this.open();
    });

    EventBus.on('QUESTS_UPDATED', () => {
      if (this.isOpen) this.render();
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
    const qs = new QuestSystem(state, inv);
    const bounties = qs.ensureDailyBounties();

    const bountiesHtml = bounties
      .map((b) => {
        const npcName = NPCS[b.npcId]?.name ?? b.npcId;
        const currentQty =
          b.kind === 'delivery' ? Math.min(b.targetQty, inv.countItem(b.targetId)) : b.progress;
        const ready = qs.isBountyReady(b);
        return `
          <div class="quest-row ${b.completed ? 'status-completed' : ''}">
            <div class="quest-top">
              <span class="quest-title">${b.title} <small style="color:var(--text-muted)">(${npcName})</small></span>
              <span class="quest-badge">${
                b.completed ? '✓ Entregue' : `${currentQty}/${b.targetQty}`
              }</span>
            </div>
            <p class="quest-desc">${b.description}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
              <span class="quest-reward">Recompensa: ${b.rewardGold} Ouro + ${b.rewardAffinity} Amizade</span>
              ${
                b.completed
                  ? ''
                  : `<button type="button" class="recipe-btn bounty-claim-btn" data-bounty="${b.id}" ${
                      ready ? '' : 'disabled'
                    }>${ready ? 'Concluir Pedido' : 'Pendente'}</button>`
              }
            </div>
          </div>
        `;
      })
      .join('');

    const sideQuests = QUESTS.filter((q) => q.kind === 'secundaria');
    const sideHtml = sideQuests
      .map((q) => {
        const status = qs.getStatus(q.id);
        const requester = q.requesterNpcId ? NPCS[q.requesterNpcId]?.name : 'São Tomé';
        const actionBtn =
          status === 'locked'
            ? `<button type="button" class="recipe-btn sq-accept-btn" data-quest="${q.id}">Aceitar Tarefa</button>`
            : status === 'active'
              ? `<span class="quest-badge">✦ No Diário [J]</span>`
              : `<span class="quest-badge">✓ Concluída</span>`;
        return `
          <div class="quest-row status-${status}">
            <div class="quest-top">
              <span class="quest-title">${q.title} <small style="color:var(--text-muted)">(${requester})</small></span>
              ${actionBtn}
            </div>
            <p class="quest-desc">${q.description}</p>
            <p class="quest-reward">Recompensa: ${q.rewardText}</p>
          </div>
        `;
      })
      .join('');

    this.root.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="tp-title">Quadro de Avisos de São Tomé</h2>
          <button type="button" id="bulletin-close-btn" class="modal-close">✕</button>
        </div>
        <p class="tp-subtitle">Dia ${state.time.day} (${state.time.season}) — Pedidos diários e tarefas dos moradores.</p>

        <h3 class="quest-section-title">Pedidos Diários da Vila</h3>
        <div class="quest-list">${bountiesHtml}</div>

        <h3 class="quest-section-title">Missões Secundárias da Cidade</h3>
        <div class="quest-list">${sideHtml}</div>
      </div>
    `;

    this.root.querySelector('#bulletin-close-btn')?.addEventListener('click', () => this.close());

    this.root.querySelectorAll<HTMLButtonElement>('.bounty-claim-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.bounty;
        if (!id) return;
        const res = qs.tryCompleteBounty(id);
        EventBus.emit('AUDIO_PLAY_SFX', { kind: res.ok ? 'magic' : 'error' });
        EventBus.emit('SHOW_TOAST', { message: res.message, kind: res.ok ? 'success' : 'error' });
        EventBus.emit('GOLD_UPDATED', { gold: state.gold });
        EventBus.emit('INVENTORY_UPDATED', { selectedIndex: state.selectedHotbarIndex });
        EventBus.emit('QUESTS_UPDATED');
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('.sq-accept-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.quest;
        if (!id) return;
        if (qs.discoverSideQuest(id)) {
          EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
          EventBus.emit('SHOW_TOAST', {
            message: 'Nova missão adicionada ao Diário [J]!',
            kind: 'success',
          });
          EventBus.emit('QUESTS_UPDATED');
          this.render();
        }
      });
    });
  }
}


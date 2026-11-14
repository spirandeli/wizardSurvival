import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getCropDef } from '../data/crops';
import { getItemDef } from '../data/items';
import { getNpcList } from '../data/npcs';
import { QUESTS } from '../data/quests';
import { InventorySystem } from '../systems/InventorySystem';
import { ManaSystem, SPELLS } from '../systems/ManaSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { renderItemIconHtml } from './ItemIcon';

type QuestTab = 'missoes' | 'moradores' | 'grimorio' | 'compendio';

const ENEMY_LABELS: Record<string, string> = {
  golem_pedra: 'Golem de Pedra',
  espectro_ruina: 'Espectro da Ruína',
  serpente_cristal: 'Serpente de Cristal',
  sonda_ufologica: 'Sonda Ufológica',
  sentinela_omena: 'Sentinela de Omena',
  guardiao_terra: 'Guardião da Terra',
  guardiao_aguas: 'Guardião das Águas',
  guardiao_ceus: 'Guardião dos Céus',
  omena: 'Omena, Tecelão das Sombras',
};

export class QuestLogModal {
  private root: HTMLElement;
  private isOpen = false;
  private activeTab: QuestTab = 'missoes';

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'quest-modal';
    this.root.className = 'modal-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    EventBus.on('OPEN_QUEST_MODAL', () => {
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

    const mainQuests = QUESTS.filter((q) => q.kind === 'principal');
    const sideQuests = QUESTS.filter((q) => q.kind === 'secundaria');

    const renderQuestItem = (q: (typeof QUESTS)[number]) => {
      const status = qs.getStatus(q.id);
      if (status === 'locked') return '';
      const badge = status === 'completed' ? '✓ Concluída' : '✦ Em Andamento';
      const steps = status === 'active' ? qs.getStepProgress(q.id) : [];
      const stepsHtml =
        steps.length > 0
          ? `<ul class="quest-steps-list">${steps
            .map(
              (s) =>
                `<li class="${s.done ? 'done' : ''}">${s.done ? '✓' : '○'} ${s.label}${s.target > 1 ? ` (${s.current}/${s.target})` : ''
                }</li>`
            )
            .join('')}</ul>`
          : '';
      return `
        <div class="quest-row status-${status}">
          <div class="quest-top">
            <span class="quest-title">${q.title}</span>
            <span class="quest-badge">${badge}</span>
          </div>
          <p class="quest-desc">${q.description}</p>
          ${stepsHtml}
          <p class="quest-reward">Recompensa: ${q.rewardText}</p>
        </div>
      `;
    };

    const sideHtml = sideQuests.map(renderQuestItem).join('');

    const manaSys = new ManaSystem(state);
    const spellsHtml =
      state.unlockedSpells.length === 0
        ? '<p class="quest-empty">Desperte o grimório Lupin no porão para aprender suas primeiras leis cósmicas.</p>'
        : state.unlockedSpells
          .map((id) => {
            const s = SPELLS[id];
            const cost = manaSys.getSpellCost(id);
            return `<div class="spell-chip">✦ <kbd>${s?.hotkey ?? '?'}</kbd> <strong>${s?.name ?? id}</strong> (${cost} Mana): ${s?.description ?? ''
              }</div>`;
          })
          .join('');

    const blessings: string[] = [];
    if (state.flags.earth_guardian_blessed) blessings.push('🌿 Bênção da Terra (crescimento automático)');
    if (state.flags.water_guardian_blessed) blessings.push('💧 Bênção das Águas (rega automática)');
    if (state.flags.sky_guardian_blessed) blessings.push('🌪️ Maestria dos Ventos (+20 Mana, -25% custo, +velocidade)');
    if (state.flags.endgame_unlocked) blessings.push('★ Modo Endgame — Guardião do Núcleo de São Tomé');
    if ((state.houseLevel ?? 1) > 1) {
      blessings.push(`🏠 Moradia Nível ${state.houseLevel}/3 ampliada`);
    }

    const blessingsHtml =
      blessings.length === 0
        ? '<p class="quest-empty">Liberte os Guardiões elementais nos portais do porão para despertar bênçãos permanentes.</p>'
        : blessings.map((b) => `<div class="spell-chip">${b}</div>`).join('');

    const villagersHtml = getNpcList()
      .map((npc) => {
        const aff = state.npcAffinity[npc.id] ?? 0;
        const pct = Math.min(100, aff);
        const favs = npc.favoriteItems
          .map((id) => getItemDef(id)?.name ?? id)
          .slice(0, 3)
          .join(', ');
        const has25 = Boolean(state.flags[`npc_milestone_${npc.id}_25`]);
        const has50 = Boolean(state.flags[`npc_perk_${npc.id}_50`]);
        return `
          <div class="quest-row">
            <div class="quest-top">
              <span class="quest-title" style="color:${npc.portraitColor}">${npc.name} <small style="color:var(--text-muted);font-weight:400;">— ${npc.role}</small></span>
              <span class="quest-badge">♥ ${aff}/100</span>
            </div>
            <div class="npc-aff-bar"><div class="npc-aff-fill" style="width:${pct}%"></div></div>
            <p class="quest-desc">Presentes favoritos: ${favs}</p>
            <p class="quest-reward">
              ${has25 ? '✓' : '○'} 25♥ Segredo: ${npc.milestones.affinity25Title} ·
              ${has50 ? '✓' : '○'} 50♥ Vantagem: ${npc.milestones.affinity50PerkSummary}
            </p>
          </div>
        `;
      })
      .join('');

    const comp = state.compendium ?? {
      enemiesDefeated: {},
      fishesCaught: {},
      cropsHarvested: {},
      loreRead: [],
    };
    const enemyEntries = Object.entries(comp.enemiesDefeated);
    const fishEntries = Object.entries(comp.fishesCaught);
    const cropEntries = Object.entries(comp.cropsHarvested);

    const totalKills = enemyEntries.reduce((acc, [, n]) => acc + n, 0);
    const totalFish = fishEntries.reduce((acc, [, n]) => acc + n, 0);
    const totalCrops = cropEntries.reduce((acc, [, n]) => acc + n, 0);

    const compendiumHtml = `
      <div class="compendium-stats-row">
        <span class="badge-pill">⚔️ Inimigos: ${totalKills}</span>
        <span class="badge-pill">🎣 Peixes: ${totalFish}</span>
        <span class="badge-pill">🌱 Colheitas: ${totalCrops}</span>
        <span class="badge-pill">🗿 Estelas Lidas: ${comp.loreRead.length}</span>
      </div>
      <h3 class="quest-section-title">Bestiário Derrotado</h3>
      <div class="compendium-grid">
        ${enemyEntries.length === 0
        ? '<p class="quest-empty">Nenhuma criatura registrada ainda.</p>'
        : enemyEntries
          .map(([k, n]) => `<div class="compendium-chip">⚔️ ${ENEMY_LABELS[k] ?? k}: <strong>${n}</strong></div>`)
          .join('')
      }
      </div>
      <h3 class="quest-section-title">Pescaria &amp; Safras</h3>
      <div class="compendium-grid">
        ${fishEntries.length === 0 && cropEntries.length === 0
        ? '<p class="quest-empty">Pesque nos rios e colha na fazenda para catalogar espécies.</p>'
        : [
          ...fishEntries.map(([id, n]) => {
            const def = getItemDef(id);
            return `<div class="compendium-chip">${renderItemIconHtml(id, 18)} ${def?.name ?? id}: <strong>${n}</strong></div>`;
          }),
          ...cropEntries.map(([id, n]) => {
            const crop = getCropDef(id);
            const def = crop ? getItemDef(crop.harvestItemId) : getItemDef(id);
            return `<div class="compendium-chip">${renderItemIconHtml(def?.id ?? id, 18)} ${def?.name ?? crop?.name ?? id}: <strong>${n}</strong></div>`;
          }),
        ].join('')
      }
      </div>
    `;

    let bodyHtml = '';
    if (this.activeTab === 'missoes') {
      bodyHtml = `
        <h3 class="quest-section-title">Campanha Principal — Atos I, II &amp; III</h3>
        <div class="quest-list">${mainQuests.map(renderQuestItem).join('')}</div>
        <h3 class="quest-section-title">Missões da Cidade (Secundárias)</h3>
        <div class="quest-list">${sideHtml ||
        '<p class="quest-empty">Converse com os moradores marcados com (!) ou visite o Quadro de Avisos na Praça de São Tomé para descobrir tarefas da vila.</p>'
        }</div>
      `;
    } else if (this.activeTab === 'moradores') {
      bodyHtml = `
        <h3 class="quest-section-title">Moradores de São Tomé dos Números</h3>
        <div class="quest-list">${villagersHtml}</div>
      `;
    } else if (this.activeTab === 'grimorio') {
      bodyHtml = `
        <h3 class="quest-section-title">Bênçãos dos Guardiões, Casa &amp; Endgame</h3>
        <div class="quest-list">${blessingsHtml}</div>
        <h3 class="quest-section-title">Magias Aprendidas</h3>
        <div class="quest-list">${spellsHtml}</div>
      `;
    } else {
      bodyHtml = compendiumHtml;
    }

    this.root.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="tp-title">Grimório de Lupin &amp; Diário</h2>
          <button type="button" id="quest-close-btn" class="modal-close">✕</button>
        </div>
        <div class="modal-tabs">
          <button type="button" class="tab-btn ${this.activeTab === 'missoes' ? 'active' : ''}" data-qtab="missoes">📜 Missões</button>
          <button type="button" class="tab-btn ${this.activeTab === 'moradores' ? 'active' : ''}" data-qtab="moradores">♥ Moradores</button>
          <button type="button" class="tab-btn ${this.activeTab === 'grimorio' ? 'active' : ''}" data-qtab="grimorio">✦ Grimório</button>
          <button type="button" class="tab-btn ${this.activeTab === 'compendio' ? 'active' : ''}" data-qtab="compendio">📖 Compêndio</button>
        </div>
        <div class="quest-tab-body">${bodyHtml}</div>
      </div>
    `;

    this.root.querySelector('#quest-close-btn')?.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-qtab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.qtab as QuestTab | undefined;
        if (next) {
          this.activeTab = next;
          this.render();
        }
      });
    });
  }
}


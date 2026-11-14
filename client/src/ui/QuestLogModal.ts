import { EventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getCropDef } from '../data/crops';
import { getItemDef } from '../data/items';
import { getNpcList, NPCS } from '../data/npcs';
import { QUESTS, type QuestDefinition } from '../data/quests';
import { InventorySystem } from '../systems/InventorySystem';
import { ManaSystem, SPELLS } from '../systems/ManaSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { renderItemIconHtml } from './ItemIcon';

const ENEMY_LABELS: Record<string, string> = {
  golem_pedra: 'Golem de Pedra',
  espectro_ruina: 'Espectro da Ruína',
  escaravelho_inca: 'Escaravelho Dourado Inca',
  totem_condor: 'Totem do Condor Solar',
  colosso_granito: 'Colosso de Obsidiana Inca',
  serpente_cristal: 'Serpente de Cristal',
  lodo_quartzo: 'Limoche de Quartzo Rosa',
  morcego_estalactite: 'Morcego de Ametista',
  salamandra_abissal: 'Salamandra Abissal de Diamante',
  sonda_ufologica: 'Sonda Ufológica',
  drone_alfa: 'Drone Batedor Cinzento',
  androide_xenotecnico: 'Autômato Xenotécnico',
  anomalia_magnetica: 'Anomalia Eletromagnética',
  sentinela_omena: 'Sentinela de Omena',
  sombra_errante: 'Sombra Devoradora do Vazio',
  arauto_abismo: 'Arauto da Fenda Carmesim',
  executor_omena: 'Executor Real de Omena',
  guardiao_terra: 'Guardião da Terra',
  guardiao_aguas: 'Guardião das Águas',
  guardiao_ceus: 'Guardião dos Céus',
  omena: 'Omena, Tecelão das Sombras',
};

const ENEMY_META: Record<
  string,
  { habitat: string; element: string; portrait?: string }
> = {
  golem_pedra: { habitat: 'Machu Picchu (A. 1–10)', element: 'Terra', portrait: 'golem_pedra.png' },
  espectro_ruina: { habitat: 'Ruínas & Grutas (A. 1–6)', element: 'Arcano' },
  escaravelho_inca: { habitat: 'Machu Picchu (A. 1–10)', element: 'Terra', portrait: 'escaravelho_inca.png' },
  totem_condor: { habitat: 'Machu Picchu (A. 4–10)', element: 'Terra/Fogo', portrait: 'totem_condor.png' },
  colosso_granito: { habitat: 'Machu Picchu (A. 7–10)', element: 'Terra (Elite)', portrait: 'colosso_granito.png' },
  serpente_cristal: { habitat: 'Chapada (A. 1–10)', element: 'Água', portrait: 'serpente_cristal.png' },
  lodo_quartzo: { habitat: 'Chapada (A. 1–10)', element: 'Água', portrait: 'lodo_quartzo.png' },
  morcego_estalactite: { habitat: 'Chapada (A. 4–10)', element: 'Água/Ar', portrait: 'morcego_estalactite.png' },
  salamandra_abissal: { habitat: 'Chapada (A. 7–10)', element: 'Água (Elite)', portrait: 'salamandra_abissal.png' },
  sonda_ufologica: { habitat: 'Varginha (A. 1–10)', element: 'Ar', portrait: 'sonda_ufologica.png' },
  drone_alfa: { habitat: 'Varginha (A. 1–10)', element: 'Ar', portrait: 'drone_alfa.png' },
  androide_xenotecnico: { habitat: 'Varginha (A. 4–10)', element: 'Ar/Arcano', portrait: 'androide_xenotecnico.png' },
  anomalia_magnetica: { habitat: 'Varginha (A. 7–10)', element: 'Ar/Arcano (Elite)', portrait: 'anomalia_magnetica.png' },
  sentinela_omena: { habitat: 'Fortaleza de Omena (A. 1–10)', element: 'Arcano', portrait: 'sentinela_omena.png' },
  sombra_errante: { habitat: 'Fortaleza de Omena (A. 1–10)', element: 'Arcano', portrait: 'sombra_errante.png' },
  arauto_abismo: { habitat: 'Fortaleza de Omena (A. 4–10)', element: 'Arcano/Fogo', portrait: 'arauto_abismo.png' },
  executor_omena: { habitat: 'Fortaleza de Omena (A. 7–10)', element: 'Arcano/Fogo (Elite)', portrait: 'executor_omena.png' },
  guardiao_terra: { habitat: 'Altar da Terra (A. 11)', element: 'Chefe Terra', portrait: 'guardiao_terra.png' },
  guardiao_aguas: { habitat: 'Lago Sagrado (A. 11)', element: 'Chefe Água', portrait: 'guardiao_aguas.png' },
  guardiao_ceus: { habitat: 'Núcleo dos Ventos (A. 11)', element: 'Chefe Ar', portrait: 'guardiao_ceus.png' },
  omena: { habitat: 'Trono Dimensional (A. 11)', element: 'Chefe Final' },
};

function renderHeartsHtml(affinity: number): string {
  const clamped = Math.max(0, Math.min(100, affinity));
  const hearts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const threshold = (i + 1) * 10;
    const halfThreshold = i * 10 + 5;
    if (clamped >= threshold) {
      hearts.push('<span class="sdv-heart full" aria-hidden="true">♥</span>');
    } else if (clamped >= halfThreshold) {
      hearts.push('<span class="sdv-heart half" aria-hidden="true">♥</span>');
    } else {
      hearts.push('<span class="sdv-heart empty" aria-hidden="true">♡</span>');
    }
  }
  return `<div class="hearts-row" title="Afinidade: ${clamped}/100">${hearts.join('')}<span class="hearts-num">${clamped}/100</span></div>`;
}

export interface QuestsTabViewState {
  selectedQuestId: string | null;
  showCompleted: boolean;
}

export function renderHubQuestsTab(viewState: QuestsTabViewState): string {
  const state = gameState.getState();
  const inv = new InventorySystem(state);
  const qs = new QuestSystem(state, inv);

  const visibleQuests = QUESTS.filter((q) => qs.getStatus(q.id) !== 'locked');
  const activeQuests = visibleQuests.filter((q) => qs.getStatus(q.id) === 'active');
  const completedQuests = visibleQuests.filter((q) => qs.getStatus(q.id) === 'completed');

  const activeMain = activeQuests.filter((q) => q.kind === 'principal');
  const activeSide = activeQuests.filter((q) => q.kind === 'secundaria');
  const bounties = state.dailyBounties?.items ?? [];

  // Garante seleção válida
  let selectedQuest: QuestDefinition | undefined = visibleQuests.find(
    (q) => q.id === viewState.selectedQuestId
  );
  if (!selectedQuest) {
    selectedQuest =
      activeQuests.find((q) => q.id === state.pinnedQuestId) ??
      activeMain[0] ??
      activeQuests[0] ??
      completedQuests[0];
    if (selectedQuest) {
      viewState.selectedQuestId = selectedQuest.id;
    }
  }

  const renderListEntry = (q: QuestDefinition) => {
    const status = qs.getStatus(q.id);
    const steps = qs.getStepProgress(q.id);
    const doneSteps = steps.filter((s) => s.done).length;
    const isSelected = selectedQuest?.id === q.id;
    const isPinned = state.pinnedQuestId === q.id && status === 'active';
    const npc = q.requesterNpcId ? NPCS[q.requesterNpcId] : undefined;
    const originLabel = npc ? npc.name : q.kind === 'principal' ? 'Campanha Principal' : 'Vila';

    return `
      <button type="button" class="qlist-item status-${status} ${isSelected ? 'selected' : ''}" data-quest-select="${q.id}">
        <div class="qlist-item-top">
          <span class="qlist-status-dot">${status === 'completed' ? '✓' : '✦'}</span>
          <span class="qlist-title">${q.title}</span>
          ${isPinned ? '<span class="qlist-pin" title="Fixada no HUD">📌</span>' : ''}
        </div>
        <div class="qlist-meta">
          <span>${originLabel}</span>
          <span>${doneSteps}/${steps.length} etapas</span>
        </div>
      </button>
    `;
  };

  const bountiesHtml =
    bounties.length > 0
      ? `
      <div class="qlist-group-label">Contratos do Quadro (Hoje)</div>
      ${bounties
        .map((b) => {
          const npcName = NPCS[b.npcId]?.name ?? b.npcId;
          return `
            <div class="qlist-bounty ${b.completed ? 'done' : ''}">
              <div class="qlist-item-top">
                <span class="qlist-status-dot">${b.completed ? '✓' : '📜'}</span>
                <span class="qlist-title">${b.title}</span>
              </div>
              <div class="qlist-meta">
                <span>${npcName}</span>
                <span>${b.progress}/${b.targetQty} • ${b.rewardGold} G</span>
              </div>
            </div>
          `;
        })
        .join('')}
    `
      : '';

  let detailHtml = `
    <div class="qdetail-empty">
      <p>Nenhuma missão descoberta ainda. Converse com os moradores com (!) ou explore a fazenda.</p>
    </div>
  `;

  if (selectedQuest) {
    const status = qs.getStatus(selectedQuest.id);
    const steps = qs.getStepProgress(selectedQuest.id);
    const isPinned = state.pinnedQuestId === selectedQuest.id;
    const npc = selectedQuest.requesterNpcId ? NPCS[selectedQuest.requesterNpcId] : undefined;
    const portraitKey = npc?.id ?? (selectedQuest.kind === 'principal' ? 'lupin' : 'prefeito_arlindo');
    const requesterName = npc ? `${npc.name} — ${npc.role}` : 'Grimório de Lupin • Campanha';

    detailHtml = `
      <div class="qdetail-card">
        <div class="qdetail-header">
          <div class="qdetail-portrait-wrap">
            <img src="/assets/portraits/${portraitKey}.png" alt="${requesterName}" class="qdetail-portrait" onerror="this.style.display='none'" />
          </div>
          <div class="qdetail-head-info">
            <div class="qdetail-badges">
              <span class="qdetail-kind ${selectedQuest.kind}">${
                selectedQuest.kind === 'principal' ? '★ História Principal' : '📜 Missão da Vila'
              }</span>
              <span class="qdetail-status status-${status}">${
                status === 'completed' ? '✓ Concluída' : '✦ Em Andamento'
              }</span>
            </div>
            <h3 class="qdetail-title">${selectedQuest.title}</h3>
            <div class="qdetail-requester">${requesterName}</div>
          </div>
          ${
            status === 'active'
              ? `<button type="button" class="qdetail-pin-btn ${isPinned ? 'pinned' : ''}" data-pin-quest="${selectedQuest.id}" title="${
                  isPinned ? 'Remover fixação do HUD' : 'Acompanhar esta missão no HUD'
                }">
                  ${isPinned ? '📌 Fixada no HUD' : '📌 Fixar no HUD'}
                </button>`
              : ''
          }
        </div>

        <p class="qdetail-desc">${selectedQuest.description}</p>

        <div class="qdetail-hint-box">
          <strong>Pista Atual:</strong> ${selectedQuest.objectiveHint}
        </div>

        <div class="qdetail-steps-wrap">
          <h4>Objetivos</h4>
          <ul class="qdetail-steps">
            ${steps
              .map((s) => {
                const pct = s.target > 0 ? Math.min(100, Math.round((s.current / s.target) * 100)) : 0;
                return `
                  <li class="${s.done ? 'done' : ''}">
                    <div class="qstep-row">
                      <span class="qstep-check">${s.done ? '✓' : '○'}</span>
                      <span class="qstep-label">${s.label}</span>
                      ${s.target > 1 ? `<span class="qstep-count">${s.current}/${s.target}</span>` : ''}
                    </div>
                    ${
                      s.target > 1
                        ? `<div class="qstep-bar"><div class="qstep-bar-fill" style="width:${pct}%"></div></div>`
                        : ''
                    }
                  </li>
                `;
              })
              .join('')}
          </ul>
        </div>

        <div class="qdetail-reward-box">
          <span class="qdetail-reward-label">Recompensa</span>
          <strong class="qdetail-reward-val">🎁 ${selectedQuest.rewardText}</strong>
        </div>
      </div>
    `;
  }

  return `
    <div class="quest-master-detail">
      <aside class="quest-list-col">
        ${
          activeMain.length > 0
            ? `<div class="qlist-group-label">Campanha Principal</div>${activeMain.map(renderListEntry).join('')}`
            : ''
        }
        ${
          activeSide.length > 0
            ? `<div class="qlist-group-label">Missões da Cidade</div>${activeSide.map(renderListEntry).join('')}`
            : ''
        }
        ${
          activeQuests.length === 0
            ? '<p class="quest-empty">Nenhuma missão ativa no momento. Explore e fale com os moradores!</p>'
            : ''
        }
        ${bountiesHtml}
        ${
          completedQuests.length > 0
            ? `
            <button type="button" class="qlist-collapse-btn" id="qlist-toggle-completed">
              ${viewState.showCompleted ? '▾' : '▸'} Concluídas (${completedQuests.length})
            </button>
            ${viewState.showCompleted ? completedQuests.map(renderListEntry).join('') : ''}
          `
            : ''
        }
      </aside>
      <section class="quest-detail-col">
        ${detailHtml}
      </section>
    </div>
  `;
}

export function renderHubVillagersTab(sortByAffinity: boolean): string {
  const state = gameState.getState();
  const list = [...getNpcList()];
  if (sortByAffinity) {
    list.sort((a, b) => (state.npcAffinity[b.id] ?? 0) - (state.npcAffinity[a.id] ?? 0));
  } else {
    list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  const cardsHtml = list
    .map((npc) => {
      const aff = state.npcAffinity[npc.id] ?? 0;
      const has25 = Boolean(state.flags[`npc_milestone_${npc.id}_25`]);
      const has50 = Boolean(state.flags[`npc_perk_${npc.id}_50`]);
      const favHtml = npc.favoriteItems
        .slice(0, 3)
        .map((id) => {
          const def = getItemDef(id);
          return `<span class="villager-fav-chip" title="${def?.name ?? id}">${renderItemIconHtml(id, 18)}<span>${def?.name ?? id}</span></span>`;
        })
        .join('');

      return `
        <div class="villager-card">
          <div class="villager-card-top">
            <img src="/assets/portraits/${npc.id}.png" alt="${npc.name}" class="villager-portrait" onerror="this.style.display='none'" />
            <div class="villager-info">
              <div class="villager-name" style="color:${npc.portraitColor}">${npc.name}</div>
              <div class="villager-role">${npc.role}</div>
              ${renderHeartsHtml(aff)}
            </div>
          </div>
          <div class="villager-favs-row">
            <small>Presentes Favoritos:</small>
            <div class="villager-favs-chips">${favHtml}</div>
          </div>
          <div class="villager-milestones">
            <span class="milestone-seal ${has25 ? 'unlocked' : ''}">${has25 ? '✓' : '○'} 25♥ ${npc.milestones.affinity25Title}</span>
            <span class="milestone-seal ${has50 ? 'unlocked' : ''}">${has50 ? '✓' : '○'} 50♥ ${npc.milestones.affinity50PerkSummary}</span>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="villagers-toolbar">
      <span class="villagers-sub">Moradores de São Tomé dos Números (${list.length}) — Presenteie com [G] para aumentar corações</span>
      <button type="button" class="hub-util-btn" id="villagers-sort-btn">
        ${sortByAffinity ? '♥ Ordenado por Afinidade' : 'A–Z Ordenado por Nome'}
      </button>
    </div>
    <div class="villagers-grid">${cardsHtml}</div>
  `;
}

export function renderHubGrimorioTab(): string {
  const state = gameState.getState();
  const manaSys = new ManaSystem(state);

  const spellsHtml =
    state.unlockedSpells.length === 0
      ? '<p class="quest-empty">Desperte o grimório Lupin no porão para aprender suas primeiras leis cósmicas.</p>'
      : state.unlockedSpells
          .map((id) => {
            const s = SPELLS[id];
            const cost = manaSys.getSpellCost(id);
            return `
              <div class="grimorio-card">
                <div class="grimorio-card-head">
                  <kbd class="grimorio-key">${s?.hotkey ?? '?'}</kbd>
                  <strong>${s?.name ?? id}</strong>
                  <span class="grimorio-cost">${cost} Mana</span>
                </div>
                <p>${s?.description ?? ''}</p>
              </div>
            `;
          })
          .join('');

  const blessings: { icon: string; title: string; desc: string }[] = [];
  if (state.flags.earth_guardian_blessed) {
    blessings.push({ icon: '🌿', title: 'Bênção da Terra', desc: 'Crescimento automático de safras na fazenda.' });
  }
  if (state.flags.water_guardian_blessed) {
    blessings.push({ icon: '💧', title: 'Bênção das Águas', desc: 'Rega automática diária nas plantações.' });
  }
  if (state.flags.sky_guardian_blessed) {
    blessings.push({ icon: '🌪️', title: 'Maestria dos Ventos', desc: '+20 Mana Máxima, -25% custo de magia e +velocidade.' });
  }
  if (state.flags.endgame_unlocked) {
    blessings.push({ icon: '★', title: 'Guardião do Núcleo', desc: 'Modo Endgame ativo em São Tomé dos Números.' });
  }
  if ((state.houseLevel ?? 1) > 1) {
    blessings.push({ icon: '🏠', title: `Moradia Nível ${state.houseLevel}/3`, desc: 'Casa ampliada com espaço extra.' });
  }

  const blessingsHtml =
    blessings.length === 0
      ? '<p class="quest-empty">Liberte os Guardiões elementais nos portais do porão para despertar bênçãos permanentes.</p>'
      : blessings
          .map(
            (b) => `
          <div class="grimorio-card blessing">
            <div class="grimorio-card-head">
              <span class="blessing-icon">${b.icon}</span>
              <strong>${b.title}</strong>
            </div>
            <p>${b.desc}</p>
          </div>
        `
          )
          .join('');

  return `
    <h3 class="quest-section-title">Bênçãos dos Guardiões &amp; Moradia</h3>
    <div class="grimorio-grid">${blessingsHtml}</div>
    <h3 class="quest-section-title">Magias Aprendidas</h3>
    <div class="grimorio-grid">${spellsHtml}</div>
  `;
}

export function renderHubCompendioTab(): string {
  const state = gameState.getState();
  const comp = state.compendium ?? {
    enemiesDefeated: {},
    fishesCaught: {},
    cropsHarvested: {},
    loreRead: [],
  };

  const allEnemyKeys = Object.keys(ENEMY_LABELS);
  const discoveredEnemies = allEnemyKeys.filter((k) => (comp.enemiesDefeated[k] ?? 0) > 0).length;
  const fishEntries = Object.entries(comp.fishesCaught);
  const cropEntries = Object.entries(comp.cropsHarvested);

  const totalKills = Object.values(comp.enemiesDefeated).reduce((acc, n) => acc + n, 0);
  const totalFish = fishEntries.reduce((acc, [, n]) => acc + n, 0);
  const totalCrops = cropEntries.reduce((acc, [, n]) => acc + n, 0);

  return `
    <div class="compendium-stats-row">
      <span class="badge-pill">⚔️ Bestiário: ${discoveredEnemies}/${allEnemyKeys.length} (${totalKills} abates)</span>
      <span class="badge-pill">🎣 Peixes: ${totalFish} (${fishEntries.length} espécies)</span>
      <span class="badge-pill">🌱 Colheitas: ${totalCrops} (${cropEntries.length} tipos)</span>
      <span class="badge-pill">🗿 Estelas Lidas: ${comp.loreRead.length}</span>
    </div>

    <h3 class="quest-section-title">Companheiros &amp; Criaturas Mágicas</h3>
    <div class="compendium-companions-row">
      <div class="compendium-companion-card ${state.flags.lupin_awakened ? 'unlocked' : 'locked'}">
        <img src="/assets/portraits/lupin_busto.png" alt="Lupin" class="compendium-bust" onerror="this.style.display='none'" />
        <div>
          <strong>Lupin (Grimório)</strong>
          <small>${state.flags.lupin_awakened ? `Desperto • ${state.unlockedSpells.length} magias` : 'Dormindo no Porão'}</small>
        </div>
      </div>
      <div class="compendium-companion-card ${state.flags.lupin_awakened ? 'unlocked' : 'locked'}">
        <img src="/assets/portraits/remo_busto.png" alt="Remo" class="compendium-bust" onerror="this.style.display='none'" />
        <div>
          <strong>Remo (Guardião Espiritual)</strong>
          <small>${state.flags.lupin_awakened ? 'Mentor do Altar Arcano' : 'Aguardando Despertar'}</small>
        </div>
      </div>
      <div class="compendium-companion-card ${state.miniDragonsCount > 0 ? 'unlocked' : 'locked'}">
        <img src="/assets/portraits/mini_dragao.png" alt="Mini-Dragão" class="compendium-bust" onerror="this.style.display='none'" />
        <div>
          <strong>Mini-Dragões</strong>
          <small>${state.miniDragonsCount > 0 ? `${state.miniDragonsCount} criado(s) na fazenda` : 'Incube ovos do Porão'}</small>
        </div>
      </div>
      <div class="compendium-companion-card ${state.unicorns.length > 0 ? 'unlocked' : 'locked'}">
        <img src="/assets/portraits/unicornio.png" alt="Unicórnio" class="compendium-bust" onerror="this.style.display='none'" />
        <div>
          <strong>Unicórnios Lunares</strong>
          <small>${state.unicorns.length > 0 ? `${state.unicorns.length} no cercado mágico` : 'Raros na Botica'}</small>
        </div>
      </div>
    </div>

    <h3 class="quest-section-title">Bestiário de São Tomé &amp; Portais (${discoveredEnemies}/${allEnemyKeys.length})</h3>
    <div class="compendium-grid">
      ${allEnemyKeys
        .map((k) => {
          const kills = comp.enemiesDefeated[k] ?? 0;
          const unlocked = kills > 0;
          const isMaster = kills >= 10;
          const meta = ENEMY_META[k];
          const bustHtml =
            unlocked && meta?.portrait
              ? `<img src="/assets/portraits/${meta.portrait}" alt="${ENEMY_LABELS[k]}" class="compendium-enemy-bust" onerror="this.style.display='none'" />`
              : `<span class="compendium-enemy-fallback">${unlocked ? '⚔️' : '❓'}</span>`;
          return `
            <div class="compendium-chip ${unlocked ? 'unlocked' : 'locked'} ${isMaster ? 'mastered' : ''}">
              <div class="compendium-chip-left">
                ${bustHtml}
                <div class="compendium-chip-text">
                  <span>${unlocked ? ENEMY_LABELS[k] : 'Criatura Desconhecida'}</span>
                  <small>${unlocked ? `${meta?.element ?? 'Fenda'} • ${meta?.habitat ?? ''}` : meta?.habitat ?? 'Explore os 10 andares'}</small>
                </div>
              </div>
              <strong>${unlocked ? `${kills}×${isMaster ? ' ★' : ''}` : '???'}</strong>
            </div>
          `;
        })
        .join('')}
    </div>

    <h3 class="quest-section-title">Pescaria &amp; Safras Catalogadas</h3>
    <div class="compendium-grid">
      ${
        fishEntries.length === 0 && cropEntries.length === 0
          ? '<p class="quest-empty">Pesque nos rios e colha na fazenda para catalogar espécies.</p>'
          : [
              ...fishEntries.map(([id, n]) => {
                const def = getItemDef(id);
                return `<div class="compendium-chip unlocked"><span>${renderItemIconHtml(id, 18)} ${def?.name ?? id}</span><strong>${n}×</strong></div>`;
              }),
              ...cropEntries.map(([id, n]) => {
                const crop = getCropDef(id);
                const def = crop ? getItemDef(crop.harvestItemId) : getItemDef(id);
                return `<div class="compendium-chip unlocked"><span>${renderItemIconHtml(def?.id ?? id, 18)} ${def?.name ?? crop?.name ?? id}</span><strong>${n}×</strong></div>`;
              }),
            ].join('')
      }
    </div>
  `;
}

/**
 * Ponte de compatibilidade: `OPEN_QUEST_MODAL` abre o Hub unificado na aba de Missões.
 */
export class QuestLogModal {
  constructor(_parent: HTMLElement) {
    EventBus.on('OPEN_QUEST_MODAL', () => {
      EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'missoes' });
    });
  }

  open(): void {
    EventBus.emit('OPEN_INVENTORY_MODAL', { tab: 'missoes' });
  }

  close(): void {
    // Controlado pelo Hub unificado (InventoryModal)
  }

  destroy(): void {
    // Sem elemento próprio no DOM
  }
}

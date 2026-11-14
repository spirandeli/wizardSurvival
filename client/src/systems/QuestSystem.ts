import type { ActiveBounty, GameStateSnapshot } from '@shared/types';
import { generateDailyBounties, getDayKey } from '../data/bounties';
import { getQuestDef, QUESTS, type QuestDefinition } from '../data/quests';
import { InventorySystem } from './InventorySystem';

export interface QuestStepStatus {
  id: string;
  label: string;
  current: number;
  target: number;
  done: boolean;
}

export class QuestSystem {
  constructor(
    private state: GameStateSnapshot,
    private inventory: InventorySystem
  ) { }

  getStatus(questId: string): 'locked' | 'active' | 'completed' {
    return this.state.questStates[questId]?.status ?? 'locked';
  }

  activateQuest(questId: string): boolean {
    const current = this.getStatus(questId);
    if (current !== 'locked') return false;
    this.state.questStates[questId] = { status: 'active', progress: 0 };
    return true;
  }

  discoverSideQuest(questId: string): boolean {
    const def = getQuestDef(questId);
    if (!def || def.kind !== 'secundaria') return false;
    return this.activateQuest(questId);
  }

  discoverSideQuestsForNpc(npcId: string): QuestDefinition[] {
    const newlyDiscovered: QuestDefinition[] = [];
    for (const q of QUESTS) {
      if (q.kind === 'secundaria' && q.requesterNpcId === npcId && this.getStatus(q.id) === 'locked') {
        if (this.activateQuest(q.id)) {
          newlyDiscovered.push(q);
        }
      }
    }
    return newlyDiscovered;
  }

  hasPlantedRaizQuartzo(): boolean {
    return (
      Boolean(this.state.flags.planted_raiz_quartzo) ||
      Object.values(this.state.tiles).some((t) => t.cropId === 'raiz_de_quartzo')
    );
  }

  private hasIncubatorBuilt(): boolean {
    return (
      this.inventory.hasItem('incubadora_arcana', 1) ||
      Object.values(this.state.tiles).some((t) => t.placedItemId === 'incubadora_arcana') ||
      this.state.miniDragonsCount > 0 ||
      this.state.incubatingEggs.length > 0
    );
  }

  private hasEnchantBenchBuilt(): boolean {
    return (
      this.inventory.hasItem('bancada_encantamento', 1) ||
      Object.values(this.state.tiles).some((t) => t.placedItemId === 'bancada_encantamento')
    );
  }

  getStepProgress(questId: string): QuestStepStatus[] {
    const def = getQuestDef(questId);
    if (!def) return [];

    const isCompleted = this.getStatus(questId) === 'completed';
    const invCount = (id: string) => this.inventory.countItem(id);

    const resolveCurrent = (stepId: string, target: number): number => {
      if (isCompleted) return target;
      switch (stepId) {
        case 'plant_quartzo':
          return this.hasPlantedRaizQuartzo() ? 1 : 0;
        case 'talk_arlindo':
          return this.state.flags.talked_prefeito_arlindo ? 1 : 0;
        case 'enter_porao':
          return this.state.mapId === 'porao' ||
            this.state.discoveredWaypoints.includes('porao') ||
            this.state.flags.lupin_awakened
            ? 1
            : 0;
        case 'awaken_lupin':
          return this.state.flags.lupin_awakened ? 1 : 0;
        case 'collect_eggs':
          return this.state.flags.eggs_collected_porao ? 1 : 0;
        case 'craft_incubator':
          return this.hasIncubatorBuilt() ? 1 : 0;
        case 'use_teleport':
          return this.state.flags.used_teleport ? 1 : 0;
        case 'bento_trapdoor':
          return this.state.flags.bento_trapdoor_inspected ? 1 : 0;
        case 'hatch_dragon1':
          return this.state.miniDragonsCount >= 1 ? 1 : 0;
        case 'repair_earth_portal':
          return this.state.flags.portal_terra_repaired ? 1 : 0;
        case 'free_earth_guardian':
          return this.state.flags.earth_guardian_blessed ? 1 : 0;
        case 'hatch_3_dragons':
          return Math.min(3, this.state.miniDragonsCount);
        case 'forge_liga':
          return this.inventory.hasItem('liga_estelar', 1) || this.state.flags.forged_liga_estelar ? 1 : 0;
        case 'talk_zeca_smoke':
          return this.state.flags.talked_seu_zeca_smoke ? 1 : 0;
        case 'hatch_unicorn':
          return this.state.unicorns.length >= 1 ? 1 : 0;
        case 'craft_enchant_bench':
          return this.hasEnchantBenchBuilt() ? 1 : 0;
        case 'apply_enchant':
          return this.state.flags.applied_unicorn_enchant ? 1 : 0;
        case 'repair_water_portal':
          return this.state.flags.portal_aguas_repaired ? 1 : 0;
        case 'free_water_guardian':
          return this.state.flags.water_guardian_blessed ? 1 : 0;
        case 'talk_lyra_varginha':
          return this.state.flags.talked_lyra_varginha ? 1 : 0;
        case 'repair_sky_portal':
          return this.state.flags.portal_ceus_repaired ? 1 : 0;
        case 'free_sky_guardian':
          return this.state.flags.sky_guardian_blessed ? 1 : 0;
        case 'inspect_gap1':
          return this.state.flags.inspected_lupin_gap1 ? 1 : 0;
        case 'talk_celeste_pages':
          return this.state.flags.talked_celeste_lupin_pages ? 1 : 0;
        case 'prepare_elixir':
          return this.inventory.hasItem('elixir_solsticio', 1) || this.state.flags.prepared_elixir_solsticio
            ? 1
            : 0;
        case 'celebrate_solstice':
          return this.state.flags.seu_zeca_reconciled_solstice ? 1 : 0;
        case 'attune_guardians':
          return this.state.flags.guardians_attuned ? 1 : 0;
        case 'open_omena_portal':
          return this.state.flags.omena_portal_opened ? 1 : 0;
        case 'defeat_omena':
          return this.state.flags.omena_defeated ? 1 : 0;
        case 'sq_fonte_pedra':
          return Math.min(5, invCount('pedra'));
        case 'sq_fonte_quartzo':
          return Math.min(2, invCount('quartzo_refinado'));
        case 'sq_peixe_catch':
          return Math.min(1, invCount('peixe_prisma'));
        case 'sq_cam_find':
          return Math.min(1, invCount('camera_rafael'));
        case 'sq_acorde_lupulo':
          return Math.min(2, invCount('lupulo_estelar'));
        case 'sq_acorde_barra':
          return Math.min(1, invCount('barra_cobre'));
        case 'sq_trator_dragons':
          return Math.min(2, this.state.miniDragonsCount);
        case 'sq_trator_copper':
          return Math.min(2, invCount('barra_cobre'));
        case 'sq_tonico_flor':
          return Math.min(2, invCount('flor_de_sombra'));
        case 'sq_tonico_raiz':
          return Math.min(2, invCount('raiz_de_quartzo'));
        case 'sq_frag_collect':
          return Math.min(3, invCount('fragmento_diario'));
        case 'sq_ferr_tonico':
          return Math.min(1, invCount('tonico_nevoa'));
        case 'sq_ferr_leite':
          return Math.min(2, invCount('leite_unicornio'));
        case 'sq_ferr_liga':
          return Math.min(1, invCount('liga_estelar'));
        default:
          return 0;
      }
    };

    return def.steps.map((s) => {
      const current = resolveCurrent(s.id, s.target);
      return {
        id: s.id,
        label: s.label,
        current,
        target: s.target,
        done: current >= s.target,
      };
    });
  }

  canTurnInSideQuest(questId: string): boolean {
    if (this.getStatus(questId) === 'completed') return false;
    switch (questId) {
      case 'sq_fonte_numeros':
        return this.inventory.hasItem('pedra', 5) && this.inventory.hasItem('quartzo_refinado', 2);
      case 'sq_peixe_prisma':
        return this.inventory.hasItem('peixe_prisma', 1);
      case 'sq_camera_neblina':
        return this.inventory.hasItem('camera_rafael', 1);
      case 'sq_acorde_perdido':
        return this.inventory.hasItem('lupulo_estelar', 2) && this.inventory.hasItem('barra_cobre', 1);
      case 'sq_trator_zeca':
        return this.state.miniDragonsCount >= 2 && this.inventory.hasItem('barra_cobre', 2);
      case 'sq_tonico_nevoa':
        return this.inventory.hasItem('flor_de_sombra', 2) && this.inventory.hasItem('raiz_de_quartzo', 2);
      case 'sq_fragmentos_diario':
        return this.inventory.hasItem('fragmento_diario', 3);
      case 'sq_ferramentas_avancadas':
        return (
          this.inventory.hasItem('tonico_nevoa', 1) &&
          this.inventory.hasItem('leite_unicornio', 2) &&
          this.inventory.hasItem('liga_estelar', 1)
        );
      default:
        return false;
    }
  }

  getNpcQuestIndicator(npcId: string): '?' | '!' | null {
    // 1. Entrega de missão secundária pronta -> '?'
    for (const q of QUESTS) {
      if (q.kind === 'secundaria' && q.requesterNpcId === npcId && this.canTurnInSideQuest(q.id)) {
        return '?';
      }
    }

    // 2. Missão principal esperando conversa com este NPC -> '!'
    if (
      npcId === 'prefeito_arlindo' &&
      this.getStatus('1.1_raizes_na_neblina') === 'active' &&
      !this.state.flags.talked_prefeito_arlindo
    ) {
      return '!';
    }
    if (
      npcId === 'seu_zeca' &&
      this.getStatus('2.1_fumaca_na_cerca') === 'active' &&
      !this.state.flags.talked_seu_zeca_smoke
    ) {
      return '!';
    }
    if (
      npcId === 'lyra' &&
      this.getStatus('2.4_luzes_no_ceu') === 'active' &&
      !this.state.flags.talked_lyra_varginha
    ) {
      return '!';
    }
    if (
      npcId === 'celeste' &&
      this.getStatus('3.1_paginas_faltantes') === 'active' &&
      !this.state.flags.talked_celeste_lupin_pages
    ) {
      return '!';
    }
    if (
      (npcId === 'prefeito_arlindo' || npcId === 'seu_zeca') &&
      this.getStatus('3.2_aliancas_solsticio') === 'active' &&
      !this.state.flags.seu_zeca_reconciled_solstice
    ) {
      return '!';
    }

    // 3. Missão secundária ainda não descoberta com este NPC -> '!'
    const hasLockedSideQuest = QUESTS.some(
      (q) => q.kind === 'secundaria' && q.requesterNpcId === npcId && this.getStatus(q.id) === 'locked'
    );
    if (hasLockedSideQuest) return '!';

    // 4. Marco de amizade pendente (25 ou 50)
    const aff = this.state.npcAffinity[npcId] ?? 0;
    if (
      (aff >= 25 && !this.state.flags[`npc_milestone_${npcId}_25`]) ||
      (aff >= 50 && !this.state.flags[`npc_perk_${npcId}_50`])
    ) {
      return '!';
    }

    return null;
  }

  ensureDailyBounties(): ActiveBounty[] {
    const key = getDayKey(this.state);
    if (this.state.dailyBounties && this.state.dailyBounties.dayKey === key) {
      return this.state.dailyBounties.items;
    }
    const items = generateDailyBounties(this.state);
    this.state.dailyBounties = { dayKey: key, items };
    return items;
  }

  isBountyReady(bounty: ActiveBounty): boolean {
    if (bounty.completed) return false;
    if (bounty.kind === 'delivery') {
      return this.inventory.hasItem(bounty.targetId, bounty.targetQty);
    }
    return bounty.progress >= bounty.targetQty;
  }

  tryCompleteBounty(bountyId: string): { ok: boolean; message: string } {
    const list = this.ensureDailyBounties();
    const bounty = list.find((b) => b.id === bountyId);
    if (!bounty) return { ok: false, message: 'Pedido não encontrado.' };
    if (bounty.completed) return { ok: false, message: 'Este pedido já foi concluído hoje.' };

    if (bounty.kind === 'delivery') {
      if (!this.inventory.hasItem(bounty.targetId, bounty.targetQty)) {
        return { ok: false, message: 'Você ainda não possui todos os itens para este pedido.' };
      }
      this.inventory.removeItem(bounty.targetId, bounty.targetQty);
    } else if (bounty.progress < bounty.targetQty) {
      return {
        ok: false,
        message: `Progresso insuficiente (${bounty.progress}/${bounty.targetQty}).`,
      };
    }

    bounty.completed = true;
    this.state.gold += bounty.rewardGold;
    this.state.npcAffinity[bounty.npcId] = Math.min(
      100,
      (this.state.npcAffinity[bounty.npcId] ?? 0) + bounty.rewardAffinity
    );

    return {
      ok: true,
      message: `Pedido "${bounty.title}" concluído! (+${bounty.rewardGold} G e +${bounty.rewardAffinity} Amizade)`,
    };
  }

  recordEnemyDefeated(enemyKind: string): void {
    this.ensureCompendium();
    if (this.state.compendium) {
      this.state.compendium.enemiesDefeated[enemyKind] =
        (this.state.compendium.enemiesDefeated[enemyKind] ?? 0) + 1;
    }

    const bounties = this.ensureDailyBounties();
    for (const b of bounties) {
      if (!b.completed && b.kind === 'hunt' && b.targetId === enemyKind) {
        b.progress = Math.min(b.targetQty, b.progress + 1);
      }
    }
  }

  recordFishCaught(fishItemId: string): void {
    this.ensureCompendium();
    if (this.state.compendium) {
      this.state.compendium.fishesCaught[fishItemId] =
        (this.state.compendium.fishesCaught[fishItemId] ?? 0) + 1;
    }

    const bounties = this.ensureDailyBounties();
    for (const b of bounties) {
      if (!b.completed && b.kind === 'fish' && b.targetId === fishItemId) {
        b.progress = Math.min(b.targetQty, b.progress + 1);
      }
    }
  }

  recordCropHarvested(cropId: string): void {
    this.ensureCompendium();
    if (this.state.compendium) {
      this.state.compendium.cropsHarvested[cropId] =
        (this.state.compendium.cropsHarvested[cropId] ?? 0) + 1;
    }
  }

  recordLoreRead(loreId: string): boolean {
    this.ensureCompendium();
    if (!this.state.compendium) return false;
    if (this.state.compendium.loreRead.includes(loreId)) return false;
    this.state.compendium.loreRead.push(loreId);
    return true;
  }

  private ensureCompendium(): void {
    if (!this.state.compendium) {
      this.state.compendium = {
        enemiesDefeated: {},
        fishesCaught: {},
        cropsHarvested: {},
        loreRead: [],
      };
    }
  }

  evaluateMainCampaign(): string[] {
    const newlyCompleted: string[] = [];

    // 1.1: Plantar Raiz de Quartzo + visitar a cidade e falar com Prefeito Arlindo
    if (
      this.getStatus('1.1_raizes_na_neblina') === 'active' &&
      this.hasPlantedRaizQuartzo() &&
      this.state.flags.talked_prefeito_arlindo
    ) {
      if (this.completeQuest('1.1_raizes_na_neblina')) {
        newlyCompleted.push('1.1 Raízes na Neblina');
      }
    }

    // 1.2: Despertar Lupin & Remo no porão
    if (this.getStatus('1.2_segredo_assoalho') === 'active' && this.state.flags.lupin_awakened) {
      if (this.completeQuest('1.2_segredo_assoalho')) {
        newlyCompleted.push('1.2 O Segredo do Assoalho e o Grimório');
      }
    }

    // 1.3: Pegar os 3 ovos no porão, fabricar Incubadora e usar Teleporte
    const hasIncubator = this.hasIncubatorBuilt();
    if (
      this.getStatus('1.3_salto_no_espaco') === 'active' &&
      this.state.flags.eggs_collected_porao &&
      this.state.flags.used_teleport &&
      hasIncubator
    ) {
      if (this.completeQuest('1.3_salto_no_espaco')) {
        newlyCompleted.push('1.3 O Salto no Espaço e os Ovos do Porão');
      }
    }

    // 1.4: Moldes no alçapão da Ferraria do Bento + 1 Mini-Dragão chocado
    if (
      this.getStatus('1.4_ferramentas_protetor') === 'active' &&
      this.state.flags.bento_trapdoor_inspected &&
      this.state.miniDragonsCount >= 1
    ) {
      if (this.completeQuest('1.4_ferramentas_protetor')) {
        newlyCompleted.push('1.4 As Ferramentas do Antigo Protetor');
      }
    }

    // 1.5: Libertar o Guardião da Terra em Machu Picchu
    if (
      this.getStatus('1.5_despertar_da_terra') === 'active' &&
      this.state.flags.earth_guardian_blessed
    ) {
      if (this.completeQuest('1.5_despertar_da_terra')) {
        this.state.flags.ato1_completed = true;
        newlyCompleted.push('1.5 O Despertar da Terra (Ato I Concluído!)');
      }
    }

    // 2.1: 3 Mini-Dragões chocados, 1 Liga Estelar forjada e conversar com Seu Zeca
    const hasLigaEstelar =
      this.inventory.hasItem('liga_estelar', 1) || Boolean(this.state.flags.forged_liga_estelar);
    if (
      this.getStatus('2.1_fumaca_na_cerca') === 'active' &&
      this.state.miniDragonsCount >= 3 &&
      hasLigaEstelar &&
      this.state.flags.talked_seu_zeca_smoke
    ) {
      if (this.completeQuest('2.1_fumaca_na_cerca')) {
        newlyCompleted.push('2.1 Fumaça na Cerca (Ato II)');
      }
    }

    // 2.2: Chocar 1 Unicórnio, fabricar Bancada de Encantamento e aplicar 1 encanto elemental
    const hasEnchantBench = this.hasEnchantBenchBuilt();
    if (
      this.getStatus('2.2_brilho_dos_encantos') === 'active' &&
      this.state.unicorns.length >= 1 &&
      hasEnchantBench &&
      this.state.flags.applied_unicorn_enchant
    ) {
      if (this.completeQuest('2.2_brilho_dos_encantos')) {
        this.state.flags.act2_phase1_completed = true;
        newlyCompleted.push('2.2 O Brilho dos Encantos');
      }
    }

    if (
      this.getStatus('2.3_portal_das_aguas') === 'active' &&
      this.state.flags.water_guardian_blessed
    ) {
      if (this.completeQuest('2.3_portal_das_aguas')) {
        newlyCompleted.push('2.3 O Portal das Águas');
      }
    }

    if (
      this.getStatus('2.4_luzes_no_ceu') === 'active' &&
      this.state.flags.talked_lyra_varginha &&
      this.state.flags.sky_guardian_blessed
    ) {
      if (this.completeQuest('2.4_luzes_no_ceu')) {
        this.state.flags.act2_completed = true;
        newlyCompleted.push('2.4 Luzes no Céu');
      }
    }

    if (
      this.getStatus('3.1_paginas_faltantes') === 'active' &&
      this.state.flags.inspected_lupin_gap1 &&
      this.state.flags.talked_celeste_lupin_pages
    ) {
      if (this.completeQuest('3.1_paginas_faltantes')) {
        newlyCompleted.push('3.1 As Páginas Faltantes');
      }
    }

    if (this.getStatus('3.2_aliancas_solsticio') === 'active') {
      if (this.inventory.hasItem('elixir_solsticio', 1)) {
        this.state.flags.prepared_elixir_solsticio = true;
      }
      if (
        this.state.flags.prepared_elixir_solsticio &&
        this.state.flags.seu_zeca_reconciled_solstice &&
        this.state.flags.guardians_attuned
      ) {
        if (this.completeQuest('3.2_aliancas_solsticio')) {
          newlyCompleted.push('3.2 Alianças & Festival do Solstício');
        }
      }
    }

    if (
      this.getStatus('3.3_rompimento_selo_final') === 'active' &&
      this.state.flags.omena_portal_opened
    ) {
      if (this.completeQuest('3.3_rompimento_selo_final')) {
        newlyCompleted.push('3.3 O Rompimento do Selo Final');
      }
    }

    if (
      this.getStatus('3.4_batalha_omena') === 'active' &&
      this.state.flags.omena_defeated
    ) {
      if (this.completeQuest('3.4_batalha_omena')) {
        this.state.flags.act3_completed = true;
        this.state.flags.endgame_unlocked = true;
        newlyCompleted.push('3.4 Omena e o Núcleo do Mundo');
      }
    }

    return newlyCompleted;
  }

  completeQuest(questId: string): boolean {
    if (this.getStatus(questId) === 'completed') return false;
    this.state.questStates[questId] = { status: 'completed', progress: 1 };

    this.grantRewards(questId);

    const def = getQuestDef(questId);
    if (def?.nextQuestId) {
      this.activateQuest(def.nextQuestId);
    }

    return true;
  }

  tryTurnInSideQuest(questId: string): { ok: boolean; message: string } {
    if (this.getStatus(questId) === 'completed') {
      return { ok: false, message: 'Esta missão secundária já foi concluída.' };
    }

    if (questId === 'sq_fonte_numeros') {
      if (!this.inventory.hasItem('pedra', 5) || !this.inventory.hasItem('quartzo_refinado', 2)) {
        return {
          ok: false,
          message: 'Prefeito Arlindo precisa de 5 Pedras e 2 Quartzos Refinados para a Fonte.',
        };
      }
      this.inventory.removeItem('pedra', 5);
      this.inventory.removeItem('quartzo_refinado', 2);
      this.completeQuest('sq_fonte_numeros');
      return {
        ok: true,
        message: 'Fonte dos Números reativada! (+150 G e 3x Semente de Flor de Sombra)',
      };
    }

    if (questId === 'sq_peixe_prisma') {
      if (!this.inventory.hasItem('peixe_prisma', 1)) {
        return {
          ok: false,
          message: 'Pesque um Peixe-Prisma no rio para entregar ao Seu Damião.',
        };
      }
      this.inventory.removeItem('peixe_prisma', 1);
      this.completeQuest('sq_peixe_prisma');
      return {
        ok: true,
        message: 'Seu Damião ficou encantado com o Peixe-Prisma! (+140 G e 3x Minério de Cobre)',
      };
    }

    if (questId === 'sq_camera_neblina') {
      if (!this.inventory.hasItem('camera_rafael', 1)) {
        return {
          ok: false,
          message: 'Encontre a câmera de Rafael perto da cerca sudeste da Fazenda.',
        };
      }
      this.inventory.removeItem('camera_rafael', 1);
      this.completeQuest('sq_camera_neblina');
      return {
        ok: true,
        message: 'Você devolveu a câmera de Rafael! (+100 G e 2x Poção de Mana Menor)',
      };
    }

    if (questId === 'sq_acorde_perdido') {
      if (!this.inventory.hasItem('lupulo_estelar', 2) || !this.inventory.hasItem('barra_cobre', 1)) {
        return {
          ok: false,
          message: 'Ísis precisa de 2x Lúpulo Estelar e 1x Barra de Cobre para restaurar o som do Pub.',
        };
      }
      this.inventory.removeItem('lupulo_estelar', 2);
      this.inventory.removeItem('barra_cobre', 1);
      this.completeQuest('sq_acorde_perdido');
      return {
        ok: true,
        message: 'O Pub de Pedra voltou a vibrar no rock progressivo! (+180 G e 2x Semente de Flor de Sombra)',
      };
    }

    if (questId === 'sq_trator_zeca') {
      if (this.state.miniDragonsCount < 2 || !this.inventory.hasItem('barra_cobre', 2)) {
        return {
          ok: false,
          message: 'Seu Zeca precisa de 2+ Mini-Dragões chocados e 2x Barra de Cobre para soldar o trator.',
        };
      }
      this.inventory.removeItem('barra_cobre', 2);
      this.completeQuest('sq_trator_zeca');
      return {
        ok: true,
        message: 'Trator soldado com fogo de Mini-Dragão! Seu Zeca agora confia em você (+180 G).',
      };
    }

    if (questId === 'sq_tonico_nevoa') {
      if (!this.inventory.hasItem('flor_de_sombra', 2) || !this.inventory.hasItem('raiz_de_quartzo', 2)) {
        return {
          ok: false,
          message: 'Celeste precisa de 2x Flor de Sombra e 2x Raiz de Quartzo para o Tônico contra a Névoa.',
        };
      }
      this.inventory.removeItem('flor_de_sombra', 2);
      this.inventory.removeItem('raiz_de_quartzo', 2);
      this.completeQuest('sq_tonico_nevoa');
      return {
        ok: true,
        message: 'Tônico contra a Névoa preparado! (+160 G e 2x Tônico contra a Névoa)',
      };
    }

    if (questId === 'sq_fragmentos_diario') {
      if (!this.inventory.hasItem('fragmento_diario', 3)) {
        return {
          ok: false,
          message: 'Lyra precisa de 3 Fragmentos do Diário Antigo (Praça, Porão e Sul da Fazenda).',
        };
      }
      this.inventory.removeItem('fragmento_diario', 3);
      this.completeQuest('sq_fragmentos_diario');
      return {
        ok: true,
        message: 'Lyra decifrou o Diário do Antigo Protetor! (+240 G e 2x Liga Estelar)',
      };
    }

    if (questId === 'sq_ferramentas_avancadas') {
      if (
        !this.inventory.hasItem('tonico_nevoa', 1) ||
        !this.inventory.hasItem('leite_unicornio', 2) ||
        !this.inventory.hasItem('liga_estelar', 1)
      ) {
        return {
          ok: false,
          message: 'Bento precisa de 1x Tônico contra a Névoa, 2x Leite de Unicórnio e 1x Liga Estelar.',
        };
      }
      this.inventory.removeItem('tonico_nevoa', 1);
      this.inventory.removeItem('leite_unicornio', 2);
      this.inventory.removeItem('liga_estelar', 1);
      this.state.flags.tools_upgraded_bento = true;
      this.completeQuest('sq_ferramentas_avancadas');
      return {
        ok: true,
        message: 'Ferramentas temperadas com Liga Estelar! (+1 recurso em mineração e corte)',
      };
    }

    return { ok: false, message: 'Missão secundária desconhecida.' };
  }

  getActiveQuests(): QuestDefinition[] {
    return QUESTS.filter((q) => this.getStatus(q.id) === 'active');
  }

  getCompletedQuests(): QuestDefinition[] {
    return QUESTS.filter((q) => this.getStatus(q.id) === 'completed');
  }

  private grantRewards(questId: string): void {
    switch (questId) {
      case '1.1_raizes_na_neblina':
        this.state.gold += 60;
        this.inventory.addItem('vara_pesca_simples', 1);
        break;
      case '1.2_segredo_assoalho':
        // Recompensa principal concedida no Altar de Lupin
        break;
      case '1.3_salto_no_espaco':
        this.state.gold += 80;
        this.inventory.addItem('semente_lupulo_estelar', 2);
        break;
      case '1.4_ferramentas_protetor':
        this.state.gold += 120;
        this.inventory.addItem('minerio_cobre', 4);
        this.inventory.addItem('quartzo_bruto', 2);
        break;
      case '1.5_despertar_da_terra':
        this.state.gold += 250;
        this.inventory.addItem('pocao_cura_menor', 1);
        break;
      case '2.1_fumaca_na_cerca':
        this.state.gold += 200;
        this.inventory.addItem('ovo_unicornio', 1);
        break;
      case '2.2_brilho_dos_encantos':
        this.state.gold += 240;
        this.inventory.addItem('liga_estelar', 2);
        break;
      case '2.3_portal_das_aguas':
        this.state.gold += 320;
        this.inventory.addItem('tonico_nevoa', 1);
        break;
      case '2.4_luzes_no_ceu':
        this.state.gold += 400;
        break;
      case '3.1_paginas_faltantes':
        this.state.gold += 220;
        this.inventory.addItem('elixir_solsticio', 1);
        break;
      case '3.2_aliancas_solsticio':
        this.state.gold += 280;
        this.inventory.addItem('elixir_solsticio', 2);
        break;
      case '3.3_rompimento_selo_final':
        this.state.gold += 300;
        break;
      case '3.4_batalha_omena':
        this.state.gold += 800;
        this.inventory.addItem('cetro_nucleo_mundo', 1);
        break;
      case 'sq_fonte_numeros':
        this.state.gold += 150;
        this.inventory.addItem('semente_flor_sombra', 3);
        break;
      case 'sq_peixe_prisma':
        this.state.gold += 140;
        this.inventory.addItem('minerio_cobre', 3);
        break;
      case 'sq_camera_neblina':
        this.state.gold += 100;
        this.inventory.addItem('pocao_mana_menor', 2);
        break;
      case 'sq_acorde_perdido':
        this.state.gold += 180;
        this.inventory.addItem('semente_flor_sombra', 2);
        this.state.npcAffinity.isis = Math.min(100, (this.state.npcAffinity.isis ?? 0) + 20);
        break;
      case 'sq_trator_zeca':
        this.state.gold += 180;
        this.inventory.addItem('raiz_de_quartzo', 3);
        this.state.npcAffinity.seu_zeca = Math.min(100, (this.state.npcAffinity.seu_zeca ?? 0) + 25);
        break;
      case 'sq_tonico_nevoa':
        this.state.gold += 160;
        this.inventory.addItem('tonico_nevoa', 2);
        this.state.npcAffinity.celeste = Math.min(100, (this.state.npcAffinity.celeste ?? 0) + 20);
        break;
      case 'sq_fragmentos_diario':
        this.state.gold += 240;
        this.inventory.addItem('liga_estelar', 2);
        this.state.npcAffinity.lyra = Math.min(100, (this.state.npcAffinity.lyra ?? 0) + 25);
        break;
      case 'sq_ferramentas_avancadas':
        this.state.gold += 250;
        this.state.npcAffinity.bento = Math.min(100, (this.state.npcAffinity.bento ?? 0) + 25);
        break;
    }
  }
}

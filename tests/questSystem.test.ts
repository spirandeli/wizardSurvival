import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { InventorySystem } from '../client/src/systems/InventorySystem.js';
import { QuestSystem } from '../client/src/systems/QuestSystem.js';

describe('QuestSystem (Campanha do Ato I e Missões Secundárias)', () => {
  it('avança toda a cadeia principal do Ato I (1.1 a 1.5) sem duplicar recompensas', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const quests = new QuestSystem(state, inv);

    expect(quests.getStatus('1.1_raizes_na_neblina')).toBe('active');

    // 1.1 exige plantar Raiz de Quartzo E falar com Prefeito Arlindo
    state.flags.talked_prefeito_arlindo = true;
    expect(quests.evaluateMainCampaign()).toHaveLength(0);
    state.flags.planted_raiz_quartzo = true;
    expect(quests.evaluateMainCampaign()).toContain('1.1 Raízes na Neblina');
    expect(quests.getStatus('1.2_segredo_assoalho')).toBe('active');
    expect(inv.hasItem('vara_pesca_simples', 1)).toBe(true);

    // 1.2
    state.flags.lupin_awakened = true;
    expect(quests.evaluateMainCampaign()).toContain('1.2 O Segredo do Assoalho e o Grimório');
    expect(quests.getStatus('1.3_salto_no_espaco')).toBe('active');

    // 1.3
    state.flags.eggs_collected_porao = true;
    state.flags.used_teleport = true;
    inv.addItem('incubadora_arcana', 1);
    expect(quests.evaluateMainCampaign()).toContain('1.3 O Salto no Espaço e os Ovos do Porão');
    expect(quests.getStatus('1.4_ferramentas_protetor')).toBe('active');
    expect(inv.countItem('semente_lupulo_estelar')).toBe(2);

    // 1.4
    state.flags.bento_trapdoor_inspected = true;
    state.miniDragonsCount = 1;
    expect(quests.evaluateMainCampaign()).toContain('1.4 As Ferramentas do Antigo Protetor');
    expect(quests.getStatus('1.5_despertar_da_terra')).toBe('active');

    // 1.5
    state.flags.earth_guardian_blessed = true;
    expect(quests.evaluateMainCampaign()).toContain('1.5 O Despertar da Terra (Ato I Concluído!)');
    expect(state.flags.ato1_completed).toBe(true);
    expect(inv.hasItem('pocao_cura_menor', 1)).toBe(true);

    // Reavaliar não deve duplicar
    expect(quests.evaluateMainCampaign()).toHaveLength(0);
  });

  it('conclui missões secundárias ao entregar os itens solicitados', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const quests = new QuestSystem(state, inv);

    inv.addItem('peixe_prisma', 1);
    expect(quests.tryTurnInSideQuest('sq_peixe_prisma').ok).toBe(true);
    expect(quests.getStatus('sq_peixe_prisma')).toBe('completed');
    expect(quests.tryTurnInSideQuest('sq_peixe_prisma').ok).toBe(false);

    inv.addItem('camera_rafael', 1);
    expect(quests.tryTurnInSideQuest('sq_camera_neblina').ok).toBe(true);
    expect(inv.countItem('pocao_mana_menor')).toBe(2);
  });

  it('rastreia sub-objetivos, descobre side quests por NPC e conclui pedidos diários', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const quests = new QuestSystem(state, inv);

    const steps11 = quests.getStepProgress('1.1_raizes_na_neblina');
    expect(steps11).toHaveLength(2);
    expect(steps11[0]?.done).toBe(false);

    expect(quests.getStatus('sq_peixe_prisma')).toBe('locked');
    expect(quests.getNpcQuestIndicator('seu_damiao')).toBe('!');

    const discovered = quests.discoverSideQuestsForNpc('seu_damiao');
    expect(discovered.map((q) => q.id)).toContain('sq_peixe_prisma');
    expect(quests.getStatus('sq_peixe_prisma')).toBe('active');

    inv.addItem('peixe_prisma', 1);
    expect(quests.getNpcQuestIndicator('seu_damiao')).toBe('?');

    const bounties = quests.ensureDailyBounties();
    expect(bounties).toHaveLength(2);
    const first = bounties[0]!;
    if (first.kind === 'delivery') {
      inv.addItem(first.targetId, first.targetQty);
    } else {
      first.progress = first.targetQty;
    }
    const claim = quests.tryCompleteBounty(first.id);
    expect(claim.ok).toBe(true);
    expect(first.completed).toBe(true);
  });
});


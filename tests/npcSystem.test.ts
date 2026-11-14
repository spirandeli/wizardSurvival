import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { getNpcList } from '../client/src/data/npcs.js';
import { InventorySystem } from '../client/src/systems/InventorySystem.js';
import { NPCSystem } from '../client/src/systems/NPCSystem.js';

describe('NPCSystem (8 NPCs, Rotinas e Amizade)', () => {
  it('cadastra todos os 8 NPCs da cidade e posiciona por horário', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const npcSys = new NPCSystem(state, inv);

    expect(getNpcList()).toHaveLength(8);

    // Manhã (09:00 = 540 min)
    const morningCity = npcSys.getNpcsForMap('cidade', 540).map((p) => p.npc.id);
    expect(morningCity).toEqual(
      expect.arrayContaining(['prefeito_arlindo', 'lyra', 'isis', 'seu_damiao', 'rafael'])
    );
    expect(npcSys.getNpcsForMap('ferraria', 540).map((p) => p.npc.id)).toContain('bento');
    expect(npcSys.getNpcsForMap('botica', 540).map((p) => p.npc.id)).toContain('celeste');
    expect(npcSys.getNpcsForMap('fazenda', 540).map((p) => p.npc.id)).toContain('seu_zeca');

    // Noite (20:00 = 1200 min) — encontro no Pub de Pedra
    const nightPub = npcSys.getNpcsForMap('pub_pedra', 1200).map((p) => p.npc.id);
    expect(nightPub).toEqual(
      expect.arrayContaining(['isis', 'celeste', 'bento', 'lyra', 'prefeito_arlindo', 'rafael'])
    );
  });

  it('limita ganho de conversa a 1x/dia e aplica bônus de presente favorito', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const npcSys = new NPCSystem(state, inv);

    const talk1 = npcSys.talkToNpc('celeste');
    expect(talk1.affinityGained).toBe(10);
    const talk2 = npcSys.talkToNpc('celeste');
    expect(talk2.affinityGained).toBe(0);

    inv.addItem('flor_de_sombra', 1);
    const giftRes = npcSys.giveGift('celeste', 'flor_de_sombra');
    expect(giftRes.ok).toBe(true);
    expect(giftRes.affinityGained).toBe(25);
    expect(npcSys.getAffinity('celeste')).toBe(35);
    expect(inv.countItem('flor_de_sombra')).toBe(0);
  });

  it('gera falas contextuais por ato/clima/lua e dispara marcos de amizade 25 e 50', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);
    const npcSys = new NPCSystem(state, inv);

    state.npcAffinity.celeste = 20;
    const talk25 = npcSys.talkToNpc('celeste', { mapId: 'botica', minuteOfDay: 540 });
    expect(talk25.affinityGained).toBe(10);
    expect(npcSys.getAffinity('celeste')).toBe(30);
    expect(talk25.milestoneTriggered?.level).toBe(25);
    expect(state.flags.npc_milestone_celeste_25).toBe(true);

    // Subir para 50 e verificar perk de desconto na loja
    state.npcAffinity.celeste = 50;
    const milestone50 = npcSys.checkAndConsumeMilestone('celeste');
    expect(milestone50?.level).toBe(50);
    expect(npcSys.hasPerk('celeste')).toBe(true);
    expect(npcSys.getShopDiscountMultiplier('celeste')).toBe(0.85);

    // Bônus de remessa do Prefeito Arlindo (50+)
    state.flags.npc_perk_prefeito_arlindo_50 = true;
    inv.addItem('raiz_de_quartzo', 2);
    const idx = state.inventory.findIndex((s) => s?.itemId === 'raiz_de_quartzo');
    inv.depositToShippingBin(idx);
    inv.depositToShippingBin(idx);
    const settled = inv.settleShippingBin();
    // 2x 45 = 90; com +15% = 103 (arredondamento de ponto flutuante 90 * 1.15)
    expect(settled.totalGold).toBe(Math.round(90 * 1.15));
  });
});


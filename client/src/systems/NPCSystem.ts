import type { GameStateSnapshot } from '@shared/types';
import type { DialogueTurn } from '../core/EventBus';
import { getItemDef } from '../data/items';
import { NPCS, type NpcDefinition } from '../data/npcs';
import { InventorySystem } from './InventorySystem';

export interface NpcPlacement {
  npc: NpcDefinition;
  tileX: number;
  tileY: number;
}

export interface NpcTalkContext {
  mapId?: string;
  minuteOfDay?: number;
}

export interface NpcTalkResult {
  text: string;
  affinityGained: number;
  milestoneTriggered?: {
    level: 25 | 50;
    title: string;
    turns: DialogueTurn[];
    perkSummary?: string;
  };
}

export function getVillagerShopDiscount(state: GameStateSnapshot, npcId?: string): number {
  if (!npcId) return 0;
  const affinity = state.npcAffinity[npcId] ?? 0;
  const hasPerk50 = Boolean(state.flags[`npc_perk_${npcId}_50`]);
  if (affinity >= 90) return 0.2;
  if (hasPerk50 || affinity >= 50) return 0.15;
  if (affinity >= 45) return 0.1;
  if (affinity >= 30) return 0.05;
  return 0;
}

export class NPCSystem {
  constructor(
    private state: GameStateSnapshot,
    private inventory: InventorySystem
  ) { }

  getNpcsForMap(mapId: string, minuteOfDay: number): NpcPlacement[] {
    const result: NpcPlacement[] = [];

    for (const npc of Object.values(NPCS)) {
      const slot =
        npc.schedules.find(
          (s) => minuteOfDay >= s.fromMinute && minuteOfDay < s.toMinute
        ) ?? npc.schedules[0];

      if (slot && slot.mapId === mapId) {
        result.push({ npc, tileX: slot.tileX, tileY: slot.tileY });
      }
    }

    return result;
  }

  getAffinity(npcId: string): number {
    return this.state.npcAffinity[npcId] ?? 0;
  }

  hasPerk(npcId: string): boolean {
    return Boolean(this.state.flags[`npc_perk_${npcId}_50`]);
  }

  getShopDiscountMultiplier(npcId: string): number {
    return Number((1 - getVillagerShopDiscount(this.state, npcId)).toFixed(2));
  }

  getCurrentAct(): 'act1' | 'act2' | 'act3' | 'endgame' {
    if (this.state.flags.endgame_unlocked || this.state.flags.act3_completed) return 'endgame';
    if (this.state.flags.act2_completed) return 'act3';
    if (this.state.flags.ato1_completed) return 'act2';
    return 'act1';
  }

  getContextualLine(npcId: string, context?: NpcTalkContext): string {
    const npc = NPCS[npcId];
    if (!npc) return '...';

    const affinity = this.getAffinity(npcId);
    const act = this.getCurrentAct();
    const mapId = context?.mapId ?? this.state.mapId;
    const minute = context?.minuteOfDay ?? this.state.time.minuteOfDay;
    const weather = this.state.time.weather;
    const moon = this.state.time.moonPhase;

    const pool: string[] = [];

    // 1. Saudação de nível de afinidade base
    const lineIdx = Math.min(npc.greetings.length - 1, Math.floor(affinity / 30));
    const baseLine = npc.greetings[lineIdx] ?? npc.greetings[0];
    if (baseLine) pool.push(baseLine);

    // 2. Contexto do Ato atual
    const actLines = npc.contextual[act];
    if (actLines && actLines.length > 0) {
      pool.push(...actLines);
    }

    // 3. Clima e Fase da Lua
    const weatherLine = npc.contextual.byWeather?.[weather];
    if (weatherLine) pool.push(weatherLine);
    const moonLine = npc.contextual.byMoon?.[moon];
    if (moonLine) pool.push(moonLine);

    // 4. Local noturno (Pub de Pedra)
    if (mapId === 'pub_pedra' && minute >= 1020 && npc.contextual.pubNight?.length) {
      pool.push(...npc.contextual.pubNight);
    }

    // Seleção determinística por dia + contagem de conversas ou localização
    const seed =
      this.state.time.day +
      this.state.time.year * 7 +
      (mapId === 'pub_pedra' ? 3 : 0) +
      Math.floor(affinity / 10);
    return pool[seed % pool.length] ?? baseLine ?? '...';
  }

  checkAndConsumeMilestone(npcId: string): NpcTalkResult['milestoneTriggered'] | undefined {
    const npc = NPCS[npcId];
    if (!npc) return undefined;
    const affinity = this.getAffinity(npcId);

    const flag25 = `npc_milestone_${npcId}_25`;
    if (affinity >= 25 && !this.state.flags[flag25]) {
      this.state.flags[flag25] = true;
      return {
        level: 25,
        title: npc.milestones.affinity25Title,
        turns: npc.milestones.affinity25Turns,
      };
    }

    const flag50 = `npc_perk_${npcId}_50`;
    if (affinity >= 50 && !this.state.flags[flag50]) {
      this.state.flags[flag50] = true;
      return {
        level: 50,
        title: npc.milestones.affinity50Title,
        turns: npc.milestones.affinity50Turns,
        perkSummary: npc.milestones.affinity50PerkSummary,
      };
    }

    return undefined;
  }

  talkToNpc(npcId: string, context?: NpcTalkContext): NpcTalkResult {
    const npc = NPCS[npcId];
    if (!npc) {
      return { text: '...', affinityGained: 0 };
    }

    const dailyFlag = `talked_${npcId}_d${this.state.time.year}_${this.state.time.season}_${this.state.time.day}`;
    let affinityGained = 0;

    if (!this.state.flags[dailyFlag]) {
      this.state.flags[dailyFlag] = true;
      affinityGained = 10;
      const current = this.state.npcAffinity[npcId] ?? 0;
      this.state.npcAffinity[npcId] = Math.min(100, current + affinityGained);
    }

    const text = this.getContextualLine(npcId, context);
    const milestoneTriggered = this.checkAndConsumeMilestone(npcId);

    return { text, affinityGained, milestoneTriggered };
  }

  giveGift(npcId: string, itemId: string): { ok: boolean; message: string; affinityGained: number } {
    const npc = NPCS[npcId];
    const itemDef = getItemDef(itemId);
    if (!npc || !itemDef) {
      return { ok: false, message: 'Presente inválido.', affinityGained: 0 };
    }
    if (itemDef.category === 'tool' || itemDef.category === 'egg') {
      return { ok: false, message: 'Você não pode presentear este item.', affinityGained: 0 };
    }

    const giftFlag = `gifted_${npcId}_d${this.state.time.year}_${this.state.time.season}_${this.state.time.day}`;
    if (this.state.flags[giftFlag]) {
      return { ok: false, message: `Você já deu um presente para ${npc.name} hoje.`, affinityGained: 0 };
    }

    if (!this.inventory.removeItem(itemId, 1)) {
      return { ok: false, message: 'Item não encontrado na mochila.', affinityGained: 0 };
    }

    this.state.flags[giftFlag] = true;
    const isFav = npc.favoriteItems.includes(itemId);
    const gain = isFav ? 25 : 10;
    this.state.npcAffinity[npcId] = Math.min(100, (this.state.npcAffinity[npcId] ?? 0) + gain);

    return {
      ok: true,
      affinityGained: gain,
      message: isFav
        ? `${npc.name} adorou ${itemDef.name}! (+${gain} Amizade)`
        : `${npc.name} agradeceu por ${itemDef.name}. (+${gain} Amizade)`,
    };
  }
}

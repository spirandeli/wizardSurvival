import type { GameStateSnapshot, UnicornCreature } from '@shared/types';
import { rollUnicornEnchants } from './EnchantmentSystem';
import { InventorySystem } from './InventorySystem';

export const BASEMENT_EGG_COUNT = 3;
export const EGG_INCUBATION_DAYS = 1;

const UNICORN_NAMES = ['Lumia', 'Serena', 'Estrela', 'Aurora', 'Prisma', 'Bruma'] as const;

export class AnimalSystem {
  constructor(
    private state: GameStateSnapshot,
    private inventory: InventorySystem
  ) {}

  collectBasementEggs(): { ok: boolean; message: string } {
    if (this.state.flags.eggs_collected_porao) {
      return { ok: false, message: 'Você já recolheu os 3 ovos de Mini-Dragão deste ninho.' };
    }

    const leftover = this.inventory.addItem('ovo_mini_dragao', BASEMENT_EGG_COUNT);
    if (leftover > 0) {
      return { ok: false, message: 'Libere espaço na mochila para carregar os 3 ovos.' };
    }

    this.state.flags.eggs_collected_porao = true;
    return {
      ok: true,
      message: 'Você recolheu 3 Ovos de Mini-Dragão! Construa a Incubadora Arcana para chocá-los.',
    };
  }

  startIncubation(
    currentDayAbsolute: number,
    preferredEggId?: 'ovo_mini_dragao' | 'ovo_unicornio'
  ): { ok: boolean; message: string } {
    if (this.state.incubatingEggs.length >= 3) {
      return { ok: false, message: 'A Incubadora já está operando na capacidade máxima.' };
    }

    let eggToUse: 'ovo_mini_dragao' | 'ovo_unicornio' | null = null;
    if (preferredEggId && this.inventory.hasItem(preferredEggId, 1)) {
      eggToUse = preferredEggId;
    } else if (this.inventory.hasItem('ovo_mini_dragao', 1)) {
      eggToUse = 'ovo_mini_dragao';
    } else if (this.inventory.hasItem('ovo_unicornio', 1)) {
      eggToUse = 'ovo_unicornio';
    }

    if (!eggToUse) {
      return {
        ok: false,
        message: 'Você precisa de um Ovo de Mini-Dragão ou Ovo de Unicórnio na mochila.',
      };
    }

    this.inventory.removeItem(eggToUse, 1);
    this.state.incubatingEggs.push({
      eggItemId: eggToUse,
      hatchDay: currentDayAbsolute + EGG_INCUBATION_DAYS,
    });

    const creatureLabel = eggToUse === 'ovo_unicornio' ? 'Unicórnio' : 'Mini-Dragão';
    return {
      ok: true,
      message: `Ovo de ${creatureLabel} colocado na Incubadora Arcana! Ele chocará ao dormir.`,
    };
  }

  processEndOfDay(
    newDayAbsolute: number,
    rng: () => number = Math.random
  ): { hatchedCount: number; hatchedUnicornsCount: number } {
    const remaining = [];
    let hatchedCount = 0;
    let hatchedUnicornsCount = 0;

    for (const egg of this.state.incubatingEggs) {
      if (newDayAbsolute >= egg.hatchDay) {
        if (egg.eggItemId === 'ovo_unicornio') {
          hatchedUnicornsCount += 1;
          const idx = this.state.unicorns.length;
          const creature: UnicornCreature = {
            id: `unicorn_${newDayAbsolute}_${idx + 1}`,
            name: UNICORN_NAMES[idx % UNICORN_NAMES.length] ?? `Unicórnio ${idx + 1}`,
            rolledEnchants: rollUnicornEnchants(rng),
            lastMilkDay: newDayAbsolute - 1,
            affinity: 0,
            lastPetDay: newDayAbsolute - 1,
          };
          this.state.unicorns.push(creature);
        } else {
          hatchedCount += 1;
          this.state.miniDragonsCount += 1;
        }
      } else {
        remaining.push(egg);
      }
    }

    this.state.incubatingEggs = remaining;
    return { hatchedCount, hatchedUnicornsCount };
  }

  petUnicorn(
    unicornId: string,
    currentDayAbsolute: number
  ): { ok: boolean; affinity: number; message: string } {
    const unicorn = this.state.unicorns.find((u) => u.id === unicornId);
    if (!unicorn) {
      return { ok: false, affinity: 0, message: 'Unicórnio não encontrado.' };
    }
    const curAffinity = unicorn.affinity ?? 0;
    if ((unicorn.lastPetDay ?? -1) >= currentDayAbsolute) {
      return {
        ok: false,
        affinity: curAffinity,
        message: `${unicorn.name} já recebeu carinho hoje (${curAffinity}/100 ♥).`,
      };
    }
    const nextAffinity = Math.min(100, curAffinity + 15);
    unicorn.affinity = nextAffinity;
    unicorn.lastPetDay = currentDayAbsolute;
    return {
      ok: true,
      affinity: nextAffinity,
      message: `${unicorn.name} adorou o carinho! Afinidade: ${nextAffinity}/100 ♥${
        nextAffinity >= 50 ? ' (Produção em dobro ativa!)' : ''
      }`,
    };
  }

  petMiniDragons(currentDayAbsolute: number): { ok: boolean; message: string } {
    if (this.state.miniDragonsCount <= 0) {
      return { ok: false, message: 'Nenhum Mini-Dragão chocado ainda.' };
    }
    if ((this.state.lastDragonPetDay ?? -1) >= currentDayAbsolute) {
      return { ok: false, message: 'Os Mini-Dragões já receberam carinho e brasa hoje!' };
    }
    this.state.lastDragonPetDay = currentDayAbsolute;
    this.state.vitals.mana = Math.min(this.state.vitals.maxMana, this.state.vitals.mana + 6);
    return {
      ok: true,
      message: 'Você acariciou os Mini-Dragões! O calor dracônico restaurou +6 Mana.',
    };
  }

  collectUnicornMilk(
    unicornId: string,
    currentDayAbsolute: number
  ): { ok: boolean; message: string } {
    const unicorn = this.state.unicorns.find((u) => u.id === unicornId);
    if (!unicorn) {
      return { ok: false, message: 'Unicórnio não encontrado.' };
    }
    if (unicorn.lastMilkDay >= currentDayAbsolute) {
      return { ok: false, message: `${unicorn.name} já produziu Leite Mágico hoje.` };
    }

    const yieldQty = (unicorn.affinity ?? 0) >= 50 ? 2 : 1;
    const leftover = this.inventory.addItem('leite_unicornio', yieldQty);
    if (leftover === yieldQty) {
      return { ok: false, message: 'Mochila cheia para coletar o Leite de Unicórnio!' };
    }
    const actualAdded = yieldQty - leftover;

    unicorn.lastMilkDay = currentDayAbsolute;
    this.state.flags.collected_unicorn_milk = true;
    return {
      ok: true,
      message: `Coletou ${actualAdded}x Leite de Unicórnio de ${unicorn.name}!`,
    };
  }

  getAbsoluteDay(): number {
    return (this.state.time.year - 1) * 112 + this.state.time.day;
  }
}


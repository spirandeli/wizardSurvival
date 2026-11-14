import type { GameStateSnapshot } from '@shared/types';

export interface SpellDefinition {
  id: string;
  name: string;
  manaCost: number;
  hotkey: string;
  description: string;
}

export const SPELLS: Record<string, SpellDefinition> = {
  teleporte: {
    id: 'teleporte',
    name: 'Teleporte Telúrico',
    manaCost: 15,
    hotkey: 'T',
    description: 'Viaja instantaneamente para qualquer ponto sintonizado (não consome Stamina).',
  },
  fagulha_arcana: {
    id: 'fagulha_arcana',
    name: 'Fagulha Arcana',
    manaCost: 8,
    hotkey: 'Q',
    description: 'Dispara um projétil de energia pura contra criaturas corrompidas.',
  },
  pilar_telurico: {
    id: 'pilar_telurico',
    name: 'Pilar Telúrico',
    manaCost: 14,
    hotkey: 'R',
    description:
      'Ondas de terra ao redor causam dano em área, empurram inimigos e quebram veios de minério próximos.',
  },
  mare_curativa: {
    id: 'mare_curativa',
    name: 'Maré Curativa',
    manaCost: 18,
    hotkey: 'F',
    description:
      'Libera uma maré protetora que dissipa projéteis inimigos próximos e restaura 25 HP.',
  },
  raio_estelar: {
    id: 'raio_estelar',
    name: 'Raio Estelar',
    manaCost: 16,
    hotkey: 'V',
    description:
      'Dispara um feixe perfurante veloz de energia estelar e zera a recarga de ataque e dash.',
  },
};

export class ManaSystem {
  constructor(private state: GameStateSnapshot) {}

  getMana(): number {
    return this.state.vitals.mana;
  }

  getMaxMana(): number {
    return this.state.vitals.maxMana;
  }

  hasSpell(spellId: string): boolean {
    return this.state.unlockedSpells.includes(spellId);
  }

  unlockSpell(spellId: string): boolean {
    if (this.hasSpell(spellId)) return false;
    this.state.unlockedSpells.push(spellId);
    return true;
  }

  getSpellCost(spellId: string): number {
    const spell = SPELLS[spellId];
    if (!spell) return 0;
    if (this.state.flags.sky_guardian_blessed) {
      return Math.max(1, Math.round(spell.manaCost * 0.75));
    }
    return spell.manaCost;
  }

  canCast(spellId: string): { ok: boolean; reason?: string } {
    const spell = SPELLS[spellId];
    if (!spell) return { ok: false, reason: 'Magia desconhecida.' };
    if (!this.hasSpell(spellId)) return { ok: false, reason: 'Magia ainda não desbloqueada em Lupin.' };
    const cost = this.getSpellCost(spellId);
    if (this.state.vitals.mana < cost) {
      return { ok: false, reason: 'Mana insuficiente!' };
    }
    return { ok: true };
  }

  consumeForSpell(spellId: string): boolean {
    const check = this.canCast(spellId);
    if (!check.ok) return false;
    const cost = this.getSpellCost(spellId);
    this.state.vitals.mana = Math.max(0, this.state.vitals.mana - cost);
    return true;
  }

  restoreMana(amount: number): number {
    const before = this.state.vitals.mana;
    this.state.vitals.mana = Math.min(this.state.vitals.maxMana, before + Math.max(0, amount));
    return this.state.vitals.mana - before;
  }
}


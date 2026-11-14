import type { GameStateSnapshot, InventorySlot } from '@shared/types';
import { HOTBAR_SIZE } from '../config/gameConfig';
import { getItemDef } from '../data/items';

export class InventorySystem {
  constructor(private state: GameStateSnapshot) {}

  getSlots(): (InventorySlot | null)[] {
    return this.state.inventory;
  }

  getSelectedSlot(): InventorySlot | null {
    return this.state.inventory[this.state.selectedHotbarIndex] ?? null;
  }

  selectHotbarSlot(index: number): void {
    if (index >= 0 && index < HOTBAR_SIZE) {
      this.state.selectedHotbarIndex = index;
    }
  }

  swapSlots(fromIndex: number, toIndex: number): boolean {
    const len = this.state.inventory.length;
    if (
      fromIndex < 0 ||
      fromIndex >= len ||
      toIndex < 0 ||
      toIndex >= len ||
      fromIndex === toIndex
    ) {
      return false;
    }
    const source = this.state.inventory[fromIndex];
    const target = this.state.inventory[toIndex];
    if (!source && !target) return false;

    // Se for o mesmo item empilhável, junta o máximo possível no destino
    if (source && target && source.itemId === target.itemId) {
      const maxStack = getItemDef(source.itemId)?.maxStack ?? 99;
      if (target.quantity < maxStack) {
        const transfer = Math.min(source.quantity, maxStack - target.quantity);
        target.quantity += transfer;
        source.quantity -= transfer;
        if (source.quantity <= 0) {
          this.state.inventory[fromIndex] = null;
        }
        return true;
      }
    }

    this.state.inventory[fromIndex] = target ?? null;
    this.state.inventory[toIndex] = source ?? null;
    return true;
  }

  moveToHotbarOrBag(slotIndex: number): { ok: boolean; targetIndex?: number; message: string } {
    const slot = this.state.inventory[slotIndex];
    if (!slot) {
      return { ok: false, message: 'Espaço vazio.' };
    }

    const isInHotbar = slotIndex < HOTBAR_SIZE;
    const start = isInHotbar ? HOTBAR_SIZE : 0;
    const end = isInHotbar ? this.state.inventory.length : HOTBAR_SIZE;

    for (let i = start; i < end; i++) {
      if (this.state.inventory[i] === null) {
        this.swapSlots(slotIndex, i);
        return {
          ok: true,
          targetIndex: i,
          message: isInHotbar ? 'Movido para a mochila.' : `Movido para a hotbar (slot ${i + 1}).`,
        };
      }
    }

    return {
      ok: false,
      message: isInHotbar ? 'Mochila interna cheia!' : 'Hotbar cheia! Arraste para trocar de lugar.',
    };
  }

  equipFromSlot(slotIndex: number): { ok: boolean; message: string } {
    const slot = this.state.inventory[slotIndex];
    if (!slot) {
      return { ok: false, message: 'Nenhum item selecionado para equipar.' };
    }
    const def = getItemDef(slot.itemId);
    if (!def || (def.category !== 'weapon' && def.category !== 'armor')) {
      return { ok: false, message: 'Este item não pode ser equipado.' };
    }

    const previousId =
      def.category === 'weapon' ? this.state.equippedWeaponId : this.state.equippedArmorId;

    if (previousId === def.id) {
      return { ok: false, message: `${def.name} já está equipado.` };
    }

    if (slot.quantity > 1) {
      slot.quantity -= 1;
      if (previousId) {
        const leftover = this.addItem(previousId, 1);
        if (leftover > 0) {
          slot.quantity += 1;
          return { ok: false, message: 'Sem espaço na mochila para guardar o item anterior.' };
        }
      }
    } else {
      this.state.inventory[slotIndex] = previousId ? { itemId: previousId, quantity: 1 } : null;
    }

    if (def.category === 'weapon') {
      this.state.equippedWeaponId = def.id;
    } else {
      this.state.equippedArmorId = def.id;
    }

    return { ok: true, message: `Equipou: ${def.name}` };
  }

  equipItem(itemId: string, preferredSlotIndex?: number): { ok: boolean; message: string } {
    if (
      typeof preferredSlotIndex === 'number' &&
      this.state.inventory[preferredSlotIndex]?.itemId === itemId
    ) {
      return this.equipFromSlot(preferredSlotIndex);
    }
    const idx = this.state.inventory.findIndex((s) => s?.itemId === itemId);
    if (idx === -1) {
      return { ok: false, message: 'Item não encontrado na mochila.' };
    }
    return this.equipFromSlot(idx);
  }

  unequipGear(gearSlot: 'weapon' | 'armor'): { ok: boolean; message: string } {
    const equippedId =
      gearSlot === 'weapon' ? this.state.equippedWeaponId : this.state.equippedArmorId;
    if (!equippedId) {
      return { ok: false, message: 'Nada equipado neste espaço.' };
    }

    const def = getItemDef(equippedId);
    const hasEmpty = this.state.inventory.some((s) => s === null);
    if (!hasEmpty) {
      return { ok: false, message: 'Mochila cheia! Libere 1 espaço para desequipar.' };
    }

    const leftover = this.addItem(equippedId, 1);
    if (leftover > 0) {
      return { ok: false, message: 'Mochila cheia! Libere 1 espaço para desequipar.' };
    }

    if (gearSlot === 'weapon') {
      this.state.equippedWeaponId = null;
    } else {
      this.state.equippedArmorId = null;
    }

    return { ok: true, message: `Desequipou: ${def?.name ?? equippedId}` };
  }

  consumeRestoreItem(slotIndex: number): {
    ok: boolean;
    message: string;
    hpGained: number;
    manaGained: number;
    stamGained: number;
  } {
    const slot = this.state.inventory[slotIndex];
    if (!slot) {
      return { ok: false, message: 'Espaço vazio.', hpGained: 0, manaGained: 0, stamGained: 0 };
    }
    const def = getItemDef(slot.itemId);
    if (!def || (def.category !== 'consumable' && def.category !== 'crop')) {
      return {
        ok: false,
        message: 'Este item não é consumível.',
        hpGained: 0,
        manaGained: 0,
        stamGained: 0,
      };
    }

    const hasRestore = Boolean(def.hpRestore || def.manaRestore || def.energyRestore);
    if (!hasRestore) {
      return {
        ok: false,
        message: `${def.name} não restaura atributos diretamente.`,
        hpGained: 0,
        manaGained: 0,
        stamGained: 0,
      };
    }

    const hpGained = def.hpRestore
      ? Math.min(this.state.vitals.maxHp - this.state.vitals.hp, def.hpRestore)
      : 0;
    const manaGained = def.manaRestore
      ? Math.min(this.state.vitals.maxMana - this.state.vitals.mana, def.manaRestore)
      : 0;
    const stamGained = def.energyRestore
      ? Math.min(this.state.vitals.maxStamina - this.state.vitals.stamina, def.energyRestore)
      : 0;

    if (hpGained <= 0 && manaGained <= 0 && stamGained <= 0) {
      return {
        ok: false,
        message: 'Seus atributos vitais já estão cheios.',
        hpGained: 0,
        manaGained: 0,
        stamGained: 0,
      };
    }

    this.state.vitals.hp += hpGained;
    this.state.vitals.mana += manaGained;
    this.state.vitals.stamina += stamGained;

    if (slot.quantity > 1) {
      slot.quantity -= 1;
    } else {
      this.state.inventory[slotIndex] = null;
    }

    const gains: string[] = [];
    if (hpGained > 0) gains.push(`+${hpGained} HP`);
    if (manaGained > 0) gains.push(`+${manaGained} Mana`);
    if (stamGained > 0) gains.push(`+${stamGained} Stamina`);

    return {
      ok: true,
      message: `Usou ${def.name} (${gains.join(', ')})!`,
      hpGained,
      manaGained,
      stamGained,
    };
  }

  countItem(itemId: string): number {
    return this.state.inventory.reduce((acc, slot) => {
      if (slot && slot.itemId === itemId) {
        return acc + slot.quantity;
      }
      return acc;
    }, 0);
  }

  hasItem(itemId: string, quantity = 1): boolean {
    return this.countItem(itemId) >= quantity;
  }

  addItem(itemId: string, quantity = 1): number {
    if (quantity <= 0) return 0;
    const def = getItemDef(itemId);
    const maxStack = def?.maxStack ?? 99;
    let remaining = quantity;

    // Empilha em slots existentes primeiro
    for (const slot of this.state.inventory) {
      if (!slot || slot.itemId !== itemId || slot.quantity >= maxStack) continue;
      const space = maxStack - slot.quantity;
      const toAdd = Math.min(space, remaining);
      slot.quantity += toAdd;
      remaining -= toAdd;
      if (remaining === 0) return 0;
    }

    // Ocupa slots vazios
    for (let i = 0; i < this.state.inventory.length; i++) {
      if (this.state.inventory[i] !== null) continue;
      const toAdd = Math.min(maxStack, remaining);
      this.state.inventory[i] = { itemId, quantity: toAdd };
      remaining -= toAdd;
      if (remaining === 0) return 0;
    }

    return remaining; // retorna sobra caso mochila esteja cheia
  }

  removeItem(itemId: string, quantity = 1): boolean {
    if (quantity <= 0) return true;
    if (!this.hasItem(itemId, quantity)) return false;

    let remaining = quantity;
    for (let i = 0; i < this.state.inventory.length; i++) {
      const slot = this.state.inventory[i];
      if (!slot || slot.itemId !== itemId) continue;

      if (slot.quantity > remaining) {
        slot.quantity -= remaining;
        return true;
      }
      remaining -= slot.quantity;
      this.state.inventory[i] = null;
      if (remaining === 0) return true;
    }

    return true;
  }

  depositToShippingBin(slotIndex: number): { ok: boolean; message: string } {
    const slot = this.state.inventory[slotIndex];
    if (!slot) {
      return { ok: false, message: 'Selecione um item para enviar.' };
    }
    const def = getItemDef(slot.itemId);
    if (!def || def.sellPrice <= 0) {
      return { ok: false, message: 'Este item não pode ser vendido na Caixa de Remessas.' };
    }

    const existingBin = this.state.shippingBin.find((b) => b.itemId === slot.itemId);
    if (existingBin) {
      existingBin.quantity += 1;
    } else {
      this.state.shippingBin.push({ itemId: slot.itemId, quantity: 1 });
    }

    if (slot.quantity > 1) {
      slot.quantity -= 1;
    } else {
      this.state.inventory[slotIndex] = null;
    }

    return { ok: true, message: `1x ${def.name} colocado na Caixa de Remessas.` };
  }

  settleShippingBin(): { totalGold: number; itemsSold: number } {
    let totalGold = 0;
    let itemsSold = 0;

    for (const entry of this.state.shippingBin) {
      const def = getItemDef(entry.itemId);
      const price = def?.sellPrice ?? 0;
      totalGold += price * entry.quantity;
      itemsSold += entry.quantity;
    }

    if (this.state.flags.npc_perk_prefeito_arlindo_50 && totalGold > 0) {
      totalGold = Math.round(totalGold * 1.15);
    }

    this.state.gold += totalGold;
    this.state.shippingBin = [];
    return { totalGold, itemsSold };
  }
}


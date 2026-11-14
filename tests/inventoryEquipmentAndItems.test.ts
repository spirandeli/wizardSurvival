import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import { ITEMS } from '../client/src/data/items.js';
import { InventorySystem } from '../client/src/systems/InventorySystem.js';

describe('Catálogo de itens e operações de Inventário / Equipamentos', () => {
  it('garante que todos os 45 itens possuem iconFrame único de 0 a 44', () => {
    const entries = Object.values(ITEMS);
    expect(entries).toHaveLength(45);

    const frames = new Set(entries.map((item) => item.iconFrame));
    expect(frames.size).toBe(45);
    for (let i = 0; i < 45; i++) {
      expect(frames.has(i)).toBe(true);
    }
  });

  it('troca slots, mescla pilhas e move itens entre Hotbar (0..11) e Mochila (12..23)', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);

    // Slots 0..8 vêm preenchidos; 9..11 estão livres na hotbar e 12..23 na mochila
    state.inventory[12] = { itemId: 'pedra', quantity: 5 };
    state.inventory[5] = { itemId: 'madeira', quantity: 3 };

    expect(inv.swapSlots(12, 5)).toBe(true);
    expect(state.inventory[5]).toEqual({ itemId: 'pedra', quantity: 5 });
    expect(state.inventory[12]).toEqual({ itemId: 'madeira', quantity: 3 });

    // Move da mochila (12) para a primeira vaga na hotbar (slot 9)
    const movedToHotbar = inv.moveToHotbarOrBag(12);
    expect(movedToHotbar.ok).toBe(true);
    expect(movedToHotbar.targetIndex).toBe(9);
    expect(state.inventory[9]).toEqual({ itemId: 'madeira', quantity: 3 });
    expect(state.inventory[12]).toBeNull();

    // Mescla duas pilhas do mesmo item respeitando maxStack
    state.inventory[15] = { itemId: 'pedra', quantity: 4 };
    expect(inv.swapSlots(15, 5)).toBe(true);
    expect(state.inventory[5]).toEqual({ itemId: 'pedra', quantity: 9 });
    expect(state.inventory[15]).toBeNull();
  });

  it('equipa cajados/roupas devolvendo o equipamento anterior para a mochila sem perder itens', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);

    expect(state.equippedWeaponId).toBe('cajado_aprendiz');
    expect(state.equippedArmorId).toBe('tunica_neblina');

    // Adiciona segundo cajado e segunda armadura na mochila
    state.inventory[12] = { itemId: 'cajado_quartzo_terra', quantity: 1 };
    state.inventory[13] = { itemId: 'armadura_granito_runico', quantity: 1 };

    const eqWeapon = inv.equipFromSlot(12);
    expect(eqWeapon.ok).toBe(true);
    expect(state.equippedWeaponId).toBe('cajado_quartzo_terra');
    // O cajado anterior retorna ao slot de origem sem sumir
    expect(state.inventory[12]).toEqual({ itemId: 'cajado_aprendiz', quantity: 1 });

    const eqArmor = inv.equipItem('armadura_granito_runico', 13);
    expect(eqArmor.ok).toBe(true);
    expect(state.equippedArmorId).toBe('armadura_granito_runico');
    expect(state.inventory[13]).toEqual({ itemId: 'tunica_neblina', quantity: 1 });

    // Desequipar envia para o inventário; com inventário lotado, bloqueia com segurança
    const uneqRes = inv.unequipGear('weapon');
    expect(uneqRes.ok).toBe(true);
    expect(state.equippedWeaponId).toBeNull();
    expect(inv.countItem('cajado_quartzo_terra')).toBe(1);

    // Preenche todos os 24 espaços
    for (let i = 0; i < state.inventory.length; i++) {
      if (!state.inventory[i]) {
        state.inventory[i] = { itemId: 'pedra', quantity: 1 };
      }
    }
    const blockedUnequip = inv.unequipGear('armor');
    expect(blockedUnequip.ok).toBe(false);
    expect(state.equippedArmorId).toBe('armadura_granito_runico');
  });

  it('consome itens restauradores respeitando os tetos de HP, Mana e Stamina', () => {
    const state = createInitialGameState();
    const inv = new InventorySystem(state);

    // maxMana inicial = 60
    state.vitals.mana = 20;
    state.inventory[9] = { itemId: 'pocao_mana_menor', quantity: 2 };

    const use1 = inv.consumeRestoreItem(9);
    expect(use1.ok).toBe(true);
    expect(use1.manaGained).toBe(30);
    expect(state.vitals.mana).toBe(50);
    expect(state.inventory[9]).toEqual({ itemId: 'pocao_mana_menor', quantity: 1 });

    // Segunda poção completa até o teto 60 (ganho de +10)
    const use2 = inv.consumeRestoreItem(9);
    expect(use2.ok).toBe(true);
    expect(use2.manaGained).toBe(10);
    expect(state.vitals.mana).toBe(60);
    expect(state.inventory[9]).toBeNull();

    // Com mana cheia, não desperdiça poção
    state.inventory[9] = { itemId: 'pocao_mana_menor', quantity: 1 };
    const useFull = inv.consumeRestoreItem(9);
    expect(useFull.ok).toBe(false);
    expect(state.inventory[9]).toEqual({ itemId: 'pocao_mana_menor', quantity: 1 });
  });
});

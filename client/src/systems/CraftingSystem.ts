import type { GameStateSnapshot } from '@shared/types';
import { getRecipeById, type RecipeDefinition } from '../data/recipes';
import { InventorySystem } from './InventorySystem';

export class CraftingSystem {
  constructor(
    private state: GameStateSnapshot,
    private inventory: InventorySystem
  ) {}

  canCraft(recipe: RecipeDefinition): { ok: boolean; reason?: string } {
    if (recipe.requiredFlag && !this.state.flags[recipe.requiredFlag]) {
      return {
        ok: false,
        reason: 'Receita ensinada apenas ao atingir Afinidade 50 com o morador correspondente!',
      };
    }

    const minDragons = recipe.minMiniDragons ?? (recipe.requiresMiniDragon ? 1 : 0);
    if (minDragons > 0 && this.state.miniDragonsCount < minDragons) {
      return {
        ok: false,
        reason: `Requer ${minDragons} Mini-Dragão(ões) chocado(s) para aquecer a fornalha!`,
      };
    }

    for (const ing of recipe.ingredients) {
      if (!this.inventory.hasItem(ing.itemId, ing.quantity)) {
        return { ok: false, reason: 'Ingredientes insuficientes.' };
      }
    }

    return { ok: true };
  }

  craft(recipeId: string): { ok: boolean; message: string } {
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      return { ok: false, message: 'Receita não encontrada.' };
    }

    const check = this.canCraft(recipe);
    if (!check.ok) {
      return { ok: false, message: check.reason ?? 'Não é possível fabricar.' };
    }

    for (const ing of recipe.ingredients) {
      this.inventory.removeItem(ing.itemId, ing.quantity);
    }

    const leftover = this.inventory.addItem(recipe.outputItemId, recipe.outputQuantity);
    if (leftover > 0) {
      // Devolve ingredientes se mochila estiver cheia
      for (const ing of recipe.ingredients) {
        this.inventory.addItem(ing.itemId, ing.quantity);
      }
      return { ok: false, message: 'Mochila cheia!' };
    }

    if (recipe.outputItemId === 'liga_estelar') {
      this.state.flags.forged_liga_estelar = true;
    }

    return { ok: true, message: `Fabricou ${recipe.outputQuantity}x ${recipe.name}!` };
  }
}


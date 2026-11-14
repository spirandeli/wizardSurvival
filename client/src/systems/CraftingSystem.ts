import type { ForgeJob, GameStateSnapshot } from '@shared/types';
import { getRecipeById, type RecipeDefinition } from '../data/recipes';
import { InventorySystem } from './InventorySystem';

export interface ForgeTileCoord {
  tileX: number;
  tileY: number;
}

export interface CraftResult {
  ok: boolean;
  message: string;
  startedForgeJob?: ForgeJob;
}

export class CraftingSystem {
  constructor(
    private state: GameStateSnapshot,
    private inventory: InventorySystem
  ) {
    if (!this.state.forgeJobs) {
      this.state.forgeJobs = [];
    }
  }

  getForgeJobs(): ForgeJob[] {
    if (!this.state.forgeJobs) {
      this.state.forgeJobs = [];
    }
    return this.state.forgeJobs;
  }

  getForgeJobAt(tileX: number, tileY: number): ForgeJob | undefined {
    return this.getForgeJobs().find((job) => job.tileX === tileX && job.tileY === tileY);
  }

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

  craft(recipeId: string, forgeTile?: ForgeTileCoord): CraftResult {
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      return { ok: false, message: 'Receita não encontrada.' };
    }

    if (recipe.station === 'fundicao') {
      if (!forgeTile) {
        return {
          ok: false,
          message: 'Use a Bancada de Fundição [E] para forjar esta receita!',
        };
      }
      return this.startForgeJob(recipeId, forgeTile);
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
      const added = recipe.outputQuantity - leftover;
      if (added > 0) {
        this.inventory.removeItem(recipe.outputItemId, added);
      }
      // Devolve ingredientes se mochila estiver cheia
      for (const ing of recipe.ingredients) {
        this.inventory.addItem(ing.itemId, ing.quantity);
      }
      return { ok: false, message: 'Mochila cheia!' };
    }

    return { ok: true, message: `Fabricou ${recipe.outputQuantity}x ${recipe.name}!` };
  }

  startForgeJob(recipeId: string, forgeTile: ForgeTileCoord): CraftResult {
    const recipe = getRecipeById(recipeId);
    if (!recipe || recipe.station !== 'fundicao') {
      return { ok: false, message: 'Receita de fundição inválida.' };
    }

    const existing = this.getForgeJobAt(forgeTile.tileX, forgeTile.tileY);
    if (existing) {
      if (existing.status === 'ready') {
        return {
          ok: false,
          message: 'Colete o item pronto na Bancada de Fundição [E] antes de iniciar outra forja!',
        };
      }
      const secs = Math.ceil(existing.remainingMs / 1000);
      return {
        ok: false,
        message: `Esta Bancada de Fundição já está em uso (${secs}s restantes).`,
      };
    }

    const check = this.canCraft(recipe);
    if (!check.ok) {
      return { ok: false, message: check.reason ?? 'Não é possível forjar.' };
    }

    for (const ing of recipe.ingredients) {
      this.inventory.removeItem(ing.itemId, ing.quantity);
    }

    const totalDurationMs = recipe.forgeDurationMs ?? 8000;
    const job: ForgeJob = {
      id: `forge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      recipeId: recipe.id,
      outputItemId: recipe.outputItemId,
      outputQuantity: recipe.outputQuantity,
      tileX: forgeTile.tileX,
      tileY: forgeTile.tileY,
      totalDurationMs,
      remainingMs: totalDurationMs,
      status: 'forging',
    };

    this.getForgeJobs().push(job);
    const secs = Math.round(totalDurationMs / 1000);
    return {
      ok: true,
      message: `Mini-Dragão foi aquecer a forja para produzir ${recipe.outputQuantity}x ${recipe.name} (${secs}s)!`,
      startedForgeJob: job,
    };
  }

  tickForgeJobs(deltaMs: number): ForgeJob[] {
    if (deltaMs <= 0) return [];
    const completed: ForgeJob[] = [];
    for (const job of this.getForgeJobs()) {
      if (job.status !== 'forging') continue;
      job.remainingMs = Math.max(0, job.remainingMs - deltaMs);
      if (job.remainingMs === 0) {
        job.status = 'ready';
        if (job.outputItemId === 'liga_estelar') {
          this.state.flags.forged_liga_estelar = true;
        }
        completed.push(job);
      }
    }
    return completed;
  }

  completeAllForgeJobs(): ForgeJob[] {
    const completed: ForgeJob[] = [];
    for (const job of this.getForgeJobs()) {
      if (job.status !== 'forging') continue;
      job.remainingMs = 0;
      job.status = 'ready';
      if (job.outputItemId === 'liga_estelar') {
        this.state.flags.forged_liga_estelar = true;
      }
      completed.push(job);
    }
    return completed;
  }

  collectReadyForgeJob(tileX: number, tileY: number): { ok: boolean; message: string; job?: ForgeJob } {
    const jobs = this.getForgeJobs();
    const idx = jobs.findIndex(
      (job) => job.tileX === tileX && job.tileY === tileY && job.status === 'ready'
    );
    if (idx === -1) {
      return { ok: false, message: 'Nenhum item pronto nesta bancada.' };
    }

    const job = jobs[idx]!;
    const leftover = this.inventory.addItem(job.outputItemId, job.outputQuantity);
    if (leftover > 0) {
      const added = job.outputQuantity - leftover;
      if (added > 0) {
        this.inventory.removeItem(job.outputItemId, added);
      }
      return { ok: false, message: 'Mochila cheia! Libere espaço para coletar da forja.' };
    }

    jobs.splice(idx, 1);
    const recipe = getRecipeById(job.recipeId);
    const label = recipe?.name ?? job.outputItemId;
    return {
      ok: true,
      message: `Coletou ${job.outputQuantity}x ${label} da Bancada de Fundição!`,
      job,
    };
  }
}


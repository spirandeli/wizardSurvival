import Phaser from 'phaser';
import type { GameStateSnapshot, GameTimeSnapshot, PlayerVitals, UserPublic } from '@shared/types';
import type { SfxKind, StepSurface } from '../systems/AudioSystem';

export type DialogueMood = 'normal' | 'alegre' | 'misterio' | 'alerta' | 'ironia';

export interface DialogueChoice {
  label: string;
  tag?: string;
  nextTurns?: DialogueTurn[];
  onSelect?: () => void;
}

export interface DialogueTurn {
  speaker: string;
  title?: string;
  portraitColor?: string;
  mood?: DialogueMood;
  text: string;
  choices?: DialogueChoice[];
}

export interface DialoguePayload {
  speaker?: string;
  title?: string;
  portraitColor?: string;
  lines?: string[];
  turns?: DialogueTurn[];
  onComplete?: () => void;
}

export interface GameEvents {
  AUTH_AUTHENTICATED: { user: UserPublic; save: GameStateSnapshot | null };
  AUTH_LOGGED_OUT: void;
  GAME_READY: { state: GameStateSnapshot };
  GAME_SAVED: { updatedAt: string };
  GAME_SAVE_ERROR: { message: string };
  MAP_CHANGED: { mapId: string; mapLabel: string };
  AUDIO_PLAY_SFX: { kind: SfxKind; surface?: StepSurface };
  TILE_INTERACT: { mapId: string; tileX: number; tileY: number };
  TIME_TICK: { time: GameTimeSnapshot };
  VITALS_UPDATED: { vitals: PlayerVitals };
  GOLD_UPDATED: { gold: number };
  INVENTORY_UPDATED: { selectedIndex: number };
  SELECT_HOTBAR_SLOT: { index: number };
  OPEN_INVENTORY_MODAL: {
    tab?: 'mochila' | 'criacao' | 'missoes' | 'moradores' | 'grimorio' | 'compendio';
    station?: 'manual' | 'fundicao';
    forgeTile?: { tileX: number; tileY: number };
  };
  OPEN_TELEPORT_MODAL: void;
  OPEN_QUEST_MODAL: void;
  PIN_QUEST: { questId?: string };
  OPEN_SHOP_MODAL: { shopId: 'botica' | 'ferraria' | 'pub' };
  OPEN_ENCHANTMENT_MODAL: void;
  OPEN_BULLETIN_BOARD_MODAL: void;
  OPEN_FISHING_MODAL: { isNightOrEvening: boolean };
  OPEN_HOUSE_UPGRADE_MODAL: void;
  QUESTS_UPDATED: void;
  CAST_TELEPORT: { targetMap: string };
  CAST_SPELL: { spellId: string };
  OPEN_DIALOGUE: DialoguePayload;
  CLOSE_DIALOGUE: void;
  CRAFT_ITEM: { recipeId: string; forgeTile?: { tileX: number; tileY: number } };
  FORGE_UPDATED: void;
  EQUIP_ITEM: { itemId: string; fromSlot?: number };
  UNEQUIP_ITEM: { slot: 'weapon' | 'armor' };
  SWAP_INVENTORY_SLOTS: { fromIndex: number; toIndex: number };
  USE_INVENTORY_SLOT: { slotIndex: number };
  SHOW_TOAST: { message: string; kind?: 'info' | 'success' | 'error' };
}

class TypedEventBus {
  private emitter = new Phaser.Events.EventEmitter();

  on<K extends keyof GameEvents>(
    event: K,
    listener: (payload: GameEvents[K]) => void,
    context?: unknown
  ): void {
    this.emitter.on(event, listener, context);
  }

  off<K extends keyof GameEvents>(
    event: K,
    listener: (payload: GameEvents[K]) => void,
    context?: unknown
  ): void {
    this.emitter.off(event, listener, context);
  }

  emit<K extends keyof GameEvents>(
    event: K,
    ...args: GameEvents[K] extends void ? [] : [GameEvents[K]]
  ): void {
    this.emitter.emit(event, ...args);
  }
}

export const EventBus = new TypedEventBus();

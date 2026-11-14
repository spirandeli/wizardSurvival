import Phaser from 'phaser';
import { EventBus } from './core/EventBus';
import { createInitialGameState, gameState } from './core/GameState';
import { SaveManager } from './core/SaveManager';
import { BootScene } from './scenes/BootScene';
import { DaySummaryScene } from './scenes/DaySummaryScene';
import { DungeonScene } from './scenes/DungeonScene';
import { WorldScene } from './scenes/WorldScene';
import { audioSystem } from './systems/AudioSystem';
import { AuthScreen } from './ui/AuthScreen';
import { BulletinBoardModal } from './ui/BulletinBoardModal';
import { DialogueBox } from './ui/DialogueBox';
import { EnchantmentModal } from './ui/EnchantmentModal';
import { FishingModal } from './ui/FishingModal';
import { HotbarUI } from './ui/HotbarUI';
import { HouseUpgradeModal } from './ui/HouseUpgradeModal';
import { HUD } from './ui/HUD';
import { InventoryModal } from './ui/InventoryModal';
import { probeItemIconSheet } from './ui/ItemIcon';
import { QuestLogModal } from './ui/QuestLogModal';
import { ShopModal } from './ui/ShopModal';
import { TeleportModal } from './ui/TeleportModal';
import { probeUiIconSheet, UI_SVG } from './ui/UiIcons';

let gameInstance: Phaser.Game | null = null;
let toastTimer: number | null = null;

function showToast(
  uiLayer: HTMLElement,
  message: string,
  kind: 'info' | 'success' | 'error' = 'info'
): void {
  let toast = uiLayer.querySelector<HTMLElement>('#game-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'game-toast';
    toast.className = 'game-toast';
    uiLayer.appendChild(toast);
  }
  toast.textContent = message;
  toast.dataset.kind = kind;
  toast.classList.add('visible');

  if (toastTimer !== null) {
    window.clearTimeout(toastTimer);
  }
  toastTimer = window.setTimeout(() => {
    toast?.classList.remove('visible');
  }, 3000);
}

function mountSessionControls(uiLayer: HTMLElement, email: string): HTMLElement {
  const bar = document.createElement('div');
  bar.id = 'session-bar';
  bar.className = 'session-bar ui-interactive';
  bar.innerHTML = `
    <span id="location-badge" class="location-badge">Fazenda da Névoa</span>
    <span class="session-user">✦ ${email}</span>
    <button type="button" id="btn-mute" class="session-btn secondary" title="Alternar Áudio">
      ${UI_SVG.soundOn}<span>Som</span>
    </button>
    <button type="button" id="btn-manual-save" class="session-btn" title="Salvar Progresso">
      ${UI_SVG.save}<span>Salvar</span>
    </button>
    <button type="button" id="btn-logout" class="session-btn secondary">Sair</button>
  `;
  uiLayer.appendChild(bar);

  const muteBtn = bar.querySelector<HTMLButtonElement>('#btn-mute');
  muteBtn?.addEventListener('click', () => {
    audioSystem.unlock();
    const muted = audioSystem.toggleMute();
    muteBtn.innerHTML = muted ? `${UI_SVG.soundOff}<span>Mudo</span>` : `${UI_SVG.soundOn}<span>Som</span>`;
  });

  bar.querySelector<HTMLButtonElement>('#btn-manual-save')?.addEventListener('click', () => {
    void SaveManager.saveGame(gameState.getState())
      .then(() => showToast(uiLayer, 'Progresso salvo na sua conta!', 'success'))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
        showToast(uiLayer, msg, 'error');
      });
  });

  bar.querySelector<HTMLButtonElement>('#btn-logout')?.addEventListener('click', () => {
    void SaveManager.logout();
  });

  return bar;
}

function startPhaser(): void {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }

  gameInstance = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1024,
    height: 640,
    backgroundColor: '#14121d',
    pixelArt: true,
    roundPixels: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, WorldScene, DungeonScene, DaySummaryScene],
  });
}

const AUTO_SAVE_INTERVAL_MS = 120_000;

function bootstrap(): void {
  const uiLayer = document.getElementById('ui-layer');
  if (!uiLayer) {
    throw new Error('#ui-layer não encontrado no DOM.');
  }

  const authScreen = new AuthScreen(uiLayer);
  let sessionBar: HTMLElement | null = null;
  let hud: HUD | null = null;
  let hotbar: HotbarUI | null = null;
  let invModal: InventoryModal | null = null;
  let tpModal: TeleportModal | null = null;
  let questModal: QuestLogModal | null = null;
  let shopModal: ShopModal | null = null;
  let enchantModal: EnchantmentModal | null = null;
  let bulletinModal: BulletinBoardModal | null = null;
  let fishingModal: FishingModal | null = null;
  let houseUpgradeModal: HouseUpgradeModal | null = null;
  let dialogueBox: DialogueBox | null = null;
  let autoSaveTimer: number | null = null;
  let isAutoSaving = false;

  const unmountGameUi = () => {
    if (autoSaveTimer !== null) {
      window.clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
    isAutoSaving = false;
    sessionBar?.remove();
    sessionBar = null;
    hud?.destroy();
    hud = null;
    hotbar?.destroy();
    hotbar = null;
    invModal?.destroy();
    invModal = null;
    tpModal?.destroy();
    tpModal = null;
    questModal?.destroy();
    questModal = null;
    shopModal?.destroy();
    shopModal = null;
    enchantModal?.destroy();
    enchantModal = null;
    bulletinModal?.destroy();
    bulletinModal = null;
    fishingModal?.destroy();
    fishingModal = null;
    houseUpgradeModal?.destroy();
    houseUpgradeModal = null;
    dialogueBox?.destroy();
    dialogueBox = null;
  };

  window.addEventListener('keydown', (ev) => {
    if (fishingModal?.isVisible()) {
      if (ev.code === 'Space' || ev.code === 'Enter') {
        ev.preventDefault();
        fishingModal.tryStrike();
        return;
      }
      if (ev.code === 'Escape') {
        ev.preventDefault();
        fishingModal.close();
        return;
      }
    }
    if (dialogueBox?.isVisible()) {
      if (dialogueBox.hasChoicesVisible()) {
        if (ev.code === 'Digit1' || ev.code === 'Numpad1') {
          ev.preventDefault();
          dialogueBox.selectChoice(0);
          return;
        }
        if (ev.code === 'Digit2' || ev.code === 'Numpad2') {
          ev.preventDefault();
          dialogueBox.selectChoice(1);
          return;
        }
        if (ev.code === 'Digit3' || ev.code === 'Numpad3') {
          ev.preventDefault();
          dialogueBox.selectChoice(2);
          return;
        }
      }
      if (ev.code === 'Space' || ev.code === 'Enter' || ev.code === 'KeyE') {
        ev.preventDefault();
        dialogueBox.advance();
        return;
      }
    }
    if (ev.code === 'Escape') {
      dialogueBox?.close();
      invModal?.close();
      tpModal?.close();
      questModal?.close();
      shopModal?.close();
      enchantModal?.close();
      bulletinModal?.close();
      fishingModal?.close();
      houseUpgradeModal?.close();
    }
  });

  EventBus.on('SHOW_TOAST', ({ message, kind }) => {
    showToast(uiLayer, message, kind);
  });

  EventBus.on('MAP_CHANGED', ({ mapLabel }) => {
    const badge = uiLayer.querySelector<HTMLElement>('#location-badge');
    if (badge) {
      badge.textContent = mapLabel;
    }
  });

  EventBus.on('AUTH_AUTHENTICATED', ({ user, save }) => {
    gameState.replaceState(save ?? createInitialGameState());
    unmountGameUi();
    sessionBar = mountSessionControls(uiLayer, user.email);
    hud = new HUD(uiLayer);
    hotbar = new HotbarUI(uiLayer);
    invModal = new InventoryModal(uiLayer);
    tpModal = new TeleportModal(uiLayer);
    questModal = new QuestLogModal(uiLayer);
    shopModal = new ShopModal(uiLayer);
    enchantModal = new EnchantmentModal(uiLayer);
    bulletinModal = new BulletinBoardModal(uiLayer);
    fishingModal = new FishingModal(uiLayer);
    houseUpgradeModal = new HouseUpgradeModal(uiLayer);
    dialogueBox = new DialogueBox(uiLayer);
    probeItemIconSheet(() => {
      EventBus.emit('INVENTORY_UPDATED', {
        selectedIndex: gameState.getState().selectedHotbarIndex,
      });
    });
    probeUiIconSheet(() => {
      EventBus.emit('VITALS_UPDATED', { vitals: gameState.getState().vitals });
      EventBus.emit('INVENTORY_UPDATED', {
        selectedIndex: gameState.getState().selectedHotbarIndex,
      });
    });
    startPhaser();
    autoSaveTimer = window.setInterval(() => {
      if (isAutoSaving || !gameInstance) return;
      isAutoSaving = true;
      void SaveManager.saveGame(gameState.getState())
        .then(() => {
          showToast(uiLayer, 'Salvamento automático concluído.', 'info');
        })
        .catch(() => {
          // Falhas transitórias de salvamento automático não devem interromper a partida.
        })
        .finally(() => {
          isAutoSaving = false;
        });
    }, AUTO_SAVE_INTERVAL_MS);
  });

  EventBus.on('AUTH_LOGGED_OUT', () => {
    unmountGameUi();
    if (gameInstance) {
      gameInstance.destroy(true);
      gameInstance = null;
    }
    authScreen.show();
  });

  void authScreen.init();
}

bootstrap();

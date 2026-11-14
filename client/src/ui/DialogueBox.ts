import {
  EventBus,
  type DialogueChoice,
  type DialoguePayload,
  type DialogueTurn,
} from '../core/EventBus';

const TYPEWRITER_INTERVAL_MS = 16;

function resolveSpeakerPortraitUrl(
  speaker: string,
  mood: NonNullable<DialogueTurn['mood']>
): string | null {
  const normalized = speaker
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (normalized.startsWith('celeste')) {
    const id = mood === 'alerta' || mood === 'misterio' ? 'celeste_surpresa' : 'celeste';
    return `/assets/portraits/${id}.png`;
  }
  if (normalized.startsWith('rafael')) {
    const id = mood === 'alegre' ? 'rafael_alegre' : 'rafael';
    return `/assets/portraits/${id}.png`;
  }
  if (normalized.startsWith('tome')) {
    const id =
      mood === 'alegre'
        ? 'tome_alegre'
        : mood === 'alerta' || mood === 'misterio'
        ? 'tome_determinado'
        : 'tome';
    return `/assets/portraits/${id}.png`;
  }
  if (normalized.startsWith('bento')) {
    return `/assets/portraits/${mood === 'alegre' ? 'bento_sorrindo' : 'bento'}.png`;
  }
  if (normalized.startsWith('isis')) {
    return `/assets/portraits/${mood === 'misterio' || mood === 'alerta' ? 'isis_mistica' : 'isis'}.png`;
  }
  if (normalized.startsWith('lyra')) {
    return `/assets/portraits/${mood === 'alegre' ? 'lyra_alegre' : 'lyra'}.png`;
  }
  if (normalized.includes('zeca')) {
    return `/assets/portraits/${mood === 'alegre' || mood === 'ironia' ? 'seu_zeca_rindo' : 'seu_zeca'}.png`;
  }
  if (normalized.includes('arlindo')) {
    return `/assets/portraits/${
      mood === 'alerta' || mood === 'misterio' ? 'prefeito_arlindo_preocupado' : 'prefeito_arlindo'
    }.png`;
  }
  if (normalized.includes('damiao')) {
    return `/assets/portraits/${mood === 'alerta' || mood === 'misterio' ? 'seu_damiao_firme' : 'seu_damiao'}.png`;
  }
  if (normalized.startsWith('remo')) {
    return `/assets/portraits/${mood === 'alegre' ? 'remo_busto' : 'remo'}.png`;
  }
  if (normalized.startsWith('lupin')) {
    return `/assets/portraits/${mood === 'alegre' ? 'lupin_busto' : 'lupin'}.png`;
  }
  if (normalized.includes('guardiao da terra')) return '/assets/portraits/guardiao_terra.png';
  if (normalized.includes('guardiao das aguas')) return '/assets/portraits/guardiao_aguas.png';
  if (normalized.includes('guardiao dos ceus')) return '/assets/portraits/guardiao_ceus.png';
  return null;
}

export class DialogueBox {
  private root: HTMLElement;
  private turns: DialogueTurn[] = [];
  private turnIndex = 0;
  private onCompleteCb?: () => void;
  private isOpen = false;
  private revealedChars = 0;
  private typingTimer: number | null = null;
  private onOpenHandler: (payload: DialoguePayload) => void;
  private onCloseHandler: () => void;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'dialogue-box';
    this.root.className = 'dialogue-overlay ui-interactive';
    this.root.style.display = 'none';
    parent.appendChild(this.root);

    this.onOpenHandler = (payload) => {
      this.openPayload(payload);
    };

    this.onCloseHandler = () => {
      this.close(false);
    };

    EventBus.on('OPEN_DIALOGUE', this.onOpenHandler);
    EventBus.on('CLOSE_DIALOGUE', this.onCloseHandler);
  }

  isVisible(): boolean {
    return this.isOpen;
  }

  hasChoicesVisible(): boolean {
    const turn = this.turns[this.turnIndex];
    if (!turn?.choices || turn.choices.length === 0) return false;
    return this.revealedChars >= turn.text.length;
  }

  advance(): void {
    if (!this.isOpen) return;
    const turn = this.turns[this.turnIndex];
    if (!turn) {
      this.finishAndClose();
      return;
    }

    if (this.revealedChars < turn.text.length) {
      this.finishTyping();
      return;
    }

    if (turn.choices && turn.choices.length > 0) {
      return;
    }

    if (this.turnIndex < this.turns.length - 1) {
      this.turnIndex += 1;
      this.startTypingCurrentTurn();
    } else {
      this.finishAndClose();
    }
  }

  selectChoice(index: number): void {
    if (!this.isOpen) return;
    const turn = this.turns[this.turnIndex];
    if (!turn?.choices || this.revealedChars < turn.text.length) return;
    const choice: DialogueChoice | undefined = turn.choices[index];
    if (!choice) return;

    EventBus.emit('AUDIO_PLAY_SFX', { kind: 'interact' });
    choice.onSelect?.();

    if (choice.nextTurns && choice.nextTurns.length > 0) {
      this.turns.splice(this.turnIndex + 1, 0, ...choice.nextTurns);
    }

    if (this.turnIndex < this.turns.length - 1) {
      this.turnIndex += 1;
      this.startTypingCurrentTurn();
    } else {
      this.finishAndClose();
    }
  }

  close(emitEvent = true): void {
    this.stopTypingTimer();
    const wasOpen = this.isOpen || this.root.style.display !== 'none';
    this.isOpen = false;
    this.turns = [];
    this.turnIndex = 0;
    this.onCompleteCb = undefined;
    this.root.style.display = 'none';
    if (document.activeElement instanceof HTMLElement && this.root.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    if (emitEvent && wasOpen) {
      EventBus.emit('CLOSE_DIALOGUE');
    }
  }

  destroy(): void {
    EventBus.off('OPEN_DIALOGUE', this.onOpenHandler);
    EventBus.off('CLOSE_DIALOGUE', this.onCloseHandler);
    this.close(false);
    this.root.remove();
  }

  private openPayload(payload: DialoguePayload): void {
    this.stopTypingTimer();
    if (payload.turns && payload.turns.length > 0) {
      this.turns = payload.turns.map((t) => ({ ...t }));
    } else {
      const speaker = payload.speaker ?? 'Narrador';
      const lines = payload.lines && payload.lines.length > 0 ? payload.lines : ['...'];
      this.turns = lines.map((text) => ({
        speaker,
        title: payload.title,
        portraitColor: payload.portraitColor,
        text,
      }));
    }

    this.turnIndex = 0;
    this.onCompleteCb = payload.onComplete;
    this.isOpen = true;
    this.root.style.display = 'flex';
    this.startTypingCurrentTurn();
  }

  private finishAndClose(): void {
    const cb = this.onCompleteCb;
    this.close(true);
    cb?.();
  }

  private stopTypingTimer(): void {
    if (this.typingTimer !== null) {
      window.clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
  }

  private startTypingCurrentTurn(): void {
    this.stopTypingTimer();
    const turn = this.turns[this.turnIndex];
    if (!turn) return;
    this.revealedChars = 0;
    this.render();

    this.typingTimer = window.setInterval(() => {
      if (!this.isOpen) {
        this.stopTypingTimer();
        return;
      }
      const current = this.turns[this.turnIndex];
      if (!current) {
        this.stopTypingTimer();
        return;
      }
      this.revealedChars = Math.min(current.text.length, this.revealedChars + 2);
      this.updateTextAndFooter();
      if (this.revealedChars >= current.text.length) {
        this.stopTypingTimer();
      }
    }, TYPEWRITER_INTERVAL_MS);
  }

  private finishTyping(): void {
    this.stopTypingTimer();
    const turn = this.turns[this.turnIndex];
    if (!turn) return;
    this.revealedChars = turn.text.length;
    this.updateTextAndFooter();
  }

  private render(): void {
    const turn = this.turns[this.turnIndex];
    if (!turn) return;
    const color = turn.portraitColor ?? '#4deeea';
    const mood = turn.mood ?? 'normal';
    const moodLabels: Record<NonNullable<DialogueTurn['mood']>, string> = {
      normal: '',
      alegre: '✦ Animado',
      misterio: '◈ Misterioso',
      alerta: '⚠ Tenso',
      ironia: '≈ Irônico',
    };
    const moodBadge = moodLabels[mood]
      ? `<span class="dialogue-mood mood-${mood}">${moodLabels[mood]}</span>`
      : '';
    const progressText =
      this.turns.length > 1 ? `<span class="dialogue-step">${this.turnIndex + 1}/${this.turns.length}</span>` : '';

    const portraitUrl = resolveSpeakerPortraitUrl(turn.speaker, mood);
    const initials = turn.speaker.slice(0, 2).toUpperCase();
    const portraitMarkup = portraitUrl
      ? `<img class="dialogue-portrait-img" src="${portraitUrl}" alt="${turn.speaker}" /><span class="dialogue-portrait-fallback" style="display:none">${initials}</span>`
      : `<span class="dialogue-portrait-fallback">${initials}</span>`;

    this.root.innerHTML = `
      <div class="dialogue-card mood-${mood}" style="--speaker-accent: ${color}">
        <div class="dialogue-portrait" style="border-color: ${color}; color: ${color}">
          ${portraitMarkup}
        </div>
        <div class="dialogue-body">
          <div class="dialogue-header-row">
            <div class="dialogue-speaker">
              ${turn.speaker}
              ${turn.title ? `<span class="dialogue-title">— ${turn.title}</span>` : ''}
            </div>
            <div class="dialogue-meta-right">${moodBadge}${progressText}</div>
          </div>
          <p id="dialogue-text-el" class="dialogue-text"></p>
          <div id="dialogue-choices-el" class="dialogue-choices"></div>
          <div id="dialogue-footer-el" class="dialogue-footer"></div>
        </div>
      </div>
    `;

    const imgEl = this.root.querySelector('.dialogue-portrait-img') as HTMLImageElement | null;
    if (imgEl) {
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        const fallbackEl = imgEl.nextElementSibling as HTMLElement | null;
        if (fallbackEl) {
          fallbackEl.style.display = 'flex';
        }
      });
    }

    this.updateTextAndFooter();
  }

  private updateTextAndFooter(): void {
    const turn = this.turns[this.turnIndex];
    if (!turn) return;

    const textEl = this.root.querySelector<HTMLElement>('#dialogue-text-el');
    const choicesEl = this.root.querySelector<HTMLElement>('#dialogue-choices-el');
    const footerEl = this.root.querySelector<HTMLElement>('#dialogue-footer-el');
    if (!textEl || !choicesEl || !footerEl) return;

    const isDoneTyping = this.revealedChars >= turn.text.length;
    textEl.textContent = turn.text.slice(0, this.revealedChars);

    if (isDoneTyping && turn.choices && turn.choices.length > 0) {
      choicesEl.innerHTML = turn.choices
        .map(
          (c, idx) => `
            <button type="button" class="dialogue-choice-btn" data-choice-idx="${idx}">
              <span class="choice-key">[${idx + 1}]</span>
              <span class="choice-label">${c.label}</span>
              ${c.tag ? `<span class="choice-tag">${c.tag}</span>` : ''}
            </button>
          `
        )
        .join('');
      choicesEl.querySelectorAll<HTMLButtonElement>('.dialogue-choice-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.choiceIdx);
          if (!Number.isNaN(idx)) this.selectChoice(idx);
        });
      });
      footerEl.innerHTML = `<span class="dialogue-hint-keys">Escolha com [1–${turn.choices.length}] ou clique</span>`;
      return;
    }

    choicesEl.innerHTML = '';
    const isLast = this.turnIndex >= this.turns.length - 1;
    const btnLabel = !isDoneTyping
      ? 'Completar [E / Espaço]'
      : isLast
        ? 'Concluir [E / Espaço]'
        : 'Próximo ▸ [E / Espaço]';

    footerEl.innerHTML = `
      <button type="button" id="dialogue-next-btn" class="dialogue-next">${btnLabel}</button>
    `;
    footerEl.querySelector('#dialogue-next-btn')?.addEventListener('click', () => {
      this.advance();
    });
  }
}

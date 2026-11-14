import { EventBus } from '../core/EventBus';

export type SfxKind = 'step' | 'portal' | 'interact' | 'error' | 'farm' | 'magic' | 'craft';
export type StepSurface = 'grass' | 'stone' | 'wood' | 'water';

interface MusicTheme {
  notes: number[];
  tempoMs: number;
  waveform: OscillatorType;
  gain: number;
}

const MAP_THEMES: Record<string, MusicTheme> = {
  fazenda: {
    notes: [261.63, 329.63, 392.0, 493.88, 392.0, 329.63],
    tempoMs: 650,
    waveform: 'triangle',
    gain: 0.035,
  },
  casa: {
    notes: [293.66, 349.23, 440.0, 523.25],
    tempoMs: 750,
    waveform: 'sine',
    gain: 0.03,
  },
  porao: {
    notes: [196.0, 233.08, 293.66, 311.13, 293.66],
    tempoMs: 900,
    waveform: 'sine',
    gain: 0.04,
  },
  pub_pedra: {
    notes: [146.83, 174.61, 220.0, 261.63, 220.0, 196.0],
    tempoMs: 360,
    waveform: 'sawtooth',
    gain: 0.025,
  },
  cidade: {
    notes: [329.63, 392.0, 440.0, 493.88, 440.0, 392.0],
    tempoMs: 560,
    waveform: 'triangle',
    gain: 0.03,
  },
  ferraria: {
    notes: [196.0, 246.94, 293.66, 246.94],
    tempoMs: 480,
    waveform: 'square',
    gain: 0.02,
  },
  botica: {
    notes: [349.23, 440.0, 523.25, 587.33],
    tempoMs: 700,
    waveform: 'sine',
    gain: 0.03,
  },
  machu_picchu: {
    notes: [220.0, 261.63, 293.66, 329.63, 293.66],
    tempoMs: 520,
    waveform: 'triangle',
    gain: 0.035,
  },
  arena_terra: {
    notes: [164.81, 196.0, 220.0, 246.94, 220.0],
    tempoMs: 340,
    waveform: 'sawtooth',
    gain: 0.03,
  },
};

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private masterVolume = 0.6;
  private currentMapId: string | null = null;
  private bgmTimer: number | null = null;
  private noteIndex = 0;

  constructor() {
    EventBus.on('MAP_CHANGED', ({ mapId }) => {
      this.playMapTheme(mapId);
    });

    EventBus.on('AUDIO_PLAY_SFX', ({ kind, surface }) => {
      this.playSfx(kind, surface);
    });
  }

  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (this.currentMapId && this.bgmTimer === null) {
      this.startLoop();
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopLoop();
    } else if (this.currentMapId) {
      this.startLoop();
    }
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  playMapTheme(mapId: string): void {
    if (this.currentMapId === mapId && this.bgmTimer !== null) return;
    this.currentMapId = mapId;
    this.noteIndex = 0;
    this.stopLoop();
    if (!this.isMuted) {
      this.startLoop();
    }
  }

  playSfx(kind: SfxKind, surface: StepSurface = 'grass'): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    switch (kind) {
      case 'step': {
        if (surface === 'stone') {
          this.playTone(210, 0.035, 'triangle', 0.024);
        } else if (surface === 'wood') {
          this.playTone(155, 0.055, 'sine', 0.028);
        } else if (surface === 'water') {
          this.playTone(280, 0.06, 'sine', 0.025);
        } else {
          this.playTone(115, 0.045, 'triangle', 0.022);
        }
        break;
      }
      case 'interact':
        this.playTone(523.25, 0.09, 'sine', 0.05);
        break;
      case 'portal':
        this.playTone(392.0, 0.14, 'sine', 0.06);
        setTimeout(() => this.playTone(587.33, 0.18, 'triangle', 0.05), 80);
        break;
      case 'farm':
        this.playTone(220.0, 0.08, 'triangle', 0.045);
        break;
      case 'magic':
        this.playTone(587.33, 0.12, 'sine', 0.055);
        setTimeout(() => this.playTone(880.0, 0.16, 'sine', 0.045), 70);
        break;
      case 'craft':
        this.playTone(329.63, 0.08, 'square', 0.03);
        setTimeout(() => this.playTone(440.0, 0.1, 'triangle', 0.04), 70);
        break;
      case 'error':
        this.playTone(165, 0.14, 'sawtooth', 0.04);
        break;
    }
  }

  destroy(): void {
    this.stopLoop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }

  private startLoop(): void {
    if (typeof window === 'undefined' || !this.currentMapId) return;
    const theme = MAP_THEMES[this.currentMapId] ?? MAP_THEMES.fazenda;
    if (!theme) return;

    this.bgmTimer = window.setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
      const freq = theme.notes[this.noteIndex % theme.notes.length] ?? 261.63;
      this.playTone(freq, theme.tempoMs / 1200, theme.waveform, theme.gain);
      this.noteIndex += 1;
    }, theme.tempoMs);
  }

  private stopLoop(): void {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType,
    gainLevel: number
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const volume = gainLevel * this.masterVolume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }
}

export const audioSystem = new AudioSystem();


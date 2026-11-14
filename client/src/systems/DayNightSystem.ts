import Phaser from 'phaser';
import type { WeatherType } from '@shared/types';

interface NightLight {
  outer: Phaser.GameObjects.Arc;
  inner: Phaser.GameObjects.Arc;
  alwaysOn?: boolean;
}

export class DayNightSystem {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Rectangle;
  private lights: NightLight[] = [];
  private lastNightFactor = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    this.overlay = scene.add
      .rectangle(width / 2, height / 2, width * 2, height * 2, 0x16142e, 0)
      .setScrollFactor(0)
      .setDepth(4000);
  }

  registerLight(x: number, y: number, radius = 44, color = 0xf5b942, alwaysOn = false): void {
    const outer = this.scene.add
      .circle(x, y, radius, color, 0)
      .setDepth(4001)
      .setBlendMode(Phaser.BlendModes.ADD);
    const inner = this.scene.add
      .circle(x, y, Math.round(radius * 0.52), 0xfef08a, 0)
      .setDepth(4001)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.lights.push({ outer, inner, alwaysOn });
    this.applyLightIntensity(this.lastNightFactor);
  }

  clearLights(): void {
    for (const l of this.lights) {
      l.outer.destroy();
      l.inner.destroy();
    }
    this.lights = [];
  }

  private applyLightIntensity(nightFactor: number): void {
    for (const l of this.lights) {
      const f = l.alwaysOn ? Math.max(0.55, nightFactor) : nightFactor;
      l.outer.setFillStyle(l.outer.fillColor, 0.16 * f);
      l.inner.setFillStyle(l.inner.fillColor, 0.2 * f);
    }
  }

  updateLighting(mapId: string, minuteOfDay: number, weather: WeatherType): void {
    if (mapId === 'casa') {
      this.overlay.setFillStyle(0x1f192b, 0.08);
      this.lastNightFactor = 0.2;
      this.applyLightIntensity(this.lastNightFactor);
      return;
    }
    if (mapId === 'porao') {
      this.overlay.setFillStyle(0x0f0c1d, 0.28);
      this.lastNightFactor = 0.75;
      this.applyLightIntensity(this.lastNightFactor);
      return;
    }

    // Áreas externas: Fazenda / Cidade
    let color = 0x16142e;
    let alpha = 0;

    if (minuteOfDay >= 16 * 60 + 30 && minuteOfDay < 19 * 60) {
      const t = (minuteOfDay - (16 * 60 + 30)) / (2.5 * 60);
      color = 0x5c2d1e;
      alpha = 0.18 * t;
    } else if (minuteOfDay >= 19 * 60) {
      const t = Math.min(1, (minuteOfDay - 19 * 60) / (3 * 60));
      color = 0x13112b;
      alpha = 0.22 + 0.34 * t;
    }

    if (weather === 'Chuva') {
      alpha = Math.min(0.62, alpha + 0.14);
    } else if (weather === 'Neblina') {
      alpha = Math.min(0.58, alpha + 0.08);
    }

    this.overlay.setFillStyle(color, alpha);
    this.lastNightFactor = Math.min(1, alpha / 0.45);
    this.applyLightIntensity(this.lastNightFactor);
  }
}


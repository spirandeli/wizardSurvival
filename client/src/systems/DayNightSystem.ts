import Phaser from 'phaser';
import type { WeatherType } from '@shared/types';

export class DayNightSystem {
  private overlay: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale;
    this.overlay = scene.add
      .rectangle(width / 2, height / 2, width * 2, height * 2, 0x16142e, 0)
      .setScrollFactor(0)
      .setDepth(4000);
  }

  updateLighting(mapId: string, minuteOfDay: number, weather: WeatherType): void {
    if (mapId === 'casa') {
      this.overlay.setFillStyle(0x1f192b, 0.08);
      return;
    }
    if (mapId === 'porao') {
      this.overlay.setFillStyle(0x0f0c1d, 0.28);
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
  }
}


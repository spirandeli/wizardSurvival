import type { MoonPhase, WeatherType } from '@shared/types';

export interface FishRollOptions {
  isNightOrEvening: boolean;
  weather: WeatherType;
  moonPhase: MoonPhase;
  usingUnicornMilkBait: boolean;
  rng?: () => number;
}

export function rollFishCatch(opts: FishRollOptions): string {
  const r = (opts.rng ?? Math.random)();
  const baitBonus = opts.usingUnicornMilkBait ? 0.24 : 0;
  const moonBonus = opts.moonPhase === 'Cheia' ? 0.14 : 0;
  const nightBonus = opts.isNightOrEvening ? 0.18 : 0;
  const rainBonus = opts.weather === 'Chuva' ? 0.12 : 0;

  const prismaThreshold = Math.min(0.62, 0.18 + baitBonus + nightBonus);
  if (r < prismaThreshold) return 'peixe_prisma';

  const bagreThreshold = prismaThreshold + Math.min(0.28, 0.1 + moonBonus + baitBonus * 0.5);
  if (r < bagreThreshold) return 'bagre_telurico';

  const lambariThreshold = bagreThreshold + Math.min(0.32, 0.18 + rainBonus);
  if (r < lambariThreshold) return 'lambari_quartzo';

  return 'truta_nevoa';
}


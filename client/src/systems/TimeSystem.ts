import type { GameTimeSnapshot, MoonPhase, Season, WeatherType } from '@shared/types';
import { END_MINUTE_OF_DAY, START_MINUTE_OF_DAY } from '../config/gameConfig';

const SEASONS: Season[] = ['Primavera', 'Verão', 'Outono', 'Inverno'];
const WEATHERS: WeatherType[] = ['Ensolarado', 'Nublado', 'Neblina', 'Chuva'];
export const DAYS_PER_SEASON = 28;
export const MS_PER_10_MINUTES = 7000;

export function getMoonPhaseForDay(day: number): MoonPhase {
  const normalized = ((day - 1) % DAYS_PER_SEASON) + 1;
  if (normalized <= 7) return 'Nova';
  if (normalized <= 14) return 'Crescente';
  if (normalized <= 21) return 'Cheia';
  return 'Minguante';
}

export function formatGameTime(minuteOfDay: number): string {
  const normalizedHour = Math.floor(minuteOfDay / 60) % 24;
  const minute = minuteOfDay % 60;
  return `${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export class TimeSystem {
  private accumulatorMs = 0;

  constructor(private timeState: GameTimeSnapshot) {}

  getSnapshot(): GameTimeSnapshot {
    return this.timeState;
  }

  tick(deltaMs: number): { timeChanged: boolean; exhausted: boolean } {
    this.accumulatorMs += deltaMs;
    let timeChanged = false;

    while (this.accumulatorMs >= MS_PER_10_MINUTES) {
      this.accumulatorMs -= MS_PER_10_MINUTES;
      if (this.timeState.minuteOfDay < END_MINUTE_OF_DAY) {
        this.timeState.minuteOfDay += 10;
        timeChanged = true;
      }
    }

    return {
      timeChanged,
      exhausted: this.timeState.minuteOfDay >= END_MINUTE_OF_DAY,
    };
  }

  advanceDay(nextWeatherRoll?: WeatherType): GameTimeSnapshot {
    this.accumulatorMs = 0;
    this.timeState.minuteOfDay = START_MINUTE_OF_DAY;
    this.timeState.day += 1;

    if (this.timeState.day > DAYS_PER_SEASON) {
      this.timeState.day = 1;
      const currentIdx = SEASONS.indexOf(this.timeState.season);
      const nextIdx = (currentIdx + 1) % SEASONS.length;
      const nextSeason = SEASONS[nextIdx] ?? 'Primavera';
      this.timeState.season = nextSeason;
      if (nextIdx === 0) {
        this.timeState.year += 1;
      }
    }

    this.timeState.moonPhase = getMoonPhaseForDay(this.timeState.day);
    this.timeState.weather = this.timeState.nextDayWeather;
    this.timeState.nextDayWeather =
      nextWeatherRoll ?? WEATHERS[(this.timeState.day + this.timeState.year) % WEATHERS.length] ?? 'Ensolarado';

    return this.timeState;
  }
}


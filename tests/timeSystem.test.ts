import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../client/src/core/GameState.js';
import {
  formatGameTime,
  getMoonPhaseForDay,
  MS_PER_10_MINUTES,
  TimeSystem,
} from '../client/src/systems/TimeSystem.js';

describe('TimeSystem e Ciclo Lunar', () => {
  it('avança relógio em blocos de 10 minutos até o limite de 02:00', () => {
    const state = createInitialGameState();
    const timeSys = new TimeSystem(state.time);

    expect(formatGameTime(state.time.minuteOfDay)).toBe('06:00');

    const res = timeSys.tick(MS_PER_10_MINUTES * 3);
    expect(res.timeChanged).toBe(true);
    expect(res.exhausted).toBe(false);
    expect(formatGameTime(state.time.minuteOfDay)).toBe('06:30');

    // Simula passagem até 02:00 (20 horas = 120 blocos de 10 min)
    const endRes = timeSys.tick(MS_PER_10_MINUTES * 120);
    expect(endRes.exhausted).toBe(true);
  });

  it('calcula corretamente as 4 fases da lua ao longo dos 28 dias', () => {
    expect(getMoonPhaseForDay(1)).toBe('Nova');
    expect(getMoonPhaseForDay(8)).toBe('Crescente');
    expect(getMoonPhaseForDay(15)).toBe('Cheia');
    expect(getMoonPhaseForDay(22)).toBe('Minguante');
    expect(getMoonPhaseForDay(28)).toBe('Minguante');
  });

  it('vira a estação após o dia 28 e atualiza ano/clima', () => {
    const state = createInitialGameState();
    state.time.day = 28;
    state.time.season = 'Inverno';
    state.time.nextDayWeather = 'Chuva';

    const timeSys = new TimeSystem(state.time);
    timeSys.advanceDay('Ensolarado');

    expect(state.time.day).toBe(1);
    expect(state.time.season).toBe('Primavera');
    expect(state.time.year).toBe(2);
    expect(state.time.moonPhase).toBe('Nova');
    expect(state.time.weather).toBe('Chuva');
  });
});


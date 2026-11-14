import type { GameStateSnapshot, SaveRecord, UserPublic } from '@shared/types';
import { EventBus } from './EventBus';

interface ApiErrorPayload {
  error?: string;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = (await response.json()) as T & ApiErrorPayload;
  if (!response.ok) {
    throw new Error(data.error ?? `Erro na requisição (${response.status})`);
  }
  return data;
}

export class SaveManager {
  static async getSession(): Promise<UserPublic | null> {
    try {
      const res = await requestJson<{ user: UserPublic }>('/api/auth/me', { method: 'GET' });
      return res.user;
    } catch {
      return null;
    }
  }

  static async register(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserPublic> {
    const res = await requestJson<{ user: UserPublic }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    return res.user;
  }

  static async login(email: string, password: string): Promise<UserPublic> {
    const res = await requestJson<{ user: UserPublic }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return res.user;
  }

  static async logout(): Promise<void> {
    await requestJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    EventBus.emit('AUTH_LOGGED_OUT');
  }

  static async loadSave(slot = 'principal'): Promise<SaveRecord | null> {
    const res = await requestJson<{ save: SaveRecord | null }>(
      `/api/save?slot=${encodeURIComponent(slot)}`,
      { method: 'GET' }
    );
    return res.save;
  }

  static async saveGame(state: GameStateSnapshot, slotName = 'principal'): Promise<SaveRecord> {
    const res = await requestJson<{ save: SaveRecord }>('/api/save', {
      method: 'PUT',
      body: JSON.stringify({ slotName, state }),
    });
    EventBus.emit('GAME_SAVED', { updatedAt: res.save.updatedAt });
    return res.save;
  }
}


import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../server/app.js';
import { createInitialGameState } from '../client/src/core/GameState.js';

function extractCookieHeader(setCookie: string | string[] | undefined): string {
  if (!setCookie) return '';
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return first ? first.split(';')[0] ?? '' : '';
}

describe('API de Autenticação e Save (SQLite)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const built = await buildApp({
      dbPath: ':memory:',
      sessionSecret: 'test-secret-key',
    });
    app = built.app;
  });

  afterEach(async () => {
    await app.close();
  });

  it('bloqueia acesso a /api/save sem autenticação', async () => {
    const getRes = await app.inject({ method: 'GET', url: '/api/save' });
    expect(getRes.statusCode).toBe(401);

    const putRes = await app.inject({
      method: 'PUT',
      url: '/api/save',
      payload: { state: createInitialGameState() },
    });
    expect(putRes.statusCode).toBe(401);
  });

  it('valida e-mail, senha e impede duplicidade de cadastro', async () => {
    const invalidEmail = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'invalido', password: 'segredo123' },
    });
    expect(invalidEmail.statusCode).toBe(400);

    const shortPwd = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'bruxo@saotome.com', password: '123' },
    });
    expect(shortPwd.statusCode).toBe(400);

    const ok = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'Bruxo@SaoTome.com', password: 'segredo123', displayName: 'Tomé' },
    });
    expect(ok.statusCode).toBe(201);
    expect(ok.json().user.email).toBe('bruxo@saotome.com');

    const dup = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'bruxo@saotome.com', password: 'segredo123' },
    });
    expect(dup.statusCode).toBe(409);
  });

  it('autentica, salva, recarrega e isola progresso entre contas distintas', async () => {
    const regA = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'a@saotome.com', password: 'passwordA' },
    });
    const cookieA = extractCookieHeader(regA.headers['set-cookie']);

    const meA = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: cookieA },
    });
    expect(meA.statusCode).toBe(200);
    expect(meA.json().user.email).toBe('a@saotome.com');

    const initialSave = await app.inject({
      method: 'GET',
      url: '/api/save',
      headers: { cookie: cookieA },
    });
    expect(initialSave.statusCode).toBe(200);
    expect(initialSave.json().save).toBeNull();

    const stateA = createInitialGameState();
    stateA.gold = 999;
    stateA.time.day = 5;

    const putRes = await app.inject({
      method: 'PUT',
      url: '/api/save',
      headers: { cookie: cookieA },
      payload: { state: stateA },
    });
    expect(putRes.statusCode).toBe(200);
    expect(putRes.json().save.state.gold).toBe(999);

    const regB = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'b@saotome.com', password: 'passwordB' },
    });
    const cookieB = extractCookieHeader(regB.headers['set-cookie']);

    const saveB = await app.inject({
      method: 'GET',
      url: '/api/save',
      headers: { cookie: cookieB },
    });
    expect(saveB.statusCode).toBe(200);
    expect(saveB.json().save).toBeNull();

    const logoutA = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie: cookieA },
    });
    expect(logoutA.statusCode).toBe(200);

    const loginA = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'a@saotome.com', password: 'passwordA' },
    });
    expect(loginA.statusCode).toBe(200);
    const newCookieA = extractCookieHeader(loginA.headers['set-cookie']);

    const reloadA = await app.inject({
      method: 'GET',
      url: '/api/save',
      headers: { cookie: newCookieA },
    });
    expect(reloadA.statusCode).toBe(200);
    expect(reloadA.json().save.state.gold).toBe(999);
    expect(reloadA.json().save.state.time.day).toBe(5);
  });
});


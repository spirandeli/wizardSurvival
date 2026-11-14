import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import type { GameStateSnapshot, SaveRecord, UserPublic } from '../shared/types.js';
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from './auth.js';
import { createDatabase, type SqliteDb } from './db.js';

export const SESSION_COOKIE_NAME = 'st_session';

export interface AppOptions {
  dbPath?: string;
  sessionSecret?: string;
}

interface UserRow {
  id: number;
  email: string;
  display_name: string;
  password_hash: string;
  created_at: string;
}

interface SaveRow {
  id: number;
  user_id: number;
  slot_name: string;
  version: number;
  state_json: string;
  updated_at: string;
}

interface AuthBody {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
}

interface SavePutBody {
  slotName?: unknown;
  state?: unknown;
}

function toUserPublic(row: UserRow): UserPublic {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

function isValidGameStateSnapshot(value: unknown): value is GameStateSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GameStateSnapshot>;
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.mapId === 'string' &&
    typeof candidate.playerX === 'number' &&
    typeof candidate.playerY === 'number' &&
    typeof candidate.gold === 'number' &&
    typeof candidate.vitals === 'object' &&
    candidate.vitals !== null &&
    typeof candidate.time === 'object' &&
    candidate.time !== null &&
    Array.isArray(candidate.inventory)
  );
}

function extractSessionUserId(request: FastifyRequest, secret: string): number | null {
  const cookieToken = request.cookies[SESSION_COOKIE_NAME];
  const authHeader = request.headers.authorization;
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : undefined;

  const token = cookieToken ?? bearerToken;
  if (!token) return null;

  const payload = verifySessionToken(token, secret);
  return payload ? payload.userId : null;
}

export async function buildApp(options: AppOptions = {}): Promise<{
  app: FastifyInstance;
  db: SqliteDb;
}> {
  const dbPath = options.dbPath ?? process.env.DB_PATH ?? 'data/sao_tome.db';
  const sessionSecret =
    options.sessionSecret ??
    process.env.SESSION_SECRET ??
    'dev-only-sao-tome-dos-numeros-secret';

  const db = createDatabase(dbPath);
  const app = Fastify({ logger: false });

  await app.register(cookie);

  app.addHook('onClose', async () => {
    db.close();
  });

  app.get('/api/health', async () => ({ ok: true }));

  app.post<{ Body: AuthBody }>('/api/auth/register', async (request, reply) => {
    const rawEmail = typeof request.body?.email === 'string' ? request.body.email : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const rawName = typeof request.body?.displayName === 'string' ? request.body.displayName.trim() : '';

    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      return reply.code(400).send({ error: 'Informe um endereço de e-mail válido.' });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
    if (existing) {
      return reply.code(409).send({ error: 'Já existe uma conta cadastrada com este e-mail.' });
    }

    const displayName = rawName.length > 0 ? rawName.slice(0, 40) : email.split('@')[0] ?? 'Bruxo';
    const passwordHash = hashPassword(password);

    const insertResult = db
      .prepare('INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)')
      .run(email, displayName, passwordHash);

    const userId = Number(insertResult.lastInsertRowid);
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow;

    const token = signSessionToken({ userId, email }, sessionSecret);
    reply.setCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return reply.code(201).send({ user: toUserPublic(userRow) });
  });

  app.post<{ Body: AuthBody }>('/api/auth/login', async (request, reply) => {
    const rawEmail = typeof request.body?.email === 'string' ? request.body.email : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const email = normalizeEmail(rawEmail);

    if (!isValidEmail(email) || password.length === 0) {
      return reply.code(400).send({ error: 'E-mail e senha são obrigatórios.' });
    }

    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    if (!userRow || !verifyPassword(password, userRow.password_hash)) {
      return reply.code(401).send({ error: 'E-mail ou senha inválidos.' });
    }

    const token = signSessionToken({ userId: userRow.id, email: userRow.email }, sessionSecret);
    reply.setCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return reply.code(200).send({ user: toUserPublic(userRow) });
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return { ok: true };
  });

  app.get('/api/auth/me', async (request, reply) => {
    const userId = extractSessionUserId(request, sessionSecret);
    if (!userId) {
      return reply.code(401).send({ error: 'Sessão não autenticada.' });
    }

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
    if (!userRow) {
      return reply.code(401).send({ error: 'Usuário não encontrado.' });
    }

    return { user: toUserPublic(userRow) };
  });

  app.get<{ Querystring: { slot?: string } }>('/api/save', async (request, reply) => {
    const userId = extractSessionUserId(request, sessionSecret);
    if (!userId) {
      return reply.code(401).send({ error: 'Faça login para carregar seu progresso.' });
    }

    const slotName =
      typeof request.query.slot === 'string' && request.query.slot.trim().length > 0
        ? request.query.slot.trim().slice(0, 32)
        : 'principal';

    const row = db
      .prepare('SELECT * FROM saves WHERE user_id = ? AND slot_name = ?')
      .get(userId, slotName) as SaveRow | undefined;

    if (!row) {
      return { save: null };
    }

    const save: SaveRecord = {
      id: row.id,
      userId: row.user_id,
      slotName: row.slot_name,
      version: row.version,
      state: JSON.parse(row.state_json) as GameStateSnapshot,
      updatedAt: row.updated_at,
    };

    return { save };
  });

  app.put<{ Body: SavePutBody }>('/api/save', async (request, reply) => {
    const userId = extractSessionUserId(request, sessionSecret);
    if (!userId) {
      return reply.code(401).send({ error: 'Faça login para salvar seu progresso.' });
    }

    const slotName =
      typeof request.body?.slotName === 'string' && request.body.slotName.trim().length > 0
        ? request.body.slotName.trim().slice(0, 32)
        : 'principal';

    const state = request.body?.state;
    if (!isValidGameStateSnapshot(state)) {
      return reply.code(400).send({ error: 'Dados de save inválidos.' });
    }

    const stateJson = JSON.stringify(state);
    db.prepare(
      `INSERT INTO saves (user_id, slot_name, version, state_json, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, slot_name) DO UPDATE SET
         version = excluded.version,
         state_json = excluded.state_json,
         updated_at = datetime('now')`
    ).run(userId, slotName, state.version, stateJson);

    const row = db
      .prepare('SELECT * FROM saves WHERE user_id = ? AND slot_name = ?')
      .get(userId, slotName) as SaveRow;

    const save: SaveRecord = {
      id: row.id,
      userId: row.user_id,
      slotName: row.slot_name,
      version: row.version,
      state,
      updatedAt: row.updated_at,
    };

    return { save };
  });

  return { app, db };
}


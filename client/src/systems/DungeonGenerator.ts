export type DungeonId = 'machu_picchu' | 'chapada' | 'varginha' | 'fortaleza_omena';

export const TOTAL_PROCEDURAL_FLOORS = 10;

export type DungeonEnemyKind =
  | 'golem_pedra'
  | 'espectro_ruina'
  | 'serpente_cristal'
  | 'sonda_ufologica'
  | 'sentinela_omena'
  | 'escaravelho_inca'
  | 'totem_condor'
  | 'colosso_granito'
  | 'lodo_quartzo'
  | 'morcego_estalactite'
  | 'salamandra_abissal'
  | 'drone_alfa'
  | 'androide_xenotecnico'
  | 'anomalia_magnetica'
  | 'sombra_errante'
  | 'arauto_abismo'
  | 'executor_omena';

export interface DungeonRoom {
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
}

export interface CrystalPuzzleNode {
  order: 1 | 2 | 3;
  tileX: number;
  tileY: number;
}

export interface EnemySpawnPoint {
  kind: DungeonEnemyKind;
  tileX: number;
  tileY: number;
}

export interface LoreTotemNode {
  tileX: number;
  tileY: number;
  loreId: string;
}

export interface DungeonFloorLayout {
  dungeonId: DungeonId;
  floorNumber: number;
  seed: number;
  width: number;
  height: number;
  groundGids: number[];
  collisionGids: number[];
  trapTiles: { tileX: number; tileY: number }[];
  oreTiles: { tileX: number; tileY: number }[];
  crystalNodes: CrystalPuzzleNode[];
  requiresCrystalPuzzle: boolean;
  enemySpawns: EnemySpawnPoint[];
  treasureChests: { tileX: number; tileY: number }[];
  loreTotems: LoreTotemNode[];
  healingFountains: { tileX: number; tileY: number }[];
  startTile: { tileX: number; tileY: number };
  exitTile: { tileX: number; tileY: number };
}

export const MACHU_GID = {
  FLOOR: 28,
  WALL: 29,
  TRAP: 30,
  ORE: 31,
  STAIRS: 32,
} as const;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isFloorReachable(
  layout: Pick<DungeonFloorLayout, 'width' | 'height' | 'collisionGids'>,
  from: { tileX: number; tileY: number },
  to: { tileX: number; tileY: number }
): boolean {
  const { width, height, collisionGids } = layout;
  const idx = (x: number, y: number) => y * width + x;
  if (collisionGids[idx(from.tileX, from.tileY)] !== 0) return false;
  if (collisionGids[idx(to.tileX, to.tileY)] !== 0) return false;

  const visited = new Uint8Array(width * height);
  const queue: [number, number][] = [[from.tileX, from.tileY]];
  visited[idx(from.tileX, from.tileY)] = 1;

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    const [cx, cy] = next;
    if (cx === to.tileX && cy === to.tileY) return true;

    const dirs: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const nIdx = idx(nx, ny);
      if (visited[nIdx] === 1) continue;
      if (collisionGids[nIdx] !== 0) continue;
      visited[nIdx] = 1;
      queue.push([nx, ny]);
    }
  }

  return false;
}

function pickEnemyKind(
  dungeonId: DungeonId,
  index: number,
  floorNumber: number
): DungeonEnemyKind {
  let pool: readonly DungeonEnemyKind[];
  if (dungeonId === 'chapada') {
    pool =
      floorNumber <= 3
        ? ['serpente_cristal', 'lodo_quartzo', 'espectro_ruina']
        : floorNumber <= 6
        ? ['lodo_quartzo', 'morcego_estalactite', 'serpente_cristal']
        : ['morcego_estalactite', 'salamandra_abissal', 'serpente_cristal', 'lodo_quartzo'];
  } else if (dungeonId === 'varginha') {
    pool =
      floorNumber <= 3
        ? ['sonda_ufologica', 'drone_alfa', 'espectro_ruina']
        : floorNumber <= 6
        ? ['drone_alfa', 'androide_xenotecnico', 'sonda_ufologica']
        : ['androide_xenotecnico', 'anomalia_magnetica', 'sonda_ufologica', 'drone_alfa'];
  } else if (dungeonId === 'fortaleza_omena') {
    pool =
      floorNumber <= 3
        ? ['sentinela_omena', 'sombra_errante', 'sonda_ufologica']
        : floorNumber <= 6
        ? ['sombra_errante', 'arauto_abismo', 'sentinela_omena']
        : ['arauto_abismo', 'executor_omena', 'sentinela_omena', 'sombra_errante'];
  } else {
    pool =
      floorNumber <= 3
        ? ['golem_pedra', 'escaravelho_inca', 'espectro_ruina']
        : floorNumber <= 6
        ? ['escaravelho_inca', 'totem_condor', 'golem_pedra', 'espectro_ruina']
        : ['totem_condor', 'colosso_granito', 'escaravelho_inca', 'golem_pedra'];
  }

  return pool[(index + Math.max(0, floorNumber - 1)) % pool.length] ?? 'golem_pedra';
}

export function getUnlockedDungeonCheckpoints(
  flags: Record<string, boolean>,
  dungeonId: DungeonId
): number[] {
  const checkpoints = [1];
  if (flags[`dungeon_cp_${dungeonId}_5`]) checkpoints.push(5);
  if (flags[`dungeon_cp_${dungeonId}_10`]) checkpoints.push(10);
  if (flags[`dungeon_cp_${dungeonId}_boss`]) checkpoints.push(TOTAL_PROCEDURAL_FLOORS + 1);
  return checkpoints;
}

export function recordDungeonCheckpoint(
  flags: Record<string, boolean>,
  dungeonId: DungeonId,
  floor: number
): number | null {
  let newlyUnlocked: number | null = null;
  if (floor >= 5 && !flags[`dungeon_cp_${dungeonId}_5`]) {
    flags[`dungeon_cp_${dungeonId}_5`] = true;
    newlyUnlocked = 5;
  }
  if (floor >= 10 && !flags[`dungeon_cp_${dungeonId}_10`]) {
    flags[`dungeon_cp_${dungeonId}_10`] = true;
    newlyUnlocked = 10;
  }
  if (floor > TOTAL_PROCEDURAL_FLOORS && !flags[`dungeon_cp_${dungeonId}_boss`]) {
    flags[`dungeon_cp_${dungeonId}_boss`] = true;
    newlyUnlocked = TOTAL_PROCEDURAL_FLOORS + 1;
  }
  return newlyUnlocked;
}

export function generateDungeonFloor(
  dungeonId: DungeonId,
  floorNumber: number,
  seed: number,
  width = 28,
  height = 22
): DungeonFloorLayout {
  const rng = mulberry32(seed + floorNumber * 7919);
  const floorGid = dungeonId === 'chapada' || dungeonId === 'fortaleza_omena' ? 7 : MACHU_GID.FLOOR;
  const wallGid = dungeonId === 'chapada' ? 11 : MACHU_GID.WALL;
  const groundGids: number[] = Array.from({ length: width * height }, () => floorGid);
  const collisionGids: number[] = Array.from({ length: width * height }, () => wallGid);

  const carveTile = (x: number, y: number) => {
    if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
      collisionGids[y * width + x] = 0;
    }
  };

  const rooms: DungeonRoom[] = [];
  const targetRooms = floorNumber <= 3 ? 4 : floorNumber <= 7 ? 5 : 6;

  for (let attempt = 0; attempt < 40 && rooms.length < targetRooms; attempt++) {
    const rw = 4 + Math.floor(rng() * 4);
    const rh = 4 + Math.floor(rng() * 3);
    const rx = 1 + Math.floor(rng() * (width - rw - 2));
    const ry = 1 + Math.floor(rng() * (height - rh - 2));

    const overlaps = rooms.some(
      (r) =>
        rx <= r.x + r.w + 1 &&
        rx + rw + 1 >= r.x &&
        ry <= r.y + r.h + 1 &&
        ry + rh + 1 >= r.y
    );
    if (overlaps) continue;

    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        carveTile(x, y);
      }
    }

    rooms.push({
      x: rx,
      y: ry,
      w: rw,
      h: rh,
      centerX: Math.floor(rx + rw / 2),
      centerY: Math.floor(ry + rh / 2),
    });
  }

  // Fallback se poucas salas couberem
  if (rooms.length < 2) {
    for (let y = 3; y < height - 3; y++) {
      for (let x = 3; x < width - 3; x++) {
        carveTile(x, y);
      }
    }
    rooms.push(
      { x: 3, y: 3, w: 6, h: 6, centerX: 5, centerY: 5 },
      { x: width - 9, y: height - 9, w: 6, h: 6, centerX: width - 6, centerY: height - 6 }
    );
  }

  // Conecta salas sequencialmente com corredores largos (2 tiles onde possível)
  for (let i = 1; i < rooms.length; i++) {
    const prev = rooms[i - 1];
    const curr = rooms[i];
    if (!prev || !curr) continue;

    let cx = prev.centerX;
    let cy = prev.centerY;
    while (cx !== curr.centerX) {
      carveTile(cx, cy);
      carveTile(cx, Math.min(height - 2, cy + 1));
      cx += cx < curr.centerX ? 1 : -1;
    }
    while (cy !== curr.centerY) {
      carveTile(cx, cy);
      carveTile(Math.min(width - 2, cx + 1), cy);
      cy += cy < curr.centerY ? 1 : -1;
    }
  }

  const firstRoom = rooms[0]!;
  const lastRoom = rooms[rooms.length - 1]!;
  const startTile = { tileX: firstRoom.centerX, tileY: firstRoom.centerY };
  const exitTile = { tileX: lastRoom.centerX, tileY: lastRoom.centerY };

  groundGids[exitTile.tileY * width + exitTile.tileX] = MACHU_GID.STAIRS;

  const trapTiles: { tileX: number; tileY: number }[] = [];
  const oreTiles: { tileX: number; tileY: number }[] = [];
  const enemySpawns: EnemySpawnPoint[] = [];

  for (let rIdx = 1; rIdx < rooms.length; rIdx++) {
    const room = rooms[rIdx];
    if (!room) continue;

    // Inimigos por sala (escalonamento progressivo até o Andar 10)
    const enemyCount = 1 + Math.floor(rng() * 2) + (floorNumber >= 6 && rIdx % 2 === 1 ? 1 : 0);
    for (let e = 0; e < enemyCount; e++) {
      const ex = room.x + 1 + Math.floor(rng() * Math.max(1, room.w - 2));
      const ey = room.y + 1 + Math.floor(rng() * Math.max(1, room.h - 2));
      if ((ex === exitTile.tileX && ey === exitTile.tileY) || (ex === startTile.tileX && ey === startTile.tileY)) {
        continue;
      }
      enemySpawns.push({
        kind: pickEnemyKind(dungeonId, e + rIdx, floorNumber),
        tileX: ex,
        tileY: ey,
      });
    }

    // Armadilhas incas no centro/canto da sala (não bloqueia caminho)
    const tx = room.x + Math.floor(rng() * room.w);
    const ty = room.y + Math.floor(rng() * room.h);
    if (!(tx === exitTile.tileX && ty === exitTile.tileY)) {
      groundGids[ty * width + tx] = MACHU_GID.TRAP;
      trapTiles.push({ tileX: tx, tileY: ty });
    }

    // Veios de minério em cantos da sala (andares profundos >= 5 ganham segundo veio quando possível)
    const oreCorners: [number, number][] = [[room.x, room.y]];
    if (floorNumber >= 5 && room.w >= 4) {
      oreCorners.push([room.x + room.w - 1, room.y + room.h - 1]);
    }
    for (const [ox, oy] of oreCorners) {
      if (
        !(ox === exitTile.tileX && oy === exitTile.tileY) &&
        !(ox === startTile.tileX && oy === startTile.tileY)
      ) {
        const prevGid = collisionGids[oy * width + ox] ?? 0;
        collisionGids[oy * width + ox] = MACHU_GID.ORE;
        if (isFloorReachable({ width, height, collisionGids }, startTile, exitTile)) {
          oreTiles.push({ tileX: ox, tileY: oy });
        } else {
          collisionGids[oy * width + ox] = prevGid;
        }
      }
    }
  }

  const crystalNodes: CrystalPuzzleNode[] = [];
  const requiresCrystalPuzzle = dungeonId === 'chapada';
  if (requiresCrystalPuzzle) {
    const orders: ReadonlyArray<1 | 2 | 3> = [1, 2, 3];
    const usedKeys = new Set<string>([
      `${startTile.tileX},${startTile.tileY}`,
      `${exitTile.tileX},${exitTile.tileY}`,
    ]);
    for (const ore of oreTiles) {
      usedKeys.add(`${ore.tileX},${ore.tileY}`);
    }

    const candidates: { tileX: number; tileY: number }[] = [];
    for (const room of rooms) {
      candidates.push({ tileX: room.centerX, tileY: room.centerY });
      candidates.push({ tileX: room.x + 1, tileY: room.y + 1 });
    }
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (collisionGids[y * width + x] === 0) {
          candidates.push({ tileX: x, tileY: y });
        }
      }
    }

    for (const order of orders) {
      const slot = candidates.find(
        (c) =>
          (collisionGids[c.tileY * width + c.tileX] ?? 1) === 0 &&
          !usedKeys.has(`${c.tileX},${c.tileY}`)
      );
      if (slot) {
        usedKeys.add(`${slot.tileX},${slot.tileY}`);
        crystalNodes.push({ order, tileX: slot.tileX, tileY: slot.tileY });
      }
    }
  }

  const usedPoiKeys = new Set<string>([
    `${startTile.tileX},${startTile.tileY}`,
    `${exitTile.tileX},${exitTile.tileY}`,
  ]);
  for (const ore of oreTiles) usedPoiKeys.add(`${ore.tileX},${ore.tileY}`);
  for (const trap of trapTiles) usedPoiKeys.add(`${trap.tileX},${trap.tileY}`);
  for (const cn of crystalNodes) usedPoiKeys.add(`${cn.tileX},${cn.tileY}`);
  for (const sp of enemySpawns) usedPoiKeys.add(`${sp.tileX},${sp.tileY}`);

  const poiCandidates: { tileX: number; tileY: number }[] = [];
  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    if (!room) continue;
    poiCandidates.push(
      { tileX: room.x + room.w - 1, tileY: room.y },
      { tileX: room.x, tileY: room.y + room.h - 1 },
      { tileX: room.x + room.w - 1, tileY: room.y + room.h - 1 },
      { tileX: room.centerX, tileY: room.centerY }
    );
  }
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      poiCandidates.push({ tileX: x, tileY: y });
    }
  }

  const pickFreePoiTile = (): { tileX: number; tileY: number } | null => {
    for (const c of poiCandidates) {
      const key = `${c.tileX},${c.tileY}`;
      if (usedPoiKeys.has(key)) continue;
      if ((collisionGids[c.tileY * width + c.tileX] ?? 1) !== 0) continue;
      usedPoiKeys.add(key);
      return c;
    }
    return null;
  };

  const isSanctuaryFloor = floorNumber === 5 || floorNumber === 10;
  const treasureChests: { tileX: number; tileY: number }[] = [];
  const chestTarget = isSanctuaryFloor ? 2 : rng() < 0.45 ? 2 : 1;
  for (let i = 0; i < chestTarget; i++) {
    const slot = pickFreePoiTile();
    if (slot) treasureChests.push(slot);
  }

  const loreTotems: LoreTotemNode[] = [];
  const loreSlot = pickFreePoiTile();
  if (loreSlot) {
    loreTotems.push({
      tileX: loreSlot.tileX,
      tileY: loreSlot.tileY,
      loreId: `${dungeonId}_f${floorNumber}`,
    });
  }

  const healingFountains: { tileX: number; tileY: number }[] = [];
  if (isSanctuaryFloor || floorNumber >= 2 || rng() < 0.6) {
    const fountSlot = pickFreePoiTile();
    if (fountSlot) healingFountains.push(fountSlot);
  }

  return {
    dungeonId,
    floorNumber,
    seed,
    width,
    height,
    groundGids,
    collisionGids,
    trapTiles,
    oreTiles,
    crystalNodes,
    requiresCrystalPuzzle,
    enemySpawns,
    treasureChests,
    loreTotems,
    healingFountains,
    startTile,
    exitTile,
  };
}

export function generateMachuPicchuFloor(
  floorNumber: number,
  seed: number,
  width = 28,
  height = 22
): DungeonFloorLayout {
  return generateDungeonFloor('machu_picchu', floorNumber, seed, width, height);
}

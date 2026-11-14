import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getTiledProperty, type TiledMapJson, type TiledObjectLayer, type TiledTileLayer } from '../client/src/core/TiledTypes.js';

const MAPS_DIR = path.resolve(process.cwd(), 'public/assets/maps');
const MAP_NAMES = [
  'fazenda',
  'casa',
  'porao',
  'arena_terra',
  'arena_aguas',
  'arena_ceus',
  'arena_omena',
  'cidade',
  'ferraria',
  'botica',
  'pub_pedra',
] as const;

function readMap(name: string): TiledMapJson {
  const filePath = path.join(MAPS_DIR, `${name}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as TiledMapJson;
}

describe('Mapas Tiled JSON (32x32)', () => {
  it('valida estrutura, camadas obrigatórias e tileset em todos os mapas', () => {
    for (const name of MAP_NAMES) {
      const map = readMap(name);
      expect(map.tilewidth).toBe(32);
      expect(map.tileheight).toBe(32);
      expect(map.tilesets[0]?.name).toBe('sao_tome_tileset');

      const layerNames = map.layers.map((l) => l.name);
      expect(layerNames).toEqual(expect.arrayContaining(['Chao', 'Decoracao', 'Colisoes', 'Portais', 'Spawns']));

      for (const layer of map.layers) {
        if (layer.type === 'tilelayer') {
          expect((layer as TiledTileLayer).data).toHaveLength(map.width * map.height);
        }
      }
    }
  });

  it('garante que todos os portais apontam para destinos válidos e sem colisão no tile de chegada', () => {
    const loadedMaps = new Map<string, TiledMapJson>(
      MAP_NAMES.map((name) => [name, readMap(name)])
    );

    for (const name of MAP_NAMES) {
      const map = loadedMaps.get(name);
      if (!map) throw new Error(`Mapa ausente: ${name}`);

      const portalLayer = map.layers.find((l) => l.name === 'Portais') as TiledObjectLayer;
      expect(portalLayer.objects.length).toBeGreaterThan(0);

      for (const portal of portalLayer.objects) {
        const targetMapName = getTiledProperty<string>(portal.properties, 'targetMap');
        const targetX = getTiledProperty<number>(portal.properties, 'targetTileX');
        const targetY = getTiledProperty<number>(portal.properties, 'targetTileY');

        expect(targetMapName).toBeDefined();
        const targetMap = targetMapName ? loadedMaps.get(targetMapName) : undefined;
        expect(targetMap).toBeDefined();
        if (!targetMap || typeof targetX !== 'number' || typeof targetY !== 'number') {
          throw new Error(`Portal inválido em ${name}`);
        }

        expect(targetX).toBeGreaterThanOrEqual(0);
        expect(targetX).toBeLessThan(targetMap.width);
        expect(targetY).toBeGreaterThanOrEqual(0);
        expect(targetY).toBeLessThan(targetMap.height);

        const colisoes = targetMap.layers.find((l) => l.name === 'Colisoes') as TiledTileLayer;
        const spawnGid = colisoes.data[targetY * targetMap.width + targetX];
        expect(spawnGid).toBe(0);
      }
    }
  });

  it('garante fazenda ampla (>=60x40) com áreas cultiváveis, veios de minério e pontos livres', () => {
    const fazenda = readMap('fazenda');
    expect(fazenda.width).toBeGreaterThanOrEqual(60);
    expect(fazenda.height).toBeGreaterThanOrEqual(40);

    const chao = fazenda.layers.find((l) => l.name === 'Chao') as TiledTileLayer;
    const colisoes = fazenda.layers.find((l) => l.name === 'Colisoes') as TiledTileLayer;

    const farmableCount = chao.data.filter((gid) => gid === 5).length;
    const oreVeinCount = colisoes.data.filter((gid) => gid === 31).length;
    expect(farmableCount).toBeGreaterThanOrEqual(250);
    expect(oreVeinCount).toBeGreaterThanOrEqual(4);

    // Spawn padrão, Seu Zeca (53,22), Câmera do Rafael (57,25) e spawn legado (10,8) livres de colisão
    const freeSpots: ReadonlyArray<[number, number]> = [
      [28, 9],
      [53, 22],
      [57, 25],
      [10, 8],
    ];
    for (const [tx, ty] of freeSpots) {
      expect(colisoes.data[ty * fazenda.width + tx]).toBe(0);
    }
  });

  it('mantém colisão sólida em portas (15), cama (17) e bancadas (22)', () => {
    const fazenda = readMap('fazenda');
    const casa = readMap('casa');
    const cidade = readMap('cidade');

    const colOf = (map: TiledMapJson, x: number, y: number): number => {
      const layer = map.layers.find((l) => l.name === 'Colisoes') as TiledTileLayer;
      return layer.data[y * map.width + x] ?? 0;
    };

    expect(colOf(fazenda, 28, 7)).toBe(15);
    expect(colOf(fazenda, 34, 7)).toBe(22);
    expect(colOf(casa, 2, 2)).toBe(17);
    expect(colOf(casa, 10, 3)).toBe(22);
    expect(colOf(casa, 7, 11)).toBe(15);
    expect(colOf(cidade, 6, 5)).toBe(15);
    expect(colOf(cidade, 14, 5)).toBe(15);
    expect(colOf(cidade, 22, 5)).toBe(15);
  });
});

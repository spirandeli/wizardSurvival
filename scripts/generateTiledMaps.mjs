import fs from 'node:fs';
import path from 'node:path';

const TILE_SIZE = 32;
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets/maps');

function emptyGrid(width, height, fill = 0) {
  return Array.from({ length: width * height }, () => fill);
}

function setTile(grid, width, x, y, gid) {
  if (x >= 0 && y >= 0) {
    grid[y * width + x] = gid;
  }
}

function fillRect(grid, width, x0, y0, x1, y1, gid) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      setTile(grid, width, x, y, gid);
    }
  }
}

function createMap({ width, height, chao, decoracao, colisoes, portals, spawns }) {
  return {
    compressionlevel: -1,
    height,
    infinite: false,
    layers: [
      {
        data: chao,
        height,
        id: 1,
        name: 'Chao',
        opacity: 1,
        type: 'tilelayer',
        visible: true,
        width,
        x: 0,
        y: 0,
      },
      {
        data: decoracao,
        height,
        id: 2,
        name: 'Decoracao',
        opacity: 1,
        type: 'tilelayer',
        visible: true,
        width,
        x: 0,
        y: 0,
      },
      {
        data: colisoes,
        height,
        id: 3,
        name: 'Colisoes',
        opacity: 1,
        type: 'tilelayer',
        visible: true,
        width,
        x: 0,
        y: 0,
      },
      {
        id: 4,
        name: 'Portais',
        objects: portals,
        opacity: 1,
        type: 'objectgroup',
        visible: true,
        x: 0,
        y: 0,
      },
      {
        id: 5,
        name: 'Spawns',
        objects: spawns,
        opacity: 1,
        type: 'objectgroup',
        visible: true,
        x: 0,
        y: 0,
      },
    ],
    nextlayerid: 6,
    nextobjectid: portals.length + spawns.length + 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.11.0',
    tileheight: TILE_SIZE,
    tilesets: [
      {
        columns: 8,
        firstgid: 1,
        image: '../tilesets/sao_tome_tileset.png',
        imageheight: 136,
        imagewidth: 272,
        margin: 1,
        name: 'sao_tome_tileset',
        spacing: 2,
        tilecount: 32,
        tileheight: TILE_SIZE,
        tilewidth: TILE_SIZE,
      },
    ],
    tilewidth: TILE_SIZE,
    type: 'map',
    version: '1.10',
    width,
  };
}

function buildFazenda() {
  const w = 64;
  const h = 46;
  const chao = emptyGrid(w, h, 1);
  const decoracao = emptyGrid(w, h, 0);
  const colisoes = emptyGrid(w, h, 0);

  // Bordas naturais com árvores, rochas e cerca leste
  for (let x = 0; x < w; x++) {
    setTile(colisoes, w, x, 0, x % 7 === 0 ? 14 : 13);
    setTile(colisoes, w, x, h - 1, 13);
  }
  for (let y = 1; y < h - 1; y++) {
    setTile(colisoes, w, 0, y, 13);
    if (y < 19 || y > 21) {
      setTile(colisoes, w, w - 1, y, y % 4 === 0 ? 13 : 12);
    }
  }

  // Grandes campos aráveis de plantio (Campo Oeste 14..26 x 14..27 e Campo Leste 31..43 x 14..27)
  fillRect(chao, w, 14, 14, 26, 27, 5);
  fillRect(chao, w, 31, 14, 43, 27, 5);

  // Pátio da casa, avenidas e trilhas de quartzo
  fillRect(decoracao, w, 23, 8, 36, 10, 3);
  fillRect(decoracao, w, 10, 11, 46, 12, 3);
  fillRect(decoracao, w, 28, 11, 29, 33, 3);
  fillRect(decoracao, w, 45, 11, 46, 21, 3);
  fillRect(decoracao, w, 45, 19, 63, 21, 3);
  fillRect(decoracao, w, 6, 11, 10, 12, 3);
  fillRect(decoracao, w, 6, 13, 7, 27, 3);
  fillRect(decoracao, w, 17, 29, 50, 30, 3);
  fillRect(decoracao, w, 17, 30, 18, 31, 3);
  fillRect(decoracao, w, 47, 30, 48, 33, 3);
  fillRect(decoracao, w, 28, 38, 29, 40, 3);

  // Clareira e chão rochoso da Pedreira Oeste
  fillRect(decoracao, w, 3, 17, 5, 27, 3);
  fillRect(decoracao, w, 8, 17, 11, 27, 3);

  // Flores silvestres espalhadas pela propriedade
  for (const [fx, fy] of [
    [12, 7],
    [15, 9],
    [22, 6],
    [22, 9],
    [35, 9],
    [37, 11],
    [49, 14],
    [52, 16],
    [55, 18],
    [58, 23],
    [52, 26],
    [44, 31],
    [24, 31],
    [11, 30],
    [9, 14],
    [23, 41],
    [34, 41],
    [41, 40],
  ]) {
    setTile(chao, w, fx, fy, 2);
  }

  // Casa do antigo protetor (x=24..31, y=4..7)
  fillRect(colisoes, w, 24, 4, 31, 5, 10);
  fillRect(colisoes, w, 24, 6, 31, 7, 9);
  setTile(chao, w, 28, 7, 7);
  setTile(colisoes, w, 28, 7, 15);

  // Caixa de Remessas, Bancada inicial e Placa de boas-vindas
  setTile(colisoes, w, 33, 7, 18);
  setTile(colisoes, w, 34, 7, 22);
  setTile(colisoes, w, 29, 10, 24);

  // Cercado Mágico das Criaturas e Mini-Dragões (x=38..52, y=3..10)
  for (let x = 38; x <= 52; x++) {
    setTile(colisoes, w, x, 3, 12);
    if (x < 43 || x > 46) {
      setTile(colisoes, w, x, 10, 12);
    }
  }
  for (let y = 4; y <= 9; y++) {
    setTile(colisoes, w, 38, y, 12);
    setTile(colisoes, w, 52, y, 12);
  }
  fillRect(decoracao, w, 40, 5, 44, 8, 3);

  // Cercas decorativas nos cantos dos campos aráveis (com passagens amplas)
  for (const fx of [14, 15, 16, 17, 25, 26, 31, 32, 33, 41, 42, 43]) {
    setTile(colisoes, w, fx, 13, 12);
    setTile(colisoes, w, fx, 28, 12);
  }

  // Bosque Oeste e Bosque Nordeste (árvores cortáveis com Machado; mantém (10,8) livre)
  for (const [tx, ty] of [
    [3, 3],
    [7, 4],
    [12, 3],
    [16, 5],
    [19, 3],
    [4, 7],
    [14, 8],
    [3, 11],
    [56, 4],
    [60, 5],
    [55, 9],
    [59, 11],
    [57, 15],
    [50, 25],
    [59, 28],
    [6, 31],
  ]) {
    setTile(colisoes, w, tx, ty, 13);
  }

  // Pedreira Oeste: rochas de quartzo (14) e veios de minério de cobre/quartzo (31)
  for (const [rx, ry] of [
    [3, 18],
    [4, 21],
    [3, 25],
    [10, 19],
    [11, 24],
    [9, 28],
  ]) {
    setTile(colisoes, w, rx, ry, 14);
  }
  for (const [ox, oy] of [
    [4, 17],
    [3, 22],
    [5, 26],
    [9, 17],
    [10, 22],
    [11, 27],
  ]) {
    setTile(colisoes, w, ox, oy, 31);
  }

  // Rio Místico ao sul (y=34..37) + Lagoa de Pesca (x=12..22, y=32..38)
  fillRect(colisoes, w, 1, 34, w - 2, 37, 4);
  fillRect(colisoes, w, 12, 32, 22, 38, 4);

  // Píer de pesca sobre a lagoa (x=17..18, y=32..35)
  fillRect(colisoes, w, 17, 32, 18, 35, 0);
  fillRect(decoracao, w, 17, 32, 18, 35, 23);

  // Pontes de madeira sobre o rio (Central x=28..29 e Leste x=47..48)
  fillRect(colisoes, w, 28, 34, 29, 37, 0);
  fillRect(decoracao, w, 28, 34, 29, 37, 23);
  fillRect(colisoes, w, 47, 34, 48, 37, 0);
  fillRect(decoracao, w, 47, 34, 48, 37, 23);

  // Ilha / Clareira Mística ao Sul (y=39..43)
  fillRect(decoracao, w, 28, 40, 30, 42, 27);
  setTile(colisoes, w, 22, 40, 13);
  setTile(colisoes, w, 36, 40, 13);
  setTile(colisoes, w, 42, 42, 14);
  setTile(colisoes, w, 44, 41, 31);
  setTile(colisoes, w, 53, 41, 13);

  const portals = [
    {
      id: 1,
      name: 'porta_casa',
      type: 'portal',
      x: 28 * TILE_SIZE,
      y: 7 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      properties: [
        { name: 'targetMap', type: 'string', value: 'casa' },
        { name: 'targetTileX', type: 'int', value: 7 },
        { name: 'targetTileY', type: 'int', value: 9 },
        { name: 'label', type: 'string', value: 'Entrar na Casa' },
      ],
    },
    {
      id: 2,
      name: 'saida_cidade',
      type: 'portal',
      x: 63 * TILE_SIZE,
      y: 19 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE * 3,
      properties: [
        { name: 'targetMap', type: 'string', value: 'cidade' },
        { name: 'targetTileX', type: 'int', value: 1 },
        { name: 'targetTileY', type: 'int', value: 10 },
        { name: 'label', type: 'string', value: 'Praça de São Tomé dos Números' },
      ],
    },
  ];

  const spawns = [
    {
      id: 3,
      name: 'default',
      type: 'spawn',
      x: 28 * TILE_SIZE,
      y: 9 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
  ];

  return createMap({ width: w, height: h, chao, decoracao, colisoes, portals, spawns });
}

function buildCasa() {
  const w = 14;
  const h = 12;
  const chao = emptyGrid(w, h, 6);
  const decoracao = emptyGrid(w, h, 0);
  const colisoes = emptyGrid(w, h, 0);

  for (let x = 0; x < w; x++) {
    setTile(colisoes, w, x, 0, 11);
    setTile(colisoes, w, x, h - 1, 11);
  }
  for (let y = 1; y < h - 1; y++) {
    setTile(colisoes, w, 0, y, 11);
    setTile(colisoes, w, w - 1, y, 11);
  }

  // Tapete central
  fillRect(decoracao, w, 5, 5, 8, 7, 8);

  // Porta de saída (x=7, y=11)
  setTile(colisoes, w, 7, 11, 15);

  // Alçapão secreto para o porão (x=7, y=5)
  setTile(decoracao, w, 7, 5, 16);

  // Cama e mesa
  setTile(colisoes, w, 2, 2, 17);
  setTile(colisoes, w, 10, 3, 22);
  setTile(colisoes, w, 11, 3, 22);

  const portals = [
    {
      id: 1,
      name: 'sair_fazenda',
      type: 'portal',
      x: 7 * TILE_SIZE,
      y: 11 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      properties: [
        { name: 'targetMap', type: 'string', value: 'fazenda' },
        { name: 'targetTileX', type: 'int', value: 28 },
        { name: 'targetTileY', type: 'int', value: 8 },
        { name: 'label', type: 'string', value: 'Sair para a Fazenda' },
      ],
    },
    {
      id: 2,
      name: 'descer_porao',
      type: 'portal',
      x: 7 * TILE_SIZE,
      y: 5 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      properties: [
        { name: 'targetMap', type: 'string', value: 'porao' },
        { name: 'targetTileX', type: 'int', value: 7 },
        { name: 'targetTileY', type: 'int', value: 11 },
        { name: 'label', type: 'string', value: 'Descer ao Porão Secreto' },
      ],
    },
  ];

  const spawns = [
    {
      id: 3,
      name: 'default',
      type: 'spawn',
      x: 7 * TILE_SIZE,
      y: 9 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
  ];

  return createMap({ width: w, height: h, chao, decoracao, colisoes, portals, spawns });
}

function buildPorao() {
  const w = 16;
  const h = 14;
  const chao = emptyGrid(w, h, 7);
  const decoracao = emptyGrid(w, h, 0);
  const colisoes = emptyGrid(w, h, 0);

  for (let x = 0; x < w; x++) {
    setTile(colisoes, w, x, 0, 11);
    setTile(colisoes, w, x, h - 1, 11);
  }
  for (let y = 1; y < h - 1; y++) {
    setTile(colisoes, w, 0, y, 11);
    setTile(colisoes, w, w - 1, y, 11);
  }

  // Runas arcanas no chão
  fillRect(decoracao, w, 6, 5, 9, 8, 27);

  // Altar de Lupin (x=7, y=4)
  setTile(colisoes, w, 7, 4, 19);

  // Os 3 portais quebrados do antigo protetor
  setTile(colisoes, w, 3, 2, 20); // Terra - Machu Picchu
  setTile(colisoes, w, 7, 2, 20); // Águas - Chapada dos Veadeiros
  setTile(colisoes, w, 12, 2, 20); // Céus - Varginha

  // Ninho dos 3 ovos de Mini-Dragão
  setTile(colisoes, w, 12, 9, 21);

  // Escada de volta para a Casa (x=7, y=12)
  setTile(decoracao, w, 7, 12, 16);

  const portals = [
    {
      id: 1,
      name: 'subir_casa',
      type: 'portal',
      x: 7 * TILE_SIZE,
      y: 12 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      properties: [
        { name: 'targetMap', type: 'string', value: 'casa' },
        { name: 'targetTileX', type: 'int', value: 7 },
        { name: 'targetTileY', type: 'int', value: 6 },
        { name: 'label', type: 'string', value: 'Subir para a Casa' },
      ],
    },
  ];

  const spawns = [
    {
      id: 2,
      name: 'default',
      type: 'spawn',
      x: 7 * TILE_SIZE,
      y: 11 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
  ];

  return createMap({ width: w, height: h, chao, decoracao, colisoes, portals, spawns });
}

function buildElementalArena({
  chaoGid,
  wallGid,
  pillarGid,
  centerDecoGid,
  accentDecoGid = 0,
  returnTargetTileX,
  returnTargetTileY = 4,
  bossSpawnName,
}) {
  const w = 20;
  const h = 16;
  const chao = emptyGrid(w, h, chaoGid);
  const decoracao = emptyGrid(w, h, 0);
  const colisoes = emptyGrid(w, h, 0);

  for (let x = 0; x < w; x++) {
    setTile(colisoes, w, x, 0, wallGid);
    setTile(colisoes, w, x, h - 1, wallGid);
  }
  for (let y = 1; y < h - 1; y++) {
    setTile(colisoes, w, 0, y, wallGid);
    setTile(colisoes, w, w - 1, y, wallGid);
  }

  // Pilares nos quatro cantos internos
  for (const [px, py] of [
    [4, 4],
    [15, 4],
    [4, 11],
    [15, 11],
  ]) {
    setTile(colisoes, w, px, py, pillarGid);
  }

  if (accentDecoGid > 0) {
    fillRect(decoracao, w, 6, 4, 13, 11, accentDecoGid);
  }

  // Runas ou espelho d'água no centro da arena
  fillRect(decoracao, w, 8, 6, 11, 9, centerDecoGid);

  // Portal de retorno ao Porão (ativado após libertar o Guardião)
  setTile(decoracao, w, 10, 14, 16);

  const portals = [
    {
      id: 1,
      name: 'retorno_porao',
      type: 'portal',
      x: 10 * TILE_SIZE,
      y: 14 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      properties: [
        { name: 'targetMap', type: 'string', value: 'porao' },
        { name: 'targetTileX', type: 'int', value: returnTargetTileX },
        { name: 'targetTileY', type: 'int', value: returnTargetTileY },
        { name: 'label', type: 'string', value: 'Voltar ao Porão' },
      ],
    },
  ];

  const spawns = [
    {
      id: 2,
      name: 'default',
      type: 'spawn',
      x: 10 * TILE_SIZE,
      y: 13 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
    {
      id: 3,
      name: bossSpawnName,
      type: 'boss',
      x: 10 * TILE_SIZE,
      y: 5 * TILE_SIZE,
      width: TILE_SIZE * 2,
      height: TILE_SIZE * 2,
    },
  ];

  return createMap({ width: w, height: h, chao, decoracao, colisoes, portals, spawns });
}

function buildArenaTerra() {
  return buildElementalArena({
    chaoGid: 28,
    wallGid: 29,
    pillarGid: 29,
    centerDecoGid: 27,
    returnTargetTileX: 3,
    bossSpawnName: 'boss_guardiao_terra',
  });
}

function buildArenaAguas() {
  return buildElementalArena({
    chaoGid: 7,
    wallGid: 11,
    pillarGid: 23,
    centerDecoGid: 3,
    accentDecoGid: 27,
    returnTargetTileX: 7,
    returnTargetTileY: 3,
    bossSpawnName: 'boss_guardiao_aguas',
  });
}

function buildArenaCeus() {
  return buildElementalArena({
    chaoGid: 28,
    wallGid: 29,
    pillarGid: 11,
    centerDecoGid: 27,
    accentDecoGid: 8,
    returnTargetTileX: 12,
    bossSpawnName: 'boss_guardiao_ceus',
  });
}

function buildArenaOmena() {
  return buildElementalArena({
    chaoGid: 7,
    wallGid: 29,
    pillarGid: 23,
    centerDecoGid: 27,
    accentDecoGid: 8,
    returnTargetTileX: 7,
    returnTargetTileY: 6,
    bossSpawnName: 'boss_omena',
  });
}

function buildCidade() {
  const w = 30;
  const h = 22;
  const chao = emptyGrid(w, h, 1);
  const decoracao = emptyGrid(w, h, 0);
  const colisoes = emptyGrid(w, h, 0);

  for (let x = 0; x < w; x++) {
    setTile(colisoes, w, x, 0, 13);
    setTile(colisoes, w, x, h - 1, 13);
  }
  for (let y = 1; y < h - 1; y++) {
    if (y !== 10 && y !== 11) {
      setTile(colisoes, w, 0, y, 12);
    }
    setTile(colisoes, w, w - 1, y, 13);
  }

  // Avenida e Praça Central de quartzo
  fillRect(decoracao, w, 0, 10, 26, 11, 3);
  fillRect(decoracao, w, 10, 7, 19, 13, 3);
  fillRect(decoracao, w, 6, 6, 6, 9, 3);
  fillRect(decoracao, w, 14, 6, 14, 9, 3);
  fillRect(decoracao, w, 22, 6, 22, 9, 3);

  // Fonte dos Números no centro da Praça (x=15, y=10)
  setTile(colisoes, w, 15, 10, 19);

  // Flores ornamentais e árvores da praça
  for (const [fx, fy] of [
    [9, 7],
    [9, 13],
    [20, 7],
    [20, 13],
    [3, 7],
    [18, 16],
    [25, 16],
    [7, 16],
  ]) {
    setTile(chao, w, fx, fy, 2);
  }
  for (const [tx, ty] of [
    [2, 3],
    [27, 4],
    [27, 14],
    [3, 15],
  ]) {
    setTile(colisoes, w, tx, ty, 13);
  }
  setTile(colisoes, w, 9, 14, 24);

  // Ferraria do Bento (x=4..8, y=3..5, porta em 6,5)
  fillRect(colisoes, w, 4, 3, 8, 3, 10);
  fillRect(colisoes, w, 4, 4, 8, 5, 9);
  setTile(chao, w, 6, 5, 7);
  setTile(colisoes, w, 6, 5, 15);

  // Botica da Celeste (x=12..16, y=3..5, porta em 14,5)
  fillRect(colisoes, w, 12, 3, 16, 3, 10);
  fillRect(colisoes, w, 12, 4, 16, 5, 9);
  setTile(chao, w, 14, 5, 7);
  setTile(colisoes, w, 14, 5, 15);

  // Pub de Pedra da Ísis (x=20..25, y=3..5, porta em 22,5)
  fillRect(colisoes, w, 20, 3, 25, 3, 10);
  fillRect(colisoes, w, 20, 4, 25, 5, 9);
  setTile(chao, w, 22, 5, 7);
  setTile(colisoes, w, 22, 5, 15);

  // Rio Místico e Corredeiras ao sul (y=18..19)
  fillRect(colisoes, w, 1, 18, w - 2, 19, 4);
  fillRect(colisoes, w, 14, 18, 15, 19, 0);
  fillRect(decoracao, w, 14, 18, 15, 19, 23);

  const portals = [
    {
      id: 1,
      name: 'voltar_fazenda',
      type: 'portal',
      x: 0,
      y: 10 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE * 2,
      properties: [
        { name: 'targetMap', type: 'string', value: 'fazenda' },
        { name: 'targetTileX', type: 'int', value: 61 },
        { name: 'targetTileY', type: 'int', value: 20 },
        { name: 'label', type: 'string', value: 'Voltar para a Fazenda' },
      ],
    },
    {
      id: 2,
      name: 'entrar_ferraria',
      type: 'portal',
      x: 6 * TILE_SIZE,
      y: 5 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      properties: [
        { name: 'targetMap', type: 'string', value: 'ferraria' },
        { name: 'targetTileX', type: 'int', value: 7 },
        { name: 'targetTileY', type: 'int', value: 9 },
        { name: 'label', type: 'string', value: 'Ferraria do Bento' },
      ],
    },
    {
      id: 3,
      name: 'entrar_botica',
      type: 'portal',
      x: 14 * TILE_SIZE,
      y: 5 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      properties: [
        { name: 'targetMap', type: 'string', value: 'botica' },
        { name: 'targetTileX', type: 'int', value: 7 },
        { name: 'targetTileY', type: 'int', value: 9 },
        { name: 'label', type: 'string', value: 'Botica da Celeste' },
      ],
    },
    {
      id: 4,
      name: 'entrar_pub',
      type: 'portal',
      x: 22 * TILE_SIZE,
      y: 5 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      properties: [
        { name: 'targetMap', type: 'string', value: 'pub_pedra' },
        { name: 'targetTileX', type: 'int', value: 8 },
        { name: 'targetTileY', type: 'int', value: 9 },
        { name: 'label', type: 'string', value: 'Pub de Pedra' },
      ],
    },
  ];

  const spawns = [
    {
      id: 5,
      name: 'default',
      type: 'spawn',
      x: 2 * TILE_SIZE,
      y: 10 * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
  ];

  return createMap({ width: w, height: h, chao, decoracao, colisoes, portals, spawns });
}

function buildInteriorShop({ exitTargetMap, exitTileX, exitTileY, width = 14, floorGid = 6, hasTrapdoor = false }) {
  const w = width;
  const h = 12;
  const chao = emptyGrid(w, h, floorGid);
  const decoracao = emptyGrid(w, h, 0);
  const colisoes = emptyGrid(w, h, 0);

  for (let x = 0; x < w; x++) {
    setTile(colisoes, w, x, 0, 11);
    setTile(colisoes, w, x, h - 1, 11);
  }
  for (let y = 1; y < h - 1; y++) {
    setTile(colisoes, w, 0, y, 11);
    setTile(colisoes, w, w - 1, y, 11);
  }

  const midX = Math.floor(w / 2);
  fillRect(decoracao, w, midX - 2, 5, midX + 2, 7, 8);

  // Balcão de atendimento
  fillRect(colisoes, w, midX - 2, 3, midX + 2, 3, 22);

  // Alçapão secundário da ferraria
  if (hasTrapdoor) {
    setTile(decoracao, w, w - 3, 3, 16);
  }

  // Porta de saída
  setTile(colisoes, w, midX, h - 1, 15);

  const portals = [
    {
      id: 1,
      name: 'sair_cidade',
      type: 'portal',
      x: midX * TILE_SIZE,
      y: (h - 1) * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      properties: [
        { name: 'targetMap', type: 'string', value: exitTargetMap },
        { name: 'targetTileX', type: 'int', value: exitTileX },
        { name: 'targetTileY', type: 'int', value: exitTileY },
        { name: 'label', type: 'string', value: 'Sair para a Praça' },
      ],
    },
  ];

  const spawns = [
    {
      id: 2,
      name: 'default',
      type: 'spawn',
      x: midX * TILE_SIZE,
      y: (h - 3) * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
  ];

  return createMap({ width: w, height: h, chao, decoracao, colisoes, portals, spawns });
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, 'fazenda.json'), JSON.stringify(buildFazenda(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'casa.json'), JSON.stringify(buildCasa(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'porao.json'), JSON.stringify(buildPorao(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'arena_terra.json'), JSON.stringify(buildArenaTerra(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'arena_aguas.json'), JSON.stringify(buildArenaAguas(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'arena_ceus.json'), JSON.stringify(buildArenaCeus(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'arena_omena.json'), JSON.stringify(buildArenaOmena(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'cidade.json'), JSON.stringify(buildCidade(), null, 2));
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'ferraria.json'),
  JSON.stringify(
    buildInteriorShop({ exitTargetMap: 'cidade', exitTileX: 6, exitTileY: 6, floorGid: 7, hasTrapdoor: true }),
    null,
    2
  )
);
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'botica.json'),
  JSON.stringify(
    buildInteriorShop({ exitTargetMap: 'cidade', exitTileX: 14, exitTileY: 6, floorGid: 6 }),
    null,
    2
  )
);
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'pub_pedra.json'),
  JSON.stringify(
    buildInteriorShop({ exitTargetMap: 'cidade', exitTileX: 22, exitTileY: 6, width: 16, floorGid: 7 }),
    null,
    2
  )
);
console.log('Mapas Tiled gerados com sucesso em', OUTPUT_DIR);


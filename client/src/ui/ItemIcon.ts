import { getItemDef } from '../data/items';

const ICON_CACHE = new Map<string, string>();
let sheetAvailable = false;
let sheetChecked = false;

const SHEET_COLS = 8;
const SHEET_ROWS = 6;
const SHEET_URL = '/assets/sprites/items_icons.png';

export function probeItemIconSheet(onLoaded?: () => void): void {
  if (sheetChecked || typeof Image === 'undefined') return;
  sheetChecked = true;
  const img = new Image();
  img.onload = () => {
    if (img.naturalWidth >= 128 && img.naturalHeight >= 96) {
      sheetAvailable = true;
      onLoaded?.();
    }
  };
  img.onerror = () => {
    sheetAvailable = false;
  };
  img.src = SHEET_URL;
}

function withCanvas(draw: (ctx: CanvasRenderingContext2D) => void): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  return canvas.toDataURL('image/png');
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawTool(ctx: CanvasRenderingContext2D, kind: string): void {
  // Cabo diagonal comum para ferramentas com cabo
  const drawDiagonalHandle = (handleDark = '#6b4226', handleLight = '#9c663b') => {
    for (let i = 0; i < 16; i++) {
      px(ctx, 7 + i, 24 - i, 3, 3, '#1b1726');
      px(ctx, 7 + i, 24 - i, 2, 2, i % 3 === 0 ? handleDark : handleLight);
    }
  };

  if (kind === 'enxada_antiga') {
    drawDiagonalHandle();
    px(ctx, 18, 5, 9, 4, '#272336');
    px(ctx, 19, 6, 7, 2, '#94a3b8');
    px(ctx, 23, 8, 4, 6, '#272336');
    px(ctx, 24, 8, 2, 5, '#cbd5e1');
    px(ctx, 24, 12, 2, 2, '#d97706');
  } else if (kind === 'picareta_simples') {
    drawDiagonalHandle();
    px(ctx, 14, 5, 13, 4, '#272336');
    px(ctx, 15, 6, 11, 2, '#94a3b8');
    px(ctx, 13, 8, 4, 4, '#64748b');
    px(ctx, 24, 8, 4, 5, '#cbd5e1');
    px(ctx, 26, 12, 2, 2, '#4deeea');
  } else if (kind === 'machado_simples') {
    drawDiagonalHandle();
    px(ctx, 17, 5, 10, 9, '#272336');
    px(ctx, 18, 6, 6, 7, '#94a3b8');
    px(ctx, 23, 6, 3, 7, '#e2e8f0');
  } else if (kind === 'regador_simples') {
    px(ctx, 9, 13, 14, 12, '#1e293b');
    px(ctx, 10, 14, 12, 10, '#475569');
    px(ctx, 11, 15, 10, 4, '#94a3b8');
    px(ctx, 21, 10, 5, 5, '#64748b');
    px(ctx, 24, 8, 3, 3, '#4deeea');
    px(ctx, 5, 15, 5, 8, '#334155');
    px(ctx, 6, 16, 2, 6, '#14121d');
    px(ctx, 12, 9, 8, 5, '#64748b');
    px(ctx, 13, 10, 6, 3, '#14121d');
  } else if (kind === 'vara_pesca_simples') {
    for (let i = 0; i < 18; i++) {
      px(ctx, 6 + i, 25 - i, 2, 2, i < 5 ? '#7c4a2d' : '#c29b61');
    }
    px(ctx, 24, 8, 1, 12, '#cbd5e1');
    px(ctx, 23, 20, 3, 4, '#4deeea');
    px(ctx, 24, 21, 1, 2, '#f5b942');
  }
}

function drawStaff(ctx: CanvasRenderingContext2D, id: string): void {
  const palette: Record<string, { shaft: string; head: string; gem: string; aura: string }> = {
    cajado_aprendiz: { shaft: '#8b5e3c', head: '#5a3a24', gem: '#4deeea', aura: '#a5f3fc' },
    cajado_quartzo_terra: { shaft: '#b45309', head: '#78350f', gem: '#f5b942', aura: '#fde68a' },
    cajado_arcano_estelar: { shaft: '#4338ca', head: '#f59e0b', gem: '#c084fc', aura: '#f0abfc' },
    cetro_nucleo_mundo: { shaft: '#d97706', head: '#fef08a', gem: '#4deeea', aura: '#f43f5e' },
  };
  const p = palette[id] ?? { shaft: '#8b5e3c', head: '#5a3a24', gem: '#4deeea', aura: '#a5f3fc' };
  for (let i = 0; i < 17; i++) {
    px(ctx, 6 + i, 25 - i, 3, 3, '#14121d');
    px(ctx, 6 + i, 25 - i, 2, 2, p.shaft);
  }
  px(ctx, 19, 4, 9, 9, '#14121d');
  px(ctx, 20, 5, 7, 7, p.head);
  px(ctx, 21, 6, 5, 5, p.gem);
  px(ctx, 22, 7, 2, 2, p.aura);
  px(ctx, 17, 4, 2, 2, p.aura);
  px(ctx, 27, 13, 2, 2, p.aura);
}

function drawArmor(ctx: CanvasRenderingContext2D, id: string): void {
  const palette: Record<string, { main: string; shade: string; trim: string; gem: string }> = {
    tunica_neblina: { main: '#4a6b53', shade: '#2f4937', trim: '#7e8ce0', gem: '#4deeea' },
    armadura_granito_runico: { main: '#78716c', shade: '#44403c', trim: '#f59e0b', gem: '#4deeea' },
    manto_escama_dragao: { main: '#b91c1c', shade: '#7f1d1d', trim: '#f5b942', gem: '#fde047' },
  };
  const p = palette[id] ?? { main: '#4a6b53', shade: '#2f4937', trim: '#7e8ce0', gem: '#4deeea' };
  px(ctx, 7, 7, 18, 19, '#14121d');
  px(ctx, 5, 9, 22, 7, '#14121d');
  px(ctx, 6, 10, 5, 5, p.shade);
  px(ctx, 21, 10, 5, 5, p.shade);
  px(ctx, 9, 8, 14, 17, p.main);
  px(ctx, 10, 8, 12, 3, p.trim);
  px(ctx, 13, 7, 6, 3, '#14121d');
  px(ctx, 15, 13, 2, 6, p.trim);
  px(ctx, 14, 14, 4, 3, p.gem);
  px(ctx, 9, 21, 14, 2, p.trim);
}

function drawSeed(ctx: CanvasRenderingContext2D, accent: string, bg = '#d6cfc2'): void {
  px(ctx, 7, 6, 18, 20, '#14121d');
  px(ctx, 8, 7, 16, 18, bg);
  px(ctx, 8, 7, 16, 4, '#a89f91');
  px(ctx, 10, 12, 12, 10, '#f8fafc');
  px(ctx, 13, 14, 6, 6, accent);
  px(ctx, 15, 13, 2, 2, '#5bc26e');
}

function drawPotion(ctx: CanvasRenderingContext2D, liquid: string, highlight: string, ornate = false): void {
  px(ctx, 13, 5, 6, 4, '#8b5e3c');
  px(ctx, 12, 9, 8, 3, '#94a3b8');
  px(ctx, 8, 12, 16, 14, '#14121d');
  px(ctx, 9, 13, 14, 12, '#cbd5e1');
  px(ctx, 10, 16, 12, 8, liquid);
  px(ctx, 11, 15, 10, 3, highlight);
  px(ctx, 11, 18, 2, 4, '#ffffff');
  if (ornate) {
    px(ctx, 7, 14, 3, 4, '#f5b942');
    px(ctx, 22, 14, 3, 4, '#f5b942');
    px(ctx, 12, 25, 8, 2, '#f5b942');
  }
}

function drawItemPixelArt(itemId: string): string {
  return withCanvas((ctx) => {
    switch (itemId) {
      case 'enxada_antiga':
      case 'regador_simples':
      case 'picareta_simples':
      case 'machado_simples':
      case 'vara_pesca_simples':
        drawTool(ctx, itemId);
        break;
      case 'cajado_aprendiz':
      case 'cajado_quartzo_terra':
      case 'cajado_arcano_estelar':
      case 'cetro_nucleo_mundo':
        drawStaff(ctx, itemId);
        break;
      case 'tunica_neblina':
      case 'armadura_granito_runico':
      case 'manto_escama_dragao':
        drawArmor(ctx, itemId);
        break;
      case 'semente_raiz_quartzo':
        drawSeed(ctx, '#f472b6');
        break;
      case 'semente_lupulo_estelar':
        drawSeed(ctx, '#f5b942');
        break;
      case 'semente_flor_sombra':
        drawSeed(ctx, '#7c3aed', '#94a3b8');
        break;
      case 'raiz_de_quartzo':
        px(ctx, 12, 5, 8, 5, '#4ade80');
        px(ctx, 10, 10, 12, 13, '#f472b6');
        px(ctx, 12, 12, 8, 9, '#fbcfe8');
        px(ctx, 14, 23, 4, 4, '#db2777');
        break;
      case 'lupulo_estelar':
        px(ctx, 10, 8, 12, 15, '#1e3a8a');
        px(ctx, 11, 9, 10, 13, '#38bdf8');
        px(ctx, 13, 11, 6, 8, '#fde047');
        px(ctx, 15, 6, 2, 3, '#4ade80');
        break;
      case 'flor_de_sombra':
        px(ctx, 15, 16, 2, 10, '#312e81');
        px(ctx, 8, 8, 16, 10, '#4c1d95');
        px(ctx, 10, 9, 12, 8, '#8b5cf6');
        px(ctx, 14, 11, 4, 4, '#4deeea');
        break;
      case 'pedra':
        px(ctx, 7, 11, 18, 13, '#334155');
        px(ctx, 8, 12, 16, 10, '#64748b');
        px(ctx, 10, 13, 10, 4, '#94a3b8');
        break;
      case 'madeira':
        px(ctx, 6, 11, 20, 6, '#7c4a2d');
        px(ctx, 6, 17, 20, 6, '#5a341e');
        px(ctx, 7, 12, 4, 4, '#d6a574');
        px(ctx, 7, 18, 4, 4, '#c2905e');
        break;
      case 'prego':
        px(ctx, 10, 8, 12, 3, '#cbd5e1');
        px(ctx, 15, 11, 2, 14, '#94a3b8');
        px(ctx, 15, 23, 2, 3, '#e2e8f0');
        break;
      case 'minerio_cobre':
        px(ctx, 7, 10, 18, 14, '#475569');
        px(ctx, 10, 12, 5, 4, '#ea580c');
        px(ctx, 17, 16, 5, 4, '#f59e0b');
        px(ctx, 11, 18, 4, 3, '#fb923c');
        break;
      case 'barra_cobre':
        px(ctx, 6, 13, 20, 9, '#9a3412');
        px(ctx, 8, 11, 16, 7, '#ea580c');
        px(ctx, 10, 12, 12, 3, '#fdba74');
        break;
      case 'quartzo_bruto':
        px(ctx, 12, 6, 8, 18, '#e2e8f0');
        px(ctx, 8, 12, 6, 12, '#cbd5e1');
        px(ctx, 18, 13, 6, 11, '#f8fafc');
        px(ctx, 14, 8, 3, 10, '#ffffff');
        break;
      case 'quartzo_refinado':
        px(ctx, 15, 4, 2, 24, '#4deeea');
        px(ctx, 11, 8, 10, 16, '#a5f3fc');
        px(ctx, 13, 10, 6, 12, '#ffffff');
        break;
      case 'liga_estelar':
        px(ctx, 6, 13, 20, 9, '#1e1b4b');
        px(ctx, 8, 11, 16, 7, '#4f46e5');
        px(ctx, 10, 12, 12, 3, '#4deeea');
        px(ctx, 14, 13, 4, 2, '#f5b942');
        break;
      case 'ovo_mini_dragao':
        px(ctx, 10, 6, 12, 19, '#7f1d1d');
        px(ctx, 11, 8, 10, 15, '#dc2626');
        px(ctx, 13, 10, 6, 10, '#f59e0b');
        px(ctx, 12, 15, 7, 2, '#fef08a');
        break;
      case 'ovo_unicornio':
        px(ctx, 10, 6, 12, 19, '#6d28d9');
        px(ctx, 11, 8, 10, 15, '#e9d5ff');
        px(ctx, 13, 10, 6, 10, '#4deeea');
        px(ctx, 15, 13, 3, 3, '#fde047');
        break;
      case 'leite_unicornio':
        drawPotion(ctx, '#f8fafc', '#e9d5ff', false);
        px(ctx, 14, 18, 4, 3, '#4deeea');
        break;
      case 'incubadora_arcana':
        px(ctx, 7, 7, 18, 19, '#475569');
        px(ctx, 9, 9, 14, 11, '#0891b2');
        px(ctx, 11, 11, 10, 7, '#4deeea');
        px(ctx, 7, 23, 18, 3, '#f5b942');
        break;
      case 'bancada_fundicao':
        px(ctx, 6, 7, 20, 19, '#57534e');
        px(ctx, 10, 13, 12, 11, '#991b1b');
        px(ctx, 12, 16, 8, 7, '#f59e0b');
        px(ctx, 14, 18, 4, 4, '#fef08a');
        break;
      case 'bancada_encantamento':
        px(ctx, 6, 10, 20, 16, '#312e81');
        px(ctx, 8, 12, 16, 4, '#c084fc');
        px(ctx, 13, 5, 6, 6, '#4deeea');
        px(ctx, 9, 20, 14, 3, '#f5b942');
        break;
      case 'pocao_mana_menor':
        drawPotion(ctx, '#0284c7', '#4deeea', false);
        break;
      case 'pocao_energia_menor':
        drawPotion(ctx, '#16a34a', '#86efac', false);
        break;
      case 'pocao_cura_menor':
        drawPotion(ctx, '#dc2626', '#fda4af', false);
        break;
      case 'tonico_nevoa':
        drawPotion(ctx, '#7c3aed', '#4deeea', true);
        break;
      case 'elixir_solsticio':
        drawPotion(ctx, '#d97706', '#fef08a', true);
        break;
      case 'truta_nevoa':
        px(ctx, 7, 13, 16, 7, '#64748b');
        px(ctx, 9, 14, 12, 4, '#93c5fd');
        px(ctx, 23, 12, 4, 9, '#475569');
        px(ctx, 9, 15, 2, 2, '#14121d');
        break;
      case 'peixe_prisma':
        px(ctx, 7, 13, 16, 7, '#38bdf8');
        px(ctx, 10, 14, 4, 5, '#f472b6');
        px(ctx, 14, 14, 4, 5, '#fde047');
        px(ctx, 18, 14, 4, 5, '#4ade80');
        px(ctx, 23, 12, 4, 9, '#c084fc');
        px(ctx, 9, 15, 2, 2, '#14121d');
        break;
      case 'moldes_protetor':
        px(ctx, 7, 8, 18, 16, '#b45309');
        px(ctx, 9, 10, 14, 12, '#fde68a');
        px(ctx, 11, 13, 10, 2, '#0284c7');
        px(ctx, 11, 17, 7, 2, '#0284c7');
        break;
      case 'camera_rafael':
        px(ctx, 6, 10, 20, 13, '#1e293b');
        px(ctx, 10, 7, 7, 3, '#475569');
        px(ctx, 12, 12, 8, 8, '#0f172a');
        px(ctx, 13, 13, 6, 6, '#38bdf8');
        px(ctx, 15, 14, 2, 2, '#e0f2fe');
        break;
      case 'fragmento_diario':
        px(ctx, 8, 6, 16, 20, '#d6cfc2');
        px(ctx, 10, 9, 12, 2, '#3b82f6');
        px(ctx, 10, 13, 10, 2, '#4deeea');
        px(ctx, 10, 17, 8, 2, '#6366f1');
        break;
      case 'lambari_quartzo':
        px(ctx, 7, 13, 14, 7, '#7dd3fc');
        px(ctx, 20, 11, 5, 11, '#38bdf8');
        px(ctx, 10, 15, 2, 2, '#0f172a');
        px(ctx, 14, 14, 4, 2, '#e0f2fe');
        break;
      case 'bagre_telurico':
        px(ctx, 6, 12, 16, 9, '#a78bfa');
        px(ctx, 21, 10, 5, 13, '#7e8ce0');
        px(ctx, 8, 18, 4, 2, '#f5b942');
        px(ctx, 9, 14, 2, 2, '#0f172a');
        break;
      case 'aspersor_bavario':
        px(ctx, 10, 14, 12, 12, '#b45309');
        px(ctx, 12, 8, 8, 6, '#38bdf8');
        px(ctx, 8, 9, 4, 2, '#7dd3fc');
        px(ctx, 20, 9, 4, 2, '#7dd3fc');
        break;
      default:
        px(ctx, 8, 8, 16, 16, '#7e8ce0');
        break;
    }
  });
}

export function getItemIconDataUrl(itemId: string): string {
  const cached = ICON_CACHE.get(itemId);
  if (cached) return cached;
  const url = drawItemPixelArt(itemId);
  ICON_CACHE.set(itemId, url);
  return url;
}

export function renderItemIconHtml(itemId: string, size = 32, extraClass = ''): string {
  const def = getItemDef(itemId);
  const intSize = Math.max(16, Math.round(size));
  if (sheetAvailable && def) {
    const col = def.iconFrame % SHEET_COLS;
    const row = Math.floor(def.iconFrame / SHEET_COLS);
    const posX = SHEET_COLS > 1 ? (col / (SHEET_COLS - 1)) * 100 : 0;
    const posY = SHEET_ROWS > 1 ? (row / (SHEET_ROWS - 1)) * 100 : 0;
    return `<span class="item-icon-sprite ${extraClass}" style="width:${intSize}px;height:${intSize}px;background-image:url('${SHEET_URL}');background-size:${SHEET_COLS * 100}% ${SHEET_ROWS * 100}%;background-position:${posX}% ${posY}%" aria-hidden="true"></span>`;
  }

  const src = getItemIconDataUrl(itemId);
  const label = def?.name ?? itemId;
  return `<img class="item-icon-img ${extraClass}" src="${src}" alt="${label}" width="${intSize}" height="${intSize}" style="image-rendering:pixelated" draggable="false" />`;
}

export function getCategoryLabelPt(category: string): string {
  switch (category) {
    case 'tool':
      return 'Ferramenta';
    case 'weapon':
      return 'Cajado / Arma';
    case 'armor':
      return 'Roupa / Armadura';
    case 'seed':
      return 'Semente';
    case 'crop':
      return 'Safra';
    case 'consumable':
      return 'Poção / Elixir';
    case 'placeable':
      return 'Estrutura';
    case 'egg':
      return 'Ovo Mágico';
    case 'resource':
    default:
      return 'Recurso';
  }
}


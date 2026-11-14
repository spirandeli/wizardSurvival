import { getItemDef } from '../data/items';
import { renderItemIconHtml } from './ItemIcon';

const UI_SHEET_URL = '/assets/ui/ui_icons.png';
const UI_EXT_SHEET_URL = '/assets/ui/ui_icons_ext.png';
const UI_V4_ICONS_URL = '/assets/ui/v4_quality_buff_icons.png';
const UI_SHEET_COLS = 4;
const UI_SHEET_ROWS = 4;
let uiSheetAvailable = false;
let uiExtSheetAvailable = false;
let uiV4SheetAvailable = false;
let uiSheetChecked = false;

export function probeUiIconSheet(onLoaded?: () => void): void {
  if (uiSheetChecked || typeof Image === 'undefined') return;
  uiSheetChecked = true;
  const img = new Image();
  img.onload = () => {
    if (img.naturalWidth >= 128 && img.naturalHeight >= 128) {
      uiSheetAvailable = true;
      onLoaded?.();
    }
  };
  img.onerror = () => {
    uiSheetAvailable = false;
  };
  img.src = UI_SHEET_URL;

  const extImg = new Image();
  extImg.onload = () => {
    if (extImg.naturalWidth >= 128 && extImg.naturalHeight >= 128) {
      uiExtSheetAvailable = true;
      onLoaded?.();
    }
  };
  extImg.onerror = () => {
    uiExtSheetAvailable = false;
  };
  extImg.src = UI_EXT_SHEET_URL;

  const v4Img = new Image();
  v4Img.onload = () => {
    if (v4Img.naturalWidth >= 128 && v4Img.naturalHeight >= 64) {
      uiV4SheetAvailable = true;
      onLoaded?.();
    }
  };
  v4Img.onerror = () => {
    uiV4SheetAvailable = false;
  };
  v4Img.src = UI_V4_ICONS_URL;
}

function renderSheetIcon(
  url: string,
  frame: number,
  size = 16,
  cols = UI_SHEET_COLS,
  rows = UI_SHEET_ROWS
): string {
  const col = frame % cols;
  const row = Math.floor(frame / cols);
  const posX = cols > 1 ? (col / (cols - 1)) * 100 : 0;
  const posY = rows > 1 ? (row / (rows - 1)) * 100 : 0;
  return `<span class="ui-icon-sprite" style="width:${size}px;height:${size}px;background-image:url('${url}');background-size:${cols * 100}% ${rows * 100}%;background-position:${posX}% ${posY}%" aria-hidden="true"></span>`;
}

function renderUiSheetIcon(frame: number, size = 16): string {
  return renderSheetIcon(UI_SHEET_URL, frame, size);
}

function renderUiExtSheetIcon(frame: number, size = 16): string {
  return renderSheetIcon(UI_EXT_SHEET_URL, frame, size);
}

export function getBuffIconHtml(buffId: 'brisa' | 'folego' | 'harmonia', size = 16): string {
  if (uiV4SheetAvailable) {
    const frameMap: Record<'brisa' | 'folego' | 'harmonia', number> = {
      brisa: 4,
      folego: 5,
      harmonia: 6,
    };
    return renderSheetIcon(UI_V4_ICONS_URL, frameMap[buffId], size, 4, 2);
  }
  return buffId === 'brisa' ? '⚡' : buffId === 'folego' ? '⛏️' : '✨';
}

export function getMeteorIconHtml(size = 16): string {
  if (uiV4SheetAvailable) {
    return renderSheetIcon(UI_V4_ICONS_URL, 3, size, 4, 2);
  }
  return '☄️';
}

export function getMoonSvg(phase: string): string {
  if (uiSheetAvailable) {
    const frameMap: Record<string, number> = {
      Nova: 0,
      Crescente: 1,
      Cheia: 2,
      Minguante: 3,
    };
    return renderUiSheetIcon(frameMap[phase] ?? 3, 16);
  }
  switch (phase) {
    case 'Nova':
      return `<svg viewBox="0 0 16 16" class="ui-svg-icon"><circle cx="8" cy="8" r="6" fill="#231f36" stroke="#7e8ce0" stroke-width="1.4"/></svg>`;
    case 'Crescente':
      return `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M9.8 2.2a6 6 0 1 0 3.9 9.5 4.6 4.6 0 0 1-3.9-9.5z" fill="#e2e8f0" stroke="#475569" stroke-width="1"/></svg>`;
    case 'Cheia':
      return `<svg viewBox="0 0 16 16" class="ui-svg-icon"><circle cx="8" cy="8" r="6" fill="#fef08a" stroke="#d97706" stroke-width="1.2"/><circle cx="6" cy="6" r="1.2" fill="#fde047"/></svg>`;
    case 'Minguante':
    default:
      return `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M6.2 2.2a6 6 0 1 1-3.9 9.5 4.6 4.6 0 0 0 3.9-9.5z" fill="#c4b5fd" stroke="#5b21b6" stroke-width="1"/></svg>`;
  }
}

export function getWeatherSvg(weather: string): string {
  if (uiSheetAvailable) {
    const frameMap: Record<string, number> = {
      Ensolarado: 4,
      Chuva: 5,
      Neblina: 6,
      Nublado: 7,
    };
    return renderUiSheetIcon(frameMap[weather] ?? 7, 16);
  }
  switch (weather) {
    case 'Ensolarado':
      return `<svg viewBox="0 0 16 16" class="ui-svg-icon"><circle cx="8" cy="8" r="3.6" fill="#f5b942"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" stroke="#f5b942" stroke-width="1.4" stroke-linecap="square"/></svg>`;
    case 'Chuva':
      return `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M4 10h8a2.5 2.5 0 0 0 .2-5 3.6 3.6 0 0 0-7-.6A2.6 2.6 0 0 0 4 10z" fill="#94a3b8"/><path d="M5 12l-1 2.5M8.5 12l-1 2.5M12 12l-1 2.5" stroke="#4deeea" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    case 'Neblina':
      return `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M2 5h10M4 8.5h10M2.5 12h9" stroke="#a78bfa" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'Nublado':
    default:
      return `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M4 11h8.2a2.5 2.5 0 0 0 .2-5 3.6 3.6 0 0 0-7-.6A2.6 2.6 0 0 0 4 11z" fill="#cbd5e1"/></svg>`;
  }
}

const UI_SVG_FALLBACKS = {
  heart: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M8 14s-5.5-3.4-5.5-7.4A3.2 3.2 0 0 1 8 4.4a3.2 3.2 0 0 1 5.5 2.2C13.5 10.6 8 14 8 14z" fill="#e05263" stroke="#881337" stroke-width="1"/></svg>`,
  stamina: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M9.5 1.5L4 9h4l-1.5 5.5L12 7H8l1.5-5.5z" fill="#5bc26e" stroke="#14532d" stroke-width="1"/></svg>`,
  mana: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><polygon points="8,1.5 13,8 8,14.5 3,8" fill="#4deeea" stroke="#0e7490" stroke-width="1"/><polygon points="8,4 10.5,8 8,12 5.5,8" fill="#cffafe"/></svg>`,
  gold: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><circle cx="8" cy="8" r="5.8" fill="#f5b942" stroke="#92400e" stroke-width="1.2"/><rect x="7" y="4.5" width="2" height="7" fill="#fef08a"/></svg>`,
  dragon: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M3 11L5 5l3 2 3-2 2 6-5 3-5-3z" fill="#ef4444" stroke="#7f1d1d" stroke-width="1"/><circle cx="6.2" cy="8.5" r="1" fill="#fef08a"/><circle cx="9.8" cy="8.5" r="1" fill="#fef08a"/></svg>`,
  unicorn: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><polygon points="8,1 9.5,5 6.5,5" fill="#f5b942"/><circle cx="8" cy="9" r="4.5" fill="#f8fafc" stroke="#c084fc" stroke-width="1.1"/><circle cx="6.8" cy="8.5" r="0.8" fill="#312e81"/><circle cx="9.2" cy="8.5" r="0.8" fill="#312e81"/></svg>`,
  bag: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><rect x="3" y="5" width="10" height="9" rx="2" fill="#9c663b" stroke="#2c1810" stroke-width="1.2"/><path d="M5.5 5V3.5a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="#d6cfc2" stroke-width="1.4"/><rect x="6.5" y="8" width="3" height="2.2" fill="#f5b942"/></svg>`,
  craft: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M2 7h12v2.5H10l1.5 4h-7l1.5-4H2V7z" fill="#94a3b8" stroke="#1e293b" stroke-width="1"/><rect x="6" y="3" width="4" height="2.5" fill="#f59e0b"/></svg>`,
  quest: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><rect x="3" y="2.5" width="10" height="11" rx="1.5" fill="#581c87" stroke="#f5b942" stroke-width="1.2"/><path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="#4deeea" stroke-width="1.2"/></svg>`,
  teleport: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><circle cx="8" cy="8" r="5.5" fill="none" stroke="#4deeea" stroke-width="1.4"/><polygon points="8,3.2 12,11 4,11" fill="none" stroke="#c084fc" stroke-width="1.2"/><circle cx="8" cy="8.5" r="1.4" fill="#4deeea"/></svg>`,
  soundOn: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M2.5 6.2h2.8L9 3.3v9.4L5.3 9.8H2.5z" fill="#d6cfc2"/><path d="M11 5.5a4 4 0 0 1 0 5M12.8 4a6.2 6.2 0 0 1 0 8" fill="none" stroke="#4deeea" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M2.5 6.2h2.8L9 3.3v9.4L5.3 9.8H2.5z" fill="#94a3b8"/><path d="M11 6l3 4M14 6l-3 4" stroke="#e05263" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  save: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M3 2.5h8.5L13.5 4.5V13.5H3z" fill="#7e8ce0" stroke="#1e1b4b" stroke-width="1.1"/><rect x="5" y="2.5" width="5" height="4" fill="#f8fafc"/><rect x="5" y="9" width="6" height="4.5" fill="#1e1b4b"/></svg>`,
  villagers: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M8 14s-5.5-3.4-5.5-7.4A3.2 3.2 0 0 1 8 4.4a3.2 3.2 0 0 1 5.5 2.2C13.5 10.6 8 14 8 14z" fill="#e05263" stroke="#881337" stroke-width="1"/></svg>`,
  grimoire: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><rect x="3" y="2" width="10" height="12" rx="1.5" fill="#312e81" stroke="#4deeea" stroke-width="1.1"/><path d="M8 5l1 2.2L11.2 8 9 8.8 8 11l-1-2.2L4.8 8 7 7.2z" fill="#4deeea"/></svg>`,
  compendium: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M2 3.5h5.5v9.5H2zM8.5 3.5H14v9.5H8.5z" fill="#d6cfc2" stroke="#92400e" stroke-width="1.1"/></svg>`,
  pin: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><circle cx="8" cy="5.5" r="3" fill="#f5b942" stroke="#92400e" stroke-width="1"/><path d="M8 8.5v5.5" stroke="#d6cfc2" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  trash: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><path d="M4 4h8l-.8 9.5H4.8z" fill="#9c663b" stroke="#2c1810" stroke-width="1.1"/><path d="M3 4h10M6.5 2.5h3" stroke="#d6cfc2" stroke-width="1.2"/></svg>`,
  egg: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><ellipse cx="8" cy="8.5" rx="4.5" ry="5.8" fill="#fef08a" stroke="#92400e" stroke-width="1.1"/><circle cx="6.8" cy="7" r="1" fill="#ef4444"/><circle cx="9.2" cy="9.5" r="1.1" fill="#4deeea"/></svg>`,
  star: `<svg viewBox="0 0 16 16" class="ui-svg-icon"><polygon points="8,1.5 9.8,5.8 14.5,6.2 10.9,9.2 12,13.8 8,11.3 4,13.8 5.1,9.2 1.5,6.2 6.2,5.8" fill="#f5b942" stroke="#92400e" stroke-width="1"/></svg>`,
};

const UI_SVG_FRAMES: Partial<Record<keyof typeof UI_SVG_FALLBACKS, number>> = {
  gold: 8,
  heart: 9,
  stamina: 10,
  mana: 11,
  bag: 12,
  craft: 13,
  quest: 14,
  teleport: 15,
};

const UI_EXT_SVG_FRAMES: Partial<Record<keyof typeof UI_SVG_FALLBACKS, number>> = {
  villagers: 0,
  grimoire: 1,
  compendium: 2,
  pin: 3,
  soundOn: 4,
  soundOff: 5,
  save: 6,
  trash: 7,
  dragon: 8,
  unicorn: 9,
  egg: 10,
  star: 11,
};

export const UI_SVG: typeof UI_SVG_FALLBACKS = new Proxy(UI_SVG_FALLBACKS, {
  get(target, prop: string | symbol) {
    if (typeof prop === 'string') {
      const key = prop as keyof typeof UI_SVG_FALLBACKS;
      if (uiSheetAvailable) {
        const frame = UI_SVG_FRAMES[key];
        if (typeof frame === 'number') {
          return renderUiSheetIcon(frame, 16);
        }
      }
      if (uiExtSheetAvailable) {
        const extFrame = UI_EXT_SVG_FRAMES[key];
        if (typeof extFrame === 'number') {
          return renderUiExtSheetIcon(extFrame, 16);
        }
      }
    }
    return target[prop as keyof typeof UI_SVG_FALLBACKS];
  },
});

export function renderGuardianPaperDollSvg(
  weaponId: string | null,
  armorId: string | null
): string {
  const armorDef = armorId ? getItemDef(armorId) : undefined;
  const weaponDef = weaponId ? getItemDef(weaponId) : undefined;

  let robeAura = 'rgba(77, 238, 234, 0.14)';

  if (armorId === 'tunica_neblina') {
    robeAura = 'rgba(126, 140, 224, 0.22)';
  } else if (armorId === 'armadura_granito_runico') {
    robeAura = 'rgba(245, 158, 11, 0.24)';
  } else if (armorId === 'manto_escama_dragao') {
    robeAura = 'rgba(239, 68, 68, 0.28)';
  } else if (!armorDef) {
    robeAura = 'rgba(148, 163, 184, 0.1)';
  }

  const armorColor = armorDef?.visualColor ?? '#64748b';
  const weaponColor = weaponDef?.visualColor ?? '#4deeea';
  const armorOverlayRow =
    armorId === 'tunica_neblina'
      ? 0
      : armorId === 'armadura_granito_runico'
      ? 1
      : armorId === 'manto_escama_dragao'
      ? 2
      : null;

  return `
    <div class="paperdoll-pixel-stage" style="--armor-aura:${robeAura};--armor-accent:${armorColor};--weapon-accent:${weaponColor}" aria-label="Avatar do Guardião Tomé">
      <div class="paperdoll-aura-disc"></div>
      <div class="paperdoll-player-sprite" role="img" aria-label="Tomé em pixel art"></div>
      ${
        armorOverlayRow !== null
          ? `<div class="paperdoll-armor-overlay" style="background-position: 0% ${(armorOverlayRow / 5) * 100}%" aria-hidden="true"></div>`
          : ''
      }
      <img class="paperdoll-portrait-badge" src="/assets/portraits/tome.png" alt="Retrato de Tomé" width="48" height="48" draggable="false" />
      ${
        weaponDef
          ? `<div class="paperdoll-gear-badge weapon" title="${weaponDef.name}">${renderItemIconHtml(weaponDef.id, 24)}</div>`
          : ''
      }
      ${
        armorDef
          ? `<div class="paperdoll-gear-badge armor" title="${armorDef.name}">${renderItemIconHtml(armorDef.id, 24)}</div>`
          : ''
      }
    </div>
  `;
}


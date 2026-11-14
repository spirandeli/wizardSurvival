import { getItemDef } from '../data/items';

const UI_SHEET_URL = '/assets/ui/ui_icons.png';
const UI_SHEET_COLS = 4;
const UI_SHEET_ROWS = 4;
let uiSheetAvailable = false;
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
}

function renderUiSheetIcon(frame: number, size = 16): string {
  const col = frame % UI_SHEET_COLS;
  const row = Math.floor(frame / UI_SHEET_COLS);
  const posX = UI_SHEET_COLS > 1 ? (col / (UI_SHEET_COLS - 1)) * 100 : 0;
  const posY = UI_SHEET_ROWS > 1 ? (row / (UI_SHEET_ROWS - 1)) * 100 : 0;
  return `<span class="ui-icon-sprite" style="width:${size}px;height:${size}px;background-image:url('${UI_SHEET_URL}');background-size:${UI_SHEET_COLS * 100}% ${UI_SHEET_ROWS * 100}%;background-position:${posX}% ${posY}%" aria-hidden="true"></span>`;
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

export const UI_SVG: typeof UI_SVG_FALLBACKS = new Proxy(UI_SVG_FALLBACKS, {
  get(target, prop: string | symbol) {
    if (typeof prop === 'string' && uiSheetAvailable) {
      const frame = UI_SVG_FRAMES[prop as keyof typeof UI_SVG_FALLBACKS];
      if (typeof frame === 'number') {
        return renderUiSheetIcon(frame, 16);
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

  let robeMain = '#3f7558';
  let robeTrim = '#f5b942';
  let robeAura = 'rgba(77, 238, 234, 0.14)';

  if (armorId === 'tunica_neblina') {
    robeMain = '#4a6b53';
    robeTrim = '#7e8ce0';
    robeAura = 'rgba(126, 140, 224, 0.22)';
  } else if (armorId === 'armadura_granito_runico') {
    robeMain = '#78716c';
    robeTrim = '#f59e0b';
    robeAura = 'rgba(245, 158, 11, 0.24)';
  } else if (armorId === 'manto_escama_dragao') {
    robeMain = '#991b1b';
    robeTrim = '#f5b942';
    robeAura = 'rgba(239, 68, 68, 0.28)';
  } else if (!armorDef) {
    robeMain = '#3a3552';
    robeTrim = '#64748b';
    robeAura = 'rgba(148, 163, 184, 0.1)';
  }

  const staffGem = weaponDef?.visualColor ?? '#4deeea';

  return `
    <svg viewBox="0 0 96 108" class="paperdoll-svg" aria-label="Avatar do Guardião Tomé">
      <ellipse cx="48" cy="96" rx="28" ry="7" fill="${robeAura}" />
      <!-- Cabelo e Rosto -->
      <rect x="34" y="14" width="28" height="22" rx="4" fill="#f2c9a0" stroke="#1b1726" stroke-width="2"/>
      <path d="M32 22c0-8 7-13 16-13s16 5 16 13l-3-4-5 2-6-3-6 3-5-2z" fill="#231c2e" stroke="#1b1726" stroke-width="1.5"/>
      <rect x="40" y="25" width="3" height="4" fill="#14121d"/>
      <rect x="53" y="25" width="3" height="4" fill="#14121d"/>
      <!-- Tronco / Roupa equipada -->
      <path d="M29 40h38l4 32H25z" fill="${robeMain}" stroke="#1b1726" stroke-width="2" stroke-linejoin="round"/>
      <rect x="31" y="40" width="34" height="5" fill="${robeTrim}"/>
      <rect x="30" y="59" width="36" height="4" fill="${robeTrim}"/>
      <rect x="44" y="47" width="8" height="8" rx="1.5" fill="${robeTrim}" opacity="0.9"/>
      <!-- Braços -->
      <rect x="21" y="42" width="8" height="18" rx="2" fill="${robeMain}" stroke="#1b1726" stroke-width="1.8"/>
      <rect x="67" y="42" width="8" height="18" rx="2" fill="${robeMain}" stroke="#1b1726" stroke-width="1.8"/>
      <!-- Botas -->
      <rect x="34" y="72" width="10" height="18" rx="2" fill="#4a2c18" stroke="#1b1726" stroke-width="2"/>
      <rect x="52" y="72" width="10" height="18" rx="2" fill="#4a2c18" stroke="#1b1726" stroke-width="2"/>
      ${
        weaponDef
          ? `
        <!-- Cajado equipado na mão direita -->
        <line x1="76" y1="88" x2="82" y2="18" stroke="#8b5e3c" stroke-width="4" stroke-linecap="round"/>
        <circle cx="82" cy="18" r="7" fill="#1b1726"/>
        <circle cx="82" cy="18" r="5" fill="${staffGem}"/>
        <circle cx="80.5" cy="16.5" r="2" fill="#ffffff" opacity="0.85"/>
      `
          : ''
      }
    </svg>
  `;
}


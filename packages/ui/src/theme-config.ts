/** Framework-independent theme values. No remote fonts, document access or CSS input. */
export type ThemeMode = 'light' | 'dark';
export type ThemeTypography = 'standard' | 'geometric' | 'system';
export type ThemeDensity = 'compact' | 'comfortable' | 'spacious';
export type ThemeShadow = 'flat' | 'soft' | 'raised';

export interface ThemeConfig {
  accent: string;
  /** Factory defaults adapt to dark mode; custom primary colours keep their hue. */
  primary: string;
  typography: ThemeTypography;
  /** Control corner radius in whole CSS pixels, from 0 to 16. */
  radius: number;
  density: ThemeDensity;
  shadow: ThemeShadow;
}

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
  config: Readonly<ThemeConfig>;
}

export interface ThemeContrast {
  label: string;
  foreground: string;
  background: string;
  /** WCAG relative-luminance ratio; do not round before checking the threshold. */
  ratio: number;
  passes: boolean;
}

export type ThemeTokens = Record<`--bui-${string}`, string>;

export const DEFAULT_THEME: Readonly<ThemeConfig> = Object.freeze({
  accent: '#ffd900', primary: '#171717', typography: 'standard',
  radius: 4, density: 'comfortable', shadow: 'soft',
});

export const THEME_PRESETS: readonly ThemePreset[] = Object.freeze([
  Object.freeze({ id: 'bld8', label: 'BLD8', description: 'Golden yellow, champagne feedback and evergreen data shades.', config: DEFAULT_THEME }),
  Object.freeze({ id: 'cobalt', label: 'Cobalt', description: 'Cobalt accents, geometric type and compact spacing.', config: Object.freeze({ ...DEFAULT_THEME, accent: '#3859b8', primary: '#24314d', typography: 'geometric' as const, radius: 6, density: 'compact' as const }) }),
  Object.freeze({ id: 'sage', label: 'Sage', description: 'Fresh green, open spacing and flat surfaces.', config: Object.freeze({ ...DEFAULT_THEME, accent: '#a8c5ae', primary: '#2c4237', typography: 'system' as const, radius: 10, density: 'spacious' as const, shadow: 'flat' as const }) }),
]);

/** Named fonts are optional, self-hosted assets; every export also has system fallbacks. */
export const THEME_TYPOGRAPHY: readonly {
  value: ThemeTypography; label: string; description: string; font: string; heading: string;
}[] = Object.freeze([
  Object.freeze({ value: 'standard' as const, label: 'DM Sans + Manrope', description: 'The original body and heading pairing.', font: '"DM Sans", Arial, sans-serif', heading: '"Manrope", Arial, sans-serif' }),
  Object.freeze({ value: 'geometric' as const, label: 'Manrope', description: 'One geometric family for body and headings.', font: '"Manrope", Arial, sans-serif', heading: '"Manrope", Arial, sans-serif' }),
  Object.freeze({ value: 'system' as const, label: 'System', description: 'Use the fonts already available on each device.', font: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', heading: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }),
]);

const CONFIG_KEYS = ['accent', 'primary', 'typography', 'radius', 'density', 'shadow'] as const;
const MAX_SERIALIZED_LENGTH = 1024;
const hasOwn = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const ownValue = (value: Record<string, unknown>, key: string) => hasOwn(value, key) ? value[key] : undefined;

/** Accept only opaque #RGB/#RRGGBB colours, never CSS expressions or alpha. */
export function normalizeThemeHexColor(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 32) return null;
  const hex = value.trim().toLowerCase();
  if (/^#[a-f0-9]{6}$/.test(hex)) return hex;
  if (/^#[a-f0-9]{3}$/.test(hex)) return '#' + [...hex.slice(1)].map(character => character + character).join('');
  return null;
}

/** Normalize partial drafts; invalid fields reset independently and radius is clamped. */
export function normalizeThemeConfig(input: unknown): ThemeConfig {
  const value = isRecord(input) ? input : {};
  const typography = ownValue(value, 'typography');
  const density = ownValue(value, 'density');
  const shadow = ownValue(value, 'shadow');
  const radius = ownValue(value, 'radius');
  return {
    accent: normalizeThemeHexColor(ownValue(value, 'accent')) ?? DEFAULT_THEME.accent,
    primary: normalizeThemeHexColor(ownValue(value, 'primary')) ?? DEFAULT_THEME.primary,
    typography: typography === 'standard' || typography === 'geometric' || typography === 'system' ? typography : DEFAULT_THEME.typography,
    radius: typeof radius === 'number' && Number.isFinite(radius) ? Math.min(16, Math.max(0, Math.round(radius))) : DEFAULT_THEME.radius,
    density: density === 'compact' || density === 'comfortable' || density === 'spacious' ? density : DEFAULT_THEME.density,
    shadow: shadow === 'flat' || shadow === 'soft' || shadow === 'raised' ? shadow : DEFAULT_THEME.shadow,
  };
}

/** Raw, versioned JSON intended for URLSearchParams.set('theme', value). */
export function serializeThemeConfig(input: unknown): string {
  return JSON.stringify({ version: 1, ...normalizeThemeConfig(input) });
}

/** Reject corrupt/unsupported URLs as a whole, rather than showing a misleading partial theme. */
export function parseThemeConfig(text: string | null): ThemeConfig | null {
  if (typeof text !== 'string' || text.length > MAX_SERIALIZED_LENGTH) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (!isRecord(value) || value.version !== 1 || Object.keys(value).length !== CONFIG_KEYS.length + 1 ||
      !Object.keys(value).every(key => key === 'version' || CONFIG_KEYS.some(field => field === key)) ||
      !CONFIG_KEYS.every(key => hasOwn(value, key))) return null;
    const normalized = normalizeThemeConfig(value);
    if (normalizeThemeHexColor(value.accent) === null || normalizeThemeHexColor(value.primary) === null ||
      typeof value.radius !== 'number' || !Number.isInteger(value.radius) || value.radius < 0 || value.radius > 16 ||
      value.typography !== normalized.typography || value.density !== normalized.density || value.shadow !== normalized.shadow) return null;
    return normalized;
  } catch {
    return null;
  }
}

function channels(hex: string): number[] {
  return [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
}

function luminance(hex: string): number {
  const [red, green, blue] = channels(hex).map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG text contrast for opaque sRGB hex colours. Invalid colour syntax throws. */
export function contrastRatio(foreground: string, background: string): number {
  const first = normalizeThemeHexColor(foreground), second = normalizeThemeHexColor(background);
  if (!first || !second) throw new Error('Contrast requires opaque hex colours.');
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function mix(first: string, second: string, amount: number): string {
  const end = channels(second);
  return '#' + channels(first).map((channel, index) => Math.round(channel + (end[index] - channel) * amount).toString(16).padStart(2, '0')).join('');
}

function textFor(background: string, preferWhite = false): string {
  const candidates = preferWhite ? ['#ffffff', '#171717', '#000000'] : ['#171717', '#ffffff', '#000000'];
  // Black or white always meets 4.5:1 for an opaque sRGB background.
  return candidates.find(candidate => contrastRatio(candidate, background) >= 4.5)!;
}

function hoverFor(background: string, foreground: string, lighten = false): string {
  const preferred = mix(background, lighten ? '#ffffff' : '#000000', 0.12);
  if (contrastRatio(foreground, preferred) >= 4.5) return preferred;
  const alternate = mix(background, lighten ? '#000000' : '#ffffff', 0.12);
  return contrastRatio(foreground, alternate) >= 4.5 ? alternate : background;
}

function visibleAgainst(color: string, backgrounds: readonly string[], dark: boolean, threshold = 3): string {
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(color, dark ? '#ffffff' : '#000000', step / 20);
    if (backgrounds.every(background => contrastRatio(candidate, background) >= threshold)) return candidate;
  }
  return dark ? '#ffffff' : '#000000';
}



/** Follow one hue through lighter and deeper data shades, keeping every stroke visible. */
function dataShade(color: string, backgrounds: readonly string[], dark: boolean, threshold: number): string {
  const at = (position: number) => {
    const value = dark ? 1 - position : position;
    return value <= 0.5 ? mix(color, '#ffffff', 1 - value * 2) : mix(color, '#000000', value * 2 - 1);
  };
  let low = 0, high = 1;
  for (let step = 0; step < 28; step++) {
    const middle = (low + high) / 2;
    if (backgrounds.every(background => contrastRatio(at(middle), background) >= threshold)) high = middle;
    else low = middle;
  }
  return at(high);
}

const BASE_LIGHT: ThemeTokens = {
  "--bui-canvas": "#eeede9",
  "--bui-bg": "#ffffff",
  "--bui-surface": "#f6f5f1",
  "--bui-raised": "#e4e2dc",
  "--bui-ink": "#171717",
  "--bui-muted": "#62615d",
  "--bui-line": "#d9d6ce",
  "--bui-primary": "#171717",
  "--bui-primary-hover": "#333333",
  "--bui-primary-ink": "#ffffff",
  "--bui-accent": "#ffd900",
  "--bui-accent-hover": "#d5ba28",
  "--bui-accent-ink": "#171717",
  "--bui-accent-border": "#8b6d18",
  "--bui-focus": "#71571b",
  "--bui-soft": "#fdf8e0",
  "--bui-selected-bg": "#fdf7d9",
  "--bui-selected-hover": "#fbf3c4",
  "--bui-selected-ink": "#604c20",
  "--bui-selected-marker": "#9e7b1f",
  "--bui-shadow-selected": "inset 0 0 0 1px #7c611511",
  "--bui-danger": "#b04432",
  "--bui-danger-bg": "#fff0eb",
  "--bui-success": "#2e6546",
  "--bui-success-bg": "#edf5ef",
  "--bui-warning": "#805c06",
  "--bui-warning-bg": "#fff6d8",
  "--bui-radius": "4px",
  "--bui-overlay-radius": "8px",
  "--bui-panel-radius": "12px",
  "--bui-space-1": "4px",
  "--bui-space-2": "8px",
  "--bui-space-3": "12px",
  "--bui-space-4": "16px",
  "--bui-space-5": "20px",
  "--bui-space-6": "24px",
  "--bui-space-8": "32px",
  "--bui-space-12": "48px",
  "--bui-control-sm": "36px",
  "--bui-control-md": "44px",
  "--bui-control-lg": "48px",
  "--bui-group-input-height": "var(--bui-control-md)",
  "--bui-button-sheen": "none",
  "--bui-button-pressed-tint": "none",
  "--bui-text-control": "14px",
  "--bui-text-label": "13px",
  "--bui-text-meta": "12px",
  "--bui-border-hover": "#aaa69c",
  "--bui-shadow-choice": "var(--bui-shadow-switch)",
  "--bui-shadow-choice-hover": "var(--bui-shadow-switch)",
  "--bui-switch-track": "#d1cec5",
  "--bui-switch-thumb": "#171717",
  "--bui-shadow-switch": "inset 0 1px 3px #302a1433, inset 0 -1px 1px #ffffff80",
  "--bui-shadow-switch-on": "var(--bui-shadow-switch-active)",
  "--bui-shadow-switch-thumb": "0 2px 3px #17171730, inset 0 1px 1px #ffffff33, inset 0 -1px 2px #00000066",
  "--bui-shadow-switch-thumb-hover": "0 3px 6px #17171738, inset 0 1px 1px #ffffff40, inset 0 -1px 2px #00000066",
  "--bui-shadow-switch-thumb-pressed": "0 1px 2px #17171730, inset 0 1px 1px #ffffff26, inset 0 -1px 2px #00000080",
  "--bui-shadow-choice-active": "var(--bui-shadow-switch-on)",
  "--bui-shadow-switch-active": "inset 0 2px 4px #6d5f1566, inset 0 -1px 1px #ffffff66, 0 1px 2px #28251d0a, 0 2px 5px #0000",
  "--bui-shadow-thumb": "inset 0 1px 1px #ffffff33, inset 0 -1px 2px #00000066, 0 2px 3px #17171730, 0 1px 1px #17171714",
  "--bui-shadow-thumb-hover": "inset 0 1px 1px #ffffff40, inset 0 -1px 2px #00000066, 0 3px 6px #17171738, 0 1px 2px #17171714",
  "--bui-shadow-thumb-pressed": "inset 0 1px 1px #ffffff26, inset 0 -1px 2px #00000080, 0 1px 2px #17171730, 0 1px 1px #17171714",
  "--bui-shadow-track": "inset 0 1px 2px #302a1433, inset 0 -1px 1px #ffffff66",
  "--bui-shadow-track-active": "inset 0 1px 3px #302a1440, inset 0 -1px 1px #ffffff66",
  "--bui-shadow-control-pressed": "inset 0 1px 3px #17171726, inset 0 -1px 1px #ffffff26, 0 1px 2px #0000, 0 3px 5px #0000",
  "--bui-choice-on": "var(--bui-accent)",
  "--bui-choice-on-ink": "var(--bui-accent-ink)",
  "--bui-choice-on-border": "var(--bui-accent-border)",
  "--bui-shadow-control": "inset 0 1px 1px #ffffff26, inset 0 -1px 1px #1717170a, 0 1px 2px #28251d0d, 0 3px 5px #28251d06",
  "--bui-shadow-surface": "inset 0 1px 0 #ffffff99, 0 1px 2px #28251d0d, 0 4px 12px #28251d0a",
  "--bui-shadow-hover": "inset 0 1px 1px #ffffff33, inset 0 -1px 1px #1717170a, 0 2px 4px #28251d12, 0 5px 12px #28251d0d",
  "--bui-shadow": "inset 0 1px 0 #ffffff99, 0 3px 8px #28251d0d, 0 16px 40px #28251d17",
  "--bui-ease": "cubic-bezier(.16,1,.3,1)",
  "--bui-ease-exit": "cubic-bezier(.4,0,1,1)",
  "--bui-ease-control": "cubic-bezier(.4,0,.2,1)",
  "--bui-duration-fast": "140ms",
  "--bui-duration": "220ms",
  "--bui-duration-slow": "320ms",
  "--bui-font": "var(--font-body, Arial, sans-serif)",
  "--bui-heading": "var(--font-display, Arial, sans-serif)",
  "--bui-choice-border": "#79766c",
  "--bui-thumb": "#171717",
  "--bui-shadow-field": "inset 0 1px 2px #302a140d, inset 0 -1px 1px #ffffffcc",
  "--bui-shadow-indicator": "var(--bui-shadow-switch-thumb)",
  "--bui-support-blue": "#2758c7",
  "--bui-support-blue-bg": "#edf3ff",
  "--bui-support-teal": "#087569",
  "--bui-support-teal-bg": "#e5f8f0",
  "--bui-support-coral": "#b34630",
  "--bui-support-coral-bg": "#fff0eb",
  "--bui-support-violet": "#7445ba",
  "--bui-support-violet-bg": "#f3edff",
  "--bui-support-amber": "#805c06",
  "--bui-support-amber-bg": "#fff6d8",
  "--bui-support-pink": "#aa386e",
  "--bui-support-pink-bg": "#ffedf5",
  "--bui-chart-1": "#2e7a65",
  "--bui-chart-2": "#559583",
  "--bui-chart-3": "#235d4d",
  "--bui-chart-4": "#3e8773",
  "--bui-chart-5": "#1c4b3e",
  "--bui-chart-6": "#286a58",
  "--bui-info": "var(--bui-selected-ink)",
  "--bui-info-bg": "var(--bui-selected-bg)",
  "--bui-progress-fill": "var(--bui-chart-1)"
};

const BASE_DARK: ThemeTokens = {
  "--bui-canvas": "#171715",
  "--bui-bg": "#232321",
  "--bui-surface": "#2b2b28",
  "--bui-raised": "#3c3b36",
  "--bui-border-hover": "#858176",
  "--bui-ink": "#f7f7f7",
  "--bui-muted": "#b7b5ad",
  "--bui-line": "#47463f",
  "--bui-primary": "#f5f5f5",
  "--bui-primary-hover": "#dedede",
  "--bui-primary-ink": "#171717",
  "--bui-focus": "#f2d46b",
  "--bui-soft": "#3c3823",
  "--bui-selected-bg": "#403c23",
  "--bui-selected-hover": "#4c4624",
  "--bui-selected-ink": "#f1d999",
  "--bui-selected-marker": "#e8c45e",
  "--bui-shadow-selected": "inset 0 0 0 1px #f2d46b15",
  "--bui-danger": "#f0b1a4",
  "--bui-danger-bg": "#472d27",
  "--bui-success": "#add9b8",
  "--bui-success-bg": "#253a2b",
  "--bui-warning": "#ebce8a",
  "--bui-warning-bg": "#3a311f",
  "--bui-shadow-choice": "var(--bui-shadow-switch)",
  "--bui-shadow-choice-hover": "var(--bui-shadow-switch)",
  "--bui-switch-track": "#55534c",
  "--bui-switch-thumb": "#f4f2ed",
  "--bui-shadow-switch": "inset 0 1px 3px #00000066, inset 0 -1px 1px #ffffff1a",
  "--bui-shadow-switch-on": "var(--bui-shadow-switch-active)",
  "--bui-shadow-switch-thumb": "0 2px 3px #0005, inset 0 1px 1px #ffffff33, inset 0 -1px 2px #0000004d",
  "--bui-shadow-switch-thumb-hover": "0 3px 6px #0006, inset 0 1px 1px #ffffff40, inset 0 -1px 2px #0000004d",
  "--bui-shadow-switch-thumb-pressed": "0 1px 2px #0005, inset 0 1px 1px #ffffff26, inset 0 -1px 2px #00000066",
  "--bui-shadow-choice-active": "var(--bui-shadow-switch-on)",
  "--bui-shadow-switch-active": "inset 0 2px 4px #6d5f1570, inset 0 -1px 1px #ffffff66, 0 1px 2px #0002, 0 2px 5px #0000",
  "--bui-shadow-thumb": "inset 0 1px 1px #ffffff33, inset 0 -1px 2px #17171726, 0 2px 3px #0005, 0 1px 1px #0003",
  "--bui-shadow-thumb-hover": "inset 0 1px 1px #ffffff40, inset 0 -1px 2px #17171726, 0 3px 6px #0006, 0 1px 2px #0003",
  "--bui-shadow-thumb-pressed": "inset 0 1px 1px #ffffff26, inset 0 -1px 2px #17171738, 0 1px 2px #0005, 0 1px 1px #0003",
  "--bui-shadow-track": "inset 0 1px 2px #0005, inset 0 -1px 1px #ffffff14",
  "--bui-shadow-track-active": "inset 0 1px 3px #0007, inset 0 -1px 1px #ffffff14",
  "--bui-shadow-control-pressed": "inset 0 1px 3px #0005, inset 0 -1px 1px #ffffff14, 0 1px 2px #0000, 0 3px 5px #0000",
  "--bui-choice-on": "var(--bui-accent)",
  "--bui-choice-on-ink": "var(--bui-accent-ink)",
  "--bui-choice-on-border": "var(--bui-accent-border)",
  "--bui-shadow-control": "inset 0 1px 1px #ffffff1a, inset 0 -1px 1px #00000026, 0 1px 2px #0003, 0 3px 5px #0002",
  "--bui-shadow-surface": "inset 0 1px 0 #ffffff0d, 0 1px 2px #0003, 0 4px 12px #0002",
  "--bui-shadow-hover": "inset 0 1px 1px #ffffff26, inset 0 -1px 1px #00000026, 0 2px 4px #0004, 0 5px 12px #0003",
  "--bui-shadow": "inset 0 1px 0 #ffffff14, 0 3px 8px #0004, 0 16px 40px #0006",
  "--bui-choice-border": "#a09b8e",
  "--bui-thumb": "#f4f2ed",
  "--bui-shadow-field": "inset 0 1px 2px #00000040, inset 0 -1px 1px #ffffff0a",
  "--bui-shadow-indicator": "var(--bui-shadow-switch-thumb)",
  "--bui-support-blue": "#aac4ff",
  "--bui-support-blue-bg": "#283e67",
  "--bui-support-teal": "#78dfc7",
  "--bui-support-teal-bg": "#1d4541",
  "--bui-support-coral": "#ffb19b",
  "--bui-support-coral-bg": "#51352f",
  "--bui-support-violet": "#d0b8ff",
  "--bui-support-violet-bg": "#41345d",
  "--bui-support-amber": "#f4d57f",
  "--bui-support-amber-bg": "#4c401f",
  "--bui-support-pink": "#ffb3d2",
  "--bui-support-pink-bg": "#503048",
  "--bui-chart-1": "#65a08f",
  "--bui-chart-2": "#398570",
  "--bui-chart-3": "#97bfb4",
  "--bui-chart-4": "#509380",
  "--bui-chart-5": "#b9d4cc",
  "--bui-chart-6": "#7fb0a2",
  "--bui-accent": "#ffd900",
  "--bui-accent-hover": "#d5ba28",
  "--bui-accent-ink": "#171717",
  "--bui-accent-border": "#8b6d18"
};

/** Full existing BLD8 token set, suitable for a host style or an ordinary stylesheet. */
export function getThemeTokens(input: unknown, mode: ThemeMode): ThemeTokens {
  const theme = normalizeThemeConfig(input), dark = mode === 'dark';
  const tokens: ThemeTokens = { ...BASE_LIGHT, ...(dark ? BASE_DARK : {}) };
  // Translucent button images can invalidate boundary contrast for custom fills.
  if (theme.accent !== DEFAULT_THEME.accent || theme.primary !== DEFAULT_THEME.primary) {
    tokens['--bui-button-sheen'] = 'none';
    tokens['--bui-button-pressed-tint'] = 'none';
  }
  const backgrounds = [tokens['--bui-bg'], tokens['--bui-surface']];
  const factoryAccent = theme.accent === DEFAULT_THEME.accent;
  const accent = factoryAccent ? tokens['--bui-accent'] : theme.accent;
  const accentInk = textFor(accent, true);
  tokens['--bui-accent'] = accent;
  tokens['--bui-accent-ink'] = accentInk;
  tokens['--bui-accent-hover'] = factoryAccent ? '#d5ba28' : hoverFor(accent, accentInk);
  tokens['--bui-accent-border'] = factoryAccent ? '#8b6d18' : visibleAgainst(accent, backgrounds, dark);
  // Factory feedback stays warm; custom themes derive the same roles from their accent.
  if (!factoryAccent) {
    tokens['--bui-soft'] = mix(theme.accent, tokens['--bui-bg'], dark ? 0.84 : 0.94);
    tokens['--bui-selected-bg'] = mix(theme.accent, tokens['--bui-bg'], dark ? 0.84 : 0.92);
    tokens['--bui-selected-hover'] = mix(theme.accent, tokens['--bui-bg'], dark ? 0.76 : 0.86);
    const selectedSurfaces = [tokens['--bui-selected-bg'], tokens['--bui-selected-hover']];
    tokens['--bui-selected-ink'] = visibleAgainst(theme.accent, selectedSurfaces, dark, 4.5);
    tokens['--bui-selected-marker'] = visibleAgainst(theme.accent, selectedSurfaces, dark);
    tokens['--bui-shadow-selected'] = dark ? 'inset 0 0 0 1px #ffffff12' : 'inset 0 0 0 1px #1717170a';
    tokens['--bui-focus'] = visibleAgainst(theme.accent, [...backgrounds, tokens['--bui-soft'], ...selectedSurfaces], dark, 4.5);
    const activeShade = mix(accent, '#000000', 0.55);
    tokens['--bui-shadow-switch-active'] = dark
      ? `inset 0 2px 4px ${activeShade}70, inset 0 -1px 1px #ffffff66, 0 1px 2px #0002, 0 2px 5px #0000`
      : `inset 0 2px 4px ${activeShade}66, inset 0 -1px 1px #ffffff66, 0 1px 2px #28251d0a, 0 2px 5px #0000`;
  }
  tokens['--bui-info'] = 'var(--bui-selected-ink)';
  tokens['--bui-info-bg'] = 'var(--bui-selected-bg)';
  const chartSeed = factoryAccent ? '#2f7e68' : theme.accent;
  for (const [index, threshold] of [4.7, 3.2, 7, 3.9, 9, 5.8].entries()) {
    tokens[`--bui-chart-${index + 1}`] = dataShade(chartSeed, backgrounds, dark, threshold);
  }

  const factoryPrimary = theme.primary === DEFAULT_THEME.primary;
  const primary = factoryPrimary ? tokens['--bui-primary'] : theme.primary;
  const primaryInk = textFor(primary, true);
  tokens['--bui-primary'] = primary;
  tokens['--bui-primary-ink'] = primaryInk;
  tokens['--bui-primary-hover'] = factoryPrimary ? tokens['--bui-primary-hover'] : hoverFor(primary, primaryInk);

  const type = THEME_TYPOGRAPHY.find(option => option.value === theme.typography)!;
  tokens['--bui-font'] = type.font;
  tokens['--bui-heading'] = type.heading;
  tokens['--bui-radius'] = `${theme.radius}px`;
  tokens['--bui-overlay-radius'] = `${theme.radius === 0 ? 0 : theme.radius + 4}px`;
  tokens['--bui-panel-radius'] = `${theme.radius === 0 ? 0 : theme.radius + 8}px`;

  const scale = theme.density === 'compact' ? 0.85 : theme.density === 'spacious' ? 1.15 : 1;
  for (const step of [1, 2, 3, 4, 5, 6, 8, 12]) tokens[`--bui-space-${step}`] = `${Math.round(step * 4 * scale)}px`;
  const controlOffset = theme.density === 'compact' ? -4 : theme.density === 'spacious' ? 4 : 0;
  tokens['--bui-control-sm'] = `${36 + controlOffset}px`;
  tokens['--bui-control-md'] = `${44 + controlOffset}px`;
  // Input groups add two border pixels; retain the original factory geometry.
  tokens['--bui-group-input-height'] = theme.density === 'comfortable' ? 'var(--bui-control-md)' : `${42 + controlOffset}px`;
  tokens['--bui-control-lg'] = `${48 + controlOffset}px`;

  if (theme.shadow === 'flat') {
    for (const key of Object.keys(tokens) as (keyof ThemeTokens)[]) if (key.startsWith('--bui-shadow')) tokens[key] = 'none';
  } else if (theme.shadow === 'raised') {
    tokens['--bui-shadow-control'] = dark ? 'inset 0 1px 0 #ffffff26, 0 2px 4px #0005, 0 6px 14px #0004' : 'inset 0 1px 0 #ffffffcc, 0 2px 4px #28251d17, 0 6px 14px #28251d12';
    tokens['--bui-shadow-surface'] = dark ? 'inset 0 1px 0 #ffffff1a, 0 4px 8px #0005, 0 12px 26px #0004' : 'inset 0 1px 0 #ffffffcc, 0 4px 8px #28251d12, 0 12px 26px #28251d12';
    tokens['--bui-shadow-hover'] = dark ? 'inset 0 1px 0 #ffffff26, 0 4px 8px #0006, 0 12px 24px #0005' : 'inset 0 1px 0 #ffffffcc, 0 4px 8px #28251d1a, 0 12px 24px #28251d17';
    tokens['--bui-shadow'] = dark ? 'inset 0 1px 0 #ffffff26, 0 6px 12px #0006, 0 24px 56px #0008' : 'inset 0 1px 0 #ffffffcc, 0 6px 12px #28251d1a, 0 24px 56px #28251d26';
  }
  return tokens;
}

/** Text checks cover both ordinary and hover fills. Ratios are unrounded. */
export function getThemeContrast(input: unknown, mode: ThemeMode): ThemeContrast[] {
  const tokens = getThemeTokens(input, mode);
  const pairs: readonly [string, string, string][] = [
    ['Body text', '--bui-ink', '--bui-bg'],
    ['Muted text', '--bui-muted', '--bui-bg'],
    ['Accent action', '--bui-accent-ink', '--bui-accent'],
    ['Accent hover', '--bui-accent-ink', '--bui-accent-hover'],
    ['Primary action', '--bui-primary-ink', '--bui-primary'],
    ['Primary hover', '--bui-primary-ink', '--bui-primary-hover'],
    ['Accent surface', '--bui-focus', '--bui-soft'],
    ['Selected text', '--bui-selected-ink', '--bui-selected-bg'],
    ['Selected hover', '--bui-selected-ink', '--bui-selected-hover'],
  ];
  return pairs.map(([label, foregroundKey, backgroundKey]) => {
    const foreground = tokens[foregroundKey as keyof ThemeTokens], background = tokens[backgroundKey as keyof ThemeTokens];
    const ratio = contrastRatio(foreground, background);
    return { label, foreground, background, ratio, passes: ratio >= 4.5 };
  });
}

/**
 * Portable CSS overrides. Load after BLD8 styles. Put the host class on <html>
 * so body-mounted overlays inherit it; set data-ui-theme="dark" on that same host.
 * Named fonts must be self-hosted separately, or the included system fallback is used.
 */
export function exportThemeCss(input: unknown, options: { selector?: string } = {}): string {
  const selector = options.selector ?? '.bld8-theme';
  if (typeof selector !== 'string' || selector !== selector.trim() || !/^\.[a-zA-Z_][\w-]{0,63}$/.test(selector)) {
    throw new Error('Use one CSS host class, such as .bld8-theme.');
  }
  const block = (mode: ThemeMode) => {
    const tokens = getThemeTokens(input, mode);
    const target = mode === 'light' ? `${selector},\n${selector}[data-ui-theme="light"]` : `${selector}[data-ui-theme="dark"]`;
    const declarations = (Object.keys(tokens) as (keyof ThemeTokens)[]).sort().map(key => `  ${key}: ${tokens[key]};`).join('\n');
    return `${target} {\n  color-scheme: ${mode};\n${declarations}\n}`;
  };
  return '/* BLD8 UI theme. Load after the library CSS; host class and data-ui-theme belong on the same element. */\n' + block('light') + '\n\n' + block('dark') + '\n';
}

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_THEME, THEME_PRESETS, THEME_TYPOGRAPHY, contrastRatio, exportThemeCss,
  getThemeContrast, getThemeTokens, normalizeThemeConfig, normalizeThemeHexColor,
  parseThemeConfig, serializeThemeConfig, type ThemeConfig, type ThemeMode,
} from '../packages/ui/src/theme-config';

test('theme drafts normalize independent fields without changing the caller or the defaults', () => {
  const input = { accent: ' #AbC ', primary: '#123456', radius: 40, density: 'compact', typography: 'remote-font', shadow: 'url(evil)' };
  const theme = normalizeThemeConfig(input);
  expect(theme).toEqual({ ...DEFAULT_THEME, accent: '#aabbcc', primary: '#123456', radius: 16, density: 'compact' });
  expect(input.radius).toBe(40);
  expect(normalizeThemeConfig({ radius: -3 }).radius).toBe(0);
  expect(normalizeThemeConfig({ radius: 5.7 }).radius).toBe(6);
  expect(normalizeThemeConfig({ radius: NaN })).toEqual(DEFAULT_THEME);
  expect(normalizeThemeConfig({ radius: Infinity })).toEqual(DEFAULT_THEME);
  expect(normalizeThemeConfig(Object.create({ accent: '#123456', primary: '#abcdef' }))).toEqual(DEFAULT_THEME);
  for (const invalid of [null, undefined, [], 'dark', 12]) expect(normalizeThemeConfig(invalid)).toEqual(DEFAULT_THEME);
  expect(normalizeThemeConfig(theme)).toEqual(theme);
  expect(Object.isFrozen(DEFAULT_THEME)).toBe(true);
});

test('only opaque hexadecimal colours can enter generated CSS', () => {
  expect(normalizeThemeHexColor('#09f')).toBe('#0099ff');
  expect(normalizeThemeHexColor(' #ABCDEF ')).toBe('#abcdef');
  for (const invalid of ['red', '#abcd', '#11223344', '#12', '#gggggg', 'var(--evil)', '#fff; color:red', '#fff\n}body{display:none}', '</style><script>alert(1)</script>', { toString: () => '#fff' }]) {
    expect(normalizeThemeHexColor(invalid)).toBeNull();
    expect(getThemeTokens({ accent: invalid, primary: invalid }, 'light')['--bui-accent']).toBe(DEFAULT_THEME.accent);
  }
});

test('versioned configuration survives URL encoding and rejects corrupt or unsupported links', () => {
  for (const preset of THEME_PRESETS) {
    const params = new URLSearchParams({ component: 'button', theme: serializeThemeConfig(preset.config) });
    expect(parseThemeConfig(new URLSearchParams(params.toString()).get('theme'))).toEqual(preset.config);
    expect(new URLSearchParams(params.toString()).get('component')).toBe('button');
  }
  const valid = { version: 1, ...DEFAULT_THEME };
  const { primary: _removed, ...missing } = valid;
  for (const invalid of [null, '', '{broken', 'x'.repeat(1025), JSON.stringify({}), JSON.stringify({ ...valid, version: 2 }), JSON.stringify(missing), JSON.stringify({ ...valid, primary: 123 }), JSON.stringify({ ...valid, accent: '#123456;display:none' }), JSON.stringify({ ...valid, typography: 'web-font' }), JSON.stringify({ ...valid, density: 'tiny' }), JSON.stringify({ ...valid, shadow: '0 0 red' }), JSON.stringify({ ...valid, radius: '4' }), JSON.stringify({ ...valid, radius: 4.5 }), JSON.stringify({ ...valid, radius: 17 }), JSON.stringify({ ...valid, css: 'body{display:none}' }), '{"version":1,"__proto__":{"polluted":true}}']) {
    expect(parseThemeConfig(invalid)).toBeNull();
  }
  expect(serializeThemeConfig({ ...DEFAULT_THEME, accent: '#FE0', ignored: 'arbitrary input' })).toBe(serializeThemeConfig({ ...DEFAULT_THEME, accent: '#ffee00' }));
});

test('the original preset preserves every existing light and dark token except portable font aliases', () => {
  const css = readFileSync(new URL('../packages/ui/src/tokens.css', import.meta.url), 'utf8');
  const [lightSource, darkSource] = css.split('[data-ui-theme="dark"]');
  const declarations = (source: string) => Object.fromEntries([...source.matchAll(/(--bui-[\w-]+):\s*([^;]+);/g)].map(match => [match[1], match[2]]));
  const originalLight = declarations(lightSource), originalDark = { ...originalLight, ...declarations(darkSource) };
  for (const mode of ['light', 'dark'] as const) {
    const tokens = getThemeTokens(DEFAULT_THEME, mode), original = mode === 'light' ? originalLight : originalDark;
    for (const [key, value] of Object.entries(original)) {
      if (key !== '--bui-font' && key !== '--bui-heading') expect(tokens[key as keyof typeof tokens], `${mode} ${key}`).toBe(value);
    }
    expect(tokens['--bui-font']).toBe('"DM Sans", Arial, sans-serif');
    expect(tokens['--bui-heading']).toBe('"Manrope", Arial, sans-serif');
  }
});

test('text contrast uses the WCAG threshold without rounding a failure into a pass', () => {
  expect(contrastRatio('#000', '#fff')).toBe(21);
  expect(contrastRatio('#fff', '#000')).toBe(21);
  expect(contrastRatio('#123456', '#123456')).toBe(1);
  expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5);
  expect(() => contrastRatio('var(--color)', '#fff')).toThrow('opaque hex');
  // This grey requires true black: near-black and white both fall below 4.5:1.
  const thresholdTheme = getThemeTokens({ accent: '#777777', primary: '#777777' }, 'light');
  expect(thresholdTheme['--bui-accent-ink']).toBe('#000000');
  expect(thresholdTheme['--bui-primary-ink']).toBe('#000000');
});

test('text stays readable across preset and custom action fills, including hover in both modes', () => {
  const colors = ['#000000', '#ffffff', '#757575', '#777777', '#7f7f7f', '#fefefe', '#0000ff', '#ff0000', '#00ff00'];
  for (const red of ['00', '33', '66', '99', 'cc', 'ff']) for (const green of ['00', '33', '66', '99', 'cc', 'ff']) for (const blue of ['00', '33', '66', '99', 'cc', 'ff']) colors.push('#' + red + green + blue);
  const themes: readonly Partial<ThemeConfig>[] = [...THEME_PRESETS.map(preset => preset.config), ...colors.map(color => ({ accent: color, primary: color }))];
  for (const theme of themes) for (const mode of ['light', 'dark'] as const) {
    const contrast = getThemeContrast(theme, mode);
    expect(contrast.map(pair => pair.label)).toContain('Accent surface');
    if (mode === 'dark') {
      const tokens = getThemeTokens(theme, mode);
      for (const background of ['--bui-bg', '--bui-surface', '--bui-soft'] as const) {
        expect(contrastRatio(tokens['--bui-focus'], tokens[background]), `${theme.accent} focus on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const check of contrast) {
      expect(check.ratio, `${mode} ${theme.accent} ${check.label}`).toBeGreaterThanOrEqual(4.5);
      expect(check.passes).toBe(true);
    }
  }
});

test('custom boundary colours retain readable solid action fills in normal, hover and pressed states', () => {
  // Rounded pixels from the old sheen/pressed overlays fail despite safe base fills.
  expect(contrastRatio('#ffffff', '#747474')).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio('#ffffff', '#787878')).toBeLessThan(4.5);
  expect(contrastRatio('#000000', '#777777')).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio('#000000', '#727272')).toBeLessThan(4.5);
  for (const mode of ['light', 'dark'] as const) {
    const factory = getThemeTokens(DEFAULT_THEME, mode);
    expect(factory['--bui-button-sheen']).toBe('none');
    expect(factory['--bui-button-pressed-tint']).toBe('none');
    for (const field of ['accent', 'primary'] as const) for (const color of ['#747474', '#767676', '#777777', '#787878']) {
      const config = { ...DEFAULT_THEME, [field]: color }, tokens = getThemeTokens(config, mode);
      expect(tokens[`--bui-${field}`]).toBe(color);
      expect(tokens['--bui-button-sheen']).toBe('none');
      expect(tokens['--bui-button-pressed-tint']).toBe('none');
      const prefix = field === 'accent' ? 'Accent' : 'Primary';
      for (const pair of getThemeContrast(config, mode).filter(pair => pair.label.startsWith(prefix))) expect(pair.ratio).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('radius, density, typography and shadow presets affect consumed token families', () => {
  const compact = getThemeTokens({ radius: 0, density: 'compact', shadow: 'flat', typography: 'system' }, 'dark');
  const normal = getThemeTokens(DEFAULT_THEME, 'light');
  const spacious = getThemeTokens({ radius: 16, density: 'spacious', shadow: 'raised', typography: 'geometric' }, 'light');
  expect(compact['--bui-radius']).toBe('0px');
  expect(compact['--bui-overlay-radius']).toBe('0px');
  expect(compact['--bui-panel-radius']).toBe('0px');
  expect(spacious['--bui-radius']).toBe('16px');
  expect(spacious['--bui-overlay-radius']).toBe('20px');
  expect(spacious['--bui-panel-radius']).toBe('24px');
  expect(normal['--bui-group-input-height']).toBe('var(--bui-control-md)');
  // A child plus the group's two borders must match its sibling control height.
  for (const tokens of [compact, spacious]) {
    expect(parseFloat(tokens['--bui-group-input-height']) + 2).toBe(parseFloat(tokens['--bui-control-md']));
  }
  for (const key of ['--bui-control-md', '--bui-space-4', '--bui-space-8'] as const) {
    expect(parseFloat(compact[key])).toBeLessThan(parseFloat(normal[key]));
    expect(parseFloat(spacious[key])).toBeGreaterThan(parseFloat(normal[key]));
  }
  for (const [key, value] of Object.entries(compact)) if (key.startsWith('--bui-shadow')) expect(value).toBe('none');
  expect(spacious['--bui-shadow-surface']).not.toBe(normal['--bui-shadow-surface']);
  expect(spacious['--bui-font']).toBe(spacious['--bui-heading']);
  expect(compact['--bui-font']).toContain('system-ui');
  expect(THEME_TYPOGRAPHY.map(option => option.value)).toEqual(['standard', 'geometric', 'system']);
  for (const mode of ['light', 'dark'] as const) {
    const cobalt = getThemeTokens(THEME_PRESETS[1].config, mode);
    expect(cobalt['--bui-shadow-switch-active']).not.toContain('#725200');
    expect(cobalt['--bui-shadow-switch-active']).not.toBe(getThemeTokens(DEFAULT_THEME, mode)['--bui-shadow-switch-active']);
  }
});

test('CSS export is deterministic, portable and confined to a validated host class', () => {
  const css = exportThemeCss(DEFAULT_THEME);
  expect(css).toContain('.bld8-theme[data-ui-theme="light"]');
  expect(css).toContain('.bld8-theme[data-ui-theme="dark"]');
  expect(css).toContain('color-scheme: light;');
  expect(css).toContain('color-scheme: dark;');
  expect(css).not.toMatch(/:root|@import|https?:|url\(|--font-body|--font-display|__className/);
  expect(css).toBe(exportThemeCss({ shadow: 'soft', radius: 4, accent: DEFAULT_THEME.accent.toUpperCase(), density: 'comfortable', primary: DEFAULT_THEME.primary.toUpperCase(), typography: 'standard' }));
  expect(exportThemeCss(DEFAULT_THEME, { selector: '.customer-theme' })).toContain('.customer-theme[data-ui-theme="dark"]');
  for (const selector of [':root', 'body', '.one, body', '.one .two', '.one:hover', '.x{color:red}', '.x\nbody', '.x\n', '.x\r', '.x</style>', '.x'.repeat(65)]) expect(() => exportThemeCss(DEFAULT_THEME, { selector })).toThrow('one CSS host class');
  const unsafe = exportThemeCss({ accent: '</style><script>alert(1)</script>', shadow: 'url(https://evil.test)' });
  expect(unsafe).not.toMatch(/script|evil|https:/);
  for (const mode of ['light', 'dark'] satisfies ThemeMode[]) {
    const tokens = getThemeTokens(DEFAULT_THEME, mode);
    for (const value of Object.values(tokens)) for (const match of value.matchAll(/var\((--[\w-]+)/g)) expect(tokens[match[1] as keyof typeof tokens]).toBeDefined();
  }
});

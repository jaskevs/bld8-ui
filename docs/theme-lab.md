# Theme lab

The theme lab at /themes lets a developer adjust an application before taking the
settings into their own project. BLD8, Cobalt and Sage are starting points for
accent/primary colours, typography, radius, density and shadows. Light/dark and
phone/desktop previews use real controls, menus and dialogs. Example project
changes last only for the mounted preview.

This increment is local until its source is released. The generated registry now
has 135 items, including the public theme-config entry and its shared module;
the existing live registry still represents the previous release. Do not expect
the new installation URL to work publicly before deployment.

## Export and install

1. Choose a preset and adjust the controls. Invalid colour drafts keep the last
   valid colour in the preview and export, with a visible field error.
2. Use Copy CSS or Download CSS to obtain bld8-theme.css. Both colour modes are
   included. A denied clipboard or failed download offers manual recovery.
3. Load the file after the matching BLD8 library styles. Keep the updated library
   CSS: the exported control-density and custom-fill variables depend on it.
4. Put class="bld8-theme" and data-ui-theme="light" or "dark" together on html.
   In JSX, use className. The host class must reach body-mounted portals too;
   placing it only on a content wrapper will leave those overlays unthemed.
5. Wrap overlay controls in UIProvider and keep body { position: relative; }.

For a source starter, imports are ordinary stylesheets:

```tsx
import '@bld8/ui/styles.css';
import './bld8-theme.css';

// Next.js root layout; Vite uses the same attributes in index.html.
<html className="bld8-theme" data-ui-theme="light">
  <body>{/* UIProvider wraps the application here. */}</body>
</html>
```

Registry consumers import their installed bld8/styles.css and UIProvider from
bld8/overlays using their configured UI alias. The npm package remains unpublished;
these examples refer to the source starter's workspace package. See
[framework setup](https://ui.bld8.dev/frameworks) for the application boundary.

DM Sans and Manrope are bundled by the showcase, not by an exported theme file.
Self-host/load the named fonts separately to reproduce those options, or choose
System. Every exported font stack includes a fallback. No remote font request is
introduced by the helper.

## Programmatic use

The theme-config subpath is framework-independent and can run in a Next.js Server
Component or a Node build script. It has no React, DOM or lab-state dependency.
For a registry installation after release, add /r/theme-config.json and import
from the installed bld8/theme-config source instead of the workspace package.

```ts
import {
  DEFAULT_THEME, exportThemeCss, getThemeContrast,
  parseThemeConfig, serializeThemeConfig,
} from '@bld8/ui/theme-config';

const config = { ...DEFAULT_THEME, accent: '#3859b8', typography: 'system' as const };
const css = exportThemeCss(config); // .bld8-theme; light and explicit dark rules
const report = getThemeContrast(config, 'dark');
const params = new URLSearchParams();
params.set('theme', serializeThemeConfig(config));
params.set('mode', 'dark');
const restored = parseThemeConfig(params.get('theme'));
```

getThemeTokens supplies the complete existing token family for an inline host or
custom stylesheet. normalizeThemeConfig safely normalises partial drafts.
parseThemeConfig rejects unsupported versions, unknown/missing fields and invalid
values as a whole. Only opaque hex colours and a single CSS host class are
accepted; URLs cannot supply arbitrary CSS, fonts or external resource addresses.

The editor keeps settings in its shareable URL, preserving unrelated parameters
and the hash. Presets and discrete choices add history entries; continuous colour
and radius edits are debounced. Back/Forward restores the chosen state. It does
not save theme settings to localStorage or change the catalogue's own theme.

## Preview isolation and checks

The preview has its own same-origin document at /themes/preview, excluded from
the sitemap and marked noindex. Validated messages require the expected origin
and window source. Tokens and colour mode apply to the preview's html, so its
body portals inherit them while the editor remains unchanged. An applied
acknowledgement controls the Live status; a failed connection offers a retry.

Nine unrounded token-pair ratios cover body/muted text, primary and accent
normal/hover actions, text on the accent surface and selected normal/hover states. Derived text colours target
4.5:1, including custom dark accents. Shared neutral selection tokens carry through
the library and exported themes;
compact fine-pointer controls measure 40px while coarse-pointer field, action and
choice rows retain their larger target treatment. Shared easing and live reduced-motion preferences still apply.

These checks are a useful starting point, not accessibility certification. Review
the finished application's disabled, custom, overlaid and image-background
states, manual keyboard flow and assistive-technology behaviour. See
[consumer checks](registry-consumer-checks.md) for independent Next.js/Vite builds
and portal/style assertions, and [visual quality](visual-quality.md) for the
separate browser-engine coverage.

## Review related controls together

The preview’s Interface study tab combines fields, choices, actions, a chart and
a selectable project table. Use it to compare shared colour roles across solid
actions, pale selection surfaces and complementary data shades in both modes. Data is
illustrative and changes reset with the preview.

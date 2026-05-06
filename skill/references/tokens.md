# Tokens & themes

Every `ce-*` and `lesson-*` component reads colors, spacing, radii, typography, and motion from `--ce-*` CSS custom properties. There is no per-component prop explosion — to retheme, redefine the token.

The defaults live in `src/tokens/tokens.css`. Eleven theme bundles ship next to it; each one overrides a focused subset of tokens. Pick one or layer them.

> Looking for the per-component CSS-variable list? Each component declares the tokens it consumes in its meta file. Run `node skill/scripts/components.mjs --tag ce-card --fields tag,cssVariables` (or open `src/components/card/card.meta.json`) for the precise list.

---

## Theme bundles

All themes ship as standalone CSS bundles. Apply one by linking the CSS and setting `data-ce-theme` on the root element. `tokens.css` is always the base; a theme bundle overrides any subset of tokens.

| Bundle | Subpath | `data-ce-theme` | When to use |
| --- | --- | --- | --- |
| Dark *(default)* | `custom-elements-collection/dark.css` | `dark` | Default chrome for dashboards, copilots, dark-on-dark code reading. |
| Light | `custom-elements-collection/light.css` | `light` | Same palette flipped to light surfaces — print, photo-heavy pages, daytime use. |
| Swiss International | `custom-elements-collection/swiss.css` | `swiss` | Helvetica-leaning, neutral grayscale + a single accent. Editorial / mod-typography. |
| Bauhaus | `custom-elements-collection/bauhaus.css` | `bauhaus` | Primary red / yellow / blue on a strict geometric grid. Loud landing pages. |
| Muji (Japanese) | `custom-elements-collection/muji.css` | `muji` | Beige / off-white, very low contrast, soft type. Calm reading material. |
| Neo-brutalist | `custom-elements-collection/neo-brutal.css` | `neo-brutal` | High-contrast hard borders, oversaturated colors, no shadows. Marketing sites that want to be impossible to ignore. |
| Solarized | `custom-elements-collection/solarized.css` | `solarized` | Schoonover's solarized palette. Code-heavy docs, terminals embedded in UIs. |
| Nordic | `custom-elements-collection/nordic.css` | `nordic` | Nord-inspired cool blues + muted accents. Long-form analytics dashboards. |
| Memphis | `custom-elements-collection/memphis.css` | `memphis` | Saturated 80s pastels + bold patterns. Demo days, conference talks. |
| Gruvbox | `custom-elements-collection/gruvbox.css` | `gruvbox` | Warm earth tones, high readability. Long technical reading + code blocks. |
| Auto | — | `auto` | Follows `prefers-color-scheme` (effectively dark or light). Set on `<html>` and the components react. |

Live preview: `pnpm demo` then click the theme switcher in the header. Every theme is exercised by the demo.

### Wiring

```html
<!doctype html>
<html data-ce-theme="solarized">
  <head>
    <link rel="stylesheet"
          href="https://unpkg.com/custom-elements-collection/dist/tokens/tokens.css">
    <link rel="stylesheet"
          href="https://unpkg.com/custom-elements-collection/dist/tokens/solarized.css">
  </head>
  <body>...</body>
</html>
```

Or with bundlers:

```ts
import "custom-elements-collection/tokens.css";
import "custom-elements-collection/solarized.css";
```

To swap themes at runtime, set `document.documentElement.dataset.ceTheme = "<name>"`. The `<ce-theme-switcher>` component does this and persists the choice — see its meta for the API.

---

## Token catalog

### Semantic colors

Each color has three variants. The base token is the foreground / strong-fill color; `-bg` is a tinted background; `-border` is a subdued border tint.

| Token | Dark default | Light default | Common use |
| --- | --- | --- | --- |
| `--ce-color-green` | `#3fb950` | `#1f883d` | Success / pass |
| `--ce-color-red` | `#f85149` | `#cf222e` | Error / fail |
| `--ce-color-amber` | `#d29922` | `#9a6700` | Warning |
| `--ce-color-blue` | `#58a6ff` | `#0969da` | Info / primary |
| `--ce-color-purple` | `#bc8cff` | `#8250df` | Highlight / brand |
| `--ce-color-cyan` | `#39d2c0` | `#1b7c83` | Secondary accent |

Each colour also exposes `-bg` and `-border` siblings, e.g. `--ce-color-green-bg`, `--ce-color-green-border`. The `CecColor` TS type accepted by component `accent`/`type`/`color` props is `"neutral" | "green" | "red" | "amber" | "blue" | "purple" | "cyan"`.

### Surface & text

```
--ce-bg              page background
--ce-surface         card / panel surface
--ce-surface-2       nested surface (chip backgrounds, table rows)
--ce-surface-3       deep-nested surface
--ce-border          default border
--ce-border-soft     subtle border (separators)
--ce-border-strong   prominent border (focus / hover)

--ce-text            primary text
--ce-muted           secondary / label text
--ce-dim             very muted (nav tags, counts)
--ce-text-inverse    text on solid color fills
```

### Spacing (4 px grid)

`--ce-space-1` (4px) · `--ce-space-2` (8px) · `--ce-space-3` (12px) · `--ce-space-4` (16px) · `--ce-space-5` (24px) · `--ce-space-6` (32px) · `--ce-space-7` (40px) · `--ce-space-8` (56px)

Inset variants: `--ce-inset-xs` for chip-internal padding.

### Radius

`--ce-radius-sm` (6px) · `--ce-radius` (10px) · `--ce-radius-lg` (14px) · `--ce-radius-pill` (999px)

### Typography

Font stacks: `--ce-font-sans`, `--ce-font-mono`.

Sizes: `--ce-text-xs` (11px) · `--ce-text-sm` (12.5px) · `--ce-text-base` (14px) · `--ce-text-md` (15px) · `--ce-text-lg` (17px) · `--ce-text-xl` (22px) · `--ce-text-2xl` (28px) · `--ce-text-3xl` (40px).

Line heights: `--ce-line-tight` (1.15) · `--ce-line-snug` (1.35) · `--ce-line-normal` (1.55) · `--ce-line-relaxed` (1.7).

### Motion & elevation

Transitions: `--ce-transition-fast` (0.12s) · `--ce-transition` (0.2s) · `--ce-transition-slow` (0.35s).

Shadows: `--ce-shadow-sm` · `--ce-shadow` · `--ce-shadow-lg`.

Focus ring: `--ce-focus-ring`.

---

## Overriding tokens

Override at any level. Values cascade through the document.

```css
/* Single token, project-wide */
:root {
  --ce-radius: 14px;
  --ce-color-blue: oklch(60% 0.2 240);
}

/* Per-section */
.brand-zone {
  --ce-color-blue: var(--my-brand);
  --ce-font-sans: "Inter", system-ui, sans-serif;
}

/* Per-component (works on any ce-* tag) */
ce-card[accent="blue"] {
  --ce-color-blue: oklch(72% 0.17 250);
}
```

Theme bundles work the same way — they just ship a curated set of overrides.

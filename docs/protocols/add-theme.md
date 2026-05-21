# Add-theme protocol

Step-by-step flow for adding a new theme bundle to `src/tokens/`, with an explicit verification gate after every step.

> **Scope.** Add one theme (one CSS file in `src/tokens/`, plus the registrations that wire it through to consumers and the demo). Returns when the new theme renders every component group correctly in the demo. Does **not** bump versions, write changelog entries, or commit — those happen later, in a release. See [`pre-release.md`](pre-release.md) for the audit that runs before a release.

## When to run

- Adding a new design-school bundle (e.g. `swiss`, `bauhaus`, `gruvbox`, `nordic`, …) on top of the base `tokens.css`.
- Adding a per-customer / per-product palette that ships in the same package.
- Forking an existing theme into a sibling variant (`muji-light` next to `muji`, etc.).

Not for: tweaking individual variables on an existing theme (just edit the file), adding a brand-new design token (`--ce-*`) across all themes (that's a token-axis change — touch `tokens.css` first, then every theme), or adding a per-consumer override at runtime (that's `:root { --ce-* }` in consumer CSS, no theme file needed).

## Stop conditions

Stop and escalate only on a **hard blocker**:

- The proposed theme needs a CSS feature that breaks the documented browser-support floor (any evergreen browser with `customElements`, ES modules, `CSS.registerProperty`, Safari 16.4+).
- A design token the theme wants does not exist on `tokens.css` — adding the token first is a separate ADR-touching change. Don't add new tokens on the side of a theme.
- The new theme cannot satisfy a WCAG-AA contrast ratio for body text on the surface colour (visible content the theme owns must be legible — same bar as the existing themes).

Everything else is normal authoring loop.

## The protocol

### 0 — Pick a name

| Decision | Rule |
|---|---|
| Slug | kebab-case, single word preferred (`swiss`, `muji`, `nordic`). Two-word slugs use a single hyphen (`neo-brutal`, `gruvbox-light`). |
| Reserved slugs | `auto`, `dark`, `light` — these are the canonical baselines; don't shadow them. |
| Filename | `src/tokens/<slug>.css`. |
| `data-ce-theme` attribute value | identical to the slug. |
| `exports` subpath | `./<slug>.css` → `./dist/tokens/<slug>.css` in `package.json`. |
| Display name | The slug also doubles as the user-visible label in `ce-theme-switcher`. Capitalise via CSS if you want a different rendering — the slug stays. |

**Verification gate:** the slug does not already exist in `src/tokens/` and is not one of the reserved baselines (`grep -lE "data-ce-theme=\"<slug>\"" src/tokens/`).

### 1 — Create the theme file

Create `src/tokens/<slug>.css`. The shape is **always** the same: a single `html[data-ce-theme="<slug>"]` selector that overrides every visual variable. Match the structure of an existing theme — [`src/tokens/swiss.css`](../../src/tokens/swiss.css) is a tight, focused reference; [`src/tokens/nordic.css`](../../src/tokens/nordic.css) is a softer / more colourful one.

Skeleton:

```css
/* ---------- <Slug> design theme (light | dark) ---------- */

html[data-ce-theme="<slug>"] {
  /* Surfaces */
  --ce-bg:            #...;
  --ce-surface:       #...;
  --ce-surface-2:     #...;
  --ce-surface-3:     #...;
  --ce-border:        #...;
  --ce-border-soft:   #...;
  --ce-border-strong: #...;

  /* Text */
  --ce-text:         #...;
  --ce-muted:        #...;
  --ce-dim:          #...;
  --ce-text-inverse: #...;

  /* Semantic colours (solid + tinted bg + tinted border) */
  --ce-color-green:        #...;
  --ce-color-green-bg:     rgba(..., ..., ..., 0.12);
  --ce-color-green-border: rgba(..., ..., ..., 0.30);
  /* …red, amber, blue, purple, cyan — same 3-variable pattern */

  /* Radius scale (override if the theme has a distinctive shape) */
  --ce-radius-sm:   ...px;
  --ce-radius:      ...px;
  --ce-radius-lg:   ...px;
  --ce-radius-pill: 999px;

  /* Typography (override if the theme has a distinctive face) */
  --ce-font-sans: "...", system-ui, sans-serif;

  /* Motion + elevation + focus ring — match the theme's tactility */
  --ce-transition-fast: ...;
  --ce-transition:      ...;
  --ce-transition-slow: ...;

  --ce-shadow-sm: ...;
  --ce-shadow:    ...;
  --ce-shadow-lg: ...;

  --ce-focus-ring: 0 0 0 2px ...;
}
```

Rules:

- **Never override `--ce-space-*`, `--ce-inset-*`, `--ce-sz-*`, `--ce-text-*` size scales.** They are layout-rhythm primitives, not style. Themes change *appearance*, not *geometry*.
- **Override every colour and shadow that differs from the dark default.** Missing variables silently fall back to the base — that's usually wrong (e.g. an `--ce-bg` from dark on a light theme will look broken).
- **Inheritance is via the cascade**, not via `@import` from `tokens.css`. The base values live on `:root` (set by `tokens.css`); the theme selector is more specific and only overrides what it touches. Do NOT `@import "./tokens.css"` from your theme file — it would re-run the full base.
- **The light-theme exception**: `src/tokens/light.css` uses an `@import "./tokens.css"` because it's meant to be loaded *standalone* without the dark default. Most new themes do NOT need this — they layer on top of `tokens.css` loaded earlier.
- **Hex values are allowed inside theme files only.** This is the one place ADR-003 (no hex in component source) inverts — theme files are *defining* the tokens, not consuming them.

**Verification gate:**

```bash
# Selector is correct
grep -c "html\[data-ce-theme=\"<slug>\"\]" src/tokens/<slug>.css   # → ≥1

# Every required variable is overridden (the four critical-anchor variables)
for var in --ce-bg --ce-surface --ce-text --ce-color-blue; do
  grep -q "$var:" src/tokens/<slug>.css || echo "MISSING $var"
done   # → no MISSING lines
```

### 2 — Register the theme in `package.json#exports`

The `exports` map exposes each theme as a stylesheet subpath so consumers can `<link rel="stylesheet" href="…/<slug>.css">` or `import "custom-elements-collection/<slug>.css"`. The map is hand-maintained for tokens (the generator handles component exports, not token exports).

Add the entry in alphabetical position:

```jsonc
{
  "exports": {
    // …
    "./<slug>.css": "./dist/tokens/<slug>.css",
    // …
  }
}
```

**Verification gate:**

```bash
jq -r '.exports | keys[]' package.json | grep -F "./<slug>.css"   # → ./<slug>.css
```

### 3 — Register the theme in the demo's theme switcher

The demo's pre-paint script reads `localStorage["cec-demo-theme"]`, validates it against an allow-list, and sets `data-ce-theme` on `<html>` before any component renders. The allow-list is hand-maintained in two demo entry points.

Update `demo/index.html` and `demo/feedback.html` — add the new slug to the validation `Set`:

```html
<script>
  (() => {
    const stored = localStorage.getItem("cec-demo-theme");
    const valid = new Set([
      "auto","dark","light","swiss","bauhaus","muji",
      "neo-brutal","solarized","nordic","memphis","gruvbox",
      "<slug>"
    ]);
    // …
  })();
</script>
```

The `ce-theme-switcher` itself is a generic cycler — it receives its list from `demo/demo.js` (`values` attribute on the `<ce-theme-switcher>` instance). Add the new slug there too if it's hand-listed; otherwise the switcher reads from the same allow-list.

**Verification gate:**

```bash
grep -c "\"<slug>\"" demo/index.html demo/feedback.html   # → ≥1 each
```

### 4 — Build, then verify the bundle emits the theme CSS

```bash
pnpm build
```

The Vite plugin `copyTokens()` (configured in `vite.config.ts`) walks `src/tokens/*.css` and copies each file to `dist/tokens/*.css`. New files are picked up automatically — no plugin edit needed.

**Verification gate:**

```bash
ls dist/tokens/<slug>.css   # → exists
```

### 5 — Visual smoke-test in the demo

```bash
pnpm demo                            # boots http://localhost:4600 (or next free port)
# In the browser: open the theme switcher, pick "<slug>".
```

For every component group, eyeball at least one representative tag under the new theme. The minimum sweep — one per group — catches most regressions:

| Group | Suggested tag to spot-check |
|---|---|
| Layout & primitives | `ce-card`, `ce-callout`, `ce-section` |
| Metrics & charts | `ce-kpi`, `ce-bar-chart`, `ce-donut` |
| Comparison & narrative | `ce-verdict`, `ce-pros-cons`, `ce-matrix` |
| Chat surfaces | `ce-chat-bubble`, `ce-tool-call`, `ce-source-card` |
| Feedback | `ce-feedback-bar`, `ce-rating` |
| Forms | `ce-input`, `ce-select`, `ce-checkbox` |
| Dashboard | `ce-gauge`, `ce-sparkline`, `ce-status-light` |
| Content | `ce-key-value`, `ce-json`, `ce-diff` |
| Education | `lesson-quiz`, `lesson-vocab` |

What to look for:

- **Contrast.** Body text on `--ce-surface`, muted text on `--ce-surface`, link colour on `--ce-bg` — all should be clearly readable. WCAG-AA (4.5:1 for body text) is the floor.
- **Semantic colour parity.** `ce-verdict type="go"` should still read as "go" — don't desaturate green into invisibility.
- **Focus ring contrast.** `Tab` to a button and a link; the `--ce-focus-ring` must be visible against the theme's `--ce-surface` and `--ce-surface-2`.
- **Hover states.** `--ce-state-hover` overlay must be visible on top of every surface variant — easy to forget when overriding only solid colours.
- **Inverse text.** `--ce-text-inverse` is used on coloured pills (green active state, blue selected). Verify it's legible on every `--ce-color-*` background.
- **Code surface.** `--ce-code-bg` / `--ce-code-text` are intentionally dark regardless of theme — don't override them unless the new theme has a strong code-surface opinion.

**Verification gate:** every group has at least one passing spot-check; no group renders illegibly.

### 6 — Update the docs that enumerate themes

Two surfaces hand-list the theme catalog. Bump both:

- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) — the "Theming model" paragraph lists every shipped theme. Add `<slug>` and update the count ("Eleven theme bundles ship: …" → "Twelve…").
- [`README.md`](../../README.md) — the "Theming" section shows the CDN link template; the catalog line implicitly counts themes by listing tokens.css and a couple of overrides. If the section lists a specific theme count, bump it. Otherwise no change.

**Verification gate:**

```bash
grep -c "<slug>" docs/ARCHITECTURE.md   # → ≥1
```

### 7 — Tests + build green

```bash
pnpm check
```

No component test should break — themes only override CSS variables, not behaviour. If a test does break under a new theme, the test was over-asserting on a specific colour value (rare in this repo — tests assert on classes / attributes / events, not on computed style). Fix the test, not the theme.

**Verification gate:** `pnpm check` exits 0.

### 8 — Optional — Playwright visual

If the wave introduces ≥ 2 themes at once, or the theme is unusual enough that screenshot regressions matter, capture a baseline screenshot per representative tag with Playwright. The repo's e2e setup boots the demo automatically; add a spec under `e2e/themes-<slug>.spec.ts` that visits each detail page with `?theme=<slug>` and uses `page.screenshot()` against a baseline.

Skip for incremental theme additions where visual inspection in step 5 is sufficient.

## Output

An add-theme run ends with a one-line confirmation: *"theme `<slug>` shipped: N variables overridden, demo OK across N groups, dist/tokens/<slug>.css emitted (X bytes)."*

The version bump + CHANGELOG entry + commit happen later, when a release is cut. See [`pre-release.md`](pre-release.md).

## Cross-references

- [`docs/adr/adr-003-theming.md`](../adr/adr-003-theming.md) — the architectural decision that themes implement: tokens own presentation, components consume them.
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) — "Theming model" section enumerates the token axes (`--ce-space-*`, `--ce-inset-*`, `--ce-sz-*`, `--ce-state-*`, `--ce-code-*`, semantic colours) and explains which axes a theme should and should not override.
- [`src/tokens/tokens.css`](../../src/tokens/tokens.css) — the base layer every theme overrides.
- [`pre-release.md`](pre-release.md) — the protocol that runs before a release, after one or more new themes have landed.
- [`new-component.md`](new-component.md) — companion protocol for adding a new tag (themes affect every component; new components inherit every theme automatically).

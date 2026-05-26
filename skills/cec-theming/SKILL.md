---
name: cec-theming
description: USE WHENEVER theming or restyling `custom-elements-collection` — adding a new design-school bundle (`src/tokens/<slug>.css`), per-customer / per-brand palettes, layered theme variants, runtime theme switching, project / section / per-component token overrides, dark/light parity audits, WCAG-AA contrast debugging, focus-ring visibility checks. Trigger phrases: `--ce-*`, `data-ce-theme`, "add a theme", "design school", "bauhaus / swiss / muji / neo-brutal / solarized / nordic / memphis / gruvbox / dark / light / auto", `tokens.css`, "override `--ce-`", "brand palette", "tinted bg variant", "focus ring", "WCAG contrast", `prefers-color-scheme`, `ce-theme-switcher`. SKIP for a one-line `:root { --ce-radius: 14px }` in consumer code (the `cec-consumer` skill covers that), edits to the base `src/tokens/tokens.css` token catalog itself (that's adding a new axis — use `cec-core-maintenance`), or per-component CSS that doesn't touch tokens (component-author).
---

# Theming `custom-elements-collection`

Tokens own presentation; components consume them (ADR-003). The base layer in `src/tokens/tokens.css` defines every `--ce-*` variable. A **theme bundle** is a single CSS file under `src/tokens/<slug>.css` that overrides a subset of those tokens under `html[data-ce-theme="<slug>"]`. Eleven bundles ship today.

> **Canonical step-by-step for adding a theme lives in [`../../docs/protocols/add-theme.md`](../../docs/protocols/add-theme.md).** This skill is the orientation + token-discipline layer. The protocol is authoritative on the mechanical steps; don't re-derive them from memory.

---

## When to use

- Adding a new design-school bundle.
- Adding a per-customer / per-product palette that ships in the same package.
- Forking an existing theme (`muji-light` next to `muji`).
- Building a runtime theme picker beyond `ce-theme-switcher`.
- Debugging contrast, focus visibility, or per-state regressions across themes.
- Per-section or per-component token overrides at consumer scale.

## When NOT to use

- One-off `:root { --ce-radius: 14px }` in a consumer page — `cec-consumer` already covers it.
- Adding a brand-new token *axis* (e.g. a new `--ce-state-*` family) to the base — that touches every theme and is core work; use `cec-core-maintenance` + an ADR.
- Restyling a single component's CSS without touching tokens — that's component-author work.

---

## Three override scopes — pick the smallest

```css
/* 1. Project-wide. Lives in your global stylesheet. */
:root {
  --ce-radius: 14px;
  --ce-color-blue: oklch(60% 0.2 240);
}

/* 2. Per-section. Scoped by an ancestor selector. */
.brand-zone {
  --ce-color-blue: var(--my-brand);
  --ce-font-sans: "Inter", system-ui, sans-serif;
}

/* 3. Per-component instance. Targets a specific tag. */
ce-card[accent="blue"] {
  --ce-color-blue: oklch(72% 0.17 250);
}
```

Theme bundles are option 1 published as reusable stylesheets — they ship in `dist/tokens/<slug>.css` and the consumer pages a `<link>` against them.

---

## The token catalog (axes you'll touch)

| Axis | Examples | Override in themes? |
|---|---|---|
| **Surfaces** | `--ce-bg`, `--ce-surface`, `--ce-surface-2/3`, `--ce-border`, `--ce-border-soft/strong` | Always — these are the strongest visual signature of a theme. |
| **Text** | `--ce-text`, `--ce-muted`, `--ce-dim`, `--ce-text-inverse` | Always. `--ce-text-inverse` must read on every `--ce-color-*` background. |
| **Semantic colours** | `--ce-color-green/red/amber/blue/purple/cyan` (each plus `-bg` and `-border` siblings) | Always — keep semantic parity (green = pass; don't desaturate into invisibility). |
| **Radius** | `--ce-radius-sm`, `--ce-radius`, `--ce-radius-lg`, `--ce-radius-pill` | Optional — override when the theme has a distinctive shape (Bauhaus = sharper, Memphis = softer). |
| **Typography (face)** | `--ce-font-sans`, `--ce-font-mono` | Optional — override for a distinctive face. |
| **Motion** | `--ce-transition-fast / -normal / -slow` | Optional — tweak when tactility differs. |
| **Elevation** | `--ce-shadow-sm`, `--ce-shadow`, `--ce-shadow-lg` | Optional — Neo-brutalist drops them, Memphis amplifies them. |
| **Focus ring** | `--ce-focus-ring` | Always re-verify visibility — focus rings designed for dark backgrounds vanish on light. |
| **Geometry (DO NOT touch)** | `--ce-space-*`, `--ce-inset-*`, `--ce-sz-*`, `--ce-text-*` size scale | **Never.** Themes change appearance, not geometry. Layout rhythm is invariant. |
| **Code surface** | `--ce-code-bg`, `--ce-code-text` | Intentionally dark in every theme. Override only if the theme has a strong code-surface opinion. |

Full per-token catalog and dark/light defaults: [`references/tokens.md`](references/tokens.md).

---

## Adding a new theme bundle — high-level walk

The full protocol with verification gates is at [`../../docs/protocols/add-theme.md`](../../docs/protocols/add-theme.md). Skeleton view:

1. **Pick a slug.** kebab-case, not one of `auto` / `dark` / `light` (reserved baselines). Two-word slugs use one hyphen (`neo-brutal`).
2. **Create `src/tokens/<slug>.css`** with a single `html[data-ce-theme="<slug>"]` selector. Override every Surface + Text + Semantic colour variable that differs from the dark default. Reference shape: [`../../src/tokens/swiss.css`](../../src/tokens/swiss.css) (focused) or [`../../src/tokens/nordic.css`](../../src/tokens/nordic.css) (softer).
3. **Register in `package.json#exports`** at alphabetical position: `"./<slug>.css": "./dist/tokens/<slug>.css"`.
4. **Add to the demo's allow-list** in `demo/index.html` and `demo/feedback.html` (the pre-paint validator `Set`).
5. **Build:** `pnpm build` — the `copyTokens()` Vite plugin picks up new files automatically.
6. **Demo smoke-test:** `pnpm demo`, switch to the new theme, spot-check one tag per group (`ce-card`, `ce-kpi`, `ce-verdict`, `ce-chat-bubble`, `ce-feedback-bar`, `ce-input`, `ce-gauge`, `ce-key-value`, `lesson-quiz`). Verify contrast, focus ring, hover overlay, inverse text.
7. **Update enumerations:** [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) "Theming model" paragraph (bump theme count); [`../../README.md`](../../README.md) "Theming" section.
8. **`pnpm check`** green. Component tests do not break under a new theme (they assert on classes / attributes / events, never on computed style).

---

## Key invariants

- **Hex literals are allowed inside theme files only.** This inverts ADR-003 (no hex in component source) — theme files *define* the tokens, components *consume* them.
- **Inheritance is the cascade.** Do NOT `@import "./tokens.css"` from your theme file — base values live on `:root` (set by `tokens.css` loaded earlier), the theme selector is more specific and only overrides what it touches.
- **The light-theme `@import` exception.** [`../../src/tokens/light.css`](../../src/tokens/light.css) `@import`s `tokens.css` because it's meant to load **standalone** without the dark default. New themes usually don't need this — they layer on top of an already-loaded `tokens.css`.
- **`html[data-ce-theme="<slug>"]` is the selector.** Not `[data-ce-theme]` and not `:root[data-ce-theme]` — the protocol's allow-list check greps for this exact shape.
- **Every semantic colour needs three variants.** `--ce-color-green`, `--ce-color-green-bg` (tinted background), `--ce-color-green-border` (subdued border). Components reach for all three; missing one breaks tinted-pill styling.

---

## WCAG / accessibility spot-checks

When picking colours for a new theme, validate against these before declaring done:

- **Body text contrast on `--ce-surface`** ≥ 4.5:1 (WCAG-AA for body text).
- **Muted text contrast on `--ce-surface`** ≥ 3:1 (the "large-text" threshold; muted is by definition secondary).
- **Link colour contrast on `--ce-bg`** ≥ 4.5:1.
- **Focus ring** visible against `--ce-surface` AND `--ce-surface-2` (don't pick a ring colour that vanishes against either).
- **Inverse text on every semantic colour.** `ce-button variant="primary"` lights up `--ce-color-blue`; `--ce-text-inverse` must be legible on it. Test all 6 semantic colours.
- **Hover overlay visibility.** `--ce-state-hover` is an overlay layered on top of every surface variant — easy to lose against `--ce-surface-3`.

For semantic parity: `ce-verdict type="go"` must still **read** as "go". Don't desaturate green into something the reader has to decode.

---

## Runtime theme switching

```ts
// Set the theme
document.documentElement.dataset.ceTheme = "solarized";

// Or use the built-in switcher (persists to localStorage in the demo wiring)
import "custom-elements-collection/theme-switcher";
```

For SSR: render the chosen `data-ce-theme` on `<html>` server-side to avoid a flash; `ce-theme-switcher` re-applies client-side without a re-render.

`auto` (the only baseline that has no token bundle) follows `prefers-color-scheme` — effectively `dark` or `light`. Set `data-ce-theme="auto"` on `<html>` and the components react.

---

## Anti-patterns

- **Hex in a theme bundle that should be a token reference.** If you find yourself writing the same hex three times across a theme, it's an opportunity for an intermediate `--ce-<slug>-accent` token.
- **Theme touches geometry.** `--ce-space-3: 16px` in a theme breaks layout rhythm across every consumer. Move to `appearance` axes only.
- **Missing tinted siblings.** Setting `--ce-color-green` but not `--ce-color-green-bg` leaves the tinted-pill backgrounds inheriting from dark. Always override the trio.
- **Forgetting to update the demo's pre-paint allow-list.** The new theme works at runtime if `data-ce-theme` is set in HTML, but the demo's switcher won't list it. Two files: `demo/index.html` and `demo/feedback.html`.
- **`@import "./tokens.css"`** in a sibling theme. Doubles the base CSS at load.
- **Designing only for one screen size / one OS / one font-rendering setting.** Theme bundles ship to every consumer. Spot-check on macOS + Windows; high-DPI and standard; reduced-motion `@media` query for any animation-heavy theme.

---

## Where to look

- [`../../docs/protocols/add-theme.md`](../../docs/protocols/add-theme.md) — canonical step-by-step.
- [`../../docs/adr/adr-003-theming.md`](../../docs/adr/adr-003-theming.md) — the architectural decision themes implement.
- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) "Theming model" — token axes (which to override, which are invariant).
- [`../../src/tokens/tokens.css`](../../src/tokens/tokens.css) — base layer (read once to know what's overridable).
- [`../../src/tokens/`](../../src/tokens/) — all 10 shipped bundles; copy the closest one and diverge.
- [`references/tokens.md`](references/tokens.md) — published token catalog (consumer-facing).
- `ce-theme-switcher` meta — runtime API for the picker component.

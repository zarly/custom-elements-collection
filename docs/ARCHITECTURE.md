# Architecture

How the pieces fit together.

## Repo layout

```
custom-elements-collection/
├── src/
│   ├── core/           Lit base class (CecElement) + registration helper (defineOnce)
│   ├── tokens/         Design tokens as plain CSS (tokens.css, dark.css, light.css)
│   ├── components/     25 ce-* UI components
│   ├── lesson/          6 lesson-* educational widgets
│   ├── entries/        31 per-tag side-effect wrappers (one file per tag)
│   ├── index.ts        Named exports of every component class
│   ├── auto.ts         Side-effect module that registers every tag
│   └── manifest.ts     Machine-readable catalog (COMPONENTS) + loadOnDemand()
├── scripts/copy-tokens.mjs    Build helper — copies CSS tokens into dist/
├── dist/                      Build output (JS + .d.ts + CSS)
├── docs/                      Public documentation (this folder)
├── demo/                      Internal Vue 3 catalog + playground (not published)
└── package.json               Single-package npm manifest
```

## Dependency model

The package has exactly one runtime peer dependency — Lit 3. Internally:

```
tokens (CSS)   →   no dependencies
core           →   lit
components     →   core, lit
lesson         →   core, lit
entries/*      →   core + the single component they register
auto.ts        →   every component (registers all tags)
index.ts       →   every component class (no registration)
```

All of this ships as one npm package. The split into `core/`, `components/`, `lesson/`, `tokens/`, `entries/` is an **internal file-organisation convention**, not a multi-package publish story.

## Component anatomy

Every component follows the same skeleton (see [`src/components/card.ts`](../src/components/card.ts) for the canonical example):

```ts
import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../core/index.js";

export class CeExample extends CecElement {
  static override styles = css`
    :host { display: block; background: var(--ce-surface); }
    :host([color="green"]) { … }
  `;

  // Opt into Shadow DOM only if you need :host()-based selectors or style
  // isolation. Default (light DOM) preserves slot compat with markdown,
  // Mermaid diagrams, Chart.js, and arbitrary user HTML.
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) color: CecColor = "neutral";
  @property({ type: Boolean, reflect: true }) hoverable = false;

  override render() {
    return html`<slot></slot>`;
  }
}
```

Then export it from [`src/index.ts`](../src/index.ts) and register it in [`src/auto.ts`](../src/auto.ts):

```ts
defineOnce("ce-example", CeExample);
```

A unit test file `<name>.test.ts` next to the source covers props, attributes, slots, and events. A per-tag entry `src/entries/<name>.ts` exposes the subpath import `custom-elements-collection/<name>` for tree-shakable registration.

## Theming model

All visual values come from `--ce-*` CSS custom properties defined in `src/tokens/tokens.css`. Two theme overrides ship by default:

- `html[data-ce-theme="dark"]` (default)
- `html[data-ce-theme="light"]`

Consumers override any variable on `:root`, on `<html>`, or on a parent element. Per-component accent (`<ce-kpi color="green">`) maps to a token (`var(--ce-color-green)`); component source never inlines a hex value.

The token system is organised into **axes** — semantic categories with distinct purposes:

- **`--ce-space-*`** — layout gaps and container padding (4 px grid).
- **`--ce-inset-*`** — vertical/horizontal padding *inside* compact interactive leaf elements (chips, pills, nav links, table cells). Distinct from `--ce-space-*` because element-inset sizing doesn't follow the same rhythm as layout gaps.
- **`--ce-sz-*`** — fixed geometric sizes (width/height) for icon containers, avatars, and badges.
- **`--ce-state-*`** — hover/active background overlays. Lighter than `--ce-color-*-bg`; white-overlay on dark themes, black-overlay on light themes.
- **`--ce-code-*`** — code-surface colors, intentionally dark regardless of ambient theme.
- **`--ce-color-*`**, **`--ce-radius-*`**, **`--ce-text-*`** — semantic colors, radii, font sizes.

## Light DOM vs Shadow DOM

`CecElement.createRenderRoot()` returns `this` by default — that's **light DOM**.

- **Pros:** Tokens flow through the cascade; slots work for arbitrary markup including markdown content, Mermaid diagrams, or Chart.js canvases.
- **Cons:** No `:host()` selectors; host-page CSS can leak in.

When a component needs `:host([attr])` styling (e.g. `ce-card` with `accent="green"`), it opts into Shadow DOM:

```ts
protected override createRenderRoot(): ShadowRoot {
  return this.createShadowRootWithStyles();
}
```

The `createShadowRootWithStyles()` helper attaches a shadow root AND adopts `static styles`. (Without the helper, the base-class override would silently strip styles — a pitfall to remember.)

Full rationale: [ADR-002](./adr/adr-002-light-dom.md).

## Tag namespace

| Prefix | Purpose |
|--------|---------|
| `ce-*` | General UI components |
| `lesson-*` | Education / lesson widgets |

Do not introduce new prefixes without an ADR. Two prefixes is enough; more would dilute the namespace.

## Build pipeline

- **Vite (lib mode)** compiles each entry in `src/entries/*`, plus `src/index.ts`, `src/auto.ts`, and `src/manifest.ts`, into `dist/`. Lit is bundled into the output so a single `<script type="module">` works in plain HTML with no import map. Tradeoff: +15 KB over peer-dep'd Lit; full bundle is ~21 KB gzipped.
- **TypeScript** emits declaration files via `tsconfig.build.json` (`emitDeclarationOnly: true`).
- **Token copy** — `scripts/copy-tokens.mjs` copies `src/tokens/*.css` into `dist/tokens/` so the export-map entries `./tokens.css`, `./dark.css`, `./light.css` resolve.

```
pnpm build   →   vite build
                 tsc -p tsconfig.build.json
                 node scripts/copy-tokens.mjs
```

## Test pipeline

- **Vitest** with the `jsdom` environment runs unit tests co-located with each component (`<name>.test.ts`).
- Tests use `defineOnce` to register a tag once per process, then `await el.updateComplete` to synchronise with Lit's render cycle.
- `pnpm check` runs typecheck + tests + build in sequence.

## Distribution

Three entry styles supported simultaneously:

1. **Auto-register everything.** One side-effect import registers all 31 tags:
   ```ts
   import "custom-elements-collection/auto";
   ```
2. **Tree-shake to specific tags.** Each subpath is a side-effect module that registers exactly one tag:
   ```ts
   import "custom-elements-collection/hero";
   import "custom-elements-collection/lesson-quiz";
   ```
3. **Dynamic / on-demand.** Runtime loader for dashboards and lesson authoring tools:
   ```ts
   import { loadOnDemand } from "custom-elements-collection";
   await loadOnDemand(["ce-hero", "ce-kpi"]);
   ```

CDN consumption via unpkg or jsDelivr works for all three — the `dist/` tree is what's shipped to npm and mirrored by every CDN.

## When to add a new component

A widget earns a slot when:

1. The pattern shows up in multiple unrelated contexts (status indicators, dashboard layouts, lesson frames).
2. The visual style is consistent enough that a single tag with a few props captures the variation.
3. Theming survives pure CSS custom properties (no per-instance JS styling).

If only one place uses it, leave it as inline HTML in that place. Don't pollute the namespace.

## Constraints worth remembering

- **No CDN dependencies at runtime.** Components self-register; tokens are CSS variables, not JSON or JS.
- **Light DOM by default** — see [ADR-002](./adr/adr-002-light-dom.md).
- **All theming via CSS variables** — component source never inlines a hex.
- **Prefer `ce-chip` over inventing badge/pill/tag.** Same for `ce-callout` over admonition/alert/note.
- **Tests are required.** No new component without ≥6 unit tests.

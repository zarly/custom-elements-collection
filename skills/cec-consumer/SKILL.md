---
name: cec-consumer
description: USE WHENEVER an HTML/Vue/React/Svelte/Astro page or LLM-generated markup is going to embed `<ce-*>` or `<lesson-*>` tags from the `custom-elements-collection` library — release-readiness dashboards, KPI reports, copilot/chat surfaces, RAG/agent traces, feedback dashboards, lesson pages, generative-DOM streaming output. Trigger phrases: `ce-card`, `ce-kpi`, `ce-bar-chart`, `ce-chat-bubble`, `ce-tool-call`, `ce-feedback-sink`, `ce-button`, `ce-input`, `ce-gauge`, `ce-verdict`, `lesson-quiz`, `lesson-frame`, `data-ce-theme`, `--ce-*` tokens, the `<ce-` prefix, `@generative-dom/plugin-companion`, `auto.js`, "tree-shake to one tag", "load on demand"; or any question about picking, theming, composing, or troubleshooting those tags. SKIP when editing the library itself (use `cec-component-author` for `src/components/**`, `cec-core-maintenance` for `src/core/` or generators, `cec-theming` for a new `src/tokens/<slug>.css`, `cec-publishing` for releases), or for generic Lit / vanilla custom-elements / Shadow DOM tutorials unrelated to this library.
---

# Consuming `custom-elements-collection`

Framework-agnostic Web Components on Lit 3. Drop into any page (CDN), any framework (npm + bundler), or any vendored-files environment. Lit is bundled — no peer dependencies, no runtime CDN reach. The library is also designed for **LLM-emitted markup**: every tag works with plain HTML, JSON-on-attribute, and streamed slot children (see ADR-009).

> **The catalog and per-tag API live in `*.meta.json`.** This skill is the audience-specific orientation layer. For the full per-component table + auto-regenerated index, open [`references/catalog.md`](references/catalog.md) and [`references/index.md`](references/index.md). For a specific tag, read `node_modules/custom-elements-collection/dist/meta/<tag>.json` or `src/components/<stem>/<stem>.meta.json` in the repo. The same data is projected into an LLM-tool-use-shaped form under `dist/registry/<tag>.json` (ADR-007).

---

## Three install paths — pick the smallest that works

### A — CDN (zero install)

```html
<!doctype html>
<html data-ce-theme="dark">
  <head>
    <link rel="stylesheet" href="https://unpkg.com/custom-elements-collection/dist/tokens/tokens.css">
    <script type="module" src="https://unpkg.com/custom-elements-collection/dist/auto.js"></script>
  </head>
  <body><!-- every ce-* and lesson-* tag is registered --></body>
</html>
```

`auto.js` registers **every** tag. Swap unpkg → jsDelivr / esm.sh if latency hurts.

### B — npm + bundler (smallest production bundle)

```bash
pnpm add custom-elements-collection
```

Three registration modes, ordered by output size:

```ts
// 1 — Tree-shake to one tag at a time (smallest)
import "custom-elements-collection/hero";
import "custom-elements-collection/kpi";
import "custom-elements-collection/feedback-sink";
import "custom-elements-collection/lesson-quiz";

// 2 — Register at runtime, on demand
import { loadOnDemand } from "custom-elements-collection";
await loadOnDemand(["ce-hero", "ce-kpi"]);

// 3 — Register everything (simplest, biggest bundle)
import "custom-elements-collection/auto";
```

Bundle math: a brick is ~1 kB gzip (`ce-cursor`, `ce-chip`), a widget is ~4 kB (`ce-feedback-sink`, `ce-rating`), shared Lit chunk is ~7.5 kB loaded once.

### C — Vendored static files

If CDNs and bundlers are forbidden, copy `node_modules/custom-elements-collection/dist/` into `public/` and link by relative path. Everything in `dist/` runs in browsers — no Node shims.

For bundler config (Vue `isCustomElement`, React 18 vs 19, SSR caveats), see [`references/setup.md`](references/setup.md).

---

## Theming — link the base, then optionally one bundle

```html
<link rel="stylesheet" href=".../tokens/tokens.css">
<link rel="stylesheet" href=".../tokens/solarized.css">   <!-- optional -->
<html data-ce-theme="solarized">
```

11 bundles ship (`dark` default, `light`, `swiss`, `bauhaus`, `muji`, `neo-brutal`, `solarized`, `nordic`, `memphis`, `gruvbox`) plus `auto` (follows `prefers-color-scheme`). For the picking matrix and full token catalog, see [`../cec-theming/references/tokens.md`](../cec-theming/references/tokens.md).

To override a single token without a theme bundle:

```css
:root { --ce-color-blue: oklch(60% 0.2 240); }      /* project-wide */
.brand-zone { --ce-color-blue: var(--my-brand); }   /* per-section */
ce-card[accent="blue"] { --ce-color-blue: oklch(72% 0.17 250); }   /* per-instance */
```

Anything more involved (designing a new bundle, debugging contrast, dark/light parity) → load `cec-theming`.

---

## Picking a component

Decision shortcuts (each row points at a tag — open its meta for the full API):

| If you need… | Use |
|---|---|
| Big number on a card | `ce-kpi` |
| Generic content surface | `ce-card` |
| Final verdict banner | `ce-verdict` (4 canonical types) |
| Note / warn / error / success block | `ce-callout` (set `type`) |
| Bar chart (single series, JSON data) | `ce-bar-chart data='[…]'` |
| Bar chart (handwritten rows, rich labels) | `ce-bar-chart` with `<ce-bar-row>` children (CDR-005) |
| Multi-series chart | `ce-chart` (Chart.js) |
| 2-D heatmap | `ce-heatmap data='[[…]]'` or with `<ce-heat-row>` + `<ce-heat-cell>` children |
| Step flow | `ce-flow steps='[…]'` or with `<ce-flow-step>` children |
| Chat message bubble | `ce-chat-bubble` |
| LLM tool-call panel | `ce-tool-call` |
| Inline citation footnote | `ce-citation` |
| Thumbs / stars rating | `ce-rating mode="thumbs|stars"` (static unless `name` set — CDR-004) |
| Per-item feedback row | `ce-feedback-bar` inside `ce-feedback-sink` |
| Themable button (4 variants + loading) | `ce-button` |
| Labelled text input | `ce-input` |
| Lesson wrapper with progress | `lesson-frame` |
| Multiple choice | `lesson-quiz` |

When two candidates fit equally well, **read both meta files** — `goal` + `description` + `tier` (brick/widget/layout) resolve almost every ambiguity. Full decision table: [`references/picking.md`](references/picking.md).

For a filtered programmatic read:

```bash
node node_modules/custom-elements-collection/scripts/components.mjs --help
node scripts/components.mjs --tag ce-rating
node scripts/components.mjs --group "Chat surfaces" --fields tag,goal,events.name
```

---

## Composition recipes

```html
<!-- Release dashboard -->
<ce-shell>
  <ce-hero kicker="Q4" title="Release readiness">
    <ce-kpi slot="stats" value="96%" label="Pass"   color="green"></ce-kpi>
    <ce-kpi slot="stats" value="0"   label="Bugs"   color="red"></ce-kpi>
  </ce-hero>
  <ce-bar-chart data='[{"label":"auth","value":96,"color":"green"}]'></ce-bar-chart>
  <ce-callout type="success" title="Ready to ship">All gates green.</ce-callout>
</ce-shell>

<!-- Chat surface -->
<ce-chat-bubble role="assistant" author="Claude">
  Here's a draft.
  <ce-tool-call slot="footer" name="search" status="ok"></ce-tool-call>
  <ce-rating slot="footer" mode="thumbs"></ce-rating>
</ce-chat-bubble>

<!-- Feedback subtree (zero-backend; persists to localStorage) -->
<ce-feedback-sink subject="naming-2026-04-29">
  <ce-feedback-bar item="genrender" label="Generative render">
    <ce-rating mode="thumbs"></ce-rating>
    <ce-bookmark></ce-bookmark>
    <ce-comment></ce-comment>
  </ce-feedback-bar>
  <ce-feedback-summary></ce-feedback-summary>
  <ce-feedback-export></ce-feedback-export>
</ce-feedback-sink>
```

Extended versions (lesson page, docs shell, multi-bar feedback) live in [`references/recipes.md`](references/recipes.md).

---

## Author-side rules to know (because they affect what works)

These are library invariants — they show up as failure modes if you violate them in your consumer markup:

- **Attributes are strings.** Anything structural (arrays, objects) goes on-attribute as JSON: `<ce-bar-chart data='[{"label":"a","value":1}]'>`. The component parses with try/catch and falls back loudly on malformed JSON. Per-property `el.data = […]` from JS works too.
- **Light DOM by default (ADR-002).** Slotted children render in the page's main tree, so streaming markdown, Mermaid, and Chart.js content keeps working inside slots. Components opt into Shadow DOM only when they need style isolation — that's per-component, not consumer-visible.
- **No `<script>` in `*.examples.html` patterns** — the canonical examples show structural data on attributes + simple props (`x-label`, `height`, `color`) as separate attributes. Copy from `dist/registry/<tag>.json` examples and you stay safe.
- **Tokens own presentation, components don't.** Don't reach for "set the card's background to `#1f2937`" — set `--ce-surface` on the relevant scope and let every `ce-*` follow.
- **Streaming-aware slots.** All chat-surface components handle late-added children: `ce-chat-bubble`, `ce-cursor`, `ce-tool-call`. Append children after upgrade and the component updates — see `@generative-dom/plugin-companion` for the canonical streaming pipeline.

---

## Common pitfalls

- **Hex literal on a `<ce-*>`.** Use the token (`--ce-color-blue`, `--ce-surface`) — `style="background: #1f2937"` will fight the theme.
- **JSON attribute escaped wrong.** Use single quotes around the attribute and double quotes inside: `data='[{"k":"v"}]'`. The other way around fights HTML parsers.
- **`ce-rating` not interactive.** That's CDR-004: static by default; set `name="…"` to opt into form-association + change events.
- **Streaming markdown breaks inside a Shadow DOM child.** If you wrap a `<ce-*>` in your own Shadow-DOM-using element, slot projection has to pierce both — usually the issue is the outer element, not ours.
- **`ce-feedback-sink` SSR.** Renders an empty stub server-side; hydrate happens client-side on read of `localStorage`. Don't assert on its rendered children before mount.
- **`ce-stat-group` is deprecated.** Use `ce-grid` + `ce-kpi` (ADR-010).

---

## Where to look next

- [`references/catalog.md`](references/catalog.md) — full auto-generated catalog (all tags, grouped, with one-line goals).
- [`references/index.md`](references/index.md) — per-tag index with class, tier, group, stability, and links to the canonical `*.meta.json`.
- [`references/picking.md`](references/picking.md) — full picking decision table (~70 rows).
- [`references/setup.md`](references/setup.md) — bundler config, SSR caveats, framework integrations, bundle math.
- [`../cec-theming/references/tokens.md`](../cec-theming/references/tokens.md) — full token catalog and the 11 themes.
- [`references/recipes.md`](references/recipes.md) — extended composition examples.
- `src/<area>/<stem>/<stem>.meta.json` — canonical per-component API (props, events, slots, CSS vars, side effects).
- `dist/registry.json` + `dist/registry/<tag>.json` — LLM-tool-use-shaped projection (ADR-007).
- `node scripts/components.mjs --help` — filtered queries over the meta corpus.

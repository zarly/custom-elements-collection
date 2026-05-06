# custom-elements-collection

[![npm](https://img.shields.io/npm/v/custom-elements-collection.svg)](https://www.npmjs.com/package/custom-elements-collection)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A collection of **72 framework-agnostic Web Components** built on [Lit 3](https://lit.dev) — 66 general-purpose UI building blocks (`ce-*`) covering layout, metrics, narrative, chat surfaces, human-in-the-loop feedback, form controls, dashboard primitives, and rich-content viewers, plus 6 educational widgets (`lesson-*`). Drop them into any HTML page, any framework, any static site generator. No build step required on the consumer side.

Every component is self-describing via a per-component `*.meta.json` file (see [ADR-005](./docs/adr/adr-005-component-meta.md)) — props, events, slots, CSS variables, dependency graph, side effects, and accessibility notes are machine-readable.

---

## 30-second tour

```html
<!doctype html>
<html data-ce-theme="dark">
<head>
  <link rel="stylesheet"
        href="https://unpkg.com/custom-elements-collection/dist/tokens/tokens.css">
  <script type="module"
          src="https://unpkg.com/custom-elements-collection/dist/auto.js"></script>
</head>
<body>
  <ce-shell>
    <ce-hero kicker="Status" title="Release readiness">
      <ce-kpi slot="stats" value="96%" label="Pass" color="green"></ce-kpi>
      <ce-kpi slot="stats" value="0"   label="Bugs" color="red"></ce-kpi>
    </ce-hero>
    <ce-callout type="success" title="Ready to ship">
      All quality gates green.
    </ce-callout>
  </ce-shell>
</body>
</html>
```

---

## Install

```bash
pnpm add custom-elements-collection
```

Lit is bundled — no peer dependencies required.

### Three ways to register tags

```ts
// A) Register every tag at once
import "custom-elements-collection/auto";

// B) Tree-shake to specific tags
import "custom-elements-collection/hero";
import "custom-elements-collection/kpi";
import "custom-elements-collection/lesson-quiz";

// C) Load dynamically at runtime
import { loadOnDemand } from "custom-elements-collection";
await loadOnDemand(["ce-hero", "ce-kpi", "lesson-rule"]);
```

---

## Theming

All colors, spacing, and radii come from CSS custom properties named `--ce-*`. Ship the defaults and override anywhere:

```html
<link rel="stylesheet"
      href="https://unpkg.com/custom-elements-collection/dist/tokens/tokens.css" />
```

```css
:root {
  --ce-color-primary: oklch(72% 0.17 250);
  --ce-radius: 12px;
  --ce-font-sans: "Inter", system-ui, sans-serif;
}
```

Dark / light overrides are shipped as separate stylesheets:

```html
<link rel="stylesheet"
      href="https://unpkg.com/custom-elements-collection/dist/tokens/dark.css" />
<link rel="stylesheet"
      href="https://unpkg.com/custom-elements-collection/dist/tokens/light.css" />
```

---

## Component catalog

### UI — layout & primitives (10)
`ce-shell` · `ce-hero` · `ce-section` · `ce-grid` · `ce-card` · `ce-chip` · `ce-table` · `ce-callout` · `ce-details` · `ce-toc`

### UI — metrics & charts (5)
`ce-kpi` · `ce-progress` · `ce-bar-chart` · `ce-chart` · `ce-heatmap`

### UI — comparison & narrative (10)
`ce-verdict` · `ce-timeline` · `ce-compare` · `ce-flow` · `ce-decision-tree` · `ce-example` · `ce-feature-card` · `ce-persona` · `ce-code` · `ce-filter-bar`

### UI — chat surfaces (8) — v0.3
`ce-chat-bubble` · `ce-cursor` · `ce-thinking` · `ce-copy-button` · `ce-tool-call` · `ce-citation` · `ce-rating` · `ce-retry-button`

LLM chat / copilot / agent UI primitives. `ce-rating` supports both thumbs-up/down and 0-N star modes and is form-associated. `ce-tool-call` collapses an LLM tool invocation with `args` / `result` / `error` slots. Compatible with [`@mdflow/plugin-companion`](https://github.com/mdflow/mdflow).

### UI — feedback (8) — v0.3 / v0.4
`ce-feedback-sink` · `ce-feedback-bar` · `ce-bookmark` · `ce-dismiss` · `ce-comment` · `ce-feedback-summary` · `ce-feedback-export` · `ce-feedback-heatmap`

Human-in-the-loop feedback for any HTML dashboard. Wrap content in `<ce-feedback-sink subject="…">`, drop one `<ce-feedback-bar item="…">` per item with toggles + ratings + comments inside, and the sink streams to localStorage / HTTP / file / console / custom transport. `ce-feedback-heatmap` (v0.4) renders a verdict-distribution sparkbar from the same state. Live demo at [`demo/feedback.html`](./demo/feedback.html).

### UI — form controls (6) — v0.4
`ce-button` · `ce-toggle` · `ce-checkbox` · `ce-input` · `ce-textarea` · `ce-confirm`

Themable form controls with full ARIA semantics: `ce-button` (primary/secondary/ghost/destructive + loading), `ce-toggle` (`role=switch`), `ce-checkbox` (with `aria-checked=mixed`), `ce-input` and `ce-textarea` (label + help/error + aria-describedby), `ce-confirm` (inline `role=alertdialog` yes/no with danger variant).

### UI — dashboard primitives (10) — v0.4
`ce-status-light` · `ce-badge` · `ce-skeleton` · `ce-stat-group` · `ce-counter` · `ce-clock` · `ce-sparkline` · `ce-gauge` · `ce-donut` · `ce-checklist`

Compact dashboard cells: traffic-light status dot, count badge, loading shimmer, KPI grid wrapper, animated `ce-counter` with rAF easing, live `ce-clock` (Intl/IANA), inline `ce-sparkline` (line/area/bar), semicircle `ce-gauge` (`role=meter`), categorical `ce-donut` chart, interactive `ce-checklist` with localStorage persistence.

### UI — rich content (6) — v0.4
`ce-abbr` · `ce-image` · `ce-file-card` · `ce-key-value` · `ce-json` · `ce-diff`

Inline rich content for chat surfaces and reports: focusable `ce-abbr` with tooltip expansion, lazy `ce-image` with caption + fallback, `ce-file-card` attachment chip with type icons, `ce-key-value` definition-list grid, `ce-json` pretty-print viewer with collapse + parse-error event, LCS-based `ce-diff` (unified/split layouts).

### Lesson (6)
`lesson-frame` · `lesson-rule` · `lesson-gap` · `lesson-quiz` · `lesson-quickfire` · `lesson-audio`

A machine-readable manifest of every component is exported as [`COMPONENTS`](./src/manifest.ts). Internal layout primitives (`ce-docs-layout`, `ce-nav-list`, `ce-theme-switcher`) ship with the package but are filtered out of the published manifest at publish time (see ADR-005).

---

## Design principles

- **Light DOM by default.** Components render into the page's DOM, so markdown, Mermaid diagrams, and Chart.js canvases work inside slots. Shadow DOM is opt-in per component where style isolation matters. See [ADR-002](./docs/adr/adr-002-light-dom.md).
- **Theming via CSS custom properties.** No per-component prop explosion. See [ADR-003](./docs/adr/adr-003-theming.md).
- **Zero config on the consumer side.** One `<script type="module">` from a CDN gets you all tags.
- **Self-describing.** Each component ships with a validated `*.meta.json` describing every prop, event, slot, CSS variable, side effect, and dependency. See [ADR-005](./docs/adr/adr-005-component-meta.md).
- **Type-safe.** Full `.d.ts` for every component and the manifest.

---

## Documentation

- [Usage guide](./docs/USAGE.md) — plain HTML, bundlers, Vue / React / Svelte, theming, composition patterns, troubleshooting.
- [Architecture](./docs/ARCHITECTURE.md) — repo layout, component anatomy, build pipeline, theming model.
- [ADRs](./docs/adr/) — framework choice, Light DOM, theming, distribution modes, component meta files.
- [Component meta plan](./docs/COMPONENT_META_PLAN.md) — schema, scripts, migration phases, generator design.

---

## Browser support

Any evergreen browser with native support for `customElements`, ES modules, and `CSS.registerProperty` (Chrome / Edge / Firefox / Safari 16.4+).

---

## License

[MIT](./LICENSE)

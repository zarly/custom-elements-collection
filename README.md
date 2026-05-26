# custom-elements-collection

[![npm](https://img.shields.io/npm/v/custom-elements-collection.svg)](https://www.npmjs.com/package/custom-elements-collection)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**🌐 Live demo:** [generativeui.ru/solutions/custom-elements-collection](https://generativeui.ru/solutions/custom-elements-collection/) — Storybook-style catalog over every tag, with a live theme switcher across 10 themes.

A collection of **147 framework-agnostic Web Components** built on [Lit 3](https://lit.dev) — 129 general-purpose UI building blocks (`ce-*`) covering layout primitives, navigation, metrics, comparison & decision analysis, chat / agent surfaces, human-in-the-loop feedback, form controls, dashboards, and rich-content viewers, plus 18 educational widgets (`lesson-*`). Drop them into any HTML page, any framework, any static site generator. No build step required on the consumer side.

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

Full catalog with per-tag goals, recipes, and links lives in [`skills/cec-consumer/`](./skills/cec-consumer/) — `SKILL.md` (consumer orientation) + `references/catalog.md` (auto-generated full catalog), `references/index.md` (per-tag index), `references/picking.md` (decision table), `references/recipes.md` (composition examples), and `references/setup.md` (bundler / SSR / framework). Quick map of what's in the box:

### Layout & primitives (38)
`ce-abbr` · `ce-accordion` · `ce-affix` · `ce-avatar` · `ce-avatar-group` · `ce-badge` · `ce-breadcrumbs` · `ce-callout` · `ce-card` · `ce-center` · `ce-chip` · `ce-countdown` · `ce-details` · `ce-divider` · `ce-drawer` · `ce-dropdown-menu` · `ce-duration` · `ce-frame` · `ce-grid` · `ce-hero` · `ce-icon` · `ce-kbd` · `ce-link` · `ce-mark` · `ce-modal` · `ce-page` · `ce-pagination` · `ce-popover` · `ce-progress-list` · `ce-relative-time` · `ce-section` · `ce-shell` · `ce-skeleton` · `ce-stack` · `ce-table` · `ce-tabs` · `ce-tag` · `ce-toc`

### Metrics & charts (11)
`ce-bar-chart` · `ce-bar-row` · `ce-chart` · `ce-donut` · `ce-heat-cell` · `ce-heatmap` · `ce-heat-row` · `ce-kpi` · `ce-plot` · `ce-progress` · `ce-score`

### Comparison & narrative (19)
`ce-code` · `ce-compare` · `ce-decision-tree` · `ce-example` · `ce-feature-card` · `ce-filter-bar` · `ce-flow` · `ce-flow-step` · `ce-matrix` · `ce-persona` · `ce-pricing-tier` · `ce-pros-cons` · `ce-quote` · `ce-rank-list` · `ce-recommendation` · `ce-step` · `ce-steps` · `ce-timeline` · `ce-verdict`

Decision-analysis primitives — `ce-pros-cons` (two-column pros vs cons), `ce-matrix` (2×2 quadrant chart for Eisenhower / impact-effort), and `ce-rank-list` (positional leaderboard with optional deltas) — ship alongside the older narrative primitives.

### Chat surfaces (18)
`ce-attachment-strip` · `ce-chat-bubble` · `ce-chat-input` · `ce-citation` · `ce-conversation-tree` · `ce-copy-button` · `ce-cursor` · `ce-message-group` · `ce-rating` · `ce-reasoning` · `ce-retry-button` · `ce-source-card` · `ce-stop-button` · `ce-stream-status` · `ce-suggestion-chip` · `ce-thinking` · `ce-tool-call` · `ce-tool-result`

LLM chat / copilot / agent UI primitives. `ce-chat-input` is a composite composer (auto-grow textarea + send/stop/attach buttons + Enter-to-submit) with `ce-attachment-strip` for previewable upload tiles above it. `ce-message-group` clusters consecutive same-role messages; `ce-conversation-tree` is the `◀ 2 / 5 ▶` branch picker for forked / regenerated responses; `ce-stream-status` is the connecting / streaming / done / error pill with optional tokens-per-second. `ce-reasoning` is a collapsible chain-of-thought trace; `ce-thinking` is the pre-token spinner. `ce-suggestion-chip` is the tappable follow-up prompt and `ce-stop-button` is the mid-stream cancel counterpart to `ce-retry-button`. `ce-rating` supports both thumbs-up/down and 0–N star modes and is form-associated. `ce-tool-call` collapses an LLM tool invocation with `args` / `result` / `error` slots; `ce-tool-result` is the panel companion for the return value. `ce-source-card` renders a retrieved-source card for RAG surfaces and pairs with inline `ce-citation` footnote markers. Compatible with [`@generative-dom/plugin-companion`](https://github.com/generative-dom/generative-dom).

### Feedback (11)
`ce-bookmark` · `ce-comment` · `ce-dismiss` · `ce-empty-state` · `ce-feedback-bar` · `ce-feedback-export` · `ce-feedback-heatmap` · `ce-feedback-sink` · `ce-feedback-summary` · `ce-spinner` · `ce-tooltip`

Human-in-the-loop feedback for any HTML dashboard. Wrap content in `<ce-feedback-sink subject="…">`, drop one `<ce-feedback-bar item="…">` per item with toggles + ratings + comments inside, and the sink streams to localStorage / HTTP / file / console / custom transport. `ce-feedback-heatmap` renders a verdict-distribution sparkbar from the same state. Live demo at [`demo/feedback.html`](./demo/feedback.html).

### Forms (16)
`ce-button` · `ce-checkbox` · `ce-check-item` · `ce-checklist` · `ce-combobox` · `ce-confirm` · `ce-date-picker` · `ce-field` · `ce-file-upload` · `ce-input` · `ce-radio-group` · `ce-search` · `ce-segmented` · `ce-select` · `ce-textarea` · `ce-toggle`

Themable form controls with full ARIA semantics: `ce-button` (primary/secondary/ghost/destructive + loading), `ce-toggle` (`role=switch`), `ce-checkbox` / `ce-radio-group` (with `aria-checked` semantics), `ce-input` / `ce-textarea` / `ce-select` / `ce-date-picker` / `ce-search` (label + help/error + aria-describedby), `ce-combobox` and `ce-segmented` (single-pick with portal panel / joined buttons), `ce-field` (label + control + help/error wrapper), `ce-file-upload` (drag-drop dropzone emitting `ce-files`), and `ce-confirm` (inline `role=alertdialog` yes/no).

### Dashboard (6)
`ce-clock` · `ce-counter` · `ce-gauge` · `ce-sparkline` · `ce-stat-group` · `ce-status-light`

Compact dashboard cells: live `ce-clock` (Intl / IANA), animated `ce-counter` (rAF easing), semicircle `ce-gauge` (`role=meter`), inline `ce-sparkline` (line / area / bar), traffic-light `ce-status-light`, and the `ce-stat-group` KPI-grid wrapper.

### Content (10)
`ce-diff` · `ce-feed` · `ce-file-card` · `ce-image` · `ce-json` · `ce-key-value` · `ce-kv` · `ce-list` · `ce-qr` · `ce-tree`

Rich content for chat surfaces and reports: lazy `ce-image` with caption + fallback, `ce-file-card` attachment chip with type icons, `ce-key-value` / `ce-kv` definition-list grid with typed-value children (CDR-002), `ce-json` pretty-print viewer, LCS-based `ce-diff` (unified / split), `ce-feed` (chronological list with day/week/month grouping), `ce-list` and `ce-tree` (vertical sequence / nested tree with ARIA roles), and `ce-qr` byte-mode QR encoder with no runtime dependencies.

### Education — `lesson-*` (18)
`lesson-audio` · `lesson-compare` · `lesson-confidence` · `lesson-frame` · `lesson-gap` · `lesson-hint` · `lesson-match` · `lesson-myth` · `lesson-note` · `lesson-option` · `lesson-question` · `lesson-quickfire` · `lesson-quiz` · `lesson-reveal` · `lesson-rule` · `lesson-step` · `lesson-summary` · `lesson-vocab`

A machine-readable manifest of every component is exported as [`COMPONENTS`](./src/manifest.ts). Internal layout primitives (`ce-docs-layout`, `ce-nav-list`, `ce-theme-switcher`) and the headless data carrier (`ce-data`) ship with the package but are filtered out of the published manifest at publish time (see ADR-005).

---

## Design principles

- **Light DOM by default.** Components render into the page's DOM, so markdown, Mermaid diagrams, and Chart.js canvases work inside slots. Shadow DOM is opt-in per component where style isolation matters. See [ADR-002](./docs/adr/adr-002-light-dom.md).
- **Theming via CSS custom properties.** No per-component prop explosion. See [ADR-003](./docs/adr/adr-003-theming.md).
- **Zero config on the consumer side.** One `<script type="module">` from a CDN gets you all tags.
- **Self-describing.** Each component ships with a validated `*.meta.json` describing every prop, event, slot, CSS variable, side effect, and dependency. See [ADR-005](./docs/adr/adr-005-component-meta.md).
- **Type-safe.** Full `.d.ts` for every component and the manifest.

---

## Demo

The interactive catalog is hosted at **[generativeui.ru/solutions/custom-elements-collection](https://generativeui.ru/solutions/custom-elements-collection/)** — no install, no build, every component browsable with live examples and a theme switcher.

To run it locally, `pnpm demo` boots the same UI on `:4600` against your working tree. The sidebar offers four navigation axes — all backed by the URL hash so deep links work and refreshes are safe:

- **Search** — substring match across tag / name / goal / description / tags. Keyboard `/` focuses, `Esc` clears.
- **Group by** — Group (default) / Tier / Stability / Category / Created month / A-Z.
- **Sort** — A-Z, Z-A, Recently updated, Recently created, Most dependents, Least dependents.
- **Filters** — opens a `<ce-modal>` with seven axes (stability, tier, category, has-events / has-slots / has-cssVars / has-globalDeps / has-sideEffects, free-form tags, created-in-last, updated-in-last). Recency axes carry both quick radios (7 / 30 / 90 / 365 days) and a free-form "custom days" input.

Each sidebar row shows a relative-time stamp (`<ce-relative-time>` for ≤ 30 days; the absolute ISO date older). Dates are auto-maintained by a pre-commit hook — see [ADR-011](docs/adr/adr-011-component-dates.md) + [ADR-012](docs/adr/adr-012-content-hash-registry.md).

## Documentation

- [Usage guide](./docs/USAGE.md) — plain HTML, bundlers, Vue / React / Svelte, theming, composition patterns, troubleshooting.
- [Architecture](./docs/ARCHITECTURE.md) — repo layout, component anatomy, build pipeline, theming model.
- [ADRs](./docs/adr/) — framework choice, Light DOM, theming, distribution modes, component meta files.
- [Publishing](./PUBLISHING.md) — npm release flow, sanity checklist, and how the hosted demo at [generativeui.ru/solutions/custom-elements-collection/](https://generativeui.ru/solutions/custom-elements-collection/) is updated.

---

## Companion projects

This library is one of two OSS sub-projects mounted under [generativeui.ru/solutions/](https://generativeui.ru/solutions/):

- **[generative-dom](https://generativeui.ru/solutions/generative-dom/)** — streaming-markdown parser & renderer for LLM chat surfaces. Pair with `@generative-dom/plugin-companion` to render `ce-*` tags directly from a streaming LLM response. ([npm](https://www.npmjs.com/package/generative-dom) · [GitHub](https://github.com/generative-dom/generative-dom))
- **custom-elements-collection** *(this repo)* — the catalog the model picks from.

---

## Browser support

Any evergreen browser with native support for `customElements`, ES modules, and `CSS.registerProperty` (Chrome / Edge / Firefox / Safari 16.4+).

---

## License

[MIT](./LICENSE)

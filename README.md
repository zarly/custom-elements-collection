# custom-elements-collection

[![npm](https://img.shields.io/npm/v/custom-elements-collection.svg)](https://www.npmjs.com/package/custom-elements-collection)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A collection of **31 framework-agnostic Web Components** built on [Lit 3](https://lit.dev) — 25 general-purpose UI building blocks (`ce-*`) and 6 educational widgets (`lesson-*`). Drop them into any HTML page, any framework, any static site generator. No build step required on the consumer side.

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

### Lesson (6)
`lesson-frame` · `lesson-rule` · `lesson-gap` · `lesson-quiz` · `lesson-quickfire` · `lesson-audio`

A machine-readable manifest of every component is exported as [`COMPONENTS`](./src/manifest.ts).

---

## Design principles

- **Light DOM by default.** Components render into the page's DOM, so markdown, Mermaid diagrams, and Chart.js canvases work inside slots. Shadow DOM is opt-in per component where style isolation matters. See [ADR-002](./docs/adr/adr-002-light-dom.md).
- **Theming via CSS custom properties.** No per-component prop explosion. See [ADR-003](./docs/adr/adr-003-theming.md).
- **Zero config on the consumer side.** One `<script type="module">` from a CDN gets you all 31 tags.
- **Type-safe.** Full `.d.ts` for every component and the manifest.

---

## Documentation

- [Usage guide](./docs/USAGE.md) — plain HTML, bundlers, Vue / React / Svelte, theming, composition patterns, troubleshooting.
- [Architecture](./docs/ARCHITECTURE.md) — repo layout, component anatomy, build pipeline, theming model.
- [ADRs](./docs/adr/) — framework choice, Light DOM, theming, distribution modes.

---

## Browser support

Any evergreen browser with native support for `customElements`, ES modules, and `CSS.registerProperty` (Chrome / Edge / Firefox / Safari 16.4+).

---

## License

[MIT](./LICENSE)

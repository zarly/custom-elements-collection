# Changelog

All notable changes to `custom-elements-collection` are documented here. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] — 2026-05-07

This release lands the charts-v2 program — `ce-plot` ships as a new SVG-based
multi-series chart and `ce-bar-chart` is replaced wholesale by its polished
successor. Two governance ADRs are added: ADR-008 introduces optional
`CONCEPT.md` files for per-component design rationale, and ADR-009 defines the
"components are tools, not products" tolerance contract for LLM-authored
markup.

### Added

- **`ce-plot`** — multi-series chart covering line / area / bar geometries in
  a single component. Pure SVG, no runtime dependencies. Auto-detects the x
  scale (`Date` → time, number → linear, string → category). Hover crosshair
  + tooltip card. Click-to-toggle legend. Four
  `ce-chart-{hover,leave,select,toggle}` events with documented payloads.
  Honours `prefers-reduced-motion`. ~8 KB gz.
- **`src/internal/charts/`** — shared helpers (`format`, `scale`, `color`,
  `easing`, `events`) consumed by `ce-bar-chart` and `ce-plot`. Not exported.
- **ADR-008 — per-component `CONCEPT.md` files.** Optional prose document next
  to a component's source that captures design rationale, alternatives
  considered, and closed-bug lessons. Read before non-trivial changes; never
  hand-edited by generators; never published. Reference implementation:
  `src/components/gauge/CONCEPT.md`. Companion `src/lesson/lesson-quickfire/CONCEPT.md`
  added in the same release.
- **ADR-009 — components are tools, not products.** Defines the tolerance
  contract for LLM-authored markup: bias toward optional fields, accept
  multiple input shapes, infer intent from data instead of `mode` flags,
  no visible-error chrome on missing inputs. Governs API design across the
  library; does not loosen framework invariants (tag prefixes, design tokens,
  slot-only-no-script).
- **`ce-textarea` examples** — co-located `textarea.examples.html` (was
  missing in v0.3).
- **`lesson-quickfire` test suite** — the component shipped without a sibling
  `*.test.ts` in v0.3; the new file covers scored / open / mixed-mode
  scoring, `correct: string[]`, and primitive coercion.

### Changed (breaking)

- **`ce-bar-chart` API replaced wholesale.** The previous minimal implementation
  is gone; the polished implementation that briefly shipped under the temporary
  tag `ce-bar-chart-v2` now owns the `ce-bar-chart` tag. Effects on existing
  consumers:
  - **Data shape:** `BarRow.color` widens from a typed enum (`CecColor`) to
    `string`. Existing values keep working; the field also accepts arbitrary
    CSS colors (`#5a8`, `oklch(...)`, `var(--brand)`) routed through
    `resolveColor()`.
  - **Default `label-width` changes from `180px` to `auto`.** Bars across rows
    align via CSS subgrid. To preserve old behavior, set `label-width="180px"`
    on the tag.
  - **New default `animated="true"`** — width transitions on data change. Set
    `animated="false"` for the previous static look; `prefers-reduced-motion`
    always wins regardless.
  - **New attributes** (additive, default-off): `gridlines`, `sparkline`,
    `show-values`, `format`, `empty-text`.
  - **Now dispatches** `ce-chart-{hover,leave,select}` events; rows are
    `tabindex=0` and respond to Enter/Space.
  - **Shadow-DOM internal class names changed** (`.ce-bar-row → .ce-row`,
    etc.). External CSS targeting the previous shadow internals will not
    apply; the public surface is the host attributes and `--ce-bar-*`
    CSS variables.
  - **Stability stays `stable`.** The temporary `ce-bar-chart-v2` tag is
    removed from the manifest — drop any `custom-elements-collection/bar-chart-v2`
    imports.
- **`ce-bar-chart` bundle grew from 1.51 KB gz to 3.64 KB gz** as a result of
  the merge. Within the < 4 KB target set in the charts-v2 concept doc.

### Changed

- **`lesson-quickfire` rounds — `correct` is now optional and accepts
  `string | string[]`** (ADR-009 in practice). Rounds without `correct` run as
  ungraded polls — the picked option flashes neutral instead of red, the
  score header is hidden, and the completion screen reads "Done!" instead of
  `0 / N`. The `lesson-quickfire-done` event payload's `total` field counts
  scored rounds only. Mixed scored/poll quizzes work in one element.
  Primitive answers are coerced via `String(x)` at match time.
- **`ce-gauge` polish** — hovering the gauge surfaces a native browser
  tooltip with the value, range, and target; the optional target tick shows
  a `Target: N` tooltip. The dial background token swapped from
  `--ce-surface-2` to `--ce-surface-3` for stronger contrast against the
  surrounding card.

### Fixed

- **`ce-chart` ref directive** — replaced an inlined `RefDirective` (which
  never set the canvas reference, so Chart.js never mounted) with the
  standard `ref()` import from `lit/directives/ref.js`. The component now
  renders.
- **`ce-plot` SVG geometry** — clamped chart height to its container box
  (the SVG was overflowing on narrow viewports) and hardcoded the bar corner
  radius (`rx=2`) since SVG geometric attributes do not accept CSS variables.
- **`ce-bar-chart` row alignment** — rows share a single subgrid label
  column; bars now line up across rows when label widths differ.

### Documentation

- ADR-008 — Per-component `CONCEPT.md` files.
- ADR-009 — Components are tools, not products: tolerant inputs and
  user-defined use.
- `CONTRIBUTING.md` updated for both ADRs and the markup-only `*.examples.html`
  contract (no `<script>` tags, ever — the library is consumed by LLM
  code-generators).

## [0.3.0] — 2026-05-06

This release expands the library from 34 to 72 components and introduces a
self-describing meta system, an LLM-tool-use registry, and a tier-driven
taxonomy. Existing imports continue to work — additions are purely additive.

### Added

#### New components (38 total)

- **Chat surfaces (8)** — `ce-chat-bubble`, `ce-cursor`, `ce-thinking`,
  `ce-copy-button`, `ce-tool-call`, `ce-citation`,
  `ce-rating` (form-associated, thumbs + stars), `ce-retry-button`. Primitives
  for LLM-app surfaces and streaming-markdown consumers.
- **Feedback UI (7)** — `ce-feedback-sink` with 5 transports (console,
  localStorage, custom URL, function, DOM event), `ce-feedback-bar`,
  `ce-bookmark`, `ce-dismiss`, `ce-comment`, `ce-feedback-summary`,
  `ce-feedback-export`.
- **Feedback Tier-3 (1)** — `ce-feedback-heatmap` distribution sparkline.
- **Dashboard primitives (10)** — `ce-status-light`, `ce-badge`, `ce-skeleton`,
  `ce-stat-group`, `ce-counter`, `ce-clock`, `ce-sparkline`, `ce-gauge`,
  `ce-donut`, `ce-checklist`.
- **Form controls (6)** — `ce-button`, `ce-toggle`, `ce-checkbox`, `ce-input`,
  `ce-textarea`, `ce-confirm`.
- **Rich content (6)** — `ce-abbr`, `ce-image`, `ce-file-card`, `ce-key-value`,
  `ce-json`, `ce-diff`.

#### Component meta system (ADR-005, ADR-006)

- Every component now ships a validated `*.meta.json` declaring identity,
  props, events, slots, CSS variables, dependency graph, tier, category, and
  tags. 72 meta files validate against a Zod schema (`src/meta/schema.ts`).
- Closed enums for `tier ∈ {brick, widget, layout}` (`src/meta/tiers.ts`) and
  `tags[0]` from a 10-group taxonomy (`src/meta/groups.ts`). `schemaVersion: 1`
  is now required on every meta.
- `pnpm validate-meta` cross-checks every meta against its sibling source and
  is part of the `pnpm check` gate.
- Meta is published as `dist/meta/<tag>.json` + `dist/meta/index.json`.
  Consumers can opt in via
  `import "custom-elements-collection/meta/ce-card.json"` or
  `"custom-elements-collection/meta"`. Production component bundles do not
  import meta — it is opt-in only.

#### LLM tool-use registry (ADR-007)

- New `dist/registry.json` projects every meta into an LLM-tool-use-shaped
  descriptor (heuristic TS-type → JSON-Schema). Filtered views ship under
  `dist/registry/by-tier/<tier>.json`, `dist/registry/by-group/<slug>.json`,
  `dist/registry/by-category/<cat>.json`, and `dist/registry/<tag>.json`.
- Consumers opt in via `import "custom-elements-collection/registry"` or the
  `./registry/*.json` wildcard subpath.
- Generated by `pnpm gen-registry` (standalone) or by the `copyRegistry()` Vite
  plugin during `pnpm build`. 17 vitest cases cover the projection in
  `src/meta/registry.test.ts`.

#### Generators and tooling

- `scripts/generate-exports.ts` regenerates `src/index.ts`, `src/auto.ts`,
  `src/entries/*`, `src/manifest.ts`, and the `exports` map in `package.json`
  from meta files. Runs as `prebuild`.
- `scripts/generate-skill.ts` regenerates the catalog block in
  `skill/SKILL.md` and `skill/references/index.md`. `pnpm gen-skill:check` is
  the drift gate.
- `scripts/build-publish-manifest.ts --apply` swaps in a publish-only manifest
  during `prepublishOnly` so internal layout primitives (`ce-docs-layout`,
  `ce-nav-list`, `ce-theme-switcher`) are excluded from `dist/manifest.js`
  while still shipping as JS modules.
- `scripts/bundle-stats.ts` appends per-tag gzip + raw sizes to
  `internal/bundle-stats.jsonl` on every `pnpm bundle-stats`, with a delta vs
  the previous record.
- `pnpm analyze` opt-in path: emits
  `internal/bundle-visualizer-{treemap,sunburst,network}.html` via
  `rollup-plugin-visualizer` (pinned 5.12.0).

#### Skill (`skill/`)

- Slim `skill/SKILL.md` with quick-start, themes table, decision matrix, and
  an auto-generated catalog block.
- `skill/scripts/components.mjs` — zero-deps CLI that reads the published meta
  index (`dist/meta/index.json`) and supports `--tag`, `--tier`, `--group`,
  `--fields` filters, with a fallback walk over `src/`.

#### Tests

- 525 vitest cases across 76 files (up from 165 at v0.1).
- Playwright real-browser specs added for feedback + rating + catalog
  (`e2e/feedback.spec.ts`).

### Changed

- **Folder layout** — every component is now a subfolder with sibling
  `<name>.{ts,test.ts,meta.json}`. Generated files (`src/index.ts`,
  `src/auto.ts`, `src/entries/*`, `src/manifest.ts`) are derived from meta and
  must not be hand-edited.
- **Demo data flow** — `demo/demo.js` reads from meta JSON via Vite eager
  glob; the hand-maintained `demo/docs-data.js` was removed.
- **Demo examples** are now co-located per component rather than centralized
  in a single `demo/examples.js`.
- **Architecture docs** — `docs/ARCHITECTURE.md` refreshed for the v0.3 repo
  layout, build pipeline, and theming axes.
- **CONTRIBUTING.md** — authoring flow updated for ADR-005 + tier + registry.
- **`package.json` description** — corrected from "49 framework-agnostic Web
  Components" to "72…" to match shipped surface.

### Documentation

- ADR-005 — Component meta files (`docs/adr/adr-005-component-meta.md`).
- ADR-006 — Closed-enum `tier` field + `schemaVersion`.
- ADR-007 — LLM tool-use component registry (filtered views + JSON-Schema
  heuristic).
- README.md updated to 72 components with the v0.3 surface enumerated.

### Known limitations (non-blocking; tracked for v0.3.1)

- **Feedback UI re-hydration on reload** preserves data correctly
  (`localStorage` via `ce-feedback-sink`), but descendant `ce-rating` /
  `ce-bookmark` / `ce-dismiss` / `ce-comment` controls re-mount in their
  default visual state instead of pre-selecting the previously-clicked option.
  Tracked in `internal/NOTES.md`.
- **Hex literals in 8 newer components** — 11 occurrences of `#fff` / `#111`
  remain in `badge`, `button`, `checkbox`, `checklist`, `comment`, `confirm`,
  `feedback-export`, `toggle`. CLAUDE.md rule 6 forbids hex in component
  source. Token `--ce-text-inverse` exists; a `--ce-color-fg-on-accent` token
  would be the proper fix. Behavior is correct (white text on colored accent);
  tracked for v0.3.1.

## [0.2.0] — 2026-04-26

### Added

- **Design-school themes (8)** — Swiss, Bauhaus, Muji, Neo-brutal, Solarized,
  Nordic, Memphis, Gruvbox CSS bundles.
- `ce-theme-switcher` component for runtime theme switching.

## [0.1.0] — 2026-04-22

Initial public surface: 31 components + 6 lesson widgets (= 37 tags), token
system, dark/light themes, `auto.ts` registration, tree-shakable per-tag
entries.

[Unreleased]: https://github.com/zarly/custom-elements-collection/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/zarly/custom-elements-collection/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/zarly/custom-elements-collection/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/zarly/custom-elements-collection/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/zarly/custom-elements-collection/releases/tag/v0.1.0

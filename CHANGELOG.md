# Changelog

All notable changes to `custom-elements-collection` are documented here. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] — 2026-05-18

This release lands two things at once: a **governance layer** (8 Component
Design Records, sister to ADR) and the **first wave of components driven by
real corpus evidence**. A 2026-05-17 audit of 335 `vis/`-folder HTML files
across four working roots found that only 10% used any `ce-*` tag — 90% of
visualisations were written as raw HTML. The 16 new components in this release
target the highest-frequency raw patterns from that audit, and every API was
validated against the new CDRs before implementation.

### Added — 8 Component Design Records (`docs/cdr/`)

System-wide design conventions sitting between ADR (MUST) and per-component
`CONCEPT.md` (MAY). All eight are accepted at compliance level **SHOULD**:
justified user-focused exceptions are allowed, but the deviation must be
documented in the component's `CONCEPT.md`.

- **CDR-001** — Style enum is finite (≤ 5 values); content vocabulary lives
  in slots, not enum aliases.
- **CDR-002** — Typed values belong in children, not in string attributes
  (so `<a>`, `<time>`, `<code>`, future typed renderers compose in).
- **CDR-003** — Presentation policy is global (CSS custom properties on
  `:root`), not per-instance boolean attributes.
- **CDR-004** — Static-first; stateful behaviour (`persist-key`, form
  association, events) is opt-in.
- **CDR-005** — Collections accept BOTH JSON-on-attribute AND slot-children;
  resolution order: `data` non-empty → JSON, else slot, else empty state.
- **CDR-006** — Components compose; no hard wrappers that filter children
  by tag name.
- **CDR-007** — Sensible defaults; the simplest invocation works for the
  common case and the first `@example` block uses ≤ 2 attrs beyond data.
- **CDR-008** — Additive changes only; deprecate via `stability: deprecated`
  + ADR before removal.

`CONTRIBUTING.md` §4 now references the CDRs as a pre-flight checklist for any
new component's public API. See [`docs/cdr/README.md`](docs/cdr/README.md) for
the lifecycle (candidate → accepted → distilled into a `validate.py` rule).

### Added — 16 new components

**Forms & content (Cluster 1):**
- **`ce-qr`** (brick, experimental, ~5 KB gz) — hand-rolled QR encoder per
  ISO/IEC 18004 byte mode, versions 1–40, ECC L/M/Q/H. No runtime dependency.
- **`ce-radio-group`** (widget) — ARIA-compliant grouped radios with
  form association.
- **`ce-tabs`** (widget) — JSON-array `tabs` attribute OR slotted
  `<button slot="tab">` children (the original CDR-005 reference).

**CDR-005/006 slot-child pairs (Sprint 1+2):**
- **`ce-kv`** — `key=` attribute + default-slot value (CDR-002). Used inside
  `ce-key-value`.
- **`ce-bar-row`** — per-row attributes + `label`/`meta` slots. Initially
  shipped as `ce-bar-chart`'s slot child; now publicly addressable. Extended
  in this release with `max`, `label`, `meta`, `value-display`.
- **`ce-flow-step`** — identity attrs + rich body slot. Used inside `ce-flow`.
- **`ce-heat-row` + `ce-heat-cell`** — slot mode for `ce-heatmap`; cells take
  rich default-slot content.
- **`ce-check-item`** — single checklist row. Used inside `ce-checklist`.

**CDR-006 composition primitive:**
- **`ce-progress-list`** — Light-DOM flex-column container that stacks
  `ce-progress` rows and arbitrary HTML children (paragraphs, callouts) with
  consistent gap. No tag-name filtering.

**Frequent-patterns audit (Wave 1 + Wave 2):**
- **`ce-score`** — color-coded numeric pill. Auto-tier from `value/max`
  (high/med/low), with `--ce-score-breakpoints` CSS custom property for
  document-wide threshold override (CDR-003). Replaces 1 168 raw `score s1..s5`
  spans across 61 audit files.
- **`ce-quote`** — semantic `<blockquote>`+`<cite>` with `card | pull | inline`
  variants and dual attr/slot author/source API (CDR-002/CDR-007). Replaces
  433 raw `quote-card` blocks across 35 audit files.
- **`ce-step`** + **`ce-steps`** — numbered process step (brick) and
  vertical/horizontal step list (layout). Steps accept JSON or slot children
  (CDR-005), auto-number unnumbered slot children via MutationObserver.
  Replaces 203–394 raw `step-num/step-title/step-desc` blocks across 13–25
  audit files.
- **`ce-pricing-tier`** — tier card with name, price, features (JSON or slot),
  optional badge + CTA. Deliberately ships without a `ce-pricing` parent —
  the canonical container is `<ce-grid columns="3"><ce-pricing-tier .../>`
  (same pattern that earlier replaced `ce-stat-group` with
  `<ce-grid><ce-kpi/>`). Replaces 322 raw `tier-*` blocks across 17 audit
  files.
- **`ce-recommendation`** — priority + title + impact + body block with 4-value
  P-tier style enum (`p0` … `p3`). Replaces 113 raw `rec-item` blocks across
  14 audit files.

### Changed — CDR-aware extensions (additive per CDR-008)

- **`ce-verdict`** — new `inline` boolean attribute for compact pill layout.
  Default slot in inline mode becomes the label; empty slot falls back to the
  canonical type label ("Go" / "No-go" / "Mixed" / "Info"). The `type` enum
  is unchanged — unbounded vocabulary lives in the slot (CDR-001).
  Document-wide layout knob via `--ce-verdict-layout: auto | banner | inline`
  consumed through `@container style()` (CDR-003).
- **`ce-donut`** — auto-generated legend (visible when ≥ 2 segments, hidden
  for single-segment donuts) per CDR-007. New `--ce-donut-legend-display:
  auto | always | none` for document-wide control (CDR-003).
- **`ce-bar-chart`** — accepts `<ce-bar-row>` slot children when `rows` is
  empty; snapshot parity test confirms equivalent rendering (CDR-005).
- **`ce-key-value`** — accepts `<ce-kv>` slot children alongside the existing
  `<dt>`/`<dd>` path (CDR-005).
- **`ce-flow`** — accepts `<ce-flow-step>` slot children alongside `steps`
  prop (CDR-005).
- **`ce-heatmap`** — cell type widened from `number` to `number | CellInput`;
  accepts `<ce-heat-row>` / `<ce-heat-cell>` slot children (CDR-005).
- **`ce-checklist`** — accepts `<ce-check-item>` slot children when `items`
  is empty; new `group-by="category"` attribute renders `<h4>` headers;
  default rendering is now static (`readonly` / `persist-key` are opt-in
  per CDR-004).
- **`ce-persona`** — proposed `wtp` / `tam` attributes dropped in favour of
  meta-slot composition via `<ce-kv>` children (CDR-002).
- **`ce-rating`** — default rendering is now static / read-only; interactive
  form behaviour requires explicit `name` attribute (CDR-004).

### Fixed

- **`ce-qr`** — corrected format-info row/column placement; codes are now
  scannable.

### Stats

- 99 components (was 83 in v0.4.0) — 67 UI bricks/widgets/layouts +
  16 lesson components + 3 internal.
- 932 vitest cases passing (was 706 in v0.4.0).
- 8 CDRs added; 9 ADRs unchanged.
- `pnpm check` green: typecheck + validate-meta (99 files) + gen-skill drift
  check + tests + build.

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

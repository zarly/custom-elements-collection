---
name: custom-elements-collection
description: Reference for the custom-elements-collection library — 72 framework-agnostic Lit 3 web components (ce-* UI building blocks + lesson-* education + chat-surface + feedback-UI + form controls + dashboard primitives). USE WHENEVER the user is rendering an HTML dashboard, copilot/chat surface, lesson page, KPI report, release-readiness viz, or any LLM-generated HTML report; mentions "ce-card", "ce-kpi", "ce-chat-bubble", "ce-feedback-sink", "ce-button", "ce-input", "ce-gauge", "ce-counter", "lesson-quiz", `data-ce-theme`, `--ce-*` tokens, the `<ce-*>` prefix, or @mdflow/plugin-companion; or asks how to set up, theme, compose, pick, or troubleshoot any of these tags. SKIP for CSS-only UI questions, generic Lit/Vue/React component authoring, or shadow-DOM tutorials.
---

# custom-elements-collection

Framework-agnostic Web Components on Lit 3. 72 tags grouped into UI building blocks, chat surfaces, feedback controls, form controls, dashboard primitives, rich-content viewers, and education widgets. Drop into any HTML page, any framework, any static-site generator. No build step on the consumer side.

> Each component carries a validated `*.meta.json` describing every prop, event, slot, CSS variable, side effect, and dependency. **The meta files are the API surface** — this skill is the navigator. For exact prop/event signatures, open `src/<area>/<stem>/<stem>.meta.json` (also published to `dist/meta/<tag>.json`).

---

## Quick start

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

Three registration modes:

```ts
// A) Register every tag at once
import "custom-elements-collection/auto";

// B) Tree-shake to specific tags (smallest bundle)
import "custom-elements-collection/hero";
import "custom-elements-collection/feedback-sink";
import "custom-elements-collection/lesson-quiz";

// C) Register dynamically at runtime
import { loadOnDemand } from "custom-elements-collection";
await loadOnDemand(["ce-hero", "ce-kpi"]);
```

Lit is bundled — **no peer dependencies**.

For bundler config (Vue / React / Svelte), SSR caveats, optional meta-JSON imports, and bundle-size math, see [`references/setup.md`](references/setup.md).

---

## Themes

11 theme bundles ship: `dark` (default), `light`, `swiss`, `bauhaus`, `muji`, `neo-brutal`, `solarized`, `nordic`, `memphis`, `gruvbox`, plus `auto` (follows `prefers-color-scheme`).

```html
<link rel="stylesheet" href=".../tokens/tokens.css">
<link rel="stylesheet" href=".../tokens/solarized.css">
<html data-ce-theme="solarized">
```

Pick by use case:

| Need | Theme |
| --- | --- |
| Default chrome for any dashboard | `dark` |
| Print / photo-heavy / daytime | `light` |
| Editorial / minimalist | `swiss` or `muji` |
| Marketing / conference talks | `bauhaus`, `memphis`, `neo-brutal` |
| Code-heavy reading | `solarized`, `gruvbox` |
| Long analytics dashboards | `nordic` |

Full token catalog and per-theme overrides: [`references/tokens.md`](references/tokens.md).

To override a single token without a theme bundle: `:root { --ce-color-blue: oklch(60% 0.2 240); }`.

---

## Picking a component

Common decisions:

| If you need… | Use |
| --- | --- |
| Big number on a card | `ce-kpi` |
| Generic content surface | `ce-card` |
| Highlighted feature (icon + title + body) | `ce-feature-card` |
| Persona / profile card | `ce-persona` |
| Inline status pill / badge | `ce-chip` |
| Final verdict banner (icon + title + detail) | `ce-verdict` (4 canonical types) |
| Inline verdict pill (rich label in default slot) | `ce-verdict inline` (CDR-001) |
| Note / warn / error / success block | `ce-callout` (set `type`) |
| Collapsible disclosure | `ce-details` |
| Table of contents (scroll-spy) | `ce-toc` |
| Bar chart (single series, JSON data) | `ce-bar-chart data='[…]'` |
| Bar chart (handwritten rows, rich labels) | `ce-bar-chart` with `<ce-bar-row>` children (CDR-005) |
| Multi-series chart (line/bar/pie/radar) | `ce-chart` (Chart.js) |
| 2-D heatmap (JSON cells) | `ce-heatmap data='[[…]]'` |
| 2-D heatmap (handwritten rows + per-cell rich text) | `ce-heatmap` with `<ce-heat-row>` + `<ce-heat-cell>` children (CDR-002/005) |
| Side-by-side comparison | `ce-compare` |
| Step flow diagram (JSON steps) | `ce-flow steps='[…]'` |
| Step flow diagram (handwritten steps with rich body) | `ce-flow` with `<ce-flow-step>` children (CDR-002/005) |
| Branching decision tree | `ce-decision-tree` (single level only) |
| Vertical timeline | `ce-timeline` |
| Code block with copy + lang | `ce-code` |
| Filter / chip multi-select (interactive) | `ce-filter-bar` |
| Decorative chip row (static, no events) | `<div>` of `<ce-chip>` |
| Chat message bubble | `ce-chat-bubble` |
| Streaming caret | `ce-cursor` |
| "Assistant is thinking" indicator | `ce-thinking` |
| LLM tool-call panel | `ce-tool-call` |
| Inline citation footnote | `ce-citation` |
| Thumbs up/down or star rating (static display) | `ce-rating mode="stars" value="N" readonly` (CDR-004) |
| Thumbs up/down or star rating (interactive) | `ce-rating name="x"` (opt-in via name; CDR-004) |
| Copy-to-clipboard button | `ce-copy-button` |
| "Try again" / regenerate | `ce-retry-button` |
| Per-item feedback row container | `ce-feedback-bar` |
| Subject + transport scope for feedback | `ce-feedback-sink` |
| Save / shortlist toggle | `ce-bookmark` |
| Hide / drop toggle | `ce-dismiss` |
| Inline comment textarea | `ce-comment` |
| Aggregated feedback stats | `ce-feedback-summary` |
| Page-level export buttons | `ce-feedback-export` |
| Verdict distribution sparkbar | `ce-feedback-heatmap` |
| Themable action button | `ce-button` (4 variants + loading) |
| On/off switch | `ce-toggle` (role=switch) |
| Checkbox with mixed state | `ce-checkbox` (aria-checked=mixed) |
| Labelled text input + help/error | `ce-input` |
| Multi-line input that auto-grows | `ce-textarea` |
| Inline yes/no confirmation | `ce-confirm` (role=alertdialog) |
| Big animated number | `ce-counter` |
| Live clock / "5 min ago" | `ce-clock` |
| Inline trend chart | `ce-sparkline` |
| Semicircle dial / meter | `ce-gauge` (role=meter) |
| Donut / pie chart (legend auto-shows when ≥2 segments) | `ce-donut` |
| Pulsing status dot (live dashboards) | `ce-status-light` |
| Static dot + label (documents) | `<ce-chip dot>` |
| Notification count badge | `ce-badge` |
| Loading shimmer placeholder | `ce-skeleton` |
| KPI grid wrapper | `ce-grid` + `ce-kpi` (~~`ce-stat-group` deprecated, ADR-010~~) |
| Progress rows aligned in a column | `ce-progress-list` (CDR-006) |
| Static checklist | `ce-checklist items='[…]'` (no persist-key, no allow-edit; CDR-004) |
| Handwritten checklist with rich items | `ce-checklist` with `<ce-check-item>` children (CDR-002/005) |
| Interactive task list (with persist) | `ce-checklist persist-key="…" allow-edit` |
| Lazy image with caption + fallback | `ce-image` |
| Downloadable attachment card | `ce-file-card` |
| Definition-list grid (raw `<dt>`/`<dd>` pairs) | `ce-key-value` with `<dt>/<dd>` children |
| Definition-list grid (rich values: links, dates, chips) | `ce-key-value` with `<ce-kv key="…">…</ce-kv>` children (CDR-002) |
| Pretty-printed JSON | `ce-json` |
| Line-level diff (unified/split) | `ce-diff` |
| Inline abbreviation with tooltip | `ce-abbr` |
| Lesson wrapper with progress | `lesson-frame` |
| Rule with examples | `lesson-rule` |
| Fill-in-the-blank | `lesson-gap` |
| Multiple choice | `lesson-quiz` |
| Timed rapid-fire | `lesson-quickfire` |
| Audio + transcript | `lesson-audio` |

When two candidates seem equally fit: read both meta files. Goal + description + scale resolve almost every ambiguity.

---

## Component catalog

<!-- BEGIN AUTO-GENERATED CATALOG -->

_Auto-generated by `pnpm gen-skill` from `src/**/*.meta.json`. Do not hand-edit this block._

**Total components: 99**

### UI (80)

**Chat surfaces**

| Tag | Tier | Goal |
| --- | --- | --- |
| `ce-chat-bubble` | brick | Render one chat message with role-driven coloring, avatar placement, header metadata (author/model/timestamp), and a tokens-aware footer. |
| `ce-citation` | brick | Render an inline footnote-style source reference with an optional hover/focus popover preview. |
| `ce-copy-button` | widget | Provide a one-click copy-to-clipboard trigger that targets any element by id or CSS selector and reports success via a CustomEvent. |
| `ce-cursor` | brick | Render a blinking caret indicator beside streaming LLM-generated text. |
| `ce-rating` | widget | Capture human feedback on chat responses or content via thumbs up/down or 1..N stars, in one form-associated control. |
| `ce-retry-button` | brick | Provide a small "regenerate" affordance for chat surfaces that emits a single ce-retry intent on click. |
| `ce-thinking` | brick | Show that an LLM is reasoning before the first token arrives, with an animated indicator and a screen-reader-friendly label. |
| `ce-tool-call` | widget | Render an LLM/agent tool invocation as a collapsible row with a status indicator, name, duration, and slotted args/result/error panels. |

**Comparison & narrative**

| Tag | Tier | Goal |
| --- | --- | --- |
| `ce-code` | brick | Render a code block with optional language label, filename, and copy-to-clipboard button. |
| `ce-compare` | widget | Display two slotted columns side by side as a Before/After (or A/B) panel separated by a configurable arrow. |
| `ce-decision-tree` | widget | Render a one-level decision diagram: a question followed by yes / no / neutral branches each labelled with a result. |
| `ce-example` | brick | Mark a snippet as a Good / Wrong / neutral example with a colored left-border accent and label. |
| `ce-feature-card` | brick | Present a feature with an icon, title, body, and optional CTA button or link. |
| `ce-filter-bar` | widget | Render a chip-toggle filter row with single- or multi-select semantics and a comma-joined value. |
| `ce-flow` | widget | Render a horizontal or vertical step flow diagram from either a JSON array of steps (steps prop) or from <ce-flow-step> slot children (CDR-005 dual mode). |
| `ce-flow-step` | widget | Single step for use inside <ce-flow> slot mode (CDR-005), or as a standalone step card with number, icon, title, and rich body content. |
| `ce-persona` | brick | Display a user-research persona card with avatar, name, role, identity pills, detail paragraph, and metadata rows. |
| `ce-pricing-tier` | widget | Display a single pricing tier card with name, price, feature list, and optional CTA; composes into a grid via ce-grid. |
| `ce-quote` | brick | Render a semantic blockquote with optional author and source attribution in three visual treatments: card, pull, and inline. |
| `ce-recommendation` | brick | Display a prioritised recommendation or advice block with a colored left-border accent, title, impact line, and optional actions footer. |
| `ce-step` | brick | Render a single numbered process step with a state-coded disk, title, optional meta line, and rich description slot. |
| `ce-steps` | layout | Container for ce-step items that accepts JSON data or slot children and auto-numbers unnumbered steps. |
| `ce-timeline` | widget | Render a vertical or horizontal timeline of titled events from a JSON items array. |
| `ce-verdict` | brick | Show a final-decision banner — go / no-go / mixed / info — with an icon, title, and detail line. |

**Content**

| Tag | Tier | Goal |
| --- | --- | --- |
| `ce-diff` | brick | Render a line-level diff between two text blobs in unified or split layout. |
| `ce-file-card` | brick | Render a downloadable attachment card with name, size, type icon, and optional thumbnail. |
| `ce-image` | brick | Render a lazily-loaded image with optional caption and graceful fallback when the source fails. |
| `ce-json` | brick | Render a JSON value pretty-printed with collapse, error reporting, and optional truncation. |
| `ce-key-value` | layout | Render a definition list or ce-kv rows as an aligned grid with optional multi-column packing and tight typography. |
| `ce-kv` | brick | Render a single key-value row with a short label and composable slotted value content. |
| `ce-qr` | brick | Render a scannable QR code as a single SVG path with no runtime dependencies and a hand-rolled encoder. |

**Dashboard**

| Tag | Tier | Goal |
| --- | --- | --- |
| `ce-clock` | brick | Show a live time-of-day clock or relative-time display, optionally for a specific IANA time zone. |
| `ce-counter` | brick | Animate a numeric value from a start to a target with optional prefix, suffix, decimals, and trend indicator. |
| `ce-gauge` | brick | Render a semicircle dial showing a single value within min..max with optional target tick. |
| `ce-sparkline` | brick | Render a small inline trend chart (line, area, or bar) for a numeric series. |
| `ce-stat-group` | layout | Lay out clustered KPI cells in a uniform responsive grid. |
| `ce-status-light` | brick | Display a small traffic-light style dot with state color, optional pulse, and inline label. |

**Feedback**

| Tag | Tier | Goal |
| --- | --- | --- |
| `ce-bookmark` | brick | Capture intent-to-revisit on a per-item basis with a switch-semantic toggle distinct from rating-based quality judgment. |
| `ce-comment` | brick | Surface a compact comment trigger that expands to an auto-growing textarea with debounced change events and configurable submit semantics. |
| `ce-dismiss` | brick | Mark an item as not-interested / hide-from-view, with reduced-opacity styling propagated to the surrounding feedback-bar via a data attribute. |
| `ce-feedback-bar` | widget | Bind a row of feedback controls to a single item id within a subject and emit one aggregated state event per change. |
| `ce-feedback-export` | widget | Surface page-level action buttons (copy markdown, download json, submit, clear) that delegate work to the ancestor sink via bubbling export-request events. |
| `ce-feedback-heatmap` | widget | Visualise the distribution of verdicts across an aggregated feedback subject as a small color-coded bar. |
| `ce-feedback-sink` | widget | Own the feedback subject + transport scope, normalize bubbling descendant events into FeedbackEvent records, and persist them via the configured transport. |
| `ce-feedback-summary` | widget | Render aggregated feedback statistics from an ancestor ce-feedback-sink as plain HTML stat cells with no internal-component dependency. |

**Forms**

| Tag | Tier | Goal |
| --- | --- | --- |
| `ce-button` | brick | Provide a token-driven button with primary/secondary/ghost/destructive variants and a loading state. |
| `ce-check-item` | brick | Single checklist row carrying a checkbox and rich-content default slot; used as a slot child inside ce-checklist or standalone. |
| `ce-checkbox` | brick | Provide a themable checkbox control with checked/indeterminate states and full keyboard support. |
| `ce-checklist` | widget | Render a task list — static read-only by default, interactive with persist-key / allow-edit opt-in. |
| `ce-confirm` | widget | Render an inline yes/no confirmation prompt with explicit confirm and cancel buttons. |
| `ce-input` | widget | Provide a labelled text input with help, error, prefix, and suffix slots and consistent themed styling. |
| `ce-radio-group` | widget | Provide a single-select group control with classic, segmented, or card visual variants and full keyboard support. |
| `ce-textarea` | widget | Provide a labelled multi-line text input with auto-grow, help, and error regions. |
| `ce-toggle` | brick | Provide an on/off switch with role=switch, keyboard support, and emitted ce-change events. |

**Layout & primitives**

| Tag | Tier | Goal |
| --- | --- | --- |
| `ce-abbr` | brick | Render an inline abbreviation with a focusable, accessible tooltip-style expansion. |
| `ce-badge` | brick | Decorate an icon or label with a small count or status pip. |
| `ce-callout` | brick | Highlight short admonition text (info / success / warn / danger / neutral) with a left-border accent and tinted background. |
| `ce-card` | brick | Present arbitrary content on a surface with optional left-border accent, hover lift, and clickable activation. |
| `ce-chip` | brick | Display a compact inline status pill with semantic color variants and optional dot or outlined treatment. |
| `ce-details` | widget | Provide a styled, animated collapsible disclosure with a summary row and optional count chip. |
| `ce-grid` | layout | Lay out child elements in a responsive grid with either a fixed column count or auto-fit minmax sizing. |
| `ce-hero` | layout | Render a page-opening header block with a kicker, title, lede, and an optional inline stats row. |
| `ce-progress-list` | layout | Stack multiple progress bars and arbitrary inline content into a vertically-gapped list with consistent spacing. |
| `ce-section` | layout | Group page content under a titled header with optional number badge, lede, and right-aligned count chip. |
| `ce-shell` | layout | Wrap a documentation or app page so it has consistent max-width, padding, and a single theme-root attribute on <html>. |
| `ce-skeleton` | brick | Reserve layout with an animated shimmer placeholder while content loads. |
| `ce-table` | layout | Wrap a native <table> in a styled scroll container with consistent header, row, and hover treatments. |
| `ce-tabs` | widget | Render a tab strip + paired panels with shared chip-pill head treatment, full keyboard support, and two ergonomic input shapes. |
| `ce-toc` | widget | Render a flat or numbered table of contents from a JSON entries array (or slotted anchors) with optional sticky positioning. |

**Metrics & charts**

| Tag | Tier | Goal |
| --- | --- | --- |
| `ce-bar-chart` | widget | Animated horizontal bar chart with hover affordance + tooltip, optional gridlines, and an opt-in inline sparkline mode — sub-4KB, no JS deps. |
| `ce-bar-row` | brick | Single horizontal progress-bar row usable standalone or as a slot child inside <ce-bar-chart> (CDR-005 slot mode). |
| `ce-chart` | widget | Render a Chart.js-backed line / bar / radar / pie / doughnut chart from JSON data + options attributes. |
| `ce-donut` | brick | Render a donut or pie chart for a small set of categorical segments with an optional center label. |
| `ce-heat-cell` | brick | Single colored heatmap cell for use inside <ce-heat-row> (slot mode per CDR-005), or as a standalone colored cell when used outside. |
| `ce-heat-row` | widget | Single row of heatmap cells for use inside <ce-heatmap> slot mode (CDR-005), or as a standalone minimal row when used outside. |
| `ce-heatmap` | widget | Render a 2D value grid with row + column labels and per-cell color intensity drawn from a 5-color palette. |
| `ce-kpi` | brick | Display a single big-number stat with label, optional trend indicator, and semantic color tint. |
| `ce-plot` | widget | Standard-tier multi-series chart covering line, area, and bar geometries in a single component — pure SVG, no external dependencies, sub-8KB target. Hover crosshair + tooltip + legend click-to-toggle + data-layer fade animation. |
| `ce-progress` | brick | Render a horizontal progress bar with optional inline label, percent overlay, indeterminate shimmer, and semantic color. |
| `ce-score` | brick | Display a color-coded numeric score pill that auto-tiers itself into high, med, or low based on the value-to-max ratio. |

### Lesson (16)

| Tag | Tier | Goal |
| --- | --- | --- |
| `lesson-audio` | widget | Play a short audio clip via a button with optional phonetic transcription and an inline error state. |
| `lesson-compare` | brick | Two-column side-by-side comparison for before/after, correct/wrong, or neutral approach A vs B. |
| `lesson-confidence` | widget | Ask the learner to rate their confidence on a topic before or after an exercise (1=not confident, 5=very confident). |
| `lesson-frame` | layout | Wrap a lesson page with a fixed top progress bar and a centered, padded content column. |
| `lesson-gap` | widget | Run a fill-in-the-blank exercise with multiple-choice options, instant feedback, and a public reset() method. |
| `lesson-hint` | widget | Progressive hint disclosure — reveal hints one at a time to give learners scaffolded support before giving up. |
| `lesson-match` | widget | Drill term-definition or any-to-any pairing through clickable two-column matching — a strong recall-reinforcement primitive. |
| `lesson-myth` | widget | Present a common misconception, then reveal its correction on click — the myth-busting pattern. |
| `lesson-note` | brick | Callout aside for lesson content — tip, info, key point, warning, or danger. |
| `lesson-quickfire` | widget | Run a timed sequence of short multiple-choice rounds with optional score tracking, per-round timer, and a final summary. Mixes scored quiz rounds and unscored poll/opinion rounds in any combination. |
| `lesson-quiz` | widget | Run a single-question multiple-choice quiz with instant feedback, an explanation reveal, and a reset() method. |
| `lesson-reveal` | widget | Flashcard that displays a front (question/term) and reveals the back (answer) on click. |
| `lesson-rule` | brick | Display a numbered or 'golden' rule card with a circular badge, title, and explanatory body. |
| `lesson-step` | brick | One numbered step in a procedural sequence, with optional completion status. |
| `lesson-summary` | brick | End-of-section key-points card that closes a lesson section with the main takeaways. |
| `lesson-vocab` | brick | Vocabulary term card with all metadata a learner needs: term, phonetic, part of speech, definition, example usage. |

### Internal (3)

| Tag | Tier | Goal |
| --- | --- | --- |
| `ce-docs-layout` | layout | Provide a two-pane documentation page layout with sticky header, sticky sidebar, and scrollable main column. |
| `ce-nav-list` | layout | Render a grouped anchor list for documentation sidebars with active-item highlighting and a select event. |
| `ce-theme-switcher` | widget | Cycle / select from a named list of values via an arrow-button + dropdown control, emitting ce-change on selection. |

Full per-component descriptors live in `src/**/*.meta.json` (also published to `dist/meta/<tag>.json` and `dist/meta/index.json`). Filter via `node skill/scripts/components.mjs --help`.

<!-- END AUTO-GENERATED CATALOG -->

> Don't see what you need? The catalog above is auto-regenerated from `src/**/*.meta.json` whenever `pnpm gen-skill` runs. If a tag isn't listed, it isn't shipped.

---

## How to read more

The catalog is intentionally minimal — tag, scale, and the single-sentence goal. For everything else, **the meta JSON is canonical**.

### Direct read

```bash
# Repo-local
cat src/components/card/card.meta.json | jq

# From an installed package
cat node_modules/custom-elements-collection/dist/meta/ce-card.json | jq
```

The meta file holds: identity (tag/name/className), `goal`, full `description`, `limitations`, `stability`, `props[]` (name/type/required/default/attribute/reflect/description), `events[]` (name/detail/bubbles/composed/description), `slots[]`, `cssVariables[]`, `globalDependencies[]`, `sideEffects[]`, dependency graph (`dependents`/`dependencies`/`related`), `category`, `scale`, `tags[]`, optional `a11y`, optional `methods[]`, optional `additional`.

### Filtered programmatic read

A zero-deps CLI ships with the repo at `skill/scripts/components.mjs`:

```bash
# All tags, full meta, markdown
node skill/scripts/components.mjs

# One tag, full meta
node skill/scripts/components.mjs --tag ce-rating

# All chat-surface tags, just goal + event names
node skill/scripts/components.mjs --group "Chat surfaces" --fields tag,goal,events.name

# All bricks that don't bubble events
node skill/scripts/components.mjs --scale brick --fields tag,events.name --format json

# Help
node skill/scripts/components.mjs --help
```

Filters: `--tag` (repeatable), `--group` (repeatable, matches `meta.tags[0]`), `--category` (`ui|lesson|internal`), `--scale` (`brick|component|widget|layout`). Projection: `--fields a,b,c.sub` (a single dot pulls a sub-field from each row inside an array, e.g. `props.name`). Output: `--format markdown|json` (markdown default).

For deeper queries (joins, multi-level filters), pipe `dist/meta/index.json` through `jq` — the meta files are plain JSON.

---

## Importing meta in production

The runtime bundle is unaffected by ADR-005. Components import from `custom-elements-collection/<tag>` exactly as before; meta JSON ships in a separate `dist/meta/` folder behind opt-in subpaths:

```ts
// Just the component (no meta)
import "custom-elements-collection/card";

// Component + its meta (separate import)
import "custom-elements-collection/card";
import meta from "custom-elements-collection/meta/ce-card.json"
  with { type: "json" };

// All meta in one fetch
import bundle from "custom-elements-collection/meta"
  with { type: "json" };
```

If you don't import meta, you don't pay for it. Keep production bundles minimal by only importing the tags you actually render.

---

## Composition recipes

Three short examples below; full versions plus a chat-surface and feedback-UI recipe live in [`references/recipes.md`](references/recipes.md).

### Release dashboard

```html
<ce-shell>
  <ce-hero kicker="Q4" title="Release readiness">
    <ce-kpi slot="stats" value="96%" label="Pass" color="green"></ce-kpi>
  </ce-hero>
  <ce-section title="Coverage" number="1">
    <ce-bar-chart data='[{"label":"auth","value":96,"color":"green"}]'></ce-bar-chart>
  </ce-section>
  <ce-callout type="success" title="Ready to ship">All gates green.</ce-callout>
</ce-shell>
```

### Chat surface

```html
<ce-chat-bubble role="assistant" author="Claude">
  Here is a draft.
  <ce-tool-call slot="footer" name="search" status="ok"></ce-tool-call>
  <ce-rating slot="footer" mode="thumbs"></ce-rating>
</ce-chat-bubble>
```

### Feedback dashboard

```html
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

---

## Library principles

- **Light DOM by default** (ADR-002) — slots project light children, so streamed markdown / Mermaid / Chart.js content keeps working. Components opt into Shadow DOM (`createShadowRootWithStyles()`) only for style isolation.
- **`--ce-*` tokens** (ADR-003) — never hardcode a color or radius; consumers retheme by overriding tokens.
- **Three distribution modes** (ADR-004) — inline / linked-local / linked-CDN. The build helper picks per-output.
- **Self-describing via meta JSON** (ADR-005) — every component ships with a validated `*.meta.json`. The schema is enforced as part of `pnpm check`.

To add or modify a component, see `CONTRIBUTING.md` §4 (the ADR-005 authoring flow). The full ADRs are in `docs/adr/`.

---

## Where to look next

- [`references/setup.md`](references/setup.md) — bundlers, SSR, framework integrations, bundle math.
- [`references/tokens.md`](references/tokens.md) — full token catalog and the 11 themes with picking guidance.
- [`references/recipes.md`](references/recipes.md) — extended composition examples (lesson page, chat surface, feedback dashboard, docs site).
- [`references/index.md`](references/index.md) — auto-generated index of every component with a link to its meta JSON.
- `src/<area>/<stem>/<stem>.meta.json` — canonical per-component API.
- `node skill/scripts/components.mjs --help` — filtered queries over the meta corpus.

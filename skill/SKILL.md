---
name: custom-elements-collection
description: Complete reference for the custom-elements-collection library — 31 framework-agnostic Lit 3 web components (ce-* UI building blocks + lesson-* educational widgets). Load when building pages or documents that use these components, or when the user asks how to set up, use, or compose them.
---

# custom-elements-collection

Framework-agnostic Web Components built on Lit 3. Drop into any HTML page, any framework, or any static-site generator. No build step needed on the consumer side.

---

## Setup

### CDN (zero install)

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
  <!-- all 31 tags are now available -->
</body>
</html>
```

### npm + bundler

```bash
pnpm add custom-elements-collection
```

Three registration modes:

```ts
// A) Register every tag at once (simplest)
import "custom-elements-collection/auto";

// B) Tree-shake — import only what you use
import "custom-elements-collection/hero";
import "custom-elements-collection/kpi";
import "custom-elements-collection/lesson-quiz";

// C) Dynamic / on-demand
import { loadOnDemand } from "custom-elements-collection";
await loadOnDemand(["ce-hero", "ce-kpi", "lesson-rule"]);
```

Lit is bundled — **no peer dependencies**.

---

## Theming

All colors, spacing, radius, and typography come from `--ce-*` CSS custom properties defined in `tokens.css`. Dark theme is the default.

```html
<!-- default dark theme -->
<link rel="stylesheet" href=".../tokens.css">

<!-- force dark -->
<link rel="stylesheet" href=".../dark.css">

<!-- force light -->
<link rel="stylesheet" href=".../light.css">
```

Toggle theme on the root element:

```html
<html data-ce-theme="dark">   <!-- dark (default) -->
<html data-ce-theme="light">  <!-- light -->
```

Add `data-ce-scaffold` to `<html>` to apply body reset (background, font, box-sizing). `<ce-shell>` sets this automatically.

Override any token on `:root` or a parent element:

```css
:root {
  --ce-font-sans: "Inter", system-ui, sans-serif;
  --ce-radius: 12px;
  --ce-color-blue: oklch(60% 0.2 240);
}
```

### Color palette values

**Semantic colors (solid)**

| Token | Dark | Light |
|---|---|---|
| `--ce-color-green` | `#3fb950` | `#1f883d` |
| `--ce-color-red` | `#f85149` | `#cf222e` |
| `--ce-color-amber` | `#d29922` | `#9a6700` |
| `--ce-color-blue` | `#58a6ff` | `#0969da` |
| `--ce-color-purple` | `#bc8cff` | `#8250df` |
| `--ce-color-cyan` | `#39d2c0` | `#1b7c83` |

Each color also has `-bg` (tinted background) and `-border` (tinted border) variants, e.g. `--ce-color-green-bg`, `--ce-color-green-border`.

### Surface & text tokens

```
--ce-bg            page background
--ce-surface       card/panel surface
--ce-surface-2     nested surface
--ce-surface-3     deep-nested surface
--ce-border        default border
--ce-border-soft   subtle border
--ce-border-strong prominent border

--ce-text          primary text
--ce-muted         secondary / label text
--ce-dim           very muted (nav tags, counts)
--ce-text-inverse  text on solid color fills
```

### Spacing (4 px grid)

`--ce-space-1` (4px) → `--ce-space-2` (8px) → `--ce-space-3` (12px) → `--ce-space-4` (16px) → `--ce-space-5` (24px) → `--ce-space-6` (32px) → `--ce-space-7` (40px) → `--ce-space-8` (56px)

### Radius

`--ce-radius-sm` (6px) · `--ce-radius` (10px) · `--ce-radius-lg` (14px) · `--ce-radius-pill` (999px)

### Typography

Font stacks: `--ce-font-sans` · `--ce-font-mono`

Size scale: `--ce-text-xs` (11px) · `--ce-text-sm` (12.5px) · `--ce-text-base` (14px) · `--ce-text-md` (15px) · `--ce-text-lg` (17px) · `--ce-text-xl` (22px) · `--ce-text-2xl` (28px) · `--ce-text-3xl` (40px)

Line heights: `--ce-line-tight` (1.15) · `--ce-line-snug` (1.35) · `--ce-line-normal` (1.55) · `--ce-line-relaxed` (1.7)

### Motion & elevation

Transitions: `--ce-transition-fast` (0.12s) · `--ce-transition` (0.2s) · `--ce-transition-slow` (0.35s)

Shadows: `--ce-shadow-sm` · `--ce-shadow` · `--ce-shadow-lg`

Focus ring: `--ce-focus-ring` (2px blue ring)

### Color type

Throughout the component API, `color` props accept: `"neutral" | "green" | "red" | "amber" | "blue" | "purple" | "cyan"`.

---

## Component reference

### Layout & primitives

---

#### `<ce-shell>`

Page wrapper. Sets max-width layout, injects `data-ce-scaffold` + `data-ce-theme` on `<html>`, propagates theme changes.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `theme` | `"dark" \| "light"` | `"dark"` | Propagated to `<html data-ce-theme>` |
| `width` | `"narrow" \| "default" \| "wide" \| "full"` | `"default"` | `narrow`=720px, `default`=1200px, `wide`=1440px, `full`=100% |

**Slot:** default

```html
<ce-shell theme="dark" width="default">
  <!-- page content -->
</ce-shell>
```

---

#### `<ce-hero>`

Page header with kicker badge, gradient title, lede paragraph, and a stats row slot.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `kicker` | `string` | `""` | Small eyebrow text in a pill above the title |
| `title` | `string` | `""` | Main heading (gradient text) |
| `lede` | `string` | `""` | Supporting paragraph |
| `flat` | `boolean` | `false` | Suppresses the radial gradient background |

**Slots:**

| Slot | Purpose |
|---|---|
| `title` | Custom heading markup (overrides `title` attr) |
| `stats` | Inline stat row — typically `<ce-kpi>` elements |
| (default) | Additional body content below lede |

```html
<ce-hero kicker="Q4 2025" title="Release readiness" lede="All signals green.">
  <ce-kpi slot="stats" value="96%" label="Pass rate" color="green"></ce-kpi>
  <ce-kpi slot="stats" value="0"   label="Open bugs" color="red"></ce-kpi>
</ce-hero>
```

---

#### `<ce-section>`

Section block with optional number badge, heading, count chip, lede, and body slot.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | `""` | Section heading |
| `lede` | `string` | `""` | Subtitle / description |
| `number` | `string` | `""` | Leading number badge (e.g. `"1"`) |
| `count-label` | `string` | `""` | Right-aligned count chip (e.g. `"28 files · 7 locations"`) |

**Slots:**

| Slot | Purpose |
|---|---|
| `title` | Custom heading markup |
| (default) | Section body |

```html
<ce-section title="Coverage" number="1" count-label="12 modules" lede="Branch coverage by area.">
  <!-- cards, tables, etc. -->
</ce-section>
```

---

#### `<ce-grid>`

Responsive CSS Grid layout. Collapses to single column at ≤ 640 px.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `cols` | `"2" \| "3" \| "4"` | `"3"` | Fixed column count |
| `min` | `number` | `240` | Minimum column width in px (used when `auto` is set) |
| `auto` | `boolean` | `false` | Use `repeat(auto-fit, minmax(min, 1fr))` |
| `gap` | `"sm" \| "md" \| "lg"` | `"md"` | `sm`=8px, `md`=16px, `lg`=24px |

**Slot:** default

```html
<ce-grid cols="3" gap="md">
  <ce-card>…</ce-card>
  <ce-card>…</ce-card>
  <ce-card>…</ce-card>
</ce-grid>
```

---

#### `<ce-card>`

Surface card with optional left-border accent, hover effects, and click activation.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `accent` | `CecColor \| null` | `null` | Left-border accent color |
| `hoverable` | `boolean` | `false` | Hover border + shadow lift |
| `compact` | `boolean` | `false` | Tighter padding |
| `clickable` | `boolean` | `false` | Adds `role=button`, `tabindex=0`, keyboard activation |

**Slots:**

| Slot | Purpose |
|---|---|
| `title` | Optional title region (above default slot) |
| (default) | Body content |
| `footer` | Optional footer (dimmed, border-top) |

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `ce-card-activate` | — | Clicked or Enter/Space when `clickable` |

```html
<ce-card accent="green" hoverable>
  <h3 slot="title">Passed</h3>
  <p>All 148 tests green.</p>
  <span slot="footer">2 min ago</span>
</ce-card>
```

---

#### `<ce-chip>`

Compact status indicator / badge / label.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `type` | `"neutral" \| CecColor` | `"neutral"` | Color variant |
| `dot` | `boolean` | `false` | Prepend a colored dot |
| `outlined` | `boolean` | `false` | No fill, border + colored text only |

**Slot:** default (label text)

```html
<ce-chip type="green" dot>Passing</ce-chip>
<ce-chip type="red" outlined>Failed</ce-chip>
```

---

#### `<ce-table>`

Styled wrapper around a native `<table>`. Provides consistent header / row / hover styles and an optional sticky header.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `sticky` | `boolean` | `false` | Header row sticks to top of scroll container |
| `compact` | `boolean` | `false` | Reduced padding |

**Slot:** default — pass a raw `<table>` element

Cell alignment helpers (apply to `<td>`):
- `.num` or `data-align="num"` → right-aligned tabular numbers
- `.center` or `data-align="center"` → centered
- `.mono` → monospace font

```html
<ce-table sticky>
  <table>
    <thead><tr><th>File</th><th>Coverage</th></tr></thead>
    <tbody>
      <tr><td>auth.ts</td><td class="num">94%</td></tr>
    </tbody>
  </table>
</ce-table>
```

---

#### `<ce-callout>`

Left-border-accented tinted box for notes, warnings, success messages, and errors.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `type` | `"info" \| "success" \| "warn" \| "danger" \| "neutral"` | `"info"` | Semantic color variant |
| `title` | `string` | `""` | Optional bold header line |

**Slots:**

| Slot | Purpose |
|---|---|
| `title` | Custom title markup |
| (default) | Body content |

```html
<ce-callout type="success" title="Ready to ship">All quality gates green.</ce-callout>
<ce-callout type="warn">One flaky test detected.</ce-callout>
<ce-callout type="danger" title="Build broken">CI failed on main.</ce-callout>
```

---

#### `<ce-details>`

Styled collapsible panel (wraps native `<details>`).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `summary` | `string` | `""` | Summary text |
| `open` | `boolean` | `false` | Expand state (reflected) |
| `count` | `string` | `""` | Right-aligned count chip on header |

**Slots:**

| Slot | Purpose |
|---|---|
| `summary` | Custom summary markup |
| (default) | Body content when open |

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `ce-details-toggle` | `{ open: boolean }` | Toggle state changes |

```html
<ce-details summary="Test failures" count="3">
  <p>Details about failures…</p>
</ce-details>
```

---

#### `<ce-toc>`

Table of contents, optionally sticky and numbered.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `entries` | `TocEntry[]` | `[]` | Array of `{ href: string, label: string }` |
| `sticky` | `boolean` | `false` | `position: sticky` at top |
| `numbered` | `boolean` | `false` | Auto-number entries |

`entries` accepts JSON attribute: `entries='[{"href":"intro","label":"Intro"}]'`

**Slot:** default — used as fallback when `entries` is empty

```html
<ce-toc sticky numbered
  entries='[{"href":"setup","label":"Setup"},{"href":"api","label":"API"}]'>
</ce-toc>
```

---

### Metrics & charts

---

#### `<ce-kpi>`

Big-number KPI card. Commonly placed in `<ce-hero slot="stats">` or `<ce-grid>`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` | `""` | Large display value (e.g. `"96%"`, `"1.2k"`) |
| `label` | `string` | `""` | Uppercase small label below value |
| `color` | `CecColor` | `"neutral"` | Value text color |
| `trend` | `string` | `""` | Trend indicator starting with `+` or `-` (e.g. `"+12%"`) |

```html
<ce-kpi value="96%" label="Pass rate" color="green" trend="+4%"></ce-kpi>
```

---

#### `<ce-progress>`

Linear progress bar with optional label and value display.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `number` | `0` | Current value |
| `max` | `number` | `100` | Maximum value |
| `color` | `CecColor` | `"blue"` | Fill color |
| `label` | `string` | `""` | Inline label on the left |
| `show-value` | `boolean` | `false` | Overlays percentage text |
| `indeterminate` | `boolean` | `false` | Animated shimmer (ignores `value`) |

```html
<ce-progress value="72" label="Coverage" show-value color="green"></ce-progress>
<ce-progress indeterminate label="Loading…"></ce-progress>
```

---

#### `<ce-bar-chart>`

Horizontal bar chart. Data-driven via the `data` property.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `data` | `BarRow[]` | `[]` | `{ label, value, meta?, color? }[]` |
| `max` | `number` | `0` | Forces chart max; auto-scales if `0` |
| `color` | `CecColor` | `"blue"` | Default bar color |
| `label-width` | `string` | `"180px"` | CSS width for the label column |
| `compact` | `boolean` | `false` | Tighter row height |

`data` accepts JSON attribute: `data='[{"label":"Auth","value":94,"meta":"94%"}]'`

```html
<ce-bar-chart
  data='[{"label":"auth.ts","value":94,"meta":"94%","color":"green"},
         {"label":"legacy.ts","value":41,"meta":"41%","color":"red"}]'>
</ce-bar-chart>
```

---

#### `<ce-chart>`

Thin wrapper around Chart.js for radar / line / donut / bar charts. Lazy-loads Chart.js from a CDN.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `type` | `"line" \| "bar" \| "radar" \| "doughnut" \| "pie"` | `"line"` | Chart.js chart type |
| `src` | `string` | unpkg Chart.js 4.4.0 | CDN URL for Chart.js |
| `data` | Chart.js Data object | `{ labels: [], datasets: [] }` | Chart data |
| `options` | Chart.js options object | `{}` | Chart options |

`data` and `options` accept JSON attributes.

```html
<ce-chart type="radar"
  data='{"labels":["Speed","Quality","Coverage"],"datasets":[{"label":"Score","data":[80,95,72]}]}'>
</ce-chart>
```

---

#### `<ce-heatmap>`

Colored grid of cells — value-to-alpha-scaled background.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `rows` | `string[]` | `[]` | Row labels |
| `cols` | `string[]` | `[]` | Column labels |
| `data` | `number[][]` | `[]` | 2-D array (rows × cols) of numbers |
| `min` | `number` | `0` | Value range minimum |
| `max` | `number` | `0` | Value range maximum; auto-detected if `0` |
| `palette` | `"blue" \| "green" \| "amber" \| "red" \| "purple"` | `"blue"` | Color for high values |

All array props accept JSON attributes.

```html
<ce-heatmap
  rows='["Mon","Tue","Wed"]'
  cols='["AM","PM"]'
  data='[[3,1],[5,4],[2,6]]'
  palette="green">
</ce-heatmap>
```

---

### Comparison & narrative

---

#### `<ce-verdict>`

Decision banner with icon, title, and detail text.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `type` | `"go" \| "no-go" \| "mixed" \| "info"` | `"info"` | Semantic color + default icon |
| `title` | `string` | `""` | Short verdict line |
| `detail` | `string` | `""` | Supporting text |
| `icon` | `string` | auto | Override icon char; defaults: go=✓, no-go=✗, mixed=⚠, info=ℹ |

**Slots:**

| Slot | Purpose |
|---|---|
| `title` | Custom title markup |
| (default) | Detail text (overrides `detail` attr) |

```html
<ce-verdict type="go" title="Ship it" detail="All quality gates passed."></ce-verdict>
<ce-verdict type="no-go" title="Hold">P0 bug in auth flow — see issue #42.</ce-verdict>
```

---

#### `<ce-timeline>`

Vertical (or horizontal) timeline of steps.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | `TimelineItem[]` | `[]` | `{ title, meta?, description?, color?, icon? }[]` |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Layout direction |

`items` accepts JSON attribute.

```html
<ce-timeline items='[
  {"title":"Discovery","meta":"Week 1","color":"blue","icon":"🔍"},
  {"title":"Build","meta":"Week 2-4","color":"purple"},
  {"title":"Ship","meta":"Week 5","color":"green","icon":"🚀"}
]'></ce-timeline>
```

---

#### `<ce-compare>`

Before/after (or A/B) side-by-side panel.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `before-label` | `string` | `"Before"` | Label above the left panel |
| `after-label` | `string` | `"After"` | Label above the right panel |
| `arrow` | `string` | `"→"` | Separator: `"→"`, `"vs"`, custom, or `""` to hide |

**Slots:**

| Slot | Purpose |
|---|---|
| `before` | Left panel body |
| `after` | Right panel body |

```html
<ce-compare before-label="v1" after-label="v2">
  <code slot="before">O(n²)</code>
  <code slot="after">O(n log n)</code>
</ce-compare>
```

---

#### `<ce-flow>`

Horizontal (or vertical) flow diagram: boxes separated by arrows.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `steps` | `FlowStep[]` | `[]` | `{ title, caption?, color? }[]` |
| `arrow` | `string` | `"→"` | Arrow character (auto-flipped to `↓` in vertical mode) |
| `vertical` | `boolean` | `false` | Stack boxes vertically |

`steps` accepts JSON attribute.

```html
<ce-flow steps='[
  {"title":"Input","color":"blue"},
  {"title":"Process","caption":"async","color":"purple"},
  {"title":"Output","color":"green"}
]'></ce-flow>
```

---

#### `<ce-decision-tree>`

Question + branches (yes/no/neutral) for if/then educational diagrams.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `question` | `string` | `""` | Top-level question text |
| `branches` | `DecisionBranch[]` | `[]` | `{ label, kind?: "yes"\|"no"\|"neutral", result }[]` |

`branches` accepts JSON attribute.

```html
<ce-decision-tree question="Is the data public?"
  branches='[
    {"label":"Yes","kind":"yes","result":"No auth needed"},
    {"label":"No","kind":"no","result":"Require OAuth 2.0"}
  ]'>
</ce-decision-tree>
```

---

#### `<ce-example>`

Good/bad/neutral example box with a colored left border.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `type` | `"good" \| "bad" \| "neutral"` | `"neutral"` | `good`=green, `bad`=red |
| `label` | `string` | `""` | Label override (defaults: "Good" / "Wrong" / "Example") |

**Slot:** default (example content)

```html
<ce-example type="good">Use const for immutable values.</ce-example>
<ce-example type="bad">var x = 1;</ce-example>
```

---

#### `<ce-feature-card>`

Icon + title + body + optional CTA card.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `icon` | `string` | `""` | Emoji/character icon |
| `title` | `string` | `""` | Card title |
| `color` | `CecColor` | `"neutral"` | Icon background accent |
| `cta` | `string` | `""` | CTA button label; renders as button (or link when `href` set) |
| `href` | `string` | `""` | When set with `cta`, renders CTA as `<a>` |

**Slot:** default (body content)

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `ce-feature-cta` | — | CTA button clicked (when `href` not set) |

```html
<ce-feature-card icon="🔒" title="Auth" color="blue" cta="Learn more">
  OAuth 2.0 + PKCE out of the box.
</ce-feature-card>
```

---

#### `<ce-persona>`

User-research persona / role card with avatar, role line, tags slot, and body.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | `string` | `""` | Person/role name |
| `role` | `string` | `""` | Short role subtitle |
| `avatar` | `string` | `""` | Emoji or character for the avatar circle |
| `color` | `CecColor` | `"neutral"` | Top-border accent color |

**Slots:**

| Slot | Purpose |
|---|---|
| `tags` | `<ce-chip>` elements below the role line |
| (default) | Body / details list |

```html
<ce-persona name="Dev Lead" role="Engineering" avatar="👩‍💻" color="purple">
  <ce-chip slot="tags" type="purple">Backend</ce-chip>
  <p>Owns platform reliability…</p>
</ce-persona>
```

---

#### `<ce-code>`

Code block with optional filename, language label, and copy button.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `lang` | `string` | `""` | Language label shown top-right (e.g. `"ts"`, `"bash"`) |
| `filename` | `string` | `""` | Filename shown top-left |
| `copy` | `boolean` | `true` | Show copy button |

**Slot:** default — code text (plain text or pre-highlighted spans)

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `ce-code-copy` | `{ text: string }` | Copy button clicked |

The header bar is hidden when `lang`, `filename`, and `copy` are all absent/false.

```html
<ce-code lang="ts" filename="auth.ts">
const token = await getToken();
</ce-code>
```

---

#### `<ce-filter-bar>`

Chip-toggle filter row. Single-select by default; multi-select with `multiple`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | `""` | Optional left-side label |
| `value` | `string` | `""` | Current selected value(s); comma-joined when `multiple` |
| `multiple` | `boolean` | `false` | Allow multiple selection |
| `options` | `FilterOption[]` | `[]` | `{ value, label, count? }[]` |

`options` accepts JSON attribute.

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `ce-filter-change` | `{ value: string, values: string[] }` | Selection changes |

```html
<ce-filter-bar label="Status"
  options='[
    {"value":"all","label":"All","count":148},
    {"value":"pass","label":"Pass","count":142},
    {"value":"fail","label":"Fail","count":6}
  ]'
  value="all">
</ce-filter-bar>
```

---

### Docs & navigation

---

#### `<ce-docs-layout>`

Two-pane documentation layout: sticky sidebar + scrollable main area, with an optional full-width header slot.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `sidebar-width` | `string` | `"260px"` | CSS length for the sidebar column |

**Slots:**

| Slot | Purpose |
|---|---|
| `header` | Optional top bar spanning both columns |
| `sidebar` | Left column (e.g. `<ce-nav-list>`) |
| (default) | Main content area |

```html
<ce-docs-layout sidebar-width="280px">
  <header slot="header">My Docs</header>
  <ce-nav-list slot="sidebar" title="Components" items='[…]'></ce-nav-list>
  <ce-section title="Overview">…</ce-section>
</ce-docs-layout>
```

---

#### `<ce-nav-list>`

Grouped anchor list for docs sidebars. Highlights the active item by `href`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | `NavItem[]` | `[]` | `{ label, href, group?, tag? }[]` |
| `value` | `string` | `""` | Currently active href (controlled) |
| `title` | `string` | `""` | Optional sidebar heading |

`items` accepts JSON attribute. `group` field groups consecutive items under a heading. `tag` shows a small monospace label after the link text.

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `ce-nav-select` | `{ href: string }` | Link clicked (before navigation) |

```html
<ce-nav-list title="UI Components" value="#ce-hero"
  items='[
    {"group":"Layout","label":"Shell","href":"#ce-shell","tag":"ce-shell"},
    {"group":"Layout","label":"Hero","href":"#ce-hero","tag":"ce-hero"},
    {"group":"Metrics","label":"KPI","href":"#ce-kpi","tag":"ce-kpi"}
  ]'>
</ce-nav-list>
```

---

### Lesson widgets

---

#### `<lesson-frame>`

Top-level shell for a lesson page. Fixed top progress bar + centered content column.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `progress` | `number` | `0` | Completion percentage `[0, 100]` |
| `title` | `string` | `""` | Lesson title |
| `meta` | `string` | `""` | Short meta line (difficulty · time · impact) |

**Slots:**

| Slot | Purpose |
|---|---|
| `header` | Extra chips/tags below the title |
| (default) | Lesson body |

```html
<lesson-frame title="Async Patterns" meta="Intermediate · 12 min" progress="35">
  <ce-chip slot="header" type="blue">JavaScript</ce-chip>
  <lesson-rule number="1" title="Always handle rejection">…</lesson-rule>
</lesson-frame>
```

---

#### `<lesson-rule>`

Numbered rule card. Use for "Rule 1", "Golden Rule", etc.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `number` | `string` | `""` | Rule number badge (any string; `"1"` or `"★"`) |
| `title` | `string` | `""` | Rule title |
| `golden` | `boolean` | `false` | Amber "golden rule" emphasis styling |

**Slot:** default (rule body)

```html
<lesson-rule number="1" title="Fail fast">
  Validate inputs at the boundary, not deep inside.
</lesson-rule>
<lesson-rule golden title="The Golden Rule">
  Treat others' code as you want yours treated.
</lesson-rule>
```

---

#### `<lesson-gap>`

Fill-in-the-blank interactive exercise.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `prompt` | `string` | `""` | Sentence with `___` as placeholder |
| `options` | `string[]` | `[]` | Choice list |
| `correct` | `string` | `""` | Correct answer (must be in `options`) |
| `explanation` | `string` | `""` | Shown after user answers |

`options` accepts JSON attribute.

**Methods:** `reset()` — clears the user's pick.

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `lesson-gap-answer` | `{ value: string, correct: boolean }` | User picks an option |

```html
<lesson-gap
  prompt="A Promise that never resolves or rejects is called ___."
  options='["settled","pending","fulfilled","rejected"]'
  correct="pending"
  explanation="Pending means the async work is still in progress.">
</lesson-gap>
```

---

#### `<lesson-quiz>`

Multiple-choice question with instant feedback and explanation.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `question` | `string` | `""` | Question text |
| `options` | `string[]` | `[]` | Answer choices |
| `correct` | `number` | `0` | Index of the correct option |
| `explanation` | `string` | `""` | Shown after user picks |

`options` accepts JSON attribute.

**Methods:** `reset()` — clears the user's selection.

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `lesson-quiz-answer` | `{ index: number, correct: boolean }` | User picks an option |

```html
<lesson-quiz
  question="Which operator checks both value and type?"
  options='["==","===","=","!="]'
  correct="1"
  explanation="Triple equals (===) is the strict equality operator.">
</lesson-quiz>
```

---

#### `<lesson-quickfire>`

Timed practice session — rounds in sequence, score tracked, per-round timer.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `rounds` | `QuickfireRound[]` | `[]` | `{ prompt, options: string[], correct: string }[]` |
| `timer` | `number` | `8` | Seconds per round |

`rounds` accepts JSON attribute. `prompt` may contain `___` for blank-style display.

**Methods:** `reset()` — restarts from round 1.

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `lesson-quickfire-done` | `{ score: number, total: number }` | All rounds complete |

```html
<lesson-quickfire timer="10" rounds='[
  {"prompt":"typeof null === ___","options":["object","null","undefined","string"],"correct":"object"},
  {"prompt":"[] + [] equals ___","options":["0","\"\"","[]","NaN"],"correct":"\"\""}
]'></lesson-quickfire>
```

---

#### `<lesson-audio>`

Pronunciation / audio clip with optional phonetic transcription.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `src` | `string` | `""` | Audio file URL |
| `phonetic` | `string` | `""` | IPA or pronunciation guide |
| `label` | `string` | `"🔊 Play"` | Play button label |

**Events:**

| Event | Detail | Fired when |
|---|---|---|
| `lesson-audio-play` | `{ src: string }` | Play button clicked |

```html
<lesson-audio src="/audio/async.mp3" phonetic="/əˈsɪŋk/"></lesson-audio>
```

---

## Common composition patterns

### Dashboard page

```html
<ce-shell theme="dark">
  <ce-hero kicker="Q4 2025" title="Release Dashboard">
    <ce-kpi slot="stats" value="148" label="Total tests" color="blue"></ce-kpi>
    <ce-kpi slot="stats" value="142" label="Passing" color="green" trend="+3"></ce-kpi>
    <ce-kpi slot="stats" value="6"   label="Failing"  color="red"></ce-kpi>
  </ce-hero>

  <ce-section title="Coverage by module" number="1">
    <ce-bar-chart data='[
      {"label":"auth","value":96,"meta":"96%","color":"green"},
      {"label":"api","value":78,"meta":"78%","color":"blue"},
      {"label":"legacy","value":41,"meta":"41%","color":"red"}
    ]'></ce-bar-chart>
  </ce-section>

  <ce-section title="Details" number="2">
    <ce-grid cols="2" gap="md">
      <ce-card accent="green">
        <h3 slot="title">Auth module</h3>
        <ce-progress value="96" show-value color="green"></ce-progress>
      </ce-card>
      <ce-card accent="red">
        <h3 slot="title">Legacy module</h3>
        <ce-progress value="41" show-value color="red"></ce-progress>
      </ce-card>
    </ce-grid>
  </ce-section>
</ce-shell>
```

### Lesson page

```html
<lesson-frame title="Promises in JavaScript" meta="Intermediate · 10 min" progress="0">
  <lesson-rule number="1" title="Always handle rejection">
    Every `.then()` chain needs a `.catch()`.
  </lesson-rule>
  <lesson-quiz
    question="What state is a Promise in before it resolves?"
    options='["fulfilled","rejected","pending","settled"]'
    correct="2">
  </lesson-quiz>
  <lesson-quickfire timer="8" rounds='[
    {"prompt":"Promise.all fails if ___ promise rejects","options":["any","all","no","the last"],"correct":"any"}
  ]'></lesson-quickfire>
</lesson-frame>
```

### Docs site

```html
<ce-docs-layout>
  <header slot="header" style="padding: 0 24px; line-height: 48px; font-weight: 700;">
    My Docs
  </header>
  <ce-nav-list slot="sidebar" title="Components"
    value="#ce-hero"
    items='[
      {"group":"Layout","label":"Shell","href":"#ce-shell","tag":"ce-shell"},
      {"group":"Layout","label":"Hero","href":"#ce-hero","tag":"ce-hero"}
    ]'>
  </ce-nav-list>
  <ce-section title="ce-hero">
    <ce-hero title="Page title" kicker="Section"></ce-hero>
  </ce-section>
</ce-docs-layout>
```

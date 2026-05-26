# Picking a component

Decision table for the common "which tag do I reach for?" question. For the full auto-generated catalog grouped by category + manifest group, see [`catalog.md`](catalog.md). For the per-tag class / tier / stability index with links to canonical meta JSON, see [`index.md`](index.md).

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

When two candidates seem equally fit: read both meta files. `goal` + `description` + `tier` (brick / widget / layout) resolve almost every ambiguity. Filter programmatically with `node scripts/components.mjs --help`.

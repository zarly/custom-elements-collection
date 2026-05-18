---
id: CDR-006
title: Components compose; no hard wrappers
status: accepted
date: 2026-05-18
compliance: SHOULD
tags: [api-design, composition]
relates_to: [ADR-002, ADR-009, CDR-002, CDR-005, src/components/stat-group, src/components/card, src/components/grid]
---

# CDR-006 — Components compose; no hard wrappers

## Context

CEC's strength is that components nest freely. Real corpus examples:

- `<ce-card>` contains `<ce-kpi>`, contains an inline `<ce-sparkline>`, contains a `<p>` with `<a>` links — all rendering correctly.
- `<ce-grid>` accepts any children (28 corpus files use it with `<ce-kpi>`, others use it with `<ce-feature-card>`, mixed `<ce-callout>` + `<ce-card>`, etc.).
- `<ce-section>` wraps narrative HTML and component-rich blocks side by side.

The anti-pattern: a "wrapper" component that intentionally limits what its children can be. Two examples surfaced in audit:

- `ce-stat-group` was conceptually "a grid of KPIs". In practice it would silently drop non-KPI children (a narrative `<p>`, a `<ce-callout>` annotation, an explanatory `<a>` link). Adopters preferred `<ce-grid><ce-kpi/></ce-grid>` because the wrapper composes; the specialized one didn't.
- Various wrapper proposals filtered children by tag name. This blocks future composition — you can't drop a new typed renderer in until the wrapper learns about it.

## Decision

Components should accept **arbitrary HTML children** unless there is a strong semantic reason to restrict them (e.g. ARIA-spec mandates a specific child role).

- **Light DOM by default** ([ADR-002](../adr/adr-002-light-dom.md)) — children pass through, the browser renders them.
- Specialized child components (`<ce-bar-row>`, `<ce-flow-step>`, `<ce-check-item>`) are **encouraged but not required**. The parent should fall back to rendering arbitrary children gracefully.
- A wrapper that silently drops "unrecognized" children is the wrong pattern.

## Goal / Definition of success

- No component refuses to render arbitrary children unless ARIA mandates it.
- Composed examples appear in the catalog (`ce-kpi` containing `ce-sparkline`; `ce-card` containing `ce-kpi` + `<p>`).
- New typed renderers (e.g. future `ce-currency`, `ce-date`) work inside existing slots without library changes.

## When to apply

- Every **container** component (`ce-card`, `ce-section`, `ce-grid`, `ce-kpi-grid`, `ce-progress-list`, etc.).
- Every component with a default slot or a `*-item` child relationship.

## When NOT to apply

- **ARIA-bound containers** where the spec mandates child role:
  - `<ce-tabs>` panels must have `role="tabpanel"` per ARIA.
  - `<ce-radio-group>` children must have `role="radio"`.
  - `<ce-listbox>` children must have `role="option"`.
- In these cases, the child role is structural and the wrapper sets it on each child. Foreign children that can't carry the role are out of scope.

## Good examples

```html
<!-- ce-card composes everything: KPI + sparkline + narrative -->
<ce-card>
  <ce-kpi value="$12 480" label="MRR" trend="+18%">
    <ce-sparkline slot="trend" values="[3,5,4,7,6,9,8,12]" color="green"></ce-sparkline>
  </ce-kpi>
  <p>Last 30 days. <a href="#breakdown">Breakdown</a>.</p>
</ce-card>

<!-- ce-grid takes whatever children make sense -->
<ce-grid columns="3">
  <ce-kpi value="142ms" label="P95"/>
  <ce-callout type="info">Latency spike on Friday — see incident #42.</ce-callout>
  <ce-feature-card icon="🚀" title="New release">Shipped v2.4 — see changelog.</ce-feature-card>
</ce-grid>

<!-- ce-bar-chart accepts both JSON and child rows + arbitrary inline narrative -->
<ce-bar-chart>
  <ce-bar-row value="42" color="blue"><span slot="label">Hero</span></ce-bar-row>
  <ce-bar-row value="27" color="green"><span slot="label">Kpi</span></ce-bar-row>
  <p slot="footer">Data refreshed hourly. <a href="#source">Source.</a></p>
</ce-bar-chart>
```

## Bad examples (anti-patterns)

```html
<!-- ❌ Wrapper filters children — explanation paragraph silently dropped -->
<ce-stat-group>
  <p>This group covers SLO-critical metrics only.</p>
  <ce-kpi .../>
  <ce-kpi .../>
</ce-stat-group>

<!-- ❌ Wrapper enforces tag-name allowlist -->
<ce-kpi-grid only-children="ce-kpi">
  <ce-callout>This adjacent note would be dropped</ce-callout>
</ce-kpi-grid>
<!-- Locks out future typed renderers. -->
```

## Consequences

- ✅ Composability scales — new components fit in immediately without amending wrappers.
- ✅ Authors can interleave narrative HTML with components without resorting to manual placement.
- ✅ Aligns with [ADR-009](../adr/adr-009-llm-tolerant-components.md) — LLMs combine components in shapes we did not test; rejecting their combinations punishes users.
- ✅ Encourages deprecation of overlap components — `ce-stat-group` becomes redundant when `ce-grid + ce-kpi` covers it.
- ⚠️ Less "guidance" — authors can put anything anywhere; some compositions look odd. The catalog and cheat-sheet point to canonical patterns.

## Validation

- **Manual review prompt:** drop a `<p>Hello</p>` inside the component being designed. Does it render? In most cases the answer should be yes.
- **Manual review prompt:** *"What happens if a future `ce-currency` component is dropped inside this component's slot?"* If the answer is "it would be ignored / dropped / break", the design is too rigid.
- **Lint candidate:** `meta.json` `slots[*]` should not document "only these tag names allowed" semantics. The component should accept whatever children fit visually.

## History

- 2026-05-18 — Accepted. Triggered by the audit finding that `ce-stat-group` has 0 adoption while `ce-grid + ce-kpi` has 28. Codifies the composability principle that ADR-002 (Light DOM) and ADR-009 (LLM-tolerant) both lean on.

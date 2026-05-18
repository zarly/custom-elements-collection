---
id: CDR-003
title: Presentation policy is global; markup is data-first
status: accepted
date: 2026-05-18
compliance: SHOULD
tags: [api-design, presentation, theme]
relates_to: [ADR-003, ADR-009, src/components/donut, src/components/bar-chart, src/components/gauge]
---

# CDR-003 — Presentation policy is global; markup is data-first

## Context

Presentation choices like "show the legend on a donut", "show gridlines on a bar chart", "animate transitions", "compact density mode", "accent color shift" are typically **document-wide** decisions. A given report or dashboard has one style guide; every instance of the same component should follow that guide.

When each instance has to opt-in via a per-tag attribute (e.g. `auto-legend`), every markup author re-decides the same thing on every tag. The result:

- Inconsistency within a single document.
- Tokens wasted on repeated opt-ins.
- No central knob — a theme designer can't flip one switch to change the look.
- LLM authors guess which booleans to set, often missing the convention.

The mistake we want to prevent: shipping `auto-legend` (or `gridlines`, or `animated`, or `compact`) as a per-instance boolean by default. These are document policy, not data.

## Decision

Presentation policy that should be document-uniform lives in three layers, in this order of preference:

1. **Sensible default behaviour** — works without any setting. Pick the default so the most common case requires zero opt-in. (e.g. donut shows legend when ≥ 2 segments; bar chart shows values inside bars.)
2. **CSS custom property** (`--ce-<comp>-<policy>`) on `:root` or any ancestor — document-wide / scoped override.
3. **Named slot escape hatch** (`<slot name="legend">`, `<slot name="footer">`) for the rare per-instance customisation.

A per-instance boolean attribute is the last resort, used only when a choice is genuinely per-data (e.g. `gridlines` on one specific chart that's a deep-dive sub-view of a dashboard otherwise without gridlines).

## Goal / Definition of success

- Zero new per-instance boolean attributes for "show X / hide Y / animate Z" choices added without explicit ADR-009 reasoning.
- Every such policy is reachable via a `--ce-<comp>-*` CSS custom property.
- Defaults chosen so the most common case requires no setting.

## When to apply

- The choice should ideally be **uniform within a document** (legend visibility, density, animation, accent shift, sparkline default shape).
- Multiple instances of the component plausibly appear on the same page.
- A theme-level designer would expect one knob to set it for the whole document.

## When NOT to apply

- **Genuinely per-data choices** — `value="..."`, `color="green"` for one specific semantic.
- **ARIA-bound choices** — must be explicit per-instance.
- **Presence/absence of structural content** — that's a slot, not a policy. `<div slot="legend">` is rich-content-replacement, not a policy boolean.
- **Single-use overrides** — when an author genuinely wants this specific instance to differ from the document policy, the slot escape hatch covers them.

## Good examples

```html
<!-- 99% of pages: just give data; sensible default handles the rest -->
<ce-donut values="[42,28,18,12]" labels='["Direct","Search","Referral","Social"]'></ce-donut>

<!-- Document-wide control via :root CSS custom property -->
<style>
  :root {
    --ce-donut-legend-display: none;
    --ce-bar-chart-gridlines: visible;
    --ce-sparkline-shape: area;
  }
</style>

<!-- Escape hatch via slot for one specific instance -->
<ce-donut values="[...]">
  <aside slot="legend">Custom legend with annotations</aside>
</ce-donut>
```

## Bad examples (anti-patterns)

```html
<!-- ❌ Same policy opt-in repeated on every instance -->
<ce-donut auto-legend values="[1,2,3]"></ce-donut>
<ce-donut auto-legend values="[4,5,6]"></ce-donut>
<ce-donut auto-legend values="[7,8,9]"></ce-donut>
<!-- Three identical opt-ins → should be one CSS var on :root. -->

<!-- ❌ Boolean noise — every presentation choice as a flag -->
<ce-bar-chart gridlines animated show-values compact label-width="auto" data="[]"></ce-bar-chart>
<!-- 5 presentation booleans = 5 policy decisions at markup level. -->
```

## Consequences

- ✅ Document-level consistency without per-instance effort.
- ✅ Theme designers have a single knob per policy.
- ✅ Less markup verbosity; cleaner LLM output.
- ✅ Aligns with [ADR-003](../adr/adr-003-theming.md) — tokens own presentation.
- ⚠️ Slightly less discoverable — authors must know about the CSS var; mitigated by examples and cheat-sheet.
- ⚠️ Choosing the right default matters more. Wrong default forces many CSS overrides.

## Validation

- **Lint candidate:** `rule_no_policy_booleans` — flags new boolean attributes in `meta.json props[*]` whose name matches policy patterns (`auto-*`, `show-*`, `hide-*`, `animated`, `compact`, `dense`). Author must justify or convert to CSS custom property.
- **Manual review prompt:** *"If five instances of this component appeared on one page, would the team want this attribute set the same on all five?"* If yes → CSS var, not per-instance attribute.
- **Theme-token registry:** every CSS custom property added must appear in `meta.json cssVariables[]` per ADR-005.

## History

- 2026-05-18 — Accepted. Triggered by operator critique of plan-v2 `auto-legend` proposal on `ce-donut`. Quote: *"our philosophy here to make application data first... it would be good to move it to user decision level... user can decide in some settings show legend or don't show legend... we should think about the way how to make this global setting subject... it will save context for us, we will spend less token, and we will provide better user experience."*

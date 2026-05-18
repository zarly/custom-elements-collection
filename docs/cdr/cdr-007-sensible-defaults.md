---
id: CDR-007
title: Sensible defaults; zero-attribute usage works for the common case
status: accepted
date: 2026-05-18
compliance: SHOULD
tags: [ergonomics, defaults]
relates_to: [ADR-009, CDR-003]
---

# CDR-007 — Sensible defaults; zero-attribute usage works for the common case

## Context

A component with N attributes is a component with N opportunities to omit, mistype, or misalign. The corpus audit confirmed: every `examples.html` block that opens with `<ce-foo a="..." b="..." c="..." d="..." e="..." data="[]">` has a measurable drop in adoption compared to the same component shown as `<ce-foo value="42">`.

LLM authors are especially sensitive to this. When the first example in the catalog is verbose, the LLM emits verbose markup. When the first example is one-attribute, the LLM emits one-attribute markup. The default usage of every component is set by example, not by spec.

This CDR ties together two ergonomic constraints:

1. The **simplest valid invocation** of a component — often just the tag with one piece of data — should produce a useful idiomatic rendering.
2. The **first `@example` block** in `examples.html` should demonstrate that simplest invocation, not a kitchen-sink showcase.

## Decision

For every component:

- **The simplest valid invocation produces a useful idiomatic rendering.** Default attribute values are chosen to match the most common observed corpus use case.
- **All other attributes have sensible defaults.** No attribute is required if any reasonable default exists.
- **The first `@example` block** uses **≤ 2 attributes beyond the required data**, and demonstrates the static / default case (composes with [CDR-004](cdr-004-static-first-stateful-optin.md)).
- Subsequent example blocks introduce additional attributes one or two at a time, building from minimal to rich.

## Goal / Definition of success

- Every component's first `@example` block uses ≤ 2 attributes beyond required data.
- Defaults match the most common observed use case in the corpus.
- Required attributes are rare and explicitly justified in `meta.json` (`required: true`).

## When to apply

- Every component, regardless of category or tier.

## When NOT to apply

- N/A — this is a universal ergonomic constraint, not a context-sensitive rule.

## Good examples

```html
<!-- Simplest invocation: tag + one data attribute -->
<ce-verdict type="go"></ce-verdict>            <!-- → ✓ Go -->
<ce-donut values="[1,2,3]"></ce-donut>         <!-- → donut + legend, sensible palette -->
<ce-progress value="50"></ce-progress>         <!-- → half-full blue bar -->
<ce-kpi value="$12 480" label="MRR"></ce-kpi>  <!-- → KPI tile, no trend, no color override -->
<ce-callout type="info">FYI</ce-callout>        <!-- → blue info callout -->
```

```html
<!-- First example of ce-donut.examples.html — minimal, idiomatic -->
<!-- @example Default donut -->
<ce-donut values="[42,28,18,12]" labels='["Direct","Search","Referral","Social"]'></ce-donut>

<!-- Subsequent examples introduce one new feature at a time -->
<!-- @example Pie variant (thickness=0) -->
<ce-donut values="[55,30,15]" labels='["Free","Pro","Team"]' thickness="0"></ce-donut>

<!-- @example Center slot for rich label -->
<ce-donut values="[68,32]" thickness="14">
  <div slot="center">
    <strong>68%</strong>
    <small>complete</small>
  </div>
</ce-donut>
```

## Bad examples (anti-patterns)

```html
<!-- ❌ First example requires 5 attributes to do anything -->
<ce-bar-chart animated show-values gridlines label-width="auto" color="blue" data="[]"></ce-bar-chart>
<!-- LLM learns "every ce-bar-chart needs these 5 attributes". Verbose forever. -->

<!-- ❌ Attribute is required but no default makes sense (over-required) -->
<ce-verdict></ce-verdict>   <!-- error: type is required, no default -->
<!-- 'info' could be the default. Forcing the author to pick one for every use
     adds friction. -->

<!-- ❌ "Kitchen sink" first example -->
<!-- @example Full-featured bar chart -->
<ce-bar-chart animated gridlines compact show-values label-width="120px" color="purple"
              data='[…12 items…]'>
</ce-bar-chart>
<!-- Trains LLM to emit the verbose form even for trivial cases. -->
```

## Consequences

- ✅ Low cognitive load for first-use; high discoverability.
- ✅ LLM output stays compact — small attribute count begets small output.
- ✅ Composes with [CDR-003](cdr-003-presentation-policy-global.md) — when policy lives in CSS vars, defaults work for the common case automatically.
- ⚠️ Picking the right default is hard; wrong defaults force many overrides. Choose defaults from observed corpus usage, not from "looks nice in isolation".
- ⚠️ Authoring discipline: resist the urge to demonstrate everything in example #1.

## Validation

- **Lint candidate:** `rule_min_attrs_in_first_example` — flags the first `@example` block when it uses > 2 attributes beyond required `data` or value.
- **Manual review checklist:** *"Can a user get a useful rendering by writing just `<ce-foo>` or `<ce-foo data='[...]'>`?"* If no → reconsider defaults.
- **Manual review checklist:** *"What does an LLM learn from looking at example #1 of this component?"* The first example sets the default usage pattern.

## History

- 2026-05-18 — Accepted. Captures the ergonomic insight surfaced by the audit: components with 6+ examples and minimal-first-example show measurably higher adoption than components with 1 verbose-kitchen-sink example.

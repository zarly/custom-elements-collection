---
id: CDR-001
title: Style enum is finite; content text is unbounded → use slots
status: accepted
date: 2026-05-18
compliance: SHOULD
tags: [api-design, vocabulary, composition]
relates_to: [ADR-009, CDR-002, src/components/verdict, src/components/chip, src/components/persona]
---

# CDR-001 — Style enum is finite; content text is unbounded → use slots

## Context

Components often need to express domain vocabulary — verdict types, statuses, severity levels, decision outcomes, priority labels. The natural temptation when a new word appears in a use case is to extend the component's `type` enum to cover it. Real examples seen in audit:

- `ce-verdict` started with `go | no-go | mixed | info`. Real corpus usage adds `pursue`, `reject`, `investigate`, `ship`, `hold`, `ok`, `fail` — at least ten distinct vocabulary tokens.
- Internal proposals tried to encode all ten as aliases in the enum.

This is a losing strategy. Vocabulary is genuinely unbounded: every team has its own words, every new project surfaces new words, and the enum grows forever. Each addition is a breaking-change risk, an i18n burden, and an LLM-prior pollution (training distributions get one shape; future expansions get a different shape).

[ADR-009](../adr/adr-009-llm-tolerant-components.md) commits the library to minimum surface and tolerance to unanticipated inputs. Stuffing vocabulary into enums is the opposite of that commitment.

## Decision

Split style from content.

- **`type` (or any enum-shaped attribute)** drives styling only: color tokens, default icon, ARIA role/label. Keep the enum **finite (≤ 5 canonical values)**.
- **Default slot (children)** carries the label text. Vocabulary is unbounded; the type-default label is a fallback when the slot is empty.
- **Icon attribute** stays as a loose-coupled override on top of the type-default icon.

## Goal / Definition of success

- Every enum-shaped attribute has ≤ 5 values.
- Zero enum-shaped attributes contain domain vocabulary as values (e.g. `pursue`, `escalate`, `ship` are **not** enum values).
- Every component with a vocabulary surface has a default slot for text override.

## When to apply

- The component renders user-defined labels (verdict, status, badge, decision banner).
- The label appears inside a chip / pill / banner with semantic color coding.
- The set of possible words is open-ended or likely to grow.

## When NOT to apply

The ≤5 cap targets **open vocabularies** — enums whose values describe *what the content is about* and which can grow as teams invent new categories. The cap does NOT target **closed systems** — enums whose values describe finite mathematical, geometric, or systematic properties of the component itself.

### The structural-vs-vocabulary test

For every candidate value beyond the 5th, ask: **could this value introduce a genuinely new concept, or does it only refine an existing dimension?**

- *New concept* (e.g., "we need `type=gotcha` because gotchas are a new admonition class") → vocabulary; the cap applies.
- *Refinement along an existing axis* (e.g., "we need `space=3xs` because the scale needs a tinier step") → closed system; the cap does not apply.

A second test: **is the full set enumerable by external reference?** If yes (CSS spec, ARIA spec, design-token ladder, calendar, geometry), the enum is structural. If the set is "whatever the component author or community feels like next quarter," it is vocabulary.

### Categories of structural enum (exempt from the cap)

1. **Size and weight scales** — discrete steps on a continuous dimension that maps to the design-token ladder.
   *Example:* `space="3xs|2xs|xs|s|m|l|xl|2xl|3xl"` (ce-stack), `weight="100|200|...|900"`.
2. **Position and placement** — coordinates in a closed 2D anchor space.
   *Example:* `placement="top|top-start|top-end|bottom|bottom-start|bottom-end|left|right"` (ce-popover, ce-dropdown-menu).
3. **Direction and orientation** — closed cardinal/ordinal sets.
   *Example:* `side="start|end|top|bottom"` (ce-drawer), `direction="horizontal|vertical"`, `dir="ltr|rtl"`.
4. **Ratio and proportion** — finite sets of industry-standard ratios.
   *Example:* `ratio="1:1|4:3|16:9|21:9|3:4|golden"` (ce-frame).
5. **Depth and level** — discrete integer steps with named edge cases.
   *Example:* `default-expanded="all|none|root|depth-1|depth-2|depth-3"` (ce-tree), `level="h1|h2|h3|h4|h5|h6"`.
6. **Time quantization** — closed temporal sets defined by the calendar or clock.
   *Example:* `group-by="hour|day|week|month|quarter|year"`, `day-of-week="mon|tue|wed|thu|fri|sat|sun"`.

### Other always-exempt categories (from the original CDR)

- **Pure style enums where the words *are* the universal vocabulary.** `size="sm|md|lg"`, `tier="brick|widget|layout"` — finite by spec, not vocabulary.
- **ARIA-bound semantics.** `role="alert" | "status" | "log"` must stay as fixed strings per WAI-ARIA spec.
- **Identity attributes.** `tag`, `name`, `id` — short string identifiers, not vocabulary.

### Borderline cases (apply the test carefully)

- **Severity scales** (`severity="info|success|warning|error"`). Borderline — these CAN look like vocabulary (each value is a noun). They qualify as structural ONLY when they map to a closed external standard (e.g., RFC log levels: `trace|debug|info|warn|error|fatal`). When the set is "whatever feels right for our users," treat as vocabulary and cap at 5.
- **Variant systems** (`variant="primary|secondary|tertiary|ghost|outline"`). Almost always vocabulary in disguise — `variant` is a euphemism for `type`. The cap applies.
- **Tone scales** (`tone="default|muted|accent"`). Structural if scoped to a small fixed palette (≤3); vocabulary if growing past that.

If the call is genuinely 50/50, default to **treating as vocabulary** (apply the cap) and push the extra values into a slot. The cost of being too strict is a longer component name; the cost of being too loose is the enum-creep failure mode this CDR exists to prevent.

## Good examples

```html
<!-- 4 canonical styles + unbounded vocabulary -->
<ce-verdict type="go" inline>SHIP IT</ce-verdict>
<ce-verdict type="go" inline>launch</ce-verdict>
<ce-verdict type="no-go" inline>veto</ce-verdict>
<ce-verdict type="mixed" inline>investigate further</ce-verdict>
<ce-verdict type="mixed" inline>escalate to PM</ce-verdict>

<!-- Type-default label fallback when slot is empty -->
<ce-verdict type="go"></ce-verdict>     <!-- shows ✓ Go -->
<ce-verdict type="no-go"></ce-verdict>  <!-- shows ✗ No-go -->

<!-- Icon override decoupled from text override -->
<ce-verdict type="go" icon="↑">launch</ce-verdict>
```

## Bad examples (anti-patterns)

```html
<!-- ❌ Enum encodes vocabulary; grows unbounded -->
<ce-verdict type="pursue"></ce-verdict>
<ce-verdict type="ship"></ce-verdict>
<ce-verdict type="hold"></ce-verdict>
<ce-verdict type="escalate"></ce-verdict>
<!-- Each new word forces a new enum value, a new icon mapping, a new test. -->

<!-- ❌ Vocabulary as boolean attribute -->
<ce-verdict pursue></ce-verdict>
<ce-verdict reject></ce-verdict>
<!-- Same problem, different shape. -->
```

## Consequences

- ✅ Unbounded vocabulary — teams own their words without library changes.
- ✅ Smaller, stable enum; fewer breaking changes; less LLM-prior thrash.
- ✅ HTML reads as HTML — text inside tags is just text.
- ✅ i18n becomes natural — slot content is already locale-aware.
- ⚠️ Slightly more characters per usage (text inside tags vs short attribute value).
- ⚠️ Empty-slot fallback adds a small implementation branch.

## Validation

- **Lint candidate:** `rule_no_vocab_in_enum` — flags `meta.json props[*].type` literal-unions that contain verb-shaped or domain-shaped values (heuristic: lowercase noun/verb that is *not* one of an allowlist of style words like `auto, default, primary, secondary, sm, md, lg, top, bottom, left, right, info, warn, danger, success, neutral, ...`).
- **Manual review checklist:** *"Does this enum contain words a team would invent, or only style primitives?"* If the former → push the vocabulary to the default slot.

## History

- 2026-05-18 — Accepted. Triggered by `ce-verdict` plan v2 attempt to add 7 type aliases. Operator override: "we are narrowing our scope of usages... move type to child... or override default text with children."
- 2026-05-23 — Amendment: added the "structural-vs-vocabulary test" and six explicit categories of structural enum (size, position, direction, ratio, depth, time) that are exempt from the ≤5 cap. Triggered by 5 deviations in the same batch (ce-stack `space` 8-value, ce-frame `ratio` 6-value, ce-popover and ce-dropdown-menu `placement` 6–8-value, ce-tree `default-expanded` 6-value) all needing the same justification in their CONCEPT.md. Each CONCEPT.md now points back to this amendment instead of restating the principle.
- Supersedes `cec-validation-rules.md` R6 (vocab-breadth ≥5), which is inverted by this CDR. R6 will be marked removed in the next audit.

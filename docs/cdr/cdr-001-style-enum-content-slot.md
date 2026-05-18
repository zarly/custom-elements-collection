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

- **Pure style enums where the words *are* the universal vocabulary.** `direction="ltr|rtl"`, `size="sm|md|lg"`, `tier="brick|widget|layout"` — these are finite by spec, not vocabulary.
- **ARIA-bound semantics.** `role="alert" | "status" | "log"` must stay as fixed strings per WAI-ARIA spec.
- **Identity attributes.** `tag`, `name`, `id` — short string identifiers, not vocabulary.

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
- Supersedes `cec-validation-rules.md` R6 (vocab-breadth ≥5), which is inverted by this CDR. R6 will be marked removed in the next audit.

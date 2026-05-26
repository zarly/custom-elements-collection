# Component Design Records (CDR)

**Status:** Active series · Accepted 2026-05-18 · Sibling to `docs/adr/`.

CDRs are **system-wide design conventions** for the components in this library. They sit between two existing artefacts:

| Layer | Scope | Compliance | Lives in |
|---|---|---|---|
| **ADR** — Architecture Decision Records | Repo-level architecture | **MUST** (bright line; violations need an explicit override ADR) | [`docs/adr/`](../adr/) |
| **CDR** — Component Design Records *(this folder)* | System-wide component-design conventions | **SHOULD** (recommended; justified exceptions are allowed) | `docs/cdr/` |
| **CONCEPT.md** — per-component rationale | Why this specific component does what it does | **MAY** (optional; create when ≥2 options were weighed) | `src/components/<name>/CONCEPT.md` |

> **RFC 2119 compliance levels.** ADRs are **MUST**: they encode bright-line architectural invariants (tag prefixes, design tokens, Light DOM default, no peer-deps). CDRs are **SHOULD**: they encode the best default shape for new components — but a justified user-focused exception is allowed. CONCEPT.md is **MAY**: it captures the reasoning when a non-trivial choice was made for a specific component.

## Why CDRs exist

[ADR-009](../adr/adr-009-llm-tolerant-components.md) committed the library to a philosophy: **components are tools, not products**. The library author defines what a component *can* do; the LLM author (and through them, the end user) defines what it is *for* in a given placement. We bias toward flexibility, tolerance, and minimum surface.

ADR-009 is the **philosophy**. CDR-001..008 are the **daily-design instructions** that implement it. Examples:

- ADR-009 says "minimum surface". CDR-001 makes this concrete: *style enum is finite (≤5 values); content vocabulary lives in slots, not in enum aliases*.
- ADR-009 says "tolerant to unexpected uses". CDR-002 makes this concrete: *typed values belong in children, not in string attributes, so future renderers compose in*.
- ADR-009 says "we accept inputs we did not plan for". CDR-003 makes this concrete: *presentation policy lives at the theme/document level, not at every markup invocation*.

Without CDRs, every contributor (human or agent) re-derives these principles from scratch on every component. With CDRs, the philosophy has operational teeth.

## The 11 accepted CDRs

| ID | Title | Compliance | Triggered by | Validator hook |
|---|---|---|---|---|
| [CDR-001](cdr-001-style-enum-content-slot.md) | Style enum is finite; content text is unbounded → use slots | SHOULD | `ce-verdict` 2026-05-18 feedback | `rule_no_vocab_in_enum` |
| [CDR-002](cdr-002-typed-values-as-children.md) | Typed values belong in children, not in string attributes | SHOULD | `ce-key-value` 2026-05-18 feedback | `rule_no_string_value_attr` |
| [CDR-003](cdr-003-presentation-policy-global.md) | Presentation policy is global; markup is data-first | SHOULD | `ce-donut` 2026-05-18 feedback | `rule_no_policy_booleans` |
| [CDR-004](cdr-004-static-first-stateful-optin.md) | Static-first; stateful behavior is opt-in | SHOULD | Adoption audit 2026-05-17 | R8 (already encoded) |
| [CDR-005](cdr-005-collections-json-and-slot.md) | Collections accept both data-array and slot-children | SHOULD | Adoption audit 2026-05-17 | R4 (already encoded) |
| [CDR-006](cdr-006-components-compose.md) | Components compose; no hard wrappers | SHOULD | Composability gap | Manual review |
| [CDR-007](cdr-007-sensible-defaults.md) | Sensible defaults; zero-attribute usage works for the common case | SHOULD | Ergonomics | `rule_min_attrs_in_first_example` |
| [CDR-008](cdr-008-additive-changes-only.md) | Additive changes only; deprecate via stability + ADR | SHOULD | Migration discipline | Meta-prop removal CI gate |
| [CDR-009](cdr-009-deterministic-dom.md) | Deterministic DOM for static-tier components | SHOULD | 2026-05-22 audit · benchmark scoring | `tests/determinism/` + lint grep |
| [CDR-010](cdr-010-same-data-multiple-views.md) | Same data, multiple views — siblings over variants | SHOULD | 2026-05-22 audit · customization goal | `rule_no_renderer_swap_enum` · `rule_no_sort_attribute` |
| [CDR-011](cdr-011-llm-failure-mode-tolerance.md) | LLM failure-mode tolerance catalogue (6 cases, per-mode fixtures) | SHOULD | 2026-05-22 audit · ADR-009 operationalization | `tests/llm-failure-modes/` |

> **Earlier draft, dropped.** CDR-012 ("Strict schema, tolerant runtime") was filed 2026-05-22 and dropped the same day after review. The substance (`additionalProperties: false`, exhaustive `required[]` for strict-mode tool calling) is a ~5-line transform downstream consumers do at their adapter layer; ADR-007 already commits to keeping vendor-specific projections out of this package. The 2026-05-22 audit (`vis/cec-rules-audit-2026-05-22.html`) is the historical record of the consideration.

## When to consult a CDR

- **Authoring a new component.** Run through all 8 CDRs as a pre-flight checklist. The reference component layout in `CONTRIBUTING.md` §4 was updated to point here.
- **Reviewing a PR that touches a component's public API.** Confirm the change is consistent with applicable CDRs, or that the PR description justifies the exception.
- **Resolving an "is this design right?" debate.** A CDR with `accepted` status is the tie-breaker for the default shape. The debate is then about whether THIS scenario warrants a deviation.

## When a CDR may be overridden

CDRs are **SHOULD**, not **MUST**. A user-focused scenario can justify a deviation. The bar:

1. **State the user-facing benefit** explicitly. "It's easier for the author" is not a sufficient justification; "the end user sees X faster / clearer / more accessibly" is.
2. **Document the deviation** in the component's `CONCEPT.md` (create one if absent — ADR-008). Future contributors must see *why* this component's API breaks the convention.
3. **Note it in PR description** with the format `Deviation: CDR-NNN — <one-line reason>`.
4. **Keep the deviation local** — don't generalize it. If the same deviation appears in 3+ components, propose a superseding CDR or amend the existing one (lifecycle below).

This is intentionally lighter than ADR overrides (which require a fresh ADR). The reason: CDRs codify *defaults*; the existence of a justified exception doesn't break the default.

## Lifecycle

```
[user feedback / retrospective audit]
        │
        ▼
  candidate (status: proposed, lives in this folder under `candidates/`)
        │
        ▼ explicit approval
  accepted (this folder, numbered file)
        │
        ▼ rule is stable across ≥2 audits
  validator rule (staged in cec-validation-rules.md → validate.py)
        │
        ▼ if rule proves too strict
  amended / superseded by next CDR
```

A CDR is **superseded** (not deleted) when newer thinking obviates it. The original stays in the folder with `status: superseded by CDR-NNN`, preserving the audit trail.

## CDR template

Every accepted CDR uses this exact structure. Skip sections that are empty rather than padding them.

```markdown
---
id: CDR-NNN
title: <short imperative phrase>
status: accepted | superseded-by CDR-MMM
date: YYYY-MM-DD
compliance: SHOULD
tags: [api-design, composition, vocabulary, ...]
relates_to: [ADR-NNN, CDR-MMM, src/components/<x>]
---

# CDR-NNN — <Title>

## Context
What situation calls for this convention? What mistake repeats without it?

## Decision
What we decide to do, as an imperative. State both the canonical case and any
explicit exceptions baked into the rule itself.

## Goal / Definition of success
Measurable outcomes that say the convention is working.

## When to apply
Specific situations where this rule fires.

## When NOT to apply
Where over-applying would harm; explicit exceptions noted.

## Good examples
Real code following the rule (cite real components when possible).

## Bad examples (anti-patterns)
Code that violates the rule and *why* it's wrong.

## Consequences
- ✅ Pros gained.
- ⚠️ Tradeoffs accepted.

## Validation
How compliance is checked — manual review, lint rule, validator function.
```

## Cross-references

- [`docs/adr/`](../adr/) — repo-wide architectural decisions.
- [`docs/adr/adr-008-component-concept-files.md`](../adr/adr-008-component-concept-files.md) — per-component design rationale.
- [`docs/adr/adr-009-llm-tolerant-components.md`](../adr/adr-009-llm-tolerant-components.md) — the philosophy CDRs operationalize.
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — authoring checklist; §4 now references this folder.
- Validator skill: `.claude/skills/cec-component-validator/` — distills CDRs into mechanical rules.
- Auto-memory companion: `cec-adoption-lessons.md` + `cec-validation-rules.md` — feeds into and out of this folder.

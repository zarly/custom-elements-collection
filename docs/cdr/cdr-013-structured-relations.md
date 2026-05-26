---
id: CDR-013
title: Structured component relations — split deps + reverse-index auto-computation
status: accepted
date: 2026-05-25
compliance: SHOULD
tags: [meta, relations, schema, dependencies, registry]
relates_to: [ADR-005, ADR-007, ADR-015, CDR-006, CDR-008, CDR-012]
---

# CDR-013 — Structured component relations

## Context

v1 meta has three relation fields: `dependencies[]`, `dependents[]`, `related[]`. All three are typed as `string[]` (tag names). Three problems compound:

1. **`dependencies` conflates three different relationships:** TS-level imports (build-time bundle), runtime tag children (DOM composition), and runtime injections (`document.createElement` calls). Consumers (bundle-analyzer, studio composition validator, gen-dom auto-fill) need different subsets but the meta cannot distinguish them.

2. **`dependents` is hand-maintained and drifts.** Every entry duplicates a `dependencies[]` entry on another component. The two sides go out of sync on every PR.

3. **No expression of structural constraints.** `ce-bar-row` semantically requires `ce-bar-chart` as a parent — but the meta has no field to declare this. Studio cannot refuse `<ce-bar-row>` at the top level.

## Decision

Replace the v1 trio with five structured fields plus four auto-computed reverse indexes.

### Author-written fields (v2 additions)

| Field | Compliance | Replaces / extends |
|---|---|---|
| `requiredParent: string[]` | MUST | (new — was implicit) |
| `childPolicy: "none" \| "any" \| "constrained"` | MUST | (new; "any" default keeps v1 behavior) |
| `slots[].acceptTags: string[]` | MUST | (new — was implicit in examples) |
| `codeDependencies: string[]` | SHOULD | TS-import subset of `dependencies[]` |
| `tagDependencies: string[]` | MUST | runtime-children subset of `dependencies[]` |
| `injects: string[]` | SHOULD | (new — was hidden in implementation) |
| `interchangeableWith: Array<{tag, scope?, when?}>` | SHOULD | (new; see CDR-012) |
| `role: "transparent-wrapper" \| "container" \| "leaf"` | SHOULD | (new; see CDR-012) |
| `slotCompatible: boolean` | MAY | (new) |
| `preferredSlotIn: string[]` | MAY | (new) |
| `related: string[]` | MAY | unchanged from v1 |
| `subTags: string[]` | MAY | unchanged from v1 |

### Auto-computed (in `dist/relations.json`)

| Field | Reverse of |
|---|---|
| `tagDependents[]` | `tagDependencies[]` |
| `codeDependents[]` | `codeDependencies[]` |
| `injectsInto[]` | `injects[]` |
| `childOf[]` | `requiredParent[]` |
| `interchangeableSymmetric[]` | symmetric closure of `interchangeableWith[]` |

### Deprecation

- `dependencies[]` and `dependents[]` remain valid in the schema for v0.7 and v0.8 with Zod `.refine()` warnings.
- v0.9 removes them.
- Codemod `scripts/migrate-v1-to-v2.ts` splits `dependencies[]` into `codeDependencies` + `tagDependencies` based on TS-import scan vs example-slot scan.

## Rationale

**Why MUST on `requiredParent`/`childPolicy`/`tagDependencies`/`slots[].acceptTags`:** these encode structural constraints studio enforces on submit. False compositions are user-visible defects.

**Why SHOULD on `codeDependencies`/`injects`/`interchangeableWith`/`role`:** consumer-helpful, not safety-critical.

**Why MAY on `slotCompatible`/`preferredSlotIn`:** hints for LLM tool-use prompts; not failures.

**Why auto-compute reverse indexes:** removes ~133 × `dependents.length` cells of hand maintenance and the drift bugs that come with them. The build script reads forward edges once, emits both directions.

## Consequences

- Author burden split: more fields to fill (codemod handles defaults), zero reverse-index maintenance.
- Studio composition validator can refuse mechanical mistakes at submit time.
- `dist/relations.json` is a new public artifact (consumer-readable graph).
- v0.7/v0.8 manifest can include both v1 `dependencies[]` and v2 `tagDependencies[]`; codemod ensures consistency.

## References

- ADR-015 §"Fields added — by tier" + §"Deprecation path for legacy fields".
- Implementation plan §6 "Migration mechanics".
- Studio jobs `0022.01` (parent-child contracts) + `0022.05` (split dependencies) + `0022.08` (reverse-index auto-computation).

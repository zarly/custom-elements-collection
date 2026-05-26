---
id: CDR-015
title: Determinism + streaming-safety meta fields
status: accepted
date: 2026-05-25
compliance: MUST
tags: [meta, determinism, streaming, schema]
relates_to: [ADR-014, ADR-015, CDR-008, CDR-009, CDR-014]
---

# CDR-015 — Determinism + streaming-safety meta fields

## Context

CDR-009 ("Deterministic DOM") commits to byte-identical `innerHTML` from static-tier components on byte-identical input across runs. Enforcement today: `scripts/lint-determinism.ts` reads source comments looking for the `cec-allow-nondeterministic` escape hatch. The registry has no field expressing the determinism property — so consumers (benchmark Q-16, studio test fixtures, generative-dom skeleton decisions) cannot query it.

Similarly, ADR-014 introduces a streaming lifecycle (chunk → block → flush) that components implicitly participate in — but the meta doesn't declare each component's streaming behavior, so the generative-dom companion plugin and studio's test fixtures rely on guessing.

## Decision

Four new fields in v2 meta:

| Field | Compliance | Purpose |
|---|---|---|
| `deterministic: boolean` | MUST | Declares CDR-009 conformance. |
| `nondeterministicReason: string` | conditionally MUST | Required when `deterministic = false`. Escape hatch with documentation. |
| `streamSafe: boolean` | SHOULD | True = component renders coherently from a partial DOM build-up. False = needs to wait for slot completion. |
| `streamingLifecycle.finalizesAt: "flush" \| "blockEnd" \| "chunkBoundary" \| "tagEnd"` | SHOULD | When the component's DOM is considered final. |

Zod adds a conditional `.refine()`: `deterministic === false` requires `nondeterministicReason` to be present and ≥ 8 chars.

`scripts/lint-determinism.ts` flips from comment-scanning to `meta.deterministic`-reading; the escape-hatch comment style is deprecated.

## Migration

The codemod fills:

- `deterministic` → `true` when no `timer` / `network` / `state` side-effects appear in v1 `sideEffects[]`. Else `false`.
- `nondeterministicReason` → `"TODO: <kind> side-effect on this component"` when codemod sets `false`. Manual review pass to write proper reasons.
- `streamSafe` → `true` when `contentModel ∈ {"block", "inline"}` and `streamingLifecycle.finalizesAt !== "flush"`. Else `false`.
- `streamingLifecycle.finalizesAt` → `"blockEnd"` as default; manual override for known special cases (`ce-bar-chart` → `"flush"`).

## Consequences

- CDR-009 conformance becomes queryable from the registry (was: source-comment scan only).
- Benchmark scoring Q-16/Q-17 can read the declaration directly.
- Generative-dom companion can pick between full render and skeleton based on `streamSafe`.
- `pnpm validate-meta` now refuses `deterministic: false` without a reason — was previously silent.

## References

- ADR-014 (streaming lifecycle).
- CDR-009 (deterministic DOM).
- ADR-015 §"Fields added — by tier".
- Studio job `0023.05` (determinism + streaming-safety).

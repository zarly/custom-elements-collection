# ADR-015 — Component Meta Schema v2

**Status:** Accepted (2026-05-25).
**Supersedes parts of:** ADR-005 (the meta-schema shape only — the why-and-how of `*.meta.json` files remains).
**Companion:** ADR-016 (conformance file), CDR-012, CDR-013, CDR-014, CDR-015.

## Context

ADR-005 landed a meta-schema v1 with 14 fields, validated via Zod, projected into `dist/registry*.json` per ADR-007. After ~12 months in production we have:

1. A documented LLM-benchmark failure where strict tag-set matching scores semantically-equivalent answers at ~0 (see `llm-benchmark/docs/methodology.md`, and the 27/45 "library-wide pattern" rate observed in studio jobs `0020/0021`).
2. An external manual curation burden in `generative-dom/packages/plugins/companion/plugin.ts` (`COMPANION_DEFAULT_BLOCK_TAGS` ~70 entries hand-maintained in lockstep with CEC growth).
3. Studio's submit-time validator cannot refuse mechanically-wrong compositions (`ce-bar-row` outside `ce-bar-chart`) because the meta does not express parent-child contracts.
4. Author burden in the meta itself: `dependents[]` is required but inconsistently maintained because it duplicates `dependencies[]` of other components — a known reverse-index synchronization problem.
5. CDR-009 (Deterministic DOM) is enforced by a lint script reading hardcoded escape-hatch comments — but the registry cannot answer "is this tag deterministic?" without parsing source.

Two operator review passes (studio jobs `0022-cec-meta-v2-initiatives` and `0023-cec-meta-v2-batch-2`, 2026-05-25) ranked 20 proposals; 11 accepted, 6 rejected, 3 reworks resolved.

## Decision

Bump the meta schema to v2 by **additively** layering 15 new fields onto the existing v1 shape, with the four-tier compliance taxonomy (MUST/SHOULD/MAY/INTERNAL) baked into the registry projection. Two v1 fields (`dependents`, `dependencies`) are split into structured replacements and deprecated. Conformance receipts move to a per-component sibling file (ADR-016).

### Schema-version policy

- `ComponentMeta.schemaVersion`: TypeScript literal `1` → discriminated union `1 | 2`.
- During the v0.7 release cycle, both v1 and v2 manifests validate.
- The codemod `scripts/migrate-v1-to-v2.ts` rewrites every existing `*.meta.json` to v2 in one mechanical pass with safe defaults; manual review only for `requiredParent`, `contentModel`, `deterministic`.
- v0.9 removes v1 acceptance.

### Compliance tiers

Recorded in `src/meta/compliance-tiers.ts` and projected into `dist/registry.json` as `$schema.compliance`. Consumer-side behavior:

| Tier | studio | benchmark | publish |
|---|---|---|---|
| MUST | refuse on violation | zero-score | block |
| SHOULD | warn | 0.5× penalty | warn |
| MAY | informational | canonicalization input | — |
| INTERNAL | auto-computed | auto-computed | derived artifact |

Studio's MUST-tier validator lands behind a flag and starts as warning-only; flipped to refuse after ≥ 90% of components are migrated (decision D-7 in the implementation plan).

### Fields added — by tier

**MUST (validator refuses):** `requiredParent`, `childPolicy`, `contentModel`, `tagDependencies`, `slots[].acceptTags`, `deterministic` (+ conditional `nondeterministicReason`).

**SHOULD (validator warns):** `role`, `interchangeableWith`, `codeDependencies`, `injects`, `streamSafe`, `streamingLifecycle`, `props[].semanticType`.

**MAY (informational):** `props[].aliases`, `props[].semanticGroup`, `slots[].acceptShapes`, `slotCompatible`, `preferredSlotIn`.

**INTERNAL (auto-computed; emitted to `dist/relations.json`, not stored in source meta):** `tagDependents`, `codeDependents`, `injectsInto`, `childOf`, `interchangeableSymmetric`.

Field-level reference: [`docs/cec/meta-fields-registry.md`](../../../docs/cec/meta-fields-registry.md) at the meta-repo root.

### Conformance receipts move to a sibling file

A per-component file `src/components/<name>/<name>.conformance.json` carries one flat object keyed by criterion id (`ADR-*`, `CDR-*`) and valued `true | false | string-comment`. See ADR-016. Conformance receipts are NOT stored in `*.meta.json` because they (a) update on a different cadence than the API contract, (b) are partially populated by tooling (`cec-component-validator`), and (c) would otherwise churn meta versions.

### Deprecation path for legacy fields

- `dependencies[]` → split into `codeDependencies` + `tagDependencies` + `injects`. Kept valid in v0.7+v0.8 with Zod `.refine()` warning; refused at v0.9. Default `[]`.
- `dependents[]` → auto-computed reverse index in `dist/relations.json`. Kept valid as authored field but ignored by the registry in v0.7+v0.8; refused at v0.9.
- Sub-field `a11y { role, notes }` (already optional) — unchanged in v2; structured a11y was reviewed and rejected per studio job 0023.

### Migration tooling

The codemod fills:

- `contentModel`: inferred from `tier` (`layout` → `block`; otherwise default `block`; `void` inferred only when slots is empty AND component has no body-rendering examples).
- `deterministic`: `true` when no `timer`/`network`/`state` side-effects; `false` otherwise with `nondeterministicReason: "TODO: <inferred-reason>"`.
- `streamSafe`: `true` when `contentModel != "void"` and no `streamingLifecycle.finalizesAt: "flush"` situation.
- `streamingLifecycle.finalizesAt`: `"blockEnd"`.
- `role`: `"transparent-wrapper"` for `ce-grid`/`ce-center`/`ce-section`/`ce-card` (when tier=layout); `"leaf"` otherwise.
- `childPolicy`: `"none"` for void; `"any"` otherwise.
- `requiredParent`: `[]` everywhere; manual review surfaces components that should constrain.
- Splits existing `dependencies[]` into `codeDependencies` / `tagDependencies` by scanning sibling `<name>.ts` (TS imports) and `<name>.examples.html` (slot children).
- `interchangeableWith`: `[]` at codemod time; manual seed from `llm-benchmark/corpus/*.yaml` accepted variations.

## Consequences

**Positive:**
- Studio refuses mechanically-wrong compositions on submit (after warning → refuse flip).
- Benchmark canonicalizes via `interchangeableWith` + `role: transparent-wrapper` → ~27 corpus variations removable.
- `dist/registry.json` becomes the single source of truth for the generative-dom companion plugin (drops hardcoded `COMPANION_DEFAULT_BLOCK_TAGS`).
- Author burden drops: `dependents[]` no longer hand-maintained.
- CDR-009 conformance becomes a registry field, not a comment scan.

**Negative / costs:**
- One-time codemod pass over 133 components plus manual review on ~3 fields × 133 = ~400 cells worth of human attention.
- Two-cycle deprecation window for `dependencies[]`/`dependents[]` — schema accepts both old and new during v0.7/v0.8.
- Consumer repos (studio, benchmark, generative-dom) each need an update PR; per D-6 these land independently.

**Risks tracked:**
- The `requiredParent` MUST tier in studio could false-positive during migration if a manifest doesn't yet have v2 fields. Mitigation: D-7 (warning mode until 90% migrated).
- Drift between CEC's `contentModel` field and generative-dom's local hardcode for the one-cycle window per D-6. Mitigation: pre-publish test compares the two lists.

## Status of rejected ideas

Recorded for future revisit (studio feedback files `0022/0023.json`):

- Structured a11y (per-component A-1..A-11 receipts) — rejected: "No need on this stage."
- Form-participation meta — rejected: "Too complex; LLM is flexible."
- i18n / RTL contract — deferred: "Maybe in future."
- Theme-token contract (minTokenSet / themeSwitchSafe) — rejected: "All tokens are mandatory; list useless."
- User-scenarios mapping — rejected.
- CSP profile + sideEffects scope — rejected.
- `variationGroup` — operator chose option A (drop) of three.
- Skeleton / frameworks / bundleSize receipts (within initiative 0023.10) — narrowed to conformance only.

## References

- Implementation plan: [`docs/concepts/cec-genui-stack/meta-v2-implementation-plan.md`](../../../docs/concepts/cec-genui-stack/meta-v2-implementation-plan.md) at the meta-repo root.
- Field registry: [`docs/cec/meta-fields-registry.md`](../../../docs/cec/meta-fields-registry.md) at the meta-repo root.
- Operator review feedback: `studio-inbox/feedback/0022-cec-meta-v2-initiatives.json`, `studio-inbox/feedback/0023-cec-meta-v2-batch-2.json`.

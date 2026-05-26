# ADR-006 — Component tier as a closed-enum axis

**Status:** Accepted (2026-05-06). Supersedes the loose `scale` field defined in ADR-005 §"Scale vocabulary". The closed enum lives in `src/meta/tiers.ts`, mirrored in `src/meta/schema.ts`, and enforced by `scripts/validate-meta.ts`.

## Context

ADR-005 introduced a `scale` discriminator on each component meta with four values: `brick | component | widget | layout`. In practice the value `component` became a catch-all — 27 of 72 metas (~38%) used it — because the line between "self-contained component" and "smaller brick" was fuzzy. The scale field also had no closed-enum runtime enforcement at the validator beyond Zod schema parsing.

Three problems compounded:

1. **Discriminator was not load-bearing.** The skill catalog rendered scale as a column but no code branched on it. Consumers, the demo, and the LLM-rendering surface (planned in ADR-007) all wanted a sharper `brick / widget / layout` separation than the four-value scale provided.
2. **Internal Vision §I1.** The 2026-05-05 strategy document recommended formalising a three-value tier as the foundation for a registry-based LLM tool surface. The third value (`component`) was diluting the signal.
3. **Generative-UI tooling consumes JSON Schema-shaped tool definitions.** An LLM picking from the catalog benefits from a *small*, semantically meaningful enum: pick a brick for atomic UI, a widget when behaviour is needed, a layout only when wrapping. Four values forced the LLM to disambiguate "component" vs "brick" at every call.

## Decision

The discovery axis is renamed and tightened:

- **Field rename**: `scale` → `tier`.
- **Closed enum**: `tier ∈ { "brick", "widget", "layout" }`. The previous value `component` is removed; affected metas are reclassified per the rule below.
- **Source of truth**: `src/meta/tiers.ts` exports `TIERS` (readonly tuple), `Tier` (literal-union type), and `isTier(s)` (predicate). The Zod schema imports `TIERS` so adding a tier requires editing exactly one file.
- **Validation**: `scripts/validate-meta.ts` rejects any meta whose `tier` is missing or not in `TIERS`. The check runs as part of `pnpm check`.
- **Classification rule** (the same rule used to migrate the 27 `component` entries):
  - **Has internal mutable state, runs interactive logic, or fetches data?** → `widget`
  - **Wraps multiple semantically structured children with named slots?** → `layout`
  - **Otherwise** → `brick`

### Migration outcome

After reclassifying the 27 `component` entries:

| Tier | Pre-migration | Post-migration | Net |
|---|---:|---:|---:|
| brick | 19 | 35 | +16 |
| component | 27 | — | −27 (removed) |
| widget | 18 | 27 | +9 |
| layout | 8 | 10 | +2 |
| **Total** | **72** | **72** | **0** |

### Why a field rename, not a new field

We considered three options:

- **A. New `tier` field, keep `scale`.** Two near-synonyms. Drift bait. **Reject.**
- **B. Tighten `scale` enum without rename.** Cheaper, but `scale` reads as "size of UI element" to an LLM; `tier` reads as "structural level". The LLM-facing registry is the load-bearing consumer. **Reject.**
- **C. Rename `scale` → `tier`, tighten enum.** One mechanical migration of 72 files. The skill CLI flag changes from `--scale` to `--tier` (internal tool, no public-API impact). **Pick.**

### Type-1 vs Type-2

Renaming a meta field is a Type-2 (reversible) decision: a single PR can swing it back. The blast radius is contained — schema, types, validator, generator, skill CLI, 72 meta files. There is no external consumer of `dist/meta/*.json` whose schema we need to preserve in this version, because the published 0.2.0 tarball still ships the old shape and consumers pinning to 0.2.x are unaffected. The next release will document the field rename in `RELEASE_NOTES.md`.

## Consequences

### Positive

- **Sharper discrimination** for catalog filters, LLM tool selection, and bundle-stats rollup.
- **One file** (`src/meta/tiers.ts`) governs the tier vocabulary; adding a new tier (e.g. `primitive` ahead of brick, or `template` between widget and layout) is one append + meta migration.
- **Foundation for ADR-007** (LLM registry). The registry projects `tier` directly into its component descriptors so a tool-using LLM can constrain its picks.
- **No 4th catch-all bucket.** Borderline cases get a deliberate brick/widget/layout decision per PR.

### Negative

- **One-time migration cost.** 72 meta files updated, the skill CLI flag renamed, the generated catalog table re-rendered.
- **Skill catalog header changes.** `Scale` column becomes `Tier`. Anyone reading the regenerated `skills/cec-consumer/references/catalog.md` should be aware.
- **No backward-compat shim.** A meta still using `"scale"` will fail validation; not preserving an alias keeps the schema honest at the cost of a hard cutover.

### Neutral

- The `scale` column in old generated catalogs (e.g. an out-of-date `skills/cec-consumer/references/index.md` snapshot) is the only place a stale name persists; `pnpm gen-skill` rewrites both files on the migration commit.

## Alternatives considered

- **Adding a fifth tier (`primitive` < `brick`).** Rejected: would re-create the same discrimination problem at the smallest end, and we don't have enough sub-brick components to warrant the split today.
- **Keep `scale` for back-compat, add `tier` as alias.** Rejected: dual-source-of-truth invites drift. The migration is mechanical enough.
- **Replace tier with a free-form string.** Rejected: closed enum is the entire point — see ADR-005's rationale for closed groups (also originally not closed; tightened in 2026-05-04 PR).

## Verification

`pnpm check` is green after migration. The bundle-stats per-tier rollup (planned, not yet implemented) will surface accidental regressions. The skill CLI now accepts `--tier brick` instead of `--scale brick`.

## Related

- ADR-005 (Component Meta JSON files) — superseded "Scale vocabulary" subsection.
- ADR-007 (Component Registry for LLM rendering) — depends on `tier` being a closed enum.

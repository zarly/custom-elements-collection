---
id: CDR-008
title: Additive changes only; deprecate via stability + ADR
status: accepted
date: 2026-05-18
compliance: SHOULD
tags: [versioning, migration, lifecycle]
relates_to: [ADR-006, ADR-009, src/meta/schema.ts]
---

# CDR-008 — Additive changes only; deprecate via stability + ADR

## Context

The library is consumed by two very different authors with very different memory lifetimes:

1. **Human contributors** — read the latest docs, adapt quickly to API changes, see deprecation notices in PR reviews.
2. **LLM authors** — emit markup based on training distributions that lag months or years behind. A renamed component, a removed attribute, or a flipped default silently breaks thousands of generated vis files and chat-streamed UIs that nobody is monitoring in real time.

Breaking changes silently break the LLM consumer in ways that are invisible until much later. Worse, the cost of recovery is asymmetric — the human contributor doesn't see the broken output until an end user complains, while the user has no way to fix the LLM prompt that triggered it.

[ADR-009](../adr/adr-009-llm-tolerant-components.md) commits to treating LLMs as the primary author and tolerating their omissions. This CDR is the migration-discipline corollary.

## Decision

- **Existing component public APIs may only be EXTENDED, never narrowed or removed**, without an explicit ADR. The forbidden operations on a shipped `meta.json`:
  - Removing an entry from `props[]`, `slots[]`, or `events[]`.
  - Renaming an entry (renames are deprecations + new entries, not in-place renames).
  - Narrowing a type union (e.g. removing a value from a string-literal enum).
  - Tightening a `required: false` to `required: true`.
  - Flipping a default in a way that changes observable output.

- **Deprecation path:**
  1. Set `stability: "deprecated"` in `meta.json` ([ADR-006](../adr/adr-006-component-tier.md) reserves this enum value).
  2. Prefix the meta `description` with `"**Deprecated** — use X instead. Will be removed in <release>."`
  3. Soft-keep for ≥ 1 quarter — the component continues to ship, its tests still run.
  4. Removal happens in a later release via a follow-up ADR that references this deprecation.

- **Renames are deprecations + new components.** The old name keeps shipping under deprecation; the new name ships independently. Eventually the old name is removed via ADR.

## Goal / Definition of success

- Zero in-place breaking changes between minor versions.
- Every deprecation has a clear migration recipe in `skills/cec-consumer/SKILL.md` and the component's meta description.
- Old LLM-emitted markup keeps rendering correctly for at least one quarter after a deprecation lands.

## When to apply

- Always — this is baseline migration discipline.
- Especially when audit feedback shows a previous design was wrong and we want to ship a new shape. Add the new shape; do not break the old one.

## When NOT to apply

- **Major version bumps** (ADR-gated) where breaking changes are explicit, batched, and announced. The library has not yet reached a major bump; when it does, the ADR sets the scope.
- **Pre-release `stability: "experimental"` components** — these signal "API may change". Breaking changes here are allowed without an ADR but must still bump the deprecation flag if the experimental component is being promoted to `stable`.

## Good examples

```diff
# Adding a new attribute alongside existing ones — fully additive
   props:
     - name: type
       type: VerdictType
+    - name: inline
+      type: boolean
+      default: false
```

```diff
# Deprecating a component — soft signal first
-  stability: stable
+  stability: deprecated
-  description: "Grid wrapper that arranges KPI tiles..."
+  description: "**Deprecated** — use `<ce-grid>` with `<ce-kpi>` children instead. Will be removed in next minor (see ADR-010)."
```

```html
<!-- Migration recipe in skills/cec-consumer/SKILL.md and meta description -->
<!-- Old (still works): -->
<ce-stat-group columns="3"><ce-kpi/><ce-kpi/></ce-stat-group>

<!-- New (preferred): -->
<ce-grid columns="3"><ce-kpi/><ce-kpi/></ce-grid>
```

## Bad examples (anti-patterns)

```diff
# In-place rename — breaks every LLM-emitted use immediately
-  tag: ce-progress
+  tag: ce-bar
```

```diff
# Removing an attribute — silently breaks markup that uses it
   props:
     - name: value
-    - name: max  # <-- markup using max="100" now ignored
```

```diff
# Narrowing an enum — silently breaks markup using removed value
-  type: "go" | "no-go" | "mixed" | "info"
+  type: "go" | "no-go"  # mixed and info silently fail
```

## Consequences

- ✅ No silent breakage; LLM-emitted markup keeps rendering.
- ✅ Training-distribution drift is bounded — the library converges, doesn't churn.
- ✅ Catalog grows over time (offset by deprecate-with-grace policy: deprecated components are clearly marked and eventually removed in batches via ADRs).
- ✅ Aligns with [ADR-006](../adr/adr-006-component-tier.md), which already reserved `stability: deprecated`.
- ⚠️ Catalog accumulates deprecated entries until the cleanup ADR; tooling must respect `stability` in queries.

## Validation

- **CI gate:** detect removal of `meta.json props[*]` between commits → require an ADR reference in the commit message.
- **Lint rule:** `meta.json` `stability` field is required (currently a Zod-required field per ADR-006; this CDR reaffirms).
- **Manual review checklist:** *"Does this change remove or rename anything that a previous version exposed? If so, where's the deprecation path?"*

## History

- 2026-05-18 — Accepted. Codifies what was already implicit in [ADR-006](../adr/adr-006-component-tier.md) (the `stability: deprecated` enum value exists but the migration discipline was unstated).

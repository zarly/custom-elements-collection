# `<ce-stat-group>` — design rationale

Per [ADR-008](../../../docs/adr/adr-008-component-concept-files.md).

## 2026-05-18 — Deprecated in favor of `<ce-grid>` + `<ce-kpi>` (CDR-006 + CDR-008)

### Context

Adoption audit on 2026-05-17 measured:

| Pattern | Corpus adopters |
|---|---|
| `<ce-stat-group>` | **0** |
| `<ce-grid columns="N"><ce-kpi …/></ce-grid>` | **28** |

Authors picked the generic grid every time. The specialized "stat group" wrapper offered no functional advantage and discouraged mixing in narrative HTML / callouts / non-KPI children.

### Options weighed

| Option | Pros | Cons |
|---|---|---|
| A — keep as-is | Backward-compat | 0 adopters; documentation overhead; LLM-prior split between two patterns |
| B — relax to accept any children and re-promote | Functional alignment with `<ce-grid>` | Now indistinguishable from `<ce-grid>` — pointless duplication |
| C — deprecate + remove next minor (**chosen**) | Catalog shrinks; one canonical pattern; aligns with CDR-006 | Short-term: deprecated entry visible in catalog for ≥ 1 quarter (CDR-008 soft-keep) |

### Decision

**Option C.** Set `stability: "deprecated"`, prefix description, soft-keep ≥ 1 quarter, then remove via follow-up ADR. Recipe in ADR-010 + migration section to land in `skill/SKILL.md` at removal time.

### Consequence

LLM-emitted markup that still uses `<ce-stat-group>` keeps rendering for ≥ 1 quarter (CDR-008 — no silent breakage). The deprecated-but-shipping window gives consumers time to migrate via simple s/ce-stat-group/ce-grid/g.

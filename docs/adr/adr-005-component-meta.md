# ADR-005 — Component Meta JSON Files

**Status:** Accepted (2026-04-29).

## Context

Components are self-implementing but not self-describing. Four problems compound as the library grows:

1. **Demo drift.** `demo/docs-data.js` is hand-maintained and lags behind component changes. Adding or removing a prop requires edits in two places with no enforcement linking them.

2. **Invisible API surface.** Consumers cannot introspect which CSS variables, events, or slots a component exposes without reading TypeScript source. There is no machine-readable inventory.

3. **No dependency graph.** Which components compose others? Which ones access `localStorage` or `fetch`? This information lives only in code comments, if at all.

4. **No validation gate.** Nothing prevents shipping a new component without documentation. No CI check fails if a component is undescribed.

The existing `src/manifest.ts` captures identity fields (tag, class, import path, description, category) but intentionally omits API details, CSS surface, side effects, and the dependency graph.

## Decision

Each component lives in its own subfolder alongside a `<name>.meta.json` file that is the **canonical, machine-readable specification** for that component. A Zod schema (`src/meta/schema.ts`) enforces the shape. A `scripts/validate-meta.ts` script runs in CI.

The meta file describes:

| Group | Fields |
|---|---|
| Identity | `tag`, `name`, `className` |
| Purpose | `goal` (SRP statement), `description`, optional `limitations` |
| Lifecycle | `stability`, optional `since`, `deprecatedIn`, `replacedBy` |
| Public API | `props[]`, `events[]`, optional `methods[]`, `slots[]` |
| Styling API | `cssVariables[]` (always declared; empty if none) |
| Environment | `globalDependencies[]`, `sideEffects[]` (always declared; empty if none) |
| Dependency graph | `dependents[]`, `dependencies[]`, `related[]` (all required; empty if none) |
| Discovery | `category`, `tier` (see ADR-006), `tags[]` |
| Accessibility | optional `a11y` object |
| Extension | optional `additional` record |

### Tier vocabulary (superseded — see ADR-006)

The original four-value `scale` enum (`brick | component | widget | layout`)
was superseded by the three-value `tier` enum (`brick | widget | layout`)
in ADR-006. The `component` catch-all bucket was removed; affected metas
were reclassified per the rule documented in ADR-006 §"Classification rule".

### Dependency graph rules

All three dependency arrays (`dependents`, `dependencies`, `related`) must be declared. Populate only when non-empty. Use tag strings (e.g. `"ce-card"`), not class names.

- `dependents` — tags that depend **on** this component (reverse lookup)
- `dependencies` — tags this component depends **on**
- `related` — conceptually related but neither parent nor child

### Export generation

Because meta files enumerate each component's tag and class, `scripts/generate-exports.ts` regenerates `src/index.ts`, `src/auto.ts`, and `src/entries/*.ts` from meta files. These generated files become build artifacts rather than hand-maintained sources.

### Demo integration

`demo/docs-data.js` is replaced by a Vite virtual module (or dynamic import of the generated manifest) that ingests all meta files at dev/build time. The demo renders component documentation purely from meta without knowing about any specific component.

### Publishing

The `category: "internal"` flag drives a publish-time filter: the `prepublishOnly` build step strips internal components from the distributed manifest. No separate package is needed in the short term. Conversion to a pnpm workspace monorepo is deferred until internal components grow beyond ~10 tags.

## Consequences

**Positive**

- Single source of truth: change the component, update the meta file, everything else regenerates.
- CI validation: a new component without a valid meta file fails `pnpm check`.
- Demo is self-describing with no hand maintenance.
- Consumers can inspect the published manifest to understand the full API surface without reading source.
- The dependency graph is explicit and auditable — critical for impact analysis when changing shared components.
- `stability` field lets consumers know which components are safe to depend on.

**Negative / trade-offs**

- Every new component requires authoring a meta file (intentional overhead — this is the point).
- One-time migration cost: move ~34 components from flat files into subfolders.
- Zod becomes a dev dependency; `tsx` is needed to run TS scripts in CI without a prior compile step.
- Generated files (`index.ts`, `auto.ts`, `entries/`) must not be edited by hand — a new convention requiring discipline.

## Related

- ADR-001 — Lit 3 choice (component structure this ADR relies on)
- ADR-004 — Distribution modes (meta-generated manifest feeds all three)

# ADR-001 — Framework choice: Lit 3

**Status:** Accepted

## Context

A component library targeting ~30 custom elements. The runtime must be small (<20 KB minified + gzipped) and must work when a single `.html` file inlines the bundle with no build step on the consumer side.

## Options considered

| Option | Runtime size | Ergonomics | Trade-off |
|--------|-------------:|-----------|-----------|
| Vanilla Custom Elements | 0 KB | Tedious — manual attribute reflection, no reactive templates | Verbose for 30+ components; easy to drift in consistency |
| **Lit 3** | ~6 KB | Reactive props, template literals, SSR-ready | Adds a runtime dep, but tiny |
| Preact + custom-elements adapter | ~8 KB | Familiar JSX | Extra adapter layer; less natural for CE |
| Stencil | ~10 KB | Compiler-based | Heavier toolchain, slower builds |

## Decision

**Lit 3.x.** The ~6 KB cost buys cleaner authoring, reactive updates, and an ecosystem of tested patterns (slot helpers, directives). A component can still be hand-written as a vanilla custom element when it needs zero runtime (e.g. pure-CSS wrappers) by extending `HTMLElement` directly instead of `LitElement`.

## Consequences

- The package bundles Lit's runtime once.
- Components can mix: Lit-based for anything with state/reactivity; vanilla CE for pure-wrapper tags.
- Tree-shaking works: Lit is side-effect free; unused directives are pruned.

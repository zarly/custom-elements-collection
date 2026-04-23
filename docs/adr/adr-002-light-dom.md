# ADR-002 — Light DOM by default; Shadow DOM opt-in

**Status:** Accepted

## Context

Web Components offer two rendering modes: Light DOM (regular tree) and Shadow DOM (encapsulated tree).

Shadow DOM gives style isolation but creates friction:

- Mermaid, Chart.js, and syntax-highlighters expect global document scope — they fail inside shadow roots.
- Markdown-rendered content placed in slots still needs parent CSS.
- CSS variables pierce shadow boundaries, but full stylesheets don't.
- Debugging is harder (devtools must drill into each shadow root).

Most real-world visualisation files that this library targets embed Mermaid, Chart.js, or arbitrary markdown. Shadow DOM would break them.

## Decision

**Light DOM is the default** for all `ce-*` and `lesson-*` components. A component may opt into Shadow DOM only when style-isolation is explicitly needed (e.g. a widget that ships its own font, or one that must be bulletproof against host CSS resets) — and it must document why in a comment at the top of the component file.

## Consequences

- Design-token CSS applies through the entire tree via the standard cascade.
- Component styles use scoped class selectors inside the component's element to avoid specificity wars.
- Consumers can still override any style via `--ce-*` custom properties.
- Smaller bundle — no shadowRoot allocation per element.

## Implementation

`CecElement` (the Lit base class at `src/core/base.ts`) overrides `createRenderRoot()` to return `this`, making Light DOM the Lit default. Components that want Shadow DOM override `createRenderRoot()` and call the base-class helper `createShadowRootWithStyles()`, which attaches a shadow root AND adopts `static styles`.

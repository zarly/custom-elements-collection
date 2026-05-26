# ADR-014 — Streaming lifecycle: every component conforms to SC-1 / SC-2

**Status:** Accepted (2026-05-22).
**Relates to:** [ADR-002](adr-002-light-dom.md) (Light DOM), [ADR-009](adr-009-llm-tolerant-components.md) (LLM-tolerant components), [CDR-005](../cdr/cdr-005-collections-json-and-slot.md) (collections JSON-and-slot), `generative-dom/ARCHITECTURE.md` §"Streamability Contract".

## Context

CEC was built to be consumed primarily by **Generative DOM**, which receives LLM output chunk-by-chunk and incrementally renders it into a live DOM. Custom elements are upgraded the moment their opening tag is emitted — attributes and children arrive in subsequent chunks. A component that reads `this.children` once in `connectedCallback` sees nothing, caches the empty state, and never recovers when the rest of the stream arrives.

Generative DOM publishes the **Streamability Contract** (`generative-dom/ARCHITECTURE.md:318-329`) as its end of the deal:

- **SC-1** — chunk-boundary invariance: any byte-splitting of the input followed by a single final `flush()` produces the same DOM as a batch `push(S); flush()`.
- **SC-2** — mid-stream render invariance: same as SC-1, plus the scheduler may render between every chunk (`isFinal=false`) without diverging from the batch DOM.

Generative DOM's own plugins ship a fixture harness at `packages/tests/src/streaming/streamability.ts` and a per-plugin parity matrix at `parity.test.ts`. Until this ADR, CEC had **no equivalent** — `CLAUDE.md` L87 mentioned "Light components must keep slot streaming working; don't read children only in `connectedCallback`" as one line of prose with no fixture and no gate. The 2026-05-22 pre-mortem identified hardening this single rule as the highest-leverage move available to the operator.

The 2026-05-22 operator framing makes the cross-repo contract explicit: **CEC was built for Generative DOM**. The two repos are loosely coupled at code level — CEC has no runtime dependency on Generative DOM packages — but the *contract* runs from CEC to Generative DOM: CEC promises conformance, Generative DOM can request additions.

## Decision

Every component in `src/components/**` and `src/lesson/**` MUST conform to **SC-1 and SC-2** as defined in `generative-dom/ARCHITECTURE.md`. Conformance is checked by an automated parity fixture; passing the fixture is part of `pnpm check`.

### Required component behaviours

1. **Safe upgrade with zero attributes and zero children.** The first render after `customElements.define(…)` resolves MUST NOT throw, MUST NOT call `JSON.parse` on `undefined`, and MUST produce a coherent placeholder/empty state (per [ADR-009](adr-009-llm-tolerant-components.md)'s tolerance contract — render something useful, never error chrome).

2. **Idempotent re-render on every observed attribute change.** Components MUST declare every reactive attribute via Lit's `@property({ reflect, type })` or `static observedAttributes` + `attributeChangedCallback`. Setting the same attribute twice produces the same DOM. Setting a new value triggers a re-render. **No "first-attribute snapshot" caching.**

3. **No children-snapshot in `connectedCallback`.** Components MUST NOT cache `this.children`, `this.querySelectorAll(…)`, or `this.innerHTML` once in `connectedCallback` and reuse the cache. For collection components (per [CDR-005](../cdr/cdr-005-collections-json-and-slot.md)) that consume slotted children, observe them via one of:
   - Lit's `<slot>` element + `slotchange` event (preferred; native, zero-cost when nothing changes),
   - a `MutationObserver` on the light-DOM subtree (`childList: true, subtree: false`),
   - Re-querying on every `attributeChangedCallback` (acceptable for small N).

4. **No `document.*` / `window.*` / `navigator.*` access at module top level.** Component modules MUST be importable in Node.js (jsdom-free) without side effects. Browser-only APIs are accessed inside `connectedCallback`, `render()`, or event handlers — never at module load.

5. **Tolerant attribute parsing.** A JSON-attribute (`data='[{…'`) that arrives mid-stream and fails `JSON.parse` MUST be caught (per [ADR-013](adr-013-safety-contract.md)). The component renders the empty state, sets `data-ce-error="json-parse"`, and waits for the next `attributeChangedCallback`.

6. **No render-time observers that mutate the DOM.** `ResizeObserver` and `IntersectionObserver` are allowed for *measurement* (writing to component state, scheduling a re-render via `requestUpdate()`), but MUST NOT directly mutate the rendered tree — that path is the classic mid-stream-divergence trap.

### Forbidden patterns (lint-enforced)

- `private _children = this.children` (or any `Array.from(this.children)` snapshot) stored on the instance.
- Reading `this.querySelector` / `this.querySelectorAll` *only* in `connectedCallback`.
- `if (this._connected) return;` early-exits in `attributeChangedCallback`.
- `MutationObserver` on the host's own attribute changes (use `attributeChangedCallback`; the platform already gives you the signal).
- Module-top-level `const css = document.createElement('style')` or any `document` / `window` access.

### The fixture harness

`tests/streaming/streamability.test.ts` (new) imports the reusable harness from `@generative-dom/mocks` (the `mocks` workspace package, exported for cross-repo consumption) and runs:

For every component with `tier ∈ {brick, widget}` AND `category ∈ {ui, lesson}`:
1. Read the **first `<!-- @example … -->` block** from `<stem>.examples.html`.
2. Run the **batch baseline**: parse-and-mount the block at once, snapshot the resulting subtree's `innerHTML` (normalised: sorted attributes, stripped whitespace runs, deterministic IDs per [CDR-009](../cdr/cdr-009-deterministic-dom.md)).
3. Run the **chunk-split scenario**: split the same block at every byte boundary, push chunk-by-chunk, snapshot after the final `flush()`. Assert byte-for-byte equality with the batch snapshot — that is SC-1.
4. Run the **mid-stream-render scenario**: same as #3 but the scheduler renders between every chunk; the test asserts the *final* DOM matches the baseline (intermediate states need only be valid, not equal) — that is SC-2.

Components that legitimately cannot satisfy SC-1/SC-2 (e.g. a future component intrinsically tied to non-streaming input — none today) MUST declare `meta.streaming: false` and the harness skips them; declaring `streaming: false` requires an ADR override.

### Per-tier obligations

- **`tier: brick`** — SC-1/SC-2 mandatory.
- **`tier: widget`** — SC-1/SC-2 mandatory.
- **`tier: layout`** — SC-1/SC-2 mandatory. Layouts that wrap children are *especially* prone to children-snapshot bugs.

### Validation

- **`pnpm lint:streaming`** runs the AST + regex pattern bank for the forbidden patterns listed above. Exits 0 = no offending pattern detected.
- **`pnpm test`** picks up `tests/streaming/streamability.test.ts` automatically.
- **`pnpm check`** chains both, blocking the PR on failure.
- **Pre-release gate** (`docs/protocols/pre-release.md`) adds: every component's first `examples.html` block passes SC-1/SC-2 against the published `@generative-dom/mocks` package — no skips outside the declared `streaming: false` list.

### Cross-repo direction

Per operator (2026-05-22):

- **References go from CEC to Generative DOM, not the reverse.** This ADR cites `generative-dom/ARCHITECTURE.md` and `@generative-dom/mocks`. Generative DOM's `package.json` does not depend on CEC, and Generative DOM's source MUST NOT reference CEC components by name.
- **Generative DOM may request additions** to this contract — new fixture vectors, tighter SC-3/SC-4 invariants, performance budgets — by filing them as a PR against this ADR. Operator reviews. Once accepted, the additions land in this ADR and a follow-up ADR if the change is large enough to warrant one.

## Consequences

**Positive.**
- The CLAUDE.md prose rule becomes an executable contract. Components that pass tests in jsdom (where attributes and children exist at construction time) but break in chat (where tags upgrade before children arrive) are no longer possible.
- The benchmark grader ([CDR-009](../cdr/cdr-009-deterministic-dom.md)) gains a stable observation surface — chunk-boundary noise can no longer flake a score.
- Disarms sabotage move #1 from the 2026-05-22 pre-mortem (`querySelector` cached in `connectedCallback`) by mechanical enforcement.
- The cross-repo contract is now executable on the CEC side, not assumed.

**Negative.**
- One-time migration: every existing component with a `connectedCallback` snapshot pattern needs a refactor. The 2026-05-22 pre-mortem named `ce-rating`, `ce-checklist`, `ce-flow`, `ce-bar-chart`, `ce-tabs`, `ce-decision-tree` as plausible candidates — actual sweep done as part of enforcing this ADR.
- Harness setup imports `@generative-dom/mocks` as a workspace package. Adds a dev-dependency to CEC's package.json, but no runtime coupling.

**Mitigations.**
- Migration sweep before flipping the streamability fixture from `--report-only` to a `pnpm check` blocker.
- For each migrated component, append a dated entry to its `CONCEPT.md` (or create one per [ADR-008](adr-008-component-concept-files.md)) explaining the streaming-conformance fix — prevents the next agent from undoing it.

## Related

- [ADR-002](adr-002-light-dom.md) — Light DOM. Slot streaming is the streaming model; Shadow DOM `<slot>` re-renders work the same way under SC-2.
- [ADR-005](adr-005-component-meta.md) — Component meta. `meta.streaming: false` is the (rare) override flag.
- [ADR-009](adr-009-llm-tolerant-components.md) — Tolerance. Mid-stream "missing data" is the canonical case ADR-009 protects against; this ADR enforces "missing for now, not missing forever".
- [ADR-013](adr-013-safety-contract.md) — Safety. `try/catch` around `JSON.parse` is required by both ADRs; this one adds the mid-stream re-render requirement on top.
- [CDR-005](../cdr/cdr-005-collections-json-and-slot.md) — Collections JSON-and-slot. Slot mode is the primary streaming path; this ADR makes it observe child mutations.
- [CDR-009](../cdr/cdr-009-deterministic-dom.md) — Deterministic DOM. Without determinism, SC-1/SC-2 cannot be byte-compared.
- `generative-dom/ARCHITECTURE.md:318-329` — the contract this ADR commits to upholding.
- `generative-dom/packages/tests/src/streaming/streamability.ts` — the reusable harness CEC imports.
- `vis/cec-rules-audit-2026-05-22.html` — the audit that triggered this ADR.

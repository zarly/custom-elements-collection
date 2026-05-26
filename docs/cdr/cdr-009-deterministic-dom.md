---
id: CDR-009
title: Deterministic DOM for static-tier components
status: accepted
date: 2026-05-22
compliance: SHOULD
tags: [api-design, benchmark, determinism]
relates_to: [ADR-014, CDR-004, llm-benchmark]
---

# CDR-009 — Deterministic DOM for static-tier components

## Context

The `llm-benchmark` workspace (with its companion `llm-dataset-builder`) scores LLM-emitted CEC markup by diffing the rendered DOM against a golden snapshot. The score depends on *byte-for-byte equality* across runs — anything that drifts between runs (random IDs, `Date.now()` in render output, animation classes that persist in `innerHTML`, resize-observer-derived layout) flakes the score and forces every axis to be marked "uncertain". The 2026-05-22 pre-mortem identified flaky benchmark scoring as the proximate cause of Stage B stalling.

[ADR-014](../adr/adr-014-streaming-lifecycle.md) requires SC-1 (chunk-boundary invariance) — but SC-1 is only checkable when two renders of the same input produce the same DOM. **Determinism is the foundation under SC-1**, not a consequence of it.

[CDR-004](cdr-004-static-first-stateful-optin.md) already mandates that static-tier components render meaningfully on page load with zero JavaScript state. This CDR adds the next obligation: the static render must also be **reproducible**.

## Decision

Components with **`tier ∈ {brick, widget}` AND `meta.interactive: false`** (or no `interactive` flag, which defaults to `false`) MUST produce **byte-identical `innerHTML`** for byte-identical input across runs in the same process.

### Forbidden in the render output

In a static-tier component's first render (immediately after upgrade with all expected attributes set), the following MUST NOT appear in the resulting DOM:

- **Time-based values** — `Date.now()`, `performance.now()`, `new Date().toISOString()`, animation timestamps reified into class names (`fade-in-1685420988`).
- **Random values** — `Math.random()`, `crypto.randomUUID()`, `crypto.getRandomValues()` results reified into DOM.
- **Process-unique counters that vary across runs** — `++globalCounter` is fine **only if** the counter resets on module load AND iteration is deterministic; otherwise switch to a render-order counter scoped to the component instance.
- **Resize-observer-derived attribute values** — measuring `clientWidth` in render output (writing `data-width="248"`) varies with the test environment. Measure for *behaviour* (CSS, scheduling), never as committed DOM.
- **Layout-dependent computed values** in attributes (e.g. `font-size` calculated from `offsetWidth`) — same trap.

### Required mechanisms

- **Aria-labelledby / aria-describedby IDs** derive from one of:
  - A consumer-supplied `id` attribute on the host;
  - A monotonically increasing per-instance counter incremented inside the component (resets per process; fine for SC-1 since the same input produces the same counter sequence);
  - A stable hash of the input (`label` attribute, slot content) — only if the input itself is deterministic.
- **Animations** — declare in CSS (`@keyframes`), bind by class name. Never bake the start/end frame timestamp into the DOM.
- **Attribute serialisation** — when the component sets multiple attributes on its children, set them in a documented order (alphabetical, or the order they appear in the component's `static observedAttributes`). The streamability harness ([ADR-014](../adr/adr-014-streaming-lifecycle.md)) normalises attribute order for comparison — but components that *generate* DOM (e.g. `ce-bar-chart` emitting bar rows) should themselves produce stable order.

### Escape hatch

Some components legitimately need non-deterministic surface (a `ce-clock` showing wall time; a `ce-random` brick for design demos). For each such case, mark the offending line with:

```ts
// cec-allow-nondeterministic: <reason>
const now = Date.now();
```

The lint rule respects the comment and emits a structured pass. Components with `meta.interactive: true` are exempt from this CDR by default — interactivity (`ce-input`, `ce-confirm`) is inherently stateful and not benchmark-fixtured.

## Goal / Definition of success

- Every brick / widget with `interactive: false` renders to identical `innerHTML` on every run in the same process for the same input.
- The streamability harness ([ADR-014](../adr/adr-014-streaming-lifecycle.md)) passes without "normalisation flake" — i.e. the components stabilise *before* the harness normalises, not because the harness normalises.
- The `llm-benchmark` corpus generator (in `llm-dataset-builder`) produces stable golden snapshots without per-run masking.

## When to apply

- Every static-tier component (brick or widget with `interactive: false`).
- Every component whose first `examples.html` block is the static case (per [CDR-004](cdr-004-static-first-stateful-optin.md)).

## When NOT to apply

- Components that are interactive by definition (`ce-input`, `ce-textarea`, `ce-confirm`, `ce-comment`, form-associated controls) — their state evolves on user interaction; the *initial* render should still be deterministic, but subsequent renders are not subject to this CDR.
- Components whose entire purpose is to surface non-deterministic data (`ce-clock`, `ce-countdown`, `ce-now`). They mark the source with `// cec-allow-nondeterministic` and document the exception in `CONCEPT.md`.

## Good examples

```ts
// ✅ Per-instance counter, resets per process; stable across runs of the same input
let _idSeq = 0;
class CeFoo extends CecElement {
  private _instanceId = ++_idSeq;
  override render() {
    return html`<input id="ce-foo-${this._instanceId}" aria-labelledby="ce-foo-${this._instanceId}-label">`;
  }
}

// ✅ Stable hash of input
override render() {
  const id = `ce-${this.tag}-${hash(this.label)}`;
  return html`…`;
}

// ✅ Consumer-supplied id, fall back to counter
private _resolveId() {
  return this.id || `ce-foo-${++_idSeq}`;
}
```

## Bad examples (anti-patterns)

```ts
// ❌ Math.random() in render output
override render() {
  const id = `ce-foo-${Math.randomString(8)}`;
  return html`<input id="${id}">`;
}

// ❌ Date.now() reified into DOM
override render() {
  return html`<div data-rendered-at="${Date.now()}">…</div>`;
}

// ❌ ResizeObserver writing back to DOM
this._ro = new ResizeObserver((entries) => {
  this.setAttribute('data-width', String(entries[0].contentRect.width));
});

// ❌ Animation timestamp baked into class name
override render() {
  return html`<div class="fade-in-${Date.now()}">…</div>`;
}
```

## Consequences

- ✅ Benchmark scoring becomes stable across runs — direct support for goal 2 (LLM benchmark).
- ✅ SC-1 byte-comparison ([ADR-014](../adr/adr-014-streaming-lifecycle.md)) becomes meaningful — without determinism, SC-1 would compare nondeterministic output to nondeterministic output and pass everything.
- ✅ Easier debugging: a failing snapshot is always a real diff, never a flake.
- ⚠️ Requires per-instance counter discipline for ID generation — minor authoring overhead.
- ⚠️ Escape hatch (`cec-allow-nondeterministic`) becomes the place to document legitimate exceptions; PR reviewers MUST sanity-check each one (a sloppy exception silently breaks benchmark scoring).

## Validation

- **Lint candidate:** `scripts/lint-determinism.ts` — AST scan for `Math.random`, `Date.now`, `performance.now`, `crypto.randomUUID`, `new Date().toISOString` inside component source. Respects `cec-allow-nondeterministic: <reason>` directive immediately preceding the line.
- **Snapshot test:** `tests/determinism/determinism.test.ts` — for every `interactive: false` brick/widget, render the first `examples.html` block twice in the same process and assert byte-equal `innerHTML`. Fails on flake.
- **Benchmark integration:** the `llm-dataset-builder` corpus generator (sibling repo) consumes the same snapshot harness; a failing CDR-009 test surfaces as a corpus-generation error.

## History

- 2026-05-22 — Accepted. Triggered by the 2026-05-22 rules-corpus audit (`vis/cec-rules-audit-2026-05-22.html`), pre-mortem failure #2 (benchmark stalled on flake), and the operator's confirmation that `llm-benchmark` + `llm-dataset-builder` are actively building the observation surface.

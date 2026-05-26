---
id: CDR-011
title: LLM failure-mode tolerance catalogue
status: accepted
date: 2026-05-22
compliance: SHOULD
tags: [api-design, tolerance, robustness]
relates_to: [ADR-009, ADR-013, ADR-014]
---

# CDR-011 — LLM failure-mode tolerance catalogue

## Context

[ADR-009](../adr/adr-009-llm-tolerant-components.md) commits CEC to "components are tools, not products" — components MUST render something useful even when the LLM author omits, mistypes, or repurposes attributes. The ADR sets the **philosophy**; it does not enumerate the concrete LLM failure modes a component must handle. The 2026-05-22 audit (`vis/cec-rules-audit-2026-05-22.html`) flagged the gap: without a closed list of failure modes and per-mode tests, every contributor re-derives the tolerance contract from first principles, and components silently disagree on which failures degrade gracefully.

The six failure modes below cover every shape of LLM-emitted-markup brokenness observed in the corpus to date (chat replay logs, the `llm-benchmark` dataset draft, the studio inbox). Each is paired with a documented degrade path; tests under `tests/llm-failure-modes/` lock the behaviour in.

## Decision

For every brick / widget where `category ∈ {ui, lesson}`, the component MUST handle the six failure modes below with the documented degrade path. The handling MUST be exercised by a per-mode test fixture.

### FM-1 — Hallucinated attribute name

**Symptom.** `<ce-card glow="true" tilt="3" sparkle>` — attributes that aren't in the component's meta.

**Degrade path.** Custom-element attribute setters only fire for declared attributes; unknown attributes land on the DOM but never reach component state. **No error, no warning, no console output** (per [ADR-009](../adr/adr-009-llm-tolerant-components.md) §4 and [ADR-013](../adr/adr-013-safety-contract.md) console policy). The unknown attribute remains visible in the DOM and is accessible to consumer-side debugging via DevTools — that is the diagnostic channel, not the console.

**Test fixture.** Mount with three random extra attributes; assert no thrown error, no logged output, and that the component's declared attributes still drive the rendered DOM.

### FM-2 — `JSON.parse` failure on a JSON-on-attribute prop

**Symptom.** `<ce-bar-chart data='[{"label":"A"'>` — truncated mid-stream OR `<ce-bar-chart data="not json at all">` — wrong shape entirely.

**Degrade path.** The component MUST wrap `JSON.parse` in `try/catch` (per [ADR-013](../adr/adr-013-safety-contract.md)). On failure:
1. Render the **empty state** (the same render the component shows when the prop is absent — e.g. the centered "No data" message for charts, an empty UL for lists).
2. Set `data-ce-error="json-parse"` on the host element so consumer CSS can target it for diagnostic styling (`[data-ce-error] { outline: 1px dashed var(--ce-color-amber); }`).
3. **Do not throw.** Do not log. Do not retain the broken string for re-display.

When the next `attributeChangedCallback` arrives with a valid JSON, the component re-renders normally and removes the `data-ce-error` attribute.

**Test fixture.** Three cases: (a) truncated JSON; (b) JSON of the wrong shape (object instead of array); (c) the literal string `"undefined"`. All three must render the empty state and set `data-ce-error="json-parse"`.

### FM-3 — Mis-cased tag name in MDX / SVG / XML contexts

**Symptom.** `<CE-Card>` or `<Ce-Card>` inside MDX or an XML-mode parser. HTML normalises tag names to lowercase, but XML-mode contexts do not — the component registry sees a tag it doesn't recognise.

**Degrade path.** This is an *author* error that CEC cannot recover from at runtime — the browser doesn't upgrade a tag whose name doesn't match what was registered. The corpus addresses it at three earlier layers:

- **Documentation** — every `examples.html` block uses canonical lowercase. The LLM author's training-distribution prior is lowercase. The registry (`dist/registry*.json`) exposes tag names in lowercase.
- **Linter** — `scripts/lint-tag-case.ts` (new, optional for v1) scans `.mdx` and `.html` files in consumer repos for mis-cased CEC tags. Ships as an opt-in lint, not a CEC requirement.
- **Generative DOM** — its custom-elements plugin normalises tag names per the standard HTML parser. Mis-cased tags inside markdown are caught upstream.

**Test fixture.** Documentation-only — `docs/llm-failure-modes/FM-3.md` walks the author through where mis-casing breaks and the three mitigation layers.

### FM-4 — Stream-truncated content

**Symptom.** The opening `<ce-bar-chart>` arrives, `attributeChangedCallback` fires with partial `data='[{"label"…'`, the closing `>` arrives later, slot children arrive even later.

**Degrade path.** Already required by [ADR-014](../adr/adr-014-streaming-lifecycle.md) — components MUST re-render on every `attributeChangedCallback`, MUST NOT snapshot children in `connectedCallback`, MUST tolerate `JSON.parse` failures (FM-2 above). This CDR ensures FM-4 has an explicit test fixture even though the mechanism is mandated elsewhere.

**Test fixture.** Use `@generative-dom/mocks`'s `StreamSimulator` to inject the first `examples.html` block byte-by-byte; assert no error, monotonically converging DOM, and final DOM equals batch baseline.

### FM-5 — Numeric edge cases in `values=[…]` and other numeric props

**Symptom.** `<ce-donut values="[NaN, Infinity, -5, 1e308]">` — the LLM emitted a numeric array that includes values the component's geometry cannot handle.

**Degrade path.** Components consuming numeric arrays MUST normalise per documented rule:

| Input | Treatment |
|---|---|
| `NaN`, `null`, `undefined` (after JSON parse) | Skip the item (collection drops it) OR treat as 0 (cumulative bars / progress) — documented per component. |
| `±Infinity` | Skip the item. |
| Negative value where the component models a magnitude (donut slices, progress bars, gauge value) | Clamp to 0. Document this explicitly in the meta description. |
| Value greater than `max` (bar charts, gauges) | Clamp to `max` for rendering; preserve the raw value for tooltips / aria-label. |
| Overflow (`1e308`, beyond Number.MAX_SAFE_INTEGER for integer props) | Treat as if the value at the boundary; the cap is visible in the displayed maximum. |

The treatment MUST be tested. The displayed result MUST NOT be `NaN%` or `-5px` or `Infinity` rendered as text.

**Test fixture.** For every component consuming a numeric array: a test pushing `[NaN, Infinity, -5, 0, 1e10]` and asserting no `NaN` / `Infinity` text appears in the rendered DOM.

### FM-6 — Cross-language content / multibyte width

**Symptom.** A `ce-bar-row` with `label="日本語のラベル"` or `label="русский текст"` — width-sensitive layouts that assumed ASCII-width metrics show truncated labels, misaligned bars, or layout shift.

**Degrade path.** Components measuring text width MUST NOT assume Latin / monospace metrics. Acceptable approaches:

- **Use the DOM's own layout** — render the text into a hidden mirror element, read `getBoundingClientRect()`, use the measured width. Catches CJK, RTL, ligatures, kerning.
- **Use `canvas.measureText()`** with the component's actual computed `font-family` and `font-size` — works for offline measurement.
- **Use `em`-based or `ch`-based units** in CSS — never `px` for text-driven dimensions. The browser handles the script.

**Forbidden:** `label.length * 7` (counting characters), assuming 1 char = 1 em, using `String.prototype.length` for width estimates.

RTL: bidirectional text (Arabic, Hebrew, mixed Latin + RTL) is rendered correctly by the browser when the host document declares `dir="rtl"` or `dir="auto"`. Components MUST NOT override `direction` in their styles; bidi is a host-level concern. The 2026-05-22 operator deferred full RTL scope; this CDR keeps the door open by mandating that components don't *block* RTL.

**Test fixture.** For every component with width-sensitive layout (`ce-bar-row`, `ce-sparkline` labels, `ce-key-value` keys): three labels (`"Latin"`, `"日本語"`, `"العربية"`) — assert no layout error, no truncation visible at default font size.

### `meta.failureModes[]` and registry projection

Each component's `meta.json` MAY declare a `failureModes` array listing which FM-* numbers are covered:

```json
{
  "tag": "ce-bar-chart",
  "failureModes": ["FM-1", "FM-2", "FM-4", "FM-5", "FM-6"]
}
```

The registry generator ([ADR-007](../adr/adr-007-component-registry.md)) projects this list into `dist/registry.json`, so consumers (and the `llm-benchmark` grader) can advertise / score per-mode tolerance. `FM-3` is documentation-only and not declared per-component.

The field is opt-in for v1 — declaring `failureModes: ["FM-2"]` is the minimum useful claim. Full coverage is a follow-up sweep.

## Goal / Definition of success

- Six failure-mode test fixtures exist under `tests/llm-failure-modes/` and run on `pnpm test`.
- Every brick / widget with `category ∈ {ui, lesson}` either passes the applicable subset, OR declares which FM-* it does not handle.
- `dist/registry.json` exposes `failureModes[]` per component for downstream consumers.

## When to apply

- Authoring a new component (CDR pre-flight checklist in `docs/protocols/new-component.md`).
- Reviewing a PR that adds a new JSON-on-attribute prop, a numeric array prop, or a width-sensitive layout.

## When NOT to apply

- Pure layout primitives (`ce-grid`, `ce-section`) — no JSON-on-attribute, no numeric arrays, no width-sensitive measurement. Layout primitives are exempt from FM-1..FM-6 by virtue of not having the surfaces those modes target.

## Consequences

- ✅ Concrete, testable contract for the abstract "LLM tolerance" stance in ADR-009.
- ✅ Every component has a documented degrade path; agents reviewing PRs have a checklist instead of intuition.
- ✅ The benchmark (`llm-benchmark`) can score per-FM tolerance directly from the registry — no per-component judge work to enumerate the cases.
- ⚠️ Six fixture files per applicable component is authoring overhead. Mitigation: most fixtures are 5-10 lines and can be generated from `examples.html` plus a transform.
- ⚠️ `meta.failureModes[]` introduces a new optional field — additive ([CDR-008](cdr-008-additive-changes-only.md) compatible).

## Validation

- **Test harness:** `tests/llm-failure-modes/fm-{1..6}.test.ts` — each iterates applicable components and asserts the documented degrade path.
- **Lint candidate:** `rule_failure_modes_declared` — warns when a component meta omits `failureModes[]` and the component has at least one JSON-on-attribute prop or numeric-array prop.
- **Pre-release gate:** `docs/protocols/pre-release.md` adds: every brick/widget passes the FM tests it claims OR omits `failureModes[]` (claims-and-tests parity).

## History

- 2026-05-22 — Accepted. Triggered by the 2026-05-22 rules-corpus audit (`vis/cec-rules-audit-2026-05-22.html`). The six FM-* numbers crystallise observed failure shapes from chat replay logs and the early `llm-benchmark` dataset.

# ADR-013 — Safety contract: CEC upholds Generative DOM's XSS guarantees

**Status:** Accepted (2026-05-22).
**Relates to:** [ADR-002](adr-002-light-dom.md) (Light DOM), [ADR-009](adr-009-llm-tolerant-components.md) (LLM-tolerant components), `generative-dom/SECURITY.md`.

## Context

CEC is **consumed primarily by Generative DOM**, which renders untrusted LLM-emitted markdown into a live DOM. Its `SECURITY.md` makes a hard contract with consumers — no `innerHTML`, no `eval`, link `href` whitelisted to `https | http | mailto`, image `src` whitelisted to `https | http`, no `on*` attributes ever written, no `style` containing `url()` / `expression()`. The 2026-05-22 operator decision confirms studio (the HITL workbench) embeds CEC **same-origin** — there is no iframe sandbox to fall back on. **XSS protection is absolute.**

Two forces compound the risk:

1. **CEC's catalog is the trusted surface** an LLM author emits markup against. If even one `ce-*` component reaches `el.innerHTML = userText` (or any equivalent), the host application's whole XSS posture silently downgrades. Generative DOM's allowlist was built around the assumption that custom elements respect the same guarantees.
2. **Until this ADR**, no rule in CEC's corpus forbade the dangerous surface. `CLAUDE.md` mentions "Use slots, not inner HTML" as a workflow tip — non-normative, no lint, no fixture.

The 2026-05-22 audit (`vis/cec-rules-audit-2026-05-22.html`) ranked this as the highest-leverage blocking gap; the pre-mortem listed `JSON.parse + .innerHTML = …` as a sabotage move the current corpus does not forbid.

## Decision

CEC commits to upholding every guarantee in `generative-dom/SECURITY.md` from the *component side*. The following surface is **forbidden in every `src/components/**/*.ts` and `src/lesson/**/*.ts` file** unless an explicit ADR override is granted:

### Forbidden DOM mutations

- `Element.innerHTML = …` (read is fine; write is not)
- `Element.outerHTML = …`
- `Element.insertAdjacentHTML(…)`
- `document.write(…)` / `document.writeln(…)`
- `Range.createContextualFragment(…)` on user-controlled strings
- Lit's `unsafeHTML` directive (`lit/directives/unsafe-html.js`)
- Lit's `unsafeSVG` directive
- Lit's `unsafeStatic` directive
- Lit's `unsafeMathML` directive
- Setting `Element.srcdoc` (iframe content)

### Forbidden code execution

- `eval(…)`
- `new Function(…)`
- `setTimeout(stringArg, …)` / `setInterval(stringArg, …)` (function args are fine)
- `Worker` from a Blob URL whose contents are user-supplied
- Dynamic `import(userControlledSpecifier)`

### Forbidden attribute writes

- Setting `on*` attributes via `setAttribute('on…', …)` or via Lit's `?on…=` (Lit's native event bindings via `@event` are fine — they compile to `addEventListener`, never to an `on*` attribute on the DOM).
- Setting `href`, `src`, `xlink:href`, `formaction`, `action`, `ping` to any string whose URL scheme is not in the allowlist below.
- Setting `style.cssText = userText`. Per-property `style.color = userText` is also forbidden when the value contains `url(…)`, `expression(…)`, or `javascript:`.

### URL scheme allowlist

| Attribute | Allowed schemes |
|---|---|
| `href` (anchors, area) | `https:`, `http:`, `mailto:`, `tel:`, `#` (hash-only) |
| `src` (img, iframe — though iframes shouldn't appear), `poster` | `https:`, `http:`, `data:image/*` (PNG/JPEG/GIF/WebP/SVG with no embedded script — see §"Trusted SVG") |
| `srcset` | Same as `src`, with the standard srcset syntax |
| `formaction`, `action`, `ping` | Discouraged; if used, `https:` only |

Relative URLs (`./foo`, `/bar`) are resolved against the host document and treated as `http:`-equivalent for allowlist purposes.

### Required mechanisms

- **All textual user input enters the DOM via `textContent`, `createTextNode`, or Lit's auto-escaped tagged templates** (`html\`<div>${userText}</div>\``). Never via string concatenation into an HTML template literal.
- **Component source MUST NOT emit `console.log` / `console.warn` / `console.error` / `console.info` / `console.debug` at runtime** (`ADR-009 §4` makes this normative; this ADR adds the lint hook). One narrow exception: a top-level `console.error` inside a `try/catch` for *unrecoverable* internal invariants (e.g. failed `JSON.parse` of a hand-coded fixture). This exception is rare and reviewed PR-by-PR.
- **`JSON.parse` of any user-controlled attribute MUST be wrapped in `try/catch`.** On failure: render the empty state, set `data-ce-error="json-parse"` on the host element, and exit. Never throw, never re-render the raw string.
- **Components MUST NOT add or remove `<script>` / `<link rel="import">` / `<style>` elements** to the host document at runtime. CSS is shipped via `static styles` (Shadow DOM) or `--ce-*` tokens; no inline injection.

### Trusted SVG

Inline SVG inside component templates is allowed when the markup is **authored by the component**, contains no `<script>` / `<foreignObject>` / `<a href="javascript:">`, and binds attributes via Lit's auto-escaped templates. SVG from user-supplied strings is forbidden — pass it through `textContent` and let the consumer decide.

### What is NOT forbidden

- **Reading user input** — `el.innerHTML` as a *getter*, `el.value`, attribute reads.
- **Setting safe DOM properties** — `textContent`, `value` (form control), `checked`, `disabled`, `class`, `id`, `data-*`, `aria-*`, layout dimensions (`width`, `height`, integer), tabindex.
- **CSS via Lit `static styles`** — first-class.
- **`addEventListener` / Lit `@event`** — first-class.
- **`new URL(userControlledString)`** for *parsing/validation* — encouraged as the canonical allowlist check.

## Console policy

`ADR-009 §4` already says components must not punish the LLM author with `console.warn` for absence of optional data. This ADR makes that enforceable: **no `console.*` calls in component source.** Justification:

- Studio is same-origin (operator confirmed 2026-05-22). Component warnings flood the studio inbox.
- Operators silence noisy channels, then miss the one real error.
- Sabotage move #5 from the audit's Munger inversion (`console.warn` flood on optional fields) is disarmed by mechanical enforcement, not by prose discipline.

## Validation

- **Lint rule:** `scripts/lint-safety.ts` (new), invoked by `pnpm check`. Pattern bank covers every forbidden mutation, code-execution sink, and the `on*`/`style.cssText` write traps. Implemented as TS AST + regex hybrid (regex catches the trivial cases; AST catches member-expression assignments).
- **Smoke fixture:** `tests/safety/safety.test.ts` imports every component, mounts it with the published `xss-vectors` set from `@generative-dom/mocks`, and asserts (a) no `<script>` ever lands in the DOM, (b) no `on*` attribute ever lands, (c) every `href`/`src` has an allowlisted scheme.
- **Pre-release gate:** `docs/protocols/pre-release.md` adds `pnpm lint:safety` exits 0.
- **Escape hatch:** `// cec-allow-unsafe: <ADR-NNN> — <reason>` immediately preceding the forbidden line. The lint rule respects the comment and emits a structured warning. No PR ships with `cec-allow-unsafe` without an accompanying ADR.

## Cross-repo direction

Per the operator's 2026-05-22 framing, the integration is one-way at the file level: **CEC depends on (references) Generative DOM's `SECURITY.md`; Generative DOM does not depend on CEC.** Generative DOM is free to propose tightening — additional forbidden patterns, narrower scheme allowlists, new fixture vectors — via a feature request reviewed by the operator. Until accepted into this ADR, those proposals are non-binding on CEC.

## Consequences

**Positive.**
- A single non-compliant component can no longer silently downgrade the stack's XSS guarantee.
- Lint catches the failure at PR time, not at incident time.
- The allowlist is short, closed, and matches the Generative DOM contract verbatim — no policy drift across the repo boundary.
- Disarms sabotage moves #4 (`JSON.parse + innerHTML`) and #5 (`console.*` flood) from the 2026-05-22 pre-mortem.

**Negative.**
- Edge cases (`data:` URLs, inline SVG) need careful per-case decisions — the lint rule WILL false-positive occasionally, the escape hatch handles those at the cost of one ADR reference per case.
- One-time migration cost: any existing component that uses a forbidden API needs a refactor before this ADR can be enforced in CI. Migration sweep before flipping the gate to mandatory.

**Mitigations.**
- Migration sweep before flipping `pnpm lint:safety` to `pnpm check` blocker. Document each pre-existing exception either with a refactor PR or a `cec-allow-unsafe` ADR.
- The lint rule ships with a `--report-only` mode for the first two minor releases; flip to blocker once the corpus is clean.

## Related

- [ADR-002](adr-002-light-dom.md) — Light DOM default. Cascade-flowing styles are first-class; `style.cssText = userText` is the dangerous shortcut.
- [ADR-009](adr-009-llm-tolerant-components.md) — Tolerance philosophy. This ADR is the *safety floor* under that tolerance: tolerant of *valid* inputs we did not predict, never tolerant of unsafe execution paths.
- `generative-dom/SECURITY.md` — the canonical contract this ADR commits CEC to upholding.
- `vis/cec-rules-audit-2026-05-22.html` — the audit that triggered this ADR.

# ADR-009 — Components are tools, not products: tolerant inputs and user-defined use

**Status:** Accepted (2026-05-07).

## Context

The primary author of markup that uses this library is not a human contributor — it's a large language model. LLMs render `<ce-*>` and `<lesson-*>` tags inside lesson plans, dashboards, opinion pieces, marketing pages, and chat-streamed UIs. They make API choices we did not anticipate, omit fields we considered required, repurpose props for unexpected uses, and combine components in shapes we never tested.

This is not a quality problem to fix. It is the operating reality of the consumer.

Three forces follow from that:

1. **Strict APIs punish the user, not the author.** When a component refuses to render or shows visible-error chrome because the LLM omitted a field, the punishment falls on the *end user* who has no way to fix the prompt. The LLM moves on. The user is left looking at a broken widget. This is the wrong target.

2. **"Wrong input" is often a valid use we did not predict.** A `lesson-quickfire` round without a `correct` field looks like a missing required value. It is also exactly what a poll, an opinion ice-breaker, or a "what's your favorite color?" game looks like. The same data shape, two completely different meanings — and only one of them is an error. Strict validation cannot tell them apart; the LLM author can.

3. **Every prop is a place to drift.** More attributes, more required fields, more enum values, more `mode` flags — each one multiplies the surface where an LLM can omit, mistype, or misuse. Adding a `strict` boolean to recover from a tolerance regression *adds* surface; it does not subtract risk.

The signal that prompted this ADR: a single bug in `lesson-quickfire` — every pick flashed red because the example HTML omitted `correct` — surfaced as a UX failure, then a design question (should we require `correct`?), then a philosophy question (what is the relationship between this library and the LLMs that render it?). The answer to the last question shapes API decisions across every component, not just the one with the bug. It deserves a written, citable home.

## Decision

The library treats components as **tools**, not products. The library author defines what a component *can* do. The LLM author — and through them, the end user — defines what it *is for* in a given placement. We bias toward flexibility, tolerance, and minimum surface; we accept that this means occasionally meeting an input we did not plan for.

This decision governs API design — what to expose, what to require, what to default, what to refuse. It does not loosen framework invariants (tag prefixes, design tokens, slot-only-no-script), which are bright lines and have their own ADRs.

### The rules

#### 1. Bias toward optional. Bias toward shape variety.

A field is required only when its absence makes the component **literally meaningless** — a `ce-bar-chart` with no `rows` cannot draw a chart. A `lesson-quickfire` round with no `correct` *can* still run; it is a poll. When in doubt, `optional`.

When the same logical value can sensibly arrive in multiple shapes, accept multiple shapes. `correct?: string | string[]` costs almost nothing in the implementation (one normalization helper) and unlocks "any of several valid answers" without a new prop. Coerce primitives via `String(x)` at match time so a JSON-encoded number `4` matches an option `"4"`.

#### 2. Read intent from data; don't add `mode` props.

When a component supports more than one use, prefer to *infer* the mode from the data shape. `lesson-quickfire` has three modes — scored, open, mixed — none declared. Each round's `correct` field declares the round's nature; the component reads it and behaves accordingly. We did not add `mode="quiz" | "poll" | "mixed"`.

A `mode` flag is appealing because it feels explicit. It is also one more place for the LLM to disagree with itself — picking `mode="quiz"` while writing a round without `correct`, or `mode="poll"` while writing a round with one. Inferring from data eliminates the disagreement by construction.

#### 3. Visible feedback must distinguish "user error" from "author omission."

When the LLM author omits an optional field, the end user must not be told they did something wrong. This is the most concrete form of the tolerance principle. In practice:

- Don't show red flashes, error icons, or "missing field" warnings at user-time.
- Don't refuse to render. The component renders something useful, even if reduced.
- Visual feedback for absence-of-data should be **neutral**, not negative. (Reference: `lesson-quickfire`'s `flash-neutral` — a subtle blue border, no fill, no chrome.)

#### 4. Don't punish the LLM author either.

No `console.warn` for absence of optional data. Warnings are for genuinely malformed input where the operator has something to fix. Firing a warning on intentional, well-formed input trains people to ignore the warning channel — which is worse than silence.

The right place to teach the contract is the meta description (read by the registry, the skill catalog, downstream code-generators) and the `examples.html` (read by humans and LLMs). Documentation, not validation.

#### 5. Minimum surface. Every new prop, event, or method must justify itself.

Default to "no" on new API surface. The questions to ask before adding any:

- Can this be expressed as data shape variation on an existing prop instead of a new prop? (Often yes.)
- Can this be inferred from data the component already receives?
- Will the LLM author predictably know when to use this?
- Is there a real consumer waiting for it, or is it speculative?

Three new props is three new places to mistype, three new defaults to remember, three new combinations that interact unexpectedly. Two paragraphs of meta description is none of those.

#### 6. Examples are the de-facto contract.

LLM code-generators consume `dist/registry*.json` and per-component `examples.html`. They will reproduce whatever shape they see. A missing field in an example becomes a missing field in 100 generated outputs. Keep examples maximal:

- Every required-for-meaning field present.
- Every shape variant demonstrated when reasonable (e.g. `correct: string`, `correct: string[]`, `correct` omitted — three blocks).
- No `<script>` tags, JSON-on-attribute for structural data (per `CONTRIBUTING.md` §4 step 7).

A bug in an example is a bug in the API.

#### 7. Cross-cutting integration belongs to a host, not to every component.

Concerns that touch *all* interactive components — answer collection, persistence to local storage, branching lesson flow, analytics — should be handled by a single host element / harness, not by adding hooks to every interactive widget. The `lesson-quickfire` component does not own answer storage; it dispatches `lesson-quickfire-done` and stops. A future cross-component collector reads the DOM, finds interactive children, and gathers their state in one place. This keeps the per-component surface flat.

### What this is NOT

- **Not a license to accept anything.** Components must keep a coherent identity. A `ce-bar-chart` cannot render as a pie chart because someone forgot `rows`. The contract is *tolerant within the component's job*, not *anything goes*. Refuse only when the input makes the component meaningless, not when it merely surprises us.
- **Not a relaxation of framework invariants.** Tag prefixes (`ce-*` / `lesson-*`), design tokens (no inline hex), light-DOM default (ADR-002), slot-only-no-script (CONTRIBUTING §4 step 7) — these are bright lines for the framework, not knobs the LLM author negotiates. Tolerance applies to *application-level* API choices, not to the rules that keep the library shippable.
- **Not "skip validation."** Where validation makes the component safer (Zod-validated meta files, JSON parse errors caught by `jsonProp`), keep it. The rule is: validate at the boundaries the framework owns; don't validate intent at the application boundary.
- **Not "every prop is optional."** Required fields exist where the component is genuinely meaningless without them. Apply pressure to *each* required field — most can be defaulted or inferred — but some genuinely can't, and forcing them to be optional makes the component worse.

## Reference implementations

- **`src/lesson/lesson-quickfire/`** ([CONCEPT.md](../../src/lesson/lesson-quickfire/CONCEPT.md)) — `correct?: string | string[]`, three modes inferred from data (scored / open / mixed), neutral flash for unscored rounds, `score / scoredTotal` honest accounting, no per-pick event, no `mode` flag, no warnings. Written 2026-05-07 alongside this ADR.
- **`src/components/gauge/`** ([CONCEPT.md](../../src/components/gauge/CONCEPT.md)) — D4 (semantic colors author-chosen, not auto-derived) and D3 (native `<title>` instead of a custom popover) are both applications of *minimum surface* and *user-defined use*: the brick exposes the levers, the consumer wires up the meaning.

## Implications for future component work

This ADR is meant to be consulted **at design time**, not at implementation time. Concretely, before:

- Adding a new prop, event, method, or slot to an existing component.
- Marking a field as `required: true` in a meta file.
- Splitting one component into two (or merging two into one).
- Adding runtime validation, error states, or warning chrome.
- Adding a `mode` / `variant` / `strict` flag.

…ask the rules above. If the answer is "we're adding surface to handle a case the data could already declare," prefer the data-shape approach. If the answer is "this is genuinely a new behavior the LLM author needs to opt into," then add it — but justify it in the component's `CONCEPT.md` per [ADR-008](adr-008-component-concept-files.md).

## Consequences

**Positive.**
- LLM-rendered widgets degrade gracefully when prompts are imperfect — the end user sees a working component, not an error.
- API surface stays small. Fewer props means fewer LLM mistakes per use.
- Components support uses we did not predict — a good outcome, not a problem.
- Per-component decisions are easier: when a feature request lands, "can this be expressed in existing data shape?" is a fast filter.

**Negative.**
- Tolerance is more design work than rejection. Choosing what "graceful" looks like for each missing-field case takes thought; it isn't free.
- A reader new to the codebase may mistake "few required fields" for "underspecified API." Mitigation: meta descriptions and `CONCEPT.md` files carry the *why*; the registry and examples carry the *what good looks like*.
- We will occasionally meet input we genuinely cannot render gracefully. Then we render an inline error and stop — but that is a last resort, not a default.

**Mitigations.**
- The component's `CONCEPT.md` (per [ADR-008](adr-008-component-concept-files.md)) is the place to record *why* a particular field is required, *why* a particular mode wasn't added, *why* a particular event wasn't exposed. This ADR sets the lens; `CONCEPT.md` records the per-component application.
- The reference implementations above set the bar for what tolerant API design looks like. New components should match that bar.

## Related

- [ADR-002](adr-002-light-dom.md) — Light DOM default; framework invariant, not negotiable.
- [ADR-005](adr-005-component-meta.md) — Meta files are the canonical API spec; the meta description is where the contract is taught to LLM authors.
- [ADR-006](adr-006-component-tier.md) — Tier informs what surface is appropriate (a `brick` should expose less than a `widget`).
- [ADR-007](adr-007-component-registry.md) — The registry is the LLM-facing projection of the meta; tolerance shows up here as accepting `correct?: string | string[]` rather than rejecting non-strings.
- [ADR-008](adr-008-component-concept-files.md) — `CONCEPT.md` is the place to record per-component decisions made under this lens.
- `CONTRIBUTING.md` §4 — links to this ADR from the "Adding a new component" flow.

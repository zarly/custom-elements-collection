# `lesson-quickfire` — design concept and rationale

> Captures the *why* behind decisions in this folder. Not generated, not bundled, not part of the public API. Read before reopening a settled debate. Update when you make a new non-trivial design choice. See [ADR-008](../../../docs/adr/adr-008-component-concept-files.md) for the convention and [ADR-009](../../../docs/adr/adr-009-llm-tolerant-components.md) for the tolerance philosophy this component embodies.

**Last substantive update:** 2026-05-07.

---

## What this component is for

A **rapid sequence of clickable choices** with a per-round timer and an optional final score. The component is deliberately under-specified about *what kind of sequence* it is — it can be a quiz, a poll, an opinion ice-breaker, or any mix of the three. The data shape declares the intent; the component reads it and behaves accordingly.

Sibling shapes intentionally split off:
- `lesson-quiz` — single question with explanation. Different mental model: one question, one teaching moment.
- (no sibling for poll-only) — see D6 for why we did not split a `<lesson-poll>` off.

Things this component is deliberately *not*:
- A form-input widget. Picks are emitted via the `lesson-quickfire-done` event; there's no `<input>` semantics, no `name` attribute, no `FormData` participation.
- A general-purpose answer-collector. Cross-component answer collection (label-as-key registry, "copy all answers" button) is a separate, larger design — see *Open questions*.

---

## Decisions

### D1 — Why is `correct` optional, and why does it accept `string | string[]`?

**Question.** A quiz round has one right answer. Why not require `correct: string`?

**Options considered.**
1. `correct: string` (required). Simple, classical quiz contract. Matches the original implementation.
2. `correct?: string` (optional, single answer). Tolerates LLM omission; rounds without it become unscored.
3. `correct?: string | string[]` (optional, multi-answer). Above, plus rounds with several valid answers ("name a primary color" → `["Red", "Blue", "Yellow"]`).

**Chose 3.** Driven by [ADR-009](../../../docs/adr/adr-009-llm-tolerant-components.md): components are tools for LLM authors, not strict forms. An LLM may legitimately want to ask *"what's your favorite color?"* (no right answer), or *"name a primary color"* (any of several). Both are valid uses of "rapid sequence of clickable choices." Refusing them — or treating omitted `correct` as a bug to flag red — would punish the user for the author's intent.

Number / Date / other primitives are coerced via `String(x)` at match time, so a JSON-encoded `correct: 4` matches an option `"4"`. No new prop, no `mode` flag — the input shape *is* the mode.

**Bound.** If `options` is empty or `prompt` is missing, the round is genuinely meaningless and the component just renders an empty round (timer counts down, advance). We don't try to repair structurally broken data — just shape mismatches that have a sensible meaning.

---

### D2 — Why doesn't a missing `correct` produce a red "wrong" flash?

**Question.** Today the `#pick` handler colored the selected button red whenever it didn't match `round.correct`. With `correct` optional, what happens on click?

**Options considered.**
1. Red flash anyway (status quo before this change). The user is told they're wrong even when there *was* no right answer to get.
2. No flash at all — just freeze buttons for the 600ms delay, then advance. Cleanest, but the user gets no feedback that their click registered.
3. Neutral flash — a third state (`flash-neutral`) that's visually distinct from green/red. Selected button gets a subtle blue border-color change; no fill, no text-color flip.

**Chose 3.** The component must visually separate two semantically different events: *"you got it wrong"* (red) and *"there was nothing to get; we recorded your pick"* (neutral). Without the separation, the UX punishes the user for the author's choice.

**Implementation.** One CSS rule: `.qf-btn.flash-neutral { border-color: var(--ce-color-blue); }`. No background change, no chrome, no badges. The visual language teaches the user implicitly: green/red means "there was a right answer." Subtle blue means "we recorded your pick."

---

### D3 — Why is the final score `score / scoredTotal` instead of `score / rounds.length`?

**Question.** If three rounds were posed but only two had `correct`, what does the final screen show?

**Options considered.**
1. `score / rounds.length` (e.g. `2 / 3`). Honest about how many rounds were *played*, but misleading about scoring — implies the user got 1 wrong when they actually engaged with a poll round.
2. `score / scoredTotal` (e.g. `2 / 2`). Honest about scoring; the denominator is "rounds that had a key." Loses the round-count signal at the end.
3. Show both (e.g. `2 / 2 scored · 3 rounds played`). Most informative. Adds chrome.

**Chose 2.** The denominator is what the user is being graded against. Scoring a poll round as a miss is dishonest; counting it as a hit would inflate. Excluding it is the only correct accounting. If `scoredTotal === 0`, we show "Done!" instead of `0 / 0` — there's no score to report.

**Consequence on the event payload.** The `lesson-quickfire-done` detail keeps its existing `{ score, total }` shape, but `total` now means `scoredTotal` (documented in the meta). Did not add a third field — every new field is a new place for LLM-rendered consumers to drift.

---

### D4 — Why no per-pick event, no `silent` attribute, no answer-capture hook?

**Question.** A host page might want to react to each pick (analytics, branching lessons, store answers). Why not emit `lesson-quickfire-pick` per round, or expose a `silent` attribute that suppresses the final screen?

**Options considered.**
1. Add `lesson-quickfire-pick` event with `{ round, choice, scored }`. Gives hosts live access to picks.
2. Add `silent` / `auto-advance` attribute to suppress the final screen for hosts that consume picks programmatically.
3. Add nothing here — let the cross-component answer-collection story (registry, label-as-key, global "copy answers" button) handle this in one place across `lesson-quickfire`, `lesson-quiz`, `ce-input`, `ce-textarea`, `ce-checkbox-group`, etc.

**Chose 3.** [ADR-009](../../../docs/adr/adr-009-llm-tolerant-components.md) §"Minimum surface" — every prop / event / method we add is one more thing an LLM can omit, mistype, or use wrong. The cross-component story is a separate, larger design where answer collection lives in *one* host element (or harness), not in every interactive widget. Adding a per-pick event here would either duplicate or pre-empt that design.

**Reopen this if** a real consumer needs per-pick reactivity *before* the cross-component story ships, AND no general-purpose mechanism (e.g. `MutationObserver`-based capture from a host) covers their case.

---

### D5 — Why no `console.warn` when `correct` is missing?

**Question.** Earlier drafts of this design proposed a dev-time warning when the component encountered a malformed round. Why drop it?

**Why.** Missing `correct` is **not** malformed in this design — it's a valid signal that the round is open / poll / opinion. A warning would fire on intentional, well-formed input. False positives in dev tooling are worse than no tooling: they train the operator to ignore the warning channel entirely.

**Where the contract is taught.** The `rounds` prop description in `lesson-quickfire.meta.json` states plainly that `correct` is optional and what omitting it means. That description is what LLM-facing tools (the registry, the skill catalog) read. Documentation, not validation.

---

### D6 — Why no separate `<lesson-poll>` component for the no-`correct` case?

**Question.** Having two components — `<lesson-quickfire>` for scored rounds, `<lesson-poll>` for opinion rounds — would let each have a tighter API.

**Options considered.**
1. Split into two tags. Each tag has a narrower, stricter contract.
2. One tag, two modes inferred from data. Mixed rounds (some scored, some not) work in a single component.

**Chose 2.** Splitting would force LLM authors to pick the right tag for each use; in practice they'll often want a *mixed* sequence (a few scored questions plus a poll question to gauge interest). Two tags can't express that without a wrapper. One tag with three behaviors (all-scored, all-open, mixed) inferred from data covers all three uses with the same API.

**Bound.** If we ever want a *visually different* poll layout — bigger text, no timer, multi-select — we'd build `<lesson-poll>` as a sibling, not as a flag on this component.

---

## Edge cases (covered by tests)

| Case | Behavior | Test |
|---|---|---|
| `correct` is undefined | Round excluded from score; pick flashes neutral; advances after 600ms | `excludes rounds without correct from scoring and shows neutral flash` |
| All rounds have no `correct` | Final screen shows "Done!" instead of `0 / 0`; in-progress header hides "Score N" | `shows 'Done!' instead of a score when all rounds are unscored` |
| `correct: ["A", "B"]` | Either match counts; both flash green | `accepts correct as an array — any match counts` |
| `correct: 4` (number) | Coerced via `String()`; matches option `"4"` | `coerces non-string correct values to string for matching` |
| Mixed rounds (some scored, some not) | Final shows `score / scoredTotal`; in-progress header still shows "Score N" because `scoredTotal > 0` | implicit (covered by the "excludes" test which has 1 scored + 1 unscored) |
| Timer expires before pick | `#advance()` called; round counts as a non-pick (no score change either way) | `advances rounds when the timer expires` (existing) |
| Empty `rounds` array | Component immediately enters done state | implicit (covered by `#startRound()` zero-length guard) |
| Malformed JSON in `rounds` attribute | Falls back to empty array + console.warn (via `jsonProp`) | `falls back + warns when the rounds attribute is malformed JSON` (existing) |

---

## Closed bug history

Lessons worth preserving from past mistakes — keep so we don't repeat them.

- **2026-05-07 — Examples HTML omitted `correct` field, every pick flashed red.** The `lesson-quickfire.examples.html` file shipped with two rounds, neither carrying a `correct` field. The component checked `opt === round.correct` against `undefined`, so every pick flashed red and the final score read `0 / 2`. To a user (and a reviewing LLM author) the component looked broken. **Lesson:** *examples are the de-facto contract.* LLM-facing tools (the registry, the skill catalog, downstream code-generators) read examples as canonical reference. A missing field in an example becomes a missing field in 100 generated outputs. Keep examples maximal: every required-for-meaning field present, every shape variant demonstrated. This bug also seeded ADR-009 — the right *fix* was to make the missing field a valid signal (poll mode), not just to repair the example, because the underlying brittleness was real.

---

## Open questions / deferred

- **Cross-component answer collection.** A host element / harness that walks the DOM, finds interactive children (`lesson-quickfire`, `lesson-quiz`, `ce-input`, `ce-textarea`, `ce-checkbox-group`, …), reads their state, and emits / persists / copies them. Should *not* require any prop on the children. Likely uses the `prompt` text or a `label` attribute as the implicit key. Reopen when the second consumer asks for it — until then, single hosts can listen to `lesson-quickfire-done` directly.
- **Multi-select within a round.** Currently first click ends the round. A *"select all that apply"* round would need new semantics (commit button, multiple `correct` matches required). Don't speculate — wait for a real lesson author to ask.
- **Custom completion content via slot.** A consumer might want to replace the "Try again" button with a "Next lesson" link, or insert a confetti animation. Could expose a `slot="done"` for that. Not added because Shadow DOM + slots requires careful planning; revisit only when a host has tried and failed with an event-based handoff.
- **`silent` / `auto-advance` attribute.** Skip the final summary so hosts that consume `lesson-quickfire-done` programmatically can flow into the next slide. Held off — same reasoning as D4: minimum surface until proven necessary.

---

## Related

- [ADR-002](../../../docs/adr/adr-002-light-dom.md) — this component uses Shadow DOM (it has no slots, only attribute API; styles benefit from isolation)
- [ADR-005](../../../docs/adr/adr-005-component-meta.md) — meta-as-canonical-spec; `meta.json` describes `correct?` and the shifted `total` semantic
- [ADR-008](../../../docs/adr/adr-008-component-concept-files.md) — the convention this file participates in
- [ADR-009](../../../docs/adr/adr-009-llm-tolerant-components.md) — the tolerance philosophy this component is the reference implementation for
- Sibling components: `lesson-quiz` (single-question with explanation), `lesson-frame` (lesson container)

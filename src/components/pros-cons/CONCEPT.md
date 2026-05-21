# ce-pros-cons — design rationale

## 2026-05-20 — initial design

### Deviation: CDR-005 — slot mode via two named slots, not a default slot

The validator's `rule_slot_alongside_json` looks for a default slot alongside JSON array props. ce-pros-cons exposes two named slots (`pros`, `cons`) instead.

**Why it's correct here:** the component carries *two* parallel collections, not one. A single default slot would force the author to disambiguate items themselves (`data-side="pro"` markers on every `<li>`). The named-slot pair is the same shape `ce-tool-call` uses for `args`/`result`/`error` — multiple parallel collections each get their own slot. Slot mode is genuinely available; the validator's heuristic just doesn't recognise the two-named-slot variant.

This satisfies the spirit of CDR-005: handwritten authors can use the slot mode (`<li slot="pros">…</li>`), and generators can use the JSON arrays. Mixing modes works (JSON pros + slotted cons, or vice versa).

### Why bake-in green/red accents

Considered three options:

1. **Strict neutral colouring** — no semantic colour, just two columns. Defers all branding to the document, but loses the at-a-glance scan that "pros = good = green, cons = risk = red" gives readers.
2. **Configurable accents** — `pros-color="green"` `cons-color="red"` attributes. Adds two attributes for what 99% of consumers want, and contradicts CDR-003 (presentation policy is global).
3. **Fixed semantic accents tied to tokens (chosen)** — green for pros, red for cons. Themes that want to recolour can do so via `--ce-color-green` / `--ce-color-red` overrides on the parent.

Option 3 keeps the API tiny and the document-level theme override path open.

### Why default headers are localisable via attribute, not slot

`pros-label` / `cons-label` attributes accept short strings. A slot would invite rich content inside what is structurally a section header and complicate the visual hierarchy. Two strings cover ~all use cases (Pros/Cons, Benefits/Risks, Wins/Losses, Plusy/Minusy, ✓/✗). When a user genuinely needs rich content, the column body slot accepts arbitrary markup.

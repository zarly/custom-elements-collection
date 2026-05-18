# `<ce-verdict>` — design rationale

Per [ADR-008](../../../docs/adr/adr-008-component-concept-files.md). Captures non-trivial decisions where ≥ 2 options were weighed, so future contributors don't silently re-litigate them.

## 2026-05-18 — Vocabulary lives in the slot, not in the enum (CDR-001)

### Context

`ce-verdict` started with the canonical four types `go | no-go | mixed | info`. Real corpus usage surfaced ten more words: `pursue`, `reject`, `investigate`, `ship`, `hold`, `ok`, `fail`, `escalate`, `block`, `launch`. Plan v2 proposed encoding those ten as **aliases** in the `type` enum.

### Options weighed

| Option | API shape | Pros | Cons |
|---|---|---|---|
| A — extend enum with aliases | `type="pursue" \| "reject" \| ...` (11+ values) | LLM picks one word, gets the style | Enum grows forever; every new team's vocabulary needs a release; LLM-prior thrash; i18n explodes |
| B — keep finite enum, push label to slot (**chosen**) | `type="go"` + `<ce-verdict>SHIP IT</ce-verdict>` | Unbounded vocabulary with no library churn; native i18n (slot is locale-aware); HTML reads as HTML | Slightly more characters per usage; needs empty-slot fallback (added) |
| C — drop the enum entirely | `<ce-verdict color="green">SHIP IT</ce-verdict>` | Maximum freedom | Loses semantic typing (ARIA defaults, default icons); shifts the burden to every author |

### Decision

**Option B.** The enum drives style and the canonical ARIA/icon defaults; the default slot carries the human-facing label. Empty slot falls back to the canonical label (`"Go"`, `"No-go"`, `"Mixed"`, `"Info"`).

Why this is the right call: vocabulary is genuinely unbounded — we cannot enumerate it — but the **styling** is finite (success/failure/caution/neutral). Coupling vocabulary to style was the mistake. CDR-001 formalises the split.

### Consequence

The 7 alias proposal in plan v2 is rejected. R6 in `cec-validation-rules.md` (which would have pushed the enum toward ≥ 5 values) is inverted by CDR-001.

---

## 2026-05-18 — `inline` as per-instance attribute, with `--ce-verdict-layout` document knob (CDR-003 tradeoff)

### Context

Verdict has two natural shapes: a **banner** (icon + title + detail block, used at section headers and decision summaries) and a **pill** (compact, used inside paragraphs / lists / tables). We needed to pick how authors switch between them.

### Options weighed

| Option | API shape | Pros | Cons |
|---|---|---|---|
| A — per-instance boolean attribute | `<ce-verdict inline>` | Per-data — narrative verdict in a `<p>` wants pill while a section-header wants banner. Discoverable. | Five verdicts on the same page each get the same opt-in; document-level designers can't flip globally |
| B — CSS custom property only | `:root { --ce-verdict-layout: inline }` | Document-wide knob; matches CDR-003 verbatim | Authors lose the per-instance affordance; every "this one's a pill, others are banners" case forces a CSS override |
| C — both, with attribute as override (**chosen**) | `inline` attr + `--ce-verdict-layout` CSS var consulted via `@container style()` | Document policy AND per-instance escape hatch. CDR-003 calls this exact shape acceptable: *"per-instance boolean used only when a choice is genuinely per-data"* — and verdict layout is | Slight implementation cost (CSS duplication across `:host([inline])` and `@container style(--ce-verdict-layout: inline)` branches) |

### Decision

**Option C.** The `inline` attribute is the primary user-facing control. `--ce-verdict-layout: auto | banner | inline` (declared on `:root` or any ancestor) provides the document-wide override, read via `@container style()` in the component stylesheet. Per-instance `[inline]` still wins.

This is a deliberate, justified deviation from a strict reading of CDR-003 (which would push toward "CSS var only"). The deviation is allowed because `inline` is genuinely per-data: the same page often mixes both shapes.

### Consequence

Two CSS branches duplicate the pill rules. Acceptable cost. If a third presentation policy on verdict surfaces, revisit and consider extracting a shared CSS mixin or moving to a pure `--ce-verdict-layout` enum with no per-instance attr.

---

## 2026-05-18 — `title` and `detail` attributes preserved (CDR-008 additive contract)

Both attributes pre-date CDR-002 (which would push value-content into slots). They keep working — Lit renders them as default-slot fallbacks. Removing them would silently break LLM-emitted markup in the field. New code should prefer slots; existing markup keeps rendering.

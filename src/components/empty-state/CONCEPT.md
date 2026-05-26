# CONCEPT — ce-empty-state

Created: 2026-05-23

## Decision 1: merged `ce-result` into `ce-empty-state` (2026-05-23)

**Context.** The first cut of the generic-primitives proposal shipped two centred-panel components: `ce-empty-state` ("nothing here yet") and `ce-result` ("an action just completed"). The self-audit flagged them as render-identical — both are a centred column with icon + title + body + actions slot. The only meaningful differences were:

- `ce-result` had a `severity` enum and tinted the panel per severity.
- `ce-result` had a `details` slot wrapped in `<details>`.
- The two components carried different copy intent (absence vs completion).

The intent distinction lives in the consumer's copy, not in the shape. Two tags for one shape is catalog bloat.

**Options weighed:**

A. **Keep both tags.** Two mental models, two pieces of API surface to discover. Honest separation of intent.
B. **Merge into `ce-empty-state`.** One tag. Add `severity` (with default `"none"` = current empty-state look) and `details` slot.
C. **Rename to `ce-state-panel`** when merging — clearer semantics for the dual purpose.

**Chosen: B — merge, keep the name.**

Rationale for keeping the name:
- All consumers are still `experimental`; rename is cheap but adds registry/skill/manifest churn.
- The default `severity="none"` keeps the empty-state look. Users who only use the empty-state case see no API change.
- "Empty state with severity=success" reads slightly oddly but renders correctly. Documented in the meta description.

## Decision 2: severity-tinted icon strips the badge chrome

When `severity="none"` (default), the icon renders inside a circular badge with surface/border styling — the original empty-state look. When `severity` is one of the four tinted values, the badge background and border are removed and the glyph is rendered larger (2.5rem) in the severity color — matching the former ce-result look.

This is implemented via `:host([severity="…"]) .ce-empty-state__icon-badge` overrides. The single render path covers both modes without conditionals.

## Decision 3: auto-icon derivation

When `severity` is set and `icon` is unset, the component derives a default icon glyph from severity (success→`check-circle`, error→`x-circle`, info→`info`, warning→`alert-triangle`). Matches former ce-result behavior.

The user can always override by setting the `icon` attribute explicitly.

Note: the auto-derived icon is a text glyph, not a real icon. ce-icon does not ship an icon set (per ADR-007). Consumers wanting SVG icons should use the `illustration` slot or replace the icon attribute with their own glyph/emoji.

## Decision 4: `<details>` slot is always present

The native `<details>` element is rendered in the shadow tree unconditionally, but `:has(::slotted(*))` hides it when the slot is empty. This keeps the render path branch-free; the consumer slots `<pre slot="details">…</pre>` only when they have something to show.

Pro: no conditional render branch.
Con: an extra empty `<details>` lives in the shadow tree on every instance. Negligible.

---

## Migration from `ce-result`

| Old | New |
|---|---|
| `<ce-result severity="success">…</ce-result>` | `<ce-empty-state severity="success">…</ce-empty-state>` |
| `<ce-result severity="error" icon="cloud-off">…</ce-result>` | `<ce-empty-state severity="error" icon="cloud-off">…</ce-empty-state>` |
| `<ce-result>…</ce-result>` (default info) | `<ce-empty-state severity="info">…</ce-empty-state>` |

Slots, body, and actions are unchanged.

---

## CDR pre-flight notes

- **CDR-001**: `severity` has 5 values (`none|success|error|info|warning`). This is a severity scale, not a vocabulary. The 5-value count is at the limit; if a 6th severity were proposed (e.g., `debug` or `critical`), the operator should push back on whether it's vocabulary creep. See the CDR-001 amendment for the structural-vs-vocabulary test.
- **CDR-003**: Severity is presentation-policy-adjacent but is a meaningful semantic attribute (it controls the announcement role and color affordance). Not a per-instance policy boolean.
- **CDR-004**: Static-first. All attributes optional; zero-attr usage works.
- **CDR-006**: Composes with `ce-button`, `ce-link`, `ce-icon` in slots.
- **CDR-007**: Sensible defaults — `<ce-empty-state>` with zero attributes renders the empty-state look.
- **CDR-009**: Deterministic DOM. Same attributes ⇒ same rendered output.

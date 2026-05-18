# `<ce-key-value>` — design rationale

Per [ADR-008](../../../docs/adr/adr-008-component-concept-files.md).

## 2026-05-18 — Dual-mode: dt/dd fallback + ce-kv preferred path (CDR-002, CDR-008)

### Context

`ce-key-value` was initially designed around the native HTML `<dt>/<dd>` pair model: semantically rich, accessibility-friendly, and consistent with how definition lists are written. It worked well for plain-text values.

CDR-002 (typed values belong in children) identifies the limitation: when a value is a phone number, a currency figure with a trend chip, a `<time>` element, or any rich content, encoding it inside a `<dd>` attribute is awkward because `<dd>` has no constraint on content — but the **pattern** of nesting typed renderers inside `<dd>` is non-obvious for LLM authors and breaks the alignment contract when semantic children introduce block-level elements.

The proposed solution was to add a new sibling brick `<ce-kv key="…">value content</ce-kv>` where the `key` attribute is an identity string and the default slot carries any typed content. `<ce-key-value>` then accepts `<ce-kv>` children alongside its existing `<dt>/<dd>` path.

### Options weighed

| Option | API shape | Pros | Cons |
|---|---|---|---|
| A — replace dt/dd with ce-kv only | Remove dt/dd slot; require ce-kv children | Clean single API; CDR-002 compliant | Breaks every existing dt/dd usage; violates CDR-008 (additive only) |
| B — dual-mode: detect ce-kv children, fall back to dt/dd (**chosen**) | Both paths work; ce-kv presence auto-selects Mode B | CDR-008 compliant; existing markup unchanged; new authors use ce-kv; migration is gradual | Slightly more implementation surface (MutationObserver + conditional render template) |
| C — add `mode` attribute | `mode="kv"` or `mode="dt"` | Explicit; no detection magic | Author must know to set it; LLMs forget; existing markup must add `mode="dt"` to keep working |

### Decision

**Option B.** Auto-detection via `MutationObserver` on direct children. If any `<ce-kv>` element is a direct child, Mode B is used (flex-column stack of `ce-kv` rows). Otherwise, Mode A (the existing `<dl><slot></slot></dl>` grid) is used.

This preserves the CDR-008 additive contract: no existing markup breaks. New authoring uses `<ce-kv>` for rich values. The detection is automatic — no `mode` attribute needed, no migration required for existing users.

### Consequence

`ce-key-value` now has two render branches sharing the same slot. The `columns` and `wrap` attributes are Mode A-only; they have no effect in Mode B (each `ce-kv` row manages its own grid layout). This is documented in the meta description.

Mode B does not support multi-column packing (the `columns` attribute is ignored). If multi-column packing with `ce-kv` rows is needed in the future, a CDR amendment or a new `<ce-kv-grid>` wrapper should be considered.

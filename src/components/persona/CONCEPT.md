# `<ce-persona>` — design rationale

Per [ADR-008](../../../docs/adr/adr-008-component-concept-files.md).

## 2026-05-18 — rank and score as attributes vs. slot children (CDR-002 allowlist)

### Context

Persona cards in user-research deliverables routinely show two identity-shaped labels alongside the name: a **rank** (`#1`, `#2`) and a **score** (`8 / 10`, `High`). The question was whether these belong as string attributes or as slotted content.

CDR-002 says: *"keys / identifiers / fixed labels stay as attributes — they are always short strings."* The allowlist examples include `tag`, `name`, and `id`-like values. Rank and score qualify: they are short, identity-shaped, and never carry rich HTML (no links, no chips, no time elements). They function like "labels on the entity" rather than "content with potential for typed rendering."

Contrast with `wtp` (willingness to pay) or `tam` (total addressable market): those are financial content that can plausibly become currency renderers, formatted ranges, or linked citations. CDR-002 explicitly forbids those as string attributes.

### Options weighed

| Option | API shape | Pros | Cons |
|---|---|---|---|
| A — both as attributes (**chosen**) | `rank="#1" score="8 / 10"` | Short, identity-shaped; fits CDR-002 allowlist; renders as pills without slot boilerplate | Could theoretically want rich rendering someday (low probability for rank/score) |
| B — both in default slot or tags slot | `<ce-chip slot="tags" rank>#1</ce-chip>` | Maximum composability | Rank/score lose visual identity vs. tags; mixed semantic meaning in the tags slot |
| C — dedicated named slots | `<span slot="rank">#1</span>` | Per-instance customisability | Over-engineered for short identity strings; adds two new named slots for trivial values |

### Decision

**Option A.** `rank` and `score` are string attributes. They render as small pill badges beside the name, tinted by the `color` attribute. This matches CDR-002's explicit allowlist: these are identity markers, not content-typed values.

`wtp`, `tam`, and any financial or volume data travel via the `meta` slot using `<ce-kv>` children — per CDR-002's prohibition on content-shaped string attributes.

---

## 2026-05-18 — detail and meta as named slots (CDR-002, CDR-006)

### Context

The persona card needed a place for: (1) a rich description paragraph referencing research, and (2) metadata rows (WTP, TAM, acquisition channel). Two options arose.

### Options weighed

| Option | API shape | Pros | Cons |
|---|---|---|---|
| A — string attributes `detail`, `wtp`, `tam` | `detail="2-15 person agencies..." wtp="$30-100/mo"` | Compact markup | CDR-002 violation: content-shaped values locked in strings; no links, no chips, no typed renderers possible |
| B — named slots `detail` and `meta` (**chosen**) | `<p slot="detail">…</p>` + `<ce-kv slot="meta" key="WTP">…</ce-kv>` | Full CDR-002 compliance; any HTML content; `<ce-kv>` in meta slot composes naturally | More verbose for the minimal case |

### Decision

**Option B.** `detail` slot accepts `<p>`, `<a>`, `<ce-chip>`, or any inline content. `meta` slot accepts `<ce-kv>` children (which themselves carry composable values per CDR-002).

Both slots are hidden when empty via `:not(:has(::slotted(*)))` — no visible whitespace when unused.

---

## 2026-05-18 — additive extension (CDR-008)

All four existing props (`name`, `role`, `avatar`, `color`) and both existing slots (`tags`, default) are preserved unchanged. The new `rank`, `score` props and `detail`, `meta` slots are purely additive. Existing persona markup renders identically.

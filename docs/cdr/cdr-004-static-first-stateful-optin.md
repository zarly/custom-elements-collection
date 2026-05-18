---
id: CDR-004
title: Static-first; stateful behavior is opt-in
status: accepted
date: 2026-05-18
compliance: SHOULD
tags: [api-design, ux-mode]
relates_to: [ADR-009, src/components/rating, src/components/checklist, src/components/tabs, src/components/filter-bar]
---

# CDR-004 — Static-first; stateful behavior is opt-in

## Context

A 2026-05-17 corpus audit found that ~90 % of CEC usage is in **static read-only `vis/` documents** — reports, retros, audits, dashboards rendered server-side or in chat-streamed UIs. Yet several components were designed defaulting to interactive production-UX behaviour:

- `ce-rating` defaults to form-associated thumbs/stars that emit `ce-rating-change` events.
- `ce-checklist` JSON examples lead with `allow-edit` + `persist-key` (localStorage).
- `ce-tabs` requires JS-state to switch panels.
- `ce-filter-bar` emits events for filtering.

In each case, the static read-only rendering path exists (e.g. `readonly` on rating) but is buried — the first example is the stateful one, the meta description leads with form-association, the cheat-sheet recipe is unstated. LLM authors and human contributors miss the static path entirely.

Result: 0 adoption of these components in the `vis/`-document corpus, despite raw alternatives (`<div class="stars">★★★★☆</div>`) being written 157+ times. The component shape was right; the **default presentation** was wrong for the dominant use case.

## Decision

- **Default rendering is static and read-only.** No localStorage writes, no events fired beyond pure pointer/keyboard reflectance, no form-association unless explicitly enabled.
- **Interactivity is opt-in** via clearly named attributes: `readonly` (negate to enable), `persist-key`, `name`, `interactive`. The presence of an opt-in attribute is what activates the stateful path.
- **The first `@example` block in `examples.html` is the static case.** Stateful examples follow.

## Goal / Definition of success

- Every component renders meaningfully on page load with zero JavaScript state.
- Every component with stateful capability exposes a clear opt-out path that returns to the static default.
- First `@example` block in each `examples.html` is the static / read-only case.

## When to apply

- Components representing data that is **typically displayed** but **occasionally interactive**: rating, checklist, filter bar, tab strip, toggle, comment box.
- Components that ship form-association (`ElementInternals`) — the form behaviour should be opt-in via `name`.

## When NOT to apply

- Components that are interactive **by definition**: `ce-button`, `ce-input`, `ce-textarea`, `ce-confirm`, `ce-comment`. Interaction is the whole point.
- Components without a meaningful static/dynamic distinction: `ce-card`, `ce-callout`, `ce-section` — they're static and no version is "dynamic".

## Good examples

```html
<!-- Static (default) — first example -->
<ce-rating mode="stars" max="5" value="4" readonly></ce-rating>

<!-- Interactive when explicitly opted in -->
<ce-rating mode="stars" max="5" name="feedback" allow-half></ce-rating>

<!-- Static checklist (no persist-key, no allow-edit) -->
<ce-checklist items='[{"id":"a","text":"Done","checked":true},{"id":"b","text":"Todo"}]'></ce-checklist>

<!-- Same checklist as a persisted interactive todo (opt-in) -->
<ce-checklist persist-key="onboarding-v1" allow-edit items='[...]'></ce-checklist>
```

## Bad examples (anti-patterns)

```html
<!-- ❌ Stateful default; static path exists but is undocumented -->
<ce-checklist persist-key="default" allow-edit></ce-checklist>
<!-- Every adopter now has to think about state, even for a read-only display. -->

<!-- ❌ Component fires events for default static usage -->
<ce-rating mode="stars" value="4"></ce-rating>
<!-- If this emits ce-rating-change on a vis page, the page mutates DOM
     unexpectedly. readonly should be the default for value-only use. -->
```

## Consequences

- ✅ Covers `vis/` (static) and production UX in the same component without forking.
- ✅ Authors don't accidentally enable form/storage state when they just wanted display.
- ✅ Matches [ADR-009](../adr/adr-009-llm-tolerant-components.md) — LLM authors rarely express "make this stateful"; the default should be the safer one.
- ⚠️ More attributes (`readonly`, `interactive`) — but each one carries the explicit opt-in semantic.
- ⚠️ Migration of existing stateful-default components requires careful default flip — pair with `interactive` opt-in to preserve existing call sites.

## Validation

- **Lint rule (encoded):** `cec-validation-rules.md` R8 — first `@example` of a stateful component must be the static / `readonly` case.
- **Manual review checklist:** *"If this component appears on a static report rendered server-side, does it render meaningfully with no JS?"* If no → wrong default.

## History

- 2026-05-18 — Accepted. Codifies the pattern surfaced by adoption audit (37 stateful-default components show 0 adoption in static vis corpus).
- Already partially encoded as R8 in `cec-validation-rules.md`; this CDR is the canonical statement.

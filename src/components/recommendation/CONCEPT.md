# CONCEPT — `ce-recommendation`

Added: 2026-05-18

## Why `priority` is a 4-value enum (CDR-001 OK)

CDR-001 says: if the enum encodes _vocabulary_, push it to a slot. The P-tier scale (P0–P3) is not vocabulary — it is a universal, finite, industry-standard severity ladder used identically in JIRA, GitHub issues, incident management, and product backlogs. The _words_ "critical / high / medium / low" are the vocabulary; the _labels_ P0–P3 are the scale. The enum is finite by external spec, not by our preference, and cannot grow without breaking the industry convention it mirrors.

This meets the CDR-001 "When NOT to apply" clause: _"Pure style enums where the words are the universal vocabulary. direction='ltr|rtl', size='sm|md|lg' — these are finite by spec, not vocabulary."_

The enum is kept at exactly 4 values. No aliases, no `critical` | `high` equivalents in the enum — those belong in the title/body text authored by the consumer.

## Why both `title` attribute AND `slot="title"` (CDR-002 reconciliation)

CDR-002 says typed/rich values belong in slots. A title is _usually_ a plain string — the most common corpus pattern is `title="Connection pooling"`. Requiring a slot for the simple case would violate CDR-007 (verbose first example). The resolution:

- Attribute `title` for the common case (plain string, single attribute, minimal markup).
- `slot="title"` for rich titles (`<code>`, `<ce-chip>`, `<a>`) — the slot takes precedence when present.

The same dual-channel pattern is used by `ce-callout` (stable reference), making it an established library convention. The fallback order: if `[slot="title"]` exists, the attribute value is never rendered (the slot replaces it).

Same reasoning applies to `impact` attribute vs `slot="impact"`.

## Why `tier: brick`

`ce-recommendation` has no internal mutable state, no interactive behavior (no events emitted), and no data fetching. It is a pure presentational data block. Per ADR-006: "no state, no interactive logic, no fetch → brick." The `actions` slot accepts arbitrary interactive children, but the component itself is passive — it does not own those interactions.

## Priority badge placement

Chose "badge before title in the header row" over "top-right corner badge" because:

1. Reading order: Western left-to-right reading starts with the badge, immediately signaling severity before the reader processes the title. Top-right requires the eye to jump after reading the title.
2. Matches `ce-callout.ts`'s icon-before-content pattern — keeps visual grammar consistent.
3. Simpler layout: flexbox row with gap, no `position: absolute` needed.

## Impact line color (green for positive)

The corpus consistently marks impact lines in green (`rec-impact` with `.positive`). Green signals "good outcome if you act." The component uses `--ce-color-green` for the impact line by default. If a consumer needs a different color for negative impacts, they override the token or use `slot="impact"` with custom styling.

## Actions slot and CDR-006

The `slot="actions"` accepts arbitrary children per CDR-006. The component does not inspect or restrict what's placed there — any `<button>`, `<a>`, `<ce-button>`, or future typed component works. The footer separator only renders when the slot has assigned nodes (CSS `:has(::slotted(*))` guard).

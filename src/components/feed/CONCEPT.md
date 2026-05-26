# ce-feed — CONCEPT

**Created:** 2026-05-23  
**Status:** v1 (experimental)

---

## Why a feed component, not just a list?

`ce-feed` targets the ARIA 1.1 `feed` role, which is designed specifically for
reverse-chronological streams that can grow while the user reads (activity logs,
notifications, social timelines, RSS, audit trails, commit histories). A plain
`<ul>` or `ce-timeline` is stateless; `ce-feed` adds:

- **Automatic sorting** — entries declare their `time` and the feed imposes order.
- **Time-bucket grouping** — "Today / Yesterday / May 22" headers emerge from data,
  not from markup.
- **Streaming append** — `slotchange` re-sorts and re-groups on every new child.

`ce-timeline` is axis-oriented (fixed, complete sequences like project milestones).
`ce-feed` is event-oriented (open-ended, append-only, most-recent-matters-most).

---

## Two-element design: CeFeed + CeFeedEntry

Option A (single element) was the obvious starting point: put items in a `data`
array and render them entirely inside `ce-feed`. It was rejected because:

1. Entry content is arbitrary and rich — avatars, badges, code snippets. Encoding
   that as strings inside a JSON array is fragile (HTML injection risk) and breaks
   CDR-006 (composition).
2. Slotted children let consumers mix `ce-relative-time`, `ce-badge`, links, and
   other `ce-*` tags inside each entry without any escaping.

`CeFeedEntry` is therefore the canonical entry shape: a tiny shadow-DOM wrapper
that adds the timeline dot, `role="article"`, and spacing. Consumers slot
whatever they need inside it. The `data` array path (CDR-005 compliance) exists
for fully-programmatic / no-HTML use cases; it supports plain text content only.

---

## Grouping algorithm

### Bucket key generation

Each entry's `time` → `Date` → a stable string key:

- `day`   → `"YYYY-MM-DD"`       (one group per calendar day)
- `week`  → `"YYYY-WNN"`         (one group per ISO-week number)
- `month` → `"YYYY-MM"`          (one group per calendar month)

Entries are first sorted (newest or oldest), then walked in order; a new group
is opened whenever the key changes. The sort-then-bucket ordering ensures groups
appear in correct time sequence in the rendered output.

### "Today / Yesterday" relativity

The day and week labels use `new Date()` at render time as the reference point.
This means:

- **Snapshot semantics:** a feed rendered just before midnight will show "Today"
  for entries that by the time the user reads them are actually "Yesterday". This
  is intentional for v1 — adding a `setInterval` would reflow the entire grouped
  list every midnight for an inconsequential label change.
- **Testing:** tests should not assert exact label strings ("Today"/"Yesterday")
  unless they control the clock. The test suite checks group *count* and sort
  *order* instead, which are clock-independent.
- **v2 path:** expose a `now` attribute (ISO string) that overrides `new Date()`
  for server-side rendering or test-clock injection.

### Invalid `time` values

If `time` is absent, empty, or not parseable by `new Date()`, the entry is
placed in an `__invalid__` bucket with label "Unknown time". Invalid-time entries
always sort to the end regardless of the `order` attribute — they cannot be
positioned meaningfully relative to valid entries.

---

## Sorting and the `data` array path

`data` entries go through the same sort + group pipeline as slot children.
When `data` is non-empty, slot children are **silently ignored** — the same
priority policy as every other dual-input component in the library (CDR-005).

The sort is a stable JS `.sort()` call on a cloned array. The original
`_slotEntries` array is never mutated; the sorted copy is ephemeral per render.

---

## Sticky group headers

Group headers use `position: sticky; top: 0`. This requires the feed (or an
ancestor) to scroll; if the feed's containing block is `overflow: hidden`, the
sticky effect silently degrades to static. Documented here, not worked around —
changing the overflow model of the host would break too many layouts.

The sticky header background is `var(--ce-surface, transparent)`. Consumers
must ensure the token matches their page background if they want opaque occlusion.

---

## dense mode

`dense` is a layout-only boolean (CDR-003). It reduces `padding` on entries
via a `data-dense` attribute forwarded to slotted `ce-feed-entry` children.
It does not change visual semantics, hide timestamps, or alter grouping.

CDR-003 deviation justification: `dense` is a presentation toggle, not a data
flag. It is intentionally presentation-only and global. This is the same
pattern used by `ce-card[compact]`, `ce-message-group[compact]`, and similar
components in the library. Exceptions to CDR-003 are documented per CDR-003's
deviation protocol.

---

## v2 deferred items

1. **Virtualization** — for feeds with >1 000 entries, wrap in `ce-virtual-scroller`
   (not yet implemented). `ce-feed` intentionally renders all entries in v1.
2. **`now` attribute** — ISO datetime override for the "Today/Yesterday" reference
   point (useful for SSR and time-travel testing).
3. **Infinite-scroll / pagination** — emit `ce-feed-load-more` when the user
   scrolls near the bottom; consumer fetches and appends more `ce-feed-entry`
   children.
4. **`ce-feed-entry[color]`** — optional dot color for semantic status coding
   (matches `ce-timeline`'s dot color system).

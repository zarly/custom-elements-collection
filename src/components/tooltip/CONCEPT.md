# CONCEPT — ce-tooltip

**Created:** 2026-05-23

## Why not depend on ce-popover?

`ce-popover` is the sibling overlay primitive. Two options were considered:

| Option | Description | Verdict |
|---|---|---|
| **A — Build on ce-popover** | `ce-tooltip` wraps `ce-popover`, defers positioning and popover-API calls to it. | Rejected |
| **B — Standalone (chosen)** | `ce-tooltip` implements its own popover bubble, 4-placement positioning, and timer logic without depending on `ce-popover`. | Accepted |

Reason for rejection of Option A: `ce-tooltip` must be usable standalone — consumers may not have `ce-popover` registered. Hard-coupling via import would (a) pull in popover's full bundle for a simpler use-case, and (b) violate ADR "no runtime peer-deps". The sibling relationship is noted in `related[]` in the meta.

## For attribute vs slotted trigger

`ce-popover` uses a `slot="trigger"` for its activating element. `ce-tooltip` uses `for=<id>` (the same model as `<label for=>`). Reasons:

1. **No DOM reparenting.** The target element is already placed by the consumer — we should not require wrapping it.
2. **Works with elements inside scroll containers, tables, or frameworks** that resist being wrapped.
3. **Simplest consumer API:** `<ce-tooltip for="x" text="…">` requires zero changes to the target markup.

## Non-interactive constraint

The bubble has `pointer-events: none` and no `tabindex`. If a use-case needs a hoverable floating card the user can interact with, that is `ce-hover-card` (deferred component). The strict pointer-events: none is intentional so tooltips dismiss immediately on mouseleave from the target — per WCAG 1.4.13 ("Content on Hover or Focus") advisory note that tooltip content triggered by hover should be dismissible.

## popover="manual" choice

The bubble uses `popover="manual"` (not `popover="auto"`). Rationale: light-dismiss (outside-click) is undesirable for tooltips — the tooltip should track the pointer/focus, not act as a modal. Manual mode means we own open/close entirely, which is simpler than fighting `popover="auto"`'s toggle behavior.

## Delay applies only to show, not hide

Hide is always immediate. This matches convention (ARIA Authoring Practices Guide §3.3 tooltip pattern) and avoids the tooltip persisting after the user has moved away.

## aria-describedby lifecycle

On show: `target.setAttribute("aria-describedby", tooltipId)`.
On hide: `target.removeAttribute("aria-describedby")`.

Leaving it on a hidden element (alternative approach) was considered but rejected — removing it keeps the screen reader announcement tied to the tooltip being truly visible, matching user expectation.

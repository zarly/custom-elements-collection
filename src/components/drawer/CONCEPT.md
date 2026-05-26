# CONCEPT — `ce-drawer`

**Date:** 2026-05-23
**Status:** Initial design — experimental

---

## What problem this component solves

Edge-attached overlay panels are a very common pattern (filter drawers, carts, nav
sidebars, log viewers, settings inspectors) but they require awkward boilerplate:
`position: fixed`, slide-in keyframes, focus trapping, and Escape handling. `ce-drawer`
packages all of this behind a slot-driven API that composes with any content.

---

## Decision 1: `<dialog>` vs positioned div for modal mode

**Options weighed:**

| Option | Pros | Cons |
|---|---|---|
| Native `<dialog showModal()>` | Free focus trap, top-layer, native Escape via `cancel` event, backdrop via `::backdrop` | `<dialog>` is centered by default; must override with `position: fixed; margin: 0; inset: ...` per side |
| `popover="manual"` on a div | Simpler CSS; lives in top-layer without focus-trap ceremony | Requires hand-rolled focus trap; `toggle` event is less stable across UA versions; focus management is entirely manual |
| Pure positioned div | Full CSS control | No top-layer; must manage z-index stacking, focus trap, Escape, and backdrop manually |

**Decision:** Use native `<dialog showModal()>` for modal mode. The focus-trap and
backdrop are not trivial to implement correctly (especially the "focus must not leave
the dialog" invariant under tab cycling). The CSS override to position it at an edge
(`margin: 0; position: fixed; inset: 0 0 0 auto; height: 100dvh`) is a well-supported
pattern and worth the trade.

The `::backdrop` pseudo-element renders in the top-layer below the dialog, so the scrim
is automatic and dismissal via backdrop click works by detecting `e.target === dialog`.

**For non-modal mode (`modal=false`):** A regular `position: fixed` div is used. No
focus trap is provided — the spec says non-modal dialogs do not require one and callers
can choose to constrain focus themselves. A document-level `keydown` listener handles
Escape when `dismissible=true`.

---

## Decision 2: Slide-in CSS approach

**Options weighed:**

| Option | Pros | Cons |
|---|---|---|
| CSS `transform: translateX/Y(100%)` + `transition` on the dialog | Single property change; GPU composited; no JS timing | `allow-discrete` transitions for `display` and `overlay` require Chrome 117+. Older browsers show instant snap, which is acceptable |
| JS-managed `@keyframe` animation with `animationend` cleanup | Works everywhere | Requires JS timing coordination with `dialog.close()` — calling `close()` too early collapses the dialog before exit animation finishes; fragile |
| `Web Animations API` | Precise control | More code; still needs careful timing |

**Decision:** CSS transitions on `transform` with `allow-discrete` for `display` and
`overlay`. This gives the smoothest entry/exit in modern browsers and degrades cleanly
to an instant open/close in older ones. `@starting-style` provides the enter-from state
for browsers that support it (Chrome 117+, Safari 17.5+).

`prefers-reduced-motion: reduce` sets `transition: none` on both the panel and the
backdrop — snapping to the final state instantly.

---

## Decision 3: `side=start` and logical properties

`side="start"` maps to the logical inline-start edge, which is the left edge in LTR
documents and the right edge in RTL documents. The CSS uses `inset: 0 auto 0 0` for
`side=start` (physical left), which is sufficient for LTR. Full RTL support would
require `inset-inline-start: 0` but that cannot be expressed inside `@starting-style`
blocks in all UA versions consistently. This is a known limitation: in RTL documents
`side=start` will still open from the physical left. Document in limitations if this
component graduates from experimental.

---

## Decision 4: Trigger slot wiring

The `trigger` slot approach (the trigger is a slotted child, not an attribute) follows
the pattern established by `ce-popover`. The component listens to `slotchange` to
re-wire click listeners when the trigger element changes after initial render. The
trigger receives `aria-haspopup="dialog"` and `aria-expanded` for accessibility.

Focus return on close follows WCAG 2.1 SC 2.4.3: the element that had focus when
`show()` was called (captured as `document.activeElement`) receives `.focus()` when the
drawer closes.

---

## Decision 5: Size tokens map to panel cross-axis dimension

`size="sm"` → 24rem, `md` → 32rem, `lg` → 48rem, `full` → 100%.

For `side="start"` and `side="end"`, size governs `width`. For `side="top"` and
`side="bottom"`, size governs `height`. The CSS variable `--ce-drawer-size` is set per
`:host([size])` selector and consumed by both the `dialog` and `.ce-drawer__panel` rules.

`full` means 100% of the relevant dimension (full-width for top/bottom, full-height for
start/end), not 100vw × 100vh — intentional.

---

## Known limitations (experimental tier)

1. RTL `side=start`: opens from the physical left, not the logical inline-start.
2. `@starting-style` and `allow-discrete` transitions require Chrome 117+ / Safari 17.5+;
   older browsers will open/close without animation.
3. Non-modal mode has no built-in focus trap — caller's responsibility.
4. The `::backdrop` fade-in/out transition (`allow-discrete`) is Chrome 117+ only.

# `ce-popover` — design concept and rationale

> Captures the *why* behind decisions in this folder. Not generated, not bundled, not part of the public API. Read before reopening a settled debate. Update when you make a new non-trivial design choice. See [ADR-008](../../../docs/adr/adr-008-component-concept-files.md) for the convention.

**Last substantive update:** 2026-05-23.

---

## What this component is for

`ce-popover` is the **foundational floating-panel primitive**. Its job is exactly one thing: render an anchored, non-modal panel adjacent to a trigger element and handle the open/close lifecycle cleanly. It deliberately does *not* render menu items, form fields, or any opinionated content — that is the slotted consumer's responsibility.

Downstream components that depend on this primitive: `ce-tooltip`, `ce-dropdown-menu`, `ce-hover-card`, `ce-combobox`. The design decisions here propagate to all of them.

---

## Decisions

### D1 — Native Popover API vs `<dialog>` vs fully custom overlay

**Options considered.**
1. **Native `<dialog>` with `showModal()`** — used by `ce-modal`. Modal, creates a focus trap. Inappropriate for non-modal panels like filter menus or help text that should allow background interaction.
2. **Fully custom overlay** — `position: fixed`, manage z-index, own the outside-click listener with a `document.addEventListener('click')` on capture, own Escape. ~100 extra lines; recreates what the browser now ships natively; fragile on complex stacking contexts.
3. **Native Popover API (`popover` attribute)** — top-layer rendering without a focus trap, built-in light-dismiss for `popover="auto"`, built-in Escape handling, and `toggle` events for state sync. Baseline 2024, all modern browsers.

**Chose 3 — Native Popover API.**

*Why it beats `<dialog>`.* A popover is non-modal by definition. Using `showModal()` would create a focus trap, making background content unreachable. The Popover API was designed specifically for this class of UI.

*Why it beats a custom overlay.* Outside-click detection via document capture is a classic footgun: it races with the same-frame click that opened the panel, requires checking `composedPath()`, and breaks across shadow-DOM boundaries. The browser solves this correctly once, for free.

*The one caveat — top-layer stacking.* The Popover API renders the panel in the browser's top layer. This means `z-index` on the host is irrelevant; the panel will always paint above everything. For this use case that is the desired behavior.

*Light-dismiss controlled by the `light-dismiss` attribute.* `popover="auto"` gives outside-click + Escape for free. `popover="manual"` disables both; the consumer is fully in control. Wired directly to the boolean `light-dismiss` attribute.

---

### D2 — CSS anchor-positioning vs JS positioning

**Options considered.**
1. **CSS anchor-positioning** (`anchor-name` / `position-anchor`) — declarative, no JS needed, no repositioning on scroll. Chrome-only as of May 2026; Firefox and Safari have not shipped it.
2. **floating-ui** — the industry-standard positioning library. Handles flipping, shifting, arrow positioning, virtual elements. Would be a runtime peer-dep (violates ADR identity marker 7: no CDN or peer-dep at runtime).
3. **Hand-rolled JS positioning** — `getBoundingClientRect()` on trigger and panel, inline `style.top/left`, window scroll + resize listeners attached while open and cleaned up on close.

**Chose 3 — hand-rolled JS.**

*Why not CSS anchor-positioning.* Cross-browser support is insufficient in 2026. Committing to it would silently break Firefox and Safari users. Deferred to v2 as a progressive enhancement once Baseline support lands.

*Why not floating-ui.* Any import of floating-ui would introduce a runtime peer dependency, violating the hard constraint in the project's CLAUDE.md. The alternative is a vendor-bundled copy, but that adds ~12 KB (gzip) with a scope (virtual elements, middleware chaining, platform adapters) far larger than the 8 placements this component needs. The hand-rolled algorithm covers all 8 placement values in ~80 lines.

*Deferred: viewport overflow flip.* When the panel would clip the viewport edge, the right fix is to flip the placement (e.g. `bottom-start` → `top-start`). v1 omits this; the panel clips rather than flipping. Documented in `meta.limitations`. Prioritize in v2 after the component is proven.

---

### D3 — The 8-value `placement` enum (CDR-001 deviation)

CDR-001 says style enums should have ≤5 values, and specifically warns against vocabulary aliases (e.g. `small/medium/large` instead of `sm/md/lg`).

**Why 8 values are justified here.**

The `placement` enum is not a vocabulary or styling alias set. It is a **coordinate space description** for a 2D anchor system:

```
         top-start   top   top-end
left  ←  [trigger element]  → right
         bot-start   bot   bot-end
```

Four axes × three alignment variants (start/center/end), minus the two center-center overlaps that would require the panel to render on top of the trigger (not defined). This yields exactly 8 values — the same geometry that CSS Anchor Positioning, floating-ui, and Popper.js all use.

These 8 values encode a closed 2D space; they are not vocabulary items. The analogy is `aspect-ratio: "16/9" | "4/3" | "1/1"` — the enum is finite not because of CDR-001's vocabulary rule but because the solution space is finite.

**Documented deviation format:** Deviation: CDR-001 — 8 values encode a closed 2D coordinate space, not a vocabulary alias set. Standard floating-UI positions.

---

### D4 — Static-first / CDR-004 compliance

Zero-attribute `<ce-popover>` renders a closed panel with `placement="bottom-start"` and `light-dismiss=true`. No open state, no listeners, no positioning. Stateful behavior (toggling open) is gated entirely behind the `open` attribute or a user click — never assumed at render time.

---

### D5 — Light-dismiss semantics

When `light-dismiss=true` (the default): `popover="auto"` is set on the panel. The browser fires a `toggle` event with `newState="closed"` on any auto-dismiss. The component listens for that event and syncs `open=false` to keep property, attribute, and DOM in agreement.

When `light-dismiss=false`: `popover="manual"` is set. The panel will not dismiss on outside-click or Escape. The consumer is responsible for calling `hide()` or setting `open=false`. This mode is appropriate for controlled components (e.g. a combobox that needs to manage the dismiss itself).

---

### D6 — Focus management

Focus moves to the panel (`tabindex="-1"`) on open; focus returns to the trigger on close. This follows the same pattern as `ce-modal`. No focus trap is created — the panel is non-modal and background elements should remain reachable via Tab.

The trigger SHOULD be a native `<button>` or `<a>` so Enter/Space activation is provided by the browser. If a consumer places a non-interactive element in the `trigger` slot, they must add `role="button"` and keyboard activation themselves. This is documented in `meta.a11y.notes`.

---

### D7 — CDR-006 composition guarantee

The trigger slot accepts any element. The panel slot accepts any content. `ce-popover` imposes zero opinions on either. This is intentional: `ce-dropdown-menu` will wrap `ce-popover` and fill the panel slot with menu items; `ce-tooltip` will fill it with a short string; `ce-hover-card` will fill it with a rich preview. The primitive must compose cleanly into all of these.

---

### D8 — CDR-011 failure modes

| Mode | Behavior |
|---|---|
| Missing `trigger` slot | Panel still opens via `show()`. No trigger aria wiring. |
| Missing panel content | Renders an empty panel; no error. |
| Popover API unavailable (old browser) | `showPopover()` / `hidePopover()` are called inside try/catch; the panel falls back to in-flow positioning. |
| Invalid `placement` value | Positioning defaults to (0, 0) — panel appears at viewport origin. No throw. |

---

## What v2 should address

1. **Viewport overflow flip** — detect when the computed position would clip the viewport and flip to the opposite placement automatically.
2. **CSS anchor-positioning** — once Baseline, replace JS positioning with CSS for zero-JS reflow-safe alignment.
3. **Arrow auto-centering** — current arrow centers on the trigger midpoint; should clamp to panel edges if the panel is narrower than the trigger.
4. **`placement-fallback` attribute** — ordered list of placements to try when the preferred one overflows (floating-ui's `autoPlacement` equivalent).

# CONCEPT — ce-search

_Created 2026-05-23_

## Summary of non-trivial decisions

### 1. Shortcut parsing: simple string split, no library

**Options considered:**

A. Parse the `shortcut` attribute with a minimal `split("+")` approach and a platform check for `cmd` → `metaKey` (Mac) / `ctrlKey` (others).
B. Use a keyboard-shortcut library (e.g. `hotkeys-js`).

**Decision: A.**

Option B would add a runtime peer dependency and violate ADR-007 (no peer deps). The supported vocabulary is small: `cmd`, `ctrl`, `control`, `alt`, `shift`, plus the final key token. A `split("+")` parser covers 100% of the specified use cases (`"/"`, `"cmd+k"`, `"ctrl+k"`, `"alt+k"`, `"shift+k"`) in fewer than 30 lines. The parser lives in `#parseShortcut()` and is separately tested.

Cross-platform note: `"cmd"` maps to `metaKey` on Mac (detected via `navigator.platform`) and `ctrlKey` elsewhere. This matches user expectation: a spec of `shortcut="cmd+k"` should activate with `Ctrl+K` on Windows/Linux.

### 2. Shortcut listener: document-level, guarded against active inputs

The listener must fire regardless of where focus is on the page — that requires `document.addEventListener`. The guard checks `document.activeElement.tagName` against `INPUT`, `TEXTAREA`, `SELECT`, and `isContentEditable` to avoid stealing keystrokes while the user is typing elsewhere. This is the standard pattern (VS Code, Linear, GitHub all use the same guard).

**Cleanup:** Bound handler stored as `#onDocKeydown` arrow property; removed in `disconnectedCallback`. Prevents leaks when the component is unmounted.

### 3. Debounce: manual setTimeout, no utility

**Options considered:**

A. A `#debounceTimer: ReturnType<typeof setTimeout> | null` field, reset on each input event.
B. A shared `debounce()` utility from the `core/` barrel.

**Decision: A.** No shared debounce utility exists in `core/` and adding one for a single component is over-engineering (10% tool-utilization heuristic). The implementation is 5 lines and is trivially testable with `vi.useFakeTimers()`. If a second component needs it, that's when promotion to `core/` is warranted.

### 4. Form-associated: defensive `attachInternals` pattern

`static formAssociated = true` is declared on the class. `attachInternals()` is called in `connectedCallback` rather than the constructor, matching the pattern in `ce-rating`. The try/catch guard allows jsdom (vitest environment) to tolerate the call even though jsdom's `ElementInternals.setFormValue` may be absent or a no-op — the component still works in tests.

`setFormValue(this.value)` is called on every value change (input, clear, programmatic setter). When `name=""` the form data entry is present but with empty key, which is benign — native inputs behave the same way.

### 5. Loading vs. clear button: mutual exclusion in the render tree

When `loading=true`, the entire `<button class="clear">` is absent from the render tree (not just `hidden`). This prevents focus-management confusion: a hidden-but-present clear button could receive tab focus in some browsers. The trade-off is a slightly larger diff on loading toggle; accepted because the clarity is worth it.

### 6. Shadow DOM (ADR-002 exception)

`ce-search` uses Shadow DOM via `createShadowRootWithStyles()`. The `:host([disabled])` and `:host([loading])` attribute selectors require isolation to avoid specificity collisions with page-level border/background rules on the flex container. This matches the established pattern in `ce-card`, `ce-input`, and `ce-rating`. The exception is documented here per ADR-002 protocol.

### 7. No `<ce-spinner>` composition

**Options considered:**

A. Render `<ce-spinner size="sm">` in the loading slot.
B. Render an inline SVG-based spinner.

**Decision: B.** Composing `<ce-spinner>` would create a registry dependency and require `ce-spinner` to be defined before `ce-search` renders. An inline CSS-only spinner (12 lines of CSS + a `<span>`) is self-contained and avoids the upgrade-ordering concern. The spinner matches `ce-spinner`'s reduced-motion behavior (fade pulse). If `ce-spinner` gains a composable "headless" export in the future, switching is a clean 1-line change.

### 8. CDR deviations

None. Pre-flight:
- CDR-001: no style enum — clean.
- CDR-002: `value` is a plain string attribute — clean.
- CDR-003: no presentation-policy booleans exposed — `loading`/`disabled` are behavior/state, not style.
- CDR-004: zero-attribute `<ce-search>` renders a functional search input — clean.
- CDR-007: sensible defaults; `placeholder="Search"`, `debounce="200"` work out of the box.

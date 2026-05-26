# CONCEPT — `ce-field`

Created 2026-05-23. This file records the non-trivial design decisions made
when authoring this component. Update in place when decisions change; append
new dated entries rather than deleting old reasoning.

---

## 1. Why Shadow DOM for a wrapper component?

**Options considered:**

A. **Light DOM** — the component renders into itself. Simple. The shadow root is `this`, so all child elements are true siblings.  
B. **Shadow DOM** — the component renders a shadow tree with named slots. The slotted control stays in the host's light DOM.

**Decision: Shadow DOM (option B).**

Shadow DOM was chosen for two reasons:

1. `:host` selectors are needed for consistent display/layout isolation, consistent with other layout components in this library (`ce-card`, `ce-callout`, etc.).
2. Named slots (`slot="label"`, `slot="help"`, `slot="error"`) give the author a clear, explicit content model that does not leak into the surrounding page's CSS. With light DOM the named-slot affordance still works but the wrapper's structural divs (label wrapper, help wrapper, error wrapper) would pollute the host's flat DOM.

**Consequence for a11y wiring:** The slotted control remains in the host's light DOM. The `<label for="…">` element is in the shadow tree. Cross-shadow id references are valid — the `for` attribute on `<label>` is resolved in the flat tree (composed tree), not just within the shadow root. This is specified behaviour in HTML and supported by all modern browsers.

---

## 2. id-generation strategy

**Options considered:**

A. `crypto.randomUUID().slice(0, 8)` — truly random, not stable across server/client hydration (irrelevant for web components, but worth noting).  
B. Monotonic counter on the class: `static #idCounter = 0` — simple, stable within a page session, unique per instance, deterministic within a given page load order.  
C. `this.id || generatedId` — re-use the host element's own id as a namespace seed.

**Decision: monotonic counter (option B).**

A counter produces predictable ids (`ce-field-1`, `ce-field-2`, …) that are easy to read in DevTools, stable within a render pass (no hydration mismatch for SSR-less web components), and trivially unique. The counter increments in the constructor, so every instance gets a unique id at construction time regardless of connection order.

The generated control id uses the pattern `<fieldId>-control` (e.g. `ce-field-3-control`) so it is namespaced to the field instance and will not collide with sibling field instances.

---

## 3. Control-discovery algorithm

**Requirement:** If the user does not set a `for` attribute, the wrapper must auto-bind to the slotted control.

**Algorithm (in `#firstControlChild()`):**

1. Iterate `this.children` (the host's direct light-DOM children).
2. Skip elements that carry a `slot` attribute pointing to a named slot (`label`, `help`, `error`) — those are slot content providers, not the control.
3. Skip `<template>` and `<style>` elements.
4. Return the first remaining child element.

This runs in `firstUpdated()` and also on every `slotchange` event on the default slot, so dynamically inserted controls are discovered.

**Edge case — `for` override:** When `for` is set, the wrapper uses `querySelector('#id')` scoped to `this` to find the control. This means the explicitly bound control must be a descendant of `ce-field`, not a sibling. This is the expected usage (`<ce-field for="id"><input id="id"/></ce-field>`).

---

## 4. aria-describedby composition — help AND error

HTML allows a space-separated list for `aria-describedby`. Both help and error ids are included if both are present. In practice, the component hides the help region when an error is present (only one is rendered in the DOM at a time), but the aria list is still computed correctly because both `hasHelp` and `hasError` are evaluated independently.

**Decision:** Help text is hidden (not rendered to DOM) when error text is present. This avoids the visual noise of showing both simultaneously. But the logic for `aria-describedby` is written defensively to include both if both shadow elements happen to be present (e.g. if a subclass overrides render).

---

## 5. required reflection strategy

`required` is reflected to:

- Native form elements (anything with a `required` IDL property — `input`, `select`, `textarea`, `ce-input` which exposes it as a Lit property): set `element.required = true/false`.
- Everything else (custom elements that don't expose `required`): set/remove `aria-required="true"`.

Detection: `"required" in element`. For `ce-input` this works because `CeInput` declares `@property({ type: Boolean, reflect: true }) required = false` — the property exists on the prototype.

---

## 6. CDR deviations

None. The field component does not carry typed values in string attributes (CDR-002: label/help/error are all plain strings, the control itself carries the typed value). Presentation policy (required asterisk color, error color) is entirely token-driven (CDR-003). The zero-attribute case renders only the slotted control (CDR-007).

---

## 7. Why error uses role=alert + aria-live=polite (not assertive)

`aria-live="assertive"` interrupts the user's current reading flow immediately. Form validation errors are important but not time-critical — `polite` waits for a natural pause, which is less disruptive while still announcing when the field state changes. `role="alert"` implies `aria-live="assertive"` in the spec, but browser implementations vary; the explicit `aria-live="polite"` attribute wins in practice for this case.

If a caller needs assertive announcement (e.g. immediate inline validation on blur), they can set `aria-live` on the slotted control directly.

---

## 8. The wrapper is NOT form-associated

`ce-field` deliberately omits `static formAssociated = true`. The component's job is presentational a11y wiring only. The control inside (`ce-input`, native `<input>`, etc.) participates in form submission through its own form-association. Adding form-association to the wrapper would create a duplicate form participant and complicate the data model.

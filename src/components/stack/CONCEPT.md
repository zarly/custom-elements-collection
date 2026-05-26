# CONCEPT — ce-stack

Created: 2026-05-23

## Decision 1: Shadow DOM vs Light DOM

**Options weighed:**

A. **Light DOM** (the library default per ADR-002). Styles would be injected as a `<style>` tag into the host page. The `gap` and `flex-direction` rules rely entirely on `:host([attr])` selectors, which only work reliably when scoped inside a shadow root. Without shadow DOM, `static styles` in Lit are not applied at all (CecElement.createRenderRoot returns `this`, bypassing Lit's style adoption); we would need to either (a) manually write a `<style>` block into the light DOM via `render()` or (b) use inline styles via `willUpdate()` for every property. Option (a) is inherently unscoped and pollutes the host page. Option (b) converts every CSS rule into a JS property, making theming brittle and defeating the token system.

B. **Shadow DOM** via `createShadowRootWithStyles()`. All `:host([attr])` selectors work correctly. Styles are scoped. Children live in light DOM (slot passthrough); the shadow root only contains `<slot>`. The slot is evaluated lazily by the browser, so streaming children are picked up without any render cycle.

**Chosen: B — Shadow DOM.**

Precedent: `ce-grid` (sibling layout component) makes the same choice for identical reasons. Both are pure CSS layout primitives whose API surface is entirely `:host([attr])` selectors.

---

## Decision 2: `split-after` implementation strategy

**Options weighed:**

A. **CSS only via `::slotted(:nth-child(N+1))`**. The `::slotted()` pseudo-element only accepts a compound selector, not `:nth-child()` with an offset computed from an attribute. You cannot write `:host([split-after="2"]) ::slotted(:nth-child(3))` and have `3` be dynamic. This makes pure CSS impossible for a variable N.

B. **`::part()` exposure**. Requires children to opt in with `part=""` attributes — not suitable for a generic layout wrapper that accepts arbitrary HTML content from any author.

C. **`willUpdate()` with inline style**. On each update, remove `margin-block-start` from all children, then set `margin-block-start: auto` on `this.children[splitAfter]`. This is pure DOM manipulation, zero JS libraries, and survives children added before the element upgrades (they are in `this.children` at `willUpdate` time).

**Chosen: C — inline style in `willUpdate()`.**

The host also receives `min-block-size: 100%` in its `:host([split-after])` CSS rule so that the margin-auto has space to push against. Without a defined block size on the flex container, `auto` margins collapse to zero.

---

## Decision 3: `recursive` implementation

**Context:** Heydon Pickering's original Every Layout "Stack" applies gap recursively by targeting `* + *` or `* + ce-stack` in a global stylesheet. We cannot do that from inside a shadow root.

**Options weighed:**

A. **Custom property cascade**: define `--ce-stack-space: var(--ce-space-4)` on `:host` and consume it as `gap`. Children inherit the custom property automatically. The host controls what value children inherit by setting `--ce-stack-space` on the host. This is elegant but requires every consumer to know they must set `--ce-stack-space` rather than the `space` attribute.

B. **`willUpdate()` DOM walk**: when `recursive` is true, iterate `this.children`, find those tagged `ce-stack` that have no explicit `space` attribute, and set the parent's current `space` on them. This is one level deep per flag. Nested stacks propagate further only if they also carry `recursive`.

**Chosen: B — `willUpdate()` DOM walk** for the explicit, inspectable behaviour. Attribute reflection means the result is visible in DevTools. The limitation (one level per flag, children that were added after upgrade do not auto-receive the attribute unless the parent re-renders) is acceptable for a layout primitive and is documented in the API.

Option A (custom property cascade) is a natural future enhancement and could coexist — it could be added as an additional CSS-only mode without breaking Option B.

---

## CDR pre-flight notes

- **CDR-001** (`space` enum has 8 values, exceeding the SHOULD limit of 5): The `space` prop is a SIZE SCALE, not a vocabulary enum — it mirrors the design token ladder (space-1 through space-7 plus the 3xs alias). Size scales routinely have more steps than semantic enums. This is explicitly flagged as a justified deviation.
- **CDR-003**: No per-instance presentation policy booleans. `direction`, `space`, `recursive`, `split-after` are all structural/layout attributes; none encode "bold", "primary", or other policy decisions.
- **CDR-004**: Static-first. All four attributes are optional; `<ce-stack>` with zero attributes produces a sensible vertical flex container with 16px gap.
- **CDR-007**: Zero-attribute usage works; default is `direction=vertical space=m`.
- **CDR-009**: Deterministic DOM. Same attributes + same children ⇒ same rendered output.

---

## Decision 4: merged `ce-cluster` (2026-05-23)

**Context.** The first cut of the generic-primitives proposal shipped `ce-stack` and `ce-cluster` as separate components per Heydon Pickering's Every Layout lineage (Stack = vertical rhythm, Cluster = horizontal wrap with baseline). The self-audit flagged this as catalog bloat: both components are flex containers with a `space` attribute; the only real differences are `flex-wrap: wrap` and the cross-axis default.

**Options weighed:**

A. **Keep both tags** (Heydon's original design). Two mental models, two pieces of API surface to discover.
B. **Merge into ce-stack** with a `wrap` boolean and `align` / `justify` enums. One mental model: "stack things with consistent gap; optionally wrap; optionally align".

**Chosen: B — merge.**

The two were too similar for two tags to earn their keep. The merged ce-stack absorbs cluster's API:

- `wrap` boolean — enables `flex-wrap: wrap`.
- `align="start|center|end|baseline|stretch"` — cross-axis. Default is `stretch` (flex default) when `wrap` is unset, and `center` (cluster-style default) when `wrap` is set. Explicit values always win.
- `justify="start|center|end|between"` — main-axis. Default `start` (flex default).

**Migration.** `<ce-cluster space="s" align="baseline">…</ce-cluster>` becomes `<ce-stack direction="horizontal" wrap space="s" align="baseline">…</ce-stack>`. Both components were `experimental`, so the migration is documented but not deprecation-cycled.

**Trade-off accepted.** The `wrap` attribute reads slightly awkwardly on a "stack" (vertical-rhythm primitive). Lived with for the catalog-size payoff. Reads naturally enough when paired with `direction="horizontal"`.

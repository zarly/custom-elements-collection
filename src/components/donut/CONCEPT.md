# `<ce-donut>` — design rationale

Per [ADR-008](../../../docs/adr/adr-008-component-concept-files.md).

## 2026-05-18 — Legend visibility is policy, not data (CDR-003)

### Context

Plan v2 proposed `auto-legend` as a per-instance boolean attribute. Every donut on the page would carry the same opt-in, every markup author would re-decide the same thing, and document-wide consistency would not exist without a global codemod. CDR-003 calls this out as the anti-pattern.

### Options weighed

| Option | API shape | Pros | Cons |
|---|---|---|---|
| A — per-instance `auto-legend` boolean | `<ce-donut auto-legend …>` × N | Discoverable; LLM emits the flag if shown in examples | 5 instances of the same opt-in on a page; document-level designer has no global knob; CDR-003 anti-pattern verbatim |
| B — pure CSS custom property | `:root { --ce-donut-legend-display: auto }` | Document-wide knob | No per-instance override; rare custom-legend case forces full CSS override |
| C — smart default + CSS var + named slot (**chosen**) | sensible default visible-when-≥2 segments; `--ce-donut-legend-display: auto \| always \| none` for document policy; `slot="legend"` for rare per-instance customisation | All three layers CDR-003 names: (1) sensible default, (2) document-wide CSS var, (3) per-instance slot escape hatch. No new boolean attribute. | Slightly more implementation surface (smart-default branch + CSS-var consumer + slot) |

### Decision

**Option C.** Zero new attributes; the legend just works.

- Default: visible when `values.length ≥ 2`, hidden when single segment (avoids redundancy with `center-label`).
- Document override: `--ce-donut-legend-display: auto | always | none`, read via `@container style()` in the Shadow-DOM stylesheet.
- Per-instance override: named slot `legend` for fully custom markup (annotated, aggregated, or hidden-by-content).

### How the smart default works mechanically

`willUpdate()` toggles a `[data-multi]` attribute on the host based on the live `values.length` after positive-filter. CSS uses `:host(:not([data-multi])) .legend { display: none }` to hide; the `@container style()` rules override either way.

### Consequence

No new boolean attribute. LLM-emitted markup stays minimal (just `values`/`labels`). Theme designers get one knob. Custom-legend authors keep full control via the slot.

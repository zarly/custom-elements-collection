# ADR-003 — Theming via CSS custom properties

**Status:** Accepted

## Context

The library needs:

- One source of truth for colors, spacing, and radii.
- Consumer override without rebuilding the kit.
- A bundled dark + light theme; easy to swap.
- Per-component color tint (e.g. `<ce-kpi color="green">`) without a CSS rebuild.

## Decision

**All theming flows through CSS custom properties named `--ce-*`**, defined in `src/tokens/tokens.css`. Component styles reference them exclusively. Consumers can:

1. **Global override** — set `--ce-bg: #fff` on `:root` or `html`.
2. **Theme swap** — set `data-ce-theme="light"` on `<html>`, which flips the token bundle.
3. **Per-component accent** — `<ce-kpi color="green">` maps to `var(--ce-color-green)` without exposing the raw hex.

## Token taxonomy

```
--ce-bg               page background
--ce-surface          card / panel surface
--ce-surface-2        deeper surface
--ce-border           standard border
--ce-border-soft      subtle divider
--ce-text             primary text
--ce-muted            secondary text
--ce-dim              tertiary text

--ce-color-green      semantic success
--ce-color-red        semantic danger
--ce-color-amber      semantic warning
--ce-color-blue       semantic info
--ce-color-purple     highlight
--ce-color-cyan       accent

--ce-radius-sm        6px
--ce-radius           10px
--ce-radius-lg        14px

--ce-space-1          4px
--ce-space-2          8px
--ce-space-3          12px
--ce-space-4          16px
--ce-space-5          24px
--ce-space-6          32px

--ce-font-sans        system-ui stack
--ce-font-mono        ui-monospace stack
```

## Consequences

- No hardcoded hex in any component source.
- Light/dark swap is a single `html[data-ce-theme]` rule.
- A bundle-level theme change is a single-file edit in `src/tokens/tokens.css`.

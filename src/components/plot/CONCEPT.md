# ce-plot — concept notes

`ce-plot` is the project's general-purpose chart primitive. It supports bar (vertical, horizontal, stacked), line, area, scatter, and combo modes through one shared substrate (scales, hover, legend, axis rendering).

## Lint carve-out (2026-05-23)

This file disables three ESLint size-budget rules at file scope: `max-lines`, `max-lines-per-function`, and `max-depth`. Options weighed before recording the carve-out:

### Option A — split private methods into `src/internal/charts/plot-*.ts` helpers (rejected)

The largest private methods (`#computeYDomain`, `#renderBarsVertical`, `#snapHover`) all read instance state: `this.#visibleSeries`, `this.#xMin/#xMax`, `this.#yMin/#yMax`, the stacked-totals cache, and hover state. Extracting them to free functions means either:

- Threading that state through ~10 positional parameters per call (worse than the `max-params` rule we already enforce); or
- Promoting the state to module-level singletons (breaks multi-instance hosting); or
- Wrapping it in a `PlotContext` object passed everywhere (adds an indirection layer for every read).

None of these clarifies anything — they just move volume from one file to another while making the substrate harder to follow.

### Option B — split by chart variant (rejected)

Even more tempting: a `plot-bars.ts`, `plot-line.ts`, etc. Rejected because the variants share `#visibleSeries`, the y-domain computation, the hover snap geometry, and the legend renderer. Splitting them duplicates the substrate or re-couples them across files. The natural fault line is *substrate vs. paint*, not *variant vs. variant*.

### Option C — file-level eslint-disable + this note (chosen)

The carve-out is documented at the file head and reasoned in this file. The thresholds (`max-lines: 400`, `max-lines-per-function: 100`, `max-depth: 4`) catch organic sprawl in component files that should be smaller; `ce-plot` is the project's heaviest brick by design and was acknowledged as such when ADR-009 (LLM-tolerant components) put generative-UI tools in scope.

This is the same carve-out shape already documented in `docs/decisions/eslint.md` for the `complexity` rule on "QR encoder, parser, scheduler" class code, applied here for size budgets.

### When to revisit

- If a new chart variant (heatmap, sankey, treemap) needs to land — at that point the substrate either generalizes (`PlotEngine` class extracted to `src/internal/charts/`) or the variant gets its own component (`ce-heatmap`). Reopen the option matrix when that decision is on the table.
- If a single private method passes ~200 lines, that's the first signal the substrate has accumulated something extractable that doesn't need full instance state — split *that* method, don't split the file.

## Pointers

- `src/internal/charts/` — shared chart helpers already extracted (color, scale, format, easing, events). Add to this folder before adding more chart-only logic inside `plot.ts`.
- `docs/decisions/eslint.md` — `complexity` row carves out the same algorithm-density case; this file extends the carve-out to size budgets.

# Stylelint per-rule decisions

Stable per-rule fix actions for Stylelint findings. **Apply automatically when the rule appears.** Driven by the [lint-fix protocol](../protocols/lint-fix.md) — Step 3 reads this file; Step 5 writes to it the moment the operator confirms a new decision.

A new rule appears in lint output → the lint-fix protocol checks this file first → if present, apply; if absent, request operator approval per the protocol's Step 4.

**Order:** alphabetical by rule.

| Rule | Severity | Action | Notes | Decided |
|---|---|---|---|---|
| `color-hex-length` | error | **Autofix** via `pnpm lint:css:fix`. Always shortens `#rrggbb` to `#rgb` when equivalent. Safe — purely cosmetic, behavior-preserving. | Only ever fires in `src/tokens/**` (where `color-no-hex` is exempt). Zero judgement required. | 2026-05-23 |
| `color-no-hex` | error | **Three-step decision per hex value.** (1) **Token reuse** — grep `src/tokens/tokens.css` and every `src/tokens/themes/*.css` for a semantic match. If found, replace `#xxxxxx` with `var(--ce-<name>)`. (2) **New token?** If no match, evaluate whether a new token is reasonable (criteria in §"Known gaps & edge cases" below). If yes, add to `src/tokens/tokens.css` AND every theme file with **per-theme semantic values** (not the same hex pasted 11 times), mark as `--ce-candidate-<name>` when usage is still speculative, and declare it in the consuming component's `meta.cssVariables[]` per [ADR-005](../adr/adr-005-component-meta.md). (3) **Keep hex** only when neither (1) nor (2) applies — annotate with `/* stylelint-disable-next-line color-no-hex -- <one-sentence reason> */`. Reason MUST be present; "no reason" is itself a rejection. | See dedicated §"Known gaps & edge cases" below — this rule has 7 named cases that need their own per-occurrence judgment before applying mechanically. | 2026-05-22 |
| `function-url-quotes` | error | **Autofix** via `pnpm lint:css:fix`. Always wraps the URL argument in quotes. Safe — purely cosmetic, behavior-preserving. | Zero judgement required. | 2026-05-23 |
| `property-no-vendor-prefix` | error | **Do NOT autofix.** The autofixer deletes the prefixed property even when the unprefixed sibling is not yet broadly supported, silently breaking Safari rendering. **Action per occurrence:** verify on caniuse.com that the unprefixed property is fully supported in the project's browser-support matrix. If yes → delete the prefix. If no → keep the prefix and disable per line: `/* stylelint-disable-next-line property-no-vendor-prefix -- <browser> requires -webkit- prefix for <property> */`. | Known traps as of 2026: `-webkit-background-clip: text` (still required by Safari ≤ 17), `-webkit-box-decoration-break` (Safari has partial unprefixed support), `-webkit-appearance` on native form controls (still required by Safari/iOS), `-webkit-text-fill-color` (no unprefixed equivalent). When in doubt, keep both declarations and disable the rule. | 2026-05-23 |

---

## Known gaps & edge cases

Per-rule edge cases an agent **must** read before applying the row above. New gaps land here whenever a sweep surfaces a case the existing decision didn't anticipate. The lint-fix protocol [§Step 4](../protocols/lint-fix.md#4--present-residual-stats-for-not-in-table-rules) requires the agent to surface any new edge case to the operator *before* recording the decision.

### `color-no-hex`

These are deliberate limits on the three-step decision above. When any apply, **stop and surface to the operator** — do not act mechanically.

1. **Hex inside `html\`\`` templates is invisible to Stylelint.** The Stylelint config parses `css\`\`` blocks via `postcss-lit`; hex values inside `<svg fill="#22c55e">` or `style="background:#ff0"` *inside Lit's `html\`\``* are not caught here. The rule applies only to detected violations; a corpus-wide "no hex in JSX" sweep needs ESLint with `no-restricted-syntax` on `TemplateLiteral` content or a separate grep — currently neither exists. **Action:** note this in the sweep report; do not claim "all hex eliminated" after applying.

2. **Alpha-channel hex (`#22c55e80`, `#000a`).** The existing token surface has limited alpha-aware tokens (e.g. `--ce-color-blue-bg`). A hex with alpha rarely maps cleanly; introducing every alpha variant as a token bloats `:root` past CDR-003's spirit. **Default:** prefer `rgb(from var(--ce-color-X) r g b / <alpha>)` (CSS Color 5) when supported, else add a single semantic alpha-token like `--ce-overlay-50`. Discuss before adding more than 2 alpha tokens per sweep.

3. **Multi-theme semantic mismatch.** The same hex doesn't carry the same meaning across 11 themes (`bauhaus`, `dark`, `gruvbox`, `light`, `memphis`, `muji`, `neo-brutal`, `nordic`, `solarized`, `swiss`, `tokens` base). A *new* token MUST get a per-theme value chosen for that theme's palette — never paste the same hex into all 11 files. If the per-theme audit isn't possible (operator unavailable, theme palette undocumented), keep the hex with a `-- pending per-theme palette decision` comment instead.

4. **Chart-series palettes.** Components like `ce-bar-chart`, `ce-donut`, `ce-plot` need 5-12 distinct, sequence-stable colors. Adding individual tokens (`--ce-series-1`, `--ce-series-2`, …) crosses the CDR-003 boundary into per-component CSS-var sprawl. **Default:** route to a single palette-array convention (e.g. `--ce-series` as a comma-separated list, parsed at runtime) or accept hex with `-- chart series palette` reason. Discuss before adopting either path corpus-wide.

5. **Brand-identity hex in examples.** When a component example uses an external brand color (GitHub green, Discord blurple, a specific client's brand for a landing demo), that hex is *not* a token candidate — it's identity, not theme. **Action:** keep with `-- brand identity, not theme-mappable` reason. Never invent `--ce-color-github`.

6. **"Reasonable to add" threshold.** Criteria for promoting a hex to a token: (a) the color expresses a **semantic role** (success / warning / surface / accent / muted), not a one-off shade; AND (b) ≥2 components plausibly want it OR ≥2 occurrences exist today. If only 1 component uses it and the semantic role is fuzzy, keep the hex. Be honest: don't manufacture future-component justifications.

7. **ADR-005 drift trap.** Every new `--ce-*` token added to themes MUST also appear in the consuming component's `meta.cssVariables[]` array. Forgetting this lands a token in the bundle that's invisible to the registry, the skill catalog, and downstream consumers. **Action:** for every new token, the same PR updates the meta file(s); `pnpm validate-meta` catches the missing declaration if the meta declares the var.

If any of the seven cases fire during a sweep, the lint-fix protocol's Step 4 conversation MUST happen for that occurrence — even when the rule is already in the table.

---

## How rows land here

1. `pnpm lint:css` surfaces a new rule.
2. Lint-fix protocol Step 4 presents the stats + a proposed action to the operator.
3. Operator confirms, modifies, or rejects.
4. Lint-fix protocol Step 5 adds a row here with the agreed action, today's date.
5. Next session reads this file and applies without asking.

## Editing rules

- **Add a row** the moment the operator gives a per-rule decision.
- **Update a row** if the policy changes — bump the `Decided` date, keep one row per rule.
- **Soft-deprecate** by adding a `~~strikethrough~~` note and pointing to the replacement row — never delete history.

## Related

- [`../protocols/lint-fix.md`](../protocols/lint-fix.md) — the protocol that consumes this file.
- [`../../stylelint.config.mjs`](../../stylelint.config.mjs) — the rule set definitions and project-specific severity assignments.
- [`eslint.md`](eslint.md) — sibling file for ESLint rules.
- [`../adr/adr-003-theming.md`](../adr/adr-003-theming.md) — `--ce-*` token discipline enforced by `color-no-hex`.
- [`../adr/adr-001-framework-choice.md`](../adr/adr-001-framework-choice.md) — no-runtime-deps enforced by `at-rule-disallowed-list: [import]`.

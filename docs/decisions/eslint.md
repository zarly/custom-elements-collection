# ESLint per-rule decisions

Stable per-rule fix actions for ESLint findings. **Apply automatically when the rule appears.** Driven by the [lint-fix protocol](../protocols/lint-fix.md) — Step 3 reads this file; Step 5 writes to it the moment the operator confirms a new decision.

A new rule appears in lint output → the lint-fix protocol checks this file first → if present, apply; if absent, request operator approval per the protocol's Step 4.

**Order:** alphabetical by rule.

| Rule | Severity | Action | Notes | Decided |
|---|---|---|---|---|
| `@typescript-eslint/consistent-type-imports` | warn | **Autofix** via `pnpm lint:ts:fix`. Always rewrites `import { TypeOnly }` to `import type { TypeOnly }` when every binding is type-only. Safe — purely a syntactic refactor; zero runtime impact and shaves a hair off the type-checking graph. | Zero judgement required. | 2026-05-23 |
| `@typescript-eslint/no-explicit-any` | warn | **Replace `any` with a proper type.** First narrow with the concrete type if known (event payload, DOM node subclass, JSON shape). If the function is genuinely polymorphic, introduce a generic parameter (`<T extends …>`). If the input is truly opaque (third-party untyped data, JSON.parse output), use `unknown` plus a narrowing guard at the call site. Never add `// eslint-disable-next-line @typescript-eslint/no-explicit-any`. | Each `any` erases a type-system invariant that the rest of the codebase silently relies on. The three-step preference (concrete > generic > `unknown` + guard) keeps inference flowing into callers. If a fourth-party type definition forces `any` across the API boundary, isolate it in a `as` cast on a single line with a `// reason: <upstream-package> typed it as any` comment — the cast contains the damage. | 2026-05-23 |
| `@typescript-eslint/no-unused-vars` | error | **Delete the unused symbol entirely** — function, variable, import, parameter. Default action for dead code surfaced by this rule. For *genuinely intentional* unused function args or catch params (signature dictated by an external contract — event handler shape, callback prototype, etc.), rename with a leading underscore (`_e`, `_unused`) so ESLint's default `argsIgnorePattern: "^_"` and `caughtErrorsIgnorePattern: "^_"` skip them. Never add `// eslint-disable-next-line @typescript-eslint/no-unused-vars`. | The rule is a dead-code detector; the cheapest correct answer is removal. The underscore-prefix escape hatch is only for callable shapes where the parameter must exist but the body legitimately ignores it. If the symbol looks like ready-to-wire scaffolding, that's still dead code today — either wire it in the same change or delete it; do not leave it stranded behind a disable comment or a `void _` no-op. | 2026-05-26 |
| `complexity` | warn | **Refactor** the function: extract helpers, simplify branching, reduce control-flow paths until ≤ 15. Never add `// eslint-disable complexity`. | Safe refactoring only — preserve behaviour, do not change observable output. If the algorithm is inherently complex (e.g. QR encoder, parser, scheduler) and refactoring would obscure rather than clarify, surface as a PR-comment proposal before refactoring; never silently suppress. | 2026-05-22 |
| `max-params` | warn | **Replace the positional parameter list with a single options object.** Update the signature to `fn({ a, b, c, … }: Options)`, define an `interface` or `type Options = { … }` next to the function, then grep every caller and migrate them to named-property invocation in the same change. Never add `// eslint-disable-next-line max-params`. | The options-object refactor improves readability at the call site and removes positional-argument confusion (especially the `boolean, boolean, boolean` trap). Required vs. optional members of the type should match the previous required vs. defaulted parameter shape — do not silently make required params optional during the refactor. Run `pnpm typecheck` after the migration; the compiler will catch any caller you missed. | 2026-05-23 |
| `no-console` | error | **Drop** the offending `console.*` line entirely. Never add `// eslint-disable-next-line no-console`. | Per [ADR-013](../adr/adr-013-safety-contract.md) console policy. The console channel must stay quiet so real errors surface; suppressing the rule defeats the goal. If the call is the rare *"unrecoverable invariant"* exception named in ADR-013 §"Console policy", refactor so the failure surfaces through a `data-ce-error` attribute or a thrown exception instead — never a `console.*` call. | 2026-05-22 |

> **Empty rows below this line.** Every rule not in the table needs a Step 4 conversation the first time it surfaces in `pnpm lint:ts`.

---

## How rows land here

1. `pnpm lint:ts` surfaces a new rule.
2. Lint-fix protocol Step 4 presents the stats + a proposed action to the operator.
3. Operator confirms, modifies, or rejects.
4. Lint-fix protocol Step 5 adds a row here with the agreed action, today's date.
5. Next session reads this file and applies without asking.

## Editing rules

- **Add a row** the moment the operator gives a per-rule decision.
- **Update a row** if the policy changes — bump the `Decided` date, keep one row per rule.
- **Soft-deprecate** by adding a `~~strikethrough~~` note and pointing to the replacement row — never delete history.
- **Move a rule** from `warn` to `error` (or vice-versa) — that's a policy change; update both the eslint.config.mjs severity AND this row's `Severity` column, bump the date.

## Related

- [`../protocols/lint-fix.md`](../protocols/lint-fix.md) — the protocol that consumes this file.
- [`../../eslint.config.mjs`](../../eslint.config.mjs) — the rule set definitions and project-specific severity assignments.
- [`stylelint.md`](stylelint.md) — sibling file for Stylelint rules.
- [`../adr/adr-013-safety-contract.md`](../adr/adr-013-safety-contract.md) — the safety floor the `no-restricted-syntax`, `no-restricted-imports`, `no-console`, `no-eval` rules enforce.

# Lint-fix protocol

How to handle ESLint or Stylelint findings surfaced by `pnpm lint`, `pnpm lint:ts`, or `pnpm lint:css`. The two tools share one workflow — the only thing that changes is which namespace a rule belongs to. The **decisions files** in [`docs/decisions/`](../decisions/) are the single source of truth for what to do per rule:

- [`docs/decisions/eslint.md`](../decisions/eslint.md) — ESLint rule decisions.
- [`docs/decisions/stylelint.md`](../decisions/stylelint.md) — Stylelint rule decisions.

## When to run

- `pnpm check` failed at the `lint` step.
- `pnpm lint`, `pnpm lint:ts`, or `pnpm lint:css` returned non-zero on a direct run.
- The operator asks to *"fix lint warnings"* or *"clean up lint"*.
- The operator asks *"what are the lint findings?"* and wants the per-rule breakdown.

Not for: cosmetic format-only sweeps (use `pnpm lint:fix` directly — auto-fixable rules don't go through this protocol).

## Stop conditions

Stop the loop and escalate **only** when:

- A rule type is **not** in the decisions table AND the operator has not yet given direction in this session — ask, don't guess.
- A fix would touch a generated file (`src/entries/*`, `src/auto.ts`, `src/index.ts`, `src/manifest*.ts`) — fix the generator or the source instead.
- Auto-fix (`pnpm lint:fix`) reports a remaining error after running — present the residual stats and ask.
- A proposed refactor would change observable behaviour rather than just shape — ask before refactoring.

Everything else is part of the normal loop.

## The protocol

### 0 — Run lint and capture the raw output

```
pnpm lint:ts 2>&1 | tee /tmp/lint-ts.log
pnpm lint:css 2>&1 | tee /tmp/lint-css.log
```

Both should be captured even if one passes — the table covers both tools.

### 1 — Group by rule and count

For each tool, group every finding by `rule` name and count occurrences. Sort by (severity desc, count desc). Build the stats table:

| Rule | Tool | Severity | Count | Sample location |
|---|---|---|---|---|
| `no-console` | eslint | error | 6 | `src/core/json-prop.ts:42` |
| `color-no-hex` | stylelint | error | 50+ | `src/components/tabs/tabs.ts:102` |
| `complexity` | eslint | warn | 8 | `src/components/qr/qr.ts:195` |

This is the **stats view** the operator gets when more than one rule has findings.

### 2 — Categorize each rule

For each finding, look the rule up in the relevant decisions file:

- ESLint rules → [`docs/decisions/eslint.md`](../decisions/eslint.md)
- Stylelint rules → [`docs/decisions/stylelint.md`](../decisions/stylelint.md)

Split into two buckets:

- **In decisions file** — the rule has a documented action. Apply it without asking.
- **Not in decisions file** — collect for operator review.

### 3 — Apply documented actions

For every rule with a documented decision, run the action:

- Read the **Action** column literally. If it says *"Drop the line"*, drop the line. Don't add `// eslint-disable`, don't refactor more than the action says, don't expand scope.
- **Read the rule's `Known gaps & edge cases` subsection in the same decisions file.** Each named edge case is a hard checkpoint — when the case fires for a specific occurrence, **stop and surface it to the operator** even though the rule is "in table". The table is the *default*; the edge-case list is the *escape hatch* that prevents silent damage.
- Group changes by component so each PR / commit stays focused.
- Re-run the same lint command after every batch — the rule's count must drop to zero (or to the documented residual, if any).

### 4 — Present residual stats for not-in-table rules

For each rule **not yet in the table**, present:

- Rule name + tool
- Count + severity
- 1–3 sample `file:line` locations (representative, not exhaustive)
- A **proposed action**, clearly marked `PROPOSED — awaiting approval`
- One sentence of reasoning behind the proposal
- **Known gaps and danger edge cases** — an explicit, named list of every situation the proposed action does *not* cleanly cover (multi-theme semantic mismatch, alpha channels, brand-identity cases, parser blind spots, etc.). Surface them up-front so the operator's feedback covers them; never bury edge cases in prose. If you can think of zero, say *"no edge cases identified"* explicitly — silence on this line is forbidden.

Then **wait for the operator's decision per rule**. The operator may:

- Accept the proposal verbatim
- Modify it ("yes but also …", "no, use … instead")
- Reject it (in which case the rule stays as-is and a one-line `// eslint-disable-…` with reason is the documented fallback)
- Add or amend edge cases ("you missed the SVG fill case — handle it like…")

### 5 — Write the decision into the right file

The moment the operator gives a per-rule decision, add a row to the matching decisions file:

- ESLint rule → append to [`docs/decisions/eslint.md`](../decisions/eslint.md)
- Stylelint rule → append to [`docs/decisions/stylelint.md`](../decisions/stylelint.md)

Required columns: `Rule`, `Severity`, `Action`, `Notes`, `Decided`. Use today's date in `YYYY-MM-DD`. Keep rows alphabetical by rule name.

**Also record every edge case** that came up in Step 4 — both the ones the operator addressed and the ones still open. Append them to a per-rule subsection under the file's `## Known gaps & edge cases` section (create the heading if first time). The next agent reading the row picks up the *qualifiers* too, not just the headline action. An "Open question / not resolved" edge case is a valid entry; it is the absence of an entry that is dangerous.

**Next session reads the decisions file (table + edge cases) and skips Steps 4–5 for those rules.** This is the whole point of the protocol — operator time is not paid twice for the same decision.

### 6 — Apply, re-run, confirm

After all in-table actions are applied:

- Re-run `pnpm lint:ts` and `pnpm lint:css`.
- For each rule the protocol acted on, the count must be `0` (or the documented residual, e.g. warn-level rules that survive as advisory).
- Report the before / after stats to the operator.
- If anything regressed, surface the regression and stop.

### 7 — Final summary back to the operator

End with a tight table: rule → before → after → action taken. No prose narration of every file changed; the diff has that. Operator scans the table and confirms.

---

## Related

- [`docs/adr/adr-013-safety-contract.md`](../adr/adr-013-safety-contract.md) — defines the safety rules ESLint enforces (no `innerHTML`, no `eval`, no `unsafeHTML`, console policy).
- [`docs/adr/adr-014-streaming-lifecycle.md`](../adr/adr-014-streaming-lifecycle.md) — defines the streaming-conformance lint surface.
- [`docs/adr/adr-003-theming.md`](../adr/adr-003-theming.md) — defines the `--ce-*` token discipline Stylelint enforces.
- [`docs/protocols/pre-release.md`](pre-release.md) — runs `pnpm check` (which runs this protocol's lint commands) before a release.
- [`stylelint.config.mjs`](../../stylelint.config.mjs) — the Stylelint rule set.
- [`eslint.config.mjs`](../../eslint.config.mjs) — the ESLint rule set.

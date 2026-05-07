# ADR-008 — Per-component CONCEPT.md for design rationale

**Status:** Accepted (2026-05-07).

## Context

The library now ships 72 components with rich `*.meta.json` descriptors covering identity, props, events, slots, CSS variables, and the dependency graph. The meta is excellent at answering *"what does this component expose?"* but it cannot answer *"why was it built this way and not another?"*

Three forces motivate this gap closing:

1. **Repeated debates.** When a contributor (human or agent) revisits a component months later, they re-litigate decisions that were already settled — adding props that were considered and rejected, switching a token that was deliberately chosen, or "fixing" a quirk that is actually load-bearing. The reasoning behind decisions evaporates between sessions.

2. **No good place for the *why*.** Source comments rot and bias toward the *what*. Commit messages are low-signal and scroll out of memory. ADRs are too heavyweight for component-scoped decisions and too coarse-grained — ADRs cover repo-wide architecture, not why `ce-gauge`'s track stroke is `--ce-surface-3`. The meta JSON is a closed schema that doesn't accept prose. PR descriptions disappear after merge. None of these channels survive contact with a six-month-old codebase.

3. **Agents need it more than humans do.** A human contributor can usually read the source and reconstruct intent. An agent given a brief like *"make the gauge cleaner"* will rebuild from priors that are wrong for this component (e.g. "remove the optional target tick — only one visual element" — which discards a deliberate dashboard pattern). Without a captured rationale, every agent run starts from zero and may overwrite decisions silently.

The signal that prompted formalization: a single conversation with `ce-gauge` produced five separate non-trivial design decisions (light vs Shadow DOM choice, target tick rationale, tooltip mechanism, track contrast token, semantic-color authoring model) plus one closed bug worth never repeating. None of those would survive in the meta, the source, or the commit log alone.

## Decision

Each component folder MAY contain a sibling `CONCEPT.md` capturing design rationale. The file is **prose, optional, and tracked in git**.

```
src/components/<name>/
  <name>.ts             source            (canonical implementation)
  <name>.test.ts        tests             (canonical behavior contract)
  <name>.meta.json      meta              (canonical API spec)
  <name>.examples.html  examples          (canonical reference usage)
  CONCEPT.md            design rationale  (canonical "why")            ← this ADR
```

### Format

`CONCEPT.md` is **not schema-validated**. It is prose meant for humans and agents. A loose recommended structure (followed by `src/components/gauge/CONCEPT.md` as the reference implementation):

1. **What this component is for** — one paragraph stating purpose and what it deliberately is *not*. Names sibling components that handle adjacent jobs.
2. **Decisions** — a short numbered list (D1, D2, …). Each decision states the question, options considered (with the trade-off in one line each), the chosen option, and the *why*. Past tense.
3. **Edge cases** — a small table of inputs at the boundaries and what the component does (cross-references the test that covers each row).
4. **Closed bug history** — one line per past bug worth not repeating, with date and the lesson generalized.
5. **Open questions / deferred** — explicitly named non-decisions with the trigger that would re-open them.
6. **Related** — pointers to ADRs, sibling components, relevant skills.

The structure is a guide, not a contract. Skip sections that are empty rather than padding them.

### When to write or update

- **Create** when a non-trivial design decision is made — anything where you'd answer "why?" with more than one sentence, or where you considered ≥2 options.
- **Append** when a new decision lands, a closed-bug lesson is worth preserving, or an open question gets resolved.
- **Edit existing entries** when the rationale changes (don't overwrite history — note the date of the new thinking and what changed).
- **Skip entirely** when the component is mechanically obvious — most `tier: layout` components and many `tier: brick` components don't need one.

### When to consult

Required before non-trivial changes to a component that has a `CONCEPT.md`. Required for agents instructed to "improve", "simplify", or "rethink" a component — the file is the first defense against silently undoing past decisions.

### Distribution

`CONCEPT.md` is **never published**. It is gated by `package.json` `files: ["dist", "README.md", "LICENSE"]` — only `dist/` ships, so any source-tree file is excluded by default. No additional `.npmignore` or build-step exclusion needed.

It is **always tracked in git**. This is the whole point — the rationale needs to outlive the session that produced it.

### Validation

No schema, no CI gate, no `pnpm check` step. Adding validation would create authoring friction that defeats the goal — the file should be cheap to write and easy to update. The only enforcement is the social one: PRs that change a component's design without touching its `CONCEPT.md` (when one exists) should be questioned in review.

### What it is NOT

- **Not a changelog.** Changelogs answer *"what changed and when?"* — the git log already does that. `CONCEPT.md` answers *"why does it work this way?"*
- **Not the API spec.** The meta file is canonical for props/events/slots/CSS variables. `CONCEPT.md` references the meta but never duplicates it.
- **Not an ADR.** ADRs are repo-wide. `CONCEPT.md` is component-scoped. Reach for an ADR when a decision affects the framework, the build, the publish format, or the convention itself.
- **Not a `TODO.md`.** Open questions go here only when they are *deferred design decisions* — speculative work belongs in `internal/NOTES.md`.
- **Not duplicated content from CONTRIBUTING.md.** General contribution guidance lives in `CONTRIBUTING.md`. `CONCEPT.md` is component-specific only.

## Consequences

**Positive.**
- Design rationale survives across sessions, contributors, and agents.
- Reduces the same conceptual problem being re-solved differently each time someone touches the file.
- Cheap to author (no schema), cheap to read (prose), cheap to ship (excluded from npm by default).
- Gives agents a deterministic place to look before "improving" something — reduces silent regressions.

**Negative.**
- Adds a (light) authoring obligation when a component has a non-trivial design choice.
- Files can drift from the implementation if not updated — no enforcement gate.
- Can become a dumping ground if the structure is ignored.

**Mitigations.** The reference implementation (`src/components/gauge/CONCEPT.md`) sets the bar for what *good* looks like. New components without complex rationale don't need one — keeping the average quality high. Drift is acceptable because *some* documented rationale is dramatically better than none, even if dated.

## Reference implementation

`src/components/gauge/CONCEPT.md` — written 2026-05-07 alongside this ADR, captures the design rationale that emerged from a single review session: tick-mark intent, track contrast, tooltip mechanism, color model, light-vs-shadow DOM choice, plus the SVG large-arc-flag bug lesson.

Other components MAY adopt the format incrementally — there is no migration sweep. Add a `CONCEPT.md` when you next touch a component and find yourself making a real design decision.

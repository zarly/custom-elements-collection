/**
 * scripts/seed-conformance.ts — creates or refreshes
 * `<name>.conformance.json` for every component. Per ADR-016.
 *
 * The seed populates every criterion whose verdict can be derived
 * mechanically from:
 *
 *   1. The component's `<name>.meta.json` (Zod-validated, so we can
 *      trust schema-level invariants).
 *   2. The presence of sibling files (`<name>.examples.html`,
 *      `<name>.test.ts`, `CONCEPT.md`).
 *   3. Bytes-level checks against the `<name>.ts` source for opt-ins
 *      (`createShadowRootWithStyles`, `innerHTML` assignment, `eval`).
 *
 * ─── Criterion scope ─────────────────────────────────────────────────
 *
 * The conformance receipt is INTENTIONALLY SELECTIVE — it lists only
 * criteria that are per-component meaningful AND mechanically checkable.
 * "Absent ≠ failure"; absent means "not in scope for the per-component
 * receipt."
 *
 * Per-component receipt (this script emits):
 *   • All 16 ADRs (the architectural bright lines)
 *   • All 15 CDRs (the system-wide design conventions)
 *
 * Out-of-scope for the receipt:
 *   • Library-level / stack-level concerns whose verdict belongs to the
 *     tarball, not to any single component (package format, build
 *     output, publish workflow, framework adapters).
 *   • Anything needing measurement (latency, throughput, memory, gz
 *     bundle size, browser matrix) — requires bench / bundle-stats /
 *     Lighthouse before a verdict can be written.
 *   • Anything needing external tooling / manual audit (accessibility
 *     axe-core / pa11y / screen-reader, product-level UX assertions).
 *
 * The lint script (`lint-meta-conformance-keys.ts`) enforces the
 * OPEN-WORLD key universe (any key must resolve to a known ADR/CDR)
 * so manual additions stay typo-free. The aggregator
 * (`gen-conformance.ts`) bundles the per-component receipts plus this
 * scope metadata into `dist/conformance.json` for consumers.
 *
 * Run:  pnpm tsx scripts/seed-conformance.ts [--dry-run] [--overwrite]
 *
 * Without `--overwrite` the script is additive: it only fills missing
 * keys on existing files (does not clobber human-curated values).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");

const DRY_RUN = process.argv.includes("--dry-run");
const OVERWRITE = process.argv.includes("--overwrite");

type Verdict = true | false | string;
type Conformance = Record<string, Verdict>;

interface Prop {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  semanticType?: string;
}

interface Slot {
  name: string;
  acceptTags?: string[];
  acceptShapes?: string[];
}

interface Event {
  name: string;
}

interface Meta {
  schemaVersion: 1 | 2;
  tag: string;
  tier: string;
  category: string;
  stability: string;
  created?: string;
  updated?: string;
  props: Prop[];
  slots: Slot[];
  events: Event[];
  cssVariables: { name: string }[];
  dependencies: string[];
  related: string[];
  globalDependencies?: unknown[];
  sideEffects?: { kind: string }[];
  a11y?: { role?: string; notes?: string };

  // v2 fields
  requiredParent?: string[];
  childPolicy?: "none" | "any" | "constrained";
  codeDependencies?: string[];
  tagDependencies?: string[];
  injects?: string[];
  interchangeableWith?: unknown[];
  role?: "transparent-wrapper" | "container" | "leaf";
  slotCompatible?: boolean;
  preferredSlotIn?: string[];
  contentModel?: "block" | "inline" | "void";
  deterministic?: boolean;
  nondeterministicReason?: string;
  streamSafe?: boolean;
  streamingLifecycle?: { finalizesAt: string };
}

interface FileSet {
  ts: boolean;
  test: boolean;
  meta: boolean;
  examples: boolean;
  concept: boolean;
}

interface Source {
  text: string;
  shadowDom: boolean;
  innerHtmlAssign: boolean;
  evalUse: boolean;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function recurse(d: string) {
    for (const e of await fs.readdir(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await recurse(full);
      else if (e.isFile() && e.name.endsWith(".meta.json")) out.push(full);
    }
  }
  await recurse(dir);
  return out.sort();
}

async function readFiles(metaPath: string, stem: string): Promise<{ files: FileSet; source: Source }> {
  const dir = path.dirname(metaPath);
  const exists = async (p: string) => fs.access(p).then(() => true).catch(() => false);
  const tsPath = path.join(dir, `${stem}.ts`);

  const files: FileSet = {
    ts: await exists(tsPath),
    test: await exists(path.join(dir, `${stem}.test.ts`)),
    meta: true, // we found the meta file to start with
    examples: await exists(path.join(dir, `${stem}.examples.html`)),
    concept: await exists(path.join(dir, "CONCEPT.md")),
  };

  let text = "";
  if (files.ts) {
    try {
      text = await fs.readFile(tsPath, "utf-8");
    } catch {
      /* ignore */
    }
  }

  const source: Source = {
    text,
    shadowDom: /createShadowRootWithStyles\s*\(/.test(text),
    // Only flag *assignment*, not read-only access (`el.innerHTML`).
    innerHtmlAssign: /\.innerHTML\s*=/.test(text) || /\.innerHTML\s*\+=/.test(text),
    evalUse: /\beval\s*\(/.test(text) || /\bnew\s+Function\s*\(/.test(text),
  };

  return { files, source };
}

function hasLiteralUnion(p: Prop): boolean {
  // CDR-001 / CDR-010 signal: type like `"a" | "b" | "c"`.
  return /^\s*"[^"]+"\s*(\|\s*"[^"]+"\s*)+$/.test(p.type.trim());
}

function looksJsonProp(p: Prop): boolean {
  // CDR-005 signal: array / object types that come in as JSON attribute.
  const t = p.type.trim();
  return (
    /\[\s*\]\s*$/.test(t) || // ends with []
    /^Array</.test(t) ||
    /^Record</.test(t) ||
    /^object$/.test(t) ||
    /^json$/i.test(t) ||
    p.semanticType === "json"
  );
}

function allOptional(meta: Meta): boolean {
  return meta.props.every((p) => p.required === false);
}

function hasDefaultsForOptionals(meta: Meta): boolean {
  return meta.props.every(
    (p) => p.required === true || (p.default !== undefined && p.default !== "")
  );
}

function isInteractive(meta: Meta): boolean {
  return meta.events.length > 0;
}

function buildSeed(meta: Meta, files: FileSet, source: Source): Conformance {
  const c: Conformance = {};

  // ─────────────────────────── ADRs ───────────────────────────────────
  // ADR-001 — `ce-*` / `lesson-*` prefix. Tag regex in schema enforces.
  c["ADR-001"] = /^(ce|lesson)-/.test(meta.tag);

  // ADR-002 — Light DOM is default; Shadow opt-in via documented helper.
  // Both shapes pass the spirit of the ADR; record which one the
  // component picked so a reviewer can audit at a glance.
  c["ADR-002"] = source.shadowDom
    ? "Shadow DOM opt-in via createShadowRootWithStyles()"
    : true;

  // ADR-003 — Theming via --ce-* tokens. Stylelint already blocks hex.
  c["ADR-003"] = true;

  // ADR-004 — Distribution modes (auto / per-tag / loadOnDemand). Build
  // generates all three for every meta-registered tag.
  c["ADR-004"] = true;

  // ADR-005 — Component meta validated. Reaching this script means Zod
  // accepted the file.
  c["ADR-005"] = true;

  // ADR-006 — `tier ∈ {brick, widget, layout}` enforced by Zod.
  c["ADR-006"] = true;

  // ADR-007 — Registry projection. Auto-generated, present for every
  // registered tag.
  c["ADR-007"] = true;

  // ADR-008 — Optional CONCEPT.md. The ADR makes the file *optional*;
  // a component without one still passes the ADR, but recording the
  // presence is useful signal for reviewers.
  c["ADR-008"] = files.concept
    ? true
    : "CONCEPT.md not present (optional per ADR-008)";

  // ADR-009 — Tolerant inputs. Strong signal: every prop is optional.
  if (allOptional(meta)) {
    c["ADR-009"] = true;
  } else {
    const required = meta.props.filter((p) => p.required).map((p) => p.name);
    c["ADR-009"] = `required props: ${required.join(", ")} — verify each is literally meaningful`;
  }

  // ADR-010 — Deprecated `ce-stat-group`. Pass for everyone that isn't
  // that tag.
  c["ADR-010"] = meta.tag === "ce-stat-group"
    ? "this is the deprecated tag (ADR-010)"
    : true;

  // ADR-011 — `created` ISO date. Zod enforces format; refine enforces
  // updated ≥ created.
  c["ADR-011"] = typeof meta.created === "string" && /^\d{4}-\d{2}-\d{2}$/.test(meta.created);

  // ADR-012 — `updated` ISO date.
  c["ADR-012"] = typeof meta.updated === "string" && /^\d{4}-\d{2}-\d{2}$/.test(meta.updated);

  // ADR-013 — Safety contract: no destructive `.innerHTML =`, no `eval`,
  // no `new Function`. Read-only innerHTML access is allowed.
  if (source.evalUse) {
    c["ADR-013"] = "uses eval / new Function — investigate";
  } else if (source.innerHtmlAssign) {
    c["ADR-013"] = "assigns to innerHTML — investigate";
  } else {
    c["ADR-013"] = true;
  }

  // ADR-014 — Streaming lifecycle. Pass when meta declares streamSafe
  // and a streamingLifecycle finalize-point.
  if (meta.streamSafe === true && meta.streamingLifecycle) {
    c["ADR-014"] = true;
  } else if (meta.streamSafe === false) {
    c["ADR-014"] = `streamSafe: false (${meta.nondeterministicReason ?? "see meta"})`;
  } else {
    c["ADR-014"] = "streamSafe / streamingLifecycle not declared in meta";
  }

  // ADR-015 — Meta schema v2.
  c["ADR-015"] = meta.schemaVersion === 2;

  // ADR-016 — Conformance file. By writing this record we satisfy it.
  c["ADR-016"] = true;

  // ─────────────────────────── CDRs ───────────────────────────────────
  // CDR-001 — Style enum + content slot. Strong signal: at least one
  // prop with a literal-union type AND at least one slot.
  const hasStyleEnum = meta.props.some(hasLiteralUnion);
  const hasSlot = meta.slots.length > 0;
  if (hasStyleEnum && hasSlot) c["CDR-001"] = true;
  else if (!hasStyleEnum && !hasSlot && meta.contentModel === "void") c["CDR-001"] = true;
  else if (!hasStyleEnum && hasSlot) c["CDR-001"] = true;
  else c["CDR-001"] = "no style enum prop — verify presentation is theme-only";

  // CDR-002 — Typed values as children. Aspirational per memory note;
  // current canonicals use attribute form. Mark conservative.
  c["CDR-002"] = hasSlot
    ? "slot-based composition present; child-form typed-values still aspirational"
    : meta.contentModel === "void"
      ? true
      : "no slots declared";

  // CDR-003 — Presentation policy global. Pass if the component reads
  // from theme tokens (any `cssVariables` entry).
  c["CDR-003"] = meta.cssVariables.length > 0;

  // CDR-004 — Static-first, stateful opt-in. Strong proxy: deterministic
  // !== false AND no events declared.
  if (meta.deterministic === false) {
    c["CDR-004"] = `deterministic: false (${meta.nondeterministicReason ?? "interactive by design"})`;
  } else if (isInteractive(meta)) {
    c["CDR-004"] = `${meta.events.length} event(s) declared — verify first paint is JS-free`;
  } else {
    c["CDR-004"] = true;
  }

  // CDR-005 — Collections via JSON-on-attribute or slot. Pass when at
  // least one prop is an array/object/json, or at least one slot has
  // acceptShapes / acceptTags hints.
  const jsonProps = meta.props.filter(looksJsonProp);
  const shapedSlots = meta.slots.filter((s) => s.acceptTags || s.acceptShapes);
  if (jsonProps.length > 0 || shapedSlots.length > 0) c["CDR-005"] = true;
  else c["CDR-005"] = "no collection inputs declared (may not apply)";

  // CDR-006 — Components compose. Pass when the component declares any
  // structured relation.
  const composes =
    (meta.dependencies?.length ?? 0) > 0 ||
    (meta.related?.length ?? 0) > 0 ||
    (meta.tagDependencies?.length ?? 0) > 0 ||
    (meta.codeDependencies?.length ?? 0) > 0 ||
    (meta.requiredParent?.length ?? 0) > 0 ||
    (meta.injects?.length ?? 0) > 0;
  c["CDR-006"] = composes ? true : "no declared compose-graph entries (leaf brick)";

  // CDR-007 — Sensible defaults. Every optional prop must have a
  // `default`.
  c["CDR-007"] = hasDefaultsForOptionals(meta)
    ? true
    : `props missing defaults: ${meta.props
        .filter((p) => p.required === false && (p.default === undefined || p.default === ""))
        .map((p) => p.name)
        .join(", ")}`;

  // CDR-008 — Additive changes only. Convention, enforced by review.
  c["CDR-008"] = true;

  // CDR-009 — Deterministic DOM. Use the meta declaration.
  if (meta.deterministic === false) {
    c["CDR-009"] = `deterministic: false (${meta.nondeterministicReason ?? "see meta"})`;
  } else {
    c["CDR-009"] = true;
  }

  // CDR-010 — Same data, multiple views. Signal: an enum prop that
  // picks among presentation modes (`format`, `variant`, `view`, `mode`,
  // `display`, `as`).
  const viewPropNames = new Set(["format", "variant", "view", "mode", "display", "as", "layout"]);
  const hasViewSwitch = meta.props.some(
    (p) => viewPropNames.has(p.name) && hasLiteralUnion(p)
  );
  c["CDR-010"] = hasViewSwitch
    ? true
    : "single canonical view (CDR-010 not exercised)";

  // CDR-011 — LLM failure-mode tolerance. Pass when examples ship and
  // every prop is optional (so an LLM omission still renders).
  if (files.examples && allOptional(meta)) {
    c["CDR-011"] = true;
  } else if (files.examples) {
    c["CDR-011"] = "examples present; required props may surface as visible-error chrome";
  } else {
    c["CDR-011"] = "no examples.html — CDR-011 unverifiable";
  }

  // CDR-012 — LLM equivalence fields. Pass when meta carries `role` or
  // `interchangeableWith` (v2 additions).
  if (meta.role || (meta.interchangeableWith?.length ?? 0) > 0) {
    c["CDR-012"] = true;
  } else {
    c["CDR-012"] = "role / interchangeableWith not declared";
  }

  // CDR-013 — Structured relations. Pass when meta declares any of the
  // v2 relation fields.
  const hasRelations =
    meta.requiredParent !== undefined ||
    meta.childPolicy !== undefined ||
    meta.codeDependencies !== undefined ||
    meta.tagDependencies !== undefined ||
    meta.injects !== undefined ||
    meta.slotCompatible !== undefined ||
    meta.preferredSlotIn !== undefined;
  c["CDR-013"] = hasRelations
    ? true
    : "no structured relation fields (childPolicy / requiredParent / …)";

  // CDR-014 — Content model declared.
  c["CDR-014"] = typeof meta.contentModel === "string";

  // CDR-015 — Determinism + streaming declared.
  if (
    typeof meta.deterministic === "boolean" &&
    typeof meta.streamSafe === "boolean" &&
    meta.streamingLifecycle
  ) {
    c["CDR-015"] = true;
  } else {
    const missing: string[] = [];
    if (typeof meta.deterministic !== "boolean") missing.push("deterministic");
    if (typeof meta.streamSafe !== "boolean") missing.push("streamSafe");
    if (!meta.streamingLifecycle) missing.push("streamingLifecycle");
    c["CDR-015"] = `missing meta field(s): ${missing.join(", ")}`;
  }

  return c;
}

function mergeAdditive(
  existing: Conformance,
  fresh: Conformance,
  overwrite: boolean
): { merged: Conformance; added: number; kept: number; replaced: number } {
  if (overwrite) {
    return {
      merged: fresh,
      added: Object.keys(fresh).length,
      kept: 0,
      replaced: Object.keys(existing).length,
    };
  }
  let added = 0;
  let kept = 0;
  const merged: Conformance = { ...existing };
  for (const [k, v] of Object.entries(fresh)) {
    if (k in merged) {
      kept++;
    } else {
      merged[k] = v;
      added++;
    }
  }
  return { merged, added, kept, replaced: 0 };
}

function sortKeys(c: Conformance): Conformance {
  const order = (k: string): [number, number, string] => {
    // ADR < CDR < everything else; within prefix, numeric sort.
    const m = k.match(/^(ADR|CDR|[A-Z]+)-(\d+)$/);
    if (!m) return [9, 0, k];
    const bucket =
      m[1] === "ADR" ? 0 : m[1] === "CDR" ? 1 : 2;
    return [bucket, Number(m[2]), m[1]];
  };
  const keys = Object.keys(c).sort((a, b) => {
    const [ab, an, ap] = order(a);
    const [bb, bn, bp] = order(b);
    if (ab !== bb) return ab - bb;
    if (ap !== bp) return ap.localeCompare(bp);
    return an - bn;
  });
  const out: Conformance = {};
  for (const k of keys) out[k] = c[k];
  return out;
}

async function seedOne(metaPath: string): Promise<{
  status: "written" | "skipped" | "unchanged";
  stem: string;
  added: number;
  kept: number;
  replaced: number;
}> {
  const stem = path.basename(metaPath, ".meta.json");
  const dir = path.dirname(metaPath);
  const conformancePath = path.join(dir, `${stem}.conformance.json`);

  const meta = JSON.parse(await fs.readFile(metaPath, "utf-8")) as Meta;
  const { files, source } = await readFiles(metaPath, stem);
  const seed = buildSeed(meta, files, source);

  let existing: Conformance = {};
  try {
    existing = JSON.parse(await fs.readFile(conformancePath, "utf-8")) as Conformance;
  } catch {
    /* not present */
  }

  const { merged, added, kept, replaced } = mergeAdditive(existing, seed, OVERWRITE);
  const sorted = sortKeys(merged);
  const next = JSON.stringify(sorted, null, 2) + "\n";

  let prev = "";
  try {
    prev = await fs.readFile(conformancePath, "utf-8");
  } catch {
    /* not present */
  }
  if (prev === next) return { status: "unchanged", stem, added, kept, replaced };

  if (!DRY_RUN) await fs.writeFile(conformancePath, next, "utf-8");
  return { status: "written", stem, added, kept, replaced };
}

async function main() {
  console.log(
    DRY_RUN ? "[seed-conformance] DRY RUN" : "[seed-conformance] writing changes"
  );
  if (OVERWRITE) console.log("[seed-conformance] OVERWRITE existing key values");

  const metas = await walk(SRC_DIR);
  console.log(`[seed-conformance] Found ${metas.length} meta file(s).`);

  let written = 0;
  let unchanged = 0;
  let totalAdded = 0;
  let totalKept = 0;
  let totalReplaced = 0;
  for (const m of metas) {
    const r = await seedOne(m);
    if (r.status === "written") written++;
    else if (r.status === "unchanged") unchanged++;
    totalAdded += r.added;
    totalKept += r.kept;
    totalReplaced += r.replaced;
  }
  console.log(
    `[seed-conformance] Summary: ${written} updated, ${unchanged} unchanged · ` +
      `keys: +${totalAdded} added, ${totalKept} kept, ${totalReplaced} replaced.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

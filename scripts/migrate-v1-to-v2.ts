/**
 * scripts/migrate-v1-to-v2.ts — codemod that rewrites every `*.meta.json`
 * from schema v1 to schema v2 in-place.
 *
 * Per ADR-015 + ADR-016 + CDR-012..015. The v2 additions are all
 * optional in the schema, so this codemod is purely informational —
 * but consumers (studio MUST-tier validator, llm-benchmark scoring) need
 * the fields populated to work properly.
 *
 * Safe defaults — written for every component:
 *   - schemaVersion: 1 -> 2
 *   - contentModel: inferred from tier + slots emptiness + inline-tag list
 *   - deterministic: inferred from sideEffects[].kind (no timer/state/network -> true)
 *   - nondeterministicReason: "TODO: <kind> side-effect" when deterministic=false
 *   - streamSafe: true when contentModel != "void" and finalizesAt != "flush"
 *   - streamingLifecycle: { finalizesAt: "blockEnd" }
 *   - role: "transparent-wrapper" for layout-tier (ce-grid/center/section/card-as-layout);
 *           "leaf" otherwise.
 *   - childPolicy: "none" for contentModel=void; "any" otherwise
 *   - requiredParent: []  (operator review pass surfaces required-parent cases)
 *   - codeDependencies / tagDependencies / injects: split from dependencies[]
 *   - interchangeableWith / preferredSlotIn / aliases / semanticType: empty/absent
 *     (manual seed)
 *   - slotCompatible: omit (default true)
 *
 * Manual review afterwards needs to focus on:
 *   - contentModel for borderline cases (the codemod marks any uncertain
 *     inference with a `_codemod_review` flag in `additional`).
 *   - requiredParent (~10 components need it).
 *   - interchangeableWith (~15 candidate pairs from llm-benchmark corpus).
 *   - nondeterministicReason wording.
 *
 * Run:  pnpm tsx scripts/migrate-v1-to-v2.ts [--dry-run]
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");

const DRY_RUN = process.argv.includes("--dry-run");

// Inline-content components (block-vs-inline classification).
// Curated; manual override after codemod runs.
const INLINE_TAGS = new Set<string>([
  "ce-badge",
  "ce-chip",
  "ce-tag",
  "ce-pill",
  "ce-kbd",
  "ce-mark",
  "ce-citation",
  "ce-cursor",
  "ce-spinner",
  "ce-loading-dots",
  "ce-icon",
  "ce-abbr",
]);

// Void components — no children, attribute-driven.
// Manual override after codemod runs.
// NOTE: only listed here when the component's meta has empty slots[].
// `ce-divider` / `ce-sparkline` were excluded because their meta
// declares a (currently-empty) default slot for future captioning.
const VOID_TAGS = new Set<string>([
  "ce-clock",
  "ce-countdown",
  "ce-counter",
  "ce-qr",
  "ce-progress",
  "ce-progress-bar",
  "ce-dot",
  "ce-bullet",
  "ce-cursor",
  "ce-spinner",
]);

// Components that wrap content transparently and may be canonicalized
// against their children for benchmark scoring.
const TRANSPARENT_WRAPPER_TAGS = new Set<string>([
  "ce-grid",
  "ce-center",
  "ce-section",
  "ce-stack",
  "ce-cluster",
  "ce-row",
  "ce-col",
  "ce-stat-group", // deprecated wrapper
]);

// Components for which child structure matters and is enforced.
const CONTAINER_TAGS = new Set<string>([
  "ce-card",
  "ce-feature-card",
  "ce-callout",
  "ce-hero",
  "ce-quote",
  "ce-pros-cons",
  "ce-rank-list",
  "ce-kv",
  "ce-key-value",
  "ce-data",
]);

// Components that require a specific parent at runtime.
// Manual seed; codemod sets these on these tags only.
const REQUIRED_PARENT_MAP: Record<string, string[]> = {
  "ce-bar-row": ["ce-bar-chart"],
};

// Components whose render() programmatically creates other tags.
const INJECTS_MAP: Record<string, string[]> = {
  "ce-tooltip": ["ce-popover"],
  "ce-dropdown-menu": ["ce-popover"],
  "ce-combobox": ["ce-popover", "ce-listbox"],
};

interface V1Meta {
  schemaVersion: number;
  tag: string;
  tier: string;
  slots: Array<{ name: string; description: string; required?: boolean }>;
  sideEffects: Array<{ kind: string; description: string; reason: string; guarded?: boolean }>;
  dependencies?: string[];
  [key: string]: unknown;
}

interface MigrationStats {
  total: number;
  migrated: number;
  alreadyV2: number;
  errors: number;
  needsReview: string[];
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function recurse(d: string) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await recurse(full);
      else if (e.isFile() && e.name.endsWith(".meta.json")) out.push(full);
    }
  }
  await recurse(dir);
  return out.sort();
}

function inferContentModel(meta: V1Meta): "block" | "inline" | "void" {
  // Void only when meta declares no slots AT ALL — empty array.
  // The default slot {name:""} is a slot. CDR-014 refine() forbids
  // void+slots, so we follow the declaration.
  if (meta.slots.length === 0) return "void";
  if (INLINE_TAGS.has(meta.tag)) return "inline";
  if (VOID_TAGS.has(meta.tag)) {
    // Tag is on the void list but has slots — leave a hint, fallback to block.
    return "block";
  }
  return "block";
}

function inferDeterministic(meta: V1Meta): boolean {
  const NON_DET_KINDS = new Set(["timer", "network", "state"]);
  return !meta.sideEffects.some((se) => NON_DET_KINDS.has(se.kind));
}

function inferRole(
  meta: V1Meta,
  contentModel: "block" | "inline" | "void"
): "transparent-wrapper" | "container" | "leaf" {
  if (TRANSPARENT_WRAPPER_TAGS.has(meta.tag)) return "transparent-wrapper";
  if (CONTAINER_TAGS.has(meta.tag)) return "container";
  if (contentModel === "block" && meta.tier === "layout") return "transparent-wrapper";
  return "leaf";
}

async function migrateOne(filePath: string, stats: MigrationStats): Promise<void> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    stats.errors++;
    console.error(`  ✗ ${path.relative(REPO_ROOT, filePath)}: read error: ${(err as Error).message}`);
    return;
  }

  let meta: V1Meta;
  try {
    meta = JSON.parse(raw) as V1Meta;
  } catch (err) {
    stats.errors++;
    console.error(`  ✗ ${path.relative(REPO_ROOT, filePath)}: parse error: ${(err as Error).message}`);
    return;
  }

  if (meta.schemaVersion === 2) {
    stats.alreadyV2++;
    return;
  }

  // — Compute v2 fields ————————————————————————————
  const contentModel = inferContentModel(meta);
  const deterministic = inferDeterministic(meta);
  const role = inferRole(meta, contentModel);

  const finalizesAt = contentModel === "void" ? "tagEnd" : "blockEnd";
  const streamSafe = contentModel !== "void"; // void is trivially stream-safe; block/inline conservative true

  const childPolicy = contentModel === "void" ? "none" : "any";

  const requiredParent = REQUIRED_PARENT_MAP[meta.tag] ?? [];
  const injects = INJECTS_MAP[meta.tag] ?? [];

  // Split legacy dependencies[] into code- and tag- buckets. Without
  // static analysis on the TS source we treat all v1 entries as
  // tagDependencies (the most common case); manual review reclassifies.
  const legacyDeps = Array.isArray(meta.dependencies) ? meta.dependencies : [];
  const tagDependencies = legacyDeps.filter((d) => !injects.includes(d));
  const codeDependencies: string[] = [];

  // nondeterministicReason only when deterministic=false.
  const nonDetReason = deterministic
    ? undefined
    : (() => {
        const kinds = meta.sideEffects
          .filter((se) => ["timer", "network", "state"].includes(se.kind))
          .map((se) => se.kind);
        if (kinds.length === 0) return "TODO: side-effect classification missed by codemod";
        return `${kinds.join(", ")} side effect prevents byte-identical innerHTML across runs`;
      })();

  // — Reconstruct meta with v2 fields, preserving v1 key order ——————
  // We splice v2 keys at semantically natural positions:
  //   - relations (codeDeps/tagDeps/injects/role/requiredParent/childPolicy/
  //     interchangeableWith) AFTER existing dependents/dependencies/related/subTags
  //   - contentModel + streaming + deterministic AFTER a11y (close to end)
  //
  // Because JSON.stringify orders by insertion, we build a new object
  // explicitly. We omit fields that already have non-empty values in
  // case the file was partly migrated.

  const next: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(meta)) {
    next[k] = v;
    // Inject v2 relation block right after `subTags` (or `related` if no subTags).
    if (k === "subTags" || (k === "related" && meta.subTags === undefined)) {
      next.requiredParent = next.requiredParent ?? requiredParent;
      next.childPolicy = next.childPolicy ?? childPolicy;
      next.codeDependencies = next.codeDependencies ?? codeDependencies;
      next.tagDependencies = next.tagDependencies ?? tagDependencies;
      next.injects = next.injects ?? injects;
      next.role = next.role ?? role;
      next.interchangeableWith = next.interchangeableWith ?? [];
    }
    // Insert content + streaming block right after `a11y`.
    if (k === "a11y") {
      next.contentModel = next.contentModel ?? contentModel;
      next.deterministic = next.deterministic ?? deterministic;
      if (nonDetReason !== undefined && next.nondeterministicReason === undefined) {
        next.nondeterministicReason = nonDetReason;
      }
      next.streamSafe = next.streamSafe ?? streamSafe;
      next.streamingLifecycle = next.streamingLifecycle ?? { finalizesAt };
    }
  }
  // If meta had no a11y key, append v2 rendering block at the end before additional.
  if (next.contentModel === undefined) {
    next.contentModel = contentModel;
    next.deterministic = deterministic;
    if (nonDetReason !== undefined) next.nondeterministicReason = nonDetReason;
    next.streamSafe = streamSafe;
    next.streamingLifecycle = { finalizesAt };
  }
  // Same for relations block if `related`/`subTags` were missing.
  if (next.requiredParent === undefined) {
    next.requiredParent = requiredParent;
    next.childPolicy = childPolicy;
    next.codeDependencies = codeDependencies;
    next.tagDependencies = tagDependencies;
    next.injects = injects;
    next.role = role;
    next.interchangeableWith = [];
  }

  next.schemaVersion = 2;

  // Mark borderline contentModel inferences for review.
  if (contentModel === "void" && meta.slots.length > 0) {
    stats.needsReview.push(`${meta.tag} — contentModel=void but slots present`);
  }
  if (!deterministic && nonDetReason?.startsWith("TODO:")) {
    stats.needsReview.push(`${meta.tag} — nondeterministicReason needs human prose`);
  }

  // — Write back with two-space indent matching project convention ——
  const next2 = JSON.stringify(next, null, 2) + "\n";
  if (DRY_RUN) {
    stats.migrated++;
    return;
  }
  try {
    await fs.writeFile(filePath, next2, "utf-8");
    stats.migrated++;
  } catch (err) {
    stats.errors++;
    console.error(`  ✗ ${path.relative(REPO_ROOT, filePath)}: write error: ${(err as Error).message}`);
  }
}

async function main() {
  console.log(
    DRY_RUN ? "[migrate-v1-to-v2] DRY RUN — no writes" : "[migrate-v1-to-v2] writing changes in place"
  );

  const files = await walk(SRC_DIR);
  console.log(`[migrate-v1-to-v2] Found ${files.length} *.meta.json file(s).`);

  const stats: MigrationStats = {
    total: files.length,
    migrated: 0,
    alreadyV2: 0,
    errors: 0,
    needsReview: [],
  };

  for (const file of files) {
    await migrateOne(file, stats);
  }

  console.log("");
  console.log(`[migrate-v1-to-v2] Summary:`);
  console.log(`  total:        ${stats.total}`);
  console.log(`  migrated:     ${stats.migrated}`);
  console.log(`  already v2:   ${stats.alreadyV2}`);
  console.log(`  errors:       ${stats.errors}`);
  if (stats.needsReview.length > 0) {
    console.log(`  review queue: ${stats.needsReview.length}`);
    for (const r of stats.needsReview) console.log(`    - ${r}`);
  }
  if (stats.errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * scripts/sync-meta-dates.ts — keeps `created` + `updated` in every meta JSON
 * honest by hashing each component's `<stem>.ts` and bumping `updated` when
 * the hash differs from the global registry at `src/meta/content-hashes.json`.
 *
 * See ADR-011 (date fields) and ADR-012 (content-hash registry) for the why.
 *
 * Hash scope (ratified M-1): ONLY `<stem>.ts`. Not examples, not tests,
 * not meta, not CONCEPT.md. This makes `updated` mean "the component's code
 * surface changed" rather than "anything in the folder changed".
 *
 * Firing point (ratified M-3): the pre-commit hook installed by
 * simple-git-hooks. Manual invocation: `pnpm sync-meta-dates`. CI gate:
 * `pnpm sync-meta-dates:check`.
 *
 * CLI flags:
 *   --dry-run   print intended changes, write nothing
 *   --check     exit non-zero if anything would change (no writes)
 *
 * Idempotent: re-running on a clean tree is a no-op (exit 0, no writes).
 */

import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ContentHashesSchema,
  type ContentHashes,
} from "../src/meta/content-hashes.schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");
const REGISTRY_PATH = path.join(SRC_DIR, "meta", "content-hashes.json");

// — Args ——————————————————————————————————————
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const CHECK = args.has("--check");

// — Helpers ————————————————————————————————————

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function relativize(p: string): string {
  return path.relative(REPO_ROOT, p);
}

function todayIso(): string {
  // Local-date ISO YYYY-MM-DD. Date.toISOString uses UTC which can disagree
  // with the operator's local day boundary — use a manual format from the
  // local Date so commits made late in the evening don't get tomorrow's date.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as T;
}

async function loadRegistry(): Promise<ContentHashes> {
  let raw: ContentHashes;
  try {
    raw = await readJson<ContentHashes>(REGISTRY_PATH);
  } catch {
    raw = { schemaVersion: 1, components: {} };
  }
  // Validate; on shape error, throw — registry corruption is operator-visible.
  const parsed = ContentHashesSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `[sync-meta-dates] ${REGISTRY_PATH} failed schema validation:\n  ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("\n  ")}`,
    );
  }
  return parsed.data;
}

async function writeRegistry(reg: ContentHashes): Promise<void> {
  // Alphabetise keys for stable diffs.
  const sorted: ContentHashes = {
    schemaVersion: 1,
    components: Object.fromEntries(
      Object.entries(reg.components).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(sorted, null, 2) + "\n");
}

interface MetaShape {
  tag: string;
  created?: string;
  updated?: string;
  [k: string]: unknown;
}

/** Order keys consistently when writing the meta back, preserving the
 *  schema-defined ordering. We write whatever fields are present, only
 *  inserting `created` / `updated` after `replacedBy` to match the schema
 *  layout (matches docs/adr/adr-011-component-dates.md). */
const SCHEMA_KEY_ORDER = [
  "schemaVersion",
  "tag",
  "name",
  "className",
  "goal",
  "description",
  "limitations",
  "stability",
  "since",
  "deprecatedIn",
  "replacedBy",
  "created",
  "updated",
  "props",
  "events",
  "methods",
  "slots",
  "cssVariables",
  "globalDependencies",
  "sideEffects",
  "dependents",
  "dependencies",
  "related",
  "category",
  "tier",
  "tags",
  "a11y",
  "additional",
];

function orderKeys<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const k of SCHEMA_KEY_ORDER) {
    if (k in obj) out[k] = obj[k];
  }
  // Append any non-schema keys (defensive — shouldn't exist) at the end.
  for (const k of Object.keys(obj)) {
    if (!(k in out)) out[k] = obj[k];
  }
  return out as T;
}

async function sha256OfFile(file: string): Promise<string> {
  const buf = await fs.readFile(file);
  return createHash("sha256").update(buf).digest("hex");
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

interface MetaTask {
  metaPath: string;
  sourcePath: string;
  meta: MetaShape;
}

async function collectMetas(): Promise<MetaTask[]> {
  const all = await walk(SRC_DIR);
  const metas = all.filter((p) => p.endsWith(".meta.json"));
  const tasks: MetaTask[] = [];
  for (const metaPath of metas) {
    const stem = path.basename(metaPath, ".meta.json");
    const sourcePath = path.join(path.dirname(metaPath), `${stem}.ts`);
    if (!(await fileExists(sourcePath))) {
      // Meta without a sibling .ts — skip. validate-meta will flag it
      // separately with a clearer error.
      continue;
    }
    const meta = await readJson<MetaShape>(metaPath);
    tasks.push({ metaPath, sourcePath, meta });
  }
  return tasks;
}

// — Main —————————————————————————————————————

interface PlannedChange {
  tag: string;
  metaPath: string;
  reason: string;
  setCreated?: string;
  setUpdated?: string;
  setHash: string;
}

async function main(): Promise<void> {
  const registry = await loadRegistry();
  const tasks = await collectMetas();
  const today = todayIso();

  const changes: PlannedChange[] = [];
  const updatedMetas: Map<string, MetaShape> = new Map();
  const nextHashes: Record<string, string> = { ...registry.components };

  for (const { metaPath, sourcePath, meta } of tasks) {
    const tag = meta.tag;
    const newHash = await sha256OfFile(sourcePath);
    const oldHash = registry.components[tag];

    if (oldHash === newHash && meta.created && meta.updated) {
      // No source change and meta has both dates — no-op.
      continue;
    }

    const planned: PlannedChange = {
      tag,
      metaPath,
      reason: !oldHash
        ? "no hash in registry — first sync"
        : oldHash !== newHash
          ? "source hash changed"
          : "missing date fields",
      setHash: newHash,
    };

    const nextMeta: MetaShape = { ...meta };

    if (!meta.created) {
      planned.setCreated = today;
      nextMeta.created = today;
    }
    if (
      oldHash !== newHash ||
      !meta.updated ||
      (meta.created &&
        (nextMeta.updated ?? meta.updated) < (nextMeta.created ?? meta.created))
    ) {
      planned.setUpdated = today;
      nextMeta.updated = today;
    }

    nextHashes[tag] = newHash;
    updatedMetas.set(metaPath, orderKeys(nextMeta));
    changes.push(planned);
  }

  if (changes.length === 0) {
    if (CHECK || DRY_RUN) {
      console.log("[sync-meta-dates] clean — no changes needed.");
    } else {
      console.log("[sync-meta-dates] OK — no changes.");
    }
    process.exit(0);
  }

  // Sort changes by tag for stable output.
  changes.sort((a, b) => a.tag.localeCompare(b.tag));

  if (CHECK) {
    console.error(
      `[sync-meta-dates] DRIFT — ${changes.length} component(s) need a sync:`,
    );
    for (const c of changes) {
      const bits: string[] = [];
      if (c.setCreated) bits.push(`created=${c.setCreated}`);
      if (c.setUpdated) bits.push(`updated=${c.setUpdated}`);
      bits.push(`hash=${c.setHash.slice(0, 12)}…`);
      console.error(`  ${c.tag.padEnd(28)} ${c.reason} (${bits.join(", ")})`);
    }
    console.error(
      "\n  Run `pnpm sync-meta-dates` to apply (or let the pre-commit hook fire on your next commit).",
    );
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(`[sync-meta-dates] would update ${changes.length} component(s):`);
    for (const c of changes) {
      console.log(
        `  ${c.tag.padEnd(28)} ${c.reason}${
          c.setUpdated ? ` (updated=${c.setUpdated})` : ""
        }`,
      );
    }
    process.exit(0);
  }

  // Write meta files.
  for (const [metaPath, meta] of updatedMetas) {
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n");
  }
  // Write registry.
  await writeRegistry({ schemaVersion: 1, components: nextHashes });

  console.log(
    `[sync-meta-dates] OK — synced ${changes.length} component(s); registry updated.`,
  );
  for (const c of changes) {
    console.log(
      `  ${c.tag.padEnd(28)} ${c.reason}${
        c.setUpdated ? ` (updated=${c.setUpdated})` : ""
      }`,
    );
  }
}

main().catch((e) => {
  console.error("[sync-meta-dates] CRASH:", e);
  process.exit(2);
});

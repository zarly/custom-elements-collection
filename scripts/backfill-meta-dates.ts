/**
 * scripts/backfill-meta-dates.ts — ONE-SHOT script that fills `created` +
 * `updated` for every existing meta JSON that's missing them, using git
 * history as the source.
 *
 *   created = first commit that introduced the meta file
 *             (`git log --follow --diff-filter=A --format=%ad --date=short`)
 *   updated = most recent commit touching anything in the component folder
 *             (`git log -1 --format=%ad --date=short -- <folder>`)
 *
 * Best-effort accuracy — operator (ADR-011) explicitly accepted minor errors
 * for legacy data; don't engineer around git rename quirks.
 *
 * Run once after merging the schema change in ADR-011. After this, the
 * pre-commit hook + `sync-meta-dates.ts` (ADR-012) takes over.
 */

import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");

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

function orderKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of SCHEMA_KEY_ORDER) {
    if (k in obj) out[k] = obj[k];
  }
  for (const k of Object.keys(obj)) {
    if (!(k in out)) out[k] = obj[k];
  }
  return out;
}

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
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function gitAddDate(filePath: string): Promise<string | null> {
  // The introduction date — tail -1 to handle the multi-commit case across
  // rename history when --follow surfaces more than one A entry.
  try {
    const rel = path.relative(REPO_ROOT, filePath);
    const { stdout } = await exec(
      "git",
      [
        "log",
        "--follow",
        "--diff-filter=A",
        "--format=%ad",
        "--date=short",
        "--",
        rel,
      ],
      { cwd: REPO_ROOT },
    );
    const lines = stdout.trim().split("\n").filter(Boolean);
    return lines[lines.length - 1] ?? null;
  } catch {
    return null;
  }
}

async function gitLastTouchDate(folderPath: string): Promise<string | null> {
  try {
    const rel = path.relative(REPO_ROOT, folderPath);
    const { stdout } = await exec(
      "git",
      ["log", "-1", "--format=%ad", "--date=short", "--", rel],
      { cwd: REPO_ROOT },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const all = await walk(SRC_DIR);
  const metas = all.filter((p) => p.endsWith(".meta.json")).sort();
  const today = todayIso();

  let touched = 0;
  for (const metaPath of metas) {
    const raw = await fs.readFile(metaPath, "utf8");
    const meta = JSON.parse(raw) as Record<string, unknown>;

    if (meta.created && meta.updated) continue;

    const folder = path.dirname(metaPath);
    const addDate = (await gitAddDate(metaPath)) ?? today;
    let touchDate = (await gitLastTouchDate(folder)) ?? today;
    // Guard the cross-field invariant `updated >= created`.
    if (touchDate < addDate) touchDate = addDate;

    if (!meta.created) meta.created = addDate;
    if (!meta.updated) meta.updated = touchDate;

    const reordered = orderKeys(meta);
    await fs.writeFile(metaPath, JSON.stringify(reordered, null, 2) + "\n");
    touched += 1;
    console.log(
      `  ${(meta.tag as string).padEnd(28)} created=${meta.created} updated=${meta.updated}`,
    );
  }

  console.log(`[backfill-meta-dates] done — touched ${touched} of ${metas.length} files.`);
}

main().catch((e) => {
  console.error("[backfill-meta-dates] CRASH:", e);
  process.exit(2);
});

/**
 * scripts/bundle-stats.ts — measure dist/ bundle sizes and append a record
 * to internal/bundle-stats.jsonl, then report a delta vs. the previous run.
 *
 * Replaces the older "≤ 8 kB Tier-1 budget" gate with a tracker — we
 * measure and report, but don't fail the build on growth.
 *
 * Run:
 *   pnpm build && pnpm bundle-stats
 *
 * Output store: internal/bundle-stats.jsonl (gitignored — internal/ is
 * already in .gitignore). One JSON object per build, append-only.
 *
 * The shape of one record:
 *   {
 *     ts: "2026-04-30T17:00:00.000Z",
 *     commit: "abcdef1",
 *     totals: { raw: <bytes>, gzip: <bytes> },
 *     // Roll-ups by group, derived from src/manifest.ts groups + a
 *     // fixed bucket for the shared core (everything in dist/chunks/).
 *     groups: { "Layout & primitives": { raw, gzip, files }, ... },
 *     // Per-tag (entry) sizes including their direct chunk dep.
 *     entries: { "ce-card": { raw, gzip }, ... },
 *     // Per-file raw rows for full-fidelity diffing.
 *     files: [{ path, raw, gzip }, ...]
 *   }
 */

import { promises as fs } from "node:fs";
import { execSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(REPO_ROOT, "dist");
const STORE_DIR = path.join(REPO_ROOT, "internal");
const STORE_FILE = path.join(STORE_DIR, "bundle-stats.jsonl");

interface FileRow {
  path: string; // relative to dist/
  raw: number;
  gzip: number;
}

interface Record {
  ts: string;
  commit: string | null;
  totals: { raw: number; gzip: number };
  groups: Record_Groups;
  entries: Record<string, { raw: number; gzip: number }>;
  files: FileRow[];
}

type Record_Groups = Record<string, { raw: number; gzip: number; files: number }>;

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
    else if (entry.isFile() && full.endsWith(".js")) out.push(full);
  }
  return out;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} kB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDelta(now: number, prev: number | undefined): string {
  if (prev === undefined) return "(new)";
  const d = now - prev;
  if (d === 0) return "±0";
  const sign = d > 0 ? "+" : "";
  const pct = prev === 0 ? "" : ` (${sign}${((d / prev) * 100).toFixed(1)}%)`;
  return `${sign}${fmtBytes(d)}${pct}`;
}

function gitCommit(): string | null {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

async function loadManifest(): Promise<
  ReadonlyArray<{ name: string; tag: string; group?: string }>
> {
  // Read the source manifest (always 49 components incl. internal). The dist
  // manifest may have the publish-only filter applied, which would skew
  // group rollups. Source-of-truth wins.
  const file = path.join(REPO_ROOT, "src", "manifest.ts");
  const txt = await fs.readFile(file, "utf8");
  const out: { name: string; tag: string; group?: string }[] = [];
  // Pull each {...} record on its own line, then parse with two simple
  // sub-extractions — avoids a single greedy regex that can't reliably mix
  // an optional `group:` capture with a `[^}]*` tail.
  const recordRe = /\{[^}]*\}/g;
  for (const match of txt.match(recordRe) ?? []) {
    const name = /name:\s*"([^"]+)"/.exec(match)?.[1];
    const tag = /tag:\s*"([^"]+)"/.exec(match)?.[1];
    if (!name || !tag) continue;
    const group = /group:\s*"([^"]+)"/.exec(match)?.[1];
    out.push({ name, tag, group });
  }
  return out;
}

async function loadPrevious(): Promise<Record | null> {
  let raw: string;
  try {
    raw = await fs.readFile(STORE_FILE, "utf8");
  } catch {
    return null;
  }
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return null;
  try {
    return JSON.parse(lines[lines.length - 1]) as Record;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const manifest = await loadManifest();
  const tagToName = new Map(manifest.map((c) => [c.tag, c.name] as const));
  const nameToGroup = new Map(manifest.map((c) => [c.name, c.group ?? "(other)"] as const));

  const files = (await walk(DIST_DIR)).sort();
  if (files.length === 0) {
    console.error("[bundle-stats] dist/ is empty — run `pnpm build` first.");
    process.exit(1);
  }

  const rows: FileRow[] = [];
  for (const f of files) {
    const buf = await fs.readFile(f);
    const gz = gzipSync(buf);
    rows.push({
      path: path.relative(DIST_DIR, f),
      raw: buf.byteLength,
      gzip: gz.byteLength,
    });
  }

  // Per-entry rollup: dist/entries/<name>.js measures only the side-effect
  // entry, which is tiny because Vite hoists most code into dist/chunks/<name>-<hash>.js.
  // Sum the entry + its matching chunk by stem prefix.
  const entries: Record<string, { raw: number; gzip: number }> = {};
  for (const row of rows) {
    const m = row.path.match(/^entries\/([a-z0-9-]+)\.js$/);
    if (!m) continue;
    const name = m[1];
    const chunk = rows.find((r) =>
      new RegExp(`^chunks\\/${name}-[A-Za-z0-9_-]+\\.js$`).test(r.path)
    );
    const sumRaw = row.raw + (chunk?.raw ?? 0);
    const sumGzip = row.gzip + (chunk?.gzip ?? 0);
    const tag = manifest.find((c) => c.name === name)?.tag ?? `ce-${name}`;
    entries[tag] = { raw: sumRaw, gzip: sumGzip };
  }

  // Per-group rollup based on manifest groups.
  const groups: Record_Groups = {};
  for (const [tag, sz] of Object.entries(entries)) {
    const name = tagToName.get(tag) ?? tag.replace(/^ce-/, "");
    const group = nameToGroup.get(name) ?? "(other)";
    if (!groups[group]) groups[group] = { raw: 0, gzip: 0, files: 0 };
    groups[group].raw += sz.raw;
    groups[group].gzip += sz.gzip;
    groups[group].files += 1;
  }

  const totals = rows.reduce(
    (acc, r) => ({ raw: acc.raw + r.raw, gzip: acc.gzip + r.gzip }),
    { raw: 0, gzip: 0 }
  );

  const record: Record = {
    ts: new Date().toISOString(),
    commit: gitCommit(),
    totals,
    groups,
    entries,
    files: rows,
  };

  const previous = await loadPrevious();

  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.appendFile(STORE_FILE, JSON.stringify(record) + "\n", "utf8");

  // Report
  console.log(`\n[bundle-stats] ${record.ts} · commit ${record.commit ?? "(no git)"}`);
  console.log(
    `Total: ${fmtBytes(totals.raw)} raw / ${fmtBytes(totals.gzip)} gzip   ${fmtDelta(
      totals.gzip,
      previous?.totals.gzip
    )} gzip vs prior`
  );

  console.log("\nBy group (gzip):");
  const groupRows = Object.entries(groups).sort((a, b) => b[1].gzip - a[1].gzip);
  for (const [g, sz] of groupRows) {
    const prev = previous?.groups[g]?.gzip;
    console.log(`  ${g.padEnd(28)} ${fmtBytes(sz.gzip).padStart(10)}  ${fmtDelta(sz.gzip, prev)}`);
  }

  // Top movers: largest gzip deltas (positive or negative), entries only.
  if (previous) {
    const movers = Object.entries(entries)
      .map(([tag, sz]) => ({
        tag,
        now: sz.gzip,
        prev: previous.entries[tag]?.gzip,
        delta: sz.gzip - (previous.entries[tag]?.gzip ?? sz.gzip),
      }))
      .filter((m) => m.delta !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 10);
    if (movers.length > 0) {
      console.log("\nTop movers (per-tag gzip):");
      for (const m of movers) {
        console.log(
          `  ${m.tag.padEnd(28)} ${fmtBytes(m.now).padStart(10)}  ${fmtDelta(m.now, m.prev)}`
        );
      }
    } else {
      console.log("\nNo per-tag deltas vs previous run.");
    }
  } else {
    console.log("\nFirst recorded run — no delta to report.");
  }

  console.log(
    `\nWrote: ${path.relative(REPO_ROOT, STORE_FILE)} (append-only, JSONL, gitignored)`
  );
}

main().catch((e) => {
  console.error("[bundle-stats] CRASH:", e);
  process.exit(2);
});

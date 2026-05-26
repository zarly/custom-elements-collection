/**
 * scripts/lint-meta-conformance-keys.ts — every key in every
 * `<name>.conformance.json` must resolve to either an existing ADR file
 * or an existing CDR file under `docs/adr/` / `docs/cdr/`.
 *
 * Per ADR-016: open-world keys, validated at build time, not in Zod.
 *
 * Exit non-zero on the first unresolved key.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const ADR_DIR = path.join(REPO_ROOT, "docs", "adr");
const CDR_DIR = path.join(REPO_ROOT, "docs", "cdr");
const SRC_DIR = path.join(REPO_ROOT, "src");

async function listIds(dir: string, prefix: string): Promise<Set<string>> {
  const out = new Set<string>();
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return out;
  }
  for (const f of entries) {
    if (!f.endsWith(".md")) continue;
    // adr-NNN-*.md -> ADR-NNN; same for cdr-*.
    const match = f.match(/^(adr|cdr)-(\d{3})-/);
    if (match) out.add(`${prefix}-${match[2]}`);
  }
  return out;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function recurse(d: string) {
    for (const e of await fs.readdir(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await recurse(full);
      else if (e.isFile() && e.name.endsWith(".conformance.json")) out.push(full);
    }
  }
  await recurse(dir);
  return out.sort();
}

async function main() {
  const adrs = await listIds(ADR_DIR, "ADR");
  const cdrs = await listIds(CDR_DIR, "CDR");
  const universe = new Set([...adrs, ...cdrs]);

  console.log(
    `[lint-conformance-keys] universe: ${adrs.size} ADRs · ${cdrs.size} CDRs`
  );

  const files = await walk(SRC_DIR);
  let failures = 0;

  for (const f of files) {
    let record: Record<string, unknown>;
    try {
      record = JSON.parse(await fs.readFile(f, "utf-8")) as Record<string, unknown>;
    } catch (err) {
      console.error(`  ✗ ${path.relative(REPO_ROOT, f)}: parse error: ${(err as Error).message}`);
      failures++;
      continue;
    }
    for (const key of Object.keys(record)) {
      if (!universe.has(key)) {
        console.error(`  ✗ ${path.relative(REPO_ROOT, f)}: unknown key ${key}`);
        failures++;
      }
    }
  }

  if (failures > 0) {
    console.error(`[lint-conformance-keys] FAIL — ${failures} issue(s).`);
    process.exit(1);
  }
  console.log(`[lint-conformance-keys] OK — ${files.length} file(s) validated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

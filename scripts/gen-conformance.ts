/**
 * scripts/gen-conformance.ts — aggregate every component's sibling
 * `<name>.conformance.json` into `dist/conformance.json`. Per ADR-016.
 *
 * The aggregated artifact lets consumers (operator dashboard,
 * npm-page badges, cec-component-validator skill) answer:
 *   - "which components pass criterion X?"
 *   - "what's the pass-rate of ADR-002 across the library?"
 *   - "which components have a 'partial' note on CDR-004?"
 *
 * Missing conformance files are warnings, not errors, for v0.7. From
 * v0.8 the absence becomes a `validate-meta` failure.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");
const DEFAULT_DIST = path.join(REPO_ROOT, "dist");

type ConformanceValue = true | false | string;
type ConformanceRecord = Record<string, ConformanceValue>;

interface ScopeMetadata {
  /** Free-text explanation of what this artifact does and does not cover. */
  readme: string;
  /** Criterion ids the seed script emits per component. */
  inScope: { adr: string[]; cdr: string[] };
  /** Categories of criteria deliberately omitted from per-component receipts. */
  outOfScope: {
    category: string;
    reason: string;
  }[];
}

interface AggregatedArtifact {
  generatedAt: string;
  scope: ScopeMetadata;
  total: number;
  withFile: number;
  withoutFile: string[];
  components: Record<string, ConformanceRecord>;
  byKey: Record<
    string,
    {
      pass: string[];
      fail: string[];
      partial: { tag: string; comment: string }[];
    }
  >;
}

const SCOPE: ScopeMetadata = {
  readme:
    "Per-component conformance receipts emitted by scripts/seed-conformance.ts. Absent criterion ≠ failure; absent means \"not in scope for the per-component receipt\" (see outOfScope below). Library-level concerns are enforced at CI level, not per component.",
  inScope: {
    adr: ["ADR-001", "ADR-002", "ADR-003", "ADR-004", "ADR-005", "ADR-006",
          "ADR-007", "ADR-008", "ADR-009", "ADR-010", "ADR-011", "ADR-012",
          "ADR-013", "ADR-014", "ADR-015", "ADR-016"],
    cdr: ["CDR-001", "CDR-002", "CDR-003", "CDR-004", "CDR-005", "CDR-006",
          "CDR-007", "CDR-008", "CDR-009", "CDR-010", "CDR-011", "CDR-012",
          "CDR-013", "CDR-014", "CDR-015"],
  },
  outOfScope: [
    {
      category: "Library-level / stack-level concerns",
      reason: "Verdict belongs to the library tarball, not to any single component (package format, build output, publish workflow, framework adapters, supply chain). Tracked separately in CI gates and the pre-release protocol.",
    },
    {
      category: "Needs measurement (no code-read verdict possible)",
      reason: "Latency / throughput / memory / bundle-size / browser-matrix; requires pnpm bench, pnpm bundle-stats, Lighthouse, or heap snapshots before a verdict can be written.",
    },
    {
      category: "Needs external tooling or manual audit",
      reason: "axe-core / pa11y / screen-reader audit, product-level UX assertions, and reliability assertions verified by downstream test suites.",
    },
  ],
};

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

async function main() {
  const metas = await walk(SRC_DIR);
  const out: AggregatedArtifact = {
    generatedAt: new Date().toISOString(),
    scope: SCOPE,
    total: metas.length,
    withFile: 0,
    withoutFile: [],
    components: {},
    byKey: {},
  };

  for (const metaPath of metas) {
    const stem = path.basename(metaPath, ".meta.json");
    const dir = path.dirname(metaPath);
    const conformancePath = path.join(dir, `${stem}.conformance.json`);
    const tag = stem; // by convention <stem> = <tag>

    let record: ConformanceRecord | null = null;
    try {
      const raw = await fs.readFile(conformancePath, "utf-8");
      record = JSON.parse(raw) as ConformanceRecord;
    } catch {
      out.withoutFile.push(tag);
      continue;
    }
    out.withFile++;
    out.components[tag] = record;

    for (const [k, v] of Object.entries(record)) {
      const bucket = (out.byKey[k] ??= { pass: [], fail: [], partial: [] });
      if (v === true) bucket.pass.push(tag);
      else if (v === false) bucket.fail.push(tag);
      else bucket.partial.push({ tag, comment: v });
    }
  }

  // Sort everything.
  out.withoutFile.sort();
  out.components = Object.fromEntries(
    Object.entries(out.components).sort(([a], [b]) => a.localeCompare(b))
  );
  out.byKey = Object.fromEntries(
    Object.entries(out.byKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [
        k,
        {
          pass: v.pass.sort(),
          fail: v.fail.sort(),
          partial: v.partial.sort((a, b) => a.tag.localeCompare(b.tag)),
        },
      ])
  );

  await fs.mkdir(DEFAULT_DIST, { recursive: true });
  const outPath = path.join(DEFAULT_DIST, "conformance.json");
  await fs.writeFile(outPath, JSON.stringify(out, null, 2) + "\n", "utf-8");
  console.log(
    `[gen-conformance] Wrote ${outPath} — ${out.withFile}/${out.total} with file, ${Object.keys(out.byKey).length} unique criteria.`
  );
  if (out.withoutFile.length > 0) {
    console.warn(
      `[gen-conformance] WARN — ${out.withoutFile.length} component(s) without conformance file: ${out.withoutFile.slice(0, 5).join(", ")}${out.withoutFile.length > 5 ? "..." : ""}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

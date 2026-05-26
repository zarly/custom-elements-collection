#!/usr/bin/env node
/**
 * scripts/components.mjs — minimal, zero-deps CLI over the per-component
 * meta JSON files. Reads `dist/meta/index.json` if present, else walks the
 * source tree at `src/**\/*.meta.json`. Filters by tag/group/category/tier
 * and projects a comma-separated list of fields. Default output is markdown;
 * `--format json` emits JSON.
 *
 * Examples:
 *   node scripts/components.mjs                           — all tags, full meta as markdown
 *   node scripts/components.mjs --tag ce-card             — one tag, full meta
 *   node scripts/components.mjs --tag ce-card --tag ce-rating
 *   node scripts/components.mjs --group "Chat surfaces"   — filter by manifest group (= meta.tags[0])
 *   node scripts/components.mjs --category ui
 *   node scripts/components.mjs --tier brick
 *   node scripts/components.mjs --fields tag,goal,events  — project subset
 *   node scripts/components.mjs --format json
 *
 * Field paths support a single level of nesting separated by ".":
 *   --fields tag,props.name,events.detail
 * pulls just `name` from each prop and `detail` from each event.
 *
 * Repeatable flags: --tag, --group. Last-wins flags: --category, --tier,
 * --fields, --format.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");

function parseArgs(argv) {
  const out = {
    tags: [],
    groups: [],
    category: null,
    tier: null,
    fields: null,
    format: "markdown",
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "-h":
      case "--help":
        out.help = true;
        break;
      case "--tag":
        out.tags.push(next());
        break;
      case "--group":
        out.groups.push(next());
        break;
      case "--category":
        out.category = next();
        break;
      case "--tier":
        out.tier = next();
        break;
      case "--fields":
        out.fields = next().split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--format":
        out.format = next();
        break;
      default:
        process.stderr.write(`unknown arg: ${a}\n`);
        process.exit(2);
    }
  }
  return out;
}

const HELP = `Usage: node scripts/components.mjs [flags]

Filters (combine with logical AND; --tag and --group accept multiples = OR):
  --tag <ce-x>            Filter by tag (repeatable)
  --group <name>          Filter by manifest group (= meta.tags[0])
  --category <c>          ui | lesson | internal
  --tier <t>              brick | widget | layout

Projection:
  --fields a,b,c.sub      Comma list. "props.name" projects each prop's name only.

Output:
  --format markdown|json  Default markdown (one section per tag)
`;

async function loadAllMeta() {
  // Prefer the published bundle if a build has run; cheaper than walking src/.
  const bundle = path.join(REPO_ROOT, "dist", "meta", "index.json");
  try {
    const raw = await fs.readFile(bundle, "utf8");
    const obj = JSON.parse(raw);
    return Object.values(obj);
  } catch {
    /* fall through to src/ walk */
  }
  const all = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile() && e.name.endsWith(".meta.json")) {
        const raw = await fs.readFile(full, "utf8");
        all.push(JSON.parse(raw));
      }
    }
  }
  await walk(path.join(REPO_ROOT, "src", "components"));
  await walk(path.join(REPO_ROOT, "src", "lesson"));
  return all;
}

function passesFilters(meta, args) {
  if (args.tags.length && !args.tags.includes(meta.tag)) return false;
  if (args.groups.length) {
    const group = (meta.tags && meta.tags[0]) || "";
    if (!args.groups.includes(group)) return false;
  }
  if (args.category && meta.category !== args.category) return false;
  if (args.tier && meta.tier !== args.tier) return false;
  return true;
}

function project(meta, fields) {
  if (!fields) return meta;
  const out = {};
  for (const f of fields) {
    const [head, sub] = f.split(".", 2);
    const v = meta[head];
    if (!sub) {
      if (v !== undefined) out[head] = v;
      continue;
    }
    if (Array.isArray(v)) {
      out[head] = v.map((row) => row?.[sub]).filter((x) => x !== undefined);
    } else if (v && typeof v === "object") {
      const x = v[sub];
      if (x !== undefined) out[head] = x;
    }
  }
  return out;
}

function formatMarkdown(rows) {
  if (rows.length === 0) return "_(no matches)_\n";
  const out = [];
  for (const r of rows) {
    const tag = r.tag ?? "(no tag)";
    out.push(`### \`${tag}\``);
    out.push("");
    out.push("```json");
    out.push(JSON.stringify(r, null, 2));
    out.push("```");
    out.push("");
  }
  return out.join("\n");
}

function sortRows(rows) {
  const order = { ui: 0, lesson: 1, internal: 2 };
  return rows.slice().sort((a, b) => {
    const ca = order[a.category] ?? 99;
    const cb = order[b.category] ?? 99;
    if (ca !== cb) return ca - cb;
    return (a.tag ?? "").localeCompare(b.tag ?? "");
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }
  const all = await loadAllMeta();
  const filtered = all.filter((m) => passesFilters(m, args));
  const projected = filtered.map((m) => project(m, args.fields));
  const sorted = sortRows(projected);
  if (args.format === "json") {
    process.stdout.write(JSON.stringify(sorted, null, 2) + "\n");
    return;
  }
  process.stdout.write(formatMarkdown(sorted));
}

main().catch((e) => {
  process.stderr.write(`[components] ${e.stack || e}\n`);
  process.exit(1);
});

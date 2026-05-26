/**
 * scripts/gen-relations.ts — emit `dist/relations.json` from every
 * `*.meta.json` under `src/`. Per ADR-015 + CDR-013.
 *
 * Computed reverse-index fields:
 *   - tagDependents    (reverse of tagDependencies)
 *   - codeDependents   (reverse of codeDependencies)
 *   - injectsInto      (reverse of injects)
 *   - childOf          (reverse of requiredParent)
 *   - interchangeableSymmetric  (symmetric closure of interchangeableWith)
 *
 * Plus the forward edges projected into a flat graph for consumers.
 *
 * The output is auto-generated; CI diffs `dist/relations.json` against
 * the committed file and fails on drift.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ComponentMetaSchema, type ComponentMeta } from "../src/meta/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");
const DEFAULT_DIST = path.join(REPO_ROOT, "dist");

interface Edge {
  from: string;
  to: string;
}
interface ChildEdge {
  child: string;
  parent: string;
}
interface SymmetricPair {
  a: string;
  b: string;
  scope?: string;
}

interface RelationsArtifact {
  generatedAt: string;
  sourceRegistryVersion: string;
  forward: {
    tagDeps: Edge[];
    codeDeps: Edge[];
    inject: Edge[];
    requiredParent: ChildEdge[];
  };
  reverse: {
    tagDependents: Record<string, string[]>;
    codeDependents: Record<string, string[]>;
    injectsInto: Record<string, string[]>;
    childOf: Record<string, string[]>;
  };
  interchangeable: SymmetricPair[];
  roles: {
    "transparent-wrapper": string[];
    container: string[];
    leaf: string[];
  };
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

function addEdge(map: Record<string, string[]>, key: string, value: string) {
  (map[key] ??= []).push(value);
}

function sortReverse(rev: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(rev).sort()) {
    out[k] = Array.from(new Set(rev[k])).sort();
  }
  return out;
}

async function main() {
  const files = await walk(SRC_DIR);
  const metas: ComponentMeta[] = [];
  for (const f of files) {
    const raw = await fs.readFile(f, "utf-8");
    metas.push(ComponentMetaSchema.parse(JSON.parse(raw)));
  }

  const artifact: RelationsArtifact = {
    generatedAt: new Date().toISOString(),
    sourceRegistryVersion: "v2",
    forward: { tagDeps: [], codeDeps: [], inject: [], requiredParent: [] },
    reverse: {
      tagDependents: {},
      codeDependents: {},
      injectsInto: {},
      childOf: {},
    },
    interchangeable: [],
    roles: { "transparent-wrapper": [], container: [], leaf: [] },
  };

  const seenPairs = new Set<string>();

  for (const m of metas) {
    for (const dep of m.tagDependencies ?? []) {
      artifact.forward.tagDeps.push({ from: m.tag, to: dep });
      addEdge(artifact.reverse.tagDependents, dep, m.tag);
    }
    for (const dep of m.codeDependencies ?? []) {
      artifact.forward.codeDeps.push({ from: m.tag, to: dep });
      addEdge(artifact.reverse.codeDependents, dep, m.tag);
    }
    for (const dep of m.injects ?? []) {
      artifact.forward.inject.push({ from: m.tag, to: dep });
      addEdge(artifact.reverse.injectsInto, dep, m.tag);
    }
    for (const parent of m.requiredParent ?? []) {
      artifact.forward.requiredParent.push({ child: m.tag, parent });
      addEdge(artifact.reverse.childOf, m.tag, parent);
    }
    for (const entry of m.interchangeableWith ?? []) {
      const pairKey = [m.tag, entry.tag].sort().join("|");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      artifact.interchangeable.push({
        a: m.tag,
        b: entry.tag,
        scope: entry.scope,
      });
    }
    const role = m.role ?? "leaf";
    artifact.roles[role].push(m.tag);
  }

  // Sort everything for determinism.
  artifact.forward.tagDeps.sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
  );
  artifact.forward.codeDeps.sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
  );
  artifact.forward.inject.sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
  );
  artifact.forward.requiredParent.sort(
    (a, b) => a.child.localeCompare(b.child) || a.parent.localeCompare(b.parent)
  );
  artifact.reverse.tagDependents = sortReverse(artifact.reverse.tagDependents);
  artifact.reverse.codeDependents = sortReverse(artifact.reverse.codeDependents);
  artifact.reverse.injectsInto = sortReverse(artifact.reverse.injectsInto);
  artifact.reverse.childOf = sortReverse(artifact.reverse.childOf);
  artifact.interchangeable.sort((a, b) => a.a.localeCompare(b.a) || a.b.localeCompare(b.b));
  for (const k of Object.keys(artifact.roles)) {
    (artifact.roles as Record<string, string[]>)[k].sort();
  }

  await fs.mkdir(DEFAULT_DIST, { recursive: true });
  const out = path.join(DEFAULT_DIST, "relations.json");
  await fs.writeFile(out, JSON.stringify(artifact, null, 2) + "\n", "utf-8");
  console.log(
    `[gen-relations] Wrote ${out} — ${metas.length} components, ${artifact.forward.tagDeps.length} tag-deps, ${artifact.interchangeable.length} interchangeable pairs.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

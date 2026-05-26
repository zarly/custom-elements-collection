/**
 * scripts/gen-meta-fields-registry.ts — emit
 * `dist/meta-fields-registry.json` (machine-readable mirror of the
 * markdown handbook at `<meta-repo>/docs/cec/meta-fields-registry.md`).
 *
 * Per ADR-015 + studio job `0023.01`.
 *
 * The markdown file is currently hand-written; this script emits a
 * JSON projection of the compliance-tier map + a one-line summary per
 * field so consumers (studio, benchmark, docs-site) can fetch a single
 * artifact rather than parsing markdown.
 *
 * Future expansion: parse Zod schema + JSDoc to generate the markdown
 * itself. Not in scope for v0.7.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPLIANCE_MAP } from "../src/meta/compliance-tiers.js";
import { SEMANTIC_TYPES } from "../src/meta/semantic-types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_DIST = path.join(REPO_ROOT, "dist");

interface FieldEntry {
  id: string;
  tier: "MUST" | "SHOULD" | "MAY" | "INTERNAL";
  since: string; // semver
  description: string;
  consumers: readonly string[];
  exampleValue?: unknown;
}

const FIELD_DESCRIPTIONS: ReadonlyMap<string, Omit<FieldEntry, "id" | "tier">> =
  new Map(
    Object.entries({
      // v1 identity (unchanged)
      schemaVersion: {
        since: "0.1",
        description: "Meta-schema version. v1 = 1, v2 = 2; both accepted in v0.7/v0.8.",
        consumers: ["all"],
        exampleValue: 2,
      },
      tag: {
        since: "0.1",
        description: "Custom-element tag name (ce-* / lesson-* prefix).",
        consumers: ["all"],
        exampleValue: "ce-card",
      },
      // v2 relations
      requiredParent: {
        since: "0.7",
        description: "Tags this component requires as a parent. Empty = no constraint.",
        consumers: ["studio", "benchmark"],
        exampleValue: ["ce-bar-chart"],
      },
      childPolicy: {
        since: "0.7",
        description: 'Explicit child-acceptance policy. Default "any".',
        consumers: ["studio", "benchmark"],
        exampleValue: "constrained",
      },
      codeDependencies: {
        since: "0.7",
        description: "Tags whose TS classes this component imports (build-time).",
        consumers: ["bundle-analyzer", "docs"],
        exampleValue: ["ce-bar-row"],
      },
      tagDependencies: {
        since: "0.7",
        description: "Runtime tag children required in DOM composition.",
        consumers: ["studio", "benchmark"],
        exampleValue: ["ce-bar-row"],
      },
      injects: {
        since: "0.7",
        description: "Tags programmatically created in render() (e.g. popover).",
        consumers: ["studio (auto-fill expected_custom_elements)"],
        exampleValue: ["ce-popover"],
      },
      "slots[].acceptTags": {
        since: "0.7",
        description: "Per-slot allowlist of child tags. Empty = unconstrained.",
        consumers: ["studio composition validator"],
        exampleValue: ["ce-bar-row"],
      },
      "slots[].acceptShapes": {
        since: "0.7",
        description: 'Shape descriptors of valid slot content (e.g. "child-tag:ce-row").',
        consumers: ["benchmark canonicalization"],
        exampleValue: ["child-tag:ce-row", "semantic-html:ul,li"],
      },
      interchangeableWith: {
        since: "0.7",
        description: "Semantic equivalents for benchmark scoring.",
        consumers: ["benchmark"],
        exampleValue: [{ tag: "ce-verdict", scope: "summary-tone" }],
      },
      role: {
        since: "0.7",
        description: "transparent-wrapper / container / leaf.",
        consumers: ["benchmark canonicalization"],
        exampleValue: "transparent-wrapper",
      },
      slotCompatible: {
        since: "0.7",
        description: "Default true. False signals top-level-only.",
        consumers: ["studio warning", "LLM tool-use"],
        exampleValue: false,
      },
      preferredSlotIn: {
        since: "0.7",
        description: "Suggested parent tags for LLM tool-use prompts.",
        consumers: ["LLM tool-use"],
        exampleValue: ["ce-grid", "ce-hero"],
      },
      "props[].aliases": {
        since: "0.7",
        description: "Historical attribute names for benchmark scoring.",
        consumers: ["benchmark", "docs"],
        exampleValue: ["columns"],
      },
      "props[].semanticType": {
        since: "0.7",
        description: `Semantic kind. Closed enum (${SEMANTIC_TYPES.length} values).`,
        consumers: ["studio validation", "benchmark canonicalization", "LLM tool-use"],
        exampleValue: "email",
      },
      "props[].semanticGroup": {
        since: "0.7",
        description: "Loose cross-component grouping label.",
        consumers: ["docs"],
        exampleValue: "input-kind",
      },
      contentModel: {
        since: "0.7",
        description: "block / inline / void. Drives generative-dom + studio.",
        consumers: ["generative-dom", "studio"],
        exampleValue: "block",
      },
      deterministic: {
        since: "0.7",
        description: "Declares CDR-009 conformance (byte-identical innerHTML).",
        consumers: ["lint-determinism", "benchmark Q-16"],
        exampleValue: true,
      },
      nondeterministicReason: {
        since: "0.7",
        description: "Required when deterministic=false. ≥8 chars.",
        consumers: ["lint-determinism", "docs"],
        exampleValue: "Reads wall clock on tick",
      },
      streamSafe: {
        since: "0.7",
        description: "True = renders coherently mid-stream.",
        consumers: ["generative-dom skeleton decision"],
        exampleValue: true,
      },
      "streamingLifecycle.finalizesAt": {
        since: "0.7",
        description: 'When the component DOM is final. "flush" / "blockEnd" / "chunkBoundary" / "tagEnd".',
        consumers: ["generative-dom", "studio test fixtures"],
        exampleValue: "blockEnd",
      },
      // INTERNAL — auto-computed
      tagDependents: {
        since: "0.7",
        description: "AUTO-COMPUTED. Reverse of tagDependencies. Lives in dist/relations.json.",
        consumers: ["docs", "studio"],
      },
      codeDependents: {
        since: "0.7",
        description: "AUTO-COMPUTED. Reverse of codeDependencies. Lives in dist/relations.json.",
        consumers: ["docs"],
      },
      injectsInto: {
        since: "0.7",
        description: "AUTO-COMPUTED. Reverse of injects. Lives in dist/relations.json.",
        consumers: ["studio", "docs"],
      },
      childOf: {
        since: "0.7",
        description: "AUTO-COMPUTED. Reverse of requiredParent. Lives in dist/relations.json.",
        consumers: ["docs"],
      },
      interchangeableSymmetric: {
        since: "0.7",
        description: "AUTO-COMPUTED. Symmetric closure of interchangeableWith. Lives in dist/relations.json.",
        consumers: ["benchmark"],
      },
    })
  );

interface MetaFieldsRegistry {
  generatedAt: string;
  schemaCompliance: typeof COMPLIANCE_MAP;
  fields: FieldEntry[];
  semanticTypes: readonly string[];
}

async function main() {
  const fields: FieldEntry[] = [];
  for (const tier of ["MUST", "SHOULD", "MAY", "INTERNAL"] as const) {
    for (const id of COMPLIANCE_MAP[tier]) {
      const desc = FIELD_DESCRIPTIONS.get(id);
      fields.push({
        id,
        tier,
        since: desc?.since ?? "0.1",
        description: desc?.description ?? "(no description yet)",
        consumers: desc?.consumers ?? ["unknown"],
        ...(desc?.exampleValue !== undefined ? { exampleValue: desc.exampleValue } : {}),
      });
    }
  }
  // Sort by id for determinism.
  fields.sort((a, b) => a.id.localeCompare(b.id));

  const artifact: MetaFieldsRegistry = {
    generatedAt: new Date().toISOString(),
    schemaCompliance: COMPLIANCE_MAP,
    fields,
    semanticTypes: SEMANTIC_TYPES,
  };

  await fs.mkdir(DEFAULT_DIST, { recursive: true });
  const out = path.join(DEFAULT_DIST, "meta-fields-registry.json");
  await fs.writeFile(out, JSON.stringify(artifact, null, 2) + "\n", "utf-8");
  console.log(`[gen-meta-fields-registry] Wrote ${out} — ${fields.length} field(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * scripts/generate-registry.ts — produces the LLM-tool-use-shaped registry
 * from every `*.meta.json` under `src/`. Writes:
 *
 *   dist/registry.json
 *   dist/registry/by-tier/{brick,widget,layout}.json
 *   dist/registry/by-group/<slug>.json    (one per closed-enum group)
 *   dist/registry/by-category/{ui,lesson,internal}.json
 *   dist/registry/<tag>.json              (one per component, single-tag)
 *
 * Source of truth: every `*.meta.json` under src/. Never hand-edited.
 *
 * The generator is invoked by:
 *   - `pnpm gen-registry` (this script)
 *   - the Vite build via the `copyRegistry()` plugin in `vite.config.ts`
 *
 * The shape is documented in `docs/adr/adr-007-component-registry.md`.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ComponentMetaSchema,
  type ComponentMeta,
} from "../src/meta/schema.js";
import { GROUPS } from "../src/meta/groups.js";
import { TIERS } from "../src/meta/tiers.js";
import type {
  Registry,
  RegistryComponent,
  RegistryFilter,
  JsonSchemaObject,
  JsonSchemaProperty,
} from "../src/meta/registry-types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");
const DEFAULT_DIST = path.join(REPO_ROOT, "dist");

const REGISTRY_SCHEMA_VERSION = 1 as const;
const LIBRARY_NAME = "custom-elements-collection";

const CATEGORY_ORDER = ["ui", "lesson", "internal"] as const;

interface LoadedMeta {
  meta: ComponentMeta;
  /** filename stem (without .meta.json), used as the registry import subpath. */
  stem: string;
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

async function loadAllMeta(): Promise<LoadedMeta[]> {
  const files = (await walk(SRC_DIR))
    .filter((p) => p.endsWith(".meta.json"))
    .sort();
  const out: LoadedMeta[] = [];
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const json = JSON.parse(raw);
    const meta = ComponentMetaSchema.parse(json);
    const stem = path.basename(file, ".meta.json");
    out.push({ meta, stem });
  }
  return out;
}

/**
 * Slugify a closed-enum group name for use in filenames. Only handles the
 * shapes that actually appear in `src/meta/groups.ts`:
 *
 *   "Layout & primitives"       → "layout-and-primitives"
 *   "Comparison & narrative"    → "comparison-and-narrative"
 *   "Chat surfaces"             → "chat-surfaces"
 *   "Feedback"                  → "feedback"
 *   "Metrics & charts"          → "metrics-and-charts"
 */
export function slugifyGroup(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parse a TS type string into a JSON Schema property. Heuristic — handles
 * the common patterns used by the library; falls back to a string-typed
 * placeholder with `x-tsType` preserved for any complex shape.
 *
 * Patterns recognised:
 *   "string" / "number" / "boolean"  → primitive types
 *   "'sm' | 'md' | 'lg'"             → enum
 *   "T | null"                        → nullable T
 *   "T[]" or "Array<T>"              → array
 *
 * Anything else falls through to `{ type: "string", x-tsType: <original> }`.
 */
export function tsTypeToJsonSchema(tsType: string): JsonSchemaProperty {
  const original = tsType;
  let raw = tsType.trim();

  // Strip outer parens.
  while (raw.startsWith("(") && raw.endsWith(")")) {
    raw = raw.slice(1, -1).trim();
  }

  // Array postfix: T[]
  if (raw.endsWith("[]")) {
    const inner = raw.slice(0, -2).trim();
    return {
      type: "array",
      items: tsTypeToJsonSchema(inner),
      "x-tsType": original,
    };
  }

  // Array<T>
  const arrM = raw.match(/^Array\s*<\s*([\s\S]+?)\s*>$/);
  if (arrM) {
    return {
      type: "array",
      items: tsTypeToJsonSchema(arrM[1]),
      "x-tsType": original,
    };
  }

  // Top-level union split. We only split on `|` not nested in <>, [], (), or
  // string literals — implemented with a lightweight depth tracker.
  const parts = splitTopLevelUnion(raw);
  if (parts.length > 1) {
    // String-literal union → enum
    const enumValues: string[] = [];
    let allLiterals = true;
    let nullable = false;
    const nonLiteralParts: string[] = [];
    for (const part of parts) {
      const t = part.trim();
      if (t === "null") {
        nullable = true;
        continue;
      }
      const lit = parseStringLiteral(t);
      if (lit !== null) {
        enumValues.push(lit);
      } else {
        allLiterals = false;
        nonLiteralParts.push(t);
      }
    }
    if (allLiterals && enumValues.length > 0) {
      const out: JsonSchemaProperty = {
        type: nullable ? ["string", "null"] : "string",
        enum: nullable ? [...enumValues, ...["null"] as const].slice(0, enumValues.length) : enumValues,
        "x-tsType": original,
      };
      if (nullable) {
        // JSON Schema convention: allow the literal `null` value via the
        // type array; the enum lists only the non-null members.
        out.enum = enumValues;
      }
      return out;
    }
    // Boolean true/false union → boolean
    if (
      parts.length === 2 &&
      parts.map((p) => p.trim()).every((p) => p === "true" || p === "false")
    ) {
      return { type: "boolean", "x-tsType": original };
    }
    // T | null where T is one of our primitives → nullable primitive.
    if (nullable && nonLiteralParts.length === 1) {
      const inner = tsTypeToJsonSchema(nonLiteralParts[0]);
      const innerType = inner.type;
      if (typeof innerType === "string") {
        return {
          ...inner,
          type: [innerType, "null"],
          "x-tsType": original,
        };
      }
      // Fall through if inner had no plain string type.
      return { ...inner, "x-tsType": original };
    }
    // Multi-shape union — give up on a precise schema.
    return { type: "string", "x-tsType": original };
  }

  // Single primitive
  if (raw === "string") return { type: "string", "x-tsType": original };
  if (raw === "number") return { type: "number", "x-tsType": original };
  if (raw === "boolean") return { type: "boolean", "x-tsType": original };
  if (raw === "null") return { type: "null", "x-tsType": original };

  // Single string literal
  const lit = parseStringLiteral(raw);
  if (lit !== null) {
    return { type: "string", enum: [lit], "x-tsType": original };
  }

  // Anything else — opaque (function, object, alias). Project as string with
  // x-tsType preserved so tool-using LLMs can still see the original type.
  return { type: "string", "x-tsType": original };
}

function parseStringLiteral(s: string): string | null {
  if (s.length < 2) return null;
  const first = s[0];
  const last = s[s.length - 1];
  if ((first === '"' || first === "'") && first === last) {
    return s.slice(1, -1);
  }
  return null;
}

/** Split a TS type expression on top-level `|`. */
function splitTopLevelUnion(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  let inStr: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      buf += ch;
      if (ch === inStr && s[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      buf += ch;
      continue;
    }
    if (ch === "<" || ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ">" || ch === ")" || ch === "]" || ch === "}") depth--;
    if (depth === 0 && ch === "|") {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.length > 0) out.push(buf);
  return out.map((p) => p.trim()).filter((p) => p.length > 0);
}

/**
 * Project a component meta into a registry record. The `input_schema` is a
 * JSON-Schema-shaped object derived from the meta's `props[]`.
 */
export function projectComponent(item: LoadedMeta): RegistryComponent {
  const { meta, stem } = item;
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  for (const prop of meta.props) {
    const schema = tsTypeToJsonSchema(prop.type);
    if (prop.description) schema.description = prop.description;
    if (prop.default !== undefined) schema.default = prop.default;
    if (prop.attribute) schema["x-attribute"] = prop.attribute;
    if (prop.reflect) schema["x-reflect"] = true;
    properties[prop.name] = schema;
    if (prop.required) required.push(prop.name);
  }

  const input_schema: JsonSchemaObject = {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };

  return {
    tag: meta.tag,
    name: meta.name,
    className: meta.className,
    import: `${LIBRARY_NAME}/${stem}`,
    tier: meta.tier,
    group: meta.tags[0] ?? "",
    category: meta.category,
    stability: meta.stability,
    goal: meta.goal,
    description: meta.description,
    ...(meta.limitations !== undefined ? { limitations: meta.limitations } : {}),
    input_schema,
    events: meta.events.map((e) => ({
      name: e.name,
      detail: e.detail,
      bubbles: e.bubbles,
      composed: e.composed,
      description: e.description,
    })),
    slots: meta.slots.map((s) => ({
      name: s.name,
      description: s.description,
      ...(s.required ? { required: true } : {}),
    })),
    cssVariables: meta.cssVariables.map((c) => ({
      name: c.name,
      kind: c.kind,
      description: c.description,
      ...(c.fallback !== undefined ? { fallback: c.fallback } : {}),
    })),
  };
}

function sortRegistryComponents(rows: RegistryComponent[]): RegistryComponent[] {
  const order = new Map(CATEGORY_ORDER.map((c, i) => [c, i] as const));
  return rows.slice().sort((a, b) => {
    const ca = order.get(a.category) ?? 99;
    const cb = order.get(b.category) ?? 99;
    if (ca !== cb) return ca - cb;
    return a.tag.localeCompare(b.tag);
  });
}

async function readPackageVersion(): Promise<string> {
  const pkgFile = path.join(REPO_ROOT, "package.json");
  const raw = await fs.readFile(pkgFile, "utf8");
  const pkg = JSON.parse(raw) as { version?: string };
  return pkg.version ?? "0.0.0";
}

export interface BuildRegistryOptions {
  /** Override the dist root (defaults to <repo>/dist). */
  distDir?: string;
  /** Override the timestamp (deterministic builds / tests). */
  generatedAt?: string;
}

export async function buildRegistry(
  opts: BuildRegistryOptions = {}
): Promise<{ written: string[]; total: number }> {
  const distDir = opts.distDir ?? DEFAULT_DIST;
  const distRegistryDir = path.join(distDir, "registry");
  const distByTier = path.join(distRegistryDir, "by-tier");
  const distByGroup = path.join(distRegistryDir, "by-group");
  const distByCategory = path.join(distRegistryDir, "by-category");

  const all = await loadAllMeta();
  if (all.length === 0) {
    return { written: [], total: 0 };
  }

  const version = await readPackageVersion();
  const generatedAt = opts.generatedAt ?? new Date().toISOString();
  const allComponents = sortRegistryComponents(all.map(projectComponent));

  const fullRegistry: Registry = {
    schemaVersion: REGISTRY_SCHEMA_VERSION,
    library: LIBRARY_NAME,
    version,
    generatedAt,
    filter: null,
    components: allComponents,
  };

  await fs.mkdir(distRegistryDir, { recursive: true });
  await fs.mkdir(distByTier, { recursive: true });
  await fs.mkdir(distByGroup, { recursive: true });
  await fs.mkdir(distByCategory, { recursive: true });

  const written: string[] = [];
  const writeJson = async (file: string, value: unknown): Promise<void> => {
    await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
    written.push(file);
  };

  // Full registry
  await writeJson(path.join(distDir, "registry.json"), fullRegistry);

  // By tier
  for (const tier of TIERS) {
    const filtered: Registry = {
      ...fullRegistry,
      filter: { axis: "tier", value: tier },
      components: allComponents.filter((c) => c.tier === tier),
    };
    await writeJson(path.join(distByTier, `${tier}.json`), filtered);
  }

  // By group
  for (const group of GROUPS) {
    const filtered: Registry = {
      ...fullRegistry,
      filter: { axis: "group", value: group },
      components: allComponents.filter((c) => c.group === group),
    };
    const slug = slugifyGroup(group);
    await writeJson(path.join(distByGroup, `${slug}.json`), filtered);
  }

  // By category
  for (const cat of CATEGORY_ORDER) {
    const filtered: Registry = {
      ...fullRegistry,
      filter: { axis: "category", value: cat },
      components: allComponents.filter((c) => c.category === cat),
    };
    await writeJson(path.join(distByCategory, `${cat}.json`), filtered);
  }

  // Per-tag (single-component) descriptors
  for (const c of allComponents) {
    const single: Registry = {
      ...fullRegistry,
      filter: { axis: "tag", value: c.tag },
      components: [c],
    };
    await writeJson(path.join(distRegistryDir, `${c.tag}.json`), single);
  }

  return { written, total: allComponents.length };
}

async function main(): Promise<void> {
  const { written, total } = await buildRegistry();
  console.log(
    `[gen-registry] OK — ${total} component(s); ${written.length} file(s) written under dist/registry/`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("[gen-registry] CRASH:", e);
    process.exit(2);
  });
}

/**
 * scripts/validate-meta.ts — validates every `*.meta.json` under `src/`
 * against `ComponentMetaSchema`.
 *
 * Stage 1 behavior: when no meta files exist yet, the script is a no-op
 * that exits 0 with a friendly skip message. When at least one meta file
 * is present (Stage 2+), strict checks turn on:
 *
 *   - JSON parse + Zod schema validation
 *   - tag matches filename stem (with `ce-` / `lesson-` rules)
 *   - every component TS file has a sibling `<stem>.meta.json`
 *   - dependency-graph symmetry warnings (X -> Y in `dependencies`
 *     should imply Y -> X in `dependents`)
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ComponentMetaSchema, type ComponentMeta } from "../src/meta/schema.js";
import { GROUPS, isGroup } from "../src/meta/groups.js";
import { TIERS, isTier } from "../src/meta/tiers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");

type FileError = { file: string; message: string };

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

async function findMetaFiles(): Promise<string[]> {
  const all = await walk(SRC_DIR);
  return all.filter((p) => p.endsWith(".meta.json")).sort();
}

async function findComponentSources(): Promise<string[]> {
  const componentsDir = path.join(SRC_DIR, "components");
  const lessonDir = path.join(SRC_DIR, "lesson");
  const ts = [
    ...(await walk(componentsDir)),
    ...(await walk(lessonDir)),
  ].filter((p) => p.endsWith(".ts") && !p.endsWith(".test.ts"));
  return ts.sort();
}

function expectedTagFromStem(stem: string, parent: "components" | "lesson"): string {
  if (parent === "lesson") {
    // Lesson files: filename already encodes the tag (e.g. `lesson-frame`).
    return stem;
  }
  // Components: tag is `ce-<stem>` unless the stem already starts with `lesson-`
  // (defensive — lesson components live in the lesson/ folder, but be permissive).
  if (stem.startsWith("lesson-")) return stem;
  return `ce-${stem}`;
}

function relativize(p: string): string {
  return path.relative(REPO_ROOT, p);
}

async function validateMetaFile(
  file: string,
  validMetas: Map<string, ComponentMeta>
): Promise<FileError[]> {
  const errors: FileError[] = [];

  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (e) {
    errors.push({ file, message: `Cannot read file: ${(e as Error).message}` });
    return errors;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    errors.push({ file, message: `Invalid JSON: ${(e as Error).message}` });
    return errors;
  }

  const result = ComponentMetaSchema.safeParse(json);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const where = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      errors.push({ file, message: `Schema error at ${where}: ${issue.message}` });
    }
    return errors;
  }

  const meta = result.data;
  const baseName = path.basename(file, ".meta.json");
  const parentFolder = path.basename(path.dirname(path.dirname(file)));
  let parent: "components" | "lesson" | null = null;
  if (parentFolder === "components") parent = "components";
  else if (parentFolder === "lesson") parent = "lesson";
  if (parent === null) {
    const flatParent = path.basename(path.dirname(file));
    if (flatParent === "components") parent = "components";
    else if (flatParent === "lesson") parent = "lesson";
  }
  if (parent === null) {
    errors.push({
      file,
      message: `Meta file lives outside src/components/ or src/lesson/ — cannot derive expected tag.`,
    });
    return errors;
  }

  const expectedTag = expectedTagFromStem(baseName, parent);
  if (meta.tag !== expectedTag) {
    errors.push({
      file,
      message: `tag "${meta.tag}" does not match filename stem — expected "${expectedTag}" (from "${baseName}.meta.json" under "${parent}/").`,
    });
    return errors;
  }

  if (validMetas.get(meta.tag)) {
    errors.push({
      file,
      message: `Duplicate tag "${meta.tag}" — already declared by another meta file.`,
    });
    return errors;
  }

  const groupTag = meta.tags?.[0];
  if (!groupTag) {
    errors.push({
      file,
      message: `tags[] is empty — first entry must be one of: ${GROUPS.join(", ")}.`,
    });
    return errors;
  }
  if (!isGroup(groupTag)) {
    errors.push({
      file,
      message: `tags[0] "${groupTag}" is not a canonical group. Allowed: ${GROUPS.join(", ")}. (Edit src/meta/groups.ts to add a new one.)`,
    });
    return errors;
  }

  if (!isTier(meta.tier)) {
    errors.push({
      file,
      message: `tier "${meta.tier}" is not a canonical tier. Allowed: ${TIERS.join(", ")}. (Edit src/meta/tiers.ts to add a new one — see ADR-006.)`,
    });
    return errors;
  }

  validMetas.set(meta.tag, meta);
  return errors;
}

async function crossCheckSources(errors: FileError[]): Promise<void> {
  const componentSources = await findComponentSources();
  const sourcesMissingMeta: string[] = [];
  for (const src of componentSources) {
    const stem = path.basename(src, ".ts");
    const dir = path.dirname(src);
    const candidateA = path.join(dir, `${stem}.meta.json`);
    const exists = await fs
      .stat(candidateA)
      .then(() => true)
      .catch(() => false);
    if (!exists) sourcesMissingMeta.push(src);
  }
  if (sourcesMissingMeta.length > 0) {
    console.log(
      `[validate-meta] Cross-check: ${sourcesMissingMeta.length} component source(s) missing a sibling .meta.json:`
    );
    for (const s of sourcesMissingMeta) {
      console.log(`  - ${relativize(s)}`);
      errors.push({
        file: s,
        message: `Component source has no sibling .meta.json (expected ${path.basename(s, ".ts")}.meta.json).`,
      });
    }
  } else {
    console.log(
      `[validate-meta] Cross-check: every component source has a sibling .meta.json.`
    );
  }
}

async function checkEventNameDrift(
  metaFiles: string[],
  errors: FileError[]
): Promise<void> {
  for (const metaFile of metaFiles) {
    const meta = await fs
      .readFile(metaFile, "utf8")
      .then((raw) => JSON.parse(raw) as ComponentMeta)
      .catch(() => null);
    if (!meta || !Array.isArray(meta.events) || meta.events.length === 0) continue;
    const folder = path.dirname(metaFile);
    const sharedSearchRoots = [
      folder,
      path.join(SRC_DIR, "internal"),
      path.join(SRC_DIR, "core"),
    ];
    const tsFiles: string[] = [];
    for (const root of sharedSearchRoots) {
      const all = await walk(root);
      for (const f of all) if (f.endsWith(".ts")) tsFiles.push(f);
    }
    let folderText = "";
    for (const f of tsFiles) {
      try {
        folderText += await fs.readFile(f, "utf8");
        folderText += "\n";
      } catch {}
    }
    for (const ev of meta.events) {
      const literalDouble = `"${ev.name}"`;
      const literalSingle = `'${ev.name}'`;
      if (!folderText.includes(literalDouble) && !folderText.includes(literalSingle)) {
        errors.push({
          file: metaFile,
          message: `events[].name "${ev.name}" is not referenced as a string literal anywhere in the component folder (${path.relative(REPO_ROOT, folder)}) or shared helpers (src/internal, src/core). Either source or meta drifted — fix the one that's wrong.`,
        });
      }
    }
  }
}

async function main(): Promise<void> {
  const metaFiles = await findMetaFiles();

  if (metaFiles.length === 0) {
    console.log(
      "[validate-meta] No meta files yet — skipping (Stage 1 / Phase 2 not started)."
    );
    process.exit(0);
  }

  const errors: FileError[] = [];
  const warnings: FileError[] = [];
  const validMetas = new Map<string, ComponentMeta>();

  // — Step 1: parse + schema-validate each meta file ——————————————
  for (const file of metaFiles) {
    errors.push(...(await validateMetaFile(file, validMetas)));
  }

  // — Step 3: cross-check that every component TS has a meta sibling ——
  await crossCheckSources(errors);

  // — Step 3.5: event-name drift gate (ADR-011 follow-up) ————————————
  // Every meta `events[].name` MUST appear as a string literal somewhere
  // in the component's folder (any sibling .ts file — covers helpers and
  // tests). Catches the exact bug class that broke v2's group-by:
  // a meta declared an event name no source code references at all.
  await checkEventNameDrift(metaFiles, errors);

  // — Step 4: dependency-graph symmetry (warnings only) ——————————————
  //
  // Build a set of all known sub-tags across all metas. A sub-tag is a
  // custom element registered alongside its parent (e.g. ce-segment under
  // ce-segmented). Sub-tags share the parent's lifecycle and intentionally
  // do NOT carry their own meta file, so the dependency-graph validator
  // must silently accept them when they appear in a parent's dependencies[].
  const knownSubTags = new Set<string>();
  for (const meta of validMetas.values()) {
    if (meta.subTags) {
      for (const sub of meta.subTags) knownSubTags.add(sub);
    }
  }

  for (const [tag, meta] of validMetas) {
    for (const depTag of meta.dependencies) {
      const depMeta = validMetas.get(depTag);
      if (!depMeta) {
        // Suppress the warning for known sub-tags — they intentionally
        // have no meta file (see knownSubTags computation above).
        if (knownSubTags.has(depTag)) continue;
        // Can't symmetry-check a tag that doesn't exist in our universe.
        // Could be a future component or external — leave as a warning.
        warnings.push({
          file: `(meta:${tag})`,
          message: `lists dependency "${depTag}" but no meta file declares that tag.`,
        });
        continue;
      }
      if (!depMeta.dependents.includes(tag)) {
        warnings.push({
          file: `(meta:${depTag})`,
          message: `should list "${tag}" in dependents (because "${tag}" lists "${depTag}" in dependencies).`,
        });
      }
    }
    for (const parentTag of meta.dependents) {
      const parentMeta = validMetas.get(parentTag);
      if (!parentMeta) {
        warnings.push({
          file: `(meta:${tag})`,
          message: `lists dependent "${parentTag}" but no meta file declares that tag.`,
        });
        continue;
      }
      if (!parentMeta.dependencies.includes(tag)) {
        warnings.push({
          file: `(meta:${parentTag})`,
          message: `should list "${tag}" in dependencies (because "${tag}" lists "${parentTag}" in dependents).`,
        });
      }
    }
  }

  if (warnings.length > 0) {
    console.log(`[validate-meta] WARN — ${warnings.length} dependency-graph asymmetry warning(s):`);
    for (const w of warnings) {
      console.log(`  WARN ${w.file}: ${w.message}`);
    }
  }

  // — Step 5: report ——————————————
  if (errors.length > 0) {
    const grouped = new Map<string, string[]>();
    for (const e of errors) {
      const key = relativize(e.file);
      const list = grouped.get(key) ?? [];
      list.push(e.message);
      grouped.set(key, list);
    }
    console.error(`\n[validate-meta] FAIL — ${errors.length} error(s):`);
    for (const [file, msgs] of grouped) {
      console.error(`\n  ${file}`);
      for (const m of msgs) console.error(`    - ${m}`);
    }
    process.exit(1);
  }

  console.log(
    `[validate-meta] OK — ${metaFiles.length} file(s) validated.`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("[validate-meta] CRASH:", e);
  process.exit(2);
});

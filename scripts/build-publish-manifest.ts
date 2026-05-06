/**
 * scripts/build-publish-manifest.ts — writes a manifest variant that
 * excludes components with `category: "internal"`.
 *
 * Two modes:
 *
 *   1. Default (no flags): runs `generateAll({ publishOnly: true })` which
 *      writes `src/manifest.publish.ts` next to `src/manifest.ts`. Useful
 *      for inspecting what the publish manifest would look like.
 *
 *   2. `--apply`: the publish path. Saves `src/manifest.ts`, overwrites it
 *      with the filtered (publish-only) manifest, runs `pnpm build`, then
 *      restores the original `src/manifest.ts` in a try/finally so a
 *      build crash never leaves the workspace dirty. Used by
 *      `prepublishOnly` so the published `dist/manifest.js` reflects the
 *      filtered list while internal components still ship as JS modules.
 *
 * Stage 1 stub: when no meta files exist, exits 0 with a skip warning so
 * the publish path stays usable.
 */

import { fileURLToPath } from "node:url";
import { promises as fs, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { generateAll } from "./generate-exports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");
const MANIFEST_FILE = path.join(SRC_DIR, "manifest.ts");
const PUBLISH_FILE = path.join(SRC_DIR, "manifest.publish.ts");

function relativize(p: string): string {
  return path.relative(REPO_ROOT, p);
}

/** Run a child command, inheriting stdio so output streams to the user. */
function runCmd(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: REPO_ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function defaultMode(): Promise<void> {
  const { written, count } = await generateAll({ publishOnly: true });
  if (count === 0) {
    console.log(
      "[build-publish-manifest] No meta files yet — skipping; manifest.publish.ts not generated."
    );
    process.exit(0);
  }
  console.log(
    `[build-publish-manifest] OK — wrote publish manifest from ${count} non-internal meta file(s); ${written.length} file(s) updated.`
  );
  for (const f of written) {
    console.log(`  + ${relativize(f)}`);
  }
}

async function applyMode(): Promise<void> {
  // 1. Generate publish-only manifest (writes src/manifest.publish.ts).
  const { count } = await generateAll({ publishOnly: true });
  if (count === 0) {
    console.log(
      "[build-publish-manifest --apply] No meta files yet — skipping; running build with the existing manifest."
    );
    // Run build directly (vite build && tsc) — we deliberately bypass
    // `pnpm build` so the `prebuild` lifecycle hook doesn't regenerate
    // src/manifest.ts under us.
    await runCmd("pnpm", ["exec", "vite", "build"]);
    await runCmd("pnpm", ["exec", "tsc", "-p", "tsconfig.build.json"]);
    return;
  }

  // 2. Read both manifests so we have the swap material.
  let originalManifest: string;
  try {
    originalManifest = await fs.readFile(MANIFEST_FILE, "utf8");
  } catch (e) {
    throw new Error(
      `[build-publish-manifest --apply] Cannot read ${relativize(MANIFEST_FILE)}: ${(e as Error).message}`
    );
  }
  let publishManifest: string;
  try {
    publishManifest = await fs.readFile(PUBLISH_FILE, "utf8");
  } catch (e) {
    throw new Error(
      `[build-publish-manifest --apply] Cannot read ${relativize(PUBLISH_FILE)}: ${(e as Error).message}`
    );
  }

  // 3. Set up a synchronous restore hook in case the process is killed
  //    before we get to the try/finally — keeps the workspace clean.
  let restored = false;
  const restoreSync = () => {
    if (restored) return;
    try {
      writeFileSync(MANIFEST_FILE, originalManifest, "utf8");
      restored = true;
    } catch {
      // best effort — process is already exiting
    }
  };
  process.on("exit", restoreSync);
  process.on("SIGINT", () => {
    restoreSync();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    restoreSync();
    process.exit(143);
  });

  console.log(
    `[build-publish-manifest --apply] Swapping ${relativize(MANIFEST_FILE)} → publish-only manifest (${count} non-internal components).`
  );

  try {
    await fs.writeFile(MANIFEST_FILE, publishManifest, "utf8");
    // Run vite + tsc directly — we deliberately bypass `pnpm build` so the
    // `prebuild` lifecycle hook doesn't regenerate src/manifest.ts and undo
    // our swap.
    await runCmd("pnpm", ["exec", "vite", "build"]);
    await runCmd("pnpm", ["exec", "tsc", "-p", "tsconfig.build.json"]);
    console.log("[build-publish-manifest --apply] Build complete.");
  } finally {
    await fs.writeFile(MANIFEST_FILE, originalManifest, "utf8");
    restored = true;
    console.log(
      `[build-publish-manifest --apply] Restored ${relativize(MANIFEST_FILE)} to its pre-publish state.`
    );
  }
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  if (apply) {
    await applyMode();
  } else {
    await defaultMode();
  }
}

main().catch((e) => {
  console.error("[build-publish-manifest] CRASH:", e);
  process.exit(2);
});

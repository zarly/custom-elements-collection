import { defineConfig, type Plugin, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import { resolve } from "node:path";
import {
  readdirSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  statSync,
  rmSync,
} from "node:fs";
import { buildRegistry } from "./scripts/generate-registry.js";

// Opt-in bundle analyzer. Set ANALYZE=1 (or run `pnpm analyze`) to emit
// internal/bundle-visualizer-{treemap,sunburst,network}.html alongside the
// JSONL records produced by `pnpm bundle-stats`. Skipped on every other build
// so default `pnpm build` stays fast and side-effect free.
const ANALYZE = process.env.ANALYZE === "1";

const entriesDir = resolve(__dirname, "src/entries");
const entryInputs = Object.fromEntries(
  readdirSync(entriesDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => [`entries/${f.replace(/\.ts$/, "")}`, resolve(entriesDir, f)])
);

/** Copies src/tokens/*.css → dist/tokens/ after the JS build. */
function copyTokens(): Plugin {
  return {
    name: "copy-tokens",
    apply: "build",
    closeBundle() {
      const src = resolve(__dirname, "src/tokens");
      const dst = resolve(__dirname, "dist/tokens");
      mkdirSync(dst, { recursive: true });
      for (const f of readdirSync(src)) {
        if (f.endsWith(".css")) copyFileSync(resolve(src, f), resolve(dst, f));
      }
    },
  };
}

/**
 * Copies every src/**\/*.meta.json → dist/meta/<tag>.json AND emits a
 * combined dist/meta/index.json bundle. Opt-in for consumers via the
 * `./meta/*` and `./meta` package.json subpaths — does NOT affect any
 * component's runtime bundle.
 */
function copyMeta(): Plugin {
  return {
    name: "copy-meta",
    apply: "build",
    closeBundle() {
      const dst = resolve(__dirname, "dist/meta");
      mkdirSync(dst, { recursive: true });
      const bundle: Record<string, unknown> = {};
      const walk = (dir: string): void => {
        for (const entry of readdirSync(dir)) {
          const full = resolve(dir, entry);
          const s = statSync(full);
          if (s.isDirectory()) {
            walk(full);
            continue;
          }
          if (!entry.endsWith(".meta.json")) continue;
          const raw = readFileSync(full, "utf8");
          const json = JSON.parse(raw) as { tag?: string };
          if (typeof json.tag !== "string") continue;
          writeFileSync(resolve(dst, `${json.tag}.json`), raw);
          bundle[json.tag] = json;
        }
      };
      walk(resolve(__dirname, "src/components"));
      walk(resolve(__dirname, "src/lesson"));
      writeFileSync(
        resolve(dst, "index.json"),
        JSON.stringify(bundle, null, 2)
      );
    },
  };
}

/**
 * Emits the LLM-tool-use-shaped registry under `dist/registry*.json`. See
 * ADR-007. Runs after copyMeta so the timestamp / version is the latest and
 * the meta files are already validated by the upstream pipeline.
 *
 * The `buildRegistry()` function lives in `scripts/generate-registry.ts` so
 * `pnpm gen-registry` can run it standalone for testing or debugging.
 */
function copyRegistry(): Plugin {
  return {
    name: "copy-registry",
    apply: "build",
    async closeBundle() {
      await buildRegistry();
    },
  };
}

/**
 * Drops the source map for the catalog-data entry. `dist/manifest.js` is a
 * JSON-shaped data export (~33 KB raw) — it has no callable code worth
 * debugging, and its 43 KB `.map` ships in the tarball today via `files: ["dist"]`.
 * Removing the map is a pure payload win with no public-API impact.
 *
 * Component sourcemaps (`dist/chunks/*.map`, `dist/entries/*.map`) stay on
 * because consumers regularly stack-trace through them.
 */
function dropManifestSourcemap(): Plugin {
  return {
    name: "drop-manifest-sourcemap",
    apply: "build",
    enforce: "post",
    closeBundle() {
      const map = resolve(__dirname, "dist/manifest.js.map");
      try {
        rmSync(map, { force: true });
      } catch {
        /* nothing to drop — initial build, or map was never emitted */
      }
      // Strip the trailing //# sourceMappingURL=manifest.js.map comment so
      // browsers don't try to fetch the deleted file.
      const js = resolve(__dirname, "dist/manifest.js");
      try {
        const txt = readFileSync(js, "utf8");
        const cleaned = txt.replace(/\n\/\/# sourceMappingURL=manifest\.js\.map\s*$/, "\n");
        if (cleaned !== txt) writeFileSync(js, cleaned);
      } catch {
        /* dist/manifest.js missing — nothing to clean */
      }
    },
  };
}

function analyzePlugins(): PluginOption[] {
  if (!ANALYZE) return [];
  const out = resolve(__dirname, "internal");
  // enforce: 'post' so the analyzer sees Rolldown's final chunk shapes,
  // not pre-codegen module records.
  const shared = {
    gzipSize: true,
    brotliSize: true,
    sourcemap: true,
    open: false,
    emitFile: false,
  } as const;
  return [
    {
      ...visualizer({
        ...shared,
        template: "treemap",
        title: "ce — bundle treemap",
        filename: resolve(out, "bundle-visualizer-treemap.html"),
      }),
      enforce: "post",
    },
    {
      ...visualizer({
        ...shared,
        template: "sunburst",
        title: "ce — bundle sunburst",
        filename: resolve(out, "bundle-visualizer-sunburst.html"),
      }),
      enforce: "post",
    },
    {
      ...visualizer({
        ...shared,
        template: "network",
        title: "ce — chunk network",
        filename: resolve(out, "bundle-visualizer-network.html"),
      }),
      enforce: "post",
    },
  ] as PluginOption[];
}

export default defineConfig({
  plugins: [copyTokens(), copyMeta(), copyRegistry(), dropManifestSourcemap(), ...analyzePlugins()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        auto: resolve(__dirname, "src/auto.ts"),
        manifest: resolve(__dirname, "src/manifest.ts"),
        ...entryInputs,
      },
      formats: ["es"],
    },
    rollupOptions: {
      // Bundle Lit so a single <script type="module"> works in plain HTML with
      // no import map. The full bundle is small enough (~14 KB gzipped) to
      // justify the tradeoff over making consumers resolve bare specifiers.
      external: [],
      output: {
        preserveModules: false,
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  server: {
    fs: { allow: [".."] },
  },
});

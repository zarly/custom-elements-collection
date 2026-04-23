import { defineConfig, type Plugin } from "vite";
import { resolve } from "node:path";
import { readdirSync, mkdirSync, copyFileSync } from "node:fs";

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

export default defineConfig({
  plugins: [copyTokens()],
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

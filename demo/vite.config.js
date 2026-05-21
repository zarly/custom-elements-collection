import { defineConfig } from "vite";
import { resolve } from "node:path";

// Serve the demo alongside the sibling library source at `../src/`.
// `/src/...` paths in index.html resolve into ../src via the fs allow-list.
const pkgRoot = resolve(__dirname, "..");

// DEMO_BASE controls the URL prefix the built bundle is served from.
// Default "/" is right for local dev (`pnpm demo`) and `pnpm demo:preview`.
// Set it when hosting the built demo under a URL sub-path — e.g.
// `DEMO_BASE=/custom-elements/ pnpm demo:build` makes vite emit asset URLs
// like `/custom-elements/assets/...` instead of `/assets/...`, which would
// otherwise 404 under any non-root mount.
const base = process.env.DEMO_BASE ?? "/";

export default defineConfig({
  root: __dirname,
  base,
  resolve: {
    alias: {
      "/src": resolve(pkgRoot, "src"),
    },
  },
  server: {
    fs: { allow: [pkgRoot] },
    port: 4600,
    host: "0.0.0.0",
  },
  preview: {
    port: 4600,
    host: "0.0.0.0",
  },
});

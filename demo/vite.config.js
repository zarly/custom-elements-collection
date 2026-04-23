import { defineConfig } from "vite";
import { resolve } from "node:path";

// Serve the demo alongside the sibling library source at `../src/`.
// `/src/...` paths in index.html resolve into ../src via the fs allow-list.
const pkgRoot = resolve(__dirname, "..");

export default defineConfig({
  root: __dirname,
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

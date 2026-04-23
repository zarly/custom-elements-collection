/**
 * Side-effect entry for <ce-heatmap>.
 * Import this module (or use the "heatmap" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeHeatmap } from "../components/heatmap.js";

defineOnce("ce-heatmap", CeHeatmap);

export { CeHeatmap };

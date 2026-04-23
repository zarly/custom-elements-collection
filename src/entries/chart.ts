/**
 * Side-effect entry for <ce-chart>.
 * Import this module (or use the "chart" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeChart } from "../components/chart.js";

defineOnce("ce-chart", CeChart);

export { CeChart };

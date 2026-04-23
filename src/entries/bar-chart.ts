/**
 * Side-effect entry for <ce-bar-chart>.
 * Import this module (or use the "bar-chart" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeBarChart } from "../components/bar-chart.js";

defineOnce("ce-bar-chart", CeBarChart);

export { CeBarChart };

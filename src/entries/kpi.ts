/**
 * Side-effect entry for <ce-kpi>.
 * Import this module (or use the "kpi" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeKpi } from "../components/kpi.js";

defineOnce("ce-kpi", CeKpi);

export { CeKpi };

/**
 * Side-effect entry for <ce-compare>.
 * Import this module (or use the "compare" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeCompare } from "../components/compare.js";

defineOnce("ce-compare", CeCompare);

export { CeCompare };

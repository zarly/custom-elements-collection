/**
 * Side-effect entry for <ce-filter-bar>.
 * Import this module (or use the "filter-bar" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeFilterBar } from "../components/filter-bar.js";

defineOnce("ce-filter-bar", CeFilterBar);

export { CeFilterBar };

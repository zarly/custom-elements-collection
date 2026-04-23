/**
 * Side-effect entry for <ce-grid>.
 * Import this module (or use the "grid" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeGrid } from "../components/grid.js";

defineOnce("ce-grid", CeGrid);

export { CeGrid };

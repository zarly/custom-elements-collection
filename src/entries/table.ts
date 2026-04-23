/**
 * Side-effect entry for <ce-table>.
 * Import this module (or use the "table" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeTable } from "../components/table.js";

defineOnce("ce-table", CeTable);

export { CeTable };

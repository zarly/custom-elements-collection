/**
 * Side-effect entry for <ce-chip>.
 * Import this module (or use the "chip" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeChip } from "../components/chip.js";

defineOnce("ce-chip", CeChip);

export { CeChip };

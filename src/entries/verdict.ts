/**
 * Side-effect entry for <ce-verdict>.
 * Import this module (or use the "verdict" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeVerdict } from "../components/verdict.js";

defineOnce("ce-verdict", CeVerdict);

export { CeVerdict };

/**
 * Side-effect entry for <ce-code>.
 * Import this module (or use the "code" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeCode } from "../components/code.js";

defineOnce("ce-code", CeCode);

export { CeCode };

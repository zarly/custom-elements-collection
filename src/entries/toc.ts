/**
 * Side-effect entry for <ce-toc>.
 * Import this module (or use the "toc" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeToc } from "../components/toc.js";

defineOnce("ce-toc", CeToc);

export { CeToc };

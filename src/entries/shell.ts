/**
 * Side-effect entry for <ce-shell>.
 * Import this module (or use the "shell" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeShell } from "../components/shell.js";

defineOnce("ce-shell", CeShell);

export { CeShell };

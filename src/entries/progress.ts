/**
 * Side-effect entry for <ce-progress>.
 * Import this module (or use the "progress" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeProgress } from "../components/progress.js";

defineOnce("ce-progress", CeProgress);

export { CeProgress };

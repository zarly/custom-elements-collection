/**
 * Side-effect entry for <ce-section>.
 * Import this module (or use the "section" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeSection } from "../components/section.js";

defineOnce("ce-section", CeSection);

export { CeSection };

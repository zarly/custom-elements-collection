/**
 * Side-effect entry for <ce-details>.
 * Import this module (or use the "details" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeDetails } from "../components/details.js";

defineOnce("ce-details", CeDetails);

export { CeDetails };

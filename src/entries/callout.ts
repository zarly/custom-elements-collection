/**
 * Side-effect entry for <ce-callout>.
 * Import this module (or use the "callout" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeCallout } from "../components/callout.js";

defineOnce("ce-callout", CeCallout);

export { CeCallout };

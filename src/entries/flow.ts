/**
 * Side-effect entry for <ce-flow>.
 * Import this module (or use the "flow" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeFlow } from "../components/flow.js";

defineOnce("ce-flow", CeFlow);

export { CeFlow };

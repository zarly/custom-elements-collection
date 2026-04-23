/**
 * Side-effect entry for <ce-timeline>.
 * Import this module (or use the "timeline" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeTimeline } from "../components/timeline.js";

defineOnce("ce-timeline", CeTimeline);

export { CeTimeline };

/**
 * Side-effect entry for <ce-example>.
 * Import this module (or use the "example" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeExample } from "../components/example.js";

defineOnce("ce-example", CeExample);

export { CeExample };

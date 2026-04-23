/**
 * Side-effect entry for <ce-persona>.
 * Import this module (or use the "persona" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CePersona } from "../components/persona.js";

defineOnce("ce-persona", CePersona);

export { CePersona };

/**
 * Side-effect entry for <ce-hero>.
 * Import this module (or use the "hero" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeHero } from "../components/hero.js";

defineOnce("ce-hero", CeHero);

export { CeHero };

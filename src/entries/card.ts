/**
 * Side-effect entry for <ce-card>.
 * Import this module (or use the "card" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeCard } from "../components/card.js";

defineOnce("ce-card", CeCard);

export { CeCard };

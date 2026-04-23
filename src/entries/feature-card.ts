/**
 * Side-effect entry for <ce-feature-card>.
 * Import this module (or use the "feature-card" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeFeatureCard } from "../components/feature-card.js";

defineOnce("ce-feature-card", CeFeatureCard);

export { CeFeatureCard };

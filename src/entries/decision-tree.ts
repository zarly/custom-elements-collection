/**
 * Side-effect entry for <ce-decision-tree>.
 * Import this module (or use the "decision-tree" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeDecisionTree } from "../components/decision-tree.js";

defineOnce("ce-decision-tree", CeDecisionTree);

export { CeDecisionTree };

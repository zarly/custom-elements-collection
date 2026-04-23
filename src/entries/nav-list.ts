/**
 * Side-effect entry for <ce-nav-list>.
 * Import this module (or use the "nav-list" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeNavList } from "../components/nav-list.js";

defineOnce("ce-nav-list", CeNavList);

export { CeNavList };

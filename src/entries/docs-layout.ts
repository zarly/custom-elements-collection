/**
 * Side-effect entry for <ce-docs-layout>.
 * Import this module (or use the "docs-layout" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeDocsLayout } from "../components/docs-layout.js";

defineOnce("ce-docs-layout", CeDocsLayout);

export { CeDocsLayout };

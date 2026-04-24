/**
 * Side-effect entry for <ce-theme-switcher>.
 * Import this module (or use the "theme-switcher" subpath) to register just this tag.
 */
import { defineOnce } from "../core/index.js";
import { CeThemeSwitcher } from "../components/theme-switcher.js";

defineOnce("ce-theme-switcher", CeThemeSwitcher);

export { CeThemeSwitcher };
export type { ThemeSwitcherOption } from "../components/theme-switcher.js";

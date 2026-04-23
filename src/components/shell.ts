import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecTheme } from "../core/index.js";

/**
 * `<ce-shell>` — page wrapper. Sets the max-width layout, ensures tokens
 * scaffolding is active, and propagates the theme attribute to <html>.
 *
 * Attributes:
 *   theme  — "dark" | "light" (default "dark")
 *   width  — max container width ("narrow" 720 | "default" 1200 | "wide" 1440 | "full")
 *
 * Slot: default
 */
export class CeShell extends CecElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      margin: 0 auto;
      padding: var(--ce-space-6) var(--ce-space-5);
      box-sizing: border-box;
    }
    :host([width="narrow"]) { max-width: 720px; }
    :host,
    :host([width="default"]) { max-width: 1200px; }
    :host([width="wide"]) { max-width: 1440px; }
    :host([width="full"]) { max-width: 100%; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  // NOTE: theme is NOT reflected to the DOM — reflection would fire
  // attributeChangedCallback during the first update and incorrectly mark
  // the theme as explicitly set. The explicit-vs-default distinction is
  // what lets a consumer-provided <html data-ce-theme="light"> win.
  @property({ type: String })
  theme: CecTheme = "dark";

  @property({ type: String, reflect: true })
  width: "narrow" | "default" | "wide" | "full" = "default";

  /** On connect: seed the root scaffold/theme without clobbering existing state.
   *  On subsequent theme property changes: propagate to <html>. The first
   *  `updated()` pass is treated as part of the initial connect and does not
   *  overwrite a pre-existing root theme. */
  #firstUpdateDone = false;

  override connectedCallback(): void {
    super.connectedCallback();
    const root = this.ownerDocument?.documentElement;
    if (root) {
      if (!root.hasAttribute("data-ce-scaffold")) {
        root.setAttribute("data-ce-scaffold", "");
      }
      // If the consumer explicitly wrote <ce-shell theme="…">, honor it.
      // Otherwise only seed the root when it has no theme yet.
      const explicitOnElement = this.hasAttribute("theme");
      if (explicitOnElement) {
        root.setAttribute("data-ce-theme", this.theme);
      } else if (!root.hasAttribute("data-ce-theme")) {
        root.setAttribute("data-ce-theme", this.theme);
      }
    }
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (!this.#firstUpdateDone) {
      this.#firstUpdateDone = true;
      return;
    }
    if (changed.has("theme")) {
      const root = this.ownerDocument?.documentElement;
      if (root) root.setAttribute("data-ce-theme", this.theme);
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../../core/index.js";

/**
 * `<ce-mark>` — highlighted inline span.
 *
 * Themed highlighter for inline text — search-result hits, AI-mentioned
 * entities, "this changed" emphasis.
 *
 * Attributes:
 *   color   — CecColor (default "amber")
 *   weight  — "subtle" | "strong"  (default "subtle"; "strong" uses a saturated
 *             fill with inverted text)
 *
 * Slot: default — the highlighted text.
 */
export class CeMark extends CecElement {
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  static override styles = css`
    :host {
      display: inline;
      padding: 0 var(--ce-space-1);
      border-radius: var(--ce-radius-sm);
      background: var(--ce-color-amber-bg);
      color: var(--ce-text);
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
    :host([color="green"])  { background: var(--ce-color-green-bg);  }
    :host([color="red"])    { background: var(--ce-color-red-bg);    }
    :host([color="blue"])   { background: var(--ce-color-blue-bg);   }
    :host([color="purple"]) { background: var(--ce-color-purple-bg); }
    :host([color="cyan"])   { background: var(--ce-color-cyan-bg);   }
    :host([color="neutral"]) { background: var(--ce-surface-2); color: var(--ce-muted); }

    :host([weight="strong"][color="amber"])  { background: var(--ce-color-amber);  color: var(--ce-text-inverse); }
    :host([weight="strong"][color="green"])  { background: var(--ce-color-green);  color: var(--ce-text-inverse); }
    :host([weight="strong"][color="red"])    { background: var(--ce-color-red);    color: var(--ce-text-inverse); }
    :host([weight="strong"][color="blue"])   { background: var(--ce-color-blue);   color: var(--ce-text-inverse); }
    :host([weight="strong"][color="purple"]) { background: var(--ce-color-purple); color: var(--ce-text-inverse); }
    :host([weight="strong"][color="cyan"])   { background: var(--ce-color-cyan);   color: var(--ce-text-inverse); }
    :host([weight="strong"][color="neutral"]) { background: var(--ce-muted); color: var(--ce-text-inverse); }
    :host([weight="strong"]:not([color])) { background: var(--ce-color-amber); color: var(--ce-text-inverse); }
  `;

  @property({ type: String, reflect: true }) color: CecColor | null = null;
  @property({ type: String, reflect: true }) weight: "subtle" | "strong" = "subtle";

  override render() {
    return html`<slot></slot>`;
  }
}

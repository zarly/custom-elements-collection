import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-stat-group>` — grid wrapper that arranges KPI cards (or any cells)
 * with a consistent gutter and column count.
 *
 * Attributes:
 *   columns — fixed column count (e.g. 4) or "auto" for fit-content.
 *   gap     — gap size: "sm" | "md" | "lg"
 *
 * Slot: default — child cells (typically <ce-kpi>)
 */
export class CeStatGroup extends CecElement {
  static override styles = css`
    :host {
      display: grid;
      gap: var(--ce-space-3);
    }
    :host([gap="sm"]) { gap: var(--ce-space-2); }
    :host([gap="lg"]) { gap: var(--ce-space-5); }

    :host([columns="auto"]) {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
    :host([columns="2"]) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    :host([columns="3"]) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    :host([columns="4"]) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    :host([columns="5"]) { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    :host([columns="6"]) { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  columns: string = "auto";

  @property({ type: String, reflect: true })
  gap: "sm" | "md" | "lg" = "md";

  override render() {
    return html`<slot></slot>`;
  }
}

import { html, css } from "lit";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-progress-list>` — vertical flex container for progress rows.
 *
 * Light DOM layout component. Accepts any children; `<ce-progress>` rows,
 * `<p>`, `<ce-callout>`, and arbitrary HTML all render correctly.
 *
 * No props in v1. Gap is controlled by the `--ce-progress-list-gap` custom
 * property (default `--ce-space-3`).
 */
export class CeProgressList extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--ce-progress-list-gap, var(--ce-space-3));
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

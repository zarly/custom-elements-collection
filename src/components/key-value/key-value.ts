import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-key-value>` — definition-list grid with aligned keys and values.
 *
 * Attributes:
 *   columns — number of column-pairs (default 1)
 *   wrap    — boolean; allow value text to wrap (default true)
 *
 * Slot: default — alternating <dt>/<dd> pairs (or any mix that pairs up).
 */
export class CeKeyValue extends CecElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      column-gap: var(--ce-space-4);
      row-gap: var(--ce-space-2);
      margin: 0;
    }
    :host([columns="2"]) dl { grid-template-columns: max-content 1fr max-content 1fr; }
    :host([columns="3"]) dl { grid-template-columns: max-content 1fr max-content 1fr max-content 1fr; }
    ::slotted(dt) {
      color: var(--ce-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: var(--ce-text-xs);
      letter-spacing: 0.04em;
      align-self: center;
    }
    ::slotted(dd) {
      margin: 0;
      color: var(--ce-text);
    }
    :host([wrap="false"]) ::slotted(dd) {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number, reflect: true }) columns = 1;
  @property({ type: String, reflect: true }) wrap: "true" | "false" = "true";

  override render() {
    return html`<dl><slot></slot></dl>`;
  }
}

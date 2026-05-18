import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-kv>` — single key-value row brick.
 *
 * Renders a label/key on the left and slotted content on the right.
 * The value slot accepts any HTML: plain text, `<a>`, `<time>`, `<code>`,
 * `<ce-chip>`, or future typed renderers — per CDR-002.
 *
 * Attributes:
 *   key — short label string (identity-shaped; never the value)
 *
 * Slot: default — the value content (CDR-002: stays in children)
 *
 * @example Simple text value
 * <ce-kv key="Model">chat-deep</ce-kv>
 *
 * @example Link value
 * <ce-kv key="Docs"><a href="https://example.com">Reference</a></ce-kv>
 *
 * @example Chip value
 * <ce-kv key="Status"><ce-chip type="green" dot>Live</ce-chip></ce-kv>
 *
 * @example Composed value
 * <ce-kv key="MRR"><strong>$12 480</strong> <ce-chip type="green">+18%</ce-chip></ce-kv>
 */
export class CeKv extends CecElement {
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: max-content 1fr;
      column-gap: var(--ce-space-4);
      align-items: center;
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
    }
    .ce-kv__key {
      color: var(--ce-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: var(--ce-text-xs);
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .ce-kv__value {
      color: var(--ce-text);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) key = "";

  override render() {
    return html`
      <span class="ce-kv__key">${this.key}</span>
      <span class="ce-kv__value"><slot></slot></span>
    `;
  }
}

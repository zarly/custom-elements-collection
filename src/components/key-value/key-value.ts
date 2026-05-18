import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-key-value>` — definition-list grid with aligned keys and values.
 *
 * Two authoring modes (CDR-008 additive — both paths stay working):
 *
 * Mode A — dt/dd pairs (original):
 *   <ce-key-value>
 *     <dt>Status</dt><dd>Active</dd>
 *   </ce-key-value>
 *
 * Mode B — ce-kv children (CDR-002 preferred for composable values):
 *   <ce-key-value>
 *     <ce-kv key="Status"><ce-chip type="green">Live</ce-chip></ce-kv>
 *   </ce-key-value>
 *
 * If any `<ce-kv>` elements are present as direct children, Mode B is used.
 * Otherwise falls back to Mode A (dt/dd slot into a <dl>).
 *
 * Attributes:
 *   columns — number of column-pairs (default 1, Mode A only)
 *   wrap    — boolean; allow value text to wrap (default true, Mode A only)
 */
export class CeKeyValue extends CecElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }

    /* Mode A — dt/dd grid */
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

    /* Mode B — ce-kv children stacked */
    .ce-key-value__kv-list {
      display: flex;
      flex-direction: column;
      row-gap: var(--ce-space-2);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number, reflect: true }) columns = 1;
  @property({ type: String, reflect: true }) wrap: "true" | "false" = "true";

  /** True when direct children include at least one ce-kv element. */
  @state() private _hasCeKv = false;

  private _observer: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._detectMode();
    this._observer = new MutationObserver(() => {
      this._detectMode();
    });
    this._observer.observe(this, { childList: true });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    this._observer = null;
  }

  private _detectMode(): void {
    const hasCeKv = Array.from(this.children).some(
      (c) => c.tagName.toLowerCase() === "ce-kv"
    );
    if (hasCeKv !== this._hasCeKv) {
      this._hasCeKv = hasCeKv;
    }
  }

  override render() {
    if (this._hasCeKv) {
      return html`<div class="ce-key-value__kv-list"><slot></slot></div>`;
    }
    return html`<dl><slot></slot></dl>`;
  }
}

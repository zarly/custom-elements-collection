import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../core/index.js";

/**
 * `<ce-details>` — styled collapsible. Thin wrapper over native
 * `<details>` with chevron animation and theme-consistent spacing.
 *
 * Attributes:
 *   summary — summary text (can be overridden with slot="summary")
 *   open    — boolean; expand state (reflected)
 *   count   — optional right-aligned count chip on the header
 *
 * Slots:
 *   summary    — custom summary markup
 *   (default)  — body content when open
 *
 * Events:
 *   ce-details-toggle — bubbles with { open: boolean }
 */
export class CeDetails extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      overflow: hidden;
      margin: var(--ce-space-2) 0;
    }
    details { padding: 0; margin: 0; }
    summary {
      list-style: none;
      padding: var(--ce-space-3) var(--ce-space-4);
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      color: var(--ce-text);
      user-select: none;
    }
    summary::-webkit-details-marker { display: none; }
    summary::before {
      content: "▸";
      display: inline-block;
      color: var(--ce-muted);
      transition: transform var(--ce-transition-fast);
      font-size: var(--ce-text-sm);
      width: 10px;
    }
    details[open] > summary::before { transform: rotate(90deg); }
    summary:hover { background: rgba(88, 166, 255, 0.04); }

    .ce-details__count {
      margin-left: auto;
      font-size: var(--ce-text-xs);
      padding: 2px 9px;
      border-radius: var(--ce-radius-pill);
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      border: 1px solid var(--ce-border-soft);
      font-weight: 600;
    }
    .ce-details__body {
      padding: 0 var(--ce-space-4) var(--ce-space-3);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) summary = "";
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) count = "";

  override render() {
    return html`
      <details ?open=${this.open} @toggle=${this.#onToggle}>
        <summary>
          <slot name="summary">${this.summary}</slot>
          ${this.count
            ? html`<span class="ce-details__count">${this.count}</span>`
            : nothing}
        </summary>
        <div class="ce-details__body">
          <slot></slot>
        </div>
      </details>
    `;
  }

  #onToggle = (e: Event): void => {
    const d = e.target as HTMLDetailsElement;
    this.open = d.open;
    this.dispatchEvent(
      new CustomEvent("ce-details-toggle", {
        bubbles: true,
        composed: true,
        detail: { open: this.open },
      })
    );
  };
}

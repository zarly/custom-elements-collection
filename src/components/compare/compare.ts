import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-compare>` — before/after (or A/B) side-by-side panel.
 *
 * Attributes:
 *   before-label — label above the left panel (default "Before")
 *   after-label  — label above the right panel (default "After")
 *   arrow        — "→" (default) | "vs" | custom string | "" (hide)
 *
 * Slots:
 *   before — left panel body
 *   after  — right panel body
 */
export class CeCompare extends CecElement {
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: stretch;
      gap: 0;
      margin: var(--ce-space-3) 0;
    }
    @media (max-width: 640px) {
      :host { grid-template-columns: 1fr; }
      .ce-compare__arrow { display: none; }
    }
    .ce-compare__side {
      padding: var(--ce-space-4) var(--ce-space-5);
      border: 1px solid var(--ce-border);
    }
    .ce-compare__side--before {
      background: var(--ce-color-red-bg);
      border-color: var(--ce-color-red-border);
      border-radius: var(--ce-radius) 0 0 var(--ce-radius);
    }
    .ce-compare__side--after {
      background: var(--ce-color-green-bg);
      border-color: var(--ce-color-green-border);
      border-left: none;
      border-radius: 0 var(--ce-radius) var(--ce-radius) 0;
    }
    .ce-compare__arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 60px;
      background: var(--ce-surface-2);
      border-top: 1px solid var(--ce-border);
      border-bottom: 1px solid var(--ce-border);
      color: var(--ce-muted);
      font-size: var(--ce-text-xl);
    }
    .ce-compare__label {
      font-size: var(--ce-text-xs);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: var(--ce-space-2);
    }
    .ce-compare__side--before .ce-compare__label { color: var(--ce-color-red);   }
    .ce-compare__side--after  .ce-compare__label { color: var(--ce-color-green); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, attribute: "before-label" }) beforeLabel = "Before";
  @property({ type: String, attribute: "after-label" }) afterLabel = "After";
  @property({ type: String }) arrow = "→";

  override render() {
    return html`
      <div class="ce-compare__side ce-compare__side--before">
        <div class="ce-compare__label">${this.beforeLabel}</div>
        <slot name="before"></slot>
      </div>
      ${this.arrow
        ? html`<div class="ce-compare__arrow" aria-hidden="true">${this.arrow}</div>`
        : html`<div></div>`}
      <div class="ce-compare__side ce-compare__side--after">
        <div class="ce-compare__label">${this.afterLabel}</div>
        <slot name="after"></slot>
      </div>
    `;
  }
}

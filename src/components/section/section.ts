import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-section>` — section block with title row: optional number badge,
 * heading, count chip, and body slot.
 *
 * Attributes:
 *   title        — heading text
 *   lede         — subtitle/description
 *   number       — optional leading number badge (e.g., "1" for section 1)
 *   count-label  — right-aligned count chip (e.g., "28 files · 7 locations")
 *
 * Slots:
 *   title        — custom heading markup
 *   (default)    — section body
 */
export class CeSection extends CecElement {
  static override styles = css`
    :host {
      display: block;
      margin: var(--ce-space-7) 0 0;
    }
    .ce-section__header {
      display: flex;
      align-items: center;
      gap: var(--ce-space-3);
      margin-bottom: var(--ce-space-2);
    }
    .ce-section__title {
      font-size: var(--ce-text-xl);
      font-weight: 700;
      letter-spacing: -0.01em;
      margin: 0;
      color: var(--ce-text);
    }
    .ce-section__title ::slotted(*) {
      margin: 0;
      font: inherit;
      color: inherit;
    }
    .ce-section__num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ce-sz-md);
      height: var(--ce-sz-md);
      font-size: var(--ce-text-sm);
      font-weight: 700;
      border-radius: 50%;
      background: var(--ce-color-blue-bg);
      color: var(--ce-color-blue);
      border: 1px solid var(--ce-color-blue-border);
    }
    .ce-section__count {
      margin-left: auto;
      font-size: var(--ce-text-xs);
      padding: var(--ce-inset-xs) var(--ce-inset-lg);
      border-radius: var(--ce-radius-pill);
      background: var(--ce-surface);
      color: var(--ce-muted);
      border: 1px solid var(--ce-border);
      font-weight: 600;
    }
    .ce-section__lede {
      color: var(--ce-muted);
      margin: 0 0 var(--ce-space-4) 0;
      max-width: 920px;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  // `title` is inherited from HTMLElement (string, default "").
  @property({ type: String }) override title = "";
  @property({ type: String }) lede = "";
  @property({ type: String }) number = "";
  @property({ type: String, attribute: "count-label" }) countLabel = "";

  override render() {
    return html`
      <div class="ce-section__header">
        ${this.number
          ? html`<span class="ce-section__num" aria-hidden="true">${this.number}</span>`
          : nothing}
        <h2 class="ce-section__title">
          <slot name="title">${this.title}</slot>
        </h2>
        ${this.countLabel
          ? html`<span class="ce-section__count">${this.countLabel}</span>`
          : nothing}
      </div>
      ${this.lede ? html`<p class="ce-section__lede">${this.lede}</p>` : nothing}
      <slot></slot>
    `;
  }
}

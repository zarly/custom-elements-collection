import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-compare>` — two-column side-by-side comparison.
 *
 * Attributes:
 *   left-label  — label above the left column
 *   right-label — label above the right column
 *   mode        — neutral | correct-wrong | before-after (default: neutral)
 *
 * Slots:
 *   left  — left column content
 *   right — right column content
 */
export class LessonCompare extends CecElement {
  static override styles = css`
    :host {
      display: block;
      margin: var(--ce-space-3) 0;
    }
    .lc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      overflow: hidden;
    }
    .lc-col {
      padding: var(--ce-space-4) var(--ce-space-5);
    }
    .lc-col + .lc-col {
      border-left: 1px solid var(--ce-border);
    }
    .lc-label {
      font-weight: 700;
      font-size: var(--ce-text-sm);
      margin-bottom: var(--ce-space-2);
      padding-bottom: var(--ce-space-2);
      border-bottom: 1px solid var(--ce-border);
      color: var(--ce-text);
    }
    :host([mode="correct-wrong"]) .lc-col:first-child .lc-label {
      color: var(--ce-color-red);
    }
    :host([mode="correct-wrong"]) .lc-col:last-child .lc-label {
      color: var(--ce-color-green);
    }
    :host([mode="before-after"]) .lc-col:first-child .lc-label {
      color: var(--ce-muted);
    }
    :host([mode="before-after"]) .lc-col:last-child .lc-label {
      color: var(--ce-color-blue);
    }
    .lc-body {
      font-size: var(--ce-text-base);
      color: var(--ce-text);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, attribute: "left-label" }) leftLabel = "";
  @property({ type: String, attribute: "right-label" }) rightLabel = "";
  @property({ type: String, reflect: true }) mode = "neutral";

  override render() {
    return html`
      <div class="lc-grid">
        <div class="lc-col">
          ${this.leftLabel ? html`<div class="lc-label">${this.leftLabel}</div>` : ""}
          <div class="lc-body"><slot name="left"></slot></div>
        </div>
        <div class="lc-col">
          ${this.rightLabel ? html`<div class="lc-label">${this.rightLabel}</div>` : ""}
          <div class="lc-body"><slot name="right"></slot></div>
        </div>
      </div>
    `;
  }
}

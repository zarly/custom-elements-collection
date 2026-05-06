import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-rule>` — numbered rule card. Use for "Rule 1", "Golden Rule", etc.
 *
 * Attributes:
 *   number — the rule number (any string; "1" or "★")
 *   title  — rule title
 *   golden — boolean; emphasized golden-rule styling (amber)
 */
export class LessonRule extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    :host([golden]) {
      border-color: var(--ce-color-amber);
      background: var(--ce-color-amber-bg);
    }
    .lr-head {
      display: flex;
      align-items: center;
      gap: var(--ce-space-3);
      margin-bottom: var(--ce-space-2);
    }
    .lr-num {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--ce-color-blue);
      color: var(--ce-text-inverse);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--ce-text-sm);
      flex: 0 0 auto;
    }
    :host([golden]) .lr-num { background: var(--ce-color-amber); }
    .lr-title {
      font-weight: 700;
      font-size: var(--ce-text-md);
      color: var(--ce-text);
    }
    :host([golden]) .lr-title { color: var(--ce-color-amber); }
    .lr-body { color: var(--ce-text); font-size: var(--ce-text-base); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) number = "";
  @property({ type: String }) override title = "";
  @property({ type: Boolean, reflect: true }) golden = false;

  override render() {
    return html`
      <div class="lr-head">
        ${this.number ? html`<span class="lr-num" aria-hidden="true">${this.number}</span>` : nothing}
        <div class="lr-title">${this.title}</div>
      </div>
      <div class="lr-body"><slot></slot></div>
    `;
  }
}

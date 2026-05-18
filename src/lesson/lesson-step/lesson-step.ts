import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-step>` — one numbered step in a procedural sequence.
 *
 * Attributes:
 *   number — step number/label (default: "1")
 *   title  — step title
 *   status — pending | active | done (default: pending)
 */
export class LessonStep extends CecElement {
  static override styles = css`
    :host {
      display: block;
      margin: var(--ce-space-2) 0;
    }
    .ls-row {
      display: flex;
      gap: var(--ce-space-4);
      align-items: flex-start;
    }
    .ls-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--ce-text-sm);
      background: var(--ce-muted);
      color: var(--ce-text-inverse);
      flex: 0 0 auto;
      margin-top: 2px;
    }
    :host([status="active"]) .ls-badge {
      background: var(--ce-color-blue);
    }
    :host([status="done"]) .ls-badge {
      background: var(--ce-color-green);
    }
    .ls-content {
      flex: 1;
    }
    .ls-title {
      font-weight: 700;
      font-size: var(--ce-text-md);
      color: var(--ce-text);
      margin-bottom: var(--ce-space-1);
    }
    :host([status="done"]) .ls-title {
      color: var(--ce-muted);
      text-decoration: line-through;
    }
    .ls-body {
      font-size: var(--ce-text-base);
      color: var(--ce-text);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) number = "1";
  @property({ type: String }) override title = "";
  @property({ type: String, reflect: true }) status = "pending";

  override render() {
    const badgeContent = this.status === "done" ? "✓" : this.number;
    return html`
      <div class="ls-row">
        <span class="ls-badge" aria-hidden="true">${badgeContent}</span>
        <div class="ls-content">
          ${this.title ? html`<div class="ls-title">${this.title}</div>` : ""}
          <div class="ls-body"><slot></slot></div>
        </div>
      </div>
    `;
  }
}

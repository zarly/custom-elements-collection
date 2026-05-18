import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

/**
 * `<lesson-summary>` — end-of-section key-points card.
 *
 * Attributes:
 *   title — card heading (default: "Key Takeaways")
 *   items — JSON string[] of bullet points; when present, renders a checklist
 *
 * Slots:
 *   default — rendered when items is empty
 */
export class LessonSummary extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-color-amber);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    .lsu-title {
      font-weight: 800;
      font-size: var(--ce-text-md);
      color: var(--ce-color-amber);
      margin-bottom: var(--ce-space-3);
    }
    .lsu-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
    }
    .lsu-item {
      display: flex;
      gap: var(--ce-space-3);
      align-items: flex-start;
      color: var(--ce-text);
      font-size: var(--ce-text-base);
    }
    .lsu-check {
      color: var(--ce-color-green);
      font-weight: 700;
      flex: 0 0 auto;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) override title = "Key Takeaways";
  @property(jsonProp<string[]>([], "items")) items: string[] = [];

  override render() {
    return html`
      <div class="lsu-title">✦ ${this.title}</div>
      ${this.items.length > 0
        ? html`
          <ul class="lsu-list">
            ${this.items.map(
              (item) => html`
                <li class="lsu-item">
                  <span class="lsu-check" aria-hidden="true">✓</span>
                  <span>${item}</span>
                </li>
              `
            )}
          </ul>
        `
        : html`<slot></slot>`}
    `;
  }
}

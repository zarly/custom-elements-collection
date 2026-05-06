import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type ExampleType = "good" | "bad" | "neutral";

/**
 * `<ce-example>` — good/bad example box. Two variants color-coded.
 *
 * Attributes:
 *   type   — "good" (green) | "bad" (red) | "neutral"
 *   label  — optional label override (defaults: "Good" / "Wrong" / "Example")
 */
export class CeExample extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border-left: 3px solid var(--ce-border-strong);
      padding: var(--ce-space-3) var(--ce-space-4);
      border-radius: var(--ce-radius-sm);
      margin: var(--ce-space-2) 0;
    }
    :host([type="good"]) { border-left-color: var(--ce-color-green); background: var(--ce-color-green-bg); }
    :host([type="bad"])  { border-left-color: var(--ce-color-red);   background: var(--ce-color-red-bg);   }

    .ce-example__label {
      display: inline-block;
      font-size: var(--ce-text-xs);
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: var(--ce-space-1);
      color: var(--ce-muted);
    }
    :host([type="good"]) .ce-example__label { color: var(--ce-color-green); }
    :host([type="bad"])  .ce-example__label { color: var(--ce-color-red);   }

    .ce-example__body { color: var(--ce-text); font-size: var(--ce-text-sm); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) type: ExampleType = "neutral";
  @property({ type: String }) label = "";

  get #displayLabel(): string {
    if (this.label) return this.label;
    if (this.type === "good") return "Good";
    if (this.type === "bad") return "Wrong";
    return "Example";
  }

  override render() {
    return html`
      <div class="ce-example__label">${this.#displayLabel}</div>
      <div class="ce-example__body">${nothing}<slot></slot></div>
    `;
  }
}

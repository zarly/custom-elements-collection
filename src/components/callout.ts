import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../core/index.js";

export type CalloutType = "info" | "success" | "warn" | "danger" | "neutral";

/**
 * `<ce-callout>` — left-border-accented tinted box. Replaces
 * callout/admonition/alert/note/risk terminology from the corpus.
 *
 * Attributes:
 *   type   — "info" | "success" | "warn" | "danger" | "neutral"
 *   title  — optional bold header line
 *
 * Slots:
 *   title  — override the title attribute
 *   (default) — body content
 */
export class CeCallout extends CecElement {
  static override styles = css`
    :host {
      display: block;
      margin: var(--ce-space-3) 0;
      padding: var(--ce-space-3) var(--ce-space-4);
      border-radius: var(--ce-radius);
      border-left: 3px solid var(--ce-color-blue);
      background: var(--ce-color-blue-bg);
      color: var(--ce-text);
    }
    :host([type="success"]) {
      border-left-color: var(--ce-color-green);
      background: var(--ce-color-green-bg);
    }
    :host([type="warn"]) {
      border-left-color: var(--ce-color-amber);
      background: var(--ce-color-amber-bg);
    }
    :host([type="danger"]) {
      border-left-color: var(--ce-color-red);
      background: var(--ce-color-red-bg);
    }
    :host([type="neutral"]) {
      border-left-color: var(--ce-border-strong);
      background: var(--ce-surface);
    }
    .ce-callout__title {
      font-weight: 700;
      margin-bottom: var(--ce-space-1);
      font-size: var(--ce-text-sm);
    }
    :host([type="info"])    .ce-callout__title { color: var(--ce-color-blue);   }
    :host([type="success"]) .ce-callout__title { color: var(--ce-color-green);  }
    :host([type="warn"])    .ce-callout__title { color: var(--ce-color-amber);  }
    :host([type="danger"])  .ce-callout__title { color: var(--ce-color-red);    }
    :host([type="neutral"]) .ce-callout__title { color: var(--ce-text);         }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  type: CalloutType = "info";

  // `title` is inherited from HTMLElement (string, default "").
  @property({ type: String })
  override title = "";

  override render() {
    const slotHasTitle = this.querySelector('[slot="title"]') !== null;
    return html`
      ${this.title || slotHasTitle
        ? html`<div class="ce-callout__title"><slot name="title">${this.title}</slot></div>`
        : nothing}
      <slot></slot>
    `;
  }
}

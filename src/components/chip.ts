import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../core/index.js";

/**
 * `<ce-chip>` — canonical compact status indicator. Replaces the
 * badge/pill/tag/label terminology that drifted across the corpus.
 *
 * Attributes:
 *   type    — "neutral" | "green" | "red" | "amber" | "blue" | "purple" | "cyan"
 *   dot     — boolean; prepend a colored dot
 *   outlined— boolean; no fill, just a border + colored text
 *
 * Slot: default (the chip label)
 */
export class CeChip extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      font-size: var(--ce-text-xs);
      font-weight: 600;
      padding: 2px 9px;
      border-radius: var(--ce-radius-pill);
      border: 1px solid transparent;
      line-height: var(--ce-line-snug);
      white-space: nowrap;
      vertical-align: middle;
    }

    /* Default (neutral) — filled, subtle */
    :host,
    :host([type="neutral"]) {
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      border-color: var(--ce-border-soft);
    }

    :host([type="green"])  { background: var(--ce-color-green-bg);  color: var(--ce-color-green);  border-color: var(--ce-color-green-border);  }
    :host([type="red"])    { background: var(--ce-color-red-bg);    color: var(--ce-color-red);    border-color: var(--ce-color-red-border);    }
    :host([type="amber"])  { background: var(--ce-color-amber-bg);  color: var(--ce-color-amber);  border-color: var(--ce-color-amber-border);  }
    :host([type="blue"])   { background: var(--ce-color-blue-bg);   color: var(--ce-color-blue);   border-color: var(--ce-color-blue-border);   }
    :host([type="purple"]) { background: var(--ce-color-purple-bg); color: var(--ce-color-purple); border-color: var(--ce-color-purple-border); }
    :host([type="cyan"])   { background: var(--ce-color-cyan-bg);   color: var(--ce-color-cyan);   border-color: var(--ce-color-cyan-border);   }

    :host([outlined]) { background: transparent; }

    .ce-chip__dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  type: CecColor = "neutral";

  @property({ type: Boolean, reflect: true })
  dot = false;

  @property({ type: Boolean, reflect: true })
  outlined = false;

  override render() {
    return html`
      ${this.dot ? html`<span class="ce-chip__dot" aria-hidden="true"></span>` : ""}
      <slot></slot>
    `;
  }
}

import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../../core/index.js";

/**
 * `<ce-badge>` — small count or label badge that decorates an icon/label.
 *
 * Attributes:
 *   count   — numeric count to display (clamped at `max`)
 *   max     — clamp value; counts above show as "{max}+"
 *   variant — "neutral" | "green" | "red" | "amber" | "blue" | "purple" | "cyan"
 *   dot     — boolean; show a tiny dot instead of count text
 *
 * Slot: default content the badge decorates.
 */
export class CeBadge extends CecElement {
  static override styles = css`
    :host {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      vertical-align: middle;
    }
    .ce-badge__pip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: var(--ce-text-xs);
      font-weight: 700;
      line-height: 1;
      border-radius: var(--ce-radius-pill);
      background: var(--ce-color-red);
      /* stylelint-disable-next-line color-no-hex -- on-accent text; --ce-text-inverse flips per theme and would lose contrast on saturated badges */
      color: #fff;
      box-shadow: 0 0 0 2px var(--ce-bg);
    }
    :host([variant="neutral"]) .ce-badge__pip { background: var(--ce-muted); }
    :host([variant="green"])   .ce-badge__pip { background: var(--ce-color-green); }
    /* stylelint-disable-next-line color-no-hex -- dark text on bright amber accent; no on-bright token exists */
    :host([variant="amber"])   .ce-badge__pip { background: var(--ce-color-amber); color: #111; }
    :host([variant="blue"])    .ce-badge__pip { background: var(--ce-color-blue); }
    :host([variant="purple"])  .ce-badge__pip { background: var(--ce-color-purple); }
    /* stylelint-disable-next-line color-no-hex -- dark text on bright cyan accent; no on-bright token exists */
    :host([variant="cyan"])    .ce-badge__pip { background: var(--ce-color-cyan); color: #111; }

    :host([dot]) .ce-badge__pip {
      min-width: 8px;
      width: 8px;
      height: 8px;
      padding: 0;
    }

    :host(:not([count])):not([dot]) .ce-badge__pip {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number, reflect: true })
  count: number | null = null;

  @property({ type: Number })
  max = 99;

  @property({ type: String, reflect: true })
  variant: CecColor = "red";

  @property({ type: Boolean, reflect: true })
  dot = false;

  #display(): string {
    if (this.count == null) return "";
    if (this.count > this.max) return `${this.max}+`;
    return String(this.count);
  }

  override render() {
    return html`
      <slot></slot>
      <span class="ce-badge__pip" aria-hidden=${this.dot ? "true" : "false"}>
        ${this.dot ? nothing : this.#display()}
      </span>
    `;
  }
}

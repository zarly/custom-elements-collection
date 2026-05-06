import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-status-light>` — traffic-light status dot with optional pulse and label.
 *
 * Attributes:
 *   state  — "ok" | "warn" | "bad" | "neutral" | "pending"
 *   pulse  — boolean; animate a pulsing ring
 *   label  — string label shown next to the dot (overridable via slot)
 *   size   — "sm" | "md" | "lg"
 */
export type CeStatusLightState = "ok" | "warn" | "bad" | "neutral" | "pending";

export class CeStatusLight extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      vertical-align: middle;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--ce-muted);
      box-shadow: 0 0 0 2px transparent;
      flex: 0 0 auto;
      position: relative;
    }
    :host([size="sm"]) .dot { width: 8px; height: 8px; }
    :host([size="lg"]) .dot { width: 14px; height: 14px; }

    :host([state="ok"])      .dot { background: var(--ce-color-green); }
    :host([state="warn"])    .dot { background: var(--ce-color-amber); }
    :host([state="bad"])     .dot { background: var(--ce-color-red); }
    :host([state="neutral"]) .dot { background: var(--ce-muted); }
    :host([state="pending"]) .dot { background: var(--ce-color-blue); }

    :host([pulse]) .dot::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: inherit;
      animation: ce-status-pulse 1.6s infinite ease-out;
      opacity: 0.6;
    }
    @keyframes ce-status-pulse {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(2.4); opacity: 0;   }
    }

    .label {
      color: var(--ce-text);
    }
    .label.muted {
      color: var(--ce-muted);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  state: CeStatusLightState = "neutral";

  @property({ type: Boolean, reflect: true })
  pulse = false;

  @property({ type: String })
  label = "";

  @property({ type: String, reflect: true })
  size: "sm" | "md" | "lg" = "md";

  override render() {
    return html`
      <span class="dot" aria-hidden="true"></span>
      <span class="label ${this.state === "neutral" ? "muted" : ""}" role="status">
        <slot>${this.label}</slot>
      </span>
    `;
  }
}

import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../../core/index.js";

/**
 * `<ce-kpi>` — big number + label card. Commonly used inside
 * `<ce-hero slot="stats">` or `<ce-grid>`.
 *
 * Attributes:
 *   value   — the number or short string to display large
 *   label   — uppercase small label under the value
 *   color   — tint for the value ("green" | "red" | ...); default "neutral"
 *   trend   — optional "+12%" style trend indicator (can start with + or -)
 */
export class CeKpi extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3) var(--ce-space-4);
    }
    .ce-kpi__value {
      font-size: var(--ce-text-2xl);
      font-weight: 800;
      line-height: var(--ce-line-tight);
      letter-spacing: -0.01em;
      color: var(--ce-text);
    }
    :host([color="green"])  .ce-kpi__value { color: var(--ce-color-green);  }
    :host([color="red"])    .ce-kpi__value { color: var(--ce-color-red);    }
    :host([color="amber"])  .ce-kpi__value { color: var(--ce-color-amber);  }
    :host([color="blue"])   .ce-kpi__value { color: var(--ce-color-blue);   }
    :host([color="purple"]) .ce-kpi__value { color: var(--ce-color-purple); }
    :host([color="cyan"])   .ce-kpi__value { color: var(--ce-color-cyan);   }

    .ce-kpi__label {
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      margin-top: var(--ce-space-1);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }
    .ce-kpi__trend {
      margin-left: var(--ce-space-2);
      font-size: var(--ce-text-sm);
      font-weight: 600;
      vertical-align: middle;
    }
    .ce-kpi__trend.up { color: var(--ce-color-green); }
    .ce-kpi__trend.down { color: var(--ce-color-red); }
    .ce-kpi__trend.flat { color: var(--ce-muted); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) value = "";
  @property({ type: String }) label = "";
  @property({ type: String, reflect: true }) color: CecColor = "neutral";
  @property({ type: String }) trend = "";

  override render() {
    const trendDir = this.trend.startsWith("+")
      ? "up"
      : this.trend.startsWith("-")
      ? "down"
      : "flat";
    return html`
      <div class="ce-kpi__value">
        ${this.value}
        ${this.trend
          ? html`<span class="ce-kpi__trend ${trendDir}">${this.trend}</span>`
          : nothing}
      </div>
      ${this.label ? html`<div class="ce-kpi__label">${this.label}</div>` : nothing}
    `;
  }
}

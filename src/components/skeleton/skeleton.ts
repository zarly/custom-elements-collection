import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-skeleton>` — animated loading placeholder. Keeps layout reserved
 * while content is in flight.
 *
 * Attributes:
 *   shape  — "text" | "rect" | "circle"
 *   width  — CSS length (e.g. "120px", "60%")
 *   height — CSS length
 *   lines  — when shape="text", number of lines (default 1)
 */
export class CeSkeleton extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }
    .bar {
      background: linear-gradient(
        90deg,
        var(--ce-surface-2) 0%,
        var(--ce-surface-3) 50%,
        var(--ce-surface-2) 100%
      );
      background-size: 200% 100%;
      animation: ce-skel-shimmer 1.4s infinite ease-in-out;
      border-radius: var(--ce-radius-sm);
    }
    @keyframes ce-skel-shimmer {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    .stack { display: flex; flex-direction: column; gap: var(--ce-space-2); }
    .text-line {
      height: 0.85em;
      width: 100%;
    }
    .text-line.last {
      width: 60%;
    }
    :host([shape="circle"]) .bar { border-radius: 50%; }
    :host([shape="rect"]) .bar  { border-radius: var(--ce-radius); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  shape: "text" | "rect" | "circle" = "text";

  @property({ type: String })
  width = "";

  @property({ type: String })
  height = "";

  @property({ type: Number })
  lines = 1;

  override render() {
    const w = this.width || (this.shape === "circle" ? "32px" : "100%");
    const h =
      this.height ||
      (this.shape === "circle" ? "32px" : this.shape === "rect" ? "80px" : "");

    if (this.shape === "text") {
      const count = Math.max(1, this.lines | 0);
      const items = Array.from({ length: count }, (_, i) => i);
      return html`
        <div class="stack" role="presentation" aria-hidden="true">
          ${items.map(
            (i) =>
              html`<div
                class="bar text-line ${i === count - 1 && count > 1 ? "last" : ""}"
                style="${i === count - 1 && count > 1 ? "" : `width: ${w};`}"
              ></div>`
          )}
        </div>
      `;
    }

    return html`<div
      class="bar"
      role="presentation"
      aria-hidden="true"
      style="width: ${w}; height: ${h};"
    ></div>`;
  }
}

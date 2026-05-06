import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeCursorShape = "bar" | "block" | "underline";

/**
 * `<ce-cursor>` — a blinking caret indicator for streaming LLM responses.
 *
 * Attributes:
 *   shape     — "bar" | "block" | "underline" (default "bar")
 *   blink-ms  — number; total animation duration in ms (default 1000)
 *
 * No slots, no events. Pure CSS-driven animation.
 *
 * Local CSS variables:
 *   --ce-cursor-color — overrides the caret color (defaults to var(--ce-text)).
 */
export class CeCursor extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: baseline;
      line-height: 1;
      color: var(--ce-cursor-color, var(--ce-text));
    }
    .ce-cursor__caret {
      display: inline-block;
      background: currentColor;
      animation: ce-cursor-blink var(--ce-cursor-blink-ms, 1000ms) steps(2, end) infinite;
      vertical-align: baseline;
    }
    :host([shape="bar"]) .ce-cursor__caret,
    :host(:not([shape])) .ce-cursor__caret {
      width: 2px;
      height: 1.2em;
    }
    :host([shape="block"]) .ce-cursor__caret {
      width: 0.6em;
      height: 1em;
    }
    :host([shape="underline"]) .ce-cursor__caret {
      width: 0.6em;
      height: 2px;
      vertical-align: bottom;
    }
    @keyframes ce-cursor-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ce-cursor__caret { animation: none; opacity: 1; }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  shape: CeCursorShape = "bar";

  @property({ type: Number, attribute: "blink-ms" })
  blinkMs = 1000;

  override render() {
    const styleAttr = `--ce-cursor-blink-ms: ${this.blinkMs}ms`;
    return html`<span
      class="ce-cursor__caret"
      style=${styleAttr}
      aria-hidden="true"
    ></span>`;
  }
}

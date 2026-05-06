import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeThinkingVariant = "dots" | "wave" | "spinner";

/**
 * `<ce-thinking>` — typing/reasoning indicator for chat UIs.
 *
 * Attributes:
 *   label    — string; spoken + visible label (default "Thinking…")
 *   variant  — "dots" | "wave" | "spinner" (default "dots")
 *
 * Slots:
 *   (default) — overrides the rendered label text.
 *
 * Sets role="status" + aria-live="polite" so screen readers announce
 * appearance / disappearance.
 */
export class CeThinking extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }
    .ce-thinking__label {
      color: var(--ce-muted);
    }
    .ce-thinking__indicator {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      color: var(--ce-color-blue);
    }
    /* dots variant */
    .ce-thinking__dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: currentColor;
      animation: ce-thinking-bounce 1.2s ease-in-out infinite both;
    }
    .ce-thinking__dot:nth-child(1) { animation-delay: -0.32s; }
    .ce-thinking__dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes ce-thinking-bounce {
      0%, 80%, 100% { transform: scale(0.4); opacity: 0.5; }
      40%           { transform: scale(1);   opacity: 1;   }
    }
    /* wave variant */
    .ce-thinking__bar {
      width: 3px;
      height: 12px;
      background: currentColor;
      border-radius: 2px;
      animation: ce-thinking-wave 1s ease-in-out infinite;
    }
    .ce-thinking__bar:nth-child(1) { animation-delay: -0.4s; }
    .ce-thinking__bar:nth-child(2) { animation-delay: -0.2s; }
    @keyframes ce-thinking-wave {
      0%, 100% { transform: translateY(0)    scaleY(0.5); }
      50%      { transform: translateY(-2px) scaleY(1);   }
    }
    /* spinner variant */
    .ce-thinking__spinner {
      width: 14px;
      height: 14px;
      animation: ce-thinking-spin 1s linear infinite;
    }
    .ce-thinking__spinner circle {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-dasharray: 30 100;
    }
    @keyframes ce-thinking-spin {
      to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ce-thinking__dot,
      .ce-thinking__bar,
      .ce-thinking__spinner { animation: none; }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String })
  label = "Thinking…";

  @property({ type: String, reflect: true })
  variant: CeThinkingVariant = "dots";

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "status");
    if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
  }

  override render() {
    return html`
      <span class="ce-thinking__indicator" aria-hidden="true">${this.#renderIndicator()}</span>
      <span class="ce-thinking__label"><slot>${this.label}</slot></span>
    `;
  }

  #renderIndicator() {
    if (this.variant === "wave") {
      return html`
        <span class="ce-thinking__bar"></span>
        <span class="ce-thinking__bar"></span>
        <span class="ce-thinking__bar"></span>
      `;
    }
    if (this.variant === "spinner") {
      return html`
        <svg class="ce-thinking__spinner" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" />
        </svg>
      `;
    }
    return html`
      <span class="ce-thinking__dot"></span>
      <span class="ce-thinking__dot"></span>
      <span class="ce-thinking__dot"></span>
    `;
  }
}

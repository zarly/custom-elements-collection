import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

let _seq = 0;
const nextId = (): string => `ce-reasoning-${++_seq}`;

/**
 * `<ce-reasoning>` — collapsible chain-of-thought reasoning trace.
 *
 * Attributes:
 *   open        — boolean; disclosure state (reflected)
 *   label       — string; header label (default "Reasoning")
 *   tokens      — number; optional token count shown in header
 *   duration-ms — number; optional wall-clock duration in ms
 *   streaming   — boolean; pulses a dot when reasoning is still arriving (reflected)
 *
 * Slots:
 *   (default) — reasoning content; presented muted and italicised
 *
 * Event:
 *   ce-reasoning-toggle { open: boolean } — bubbles, composed
 */
export class CeReasoning extends CecElement {
  static override styles = css`
    :host {
      display: block;
      border: 1px solid var(--ce-border-soft);
      border-radius: var(--ce-radius);
      background: var(--ce-surface-2);
      overflow: hidden;
      margin: var(--ce-space-2) 0;
    }

    .ce-reasoning__head {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-space-2) var(--ce-space-3);
      cursor: pointer;
      user-select: none;
      background: transparent;
      border: 0;
      color: var(--ce-muted);
      width: 100%;
      text-align: left;
      font: inherit;
      font-size: var(--ce-text-sm);
    }
    .ce-reasoning__head:hover {
      background: var(--ce-state-hover);
    }
    .ce-reasoning__head:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }

    .ce-reasoning__chevron {
      width: 10px;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      transition: transform var(--ce-transition-fast);
      display: inline-block;
      flex: 0 0 auto;
    }
    :host([open]) .ce-reasoning__chevron {
      transform: rotate(90deg);
    }

    .ce-reasoning__label {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      flex: 1 1 auto;
    }

    .ce-reasoning__pulse {
      width: 6px;
      height: 6px;
      border-radius: var(--ce-radius-pill);
      background: var(--ce-color-purple);
      flex: 0 0 auto;
      animation: ce-reasoning-pulse 1.4s ease-in-out infinite;
    }
    @keyframes ce-reasoning-pulse {
      0%, 100% { opacity: 0.4; transform: scale(0.85); }
      50%       { opacity: 1;   transform: scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ce-reasoning__pulse {
        animation: none;
      }
    }

    .ce-reasoning__meta {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      flex: 0 0 auto;
    }
    .ce-reasoning__tokens,
    .ce-reasoning__duration {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
    }

    .ce-reasoning__panel {
      max-height: 0;
      overflow: hidden;
      transition: max-height var(--ce-transition);
    }
    :host([open]) .ce-reasoning__panel {
      /* Generous upper bound so content can grow; transition still animates. */
      max-height: 2000px;
    }
    .ce-reasoning__panel-inner {
      padding: var(--ce-space-3);
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      font-style: italic;
      line-height: var(--ce-line-relaxed);
      border-top: 1px solid var(--ce-border-soft);
    }
    /* Reset first/last child margins in slotted content */
    .ce-reasoning__panel-inner ::slotted(:first-child) {
      margin-top: 0;
    }
    .ce-reasoning__panel-inner ::slotted(:last-child) {
      margin-bottom: 0;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) label = "Reasoning";
  @property({ type: Number }) tokens: number | null = null;
  @property({ type: Number, attribute: "duration-ms" }) durationMs = NaN;
  @property({ type: Boolean, reflect: true }) streaming = false;

  #panelId = nextId();

  override render() {
    const dur = this.#formatDuration(this.durationMs);
    return html`
      <button
        class="ce-reasoning__head"
        type="button"
        aria-expanded=${this.open ? "true" : "false"}
        aria-controls=${this.#panelId}
        @click=${this.#onToggle}
      >
        <span class="ce-reasoning__chevron">▸</span>
        <span class="ce-reasoning__label">${this.label}</span>
        ${this.streaming
          ? html`<span class="ce-reasoning__pulse" aria-hidden="true"></span>`
          : nothing}
        <span class="ce-reasoning__meta">
          ${this.tokens !== null
            ? html`<span class="ce-reasoning__tokens">${this.tokens} tok</span>`
            : nothing}
          ${dur
            ? html`<span class="ce-reasoning__duration">${dur}</span>`
            : nothing}
        </span>
      </button>
      <div class="ce-reasoning__panel" id=${this.#panelId} ?hidden=${!this.open}>
        <div class="ce-reasoning__panel-inner">
          <slot></slot>
        </div>
      </div>
    `;
  }

  #onToggle = (): void => {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent("ce-reasoning-toggle", {
        bubbles: true,
        composed: true,
        detail: { open: this.open },
      })
    );
  };

  #formatDuration(ms: number): string {
    if (!Number.isFinite(ms) || ms < 0) return "";
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`;
  }
}

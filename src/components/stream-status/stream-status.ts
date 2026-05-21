import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeStreamState = "idle" | "connecting" | "streaming" | "done" | "error";

const STATE_LABELS: Record<CeStreamState, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  streaming: "Streaming",
  done: "Done",
  error: "Error",
};

const fmt = new Intl.NumberFormat();

/**
 * `<ce-stream-status>` — streaming-connection state pill for chat surfaces.
 *
 * Displays the current LLM connection state (idle / connecting / streaming /
 * done / error) as a color-coded pill with an animated dot. Optionally shows
 * a token count and tokens-per-second readout.
 *
 * Attributes:
 *   state   — "idle" | "connecting" | "streaming" | "done" | "error"
 *   label   — override label text (empty → state default)
 *   tokens  — optional token count (number)
 *   tps     — optional tokens-per-second (number)
 *
 * Slot:
 *   (default) — fully replaces the auto-generated label + counter content.
 *
 * Sets role="status" + aria-live="polite" on connect.
 */
export class CeStreamStatus extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-inset-xs) var(--ce-space-2);
      border-radius: var(--ce-radius-pill);
      border: 1px solid var(--ce-border);
      background: var(--ce-surface-2);
      font-size: var(--ce-text-xs);
      color: var(--ce-text);
      font-family: var(--ce-font-sans);
      white-space: nowrap;
      vertical-align: middle;
    }

    /* ── state: connecting ── */
    :host([state="connecting"]) {
      background: var(--ce-color-blue-bg);
      border-color: var(--ce-color-blue-border);
    }
    /* ── state: streaming ── */
    :host([state="streaming"]) {
      background: var(--ce-color-purple-bg);
      border-color: var(--ce-color-purple-border);
    }
    /* ── state: done ── */
    :host([state="done"]) {
      background: var(--ce-color-green-bg);
      border-color: var(--ce-color-green-border);
    }
    /* ── state: error ── */
    :host([state="error"]) {
      background: var(--ce-color-red-bg);
      border-color: var(--ce-color-red-border);
    }

    /* ── dot ── */
    .ce-stream-status__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ce-muted);
      flex: 0 0 auto;
    }

    :host([state="connecting"]) .ce-stream-status__dot {
      background: var(--ce-color-blue);
      animation: ce-stream-pulse 1.4s ease-in-out infinite;
    }
    :host([state="streaming"]) .ce-stream-status__dot {
      background: var(--ce-color-purple);
      animation: ce-stream-pulse 1.4s ease-in-out infinite;
    }
    :host([state="done"]) .ce-stream-status__dot {
      background: var(--ce-color-green);
    }
    :host([state="error"]) .ce-stream-status__dot {
      background: var(--ce-color-red);
    }

    @keyframes ce-stream-pulse {
      0%, 100% { opacity: 1;   transform: scale(1);    }
      50%       { opacity: 0.4; transform: scale(0.75); }
    }

    @media (prefers-reduced-motion: reduce) {
      .ce-stream-status__dot {
        animation: none !important;
      }
    }

    /* ── label ── */
    .ce-stream-status__label {
      line-height: var(--ce-line-snug);
    }

    /* ── counters ── */
    .ce-stream-status__counters {
      font-variant-numeric: tabular-nums;
      color: var(--ce-muted);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  state: CeStreamState = "idle";

  @property({ type: String })
  label = "";

  @property({ type: Number })
  tokens: number | null = null;

  @property({ type: Number })
  tps: number | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "status");
    if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
  }

  override render() {
    const resolvedLabel = this.label || STATE_LABELS[this.state] || this.state;
    return html`
      <span class="ce-stream-status__dot" aria-hidden="true"></span>
      <slot>
        <span class="ce-stream-status__label">${resolvedLabel}</span>${this.#renderCounters()}
      </slot>
    `;
  }

  #renderCounters() {
    if (this.tokens === null && this.tps === null) return "";
    const parts: string[] = [];
    if (this.tokens !== null) {
      parts.push(`${fmt.format(this.tokens)} tokens`);
    }
    if (this.tps !== null) {
      parts.push(`${Math.round(this.tps)} tok/s`);
    }
    return html`<span class="ce-stream-status__counters"> · ${parts.join(" · ")}</span>`;
  }
}

import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeToolCallStatus = "running" | "ok" | "error";

let _seq = 0;
const nextId = (): string => `ce-toolcall-${++_seq}`;

/**
 * `<ce-tool-call>` — collapsible render of an LLM tool/function invocation.
 *
 * Attributes:
 *   name         — function/tool name (header label)
 *   status       — "running" | "ok" | "error" (default "running")
 *   duration-ms  — number; rendered as `123 ms` or `1.2 s`
 *   open         — boolean; disclosure state (reflected)
 *
 * Slots:
 *   args   — the input/arguments payload (always shown when present)
 *   result — the returned value (shown when status=ok)
 *   error  — error details (shown when status=error)
 *
 * Event:
 *   ce-toolcall-toggle { open: boolean }
 */
export class CeToolCall extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      overflow: hidden;
      margin: var(--ce-space-2) 0;
    }
    .ce-toolcall__head {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-space-2) var(--ce-space-3);
      cursor: pointer;
      user-select: none;
      background: transparent;
      border: 0;
      color: var(--ce-text);
      width: 100%;
      text-align: left;
      font: inherit;
    }
    .ce-toolcall__head:hover { background: var(--ce-state-hover); }
    .ce-toolcall__head:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    .ce-toolcall__chevron {
      width: 10px;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      transition: transform var(--ce-transition-fast);
      display: inline-block;
    }
    :host([open]) .ce-toolcall__chevron { transform: rotate(90deg); }

    .ce-toolcall__dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      flex: 0 0 auto;
    }
    .ce-toolcall__dot[data-status="running"] {
      background: var(--ce-color-blue);
      animation: ce-toolcall-pulse 1.4s ease-in-out infinite;
    }
    .ce-toolcall__dot[data-status="ok"]    { background: var(--ce-color-green); }
    .ce-toolcall__dot[data-status="error"] { background: var(--ce-color-red); }
    @keyframes ce-toolcall-pulse {
      0%, 100% { opacity: 0.4; transform: scale(0.85); }
      50%      { opacity: 1;   transform: scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ce-toolcall__dot { animation: none; }
    }

    .ce-toolcall__name {
      font-family: var(--ce-font-mono);
      font-weight: 600;
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1 1 auto;
    }
    .ce-toolcall__duration {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
      flex: 0 0 auto;
    }

    .ce-toolcall__panel {
      max-height: 0;
      overflow: hidden;
      transition: max-height var(--ce-transition);
      border-top: 1px solid var(--ce-border-soft);
    }
    :host([open]) .ce-toolcall__panel {
      /* Generous upper bound so content can grow; transition still animates. */
      max-height: 1000px;
    }
    .ce-toolcall__panel-inner {
      padding: var(--ce-space-3);
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
    }
    .ce-toolcall__section-label {
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ce-muted);
    }
    :host([status="error"]) {
      border-color: var(--ce-color-red-border);
    }
    :host([status="ok"]) {
      border-color: var(--ce-color-green-border);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) name = "";
  @property({ type: String, reflect: true }) status: CeToolCallStatus = "running";
  @property({ type: Number, attribute: "duration-ms" }) durationMs = NaN;
  @property({ type: Boolean, reflect: true }) open = false;

  #panelId = nextId();

  override render() {
    const dur = this.#formatDuration(this.durationMs);
    return html`
      <button
        class="ce-toolcall__head"
        type="button"
        aria-expanded=${this.open ? "true" : "false"}
        aria-controls=${this.#panelId}
        @click=${this.#onToggle}
      >
        <span class="ce-toolcall__chevron">▸</span>
        <span class="ce-toolcall__dot" data-status=${this.status}></span>
        <span class="ce-toolcall__name">${this.name}</span>
        ${dur ? html`<span class="ce-toolcall__duration">${dur}</span>` : nothing}
      </button>
      <div class="ce-toolcall__panel" id=${this.#panelId} ?hidden=${!this.open}>
        <div class="ce-toolcall__panel-inner">
          <div class="ce-toolcall__args">
            <div class="ce-toolcall__section-label">Args</div>
            <slot name="args"></slot>
          </div>
          ${this.status === "ok"
            ? html`<div class="ce-toolcall__result">
                <div class="ce-toolcall__section-label">Result</div>
                <slot name="result"></slot>
              </div>`
            : nothing}
          ${this.status === "error"
            ? html`<div class="ce-toolcall__error">
                <div class="ce-toolcall__section-label">Error</div>
                <slot name="error"></slot>
              </div>`
            : nothing}
        </div>
      </div>
    `;
  }

  #onToggle = (): void => {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent("ce-toolcall-toggle", {
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

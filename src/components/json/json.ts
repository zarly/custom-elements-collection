import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-json>` — pretty-printed JSON viewer.
 *
 * Attributes:
 *   src           — JSON string (inline). If empty, falls back to default slot.
 *   indent        — spaces per level (default 2)
 *   max-length    — truncate the string at this many chars before "…" (0 = unlimited)
 *   collapsed     — boolean; render the whole thing collapsed on first paint
 *
 * Events: ce-json-parse-error — { error, raw }
 */
export class CeJson extends CecElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-xs);
      background: var(--ce-code-bg);
      color: var(--ce-code-text);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3);
      max-height: 480px;
      overflow: auto;
    }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
    .err {
      color: var(--ce-color-red);
      font-family: var(--ce-font-sans);
      font-size: var(--ce-text-sm);
    }
    .toggle {
      cursor: pointer;
      user-select: none;
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      font-family: var(--ce-font-sans);
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      margin-bottom: var(--ce-space-2);
    }
    .toggle button {
      background: transparent;
      border: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
      padding: 0;
    }
    .toggle button:hover { color: var(--ce-text); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) src = "";
  @property({ type: Number }) indent = 2;
  @property({ type: Number, attribute: "max-length" }) maxLength = 0;
  @property({ type: Boolean, reflect: true }) collapsed = false;

  @state() private _formatted = "";
  @state() private _error = "";
  @state() private _isCollapsed = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this._isCollapsed = this.collapsed;
  }

  override willUpdate(): void {
    this.#parse();
  }

  #parse(): void {
    const raw = this.src || this.textContent?.trim() || "";
    if (!raw) {
      this._formatted = "";
      this._error = "";
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      let out = JSON.stringify(parsed, null, this.indent);
      if (this.maxLength > 0 && out.length > this.maxLength) {
        out = out.slice(0, this.maxLength) + "\n…";
      }
      this._formatted = out;
      this._error = "";
    } catch (err) {
      this._error = (err as Error).message;
      this._formatted = "";
      this.dispatchEvent(
        new CustomEvent("ce-json-parse-error", {
          bubbles: true,
          composed: true,
          detail: { error: this._error, raw },
        })
      );
    }
  }

  #toggle = (): void => {
    this._isCollapsed = !this._isCollapsed;
  };

  override render() {
    if (this._error) {
      return html`<div class="err">JSON parse error: ${this._error}</div>`;
    }
    if (!this._formatted) {
      return html`<slot></slot>`;
    }
    const summary = (() => {
      try {
        const v = JSON.parse(this.src || "{}");
        if (Array.isArray(v)) return `Array(${v.length})`;
        if (v && typeof v === "object") return `Object{${Object.keys(v).length}}`;
        return typeof v;
      } catch {
        return "value";
      }
    })();

    return html`
      <span class="toggle">
        <button type="button" @click=${this.#toggle} aria-expanded=${!this._isCollapsed}>
          ${this._isCollapsed ? "▶" : "▼"} ${summary}
        </button>
      </span>
      ${this._isCollapsed ? "" : html`<pre>${this._formatted}</pre>`}
    `;
  }
}

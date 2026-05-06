import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeExportFormat = "markdown" | "json" | "submit" | "clear";
export type CeExportLayout = "row" | "menu" | "floating";

const FORMAT_LABELS: Record<CeExportFormat, string> = {
  markdown: "Copy as Markdown",
  json: "Download JSON",
  submit: "Submit",
  clear: "Clear",
};

interface SinkLike extends HTMLElement {
  subject?: string;
}

/**
 * `<ce-feedback-export>` — page-level action buttons for exporting
 * feedback. Each button dispatches a bubbling ce-feedback-export-request
 * event the ancestor sink handles. Listens to ce-feedback-persisted /
 * ce-feedback-failed events from the sink to flash a transient status
 * line for ~1500ms.
 */
export class CeFeedbackExport extends CecElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--ce-text);
      margin: var(--ce-space-3) 0;
    }
    :host([layout="floating"]) {
      position: sticky;
      bottom: var(--ce-space-3);
    }
    .ce-export__row {
      display: flex;
      gap: var(--ce-space-2);
      flex-wrap: wrap;
      align-items: center;
    }
    :host([layout="menu"]) .ce-export__row {
      flex-direction: column;
      align-items: flex-start;
    }

    .ce-export__btn {
      font: inherit;
      color: inherit;
      background: var(--ce-bg-elevated, var(--ce-surface-2));
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-md, var(--ce-radius-sm));
      padding: var(--ce-inset-sm, var(--ce-space-2)) var(--ce-space-3);
      cursor: pointer;
      transition: background var(--ce-transition-fast),
        border-color var(--ce-transition-fast),
        color var(--ce-transition-fast);
    }
    .ce-export__btn:hover {
      border-color: var(--ce-accent, var(--ce-color-purple));
    }
    .ce-export__btn:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    .ce-export__btn--primary {
      background: var(--ce-accent, var(--ce-color-purple));
      color: #fff;
      border-color: var(--ce-accent, var(--ce-color-purple));
    }
    .ce-export__btn--danger {
      color: var(--ce-bad, var(--ce-color-red));
    }

    .ce-export__status {
      font-size: var(--ce-text-sm);
      color: var(--ce-text-dim, var(--ce-muted));
      transition: color var(--ce-transition-fast);
    }
    .ce-export__status[data-state="ok"] {
      color: var(--ce-ok, var(--ce-color-green));
    }
    .ce-export__status[data-state="err"] {
      color: var(--ce-bad, var(--ce-color-red));
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String })
  subject = "";

  @property({ type: String })
  formats = "markdown json";

  @property({ type: String, reflect: true })
  layout: CeExportLayout = "row";

  @property({ type: String, attribute: "submit-endpoint" })
  submitEndpoint = "";

  @state() private _status: { text: string; state: "" | "ok" | "err" } = {
    text: "",
    state: "",
  };

  #sink: SinkLike | null = null;
  #statusTimer: ReturnType<typeof setTimeout> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#sink = this.#findSink();
    if (this.#sink) {
      this.#sink.addEventListener(
        "ce-feedback-persisted",
        this.#onPersisted as EventListener
      );
      this.#sink.addEventListener(
        "ce-feedback-failed",
        this.#onFailed as EventListener
      );
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.#sink) {
      this.#sink.removeEventListener(
        "ce-feedback-persisted",
        this.#onPersisted as EventListener
      );
      this.#sink.removeEventListener(
        "ce-feedback-failed",
        this.#onFailed as EventListener
      );
    }
    if (this.#statusTimer) {
      clearTimeout(this.#statusTimer);
      this.#statusTimer = null;
    }
  }

  override willUpdate(_changed: PropertyValues<this>): void {
    // No special setup
  }

  #findSink(): SinkLike | null {
    let node: Element | null = this.parentElement;
    while (node && node.tagName !== "BODY") {
      if (node.tagName.toLowerCase() === "ce-feedback-sink") {
        return node as SinkLike;
      }
      node = node.parentElement;
    }
    return null;
  }

  #parsedFormats(): CeExportFormat[] {
    return this.formats
      .split(/\s+/)
      .filter(Boolean)
      .filter((s): s is CeExportFormat =>
        ["markdown", "json", "submit", "clear"].includes(s)
      );
  }

  override render() {
    const formats = this.#parsedFormats();
    return html`
      <div class="ce-export__row">
        ${formats.map((f) => this.#renderButton(f))}
        <slot name="extra"></slot>
        ${this._status.text
          ? html`<span
              class="ce-export__status"
              data-state=${this._status.state}
              role="status"
              aria-live="polite"
            >${this._status.text}</span>`
          : ""}
      </div>
    `;
  }

  #renderButton(format: CeExportFormat): TemplateResult {
    const cls =
      format === "submit"
        ? "ce-export__btn ce-export__btn--primary"
        : format === "clear"
          ? "ce-export__btn ce-export__btn--danger"
          : "ce-export__btn";
    return html`
      <button
        type="button"
        class=${cls}
        aria-label=${FORMAT_LABELS[format]}
        @click=${() => this.#requestExport(format)}
      >${FORMAT_LABELS[format]}</button>
    `;
  }

  #requestExport(format: CeExportFormat): void {
    const subject = this.subject || this.#sink?.getAttribute("subject") || "";
    this.dispatchEvent(
      new CustomEvent("ce-feedback-export-request", {
        bubbles: true,
        composed: true,
        detail: { format, subject, submitEndpoint: this.submitEndpoint || undefined },
      })
    );
  }

  #onPersisted = (e: CustomEvent<{ transport: string }>): void => {
    const t = e.detail?.transport;
    let text = "Saved";
    if (t === "markdown") text = "Copied to clipboard";
    else if (t === "json") text = "Downloaded JSON";
    else if (t === "http") text = "Submitted";
    else if (t === "console") text = "Logged";
    else if (t === "file") text = "Wrote file";
    else if (t === "localstorage") text = "Saved locally";
    this.#flashStatus(text, "ok");
  };

  #onFailed = (e: CustomEvent<{ transport: string }>): void => {
    const t = e.detail?.transport;
    this.#flashStatus(`Failed (${t ?? "?"})`, "err");
  };

  #flashStatus(text: string, state: "ok" | "err"): void {
    this._status = { text, state };
    if (this.#statusTimer) clearTimeout(this.#statusTimer);
    this.#statusTimer = setTimeout(() => {
      this._status = { text: "", state: "" };
      this.#statusTimer = null;
    }, 1500);
  }
}

import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-file-upload>` — drag-and-drop file picker.
 *
 * Renders a dashed-border dropzone with a click-to-browse hint and emits
 * `ce-files` whenever the user picks or drops files. The component does NOT
 * upload anything — it only collects the user's choice (the parent handles
 * transport). Static-by-default per CDR-004: with no attributes set it
 * renders an idle dropzone.
 *
 * Attributes:
 *   accept    — MIME / extension filter forwarded to native <input>
 *   multiple  — boolean; allow picking more than one file (default false)
 *   name      — echoed in ce-files detail
 *   label     — primary headline shown in the zone (default sensible)
 *   hint      — secondary line (default "or drag files here")
 *   disabled  — boolean; disables interaction
 *
 * Slots:
 *   icon      — leading icon (default ⬆)
 *   label     — overrides label attribute
 *   hint      — overrides hint attribute
 *   (default) — appended below the hint (file list, help, etc.)
 *
 * Events:
 *   ce-files — { name, files: File[] } whenever the selection changes
 */
export class CeFileUpload extends CecElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    .zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ce-space-2);
      padding: var(--ce-space-5) var(--ce-space-4);
      background: var(--ce-surface);
      border: 1.5px dashed var(--ce-border-strong);
      border-radius: var(--ce-radius);
      text-align: center;
      cursor: pointer;
      transition: background var(--ce-transition), border-color var(--ce-transition);
    }
    .zone:hover:not([data-disabled]) {
      background: var(--ce-state-hover);
      border-color: var(--ce-color-blue);
    }
    .zone:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    .zone[data-dragging] {
      background: var(--ce-color-blue-bg);
      border-color: var(--ce-color-blue);
      border-style: solid;
    }
    .zone[data-disabled] {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .icon {
      font-size: var(--ce-text-2xl);
      color: var(--ce-muted);
      line-height: 1;
    }
    .zone[data-dragging] .icon,
    .zone:hover:not([data-disabled]) .icon {
      color: var(--ce-color-blue);
    }
    .label {
      font-weight: 600;
      color: var(--ce-text);
    }
    .hint {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
    }
    input[type="file"] {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }
    .body {
      margin-top: var(--ce-space-2);
    }
    .body:not(:has(::slotted(*))) { display: none; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) accept = "";
  @property({ type: Boolean, reflect: true }) multiple = false;
  @property({ type: String }) name = "";
  @property({ type: String }) label = "Choose a file";
  @property({ type: String }) hint = "or drag it here";
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private _dragging = false;

  #input?: HTMLInputElement;

  #emit(files: File[]): void {
    this.dispatchEvent(
      new CustomEvent("ce-files", {
        bubbles: true,
        composed: true,
        detail: { name: this.name, files },
      }),
    );
  }

  #onChange = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.#emit(Array.from(input.files ?? []));
  };

  #onZoneClick = (): void => {
    if (this.disabled) return;
    this.#input?.click();
  };

  #onKey = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.#input?.click();
    }
  };

  #onDragOver = (e: DragEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    this._dragging = true;
  };

  #onDragLeave = (e: DragEvent): void => {
    if (this.disabled) return;
    // Only flip off when leaving the zone, not when crossing a child.
    if (e.currentTarget === e.target) {
      this._dragging = false;
    }
  };

  #onDrop = (e: DragEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    this._dragging = false;
    const dt = e.dataTransfer;
    if (!dt) return;
    let files = Array.from(dt.files);
    if (!this.multiple && files.length > 1) files = files.slice(0, 1);
    this.#emit(files);
  };

  override render() {
    const dragging = this._dragging ? "" : null;
    const disabled = this.disabled ? "" : null;
    const labelId = "lu" + Math.random().toString(36).slice(2, 8);
    return html`
      <div
        class="zone"
        role="button"
        tabindex=${this.disabled ? -1 : 0}
        aria-labelledby=${labelId}
        aria-disabled=${this.disabled ? "true" : "false"}
        data-dragging=${dragging as unknown as string}
        data-disabled=${disabled as unknown as string}
        @click=${this.#onZoneClick}
        @keydown=${this.#onKey}
        @dragover=${this.#onDragOver}
        @dragleave=${this.#onDragLeave}
        @drop=${this.#onDrop}
      >
        <input
          type="file"
          name=${this.name}
          accept=${this.accept || ""}
          ?multiple=${this.multiple}
          ?disabled=${this.disabled}
          @change=${this.#onChange}
        />
        <span class="icon" aria-hidden="true"><slot name="icon">⬆</slot></span>
        <span class="label" id=${labelId}><slot name="label">${this.label}</slot></span>
        <span class="hint"><slot name="hint">${this.hint}</slot></span>
        ${nothing}
      </div>
      <div class="body"><slot></slot></div>
    `;
  }

  protected override firstUpdated(): void {
    this.#input = this.renderRoot.querySelector("input[type=file]") as HTMLInputElement;
  }
}

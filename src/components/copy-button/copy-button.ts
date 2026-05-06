import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-copy-button>` — copy-to-clipboard trigger for chat surfaces.
 *
 * Attributes:
 *   for           — id of the element whose text/value should be copied.
 *                   Falls back to document.querySelector when the value
 *                   contains a CSS selector (`.`/`#`/` `/`[`).
 *   label         — default button label (default "Copy")
 *   copied-label  — label shown for ~1.5s after a successful copy (default "Copied")
 *
 * Events:
 *   ce-copy { text, ok } — fires after every click attempt.
 *
 * No slots; the rendered text is the label attribute.
 */
export class CeCopyButton extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
    }
    button {
      font: inherit;
      color: var(--ce-text);
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      padding: var(--ce-inset-sm) var(--ce-space-3);
      cursor: pointer;
      transition: background var(--ce-transition-fast), border-color var(--ce-transition-fast),
        color var(--ce-transition-fast);
    }
    button:hover {
      border-color: var(--ce-color-blue);
    }
    button:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    button[data-state="copied"] {
      color: var(--ce-color-green);
      border-color: var(--ce-color-green);
    }
    button[disabled] {
      cursor: default;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) for = "";
  @property({ type: String }) label = "Copy";
  @property({ type: String, attribute: "copied-label" }) copiedLabel = "Copied";

  @state() private _copied = false;

  #revertTimer: ReturnType<typeof setTimeout> | null = null;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.#revertTimer) {
      clearTimeout(this.#revertTimer);
      this.#revertTimer = null;
    }
  }

  override render() {
    const text = this._copied ? this.copiedLabel : this.label;
    return html`<button
      type="button"
      aria-label=${text}
      data-state=${this._copied ? "copied" : ""}
      ?disabled=${this._copied}
      @click=${this.#onClick}
    >
      ${text}
    </button>`;
  }

  #resolveTarget(): Element | null {
    if (!this.for) return null;
    if (typeof document === "undefined") return null;
    // Prefer ID lookup (cheap + handles bare ids that aren't valid selectors).
    const byId = document.getElementById(this.for);
    if (byId) return byId;
    // Fall back to selector when the value smells like one.
    if (/[#.\s\[]/.test(this.for)) {
      try {
        return document.querySelector(this.for);
      } catch {
        return null;
      }
    }
    return null;
  }

  #readText(target: Element | null): string {
    if (!target) return "";
    if (
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLInputElement
    ) {
      return target.value;
    }
    return target.textContent ?? "";
  }

  async #onClick(): Promise<void> {
    if (this._copied) return;
    const target = this.#resolveTarget();
    const text = this.#readText(target);
    if (!target) {
      this.dispatchEvent(
        new CustomEvent("ce-copy", {
          bubbles: true,
          composed: true,
          detail: { text: "", ok: false },
        })
      );
      return;
    }
    const ok = await this.#writeClipboard(text);
    if (ok) {
      this._copied = true;
      this.#revertTimer = setTimeout(() => {
        this._copied = false;
        this.#revertTimer = null;
      }, 1500);
    }
    this.dispatchEvent(
      new CustomEvent("ce-copy", {
        bubbles: true,
        composed: true,
        detail: { text, ok },
      })
    );
  }

  async #writeClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fall through to legacy path
      }
    }
    if (typeof document === "undefined") return false;
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand?.("copy") ?? false;
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

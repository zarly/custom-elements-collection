import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-check-item>` — a single checklist row with a checkbox and rich-content
 * default slot.
 *
 * When nested inside `<ce-checklist>` (slot mode per CDR-005), the parent reads
 * `id`, `checked`, and `category` as attributes and consumes the default slot
 * content via innerHTML; the item renders nothing (display:contents).
 * When used standalone it renders a single checkbox + label row.
 *
 * Attributes:
 *   id        — item identifier (string)
 *   checked   — boolean; marks the item done
 *   category  — optional grouping label; read by ce-checklist group-by="category"
 *
 * Slot:
 *   default   — item text / rich content: links, chips, code, dates, etc.
 *               (CDR-002: typed values as children, not attributes)
 */
export class CeCheckItem extends CecElement {
  static override styles = css`
    :host {
      display: contents;
    }
    :host([data-standalone]) {
      display: flex;
      align-items: flex-start;
      gap: var(--ce-space-2);
      color: var(--ce-text);
    }
    :host([data-standalone][checked]) .ci-label {
      color: var(--ce-muted);
      text-decoration: line-through;
    }
    input[type="checkbox"] {
      margin-top: 3px;
      accent-color: var(--ce-color-blue);
      flex-shrink: 0;
    }
    .ci-label {
      flex: 1;
      font-size: var(--ce-text-base);
      line-height: var(--ce-line-snug);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) override id = "";

  @property({ type: Boolean, reflect: true }) checked = false;

  @property({ type: String, reflect: true }) category = "";

  @state() private _standalone = false;

  override connectedCallback(): void {
    super.connectedCallback();
    const nested = this.closest("ce-checklist") !== null;
    this._standalone = !nested;
    if (this._standalone) {
      this.setAttribute("data-standalone", "");
    } else {
      this.removeAttribute("data-standalone");
    }
  }

  override render() {
    if (!this._standalone) {
      return nothing;
    }

    return html`
      <input
        type="checkbox"
        .checked=${this.checked}
        aria-checked=${this.checked ? "true" : "false"}
        @change=${this.#onChange}
      />
      <span class="ci-label"><slot></slot></span>
    `;
  }

  #onChange(e: Event): void {
    this.checked = (e.target as HTMLInputElement).checked;
    this.dispatchEvent(
      new CustomEvent("ce-check-item-change", {
        bubbles: true,
        composed: true,
        detail: { id: this.id, checked: this.checked },
      })
    );
  }
}

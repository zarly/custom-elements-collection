import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../core/index.js";

export interface FilterOption {
  /** Filter value (passed in change event detail). */
  value: string;
  /** Display label. */
  label: string;
  /** Optional count chip on the right. */
  count?: number | string;
}

/**
 * `<ce-filter-bar>` — chip-toggle filter row. Single-select by default.
 *
 * Attributes:
 *   label    — optional left-side label
 *   value    — current selected value
 *   multiple — boolean; allow multiple selection (value is comma-joined)
 *
 * Provide options via the `options` property.
 *
 * Events:
 *   ce-filter-change — bubbles with { value, values: string[] }
 */
export class CeFilterBar extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      flex-wrap: wrap;
    }
    .ce-filter__label {
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      margin-right: var(--ce-space-1);
    }
    .ce-filter__btn {
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border-soft);
      color: var(--ce-text);
      border-radius: var(--ce-radius-pill);
      padding: var(--ce-space-1) var(--ce-space-3);
      cursor: pointer;
      font: inherit;
      font-size: var(--ce-text-sm);
      font-weight: 500;
      transition: all var(--ce-transition-fast);
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
    }
    .ce-filter__btn:hover { border-color: var(--ce-color-blue); }
    .ce-filter__btn[aria-pressed="true"] {
      background: var(--ce-color-blue);
      color: var(--ce-text-inverse);
      border-color: var(--ce-color-blue);
    }
    .ce-filter__count {
      font-size: var(--ce-text-xs);
      opacity: 0.7;
      font-variant-numeric: tabular-nums;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) label = "";
  @property({ type: String }) value = "";
  @property({ type: Boolean, reflect: true }) multiple = false;
  @property(jsonProp<FilterOption[]>([], "options")) options: FilterOption[] = [];

  get #values(): string[] {
    if (!this.value) return [];
    return this.multiple ? this.value.split(",").filter(Boolean) : [this.value];
  }

  #toggle(v: string): void {
    if (this.multiple) {
      const set = new Set(this.#values);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      this.value = Array.from(set).join(",");
    } else {
      this.value = this.value === v ? "" : v;
    }
    this.dispatchEvent(
      new CustomEvent("ce-filter-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value, values: this.#values },
      })
    );
  }

  override render() {
    const active = new Set(this.#values);
    return html`
      ${this.label ? html`<span class="ce-filter__label">${this.label}</span>` : ""}
      ${this.options.map(
        (o) => html`
          <button
            type="button"
            class="ce-filter__btn"
            aria-pressed=${active.has(o.value) ? "true" : "false"}
            @click=${() => this.#toggle(o.value)}
          >
            <span>${o.label}</span>
            ${o.count !== undefined
              ? html`<span class="ce-filter__count">${o.count}</span>`
              : ""}
          </button>
        `
      )}
    `;
  }
}

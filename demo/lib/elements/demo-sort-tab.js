/**
 * <demo-sort-tab> — Sort axis radio group inside the settings modal.
 *
 * Six sort modes: a-z / z-a / recent-updated / recent-created / most-deps / least-deps.
 * Binds to form field `sortBy` via `form.bindRadioGroup()`.
 *
 * Set `.form = reactiveFormInstance` after upgrade.
 */

const SORT_OPTIONS = [
  { value: "a-z", label: "A → Z" },
  { value: "z-a", label: "Z → A" },
  { value: "recent-updated", label: "Recently updated (rows ordered top to bottom; toggle 'Show updated date' in View to see dates)" },
  { value: "recent-created", label: "Recently created" },
  { value: "most-deps", label: "Most dependents" },
  { value: "least-deps", label: "Least dependents" },
];

class DemoSortTab extends HTMLElement {
  set form(f) {
    this._form = f;
    this._unbind?.();
    this._unbind = null;
    this._render();
    const radios = Array.from(this.querySelectorAll("input[type=radio]"));
    if (f && radios.length) this._unbind = f.bindRadioGroup("sortBy", radios);
  }

  connectedCallback() {
    if (!this.children.length) this._render();
  }

  _render() {
    this.innerHTML = `<div class="demo-tab-section">
      <p class="demo-tab-hint">Choose how components are ordered within each section.</p>
      <div class="demo-radio-group" role="radiogroup" aria-label="Sort by">
        ${SORT_OPTIONS.map(({ value, label }) => `<label class="demo-radio-row">
          <input type="radio" name="demo-sort-by" value="${value}" />
          <span>${label}</span>
        </label>`).join("")}
      </div>
    </div>`;
  }
}

customElements.define("demo-sort-tab", DemoSortTab);

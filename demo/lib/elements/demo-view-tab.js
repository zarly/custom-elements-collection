/**
 * <demo-view-tab> — View options tab inside the settings modal.
 *
 * Four checkbox rows controlling per-row display options:
 *   showDescription  — show one-line description under the name
 *   showUpdated      — show updated date
 *   showCreated      — show created date
 *   showStability    — show stability dot when non-stable
 *
 * Set `.form = reactiveFormInstance` after upgrade.
 */

const ROWS = [
  { field: "showStability", label: "Show stability badge (when non-stable)" },
  { field: "showDescription", label: "Show one-line description" },
  { field: "showUpdated", label: "Show updated date" },
  { field: "showCreated", label: "Show created date" },
];

class DemoViewTab extends HTMLElement {
  set form(f) {
    this._form = f;
    this._unbinds?.forEach((fn) => fn());
    this._unbinds = [];
    this._render();
    for (const { field } of ROWS) {
      const el = this.querySelector(`input[data-field="${field}"]`);
      if (el && f) this._unbinds.push(f.bindCheckbox(field, el));
    }
  }

  connectedCallback() {
    if (!this.children.length) this._render();
  }

  _render() {
    this.innerHTML = `<div class="demo-tab-section">
      <p class="demo-tab-hint">Choose what appears under each component name in the sidebar.</p>
      ${ROWS.map(({ field, label }) => `<label class="demo-check-row">
        <input type="checkbox" data-field="${field}" />
        <span>${label}</span>
      </label>`).join("")}
    </div>`;
  }
}

customElements.define("demo-view-tab", DemoViewTab);

/**
 * <demo-group-tab> — Group axis radio group inside the settings modal.
 *
 * Six group-by axes: group / tier / stability / category / createdMonth / alpha.
 * Binds to form field `groupBy` via `form.bindRadioGroup()`.
 *
 * Set `.form = reactiveFormInstance` after upgrade.
 */

const GROUP_OPTIONS = [
  { value: "group", label: "Group (library grouping)" },
  { value: "tier", label: "Tier (brick / widget / layout)" },
  { value: "stability", label: "Stability" },
  { value: "category", label: "Category (ui / lesson / internal)" },
  { value: "createdMonth", label: "Created month" },
  { value: "alpha", label: "A-Z (alphabetical sections)" },
];

class DemoGroupTab extends HTMLElement {
  set form(f) {
    this._form = f;
    this._unbind?.();
    this._unbind = null;
    this._render();
    const radios = Array.from(this.querySelectorAll("input[type=radio]"));
    if (f && radios.length) this._unbind = f.bindRadioGroup("groupBy", radios);
  }

  connectedCallback() {
    if (!this.children.length) this._render();
  }

  _render() {
    this.innerHTML = `<div class="demo-tab-section">
      <p class="demo-tab-hint">Choose how sidebar components are sectioned.</p>
      <div class="demo-radio-group" role="radiogroup" aria-label="Group by">
        ${GROUP_OPTIONS.map(({ value, label }) => `<label class="demo-radio-row">
          <input type="radio" name="demo-group-by" value="${value}" />
          <span>${label}</span>
        </label>`).join("")}
      </div>
    </div>`;
  }
}

customElements.define("demo-group-tab", DemoGroupTab);

/**
 * <demo-settings-modal> — settings modal with four tabs.
 *
 * Wraps <ce-modal> + <ce-tabs>. Tabs: View / Group / Sort / Filter.
 * Each tab body is a dedicated <demo-*-tab> element bound to the same form.
 *
 * Set `.form = reactiveFormInstance` after upgrade.
 * Call `.setIndex(INDEX)` to enable the Tags chip grid in the Filter tab.
 * Call `.open()` / `.close()` to control visibility.
 *
 * Remembers the last-opened tab in localStorage under `cec-demo-last-tab`.
 */

const LS_TAB_KEY = "cec-demo-last-tab";
const TABS = ["View", "Group", "Sort", "Filter"];

class DemoSettingsModal extends HTMLElement {
  constructor() {
    super();
    this._form = null;
    this._index = null;
    this._activeTab = 0;
  }

  connectedCallback() {
    const stored = parseInt(localStorage.getItem(LS_TAB_KEY) ?? "0", 10);
    this._activeTab = Number.isFinite(stored) && stored >= 0 && stored < TABS.length ? stored : 0;
    this._render();
    this._wire();
  }

  set form(f) {
    this._form = f;
    // Push to tab children if already rendered.
    this._syncFormToTabs();
  }

  setIndex(index) {
    this._index = index;
    const filterTab = this.querySelector("demo-filter-tab");
    if (filterTab) filterTab.setIndex(index);
  }

  open() {
    const modal = this.querySelector("ce-modal");
    if (modal) modal.open = true;
  }

  close() {
    const modal = this.querySelector("ce-modal");
    if (modal) modal.open = false;
  }

  _render() {
    this.innerHTML = `<ce-modal id="settings-modal-dialog" title="Settings" data-testid="settings-modal">
      <ce-tabs
        tabs='["View","Group","Sort","Filter"]'
        active="${this._activeTab}"
        data-testid="settings-tabs"
      >
        <div slot="panel" data-panel="view"><demo-view-tab></demo-view-tab></div>
        <div slot="panel" data-panel="group"><demo-group-tab></demo-group-tab></div>
        <div slot="panel" data-panel="sort"><demo-sort-tab></demo-sort-tab></div>
        <div slot="panel" data-panel="filter"><demo-filter-tab></demo-filter-tab></div>
      </ce-tabs>
      <ce-button slot="footer" variant="ghost" data-action="reset">Reset filters</ce-button>
      <ce-button slot="footer" data-action="apply">Apply</ce-button>
    </ce-modal>`;

    this._syncFormToTabs();
    if (this._index) {
      const filterTab = this.querySelector("demo-filter-tab");
      if (filterTab) filterTab.setIndex(this._index);
    }
    this._wire();
  }

  _syncFormToTabs() {
    if (!this._form) return;
    const view = this.querySelector("demo-view-tab");
    const group = this.querySelector("demo-group-tab");
    const sort = this.querySelector("demo-sort-tab");
    const filter = this.querySelector("demo-filter-tab");
    if (view) view.form = this._form;
    if (group) group.form = this._form;
    if (sort) sort.form = this._form;
    if (filter) filter.form = this._form;
  }

  _wire() {
    const modal = this.querySelector("ce-modal");
    const tabs = this.querySelector("ce-tabs");
    const resetBtn = this.querySelector("[data-action=reset]");
    const applyBtn = this.querySelector("[data-action=apply]");

    // Remember active tab.
    if (tabs) {
      tabs.addEventListener("ce-tab-change", (ev) => {
        this._activeTab = ev.detail?.active ?? 0;
        try { localStorage.setItem(LS_TAB_KEY, String(this._activeTab)); } catch {}
      });
    }

    // Reset: clear filter axes only (leave view options intact).
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (!this._form) return;
        for (const field of ["stab", "tier", "cat", "has", "tags"]) {
          this._form.set(field, new Set());
        }
        this._form.set("created", 0);
        this._form.set("updated", 0);
      });
    }

    // Apply: just close.
    if (applyBtn) {
      applyBtn.addEventListener("click", () => this.close());
    }
  }
}

customElements.define("demo-settings-modal", DemoSettingsModal);

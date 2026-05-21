/**
 * <demo-filter-tab> — Filter form tab inside the settings modal.
 *
 * Ports the v2 filter form. All changes write through `form.set(...)` so
 * the sidebar refreshes via the form's subscriber.
 *
 * Set `.form = reactiveFormInstance` after upgrade.
 * Call `.setIndex(INDEX)` to populate the tag chips.
 */

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STAB_VALUES = ["stable", "beta", "experimental", "deprecated"];
const TIER_VALUES = ["brick", "widget", "layout"];
const CAT_VALUES  = ["ui", "lesson", "internal"];
const HAS_VALUES  = [
  { value: "events",       label: "Events" },
  { value: "slots",        label: "Slots" },
  { value: "cssVars",      label: "CSS variables" },
  { value: "globalDeps",   label: "Global dependencies" },
  { value: "sideEffects",  label: "Side effects" },
];
const RECENCY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "365 days" },
];

class DemoFilterTab extends HTMLElement {
  constructor() {
    super();
    this._form = null;
    this._index = null;
    this._unbinds = [];
  }

  set form(f) {
    this._form = f;
    this._rebind();
  }

  setIndex(index) {
    this._index = index;
    if (this.isConnected) this._renderTagChips();
  }

  connectedCallback() {
    this._render();
    if (this._form) this._rebind();
  }

  _render() {
    this.innerHTML = `<div class="demo-tab-section demo-filter-grid">
      <fieldset class="filter-group">
        <legend>Stability</legend>
        ${STAB_VALUES.map((v) => `<label class="filter-group__label"><input type="checkbox" data-set="stab" value="${v}" /> ${esc(v)}</label>`).join("")}
      </fieldset>
      <fieldset class="filter-group">
        <legend>Tier</legend>
        ${TIER_VALUES.map((v) => `<label class="filter-group__label"><input type="checkbox" data-set="tier" value="${v}" /> ${esc(v)}</label>`).join("")}
      </fieldset>
      <fieldset class="filter-group">
        <legend>Category</legend>
        ${CAT_VALUES.map((v) => `<label class="filter-group__label"><input type="checkbox" data-set="cat" value="${v}" /> ${esc(v)}</label>`).join("")}
      </fieldset>
      <fieldset class="filter-group">
        <legend>Has</legend>
        ${HAS_VALUES.map(({ value, label }) => `<label class="filter-group__label"><input type="checkbox" data-set="has" value="${value}" /> ${esc(label)}</label>`).join("")}
      </fieldset>
      <fieldset class="filter-group filter-group--wide">
        <legend>Tags</legend>
        <div class="filter-tags" data-filter-tags></div>
      </fieldset>
      <fieldset class="filter-group filter-group--wide">
        <legend>Created in last</legend>
        <div class="filter-recency">
          ${RECENCY_OPTIONS.map(({ value, label }) => `<label><input type="radio" name="demo-filter-created" value="${esc(value)}" /> ${esc(label)}</label>`).join("")}
          <label class="filter-custom"><input type="number" data-recency="created" min="1" step="1" placeholder="custom" /><span>days</span></label>
        </div>
      </fieldset>
      <fieldset class="filter-group filter-group--wide">
        <legend>Updated in last</legend>
        <div class="filter-recency">
          ${RECENCY_OPTIONS.map(({ value, label }) => `<label><input type="radio" name="demo-filter-updated" value="${esc(value)}" /> ${esc(label)}</label>`).join("")}
          <label class="filter-custom"><input type="number" data-recency="updated" min="1" step="1" placeholder="custom" /><span>days</span></label>
        </div>
      </fieldset>
    </div>`;

    this._renderTagChips();
  }

  _rebind() {
    // Clean up old listeners.
    this._unbinds.forEach((fn) => fn());
    this._unbinds = [];
    if (!this._form || !this.isConnected) return;

    const f = this._form;

    // Per-set checkboxes: stab / tier / cat / has.
    for (const setName of ["stab", "tier", "cat", "has"]) {
      const cbs = Array.from(this.querySelectorAll(`[data-set="${setName}"]`));
      for (const cb of cbs) {
        const handler = () => {
          const current = f.get(setName);
          if (cb.checked) current.add(cb.value);
          else current.delete(cb.value);
          f.set(setName, current);
        };
        cb.addEventListener("change", handler);
        this._unbinds.push(() => cb.removeEventListener("change", handler));
      }
      // React to form changes (e.g. reset).
      const syncCbs = () => {
        const current = f.get(setName);
        for (const cb of cbs) cb.checked = current.has(cb.value);
      };
      syncCbs();
      const unsub = f.subscribe(syncCbs);
      this._unbinds.push(unsub);
    }

    // Recency radios + custom number inputs.
    for (const axis of ["created", "updated"]) {
      const radios = Array.from(this.querySelectorAll(`input[name="demo-filter-${axis}"]`));
      const custom = this.querySelector(`input[data-recency="${axis}"]`);

      // Sync from form to DOM.
      const syncRecency = () => {
        const val = f.get(axis);
        for (const r of radios) r.checked = false;
        if (custom) custom.value = "";
        if (val === 0) {
          const any = radios.find((r) => r.value === "");
          if (any) any.checked = true;
        } else if ([7, 30, 90, 365].includes(val)) {
          const r = radios.find((el) => el.value === String(val));
          if (r) r.checked = true;
        } else if (custom) {
          custom.value = String(val);
        }
      };
      syncRecency();
      const unsub = f.subscribe(syncRecency);
      this._unbinds.push(unsub);

      // Radio -> form.
      for (const r of radios) {
        const handler = () => {
          if (r.checked) {
            f.set(axis, r.value ? parseInt(r.value, 10) : 0);
            if (custom) custom.value = "";
          }
        };
        r.addEventListener("change", handler);
        this._unbinds.push(() => r.removeEventListener("change", handler));
      }

      // Custom number -> form.
      if (custom) {
        const handler = () => {
          const n = parseInt(custom.value, 10);
          f.set(axis, Number.isFinite(n) && n > 0 ? n : 0);
          for (const r of radios) r.checked = false;
          if (!custom.value) {
            const any = radios.find((r) => r.value === "");
            if (any) any.checked = true;
          }
        };
        custom.addEventListener("input", handler);
        custom.addEventListener("change", handler);
        this._unbinds.push(() => {
          custom.removeEventListener("input", handler);
          custom.removeEventListener("change", handler);
        });
      }
    }

    this._renderTagChips();
  }

  _renderTagChips() {
    const host = this.querySelector("[data-filter-tags]");
    if (!host) return;
    if (!this._index) { host.innerHTML = ""; return; }

    const counts = new Map();
    for (const r of this._index) {
      for (const t of r.tags.slice(1)) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    const choices = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12);

    const current = this._form ? this._form.get("tags") : new Set();
    host.innerHTML = choices
      .map(([t, n]) => `<ce-chip outlined data-tag="${esc(t)}"${current.has(t) ? " data-selected" : ""} title="${n} component(s)" style="cursor:pointer;user-select:none">${esc(t)}</ce-chip>`)
      .join("");

    for (const chip of host.querySelectorAll("ce-chip")) {
      chip.addEventListener("click", () => {
        if (!this._form) return;
        const t = chip.dataset.tag;
        const tags = this._form.get("tags");
        if (tags.has(t)) tags.delete(t);
        else tags.add(t);
        this._form.set("tags", tags);
        chip.toggleAttribute("data-selected");
      });
    }

    // Keep chips in sync on form changes (e.g. reset).
    if (this._form) {
      const syncTags = () => {
        const current = this._form.get("tags");
        for (const chip of host.querySelectorAll("ce-chip")) {
          chip.toggleAttribute("data-selected", current.has(chip.dataset.tag));
        }
      };
      const unsub = this._form.subscribe(syncTags);
      this._unbinds.push(unsub);
    }
  }
}

customElements.define("demo-filter-tab", DemoFilterTab);

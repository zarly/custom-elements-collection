/**
 * <demo-filter-tab> — Filter form tab inside the settings modal.
 *
 * Ports the v2 filter form. All changes write through `form.set(...)` so
 * the sidebar refreshes via the form's subscriber.
 *
 * Set `.form = reactiveFormInstance` after upgrade.
 * Call `.setIndex(INDEX)` to populate the tag chips.
 */

import { passesFilters } from "../filters.js";
import { valueCounts, valueCountsOnRemove, pickCandidates } from "../facets.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Show every free-form tag, not just the top-N. The cluster scrolls when the
// list gets long and a small search input narrows it in place.
const TAG_CHIP_LIMIT = Infinity;

/** Read the free-form tag list of a record (skips tags[0], the canonical group). */
function freeTagsOf(record) {
  return record.tags.slice(1);
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
    this._tagSearch = ""; // local presentation filter for the tag-chip cluster
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
        <input type="search" class="filter-tags__search" data-filter-tags-search placeholder="Filter tags…" aria-label="Filter tags" />
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
    // Re-render chip counts whenever any filter (or tag selection) changes.
    // Reads the current form snapshot inside _renderTagChips, so all axes
    // contribute to the count (created/updated/stab/tier/cat/has/tags).
    const syncChips = () => this._renderTagChips();
    const unsubChips = f.subscribe(syncChips);
    this._unbinds.push(unsubChips);

    // Wire the chip-search input. The search is presentation-only — it hides
    // non-matching chips locally without touching form state. Stored on the
    // instance so re-renders re-apply it.
    const searchInput = this.querySelector("[data-filter-tags-search]");
    if (searchInput) {
      // Restore prior query into the visible input after _render rebuilt DOM.
      searchInput.value = this._tagSearch ?? "";
      const handler = () => {
        this._tagSearch = (searchInput.value ?? "").trim().toLowerCase();
        this._applyTagSearch();
      };
      searchInput.addEventListener("input", handler);
      this._unbinds.push(() => searchInput.removeEventListener("input", handler));
      this._applyTagSearch();
    }
  }

  /** Hide chips whose tag doesn't include the current search query. */
  _applyTagSearch() {
    const host = this.querySelector("[data-filter-tags]");
    if (!host) return;
    const q = this._tagSearch ?? "";
    for (const chip of host.querySelectorAll("ce-chip")) {
      const tag = (chip.dataset.tag ?? "").toLowerCase();
      chip.hidden = q !== "" && !tag.includes(q);
    }
  }

  /**
   * Build the current filter snapshot the way `passesFilters` expects.
   * Pulled out so the count predicate stays in sync with the live form state.
   */
  _filtersSnapshot() {
    if (!this._form) {
      return {
        stab: new Set(), tier: new Set(), cat: new Set(),
        has: new Set(), tags: new Set(),
        created: 0, updated: 0,
      };
    }
    return {
      stab:    this._form.get("stab"),
      tier:    this._form.get("tier"),
      cat:     this._form.get("cat"),
      has:     this._form.get("has"),
      tags:    this._form.get("tags"),
      created: this._form.get("created"),
      updated: this._form.get("updated"),
    };
  }

  _renderTagChips() {
    const host = this.querySelector("[data-filter-tags]");
    if (!host) return;
    if (!this._index) { host.innerHTML = ""; return; }

    const filters = this._filtersSnapshot();
    const selected = filters.tags;
    // Candidate set: top-N by population, plus any currently-selected tag
    // (so a selected chip never disappears when it falls below the cutoff).
    const candidates = pickCandidates(
      this._index, freeTagsOf, selected, TAG_CHIP_LIMIT,
    );
    // Two count maps, both keyed on tag, for symmetric "what happens if I
    // click this chip" semantics:
    //   - addCounts: what the result becomes if an unselected chip is picked.
    //   - removeCounts: what the result becomes if a selected chip is dropped.
    const addCounts = valueCounts(
      this._index, filters, passesFilters, freeTagsOf, candidates,
    );
    const removeCounts = valueCountsOnRemove(
      this._index, filters, "tags", passesFilters, selected,
    );

    // Hide unselected chips whose count is 0 — they can't contribute to the
    // current result set, so showing them is noise. Selected chips always stay
    // visible: the user needs the chip to deselect and recover results.
    host.innerHTML = candidates
      .filter((t) => selected.has(t) || (addCounts.get(t) ?? 0) > 0)
      .map((t) => {
        const isSel = selected.has(t);
        const n = isSel ? (removeCounts.get(t) ?? 0) : (addCounts.get(t) ?? 0);
        const title = isSel
          ? `${n} component${n === 1 ? "" : "s"} if you remove this tag`
          : `${n} component${n === 1 ? "" : "s"} match`;
        return `<ce-chip outlined data-tag="${esc(t)}"${isSel ? " data-selected" : ""} class="filter-tags__chip" title="${esc(title)}" style="cursor:pointer;user-select:none">${esc(t)} <span class="filter-tags__count">${n}</span></ce-chip>`;
      })
      .join("");

    for (const chip of host.querySelectorAll("ce-chip")) {
      chip.addEventListener("click", () => {
        if (!this._form) return;
        const t = chip.dataset.tag;
        const tags = this._form.get("tags");
        if (tags.has(t)) tags.delete(t);
        else tags.add(t);
        // The subscriber will re-render chip counts; we don't toggle the
        // attribute manually because the re-render replaces the DOM anyway.
        this._form.set("tags", tags);
      });
    }

    // Re-apply the local search filter — DOM was just rebuilt.
    this._applyTagSearch();
  }
}

customElements.define("demo-filter-tab", DemoFilterTab);

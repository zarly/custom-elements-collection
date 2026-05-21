/**
 * ReactiveForm — tiny reactive form-state container for the demo's settings.
 *
 * One central instance holds every user-controlled setting (search query,
 * group-by, sort-by, filter axes, view-options). Two transports built in:
 *   - URL hash (declared via `hashParam`)
 *   - localStorage (declared via `localStorage`)
 * Subscribers are notified on every change. Form controls bind two-way via
 * the small `bindCheckbox` / `bindInput` / `bindRadioGroup` helpers.
 *
 * ADR-013 candidate — keep here under the demo until proven; promote to a
 * library export only after sustained use.
 *
 * Hard budget: implementation kept under 200 LOC. If the API grows past
 * that, downsize before adding to the library.
 */

/** Field shape supplied at construction:
 *    { type: 'string'|'enum'|'bool'|'int'|'set', default?: any, values?: string[] }
 * - 'set' carries a Set<string>; if `values` is given, others are dropped.
 * - 'enum' carries a single string from `values`.
 * - 'int' carries a non-negative integer; 0 means "none" by convention.
 */
export class ReactiveForm {
  constructor({ fields, hashParam = {}, localStorage: ls = {} }) {
    this.spec = fields;
    this.hashParam = hashParam;
    this.lsKeys = ls;
    this.values = {};
    this.subscribers = new Set();
    for (const [name, fs] of Object.entries(fields)) {
      this.values[name] = this._default(fs);
    }
    this._loadLocalStorage();
  }

  _default(fs) {
    if (fs.type === "set") return new Set();
    if (fs.type === "bool") return fs.default ?? false;
    if (fs.type === "int") return fs.default ?? 0;
    if (fs.type === "enum") return fs.default ?? fs.values?.[0] ?? "";
    return fs.default ?? "";
  }

  get(name) {
    const v = this.values[name];
    return v instanceof Set ? new Set(v) : v;
  }

  set(name, value) {
    const fs = this.spec[name];
    if (!fs) return false;
    const clean = this._coerce(fs, value);
    if (this._equal(fs, this.values[name], clean)) return false;
    this.values[name] = clean;
    this._save(name);
    this._notify();
    return true;
  }

  _coerce(fs, value) {
    if (fs.type === "set") {
      const src =
        value instanceof Set
          ? [...value]
          : Array.isArray(value)
            ? value
            : [];
      return new Set(src.filter((v) => !fs.values || fs.values.includes(v)));
    }
    if (fs.type === "bool") return Boolean(value);
    if (fs.type === "int") {
      const n = Number(value);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    }
    if (fs.type === "enum") {
      const s = String(value);
      return fs.values?.includes(s) ? s : this._default(fs);
    }
    return String(value);
  }

  _equal(fs, a, b) {
    if (fs.type === "set") {
      if (a.size !== b.size) return false;
      for (const v of a) if (!b.has(v)) return false;
      return true;
    }
    return a === b;
  }

  reset(name) {
    if (name) {
      this.set(name, this._default(this.spec[name]));
      return;
    }
    for (const n of Object.keys(this.spec)) {
      this.values[n] = this._default(this.spec[n]);
      this._save(n);
    }
    this._notify();
  }

  snapshot() {
    const out = {};
    for (const [name, value] of Object.entries(this.values)) {
      out[name] = value instanceof Set ? new Set(value) : value;
    }
    return out;
  }

  subscribe(cb) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  _notify() {
    for (const cb of this.subscribers) cb(this);
  }

  toHash() {
    const params = new URLSearchParams();
    for (const [name, fs] of Object.entries(this.spec)) {
      const key = this.hashParam[name];
      if (!key) continue;
      const value = this.values[name];
      if (this._equal(fs, value, this._default(fs))) continue;
      if (fs.type === "set") params.set(key, [...value].sort().join(","));
      else if (fs.type === "bool") params.set(key, value ? "1" : "0");
      else params.set(key, String(value));
    }
    return params.toString();
  }

  fromHash(qs) {
    const params = new URLSearchParams(qs.replace(/^[?#]/, ""));
    let changed = false;
    for (const [name, fs] of Object.entries(this.spec)) {
      const key = this.hashParam[name];
      if (!key) continue;
      let clean;
      if (!params.has(key)) {
        clean = this._default(fs);
      } else {
        const raw = params.get(key);
        if (fs.type === "set") clean = new Set(raw.split(",").filter(Boolean));
        else if (fs.type === "bool") clean = raw === "1";
        else if (fs.type === "int") clean = parseInt(raw, 10);
        else clean = raw;
        clean = this._coerce(fs, clean);
      }
      if (!this._equal(fs, this.values[name], clean)) {
        this.values[name] = clean;
        this._save(name);
        changed = true;
      }
    }
    if (changed) this._notify();
  }

  _loadLocalStorage() {
    if (typeof localStorage === "undefined") return;
    for (const [name, key] of Object.entries(this.lsKeys)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        this.values[name] = this._coerce(this.spec[name], JSON.parse(raw));
      } catch {
        /* ignore corrupt entries */
      }
    }
  }

  _save(name) {
    const key = this.lsKeys[name];
    if (!key || typeof localStorage === "undefined") return;
    try {
      const v = this.values[name];
      localStorage.setItem(key, JSON.stringify(v instanceof Set ? [...v] : v));
    } catch {
      /* quota / disabled — silently ignore */
    }
  }

  bindCheckbox(name, el) {
    el.checked = Boolean(this.values[name]);
    const onChange = () => this.set(name, el.checked);
    el.addEventListener("change", onChange);
    const unsub = this.subscribe(() => {
      if (el.checked !== Boolean(this.values[name])) {
        el.checked = Boolean(this.values[name]);
      }
    });
    return () => {
      el.removeEventListener("change", onChange);
      unsub();
    };
  }

  bindInput(name, el) {
    const fs = this.spec[name];
    const toEl = () => {
      const v = this.values[name];
      const next = fs.type === "int" ? (v === 0 ? "" : String(v)) : String(v);
      if (el.value !== next) el.value = next;
    };
    toEl();
    const onInput = () => this.set(name, el.value);
    el.addEventListener("input", onInput);
    el.addEventListener("change", onInput);
    const unsub = this.subscribe(toEl);
    return () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("change", onInput);
      unsub();
    };
  }

  bindRadioGroup(name, els) {
    const apply = () => {
      const v = String(this.values[name]);
      for (const el of els) el.checked = el.value === v;
    };
    apply();
    const handler = (ev) => {
      if (ev.target.checked) this.set(name, ev.target.value);
    };
    for (const el of els) el.addEventListener("change", handler);
    const unsub = this.subscribe(apply);
    return () => {
      for (const el of els) el.removeEventListener("change", handler);
      unsub();
    };
  }
}

import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../core/index.js";

export interface ThemeSwitcherOption {
  /** Value passed to the `ce-change` event and reflected in `value`. */
  value: string;
  /** Human-readable label shown in the control and dropdown. */
  label: string;
  /** Optional group heading. Consecutive items sharing the same group key
   *  are rendered under one heading in the dropdown. */
  group?: string;
}

/**
 * `<ce-theme-switcher>` — a compact cycler + dropdown for selecting from a
 * named list of values (originally designed for theme switching, but generic).
 *
 * Layout:  ‹  [ Current Label ▾ ]  ›
 *
 * Interactions:
 *   ‹ / ›          — step backward / forward through the options list
 *   click label    — toggle the dropdown list
 *   click option   — select & close
 *   Escape         — close dropdown
 *   Arrow keys     — cycle when focus is inside the widget
 *
 * Properties:
 *   value   — currently selected option value (reflects to attribute)
 *   options — ThemeSwitcherOption[]; can also be set via JSON attribute
 *
 * Events:
 *   ce-change — CustomEvent<{ value: string }> bubbles, composed
 */
export class CeThemeSwitcher extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--ce-font-sans);
      font-size: var(--ce-text-xs);
    }

    /* ── Switcher row ─────────────────────────────────────── */

    .switcher {
      display: inline-flex;
      align-items: stretch;
      gap: 0;
    }

    /* Shared reset for all interactive controls */
    .arrow,
    .label {
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--ce-transition-fast),
                  color var(--ce-transition-fast);
    }

    /* Arrow buttons */
    .arrow {
      width: 26px;
      height: 28px;
      color: var(--ce-muted);
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      font-size: 15px;
      line-height: 1;
      user-select: none;
    }
    .arrow:first-child {
      border-radius: var(--ce-radius-sm) 0 0 var(--ce-radius-sm);
      border-right: none;
    }
    .arrow:last-child {
      border-radius: 0 var(--ce-radius-sm) var(--ce-radius-sm) 0;
      border-left: none;
    }
    .arrow:hover {
      background: var(--ce-surface-3);
      color: var(--ce-text);
    }
    .arrow:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
      z-index: 1;
    }

    /* Center label button */
    .label {
      padding: 0 10px;
      height: 28px;
      gap: 6px;
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      color: var(--ce-text);
      font-weight: 600;
      white-space: nowrap;
      min-width: 138px;
      justify-content: space-between;
    }
    .label:hover {
      background: var(--ce-surface-3);
      border-color: var(--ce-border-strong);
    }
    .label:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
      z-index: 1;
    }

    .label-text {
      flex: 1;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chevron {
      width: 10px;
      height: 10px;
      color: var(--ce-muted);
      flex-shrink: 0;
      transition: transform var(--ce-transition-fast);
    }
    .chevron.open {
      transform: rotate(180deg);
    }

    /* ── Dropdown ─────────────────────────────────────────── */

    .dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      min-width: 190px;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      box-shadow: var(--ce-shadow);
      z-index: 200;
      overflow: hidden;
    }
    .dropdown.open {
      display: block;
    }

    .group-label {
      padding: 8px 12px 2px;
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: var(--ce-dim);
    }

    .option {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 6px 12px;
      cursor: pointer;
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      transition: background var(--ce-transition-fast);
    }
    .option:hover {
      background: var(--ce-surface-2);
    }
    .option.active {
      color: var(--ce-color-blue);
      background: var(--ce-color-blue-bg);
      font-weight: 600;
    }
    .option:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }

    .check {
      font-size: 11px;
      color: var(--ce-color-blue);
      opacity: 0;
      flex-shrink: 0;
    }
    .option.active .check {
      opacity: 1;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  value = "";

  @property(jsonProp<ThemeSwitcherOption[]>([], "options"))
  options: ThemeSwitcherOption[] = [];

  @state() private _open = false;

  /* ── Lifecycle ──────────────────────────────────────────── */

  override connectedCallback() {
    super.connectedCallback();
    this._onDocClick = this._onDocClick.bind(this);
    document.addEventListener("click", this._onDocClick, { capture: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onDocClick, { capture: true });
  }

  /* ── Internal helpers ───────────────────────────────────── */

  private _onDocClick(ev: MouseEvent) {
    if (!this._open) return;
    if (!ev.composedPath().includes(this)) this._open = false;
  }

  private get _currentIndex(): number {
    const i = this.options.findIndex((o) => o.value === this.value);
    return i >= 0 ? i : 0;
  }

  private get _currentLabel(): string {
    return this.options.find((o) => o.value === this.value)?.label ?? this.value;
  }

  private _cycle(dir: -1 | 1) {
    const len = this.options.length;
    if (!len) return;
    const next = (this._currentIndex + dir + len) % len;
    this._select(this.options[next].value);
  }

  private _select(val: string) {
    this._open = false;
    if (val === this.value) return;
    this.value = val;
    this.dispatchEvent(
      new CustomEvent("ce-change", {
        detail: { value: val },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleKeydown(ev: KeyboardEvent) {
    if (ev.key === "Escape") { this._open = false; ev.preventDefault(); return; }
    if (ev.key === "ArrowLeft")  { this._cycle(-1); ev.preventDefault(); return; }
    if (ev.key === "ArrowRight") { this._cycle(1);  ev.preventDefault(); return; }
  }

  /* ── Render ─────────────────────────────────────────────── */

  private _renderDropdown() {
    const groups = new Map<string, ThemeSwitcherOption[]>();
    for (const opt of this.options) {
      const key = opt.group ?? "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(opt);
    }

    return html`
      <div class=${`dropdown${this._open ? " open" : ""}`} role="listbox">
        ${Array.from(groups.entries()).map(
          ([group, opts]) => html`
            ${group ? html`<div class="group-label">${group}</div>` : nothing}
            ${opts.map(
              (opt) => html`
                <button
                  class=${`option${opt.value === this.value ? " active" : ""}`}
                  role="option"
                  aria-selected=${opt.value === this.value ? "true" : "false"}
                  @click=${() => this._select(opt.value)}
                >
                  <span>${opt.label}</span>
                  <span class="check" aria-hidden="true">✓</span>
                </button>
              `,
            )}
          `,
        )}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="switcher" @keydown=${this._handleKeydown}>
        <button
          class="arrow"
          aria-label="Previous theme"
          @click=${() => this._cycle(-1)}
        >‹</button>
        <button
          class="label"
          aria-haspopup="listbox"
          aria-expanded=${this._open ? "true" : "false"}
          @click=${(ev: Event) => { ev.stopPropagation(); this._open = !this._open; }}
        >
          <span class="label-text">${this._currentLabel}</span>
          <svg
            class=${`chevron${this._open ? " open" : ""}`}
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path d="M2 3.5L5 6.5L8 3.5"/>
          </svg>
        </button>
        <button
          class="arrow"
          aria-label="Next theme"
          @click=${() => this._cycle(1)}
        >›</button>
      </div>
      ${this._renderDropdown()}
    `;
  }
}

/**
 * <demo-settings-button> — square icon button (sliders glyph) with an optional
 * count chip overlay. Emits `demo-settings-open` (bubbles + composed) on click.
 *
 * Attributes:
 *   count  — integer ≥ 1; when present and > 0, shows a ce-chip overlay.
 *
 * Uses <ce-button size="icon" variant="ghost"> for visual consistency with
 * the library. The "icon" size is a symmetric, 1:1 button sized for a 16–24px
 * glyph — added to ce-button specifically because settings-style icon buttons
 * shouldn't have to bypass the library to look right.
 */

const SLIDERS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
  <circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>
</svg>`;

class DemoSettingsButton extends HTMLElement {
  static get observedAttributes() {
    return ["count"];
  }

  connectedCallback() {
    this._render();
    this._btn = this.querySelector("ce-button");
    this._btn?.addEventListener("click", this._onClick);
  }

  disconnectedCallback() {
    this._btn?.removeEventListener("click", this._onClick);
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  get count() {
    return parseInt(this.getAttribute("count") ?? "0", 10) || 0;
  }

  set count(v) {
    const n = Math.max(0, Math.floor(Number(v)) || 0);
    if (n === 0) this.removeAttribute("count");
    else this.setAttribute("count", String(n));
  }

  _onClick = () => {
    this.dispatchEvent(
      new CustomEvent("demo-settings-open", { bubbles: true, composed: true }),
    );
  };

  _render() {
    const n = this.count;
    const aria = `Settings${n > 0 ? ` (${n} active)` : ""}`;
    this.innerHTML = `<ce-button size="icon" variant="ghost" aria-label="${aria}" title="Settings" style="position:relative">
      ${SLIDERS_SVG}${n > 0 ? `<ce-chip type="blue" size="sm" style="position:absolute;top:-4px;right:-4px;min-width:18px;pointer-events:none">${n}</ce-chip>` : ""}
    </ce-button>`;
    const btn = this.querySelector("ce-button");
    if (btn && btn !== this._btn) {
      this._btn?.removeEventListener("click", this._onClick);
      this._btn = btn;
      this._btn.addEventListener("click", this._onClick);
    }
  }
}

customElements.define("demo-settings-button", DemoSettingsButton);

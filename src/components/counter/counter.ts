import { html, css, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-counter>` — animated numeric counter with optional prefix/suffix
 * and a trend tag.
 *
 * Attributes:
 *   value       — target number
 *   from        — start number for the animation (default: previous value or 0)
 *   prefix      — string before the number (e.g. "$")
 *   suffix      — string after the number (e.g. "%")
 *   duration-ms — animation duration in ms (default 700)
 *   decimals    — fixed decimal places (default 0)
 *   trend       — "up" | "down" | "flat"; renders a small caret + delta hint
 */
export class CeCounter extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: baseline;
      gap: var(--ce-space-2);
      font-variant-numeric: tabular-nums;
      color: var(--ce-text);
    }
    .num {
      font-size: var(--ce-text-2xl);
      font-weight: 800;
      line-height: var(--ce-line-tight);
    }
    .prefix, .suffix {
      color: var(--ce-muted);
      font-size: var(--ce-text-md);
    }
    .trend {
      font-size: var(--ce-text-sm);
      font-weight: 600;
    }
    :host([trend="up"])   .trend { color: var(--ce-color-green); }
    :host([trend="down"]) .trend { color: var(--ce-color-red); }
    :host([trend="flat"]) .trend { color: var(--ce-muted); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number }) value = 0;
  @property({ type: Number }) from: number | null = null;
  @property({ type: String }) prefix = "";
  @property({ type: String }) suffix = "";
  @property({ type: Number, attribute: "duration-ms" }) durationMs = 700;
  @property({ type: Number }) decimals = 0;
  @property({ type: String, reflect: true }) trend: "up" | "down" | "flat" | null = null;

  @state() private _displayed = 0;
  #raf: number | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._displayed = this.from ?? this.value;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.#raf != null) cancelAnimationFrame(this.#raf);
    this.#raf = null;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      const from = this._displayed;
      const to = this.value;
      this.#animate(from, to);
    }
  }

  #animate(from: number, to: number): void {
    if (this.#raf != null) cancelAnimationFrame(this.#raf);
    if (this.durationMs <= 0 || from === to) {
      this._displayed = to;
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / this.durationMs);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - t, 3);
      this._displayed = from + (to - from) * eased;
      if (t < 1) {
        this.#raf = requestAnimationFrame(tick);
      } else {
        this.#raf = null;
      }
    };
    this.#raf = requestAnimationFrame(tick);
  }

  #format(n: number): string {
    return this.decimals > 0 ? n.toFixed(this.decimals) : Math.round(n).toString();
  }

  override render() {
    return html`
      ${this.prefix ? html`<span class="prefix">${this.prefix}</span>` : ""}
      <span class="num" aria-live="polite">${this.#format(this._displayed)}</span>
      ${this.suffix ? html`<span class="suffix">${this.suffix}</span>` : ""}
      ${this.trend
        ? html`<span class="trend">${this.trend === "up" ? "▲" : this.trend === "down" ? "▼" : "■"}</span>`
        : ""}
    `;
  }
}

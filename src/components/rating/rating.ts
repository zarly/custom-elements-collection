import { html, css, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeRatingMode = "thumbs" | "stars";
export type CeRatingSize = "sm" | "md" | "lg";
export type CeRatingValue = "up" | "down" | number | null;

const STAR_PATH =
  "M8 1.4l1.95 4.0 4.4.65-3.18 3.1.75 4.38L8 11.5l-3.93 2.05.76-4.38L1.65 6.05l4.4-.65L8 1.4z";

/**
 * `<ce-rating>` — feedback control with two modes:
 *   - thumbs: up/down (or null) toggle.
 *   - stars: 0..max with optional half-star precision.
 *
 * Single CustomEvent for both modes:
 *   ce-rating-change { mode, value, max }
 */
export class CeRating extends CecElement {
  static formAssociated = true;

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      color: var(--ce-text);
      --ce-rating-size: 18px;
    }
    :host([size="sm"]) { --ce-rating-size: 14px; }
    :host([size="md"]) { --ce-rating-size: 18px; }
    :host([size="lg"]) { --ce-rating-size: 24px; }
    :host([readonly]) {
      pointer-events: none;
    }

    button {
      font: inherit;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--ce-radius-sm);
      padding: 2px;
      cursor: pointer;
      color: var(--ce-muted);
      transition: color var(--ce-transition-fast), background var(--ce-transition-fast),
        border-color var(--ce-transition-fast);
      line-height: 0;
    }
    button:hover { background: var(--ce-surface-2); }
    button:focus-visible { outline: none; box-shadow: var(--ce-focus-ring); }

    /* thumbs */
    .ce-rating__thumb { font-size: var(--ce-rating-size); }
    .ce-rating__thumb[data-active="up"]   { color: var(--ce-color-green); }
    .ce-rating__thumb[data-active="down"] { color: var(--ce-color-red); }

    /* stars */
    .ce-rating__star {
      width: var(--ce-rating-size);
      height: var(--ce-rating-size);
      display: inline-block;
    }
    .ce-rating__star path {
      fill: var(--ce-muted);
      transition: fill var(--ce-transition-fast);
    }
    .ce-rating__star[data-fill="full"] path { fill: var(--ce-color-amber); }
    .ce-rating__star[data-fill="half"] path { fill: url("#ce-rating-half-grad"); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  mode: CeRatingMode = "thumbs";

  @property({ type: Number, reflect: true })
  max = 5;

  @property({ type: Boolean, reflect: true, attribute: "allow-half" })
  allowHalf = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: String, reflect: true })
  name = "";

  @property({ type: String, reflect: true })
  size: CeRatingSize = "md";

  /** Internal canonical value. JS API exposes string | number | null. */
  @state() private _value: CeRatingValue = null;

  /** Hover preview (stars only). null = no preview. */
  @state() private _hover: number | null = null;

  #internals: ElementInternals | null = null;

  /** Public JS getter/setter mirroring the typed value. */
  get value(): CeRatingValue {
    return this._value;
  }
  set value(v: CeRatingValue) {
    this._setValue(v, /* emit */ false);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof (this as unknown as { attachInternals?: () => ElementInternals })
      .attachInternals === "function" && !this.#internals) {
      try {
        this.#internals = (
          this as unknown as { attachInternals: () => ElementInternals }
        ).attachInternals();
      } catch {
        this.#internals = null;
      }
    }
    // Initial attribute parse for `value` (Lit doesn't manage this prop directly).
    if (this.hasAttribute("value") && this._value === null) {
      this.#parseAttrValue(this.getAttribute("value"));
    }
    if (!this.hasAttribute("tabindex") && !this.readonly) {
      this.setAttribute("tabindex", "0");
    }
    this.addEventListener("keydown", this.#onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.#onKeydown);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("mode")) {
      this.setAttribute("role", this.mode === "stars" ? "radiogroup" : "group");
      // Reset value when mode changes (different shape).
      if (this.mode === "thumbs" && typeof this._value === "number") {
        this._value = null;
      } else if (this.mode === "stars" && typeof this._value === "string") {
        this._value = 0;
      }
    }
    if (changed.has("readonly")) {
      if (this.readonly) {
        this.setAttribute("aria-disabled", "true");
      } else {
        this.removeAttribute("aria-disabled");
      }
    }
  }

  override render() {
    return this.mode === "stars" ? this.#renderStars() : this.#renderThumbs();
  }

  #renderThumbs() {
    const v = this._value;
    const upActive = v === "up";
    const downActive = v === "down";
    return html`
      <button
        type="button"
        class="ce-rating__thumb"
        data-active=${upActive ? "up" : ""}
        aria-pressed=${upActive ? "true" : "false"}
        aria-label="Mark helpful"
        @click=${() => this.#toggleThumb("up")}
      >
        <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true">
          <path
            fill="currentColor"
            d="M2 7h2v7H2zM5 14V7c0-.55.45-1 1-1l2.5-4c.7 0 1.5.6 1.5 1.5V6h3.4c.9 0 1.5.85 1.3 1.7l-1.4 5.6c-.15.6-.7 1-1.3 1H5z"
          />
        </svg>
      </button>
      <button
        type="button"
        class="ce-rating__thumb"
        data-active=${downActive ? "down" : ""}
        aria-pressed=${downActive ? "true" : "false"}
        aria-label="Mark not helpful"
        @click=${() => this.#toggleThumb("down")}
      >
        <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true">
          <path
            fill="currentColor"
            d="M14 9h-2V2h2zM11 2v7c0 .55-.45 1-1 1l-2.5 4c-.7 0-1.5-.6-1.5-1.5V10H2.6c-.9 0-1.5-.85-1.3-1.7l1.4-5.6c.15-.6.7-1 1.3-1H11z"
          />
        </svg>
      </button>
    `;
  }

  #renderStars() {
    const max = Math.max(1, Math.floor(this.max));
    const numericValue = typeof this._value === "number" ? this._value : 0;
    const display = this._hover != null ? this._hover : numericValue;
    const stars = [];
    for (let i = 1; i <= max; i++) {
      let fill: "empty" | "half" | "full" = "empty";
      if (display >= i) fill = "full";
      else if (display >= i - 0.5) fill = "half";
      const checked = numericValue === i;
      stars.push(html`
        <button
          type="button"
          role="radio"
          aria-checked=${checked ? "true" : "false"}
          aria-label="Rate ${i} of ${max}"
          @click=${(e: MouseEvent) => this.#onStarClick(i, e)}
          @pointermove=${(e: PointerEvent) => this.#onStarHover(i, e)}
          @pointerleave=${() => this.#clearHover()}
          @focus=${() => (this._hover = i)}
          @blur=${() => this.#clearHover()}
        >
          <svg
            class="ce-rating__star"
            data-fill=${fill}
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ce-rating-half-grad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stop-color="var(--ce-color-amber)"></stop>
                <stop offset="50%" stop-color="var(--ce-muted)"></stop>
              </linearGradient>
            </defs>
            <path d=${STAR_PATH}></path>
          </svg>
        </button>
      `);
    }
    return html`${stars}`;
  }

  #toggleThumb(dir: "up" | "down"): void {
    if (this.readonly) return;
    const next = this._value === dir ? null : dir;
    this._setValue(next, true);
  }

  #onStarClick(n: number, e: MouseEvent): void {
    if (this.readonly) return;
    let nextValue: number;
    if (this.allowHalf) {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const half = offsetX < rect.width / 2;
      nextValue = half ? n - 0.5 : n;
    } else {
      nextValue = n;
    }
    // Click-on-current-value clears.
    if (this._value === nextValue) nextValue = 0;
    this._setValue(nextValue, true);
  }

  #onStarHover(n: number, e: PointerEvent): void {
    if (this.readonly || !this.allowHalf) {
      this._hover = n;
      return;
    }
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    this._hover = offsetX < rect.width / 2 ? n - 0.5 : n;
  }

  #clearHover(): void {
    this._hover = null;
  }

  #onThumbsKey(e: KeyboardEvent, k: string): void {
    if (k === "ArrowLeft" || k === "ArrowDown") {
      e.preventDefault();
      this.#cycleThumbs(-1);
    } else if (k === "ArrowRight" || k === "ArrowUp") {
      e.preventDefault();
      this.#cycleThumbs(+1);
    } else if (k === "Escape") {
      e.preventDefault();
      this._setValue(null, true);
    }
  }

  #onStarsKey(e: KeyboardEvent, k: string): void {
    const step = this.allowHalf ? 0.5 : 1;
    const cur = typeof this._value === "number" ? this._value : 0;
    if (k === "ArrowLeft" || k === "ArrowDown") {
      e.preventDefault();
      this._setValue(Math.max(0, cur - step), true);
    } else if (k === "ArrowRight" || k === "ArrowUp") {
      e.preventDefault();
      this._setValue(Math.min(this.max, cur + step), true);
    } else if (k === "Home") {
      e.preventDefault();
      this._setValue(0, true);
    } else if (k === "End") {
      e.preventDefault();
      this._setValue(this.max, true);
    } else if (k === "Escape") {
      e.preventDefault();
      this._setValue(0, true);
    }
  }

  #onKeydown = (e: KeyboardEvent): void => {
    if (this.readonly) return;
    if (this.mode === "thumbs") this.#onThumbsKey(e, e.key);
    else this.#onStarsKey(e, e.key);
  };

  #cycleThumbs(direction: 1 | -1): void {
    // Cycle order: down -> null -> up (next) ; up -> null -> down (prev)
    const order: Array<"down" | null | "up"> = ["down", null, "up"];
    const cur = (this._value as "up" | "down" | null) ?? null;
    const idx = order.indexOf(cur);
    const next = order[Math.max(0, Math.min(order.length - 1, idx + direction))];
    this._setValue(next, true);
  }

  #parseAttrValue(raw: string | null): void {
    if (raw == null || raw === "" || raw === "null") {
      this._value = this.mode === "stars" ? 0 : null;
      this.#syncFormValue();
      return;
    }
    if (this.mode === "thumbs") {
      this._value = raw === "up" || raw === "down" ? raw : null;
    } else {
      const n = Number(raw);
      this._value = Number.isFinite(n) ? n : 0;
    }
    this.#syncFormValue();
  }

  #setValue(v: CeRatingValue, emit: boolean): void {
    if (this._value === v) return;
    this._value = v;
    this.#syncFormValue();
    if (emit) {
      this.dispatchEvent(
        new CustomEvent("ce-rating-change", {
          bubbles: true,
          composed: true,
          detail: { mode: this.mode, value: v, max: this.max },
        })
      );
    }
  }

  /** Public-but-hidden delegate used by the value setter. */
  private _setValue(v: CeRatingValue, emit: boolean): void {
    this.#setValue(v, emit);
  }

  #syncFormValue(): void {
    if (!this.#internals || !this.name) return;
    const v = this._value;
    if (v === null) {
      try {
        this.#internals.setFormValue(null);
      } catch {
        /* noop */
      }
    } else {
      try {
        this.#internals.setFormValue(String(v));
      } catch {
        /* noop */
      }
    }
  }
}

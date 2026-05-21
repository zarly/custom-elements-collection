import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-countdown>` — counting-down timer to a target instant.
 *
 * Renders as days/hours/minutes/seconds segments tailored by the `format`
 * attribute. Emits a `ce-countdown-end` event once when the target instant
 * is reached.
 *
 * Attributes:
 *   target  — ISO 8601 timestamp of the target instant.
 *   format  — "dhms" | "hms" | "ms" | "s"  (default "dhms"; auto-trims leading zero segments)
 *   labels  — boolean; show "d / h / m / s" suffix under each segment
 *   tick-ms — refresh interval in ms (default 1000)
 *
 * Events:
 *   ce-countdown-end — { detail: { target: string } }, fires once when remaining ≤ 0.
 */
export class CeCountdown extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: baseline;
      gap: var(--ce-space-2);
      font-variant-numeric: tabular-nums;
      color: var(--ce-text);
      font-size: var(--ce-text-md);
    }
    .ce-countdown__seg {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      line-height: 1;
    }
    .ce-countdown__seg .value {
      font-weight: 700;
    }
    .ce-countdown__seg .label {
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .ce-countdown__sep {
      color: var(--ce-muted);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) target = "";
  @property({ type: String, reflect: true }) format: "dhms" | "hms" | "ms" | "s" = "dhms";
  @property({ type: Boolean, reflect: true }) labels = false;
  @property({ type: Number, attribute: "tick-ms" }) tickMs = 1000;

  @state() private _now = Date.now();
  #timer: ReturnType<typeof setInterval> | null = null;
  #fired = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this._now = Date.now();
    this.#fired = false;
    this.#start();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stop();
  }

  #start(): void {
    this.#stop();
    if (this.tickMs > 0) {
      this.#timer = setInterval(() => {
        this._now = Date.now();
        this.#maybeFireEnd();
      }, this.tickMs);
    }
  }

  #stop(): void {
    if (this.#timer != null) clearInterval(this.#timer);
    this.#timer = null;
  }

  #remainingMs(): number {
    const t = this.target ? Date.parse(this.target) : NaN;
    if (Number.isNaN(t)) return 0;
    return Math.max(0, t - this._now);
  }

  #maybeFireEnd(): void {
    if (this.#fired) return;
    if (this.#remainingMs() <= 0 && this.target) {
      this.#fired = true;
      this.dispatchEvent(
        new CustomEvent("ce-countdown-end", {
          detail: { target: this.target },
          bubbles: true,
          composed: true,
        })
      );
      this.#stop();
    }
  }

  #parts(): { d: number; h: number; m: number; s: number } {
    let s = Math.floor(this.#remainingMs() / 1000);
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600);  s -= h * 3600;
    const m = Math.floor(s / 60);    s -= m * 60;
    return { d, h, m, s };
  }

  #pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }

  override render() {
    const { d, h, m, s } = this.#parts();
    const segs: Array<{ k: string; v: string }> = [];

    if (this.format === "dhms") {
      if (d > 0) segs.push({ k: "d", v: String(d) });
      segs.push({ k: "h", v: this.#pad(h) });
      segs.push({ k: "m", v: this.#pad(m) });
      segs.push({ k: "s", v: this.#pad(s) });
    } else if (this.format === "hms") {
      segs.push({ k: "h", v: this.#pad(h + d * 24) });
      segs.push({ k: "m", v: this.#pad(m) });
      segs.push({ k: "s", v: this.#pad(s) });
    } else if (this.format === "ms") {
      segs.push({ k: "m", v: this.#pad(m + (h + d * 24) * 60) });
      segs.push({ k: "s", v: this.#pad(s) });
    } else {
      segs.push({ k: "s", v: String(s + (m + (h + d * 24) * 60) * 60) });
    }

    return html`${segs.map(
      (seg, i) => html`${i > 0
        ? html`<span class="ce-countdown__sep" aria-hidden="true">:</span>`
        : ""}<span class="ce-countdown__seg"
          ><span class="value">${seg.v}</span
          >${this.labels
            ? html`<span class="label">${seg.k}</span>`
            : ""}</span
        >`
    )}`;
  }
}

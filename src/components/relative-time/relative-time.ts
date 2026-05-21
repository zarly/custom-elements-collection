import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-relative-time>` — auto-updating "2h ago" / "in 3d" display.
 *
 * Renders a semantic <time datetime="..."> element whose text content is the
 * difference between `datetime` and now, formatted via Intl.RelativeTimeFormat
 * with the largest sensible unit. Self-rescheduling so the display ticks at
 * an appropriate interval (seconds while < 1 min, then minutes, hours, days).
 *
 * Attributes:
 *   datetime  — ISO 8601 timestamp (required for a real reading)
 *   locale    — BCP-47 locale tag for Intl formatting
 *   numeric   — "auto" | "always" — auto allows "yesterday" / "today"; always forces "1 day ago"
 *   tick-ms   — override polling interval (defaults to a unit-aware schedule)
 */
export class CeRelativeTime extends CecElement {
  static override styles = css`
    :host {
      display: inline;
      font-variant-numeric: tabular-nums;
      color: var(--ce-muted);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) datetime = "";
  @property({ type: String }) locale = "";
  @property({ type: String, reflect: true }) numeric: "auto" | "always" = "auto";
  @property({ type: Number, attribute: "tick-ms" }) tickMs = 0;

  @state() private _now = Date.now();
  #timer: ReturnType<typeof setTimeout> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._now = Date.now();
    this.#schedule();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stop();
  }

  override updated(): void {
    this.#schedule();
  }

  #stop(): void {
    if (this.#timer != null) clearTimeout(this.#timer);
    this.#timer = null;
  }

  #schedule(): void {
    this.#stop();
    const ms = this.#nextDelayMs();
    if (ms > 0) {
      this.#timer = setTimeout(() => {
        this._now = Date.now();
      }, ms);
    }
  }

  #nextDelayMs(): number {
    if (this.tickMs > 0) return this.tickMs;
    const t = this.#parse();
    if (Number.isNaN(t)) return 0;
    const absSec = Math.abs((this._now - t) / 1000);
    if (absSec < 60) return 1000;
    if (absSec < 3600) return 30_000;
    if (absSec < 86400) return 60_000 * 5;
    return 60_000 * 60;
  }

  #parse(): number {
    return this.datetime ? Date.parse(this.datetime) : NaN;
  }

  #format(): string {
    const t = this.#parse();
    if (Number.isNaN(t)) return "";
    const diffSec = (this._now - t) / 1000;
    const abs = Math.abs(diffSec);
    const rtf = new Intl.RelativeTimeFormat(this.locale || undefined, {
      numeric: this.numeric,
    });
    const sign = diffSec >= 0 ? -1 : 1;
    if (abs < 60) return rtf.format(sign * Math.round(abs), "second");
    if (abs < 3600) return rtf.format(sign * Math.round(abs / 60), "minute");
    if (abs < 86400) return rtf.format(sign * Math.round(abs / 3600), "hour");
    if (abs < 86400 * 30) return rtf.format(sign * Math.round(abs / 86400), "day");
    if (abs < 86400 * 365) return rtf.format(sign * Math.round(abs / 86400 / 30), "month");
    return rtf.format(sign * Math.round(abs / 86400 / 365), "year");
  }

  override render() {
    const text = this.#format();
    return html`<time datetime=${this.datetime}>${text}</time>`;
  }
}

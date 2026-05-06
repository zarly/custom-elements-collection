import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-clock>` — live clock or relative-time display.
 *
 * Attributes:
 *   tz      — IANA time zone (e.g. "Europe/London"). Default: local.
 *   format  — "absolute" | "relative" | "both". Default "absolute".
 *   since   — ISO timestamp; when set with format=relative shows time since.
 *   tick-ms — refresh interval in milliseconds (default 1000).
 *   locale  — BCP-47 locale tag for Intl formatting.
 */
export class CeClock extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: baseline;
      gap: var(--ce-space-2);
      font-variant-numeric: tabular-nums;
      color: var(--ce-text);
      font-size: var(--ce-text-md);
    }
    .rel { color: var(--ce-muted); font-size: var(--ce-text-sm); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) tz = "";
  @property({ type: String, reflect: true })
  format: "absolute" | "relative" | "both" = "absolute";
  @property({ type: String }) since = "";
  @property({ type: Number, attribute: "tick-ms" }) tickMs = 1000;
  @property({ type: String }) locale = "";

  @state() private _now = Date.now();
  #timer: ReturnType<typeof setInterval> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._now = Date.now();
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
      }, this.tickMs);
    }
  }

  #stop(): void {
    if (this.#timer != null) clearInterval(this.#timer);
    this.#timer = null;
  }

  #abs(): string {
    const opts: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    if (this.tz) opts.timeZone = this.tz;
    return new Intl.DateTimeFormat(this.locale || undefined, opts).format(
      new Date(this._now)
    );
  }

  #rel(): string {
    const since = this.since ? Date.parse(this.since) : NaN;
    if (Number.isNaN(since)) return "";
    const diff = (this._now - since) / 1000; // seconds
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat(this.locale || undefined, { numeric: "auto" });
    const sign = diff >= 0 ? -1 : 1; // negative diff = "in N units"
    if (abs < 60) return rtf.format(sign * Math.round(abs), "second");
    if (abs < 3600) return rtf.format(sign * Math.round(abs / 60), "minute");
    if (abs < 86400) return rtf.format(sign * Math.round(abs / 3600), "hour");
    return rtf.format(sign * Math.round(abs / 86400), "day");
  }

  override render() {
    const showAbs = this.format === "absolute" || this.format === "both";
    const showRel =
      (this.format === "relative" || this.format === "both") && this.since;

    return html`
      ${showAbs ? html`<span class="abs">${this.#abs()}</span>` : ""}
      ${showRel ? html`<span class="rel">${this.#rel()}</span>` : ""}
    `;
  }
}

import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-duration>` — formatted human-readable duration.
 *
 * Renders a static duration (no live ticking, no target). Pure formatter for
 * "this thing took 3725 seconds" → "1h 2m 5s" / "1 hour 2 minutes 5 seconds".
 *
 * Attributes:
 *   seconds   — duration in seconds
 *   ms        — duration in milliseconds (overrides seconds if both set)
 *   format    — "compact" | "long"   (default "compact" → 1h 2m 5s; long → 1 hour 2 minutes 5 seconds)
 *   units     — max number of significant units shown (default 2; e.g. 2 for 1h 5m, 3 for 1h 5m 12s)
 */
export class CeDuration extends CecElement {
  static override styles = css`
    :host {
      display: inline;
      font-variant-numeric: tabular-nums;
      color: var(--ce-text);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number }) seconds = 0;
  @property({ type: Number }) ms = 0;
  @property({ type: String, reflect: true }) format: "compact" | "long" = "compact";
  @property({ type: Number }) units = 2;

  #totalSeconds(): number {
    if (this.ms > 0) return this.ms / 1000;
    return this.seconds;
  }

  #parts(): Array<{ key: "d" | "h" | "m" | "s"; value: number }> {
    let s = Math.max(0, Math.floor(this.#totalSeconds()));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600);  s -= h * 3600;
    const m = Math.floor(s / 60);    s -= m * 60;
    return [
      { key: "d", value: d },
      { key: "h", value: h },
      { key: "m", value: m },
      { key: "s", value: s },
    ];
  }

  #longUnitName(key: string, n: number): string {
    const word = key === "d" ? "day" : key === "h" ? "hour" : key === "m" ? "minute" : "second";
    return n === 1 ? word : `${word}s`;
  }

  #format(): string {
    const total = this.#totalSeconds();
    if (total <= 0) {
      return this.format === "long" ? "0 seconds" : "0s";
    }
    if (this.ms > 0 && this.ms < 1000) {
      return this.format === "long" ? `${this.ms} milliseconds` : `${this.ms}ms`;
    }
    const parts = this.#parts();
    const significant = parts.filter((p) => p.value > 0);
    if (significant.length === 0) {
      return this.format === "long" ? "0 seconds" : "0s";
    }
    const slice = significant.slice(0, Math.max(1, this.units));
    if (this.format === "long") {
      return slice.map((p) => `${p.value} ${this.#longUnitName(p.key, p.value)}`).join(" ");
    }
    return slice.map((p) => `${p.value}${p.key}`).join(" ");
  }

  override render() {
    return html`<span class="ce-duration__value">${this.#format()}</span>`;
  }
}

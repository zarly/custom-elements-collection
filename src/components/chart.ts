import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../core/index.js";

/**
 * `<ce-chart>` — thin wrapper around Chart.js for radar/line/donut/bar
 * variants the corpus uses rarely. Lazy-loads Chart.js from a CDN to keep
 * the core bundle light.
 *
 * Attributes:
 *   type   — Chart.js type ("line" | "bar" | "radar" | "doughnut" | "pie")
 *   src    — CDN URL for Chart.js (default unpkg latest 4.x)
 *
 * Provide:
 *   data   — Chart.js Data object
 *   options— Chart.js options object (optional)
 *
 * If you prefer self-contained: bundle Chart.js manually and call
 *   window.Chart = ...
 * before this element upgrades.
 */
export class CeChart extends CecElement {
  static override styles = css`
    :host { display: block; position: relative; min-height: 220px; }
    canvas { display: block; max-width: 100%; }
    .ce-chart__err {
      padding: var(--ce-space-3);
      color: var(--ce-color-red);
      background: var(--ce-color-red-bg);
      border-radius: var(--ce-radius);
      font-size: var(--ce-text-sm);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) type: "line" | "bar" | "radar" | "doughnut" | "pie" = "line";
  @property({ type: String }) src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
  @property(jsonProp<unknown>({ labels: [], datasets: [] })) data: unknown = { labels: [], datasets: [] };
  @property(jsonProp<unknown>({})) options: unknown = {};

  #chart: any = null;
  #canvas: HTMLCanvasElement | null = null;
  #error = "";

  override async firstUpdated(): Promise<void> {
    await this.#ensureChartJs();
    this.#mount();
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (this.#chart && (changed.has("data") || changed.has("options") || changed.has("type"))) {
      this.#chart.destroy();
      this.#mount();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.#chart) {
      this.#chart.destroy();
      this.#chart = null;
    }
  }

  async #ensureChartJs(): Promise<void> {
    const w = window as unknown as { Chart?: unknown };
    if (w.Chart) return;
    try {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = this.src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load Chart.js from ${this.src}`));
        document.head.appendChild(s);
      });
    } catch (e) {
      this.#error = (e as Error).message;
      this.requestUpdate();
    }
  }

  #mount(): void {
    const w = window as unknown as { Chart?: any };
    if (!w.Chart || !this.#canvas) return;
    this.#chart = new w.Chart(this.#canvas, {
      type: this.type,
      data: this.data,
      options: this.options,
    });
  }

  override render() {
    if (this.#error) {
      return html`<div class="ce-chart__err">Chart load failed: ${this.#error}</div>`;
    }
    return html`<canvas
      ${ref((el: Element | undefined) => {
        this.#canvas = (el as HTMLCanvasElement) ?? null;
      })}
    ></canvas>`;
  }
}

// Minimal ref directive for capturing element instances. Lit ships one in
// lit/directives/ref.js, but we inline a tiny version to avoid extra imports.
import { directive, Directive } from "lit/directive.js";
class RefDirective extends Directive {
  cb: ((el: Element | undefined) => void) | null = null;
  override update(_part: any, [cb]: [(el: Element | undefined) => void]) {
    this.cb = cb;
    return this.render(cb);
  }
  render(cb: (el: Element | undefined) => void) {
    return cb;
  }
}
const ref = directive(RefDirective);

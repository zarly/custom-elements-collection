/* eslint-disable max-lines, max-lines-per-function, max-depth, complexity --
 * ce-plot is the project's general-purpose chart primitive: it spans bar
 * (vertical + horizontal + stacked), line, area, scatter, and combo modes
 * sharing one scale / hover / legend / axis substrate. The variants are not
 * independent — they share #visibleSeries, #computeYDomain, #snapHover, and
 * the gridlines/axis renderer — so splitting them across files would either
 * duplicate the substrate or push private state through helper signatures
 * that the substrate has to import back. Until the chart-variants count
 * grows enough to justify a separate render-pipeline package, the file-
 * level carve-out is the safer path. `complexity` fires on #computeYDomain
 * (cc=23, the stacked-vs-grouped vs raw value branches), #renderBarsVertical
 * (cc=18, group offset + cap rendering + stacked totals), and #snapHover
 * (cc=19, nearest-point geometry across category/linear/time scales and
 * 5 chart variants). See CONCEPT.md for the option matrix.
 */
import { html, css, svg, nothing, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";
import {
  resolveColor,
  paletteColor,
} from "../../internal/charts/color.js";
import { number as formatNumber } from "../../internal/charts/format.js";
import { niceTicks, linearScale } from "../../internal/charts/scale.js";
import { gateMotion } from "../../internal/charts/easing.js";
import {
  CHART_HOVER,
  CHART_LEAVE,
  CHART_SELECT,
  CHART_TOGGLE,
  type PointHoverDetail,
  type PointSelectDetail,
  type ToggleDetail,
} from "../../internal/charts/events.js";

export interface PlotPoint {
  x: number | string | Date;
  y: number;
  label?: string;
}

export interface PlotSeries {
  name: string;
  color?: string;
  points: PlotPoint[];
  hidden?: boolean;
}

type PlotType = "line" | "area" | "bar";
type PlotOrientation = "horizontal" | "vertical";
type PlotGridMode = "both" | "x" | "y" | "none";
type ScaleKind = "category" | "linear" | "time";

/** Number formatter shared by axis ticks. `axis` lets consumers branch on x vs y. */
export type PlotFormat = (v: number, axis: "x" | "y") => string;

// SVG viewBox geometry. Fixed coordinate space — the host's actual on-screen
// size is scaled via the `width` / `height` props (CSS, applied to the host).
const VB_W = 800;
const VB_H = 320;
const PAD_TOP = 16;
const PAD_RIGHT = 16;
const PAD_BOTTOM = 36;
const PAD_LEFT = 48;
const CHART_X = PAD_LEFT;
const CHART_Y = PAD_TOP;
const CHART_W = VB_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = VB_H - PAD_TOP - PAD_BOTTOM;

interface XDomain {
  kind: ScaleKind;
  /** Ordered categories when `kind === "category"`, else empty. */
  categories: string[];
  /** Numeric domain for `kind === "linear" | "time"`. Time uses ms. */
  xMin: number;
  xMax: number;
}

interface YDomain {
  yMin: number;
  yMax: number;
  /** Result of niceTicks() over [yMin, yMax]; used for both grid + label. */
  ticks: number[];
  niceMin: number;
  niceMax: number;
}

interface XTick {
  /** Position in viewBox space. */
  x: number;
  label: string;
}

/**
 * `<ce-plot>` — standard-tier chart covering line / area / bar variants in a
 * single component. Phase 7 of the charts-v2 plan ships the rendering
 * skeleton: scale calculation, axis ticks, gridlines, multi-series geometry,
 * and a static legend strip. Phase 8 adds hover crosshair + tooltip + legend
 * click-to-toggle + animated transitions; phase 9 ships tests + demo.
 *
 * Pure SVG, no runtime dependencies. Color routing through the shared
 * `resolveColor()` / `paletteColor()` helpers — series can declare named
 * tokens, arbitrary CSS colors, or omit the field for default palette cycling.
 */
export class CePlot extends CecElement {
  static override styles = css`
    :host {
      display: block;
      width: var(--ce-plot-width, 100%);
      height: var(--ce-plot-height, 320px);
      --ce-plot-line-w: 2;
      --ce-plot-bar-radius: 2;
      --ce-plot-grid: color-mix(in srgb, var(--ce-text) 10%, transparent);
      --ce-plot-axis: color-mix(in srgb, var(--ce-text) 30%, transparent);
      --ce-plot-tick-fg: var(--ce-muted);
      --ce-plot-area-opacity: 0.18;
      --ce-plot-fade: var(--ce-transition, 200ms cubic-bezier(0.16, 1, 0.3, 1));
      --ce-plot-tooltip-bg: var(--ce-surface);
      --ce-plot-tooltip-fg: var(--ce-text);
      --ce-plot-tooltip-border: var(--ce-border);
    }

    .ce-plot-svg {
      display: block;
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
      font-family: inherit;
    }

    .ce-plot-grid-x,
    .ce-plot-grid-y {
      stroke: var(--ce-plot-grid);
      stroke-width: 1;
      shape-rendering: crispEdges;
    }
    .ce-plot-axis {
      stroke: var(--ce-plot-axis);
      stroke-width: 1;
      shape-rendering: crispEdges;
    }
    .ce-plot-tick-x,
    .ce-plot-tick-y,
    .ce-plot-axis-label {
      fill: var(--ce-plot-tick-fg);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
    }
    .ce-plot-tick-x {
      text-anchor: middle;
      dominant-baseline: hanging;
    }
    .ce-plot-tick-y {
      text-anchor: end;
      dominant-baseline: middle;
    }
    .ce-plot-axis-label {
      font-size: var(--ce-text-sm);
      fill: var(--ce-text);
    }

    .ce-plot-line {
      fill: none;
      stroke-width: var(--ce-plot-line-w);
      stroke-linejoin: round;
      stroke-linecap: round;
    }
    .ce-plot-area {
      stroke: none;
      opacity: var(--ce-plot-area-opacity);
    }
    .ce-plot-bar {
      stroke: none;
    }

    .ce-plot-legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ce-space-3);
      margin-bottom: var(--ce-space-2);
      padding: 0;
      list-style: none;
      flex: 0 0 auto;
    }
    .ce-plot-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1, 4px);
      padding: 2px var(--ce-space-2);
      border-radius: 999px;
      background: var(--ce-surface-2);
      color: var(--ce-text);
      font-size: var(--ce-text-xs);
      border: 1px solid var(--ce-border, transparent);
      cursor: pointer;
      font-family: inherit;
      transition:
        opacity var(--ce-plot-fade),
        background var(--ce-plot-fade);
    }
    .ce-plot-chip[aria-pressed="false"] {
      opacity: 0.4;
    }
    .ce-plot-chip:hover,
    .ce-plot-chip:focus-visible {
      background: color-mix(in srgb, var(--ce-text) 8%, var(--ce-surface-2));
      outline: none;
    }
    .ce-plot-chip:focus-visible {
      box-shadow: 0 0 0 2px var(--ce-color-blue);
    }
    .ce-plot-swatch {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      flex: 0 0 auto;
    }

    .ce-plot-empty {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }

    /* ------- phase 8: hover layer ------- */
    .ce-plot-host {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }
    .ce-plot-crosshair {
      stroke: var(--ce-plot-axis);
      stroke-width: 1;
      stroke-dasharray: 3 3;
      pointer-events: none;
    }
    .ce-plot-marker {
      stroke: var(--ce-surface);
      stroke-width: 2;
      pointer-events: auto;
      cursor: pointer;
      transition: r var(--ce-plot-fade);
    }
    .ce-plot-hot {
      fill: transparent;
      cursor: crosshair;
    }
    .ce-plot-tooltip {
      position: absolute;
      pointer-events: none;
      background: var(--ce-plot-tooltip-bg);
      color: var(--ce-plot-tooltip-fg);
      border: 1px solid var(--ce-plot-tooltip-border);
      border-radius: var(--ce-radius, 6px);
      padding: 8px 10px;
      font-size: var(--ce-text-xs);
      line-height: 1.35;
      min-width: 140px;
      box-shadow: var(--ce-shadow, 0 4px 12px rgba(0, 0, 0, 0.18));
      z-index: 2;
      transform: translate(-50%, calc(-100% - 12px));
      white-space: nowrap;
      opacity: 0;
      transition:
        opacity var(--ce-plot-fade),
        transform var(--ce-plot-fade);
    }
    .ce-plot-tooltip[data-visible="true"] {
      opacity: 1;
    }
    .ce-plot-tooltip-title {
      font-weight: 600;
      color: var(--ce-text);
      margin-bottom: 4px;
    }
    .ce-plot-tooltip-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-variant-numeric: tabular-nums;
    }
    .ce-plot-tooltip-swatch {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      flex: 0 0 auto;
    }
    .ce-plot-tooltip-name {
      color: var(--ce-muted);
    }
    .ce-plot-tooltip-value {
      margin-left: auto;
      color: var(--ce-text);
      font-weight: 600;
    }

    /* ------- phase 8: data-layer animation ------- */
    :host([animated]) .ce-plot-data {
      animation: ce-plot-fade-in var(--ce-plot-fade) both;
    }
    @keyframes ce-plot-fade-in {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host([animated]) .ce-plot-data {
        animation: none;
      }
      .ce-plot-tooltip,
      .ce-plot-marker,
      .ce-plot-chip {
        transition: none;
      }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) type: PlotType = "line";
  @property(jsonProp<PlotSeries[]>([])) data: PlotSeries[] = [];
  @property({ type: String, attribute: "x-label" }) xLabel = "";
  @property({ type: String, attribute: "y-label" }) yLabel = "";
  @property({ type: Boolean, reflect: true }) legend = true;
  @property({ type: String, reflect: true }) gridlines: PlotGridMode = "y";
  @property({ type: Boolean }) tooltip = true;
  @property({ type: String, reflect: true })
  orientation: PlotOrientation = "vertical";
  @property({ type: Boolean, reflect: true }) stacked = false;
  @property({ type: Boolean, reflect: true, attribute: "animated" })
  animated = true;
  @property({ type: String }) width = "100%";
  @property({ type: String }) height = "320px";
  @property({ attribute: false }) format: PlotFormat = (v, _axis) =>
    formatNumber(v);
  @property({ type: String, attribute: "empty-text" }) emptyText = "No data";

  // ---------- phase 8: interactive state ----------------------------------
  /** Snapped hover position in viewBox space; null when no pointer over chart. */
  @state() private _hoverViewX: number | null = null;
  /** Local toggle state from legend clicks; merged with `series.hidden`. */
  @state() private _localHidden: Set<string> = new Set();
  /** Tooltip CSS-pixel position relative to host. Updated on pointermove. */
  @state() private _tooltipPx: { left: number; top: number } | null = null;

  override updated(): void {
    this.style.setProperty("--ce-plot-width", this.width);
    this.style.setProperty("--ce-plot-height", this.height);
    // Reduced-motion gate: when the user prefers no motion, force the
    // transition off regardless of the `animated` prop.
    const fade = gateMotion(
      "var(--ce-transition, 200ms cubic-bezier(0.16, 1, 0.3, 1))",
      "0s"
    );
    this.style.setProperty("--ce-plot-fade", fade);
  }

  // ---------- domain + scale helpers --------------------------------------

  get #visibleSeries(): PlotSeries[] {
    const data = Array.isArray(this.data) ? this.data : [];
    return data.filter(
      (s) => !s.hidden && !this._localHidden.has(s.name)
    );
  }

  #isHidden(s: PlotSeries): boolean {
    return Boolean(s.hidden) || this._localHidden.has(s.name);
  }

  #detectXKind(): ScaleKind {
    for (const s of this.#visibleSeries) {
      const x = s.points[0]?.x;
      if (x === undefined) continue;
      if (x instanceof Date) return "time";
      if (typeof x === "number") return "linear";
      return "category";
    }
    return "linear";
  }

  #computeXDomain(kind: ScaleKind): XDomain {
    if (kind === "category") {
      const seen = new Set<string>();
      const categories: string[] = [];
      for (const s of this.#visibleSeries) {
        for (const p of s.points) {
          const key = String(p.x);
          if (!seen.has(key)) {
            seen.add(key);
            categories.push(key);
          }
        }
      }
      return {
        kind,
        categories,
        xMin: 0,
        xMax: Math.max(0, categories.length - 1),
      };
    }
    let xMin = Infinity;
    let xMax = -Infinity;
    for (const s of this.#visibleSeries) {
      for (const p of s.points) {
        const v =
          kind === "time" ? (p.x as Date).getTime() : (p.x as number);
        if (Number.isFinite(v)) {
          if (v < xMin) xMin = v;
          if (v > xMax) xMax = v;
        }
      }
    }
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) {
      return { kind, categories: [], xMin: 0, xMax: 1 };
    }
    if (xMin === xMax) xMax = xMin + 1;
    return { kind, categories: [], xMin, xMax };
  }

  #computeYDomain(kind: ScaleKind, _xDomain: XDomain): YDomain {
    // Bars and areas anchor visually at zero. Line charts let the domain
    // reflect actual data only.
    let yMin =
      this.type === "bar" || this.type === "area" ? 0 : Infinity;
    let yMax =
      this.type === "bar" || this.type === "area" ? 0 : -Infinity;
    if (this.type === "bar" && this.stacked && kind === "category") {
      // Stacked bars: yMax is the per-category sum.
      const totals = new Map<string, number>();
      for (const s of this.#visibleSeries) {
        for (const p of s.points) {
          const key = String(p.x);
          totals.set(key, (totals.get(key) ?? 0) + p.y);
        }
      }
      for (const total of totals.values()) {
        if (total > yMax) yMax = total;
        if (total < yMin) yMin = total;
      }
    } else {
      for (const s of this.#visibleSeries) {
        for (const p of s.points) {
          if (Number.isFinite(p.y)) {
            if (p.y < yMin) yMin = p.y;
            if (p.y > yMax) yMax = p.y;
          }
        }
      }
    }
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
      yMin = 0;
      yMax = 1;
    }
    if (yMin === yMax) {
      if (yMin === 0) yMax = 1;
      else yMin = Math.min(0, yMin);
    }
    const t = niceTicks(yMin, yMax, 5);
    return {
      yMin,
      yMax,
      ticks: t.ticks,
      niceMin: t.niceMin,
      niceMax: t.niceMax,
    };
  }

  /** Project a numeric x value to viewBox space. Categories pre-resolved to index. */
  #xPos(rawX: number, xd: XDomain): number {
    if (xd.kind === "category") {
      const n = xd.categories.length;
      if (n === 0) return CHART_X;
      if (n === 1) return CHART_X + CHART_W / 2;
      return CHART_X + (rawX / (n - 1)) * CHART_W;
    }
    return linearScale(
      rawX,
      [xd.xMin, xd.xMax],
      [CHART_X, CHART_X + CHART_W]
    );
  }

  /** Project a y value to viewBox space (inverted: bigger y → higher up). */
  #yPos(y: number, yd: YDomain): number {
    return linearScale(
      y,
      [yd.niceMin, yd.niceMax],
      [CHART_Y + CHART_H, CHART_Y]
    );
  }

  /** Resolve a point's x to a numeric value useful for #xPos. */
  #pointX(p: PlotPoint, xd: XDomain): number {
    if (xd.kind === "category") {
      const idx = xd.categories.indexOf(String(p.x));
      return idx;
    }
    return xd.kind === "time"
      ? (p.x as Date).getTime()
      : (p.x as number);
  }

  // ---------- axis tick computation ---------------------------------------

  #xTicks(xd: XDomain): XTick[] {
    if (xd.kind === "category") {
      const n = xd.categories.length;
      if (n === 0) return [];
      if (n === 1) {
        return [
          {
            x: CHART_X + CHART_W / 2,
            label: xd.categories[0],
          },
        ];
      }
      return xd.categories.map((c, i) => ({
        x: CHART_X + (i / (n - 1)) * CHART_W,
        label: c,
      }));
    }
    const t = niceTicks(xd.xMin, xd.xMax, 5);
    return t.ticks.map((v) => {
      const label =
        xd.kind === "time"
          ? new Date(v).toISOString().slice(0, 10)
          : this.format(v, "x");
      return {
        x: linearScale(v, [xd.xMin, xd.xMax], [CHART_X, CHART_X + CHART_W]),
        label,
      };
    });
  }

  // ---------- color resolution per series ---------------------------------

  #seriesColor(series: PlotSeries, idx: number): string {
    return series.color ? resolveColor(series.color) : paletteColor(idx);
  }

  // ---------- per-type rendering ------------------------------------------

  #renderLine(
    series: PlotSeries,
    color: string,
    xd: XDomain,
    yd: YDomain
  ): TemplateResult {
    const pts = series.points
      .map((p) => {
        const rx = this.#pointX(p, xd);
        const x = this.#xPos(rx, xd);
        const y = this.#yPos(p.y, yd);
        return `${x},${y}`;
      })
      .join(" ");
    return svg`<polyline class="ce-plot-line" points=${pts} stroke=${color} />`;
  }

  #renderArea(
    series: PlotSeries,
    color: string,
    xd: XDomain,
    yd: YDomain
  ): TemplateResult {
    const baseY = this.#yPos(Math.max(0, yd.niceMin), yd);
    const stroke = this.#renderLine(series, color, xd, yd);
    if (series.points.length === 0) return stroke;
    const first = series.points[0];
    const last = series.points[series.points.length - 1];
    const firstX = this.#xPos(this.#pointX(first, xd), xd);
    const lastX = this.#xPos(this.#pointX(last, xd), xd);
    const top = series.points
      .map((p) => {
        const rx = this.#pointX(p, xd);
        const x = this.#xPos(rx, xd);
        const y = this.#yPos(p.y, yd);
        return `${x},${y}`;
      })
      .join(" L ");
    const d = `M ${firstX},${baseY} L ${top} L ${lastX},${baseY} Z`;
    return svg`
      <path class="ce-plot-area" d=${d} fill=${color} />
      ${stroke}
    `;
  }

  /** Vertical bars, category x. Grouped (default) or stacked. */
  #renderBarsVertical(
    visible: PlotSeries[],
    xd: XDomain,
    yd: YDomain
  ): TemplateResult {
    if (xd.kind !== "category") {
      // Bars on a numeric / time scale aren't shipped in the skeleton — show
      // an in-svg notice so the consumer notices in the demo.
      return svg`
        <text
          class="ce-plot-tick-x"
          x=${CHART_X + CHART_W / 2}
          y=${CHART_Y + CHART_H / 2}
        >Bar charts require category x — got ${xd.kind}</text>
      `;
    }
    const numCategories = xd.categories.length || 1;
    const bandWidth = CHART_W / numCategories;
    const baseY = this.#yPos(0, yd);
    if (this.stacked) {
      const groupWidth = bandWidth * 0.7;
      const tops = new Map<string, number>(); // category -> running cumulative y px
      const rects: TemplateResult[] = [];
      for (let s = 0; s < visible.length; s++) {
        const series = visible[s];
        const color = this.#seriesColor(series, s);
        for (const p of series.points) {
          const key = String(p.x);
          const idx = xd.categories.indexOf(key);
          if (idx < 0) continue;
          const cx = CHART_X + (idx + 0.5) * bandWidth;
          const x = cx - groupWidth / 2;
          const startBaseline = tops.get(key) ?? baseY;
          // Stack only positive-up; negatives also stack but downwards.
          const top = this.#yPos(p.y, yd);
          const segHeight =
            p.y >= 0 ? startBaseline - top : top - startBaseline;
          const segY = p.y >= 0 ? top : startBaseline;
          if (segHeight > 0) {
            rects.push(svg`
              <rect
                class="ce-plot-bar"
                x=${x}
                y=${segY}
                width=${groupWidth}
                height=${segHeight}
                rx="2"
                fill=${color}
                data-series=${series.name}
                data-x=${key}
              />
            `);
          }
          tops.set(key, p.y >= 0 ? top : segY + segHeight);
        }
      }
      return svg`${rects}`;
    }
    // Grouped bars
    const numSeries = Math.max(1, visible.length);
    const groupWidth = bandWidth * 0.8;
    const barWidth = groupWidth / numSeries;
    const rects: TemplateResult[] = [];
    for (let s = 0; s < visible.length; s++) {
      const series = visible[s];
      const color = this.#seriesColor(series, s);
      for (const p of series.points) {
        const idx = xd.categories.indexOf(String(p.x));
        if (idx < 0) continue;
        const cx = CHART_X + (idx + 0.5) * bandWidth;
        const groupStart = cx - groupWidth / 2;
        const x = groupStart + s * barWidth;
        const top = this.#yPos(p.y, yd);
        const h = p.y >= 0 ? baseY - top : top - baseY;
        const y = p.y >= 0 ? top : baseY;
        if (h <= 0) continue;
        rects.push(svg`
          <rect
            class="ce-plot-bar"
            x=${x}
            y=${y}
            width=${barWidth * 0.9}
            height=${h}
            rx="2"
            fill=${color}
            data-series=${series.name}
            data-x=${String(p.x)}
          />
        `);
      }
    }
    return svg`${rects}`;
  }

  /** Horizontal bars, category y axis, value x axis. Grouped only in skeleton. */
  #renderBarsHorizontal(
    visible: PlotSeries[],
    xd: XDomain,
    yd: YDomain
  ): TemplateResult {
    if (xd.kind !== "category") {
      return svg`
        <text
          class="ce-plot-tick-x"
          x=${CHART_X + CHART_W / 2}
          y=${CHART_Y + CHART_H / 2}
        >Horizontal bars require category data — got ${xd.kind}</text>
      `;
    }
    const numCategories = xd.categories.length || 1;
    const bandHeight = CHART_H / numCategories;
    // For horizontal bars the value axis is x. We map p.y onto the x axis by
    // running the value through linearScale into the chart-x range.
    const valueToX = (v: number): number =>
      linearScale(v, [yd.niceMin, yd.niceMax], [CHART_X, CHART_X + CHART_W]);
    const baseX = valueToX(0);
    const numSeries = Math.max(1, visible.length);
    const groupHeight = bandHeight * 0.8;
    const barHeight = groupHeight / numSeries;
    const rects: TemplateResult[] = [];
    for (let s = 0; s < visible.length; s++) {
      const series = visible[s];
      const color = this.#seriesColor(series, s);
      for (const p of series.points) {
        const idx = xd.categories.indexOf(String(p.x));
        if (idx < 0) continue;
        const cy = CHART_Y + (idx + 0.5) * bandHeight;
        const groupStart = cy - groupHeight / 2;
        const y = groupStart + s * barHeight;
        const right = valueToX(p.y);
        const w = p.y >= 0 ? right - baseX : baseX - right;
        const x = p.y >= 0 ? baseX : right;
        if (w <= 0) continue;
        rects.push(svg`
          <rect
            class="ce-plot-bar"
            x=${x}
            y=${y}
            width=${w}
            height=${barHeight * 0.9}
            rx="2"
            fill=${color}
            data-series=${series.name}
            data-x=${String(p.x)}
          />
        `);
      }
    }
    return svg`${rects}`;
  }

  // ---------- axes + gridlines --------------------------------------------

  #renderAxes(xd: XDomain, yd: YDomain, xTicks: XTick[]): TemplateResult {
    const showXGrid =
      this.gridlines === "both" || this.gridlines === "x";
    const showYGrid =
      this.gridlines === "both" || this.gridlines === "y";
    const horizontalBars =
      this.type === "bar" && this.orientation === "horizontal";
    return svg`
      <g class="ce-plot-grid" aria-hidden="true">
        ${
          showYGrid && !horizontalBars
            ? yd.ticks.map((y) => {
                const py = this.#yPos(y, yd);
                return svg`<line class="ce-plot-grid-y"
                  x1=${CHART_X} y1=${py}
                  x2=${CHART_X + CHART_W} y2=${py} />`;
              })
            : nothing
        }
        ${
          showXGrid
            ? xTicks.map(
                (t) =>
                  svg`<line class="ce-plot-grid-x"
                    x1=${t.x} y1=${CHART_Y}
                    x2=${t.x} y2=${CHART_Y + CHART_H} />`
              )
            : nothing
        }
      </g>
      <g class="ce-plot-axes" aria-hidden="true">
        <line class="ce-plot-axis"
          x1=${CHART_X} y1=${CHART_Y}
          x2=${CHART_X} y2=${CHART_Y + CHART_H} />
        <line class="ce-plot-axis"
          x1=${CHART_X} y1=${CHART_Y + CHART_H}
          x2=${CHART_X + CHART_W} y2=${CHART_Y + CHART_H} />
        ${
          horizontalBars
            ? // Numeric x ticks at bottom + category labels at left.
              this.#renderHorizontalBarAxes(xd, yd)
            : svg`
                ${yd.ticks.map((y) => {
                  const py = this.#yPos(y, yd);
                  return svg`<text class="ce-plot-tick-y"
                    x=${CHART_X - 6} y=${py}>${this.format(y, "y")}</text>`;
                })}
                ${xTicks.map(
                  (t) => svg`<text class="ce-plot-tick-x"
                    x=${t.x} y=${CHART_Y + CHART_H + 8}>${t.label}</text>`
                )}
              `
        }
        ${
          this.xLabel
            ? svg`<text
                class="ce-plot-axis-label"
                x=${CHART_X + CHART_W / 2}
                y=${VB_H - 4}
                text-anchor="middle"
              >${this.xLabel}</text>`
            : nothing
        }
        ${
          this.yLabel
            ? svg`<text
                class="ce-plot-axis-label"
                transform=${`rotate(-90 12 ${CHART_Y + CHART_H / 2})`}
                x=${12}
                y=${CHART_Y + CHART_H / 2}
                text-anchor="middle"
              >${this.yLabel}</text>`
            : nothing
        }
      </g>
    `;
  }

  #renderHorizontalBarAxes(
    xd: XDomain,
    yd: YDomain
  ): TemplateResult {
    const xValueTicks = niceTicks(yd.niceMin, yd.niceMax, 5).ticks;
    return svg`
      ${xValueTicks.map((v) => {
        const px = linearScale(v, [yd.niceMin, yd.niceMax], [CHART_X, CHART_X + CHART_W]);
        return svg`<text class="ce-plot-tick-x"
          x=${px} y=${CHART_Y + CHART_H + 8}>${this.format(v, "x")}</text>`;
      })}
      ${xd.categories.map((c, i) => {
        const py =
          xd.categories.length === 0
            ? CHART_Y + CHART_H / 2
            : CHART_Y + ((i + 0.5) * CHART_H) / xd.categories.length;
        return svg`<text class="ce-plot-tick-y"
          x=${CHART_X - 6} y=${py}>${c}</text>`;
      })}
    `;
  }

  // ---------- phase 8: hover, select, toggle ------------------------------

  #emit<T>(name: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent<T>(name, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  /** Convert a host-relative client x/y into viewBox coordinates. */
  #toViewBox(svgEl: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = svgEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * VB_W,
      y: ((clientY - rect.top) / rect.height) * VB_H,
    };
  }

  /** Find the snapped x that the crosshair should track, given a viewBox x. */
  #snapHover(
    viewX: number,
    visible: PlotSeries[],
    xd: XDomain,
    yd: YDomain
  ): {
    viewX: number;
    rawX: number | string | Date;
    label: string;
    points: Array<{ series: PlotSeries; point: PlotPoint; viewX: number; viewY: number }>;
  } | null {
    const clamped = Math.max(CHART_X, Math.min(CHART_X + CHART_W, viewX));
    if (xd.kind === "category") {
      if (xd.categories.length === 0) return null;
      const n = xd.categories.length;
      // Map clamped → category index via nearest band.
      let idx: number;
      if (n === 1) {
        idx = 0;
      } else {
        idx = Math.round(((clamped - CHART_X) / CHART_W) * (n - 1));
        idx = Math.max(0, Math.min(n - 1, idx));
      }
      const category = xd.categories[idx];
      const snappedView =
        n === 1
          ? CHART_X + CHART_W / 2
          : CHART_X + (idx / (n - 1)) * CHART_W;
      const points: Array<{
        series: PlotSeries;
        point: PlotPoint;
        viewX: number;
        viewY: number;
      }> = [];
      for (const s of visible) {
        const p = s.points.find((pt) => String(pt.x) === category);
        if (!p) continue;
        points.push({
          series: s,
          point: p,
          viewX: snappedView,
          viewY: this.#yPos(p.y, yd),
        });
      }
      return {
        viewX: snappedView,
        rawX: category,
        label: category,
        points,
      };
    }
    // Linear / time: find the closest point across visible series.
    let best: {
      dist: number;
      raw: number;
      label: string;
      viewX: number;
    } | null = null;
    for (const s of visible) {
      for (const p of s.points) {
        const raw = this.#pointX(p, xd);
        const px = this.#xPos(raw, xd);
        const d = Math.abs(px - clamped);
        if (best === null || d < best.dist) {
          best = {
            dist: d,
            raw,
            label:
              xd.kind === "time"
                ? new Date(raw).toISOString().slice(0, 10)
                : this.format(raw, "x"),
            viewX: px,
          };
        }
      }
    }
    if (!best) return null;
    const points: Array<{
      series: PlotSeries;
      point: PlotPoint;
      viewX: number;
      viewY: number;
    }> = [];
    for (const s of visible) {
      // Pick the series point with the same raw x if any; else the closest.
      let pickedPoint: PlotPoint | null = null;
      let pickedDist = Infinity;
      for (const p of s.points) {
        const raw = this.#pointX(p, xd);
        if (raw === best.raw) {
          pickedPoint = p;
          break;
        }
        const d = Math.abs(raw - best.raw);
        if (d < pickedDist) {
          pickedDist = d;
          pickedPoint = p;
        }
      }
      if (!pickedPoint) continue;
      points.push({
        series: s,
        point: pickedPoint,
        viewX: best.viewX,
        viewY: this.#yPos(pickedPoint.y, yd),
      });
    }
    const rawXValue: number | Date =
      xd.kind === "time" ? new Date(best.raw) : best.raw;
    return {
      viewX: best.viewX,
      rawX: rawXValue,
      label: best.label,
      points,
    };
  }

  #onSvgPointerMove = (e: PointerEvent): void => {
    if (!this.tooltip) return;
    const svgEl = e.currentTarget as SVGSVGElement;
    const vb = this.#toViewBox(svgEl, e.clientX, e.clientY);
    if (!vb) return;
    if (
      vb.x < CHART_X ||
      vb.x > CHART_X + CHART_W ||
      vb.y < CHART_Y - 4 ||
      vb.y > CHART_Y + CHART_H + 4
    ) {
      this.#clearHover();
      return;
    }
    this._hoverViewX = vb.x;
    const hostRect = this.getBoundingClientRect();
    this._tooltipPx = {
      left: e.clientX - hostRect.left,
      top: e.clientY - hostRect.top,
    };
    // Dispatch a hover event whose detail captures the snapped points.
    const visible = this.#visibleSeries;
    if (visible.length === 0) return;
    const kind = this.#detectXKind();
    const xd = this.#computeXDomain(kind);
    const yd = this.#computeYDomain(kind, xd);
    const snap = this.#snapHover(vb.x, visible, xd, yd);
    if (!snap) return;
    this.#emit<PointHoverDetail<PlotPoint, PlotSeries>>(CHART_HOVER, {
      kind: "point",
      x: snap.rawX,
      points: snap.points.map(({ series, point }) => ({ series, point })),
    });
  };

  #onSvgPointerLeave = (): void => {
    this.#clearHover();
  };

  #clearHover(): void {
    if (this._hoverViewX !== null || this._tooltipPx !== null) {
      this._hoverViewX = null;
      this._tooltipPx = null;
      this.#emit(CHART_LEAVE, {});
    }
  }

  #onPointSelect = (
    series: PlotSeries,
    point: PlotPoint,
    e: Event
  ): void => {
    e.stopPropagation();
    this.#emit<PointSelectDetail<PlotPoint, PlotSeries>>(CHART_SELECT, {
      series,
      point,
      type: this.type,
      originalEvent: e,
    });
  };

  #onLegendClick = (name: string) => (): void => {
    const next = new Set(this._localHidden);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this._localHidden = next;
    this.#emit<ToggleDetail>(CHART_TOGGLE, {
      name,
      hidden: next.has(name),
    });
  };

  // ---------- aria summary -----------------------------------------------

  #ariaLabel(visible: PlotSeries[], yd: YDomain): string {
    if (visible.length === 0) return "Empty plot";
    const seriesNames = visible.map((s) => s.name).join(", ");
    const yRange = `${this.format(yd.yMin, "y")} to ${this.format(
      yd.yMax,
      "y"
    )}`;
    return `${this.type} chart of ${visible.length} series (${seriesNames}); y range ${yRange}`;
  }

  // ---------- render entry point ------------------------------------------

  override render() {
    const visible = this.#visibleSeries;
    const totalPoints = visible.reduce(
      (n, s) => n + s.points.length,
      0
    );
    if (visible.length === 0 || totalPoints === 0) {
      return html`
        <div class="ce-plot-host">
          ${this.#renderLegend()}
          <div class="ce-plot-empty">${this.emptyText}</div>
        </div>
      `;
    }

    const kind = this.#detectXKind();
    const xd = this.#computeXDomain(kind);
    const yd = this.#computeYDomain(kind, xd);
    const xTicks = this.#xTicks(xd);

    let body: TemplateResult;
    if (this.type === "bar") {
      body =
        this.orientation === "horizontal"
          ? this.#renderBarsHorizontal(visible, xd, yd)
          : this.#renderBarsVertical(visible, xd, yd);
    } else {
      const seriesNodes = visible.map((s, i) => {
        const color = this.#seriesColor(s, i);
        const node =
          this.type === "area"
            ? this.#renderArea(s, color, xd, yd)
            : this.#renderLine(s, color, xd, yd);
        return svg`
          <g class="ce-plot-series" data-name=${s.name}>${node}</g>
        `;
      });
      body = svg`${seriesNodes}`;
    }

    const hoverSnap =
      this.tooltip && this._hoverViewX !== null
        ? this.#snapHover(this._hoverViewX, visible, xd, yd)
        : null;

    return html`
      <div class="ce-plot-host">
        ${this.#renderLegend()}
        <svg
          class="ce-plot-svg"
          viewBox=${`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label=${this.#ariaLabel(visible, yd)}
          @pointermove=${this.#onSvgPointerMove}
          @pointerleave=${this.#onSvgPointerLeave}
        >
          ${this.#renderAxes(xd, yd, xTicks)}
          <g class="ce-plot-data">${body}</g>
          ${this.#renderHoverLayer(hoverSnap, visible, yd)}
        </svg>
        ${this.#renderTooltipCard(hoverSnap)}
      </div>
    `;
  }

  /** Crosshair + per-series markers, only for line / area charts. */
  #renderHoverLayer(
    snap:
      | {
          viewX: number;
          rawX: number | string | Date;
          label: string;
          points: Array<{
            series: PlotSeries;
            point: PlotPoint;
            viewX: number;
            viewY: number;
          }>;
        }
      | null,
    visible: PlotSeries[],
    _yd: YDomain
  ): TemplateResult | typeof nothing {
    if (!snap || !this.tooltip) return nothing;
    if (this.type === "bar") {
      // For bars the hover is implicit via the bar geometry; skip the
      // crosshair rendering.
      return nothing;
    }
    const markers = snap.points.map(({ series, point, viewX, viewY }) => {
      const idx = visible.indexOf(series);
      const color = this.#seriesColor(series, idx);
      return svg`
        <circle
          class="ce-plot-marker"
          cx=${viewX}
          cy=${viewY}
          r="4.5"
          fill=${color}
          @click=${(e: Event) => this.#onPointSelect(series, point, e)}
        />
      `;
    });
    return svg`
      <g class="ce-plot-hover" aria-hidden="true">
        <line
          class="ce-plot-crosshair"
          x1=${snap.viewX}
          y1=${CHART_Y}
          x2=${snap.viewX}
          y2=${CHART_Y + CHART_H}
        />
        ${markers}
      </g>
    `;
  }

  #renderTooltipCard(
    snap:
      | {
          viewX: number;
          rawX: number | string | Date;
          label: string;
          points: Array<{
            series: PlotSeries;
            point: PlotPoint;
            viewX: number;
            viewY: number;
          }>;
        }
      | null
  ): TemplateResult | typeof nothing {
    if (!this.tooltip) return nothing;
    const visible = this._tooltipPx !== null && snap !== null;
    const pos = this._tooltipPx ?? { left: 0, top: 0 };
    const visibleSeries = this.#visibleSeries;
    const rows = (snap?.points ?? []).map(({ series, point }) => {
      const idx = visibleSeries.indexOf(series);
      const color = this.#seriesColor(series, idx);
      const value = this.format(point.y, "y");
      return html`
        <div class="ce-plot-tooltip-row">
          <span
            class="ce-plot-tooltip-swatch"
            style=${`background:${color}`}
          ></span>
          <span class="ce-plot-tooltip-name">${series.name}</span>
          <span class="ce-plot-tooltip-value">${value}</span>
        </div>
      `;
    });
    return html`
      <div
        class="ce-plot-tooltip"
        role="tooltip"
        data-visible=${visible ? "true" : "false"}
        style=${`left:${pos.left}px;top:${pos.top}px`}
      >
        <div class="ce-plot-tooltip-title">${snap?.label ?? ""}</div>
        ${rows}
      </div>
    `;
  }

  #renderLegend(): TemplateResult | typeof nothing {
    if (!this.legend) return nothing;
    const data = Array.isArray(this.data) ? this.data : [];
    if (data.length === 0) return nothing;
    return html`
      <ul class="ce-plot-legend" role="list">
        ${data.map((s, i) => {
          const color = this.#seriesColor(s, i);
          const hidden = this.#isHidden(s);
          return html`
            <li role="listitem">
              <button
                type="button"
                class="ce-plot-chip"
                data-series=${s.name}
                aria-pressed=${hidden ? "false" : "true"}
                @click=${this.#onLegendClick(s.name)}
              >
                <span
                  class="ce-plot-swatch"
                  style=${`background:${color}`}
                ></span>
                <span class="ce-plot-chip-name">${s.name}</span>
              </button>
            </li>
          `;
        })}
      </ul>
    `;
  }
}

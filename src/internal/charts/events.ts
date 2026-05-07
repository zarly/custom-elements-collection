/**
 * Shared event-name constants for the chart family. One module exporting
 * strings (per `concept.md` §"Event contract" — "one module exporting
 * strings, not a class").
 *
 * The names form a coherent contract: consumers can listen on a parent
 * element for `ce-chart-hover` regardless of whether the source is
 * `ce-bar-chart` or `ce-plot`. The `detail` payload shape varies per
 * source — see the `*HoverDetail`, `*SelectDetail`, etc. type aliases below.
 *
 * All four events are dispatched with `bubbles: true` and `composed: true`
 * so they cross Light- and Shadow-DOM boundaries uniformly.
 */

/** Hover or focus on a bar row / data point. */
export const CHART_HOVER = "ce-chart-hover";

/** Pointer leaves the chart area, or focus blurs. */
export const CHART_LEAVE = "ce-chart-leave";

/** Click / `Enter` / `Space` on a bar row or data point. */
export const CHART_SELECT = "ce-chart-select";

/** Legend chip click — `ce-plot` only. */
export const CHART_TOGGLE = "ce-chart-toggle";

/** All chart event names, useful for typed listener maps and exhaustive checks. */
export const CHART_EVENTS = [
  CHART_HOVER,
  CHART_LEAVE,
  CHART_SELECT,
  CHART_TOGGLE,
] as const;

export type ChartEventName = (typeof CHART_EVENTS)[number];

// ---------- detail payload shapes ----------------------------------------
// These are the *expected* shapes. Components are free to widen them via
// `additional`-style fields, but consumers can safely narrow on `kind`.

/** `ce-chart-hover` from a horizontal bar component (one row). */
export interface BarHoverDetail<R = unknown> {
  kind: "row";
  row: R;
  index: number;
}

/** `ce-chart-hover` from a plot component (crosshair across series). */
export interface PointHoverDetail<P = unknown, S = unknown> {
  kind: "point";
  x: number | string | Date;
  points: Array<{ series: S; point: P }>;
}

/** `ce-chart-select` from a bar component. */
export interface BarSelectDetail<R = unknown> {
  row: R;
  index: number;
  originalEvent: Event;
}

/** `ce-chart-select` from a plot component. */
export interface PointSelectDetail<P = unknown, S = unknown> {
  series: S;
  point: P;
  type: "line" | "area" | "bar";
  originalEvent: Event;
}

/** `ce-chart-toggle` from a plot legend. */
export interface ToggleDetail {
  name: string;
  hidden: boolean;
}

import { describe, it, expect } from "vitest";
import {
  CHART_HOVER,
  CHART_LEAVE,
  CHART_SELECT,
  CHART_TOGGLE,
  CHART_EVENTS,
} from "./events.js";

describe("chart event constants", () => {
  it("matches the `ce-chart-*` family contract", () => {
    expect(CHART_HOVER).toBe("ce-chart-hover");
    expect(CHART_LEAVE).toBe("ce-chart-leave");
    expect(CHART_SELECT).toBe("ce-chart-select");
    expect(CHART_TOGGLE).toBe("ce-chart-toggle");
  });

  it("CHART_EVENTS lists all four names", () => {
    expect(CHART_EVENTS).toEqual([
      "ce-chart-hover",
      "ce-chart-leave",
      "ce-chart-select",
      "ce-chart-toggle",
    ]);
  });

  it("every name uses the ce-chart- prefix", () => {
    for (const name of CHART_EVENTS) {
      expect(name.startsWith("ce-chart-")).toBe(true);
    }
  });

  it("constants are usable as native event types", () => {
    const target = document.createElement("div");
    let captured: string | null = null;
    target.addEventListener(CHART_HOVER, (e) => {
      captured = e.type;
    });
    target.dispatchEvent(
      new CustomEvent(CHART_HOVER, { detail: { kind: "row", row: {}, index: 0 } })
    );
    expect(captured).toBe("ce-chart-hover");
  });

  it("dispatched event with bubbles/composed crosses a parent listener", () => {
    const parent = document.createElement("section");
    const child = document.createElement("div");
    parent.appendChild(child);
    document.body.appendChild(parent);
    let count = 0;
    parent.addEventListener(CHART_SELECT, () => count++);
    child.dispatchEvent(
      new CustomEvent(CHART_SELECT, {
        bubbles: true,
        composed: true,
        detail: { row: {}, index: 0, originalEvent: new Event("click") },
      })
    );
    expect(count).toBe(1);
    parent.remove();
  });
});

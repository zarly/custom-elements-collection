import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeChart } from "./chart.js";

beforeAll(() => defineOnce("ce-chart", CeChart));

// Note: We cannot reliably load Chart.js in jsdom (no canvas + no network),
// so these tests verify the wrapper's behavior, not actual Chart rendering.

describe("<ce-chart>", () => {
  it("upgrades and renders a canvas in shadow DOM", async () => {
    const el = document.createElement("ce-chart") as CeChart;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("canvas")).not.toBeNull();
    el.remove();
  });

  it("defaults type to line", async () => {
    const el = document.createElement("ce-chart") as CeChart;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.type).toBe("line");
    el.remove();
  });

  it("accepts type override", async () => {
    const el = document.createElement("ce-chart") as CeChart;
    el.type = "radar";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.type).toBe("radar");
    el.remove();
  });

  it("uses configurable Chart.js source URL", async () => {
    const el = document.createElement("ce-chart") as CeChart;
    el.src = "https://example.com/chart.js";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.src).toBe("https://example.com/chart.js");
    el.remove();
  });

  it("parses `data` from a JSON attribute set before connect", async () => {
    const el = document.createElement("ce-chart") as CeChart;
    const data = { labels: ["a", "b"], datasets: [{ data: [1, 2] }] };
    el.setAttribute("data", JSON.stringify(data));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.data).toEqual(data);
    expect(el.shadowRoot!.querySelector("canvas")).not.toBeNull();
    el.remove();
  });

  it("falls back to default `data` shape and warns when attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-chart") as CeChart;
    el.setAttribute("data", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.data).toEqual({ labels: [], datasets: [] });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });

  it("parses `options` from a JSON attribute set before connect", async () => {
    const el = document.createElement("ce-chart") as CeChart;
    const opts = { responsive: true, plugins: { legend: { display: false } } };
    el.setAttribute("options", JSON.stringify(opts));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.options).toEqual(opts);
    expect(el.shadowRoot!.querySelector("canvas")).not.toBeNull();
    el.remove();
  });

  it("falls back to {} and warns when `options` attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-chart") as CeChart;
    el.setAttribute("options", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.options).toEqual({});
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });
});

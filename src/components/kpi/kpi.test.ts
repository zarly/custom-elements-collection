import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeKpi } from "./kpi.js";

beforeAll(() => defineOnce("ce-kpi", CeKpi));

describe("<ce-kpi>", () => {
  it("renders value and label", async () => {
    const el = document.createElement("ce-kpi") as CeKpi;
    el.value = "96.4%";
    el.label = "Conformance";
    document.body.appendChild(el);
    await el.updateComplete;
    const sr = el.shadowRoot!;
    expect(sr.querySelector(".ce-kpi__value")?.textContent?.trim()).toContain("96.4%");
    expect(sr.querySelector(".ce-kpi__label")?.textContent).toBe("Conformance");
    el.remove();
  });

  it("omits label when not provided", async () => {
    const el = document.createElement("ce-kpi") as CeKpi;
    el.value = "42";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-kpi__label")).toBeNull();
    el.remove();
  });

  it("reflects color attribute", async () => {
    const el = document.createElement("ce-kpi") as CeKpi;
    el.color = "green";
    el.value = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("color")).toBe("green");
    el.remove();
  });

  it("classifies trend as up when it starts with +", async () => {
    const el = document.createElement("ce-kpi") as CeKpi;
    el.value = "100";
    el.trend = "+12%";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-kpi__trend")?.classList.contains("up")).toBe(true);
    el.remove();
  });

  it("classifies trend as down when it starts with -", async () => {
    const el = document.createElement("ce-kpi") as CeKpi;
    el.value = "100";
    el.trend = "-5%";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-kpi__trend")?.classList.contains("down")).toBe(true);
    el.remove();
  });

  it("does not render trend element when trend is empty", async () => {
    const el = document.createElement("ce-kpi") as CeKpi;
    el.value = "100";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-kpi__trend")).toBeNull();
    el.remove();
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFeedbackHeatmap } from "./feedback-heatmap.js";

beforeAll(() => {
  defineOnce("ce-feedback-heatmap", CeFeedbackHeatmap);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeFeedbackHeatmap).updateComplete;
}

describe("<ce-feedback-heatmap>", () => {
  it("renders empty svg with no state", async () => {
    const host = mount(`<ce-feedback-heatmap></ce-feedback-heatmap>`);
    const el = host.querySelector("ce-feedback-heatmap") as CeFeedbackHeatmap;
    await ready(el);
    expect(el.shadowRoot!.querySelector("svg")).not.toBeNull();
    expect(el.shadowRoot!.querySelectorAll("rect").length).toBe(0);
    host.remove();
  });

  it("hydrates from ce-feedback-state event", async () => {
    const host = mount(`<ce-feedback-heatmap></ce-feedback-heatmap>`);
    const el = host.querySelector("ce-feedback-heatmap") as CeFeedbackHeatmap;
    await ready(el);
    document.dispatchEvent(
      new CustomEvent("ce-feedback-state", {
        detail: {
          state: {
            a: { thumbs: "up" },
            b: { thumbs: "down" },
            c: { bookmarked: true },
            d: {},
          },
        },
      })
    );
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("rect").length).toBe(4);
    host.remove();
  });

  it("renders verdicts with distinct fills", async () => {
    const host = mount(`<ce-feedback-heatmap></ce-feedback-heatmap>`);
    const el = host.querySelector("ce-feedback-heatmap") as CeFeedbackHeatmap;
    await ready(el);
    document.dispatchEvent(
      new CustomEvent("ce-feedback-state", {
        detail: { state: { a: { thumbs: "up" }, b: { thumbs: "down" } } },
      })
    );
    await ready(el);
    const rects = el.shadowRoot!.querySelectorAll("rect");
    const fills = Array.from(rects).map((r) => r.getAttribute("fill"));
    expect(new Set(fills).size).toBe(2);
    host.remove();
  });

  it("max attribute clamps cell count", async () => {
    const host = mount(`<ce-feedback-heatmap max="2"></ce-feedback-heatmap>`);
    const el = host.querySelector("ce-feedback-heatmap") as CeFeedbackHeatmap;
    await ready(el);
    document.dispatchEvent(
      new CustomEvent("ce-feedback-state", {
        detail: { state: { a: {}, b: {}, c: {}, d: {} } },
      })
    );
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("rect").length).toBe(2);
    host.remove();
  });

  it("subject attribute filters events", async () => {
    const host = mount(`<ce-feedback-heatmap subject="abc"></ce-feedback-heatmap>`);
    const el = host.querySelector("ce-feedback-heatmap") as CeFeedbackHeatmap;
    await ready(el);
    document.dispatchEvent(
      new CustomEvent("ce-feedback-state", {
        detail: { subject: "other", state: { a: {} } },
      })
    );
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("rect").length).toBe(0);
    document.dispatchEvent(
      new CustomEvent("ce-feedback-state", {
        detail: { subject: "abc", state: { a: {} } },
      })
    );
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("rect").length).toBe(1);
    host.remove();
  });

  it("show-legend renders legend chips", async () => {
    const host = mount(`<ce-feedback-heatmap show-legend></ce-feedback-heatmap>`);
    const el = host.querySelector("ce-feedback-heatmap") as CeFeedbackHeatmap;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".legend")).not.toBeNull();
    expect(el.shadowRoot!.querySelectorAll(".swatch").length).toBe(6);
    host.remove();
  });

  it("aria-label describes count", async () => {
    const host = mount(`<ce-feedback-heatmap></ce-feedback-heatmap>`);
    const el = host.querySelector("ce-feedback-heatmap") as CeFeedbackHeatmap;
    await ready(el);
    document.dispatchEvent(
      new CustomEvent("ce-feedback-state", { detail: { state: { a: {}, b: {} } } })
    );
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toContain("2");
    host.remove();
  });
});

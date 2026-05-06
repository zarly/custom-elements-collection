import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDetails } from "./details.js";

beforeAll(() => defineOnce("ce-details", CeDetails));

describe("<ce-details>", () => {
  it("renders summary text", async () => {
    const el = document.createElement("ce-details") as CeDetails;
    el.summary = "Show more";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("summary")?.textContent).toContain("Show more");
    el.remove();
  });

  it("renders a count chip when set", async () => {
    const el = document.createElement("ce-details") as CeDetails;
    el.summary = "Files";
    el.count = "48";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-details__count")?.textContent).toBe("48");
    el.remove();
  });

  it("reflects open attribute", async () => {
    const el = document.createElement("ce-details") as CeDetails;
    el.open = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("open")).toBe(true);
    const native = el.shadowRoot!.querySelector("details");
    expect(native?.hasAttribute("open")).toBe(true);
    el.remove();
  });

  it("dispatches ce-details-toggle when the native details toggles", async () => {
    const el = document.createElement("ce-details") as CeDetails;
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: { open: boolean } | null = null;
    el.addEventListener("ce-details-toggle", (e) => {
      detail = (e as CustomEvent).detail as { open: boolean };
    });
    const native = el.shadowRoot!.querySelector("details")!;
    native.open = true;
    native.dispatchEvent(new Event("toggle"));
    expect(detail).toEqual({ open: true });
    expect(el.open).toBe(true);
    el.remove();
  });

  it("has named summary slot in shadow DOM", async () => {
    const el = document.createElement("ce-details") as CeDetails;
    document.body.appendChild(el);
    await el.updateComplete;
    const slots = Array.from(el.shadowRoot!.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("summary");
    expect(names).toContain("default");
    el.remove();
  });
});

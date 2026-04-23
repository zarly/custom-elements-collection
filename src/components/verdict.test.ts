import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeVerdict } from "./verdict.js";

beforeAll(() => defineOnce("ce-verdict", CeVerdict));

describe("<ce-verdict>", () => {
  it("defaults type to info with ℹ icon", async () => {
    const el = document.createElement("ce-verdict") as CeVerdict;
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("type")).toBe("info");
    expect(el.shadowRoot!.querySelector(".ce-verdict__icon")?.textContent?.trim()).toBe("ℹ");
    el.remove();
  });

  it("type=go renders ✓", async () => {
    const el = document.createElement("ce-verdict") as CeVerdict;
    el.type = "go";
    el.title = "Ship";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-verdict__icon")?.textContent?.trim()).toBe("✓");
    el.remove();
  });

  it("type=no-go renders ✗", async () => {
    const el = document.createElement("ce-verdict") as CeVerdict;
    el.type = "no-go";
    el.title = "Block";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-verdict__icon")?.textContent?.trim()).toBe("✗");
    el.remove();
  });

  it("custom icon wins over default", async () => {
    const el = document.createElement("ce-verdict") as CeVerdict;
    el.type = "go";
    el.icon = "🎉";
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-verdict__icon")?.textContent?.trim()).toBe("🎉");
    el.remove();
  });

  it("renders title and detail", async () => {
    const el = document.createElement("ce-verdict") as CeVerdict;
    el.type = "go";
    el.title = "Ready to ship";
    el.detail = "All suites green.";
    document.body.appendChild(el);
    await el.updateComplete;
    const sr = el.shadowRoot!;
    expect(sr.querySelector(".ce-verdict__title")?.textContent?.trim()).toContain(
      "Ready to ship"
    );
    expect(sr.querySelector(".ce-verdict__detail")?.textContent?.trim()).toBe(
      "All suites green."
    );
    el.remove();
  });

  it("omits title block when title is empty", async () => {
    const el = document.createElement("ce-verdict") as CeVerdict;
    el.detail = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-verdict__title")).toBeNull();
    el.remove();
  });
});

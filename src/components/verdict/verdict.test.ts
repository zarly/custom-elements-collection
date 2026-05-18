import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
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

  it("renders title and detail in banner mode", async () => {
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

  it("omits title block when title is empty (banner mode)", async () => {
    const el = document.createElement("ce-verdict") as CeVerdict;
    el.detail = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-verdict__title")).toBeNull();
    el.remove();
  });

  it("inline mode renders a single label, no title block, no detail block", async () => {
    const el = document.createElement("ce-verdict") as CeVerdict;
    el.type = "go";
    el.inline = true;
    el.textContent = "SHIP IT";
    document.body.appendChild(el);
    await el.updateComplete;
    const sr = el.shadowRoot!;
    expect(sr.querySelector(".ce-verdict__label")).not.toBeNull();
    expect(sr.querySelector(".ce-verdict__title")).toBeNull();
    expect(sr.querySelector(".ce-verdict__detail")).toBeNull();
    expect(el.getAttribute("inline")).toBe("");
    el.remove();
  });

  it("inline mode with empty default slot falls back to type-default label", async () => {
    const el = document.createElement("ce-verdict") as CeVerdict;
    el.inline = true;
    el.type = "no-go";
    document.body.appendChild(el);
    await el.updateComplete;
    // Lit renders the fallback DOM inside the <slot>, which jsdom exposes as textContent.
    const labelEl = el.shadowRoot!.querySelector(".ce-verdict__label") as HTMLElement | null;
    expect(labelEl).not.toBeNull();
    const fallback = labelEl?.querySelector("slot")?.textContent ?? labelEl?.textContent ?? "";
    expect(fallback.trim()).toBe("No-go");
    el.remove();
  });

  it("inline mode uses CDR-001 canonical labels for every type", async () => {
    const cases: Array<[VerdictType, string]> = [
      ["go", "Go"],
      ["no-go", "No-go"],
      ["mixed", "Mixed"],
      ["info", "Info"],
    ];
    for (const [type, expected] of cases) {
      const el = document.createElement("ce-verdict") as CeVerdict;
      el.type = type;
      el.inline = true;
      document.body.appendChild(el);
      await el.updateComplete;
      const labelEl = el.shadowRoot!.querySelector(".ce-verdict__label") as HTMLElement | null;
      const fallback = labelEl?.querySelector("slot")?.textContent ?? labelEl?.textContent ?? "";
      expect(fallback.trim()).toBe(expected);
      el.remove();
    }
  });
});

type VerdictType = "go" | "no-go" | "mixed" | "info";

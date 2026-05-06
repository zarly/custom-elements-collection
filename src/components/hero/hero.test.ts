import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeHero } from "./hero.js";

beforeAll(() => defineOnce("ce-hero", CeHero));

describe("<ce-hero>", () => {
  it("renders the title attribute inside the heading", async () => {
    const el = document.createElement("ce-hero") as CeHero;
    el.title = "Release readiness";
    document.body.appendChild(el);
    await el.updateComplete;
    const h1 = el.shadowRoot!.querySelector(".ce-hero__title");
    expect(h1?.textContent?.trim()).toContain("Release readiness");
    el.remove();
  });

  it("renders the kicker when set", async () => {
    const el = document.createElement("ce-hero") as CeHero;
    el.kicker = "Phase 2";
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    const k = el.shadowRoot!.querySelector(".ce-hero__kicker");
    expect(k?.textContent).toBe("Phase 2");
    el.remove();
  });

  it("omits the kicker when not set", async () => {
    const el = document.createElement("ce-hero") as CeHero;
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-hero__kicker")).toBeNull();
    el.remove();
  });

  it("renders the lede paragraph when set", async () => {
    const el = document.createElement("ce-hero") as CeHero;
    el.title = "x";
    el.lede = "Supporting copy";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-hero__lede")?.textContent).toBe(
      "Supporting copy"
    );
    el.remove();
  });

  it("reflects the flat boolean attribute", async () => {
    const el = document.createElement("ce-hero") as CeHero;
    el.flat = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("flat")).toBe(true);
    el.remove();
  });

  it("exposes a stats slot", async () => {
    const el = document.createElement("ce-hero") as CeHero;
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    const slots = Array.from(el.shadowRoot!.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("stats");
    expect(names).toContain("title");
    expect(names).toContain("default");
    el.remove();
  });
});

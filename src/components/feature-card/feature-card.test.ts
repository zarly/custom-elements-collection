import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFeatureCard } from "./feature-card.js";

beforeAll(() => defineOnce("ce-feature-card", CeFeatureCard));

describe("<ce-feature-card>", () => {
  it("renders title and icon", async () => {
    const el = document.createElement("ce-feature-card") as CeFeatureCard;
    el.title = "Fast";
    el.icon = "⚡";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-feature__title")?.textContent).toBe("Fast");
    expect(el.shadowRoot!.querySelector(".ce-feature__icon")?.textContent).toBe("⚡");
    el.remove();
  });

  it("renders <a> when cta+href set", async () => {
    const el = document.createElement("ce-feature-card") as CeFeatureCard;
    el.title = "x";
    el.cta = "Learn more";
    el.href = "/docs";
    document.body.appendChild(el);
    await el.updateComplete;
    const a = el.shadowRoot!.querySelector("a.ce-feature__cta") as HTMLAnchorElement;
    expect(a).not.toBeNull();
    expect(a.getAttribute("href")).toBe("/docs");
    expect(a.textContent?.trim()).toBe("Learn more");
    el.remove();
  });

  it("renders <button> when cta but no href, dispatches ce-feature-cta", async () => {
    const el = document.createElement("ce-feature-card") as CeFeatureCard;
    el.title = "x";
    el.cta = "Click";
    document.body.appendChild(el);
    await el.updateComplete;
    let fired = false;
    el.addEventListener("ce-feature-cta", () => (fired = true));
    const btn = el.shadowRoot!.querySelector("button.ce-feature__cta") as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    expect(fired).toBe(true);
    el.remove();
  });

  it("omits cta block when cta empty", async () => {
    const el = document.createElement("ce-feature-card") as CeFeatureCard;
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-feature__cta")).toBeNull();
    el.remove();
  });

  it("reflects color", async () => {
    const el = document.createElement("ce-feature-card") as CeFeatureCard;
    el.color = "purple";
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("color")).toBe("purple");
    el.remove();
  });
});

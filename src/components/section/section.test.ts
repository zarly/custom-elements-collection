import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSection } from "./section.js";

beforeAll(() => defineOnce("ce-section", CeSection));

describe("<ce-section>", () => {
  it("renders title and lede", async () => {
    const el = document.createElement("ce-section") as CeSection;
    el.title = "Corpus inventory";
    el.lede = "90 files across 7 locations";
    document.body.appendChild(el);
    await el.updateComplete;
    const sr = el.shadowRoot!;
    expect(sr.querySelector(".ce-section__title")?.textContent).toContain(
      "Corpus inventory"
    );
    expect(sr.querySelector(".ce-section__lede")?.textContent).toBe(
      "90 files across 7 locations"
    );
    el.remove();
  });

  it("renders number badge when number is set", async () => {
    const el = document.createElement("ce-section") as CeSection;
    el.number = "3";
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-section__num")?.textContent).toBe("3");
    el.remove();
  });

  it("renders count label when set via attribute", async () => {
    const el = document.createElement("ce-section");
    el.setAttribute("title", "x");
    el.setAttribute("count-label", "28 files");
    document.body.appendChild(el);
    await (el as CeSection).updateComplete;
    expect((el as CeSection).countLabel).toBe("28 files");
    expect(el.shadowRoot!.querySelector(".ce-section__count")?.textContent).toBe(
      "28 files"
    );
    el.remove();
  });

  it("omits lede paragraph when lede is null", async () => {
    const el = document.createElement("ce-section") as CeSection;
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-section__lede")).toBeNull();
    el.remove();
  });
});

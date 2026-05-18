import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CePersona } from "./persona.js";

beforeAll(() => defineOnce("ce-persona", CePersona));

describe("<ce-persona>", () => {
  it("renders name and role", async () => {
    const el = document.createElement("ce-persona") as CePersona;
    el.name = "Alex";
    el.role = "Product manager";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-persona__name")?.textContent).toBe("Alex");
    expect(el.shadowRoot!.querySelector(".ce-persona__role")?.textContent).toBe(
      "Product manager"
    );
    el.remove();
  });

  it("shows avatar when set", async () => {
    const el = document.createElement("ce-persona") as CePersona;
    el.name = "x";
    el.avatar = "👩‍💼";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-persona__avatar")?.textContent).toBe("👩‍💼");
    el.remove();
  });

  it("omits avatar when not set", async () => {
    const el = document.createElement("ce-persona") as CePersona;
    el.name = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-persona__avatar")).toBeNull();
    el.remove();
  });

  it("reflects color attribute", async () => {
    const el = document.createElement("ce-persona") as CePersona;
    el.color = "blue";
    el.name = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("color")).toBe("blue");
    el.remove();
  });

  it("exposes tags, detail, meta and default slots", async () => {
    const el = document.createElement("ce-persona") as CePersona;
    el.name = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    const slots = Array.from(el.shadowRoot!.querySelectorAll("slot")).map(
      (s) => s.getAttribute("name") ?? "default"
    );
    expect(slots).toContain("tags");
    expect(slots).toContain("detail");
    expect(slots).toContain("meta");
    expect(slots).toContain("default");
    el.remove();
  });

  it("renders rank pill when rank is set", async () => {
    const el = document.createElement("ce-persona") as CePersona;
    el.name = "x";
    el.rank = "#1";
    document.body.appendChild(el);
    await el.updateComplete;
    const pills = Array.from(el.shadowRoot!.querySelectorAll(".ce-persona__pill"));
    expect(pills.some((p) => p.textContent === "#1")).toBe(true);
    el.remove();
  });

  it("renders score pill when score is set", async () => {
    const el = document.createElement("ce-persona") as CePersona;
    el.name = "x";
    el.score = "8 / 10";
    document.body.appendChild(el);
    await el.updateComplete;
    const pills = Array.from(el.shadowRoot!.querySelectorAll(".ce-persona__pill"));
    expect(pills.some((p) => p.textContent === "8 / 10")).toBe(true);
    el.remove();
  });

  it("omits pills when rank and score are empty", async () => {
    const el = document.createElement("ce-persona") as CePersona;
    el.name = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".ce-persona__pill").length).toBe(0);
    el.remove();
  });

  it("renders both rank and score pills together", async () => {
    const el = document.createElement("ce-persona") as CePersona;
    el.name = "x";
    el.rank = "#2";
    el.score = "7 / 10";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".ce-persona__pill").length).toBe(2);
    el.remove();
  });
});

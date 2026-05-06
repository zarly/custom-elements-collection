import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeExample } from "./example.js";

beforeAll(() => defineOnce("ce-example", CeExample));

describe("<ce-example>", () => {
  it("defaults type to neutral with 'Example' label", async () => {
    const el = document.createElement("ce-example") as CeExample;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("type")).toBe("neutral");
    expect(el.shadowRoot!.querySelector(".ce-example__label")?.textContent).toBe(
      "Example"
    );
    el.remove();
  });

  it("type=good defaults to 'Good' label", async () => {
    const el = document.createElement("ce-example") as CeExample;
    el.type = "good";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-example__label")?.textContent).toBe(
      "Good"
    );
    el.remove();
  });

  it("type=bad defaults to 'Wrong' label", async () => {
    const el = document.createElement("ce-example") as CeExample;
    el.type = "bad";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-example__label")?.textContent).toBe(
      "Wrong"
    );
    el.remove();
  });

  it("custom label overrides default", async () => {
    const el = document.createElement("ce-example") as CeExample;
    el.type = "good";
    el.label = "Best practice";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-example__label")?.textContent).toBe(
      "Best practice"
    );
    el.remove();
  });

  it("projects body via default slot", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-example type="good">A correct sentence.</ce-example>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-example") as CeExample;
    await el.updateComplete;
    const slot = el.shadowRoot!.querySelector("slot")!;
    expect(slot.assignedNodes().some((n) => n.textContent === "A correct sentence.")).toBe(
      true
    );
    host.remove();
  });
});

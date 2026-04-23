import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeChip } from "./chip.js";

beforeAll(() => defineOnce("ce-chip", CeChip));

describe("<ce-chip>", () => {
  it("defaults type to neutral", async () => {
    const el = document.createElement("ce-chip") as CeChip;
    el.textContent = "Draft";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.type).toBe("neutral");
    el.remove();
  });

  it("reflects type attribute", async () => {
    const el = document.createElement("ce-chip") as CeChip;
    el.type = "green";
    el.textContent = "Pass";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("type")).toBe("green");
    el.remove();
  });

  it("renders a dot when dot=true", async () => {
    const el = document.createElement("ce-chip") as CeChip;
    el.type = "green";
    el.dot = true;
    el.textContent = "Live";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-chip__dot")).not.toBeNull();
    el.remove();
  });

  it("does not render a dot by default", async () => {
    const el = document.createElement("ce-chip") as CeChip;
    el.textContent = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-chip__dot")).toBeNull();
    el.remove();
  });

  it("projects label via default slot", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-chip type="blue">hello</ce-chip>`;
    document.body.appendChild(host);
    const chip = host.querySelector("ce-chip") as CeChip;
    await chip.updateComplete;
    const slot = chip.shadowRoot!.querySelector("slot")!;
    const txt = slot.assignedNodes().map((n) => n.textContent).join("");
    expect(txt).toBe("hello");
    host.remove();
  });

  it("reflects outlined boolean", async () => {
    const el = document.createElement("ce-chip") as CeChip;
    el.outlined = true;
    el.textContent = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("outlined")).toBe(true);
    el.remove();
  });
});

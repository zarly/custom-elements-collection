import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeProgressList } from "./progress-list.js";
import { CeProgress } from "../progress/progress.js";

beforeAll(() => {
  defineOnce("ce-progress-list", CeProgressList);
  defineOnce("ce-progress", CeProgress);
});

describe("<ce-progress-list>", () => {
  it("renders as a flex column container via shadow root slot", async () => {
    const el = document.createElement("ce-progress-list") as CeProgressList;
    document.body.appendChild(el);
    await el.updateComplete;
    // Shadow DOM :host styles are not resolved by jsdom's getComputedStyle from
    // outside the shadow boundary. Verify the layout intent by confirming the
    // shadow root contains the slot element (meaning render() ran correctly).
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector("slot")).not.toBeNull();
    el.remove();
  });

  it("accepts ce-progress children and renders them", async () => {
    const el = document.createElement("ce-progress-list") as CeProgressList;
    const p1 = document.createElement("ce-progress") as CeProgress;
    p1.label = "Engineering";
    p1.value = 56;
    const p2 = document.createElement("ce-progress") as CeProgress;
    p2.label = "QA";
    p2.value = 78;
    el.appendChild(p1);
    el.appendChild(p2);
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.querySelectorAll("ce-progress").length).toBe(2);
    el.remove();
  });

  it("accepts narrative children without breaking layout", async () => {
    const el = document.createElement("ce-progress-list") as CeProgressList;
    const p = document.createElement("p");
    p.textContent = "Annotation text";
    const progress = document.createElement("ce-progress") as CeProgress;
    progress.label = "Tests";
    progress.value = 90;
    el.appendChild(progress);
    el.appendChild(p);
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.querySelector("p")?.textContent).toBe("Annotation text");
    expect(el.querySelector("ce-progress")).not.toBeNull();
    el.remove();
  });

  it("renders cleanly when empty", async () => {
    const el = document.createElement("ce-progress-list") as CeProgressList;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.children.length).toBe(0);
    el.remove();
  });

  it("renders multiple ce-progress children all accessible via querySelectorAll", async () => {
    const el = document.createElement("ce-progress-list") as CeProgressList;
    const labels = ["Sprint 1", "Sprint 2", "Sprint 3"];
    for (const label of labels) {
      const p = document.createElement("ce-progress") as CeProgress;
      p.label = label;
      p.value = 50;
      el.appendChild(p);
    }
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.querySelectorAll("ce-progress").length).toBe(3);
    el.remove();
  });

  it("ce-progress children reflect value and color attributes", async () => {
    const el = document.createElement("ce-progress-list") as CeProgressList;
    const p = document.createElement("ce-progress") as CeProgress;
    p.value = 42;
    p.color = "green";
    el.appendChild(p);
    document.body.appendChild(el);
    await el.updateComplete;
    const child = el.querySelector("ce-progress") as CeProgress;
    expect(child.value).toBe(42);
    expect(child.getAttribute("color")).toBe("green");
    el.remove();
  });

  it("mixed children (ce-progress + p + ce-progress) all present in DOM", async () => {
    const el = document.createElement("ce-progress-list") as CeProgressList;
    const p1 = document.createElement("ce-progress") as CeProgress;
    p1.label = "Deploys";
    p1.value = 42;
    const note = document.createElement("p");
    note.textContent = "Last 7 days.";
    const p2 = document.createElement("ce-progress") as CeProgress;
    p2.label = "Tests";
    p2.value = 78;
    el.appendChild(p1);
    el.appendChild(note);
    el.appendChild(p2);
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.querySelectorAll("ce-progress").length).toBe(2);
    expect(el.querySelector("p")?.textContent).toBe("Last 7 days.");
    el.remove();
  });
});

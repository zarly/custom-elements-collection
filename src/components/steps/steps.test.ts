import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSteps } from "./steps.js";
import { CeStep } from "../step/step.js";

beforeAll(() => {
  defineOnce("ce-steps", CeSteps);
  defineOnce("ce-step", CeStep);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeSteps).updateComplete;
}

describe("<ce-steps>", () => {
  it("renders empty state when no data and no slot children", async () => {
    const host = mount(`<ce-steps></ce-steps>`);
    const el = host.querySelector("ce-steps") as CeSteps;
    await ready(el);
    // ce-steps uses Shadow DOM; empty state renders into the shadow root
    const shadow = el.shadowRoot!;
    expect(shadow).not.toBeNull();
    const empty = shadow.querySelector(".ce-steps__empty");
    expect(empty).not.toBeNull();
    expect(empty?.textContent?.trim()).toBe("No steps");
    host.remove();
  });

  it("renders steps from JSON data attribute into shadow DOM", async () => {
    const data = JSON.stringify([
      { title: "Discovery", desc: "15 interviews", state: "done" },
      { title: "Prototype", desc: "Figma", state: "active" },
    ]);
    const host = mount(`<ce-steps data='${data}'></ce-steps>`);
    const el = host.querySelector("ce-steps") as CeSteps;
    await ready(el);
    // JSON mode: ce-step elements are rendered inside shadow DOM
    const steps = el.shadowRoot!.querySelectorAll("ce-step");
    expect(steps.length).toBe(2);
    expect(steps[0].getAttribute("title")).toBe("Discovery");
    expect(steps[1].getAttribute("title")).toBe("Prototype");
    host.remove();
  });

  it("renders slot children in a slot element when data is empty", async () => {
    const host = mount(`
      <ce-steps>
        <ce-step title="Step A">desc A</ce-step>
        <ce-step title="Step B">desc B</ce-step>
      </ce-steps>
    `);
    const el = host.querySelector("ce-steps") as CeSteps;
    await ready(el);
    // Slot children remain in light DOM, rendered via <slot> in shadow root
    const slotChildren = el.querySelectorAll("ce-step");
    expect(slotChildren.length).toBe(2);
    expect(slotChildren[0].getAttribute("title")).toBe("Step A");
    expect(slotChildren[1].getAttribute("title")).toBe("Step B");
    // Shadow root should have a slot element (slot mode)
    const slot = el.shadowRoot!.querySelector("slot");
    expect(slot).not.toBeNull();
    host.remove();
  });

  it("JSON data takes precedence over slot children (CDR-005)", async () => {
    const data = JSON.stringify([{ title: "From JSON", desc: "json desc" }]);
    const host = mount(`
      <ce-steps data='${data}'>
        <ce-step title="From Slot">slot desc</ce-step>
      </ce-steps>
    `);
    const el = host.querySelector("ce-steps") as CeSteps;
    await ready(el);
    // Shadow DOM renders only the JSON step; slot is not rendered (JSON mode)
    const shadowSteps = el.shadowRoot!.querySelectorAll("ce-step");
    expect(shadowSteps.length).toBe(1);
    expect(shadowSteps[0].getAttribute("title")).toBe("From JSON");
    // Slot child is still in light DOM (CDR-006: not filtered)
    const lightStep = el.querySelector("ce-step");
    expect(lightStep).not.toBeNull();
    expect(lightStep?.getAttribute("title")).toBe("From Slot");
    host.remove();
  });

  it("auto-numbers slot children that have no n attribute", async () => {
    const host = mount(`
      <ce-steps>
        <ce-step title="Alpha">desc</ce-step>
        <ce-step title="Beta">desc</ce-step>
        <ce-step title="Gamma" n="X">desc</ce-step>
      </ce-steps>
    `);
    const el = host.querySelector("ce-steps") as CeSteps;
    await ready(el);
    const steps = el.querySelectorAll("ce-step");
    // First two are auto-numbered (light DOM children mutated by component)
    expect(steps[0].getAttribute("n")).toBe("1");
    expect(steps[1].getAttribute("n")).toBe("2");
    // Third keeps its explicit n
    expect(steps[2].getAttribute("n")).toBe("X");
    host.remove();
  });

  it("direction='horizontal' reflects on host", async () => {
    const host = mount(`<ce-steps direction="horizontal"></ce-steps>`);
    const el = host.querySelector("ce-steps") as CeSteps;
    await ready(el);
    expect(el.getAttribute("direction")).toBe("horizontal");
    expect(el.direction).toBe("horizontal");
    host.remove();
  });

  it("JSON mode and slot mode produce the same ce-step title for equivalent data", async () => {
    const title = "Validate";
    const desc = "5 follow-ups";

    // JSON mode — ce-steps renders ce-step children into shadow DOM
    const jsonData = JSON.stringify([{ title, desc, state: "active" }]);
    const jsonHost = mount(`<ce-steps data='${jsonData}'></ce-steps>`);
    const jsonEl = jsonHost.querySelector("ce-steps") as CeSteps;
    await ready(jsonEl);
    const jsonStep = jsonEl.shadowRoot!.querySelector("ce-step")!;
    const jsonTitle = jsonStep.getAttribute("title");

    // Slot mode — ce-step is a light DOM child
    const slotHost = mount(`
      <ce-steps>
        <ce-step title="${title}" state="active">${desc}</ce-step>
      </ce-steps>
    `);
    const slotEl = slotHost.querySelector("ce-steps") as CeSteps;
    await ready(slotEl);
    const slotStep = slotEl.querySelector("ce-step")!;
    const slotTitle = slotStep.getAttribute("title");

    expect(jsonTitle).toBe(slotTitle);

    jsonHost.remove();
    slotHost.remove();
  });

  it("auto-number disabled via property does not re-set n after removal", async () => {
    const host = mount(`
      <ce-steps>
        <ce-step title="No n">desc</ce-step>
      </ce-steps>
    `);
    const el = host.querySelector("ce-steps") as CeSteps;
    await ready(el);
    // Step is auto-numbered on first render
    const step = el.querySelector("ce-step")!;
    expect(step.hasAttribute("n")).toBe(true);
    // Turn off auto-number, remove n, confirm next update does not re-add it
    el.autoNumber = false;
    step.removeAttribute("n");
    await ready(el);
    expect(step.hasAttribute("n")).toBe(false);
    host.remove();
  });
});

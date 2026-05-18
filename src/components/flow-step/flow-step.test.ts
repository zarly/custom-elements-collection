import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFlowStep } from "./flow-step.js";
import { CeFlow } from "../flow/flow.js";

beforeAll(() => {
  defineOnce("ce-flow-step", CeFlowStep);
  defineOnce("ce-flow", CeFlow);
});

describe("<ce-flow-step>", () => {
  it("renders title and step number in standalone mode", async () => {
    const el = document.createElement("ce-flow-step") as CeFlowStep;
    el.n = "1";
    el.title = "Discovery";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-fs-title")?.textContent?.trim()).toBe(
      "Discovery"
    );
    expect(el.shadowRoot!.querySelector(".ce-fs-n")?.textContent?.trim()).toBe("1");
    el.remove();
  });

  it("renders icon when provided", async () => {
    const el = document.createElement("ce-flow-step") as CeFlowStep;
    el.icon = "🎨";
    el.title = "Design";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-fs-icon")?.textContent?.trim()).toBe("🎨");
    el.remove();
  });

  it("applies color class when color attr is set", async () => {
    const el = document.createElement("ce-flow-step") as CeFlowStep;
    el.color = "green";
    el.title = "Go";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector(".ce-fs-wrap")?.classList.contains("c-green")
    ).toBe(true);
    el.remove();
  });

  it("renders default slot body content in standalone mode", async () => {
    const el = document.createElement("ce-flow-step") as CeFlowStep;
    el.title = "Step";
    // We set innerHTML before append so Lit can read slot children after update
    document.body.appendChild(el);
    el.innerHTML = "<p>Rich body content</p>";
    await el.updateComplete;
    // The body div wraps the slot (in shadow DOM)
    expect(el.shadowRoot!.querySelector(".ce-fs-body")).not.toBeNull();
    // The slotted content remains in light DOM as the host's children
    expect(el.querySelector("p")?.textContent).toBe("Rich body content");
    el.remove();
  });

  it("reflects n, title, icon, color attributes", async () => {
    const el = document.createElement("ce-flow-step") as CeFlowStep;
    el.n = "2";
    el.title = "Build";
    el.icon = "🔧";
    el.color = "blue";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("n")).toBe("2");
    expect(el.getAttribute("title")).toBe("Build");
    expect(el.getAttribute("icon")).toBe("🔧");
    expect(el.getAttribute("color")).toBe("blue");
    el.remove();
  });

  it("sets data-standalone when not inside ce-flow", async () => {
    const el = document.createElement("ce-flow-step") as CeFlowStep;
    el.title = "Standalone";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("data-standalone")).toBe(true);
    el.remove();
  });

  it("does not set data-standalone (renders nothing visible) when nested inside ce-flow", async () => {
    const flow = document.createElement("ce-flow") as CeFlow;
    const step = document.createElement("ce-flow-step") as CeFlowStep;
    step.setAttribute("n", "1");
    step.setAttribute("title", "Nested");
    flow.appendChild(step);
    document.body.appendChild(flow);
    await flow.updateComplete;
    await step.updateComplete;
    // When nested the step should NOT have data-standalone
    expect(step.hasAttribute("data-standalone")).toBe(false);
    // And no .ce-fs-wrap rendered in its own shadow root (returns nothing)
    expect(step.shadowRoot?.querySelector(".ce-fs-wrap") ?? null).toBeNull();
    flow.remove();
  });
});

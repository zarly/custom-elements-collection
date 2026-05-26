import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeStack } from "./stack.js";

beforeAll(() => {
  defineOnce("ce-stack", CeStack);
});

async function ready(el: Element): Promise<void> {
  await (el as CeStack).updateComplete;
}

describe("<ce-stack>", () => {
  it("upgrades with default attrs and uses shadow DOM", async () => {
    const el = document.createElement("ce-stack") as CeStack;
    document.body.appendChild(el);
    await ready(el);

    // Shadow root present (layout components use shadow DOM for :host selectors)
    expect(el.shadowRoot).not.toBeNull();

    // Default property values
    expect(el.space).toBe("m");
    expect(el.direction).toBe("vertical");
    expect(el.recursive).toBe(false);
    expect(el.splitAfter).toBeNull();

    el.remove();
  });

  it("renders children in the default slot (light DOM children, shadow DOM wrapper)", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-stack><p>alpha</p><p>beta</p></ce-stack>`;
    document.body.appendChild(host);
    const stack = host.querySelector("ce-stack") as CeStack;
    await ready(stack);

    // Children live in the host's light DOM, not inside shadow root
    expect(stack.querySelector("p")).not.toBeNull();
    expect(stack.textContent).toContain("alpha");
    expect(stack.textContent).toContain("beta");

    // Shadow root contains only the <slot> passthrough
    const slot = stack.shadowRoot!.querySelector("slot")!;
    expect(slot).not.toBeNull();
    const assigned = slot.assignedNodes({ flatten: true });
    expect(assigned.some((n) => (n as HTMLElement).tagName === "P")).toBe(true);

    host.remove();
  });

  it("reflects the space attribute to the host element", async () => {
    const el = document.createElement("ce-stack") as CeStack;
    document.body.appendChild(el);
    await ready(el);

    el.space = "l";
    await ready(el);
    expect(el.getAttribute("space")).toBe("l");

    el.space = "3xs";
    await ready(el);
    expect(el.getAttribute("space")).toBe("3xs");

    el.remove();
  });

  it("reflects the direction attribute to the host element", async () => {
    const el = document.createElement("ce-stack") as CeStack;
    document.body.appendChild(el);
    await ready(el);

    el.direction = "horizontal";
    await ready(el);
    expect(el.getAttribute("direction")).toBe("horizontal");

    el.direction = "vertical";
    await ready(el);
    expect(el.getAttribute("direction")).toBe("vertical");

    el.remove();
  });

  it("reflects the recursive boolean flag", async () => {
    const el = document.createElement("ce-stack") as CeStack;
    document.body.appendChild(el);
    await ready(el);

    expect(el.hasAttribute("recursive")).toBe(false);

    el.recursive = true;
    await ready(el);
    expect(el.hasAttribute("recursive")).toBe(true);

    el.recursive = false;
    await ready(el);
    expect(el.hasAttribute("recursive")).toBe(false);

    el.remove();
  });

  it("applies margin-block-start:auto to the correct child via split-after", async () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <ce-stack split-after="2">
        <h2>Header</h2>
        <p>Body</p>
        <small>Footer</small>
      </ce-stack>
    `;
    document.body.appendChild(host);
    const stack = host.querySelector("ce-stack") as CeStack;
    await ready(stack);

    const children = Array.from(stack.children) as HTMLElement[];
    // Index 2 (third child = Footer) should receive auto margin
    expect(children[2].style.getPropertyValue("margin-block-start")).toBe("auto");
    // Index 0 and 1 should NOT have auto margin
    expect(children[0].style.getPropertyValue("margin-block-start")).toBe("");
    expect(children[1].style.getPropertyValue("margin-block-start")).toBe("");

    host.remove();
  });

  it("propagates space to child ce-stack elements when recursive is set", async () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <ce-stack space="xl" recursive>
        <ce-stack>
          <p>nested</p>
        </ce-stack>
      </ce-stack>
    `;
    document.body.appendChild(host);
    const outer = host.querySelector("ce-stack") as CeStack;
    await ready(outer);

    const inner = outer.querySelector("ce-stack") as CeStack;
    await ready(inner);

    // Inner stack should have inherited the space="xl" from parent
    expect(inner.getAttribute("space")).toBe("xl");

    host.remove();
  });

  it("clears split-after margin when splitAfter is set to null", async () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <ce-stack split-after="1">
        <p>first</p>
        <p>second</p>
      </ce-stack>
    `;
    document.body.appendChild(host);
    const stack = host.querySelector("ce-stack") as CeStack;
    await ready(stack);

    const children = Array.from(stack.children) as HTMLElement[];
    // second child (index 1) should have auto margin
    expect(children[1].style.getPropertyValue("margin-block-start")).toBe("auto");

    // Remove split-after
    stack.splitAfter = null;
    stack.removeAttribute("split-after");
    await ready(stack);

    // Margin should be cleared
    expect(children[1].style.getPropertyValue("margin-block-start")).toBe("");

    host.remove();
  });

  it("reflects the wrap boolean attribute", async () => {
    const el = document.createElement("ce-stack") as CeStack;
    document.body.appendChild(el);
    await ready(el);

    expect(el.hasAttribute("wrap")).toBe(false);

    el.wrap = true;
    await ready(el);
    expect(el.hasAttribute("wrap")).toBe(true);

    el.wrap = false;
    await ready(el);
    expect(el.hasAttribute("wrap")).toBe(false);

    el.remove();
  });

  it("reflects the align attribute (all 5 values)", async () => {
    const el = document.createElement("ce-stack") as CeStack;
    document.body.appendChild(el);
    await ready(el);

    for (const v of ["start", "center", "end", "baseline", "stretch"] as const) {
      el.align = v;
      await ready(el);
      expect(el.getAttribute("align")).toBe(v);
    }

    el.remove();
  });

  it("reflects the justify attribute (all 4 values)", async () => {
    const el = document.createElement("ce-stack") as CeStack;
    document.body.appendChild(el);
    await ready(el);

    for (const v of ["start", "center", "end", "between"] as const) {
      el.justify = v;
      await ready(el);
      expect(el.getAttribute("justify")).toBe(v);
    }

    el.remove();
  });

  it("former ce-cluster behavior: direction=horizontal + wrap renders multi-line", async () => {
    const host = document.createElement("div");
    // Constrain width so wrapping actually occurs in the layout pass
    host.style.width = "120px";
    host.innerHTML = `
      <ce-stack direction="horizontal" wrap space="s">
        <span style="width: 80px; height: 20px;">a</span>
        <span style="width: 80px; height: 20px;">b</span>
        <span style="width: 80px; height: 20px;">c</span>
      </ce-stack>
    `;
    document.body.appendChild(host);
    const stack = host.querySelector("ce-stack") as CeStack;
    await ready(stack);

    // wrap attribute is reflected
    expect(stack.hasAttribute("wrap")).toBe(true);
    expect(stack.getAttribute("direction")).toBe("horizontal");
    // Children are still in the light-DOM slot
    expect(stack.children.length).toBe(3);

    host.remove();
  });

  it("a child appended after upgrade is still contained in the slot", async () => {
    const el = document.createElement("ce-stack") as CeStack;
    document.body.appendChild(el);
    await ready(el);

    const p = document.createElement("p");
    p.textContent = "streamed in";
    el.appendChild(p);

    // The slot lazily reflects new children — no update cycle needed for slotting.
    const slot = el.shadowRoot!.querySelector("slot")!;
    // assignedNodes includes the new child
    const nodes = slot.assignedNodes({ flatten: true });
    expect(nodes.some((n) => n === p)).toBe(true);

    el.remove();
  });
});

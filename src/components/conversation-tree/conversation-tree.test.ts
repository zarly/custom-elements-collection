import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeConversationTree } from "./conversation-tree.js";

beforeAll(() => {
  defineOnce("ce-conversation-tree", CeConversationTree);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeConversationTree).updateComplete;
}

function getEl(host: HTMLElement): CeConversationTree {
  return host.querySelector("ce-conversation-tree")!;
}

function buttons(el: CeConversationTree): [HTMLButtonElement, HTMLButtonElement] {
  const btns = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.btn");
  return [btns[0], btns[1]];
}

describe("<ce-conversation-tree>", () => {
  // Test 1: upgrade + shadow root + two buttons + counter
  it("upgrades, renders shadow root with two buttons and a counter", async () => {
    const host = mount(`<ce-conversation-tree index="2" total="5"></ce-conversation-tree>`);
    const el = getEl(host);
    await ready(el);

    expect(el.shadowRoot).not.toBeNull();
    const [prev, next] = buttons(el);
    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();

    const counter = el.shadowRoot!.querySelector(".counter");
    expect(counter).not.toBeNull();
    expect(counter!.textContent).toContain("2");
    expect(counter!.textContent).toContain("5");

    host.remove();
  });

  // Test 2: default index=1, total=1; both buttons disabled
  it("with default index=1 total=1 both buttons are disabled", async () => {
    const host = mount(`<ce-conversation-tree></ce-conversation-tree>`);
    const el = getEl(host);
    await ready(el);

    const [prev, next] = buttons(el);
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(true);

    host.remove();
  });

  // Test 3: index=2, total=5 — neither button disabled
  it("with index=2 total=5 neither button is disabled", async () => {
    const host = mount(`<ce-conversation-tree index="2" total="5"></ce-conversation-tree>`);
    const el = getEl(host);
    await ready(el);

    const [prev, next] = buttons(el);
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(false);

    host.remove();
  });

  // Test 4: clicking next updates index AND emits both ce-branch-next and ce-branch-select
  it("clicking next increments index and emits ce-branch-next + ce-branch-select", async () => {
    const host = mount(`<ce-conversation-tree index="2" total="5"></ce-conversation-tree>`);
    const el = getEl(host);
    await ready(el);

    const nextEvents: number[] = [];
    const selectEvents: number[] = [];
    el.addEventListener("ce-branch-next", (ev) =>
      nextEvents.push((ev as CustomEvent<{ index: number }>).detail.index)
    );
    el.addEventListener("ce-branch-select", (ev) =>
      selectEvents.push((ev as CustomEvent<{ index: number }>).detail.index)
    );

    const [, next] = buttons(el);
    next.click();
    await ready(el);

    expect(el.index).toBe(3);
    expect(nextEvents).toEqual([3]);
    expect(selectEvents).toEqual([3]);

    host.remove();
  });

  // Test 5: clicking prev at index=1 fires no events and index stays 1
  it("clicking prev at index=1 fires no events and index stays 1", async () => {
    const host = mount(`<ce-conversation-tree index="1" total="5"></ce-conversation-tree>`);
    const el = getEl(host);
    await ready(el);

    const prevEvents: number[] = [];
    const selectEvents: number[] = [];
    el.addEventListener("ce-branch-prev", (ev) =>
      prevEvents.push((ev as CustomEvent<{ index: number }>).detail.index)
    );
    el.addEventListener("ce-branch-select", (ev) =>
      selectEvents.push((ev as CustomEvent<{ index: number }>).detail.index)
    );

    const [prev] = buttons(el);
    // prev button is disabled — pointer-events:none means click won't fire
    // Dispatch directly to be explicit about the boundary condition
    prev.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await ready(el);

    expect(el.index).toBe(1);
    expect(prevEvents).toHaveLength(0);
    expect(selectEvents).toHaveLength(0);

    host.remove();
  });

  // Test 6: at index=5 total=5, next is disabled and click fires no events
  it("at index=5 total=5 next button is disabled and fires no events", async () => {
    const host = mount(`<ce-conversation-tree index="5" total="5"></ce-conversation-tree>`);
    const el = getEl(host);
    await ready(el);

    const nextEvents: number[] = [];
    el.addEventListener("ce-branch-next", (ev) =>
      nextEvents.push((ev as CustomEvent<{ index: number }>).detail.index)
    );

    const [, next] = buttons(el);
    expect(next.disabled).toBe(true);
    next.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await ready(el);

    expect(el.index).toBe(5);
    expect(nextEvents).toHaveLength(0);

    host.remove();
  });

  // Test 7: ArrowRight/ArrowLeft keydown on host triggers next/prev behaviour
  it("ArrowRight fires next behaviour; ArrowLeft fires prev behaviour", async () => {
    const host = mount(`<ce-conversation-tree index="3" total="5"></ce-conversation-tree>`);
    const el = getEl(host);
    await ready(el);

    const nextEvents: number[] = [];
    const prevEvents: number[] = [];
    el.addEventListener("ce-branch-next", (ev) =>
      nextEvents.push((ev as CustomEvent<{ index: number }>).detail.index)
    );
    el.addEventListener("ce-branch-prev", (ev) =>
      prevEvents.push((ev as CustomEvent<{ index: number }>).detail.index)
    );

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await ready(el);
    expect(el.index).toBe(4);
    expect(nextEvents).toEqual([4]);

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await ready(el);
    expect(el.index).toBe(3);
    expect(prevEvents).toEqual([3]);

    host.remove();
  });

  // Test 8: total=0 clamps index to 1 and renders without NaN
  it("total=0 clamps index to 1 and renders gracefully", async () => {
    const host = mount(`<ce-conversation-tree total="0" index="3"></ce-conversation-tree>`);
    const el = getEl(host);
    await ready(el);

    expect(el.index).toBe(1);
    const counter = el.shadowRoot!.querySelector(".counter");
    expect(counter!.textContent).not.toMatch(/NaN/);
    expect(counter!.textContent).toContain("1");

    host.remove();
  });

  // Test 9: disabled prop reflects and prevents both events
  it("disabled reflects to attribute and prevents prev/next events", async () => {
    const host = mount(`<ce-conversation-tree index="3" total="5" disabled></ce-conversation-tree>`);
    const el = getEl(host);
    await ready(el);

    expect(el.disabled).toBe(true);
    expect(el.hasAttribute("disabled")).toBe(true);

    const events: string[] = [];
    el.addEventListener("ce-branch-prev", () => events.push("prev"));
    el.addEventListener("ce-branch-next", () => events.push("next"));
    el.addEventListener("ce-branch-select", () => events.push("select"));

    const [prev, next] = buttons(el);
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(true);

    prev.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    next.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await ready(el);

    expect(events).toHaveLength(0);

    host.remove();
  });
});

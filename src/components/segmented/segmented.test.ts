import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSegmented, CeSegment } from "./segmented.js";

beforeAll(() => {
  defineOnce("ce-segment", CeSegment);
  defineOnce("ce-segmented", CeSegmented);
});

function mount(markup: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeSegmented).updateComplete;
}

describe("<ce-segmented>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-segmented name="view" value="list">
      <ce-segment value="list" label="List"></ce-segment>
      <ce-segment value="grid" label="Grid"></ce-segment>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented")!;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("with slot children: renders 3 segment buttons", async () => {
    const host = mount(`<ce-segmented name="view" value="list">
      <ce-segment value="list" label="List"></ce-segment>
      <ce-segment value="grid" label="Grid"></ce-segment>
      <ce-segment value="kanban" label="Kanban"></ce-segment>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented")!;
    await ready(el);
    // Allow one render cycle after slotchange
    await el.updateComplete;
    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons.length).toBe(3);
    host.remove();
  });

  it("with data array: renders 3 segment buttons", async () => {
    const host = mount(`<ce-segmented name="period" value="7d"
      data='[{"value":"24h","label":"24h"},{"value":"7d","label":"7d"},{"value":"30d","label":"30d"}]'>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented")!;
    await ready(el);
    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons.length).toBe(3);
    host.remove();
  });

  it("reflects value attribute", async () => {
    const host = mount(`<ce-segmented name="period"
      data='[{"value":"24h","label":"24h"},{"value":"7d","label":"7d"}]'
      value="7d">
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented") as CeSegmented;
    await ready(el);
    expect(el.value).toBe("7d");
    expect(el.getAttribute("value")).toBe("7d");
    host.remove();
  });

  it("clicking a segment updates value and emits ce-change", async () => {
    const host = mount(`<ce-segmented name="view" value="list"
      data='[{"value":"list","label":"List"},{"value":"grid","label":"Grid"}]'>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented") as CeSegmented;
    await ready(el);

    const events: CustomEvent[] = [];
    el.addEventListener("ce-change", (e) => events.push(e as CustomEvent));

    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button");
    expect(buttons.length).toBe(2);
    buttons[1].click();
    await ready(el);

    expect(el.value).toBe("grid");
    expect(events.length).toBe(1);
    expect(events[0].detail).toMatchObject({ name: "view", value: "grid" });
    host.remove();
  });

  it("ArrowRight on focused segment moves selection to the next (wraps)", async () => {
    const host = mount(`<ce-segmented name="view" value="list"
      data='[{"value":"list","label":"List"},{"value":"grid","label":"Grid"},{"value":"kanban","label":"Kanban"}]'>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented") as CeSegmented;
    await ready(el);

    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button");
    // Fire ArrowRight from index 0
    buttons[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await ready(el);
    expect(el.value).toBe("grid");

    // Fire ArrowRight from last (index 2) — should wrap to first
    await ready(el);
    const btns2 = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button");
    btns2[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await ready(el);
    expect(el.value).toBe("list");
    host.remove();
  });

  it("ArrowLeft on focused segment moves selection to the previous (wraps)", async () => {
    const host = mount(`<ce-segmented name="view" value="grid"
      data='[{"value":"list","label":"List"},{"value":"grid","label":"Grid"},{"value":"kanban","label":"Kanban"}]'>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented") as CeSegmented;
    await ready(el);

    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button");
    // ArrowLeft from index 1 → index 0
    buttons[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await ready(el);
    expect(el.value).toBe("list");

    // ArrowLeft from index 0 → wraps to index 2
    const btns2 = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button");
    btns2[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await ready(el);
    expect(el.value).toBe("kanban");
    host.remove();
  });

  it("reflects size attribute", async () => {
    const host = mount(`<ce-segmented name="sz" size="sm"
      data='[{"value":"s","label":"S"},{"value":"m","label":"M"}]'>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented") as CeSegmented;
    await ready(el);
    expect(el.getAttribute("size")).toBe("sm");
    expect(el.size).toBe("sm");
    host.remove();
  });

  it("selected segment has aria-checked='true', others 'false'", async () => {
    const host = mount(`<ce-segmented name="view" value="grid"
      data='[{"value":"list","label":"List"},{"value":"grid","label":"Grid"},{"value":"kanban","label":"Kanban"}]'>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented") as CeSegmented;
    await ready(el);

    const buttons = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button"));
    expect(buttons[0].getAttribute("aria-checked")).toBe("false");
    expect(buttons[1].getAttribute("aria-checked")).toBe("true");
    expect(buttons[2].getAttribute("aria-checked")).toBe("false");
    host.remove();
  });

  it("host has role='radiogroup'", async () => {
    const host = mount(`<ce-segmented name="t"
      data='[{"value":"a","label":"A"}]'>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented")!;
    await ready(el);
    expect(el.getAttribute("role")).toBe("radiogroup");
    host.remove();
  });

  it("no value set: first segment gets tabindex=0, none are aria-checked=true", async () => {
    const host = mount(`<ce-segmented name="view"
      data='[{"value":"list","label":"List"},{"value":"grid","label":"Grid"}]'>
    </ce-segmented>`);
    const el = host.querySelector("ce-segmented") as CeSegmented;
    await ready(el);
    const buttons = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button"));
    expect(buttons[0].tabIndex).toBe(0);
    expect(buttons[1].tabIndex).toBe(-1);
    expect(buttons.every((b) => b.getAttribute("aria-checked") === "false")).toBe(true);
    host.remove();
  });
});

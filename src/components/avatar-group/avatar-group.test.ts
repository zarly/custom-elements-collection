import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeAvatar } from "../avatar/avatar.js";
import { CeAvatarGroup } from "./avatar-group.js";

beforeAll(() => {
  defineOnce("ce-avatar", CeAvatar);
  defineOnce("ce-avatar-group", CeAvatarGroup);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeAvatarGroup).updateComplete;
}

describe("<ce-avatar-group>", () => {
  it("renders all children when total ≤ max", async () => {
    const host = mount(`
      <ce-avatar-group max="4">
        <ce-avatar name="A B"></ce-avatar>
        <ce-avatar name="C D"></ce-avatar>
        <ce-avatar name="E F"></ce-avatar>
      </ce-avatar-group>
    `);
    const el = host.querySelector("ce-avatar-group") as CeAvatarGroup;
    await ready(el);
    const more = el.shadowRoot!.querySelector(".ce-avatar-group__more");
    expect(more).toBeNull();
    const visible = Array.from(el.querySelectorAll("ce-avatar")).filter(
      (a) => (a as HTMLElement).style.display !== "none"
    );
    expect(visible.length).toBe(3);
    host.remove();
  });

  it("shows +N overflow chip when total > max", async () => {
    const host = mount(`
      <ce-avatar-group max="2">
        <ce-avatar name="A"></ce-avatar>
        <ce-avatar name="B"></ce-avatar>
        <ce-avatar name="C"></ce-avatar>
        <ce-avatar name="D"></ce-avatar>
      </ce-avatar-group>
    `);
    const el = host.querySelector("ce-avatar-group") as CeAvatarGroup;
    await ready(el);
    const more = el.shadowRoot!.querySelector(".ce-avatar-group__more");
    expect(more).not.toBeNull();
    expect(more!.textContent?.trim()).toBe("+2");
    host.remove();
  });

  it("hides children beyond max", async () => {
    const host = mount(`
      <ce-avatar-group max="2">
        <ce-avatar name="A"></ce-avatar>
        <ce-avatar name="B"></ce-avatar>
        <ce-avatar name="C"></ce-avatar>
      </ce-avatar-group>
    `);
    const el = host.querySelector("ce-avatar-group") as CeAvatarGroup;
    await ready(el);
    const kids = el.querySelectorAll("ce-avatar");
    expect((kids[0] as HTMLElement).style.display).toBe("");
    expect((kids[1] as HTMLElement).style.display).toBe("");
    expect((kids[2] as HTMLElement).style.display).toBe("none");
    host.remove();
  });

  it("accepts arbitrary HTML children (CDR-006)", async () => {
    const host = mount(`
      <ce-avatar-group max="5">
        <span class="x">X</span>
        <ce-avatar name="A"></ce-avatar>
      </ce-avatar-group>
    `);
    const el = host.querySelector("ce-avatar-group") as CeAvatarGroup;
    await ready(el);
    expect(el.querySelector(".x")).not.toBeNull();
    host.remove();
  });

  it("propagates size to ce-avatar children", async () => {
    const host = mount(`
      <ce-avatar-group size="lg">
        <ce-avatar name="A B"></ce-avatar>
      </ce-avatar-group>
    `);
    const el = host.querySelector("ce-avatar-group") as CeAvatarGroup;
    await ready(el);
    const av = el.querySelector("ce-avatar") as CeAvatar;
    await av.updateComplete;
    expect(av.size).toBe("lg");
    host.remove();
  });

  it("recounts after a child is appended", async () => {
    const host = mount(`
      <ce-avatar-group max="2">
        <ce-avatar name="A"></ce-avatar>
        <ce-avatar name="B"></ce-avatar>
      </ce-avatar-group>
    `);
    const el = host.querySelector("ce-avatar-group") as CeAvatarGroup;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".ce-avatar-group__more")).toBeNull();
    const extra = document.createElement("ce-avatar");
    extra.setAttribute("name", "C");
    el.appendChild(extra);
    await ready(el);
    // allow slotchange to flush
    await new Promise((r) => setTimeout(r, 0));
    await ready(el);
    expect(el.shadowRoot!.querySelector(".ce-avatar-group__more")?.textContent?.trim()).toBe("+1");
    host.remove();
  });
});

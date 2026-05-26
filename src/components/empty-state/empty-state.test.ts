import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeEmptyState } from "./empty-state.js";

beforeAll(() => {
  defineOnce("ce-empty-state", CeEmptyState);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeEmptyState).updateComplete;
}

describe("<ce-empty-state>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-empty-state>Description text</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state")!;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.textContent).toContain("Description text");
    host.remove();
  });

  it("defaults to size='md' when no size attribute is set", async () => {
    const host = mount(`<ce-empty-state>Body</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    expect(el.size).toBe("md");
    expect(el.getAttribute("size")).toBe("md");
    host.remove();
  });

  it("reflects size attribute — sm", async () => {
    const host = mount(`<ce-empty-state size="sm">Body</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    expect(el.size).toBe("sm");
    expect(el.getAttribute("size")).toBe("sm");
    host.remove();
  });

  it("reflects size attribute — lg", async () => {
    const host = mount(`<ce-empty-state size="lg">Body</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    expect(el.size).toBe("lg");
    expect(el.getAttribute("size")).toBe("lg");
    host.remove();
  });

  it("reflects icon attribute", async () => {
    const host = mount(`<ce-empty-state icon="inbox">Body</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    expect(el.icon).toBe("inbox");
    expect(el.getAttribute("icon")).toBe("inbox");
    host.remove();
  });

  it("has role='status' on the host element", async () => {
    const host = mount(`<ce-empty-state>Body</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    expect(el.getAttribute("role")).toBe("status");
    host.remove();
  });

  it("renders all named slots and default slot in shadow DOM", async () => {
    const host = mount(`
      <ce-empty-state icon="📭">
        <svg slot="illustration" viewBox="0 0 32 32" width="32" height="32"></svg>
        <span slot="title">No messages</span>
        You are all caught up.
        <button slot="actions">Compose</button>
      </ce-empty-state>
    `);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    const shadow = el.shadowRoot!;
    const slots = Array.from(shadow.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("illustration");
    expect(names).toContain("title");
    expect(names).toContain("actions");
    expect(names).toContain("default");
    host.remove();
  });

  it("renders the icon badge when icon is set and no illustration slot is present", async () => {
    const host = mount(`<ce-empty-state icon="📬">No mail</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    const badge = el.shadowRoot!.querySelector(".ce-empty-state__icon-badge");
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe("📬");
    host.remove();
  });

  it("does NOT render the icon badge when illustration slot is filled", async () => {
    const host = mount(`
      <ce-empty-state icon="📬">
        <svg slot="illustration" viewBox="0 0 32 32" width="32" height="32"></svg>
        Body
      </ce-empty-state>
    `);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    const badge = el.shadowRoot!.querySelector(".ce-empty-state__icon-badge");
    // When illustration slot is slotted, the icon badge is suppressed
    expect(badge).toBeNull();
    host.remove();
  });

  it("renders with zero attributes — no crash, sensible DOM structure", async () => {
    const host = mount(`<ce-empty-state></ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    const wrapper = el.shadowRoot!.querySelector(".ce-empty-state");
    expect(wrapper).not.toBeNull();
    host.remove();
  });

  it("defaults to severity='none' when no severity attribute is set", async () => {
    const host = mount(`<ce-empty-state>Body</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    expect(el.severity).toBe("none");
    expect(el.getAttribute("severity")).toBe("none");
    host.remove();
  });

  it("reflects severity attribute (all 4 tinted values)", async () => {
    for (const sev of ["success", "error", "info", "warning"] as const) {
      const host = mount(`<ce-empty-state severity="${sev}">Body</ce-empty-state>`);
      const el = host.querySelector("ce-empty-state") as CeEmptyState;
      await ready(el);
      expect(el.severity).toBe(sev);
      expect(el.getAttribute("severity")).toBe(sev);
      host.remove();
    }
  });

  it("auto-derives icon from severity when icon attribute is unset", async () => {
    const host = mount(`<ce-empty-state severity="success">Order placed</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    const badge = el.shadowRoot!.querySelector(".ce-empty-state__icon-badge");
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe("check-circle");
    host.remove();
  });

  it("explicit icon attribute overrides severity-default", async () => {
    const host = mount(`<ce-empty-state severity="error" icon="cloud-off">Down</ce-empty-state>`);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    const badge = el.shadowRoot!.querySelector(".ce-empty-state__icon-badge");
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe("cloud-off");
    host.remove();
  });

  it("renders details slot inside <details> wrapper", async () => {
    const host = mount(`
      <ce-empty-state severity="error">
        <span slot="title">Failed</span>
        Could not save.
        <pre slot="details">Error 503 — gateway timeout</pre>
      </ce-empty-state>
    `);
    const el = host.querySelector("ce-empty-state") as CeEmptyState;
    await ready(el);
    const details = el.shadowRoot!.querySelector("details.ce-empty-state__details");
    expect(details).not.toBeNull();
    const slot = details!.querySelector("slot[name='details']") as HTMLSlotElement;
    expect(slot).not.toBeNull();
    const assigned = slot.assignedNodes({ flatten: true });
    expect(assigned.some((n) => (n as HTMLElement).tagName === "PRE")).toBe(true);
    host.remove();
  });
});

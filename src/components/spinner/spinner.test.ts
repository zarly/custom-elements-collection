import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSpinner } from "./spinner.js";

beforeAll(() => {
  defineOnce("ce-spinner", CeSpinner);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeSpinner).updateComplete;
}

describe("<ce-spinner>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-spinner></ce-spinner>`);
    const spinner = host.querySelector("ce-spinner")!;
    await ready(spinner);
    expect(spinner.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("applies default size='md' and label='Loading'", async () => {
    const host = mount(`<ce-spinner></ce-spinner>`);
    const spinner = host.querySelector("ce-spinner") as CeSpinner;
    await ready(spinner);
    expect(spinner.size).toBe("md");
    expect(spinner.label).toBe("Loading");
    host.remove();
  });

  it("reflects size attribute", async () => {
    const host = mount(`<ce-spinner size="sm"></ce-spinner>`);
    const spinner = host.querySelector("ce-spinner") as CeSpinner;
    await ready(spinner);
    expect(spinner.getAttribute("size")).toBe("sm");
    expect(spinner.size).toBe("sm");
    // change programmatically
    spinner.size = "lg";
    await ready(spinner);
    expect(spinner.getAttribute("size")).toBe("lg");
    host.remove();
  });

  it("reflects tone attribute", async () => {
    const host = mount(`<ce-spinner tone="accent"></ce-spinner>`);
    const spinner = host.querySelector("ce-spinner") as CeSpinner;
    await ready(spinner);
    expect(spinner.getAttribute("tone")).toBe("accent");
    expect(spinner.tone).toBe("accent");
    // change to muted
    spinner.tone = "muted";
    await ready(spinner);
    expect(spinner.getAttribute("tone")).toBe("muted");
    host.remove();
  });

  it("sets aria-label from label attribute on first render", async () => {
    const host = mount(`<ce-spinner label="Uploading"></ce-spinner>`);
    const spinner = host.querySelector("ce-spinner") as CeSpinner;
    await ready(spinner);
    expect(spinner.getAttribute("aria-label")).toBe("Uploading");
    host.remove();
  });

  it("updates aria-label when label property changes", async () => {
    const host = mount(`<ce-spinner></ce-spinner>`);
    const spinner = host.querySelector("ce-spinner") as CeSpinner;
    await ready(spinner);
    expect(spinner.getAttribute("aria-label")).toBe("Loading");
    spinner.label = "Saving";
    await ready(spinner);
    expect(spinner.getAttribute("aria-label")).toBe("Saving");
    host.remove();
  });

  it("has role='status' on the host element", async () => {
    const host = mount(`<ce-spinner></ce-spinner>`);
    const spinner = host.querySelector("ce-spinner") as CeSpinner;
    await ready(spinner);
    expect(spinner.getAttribute("role")).toBe("status");
    host.remove();
  });

  it("renders the .spinner element inside shadow DOM", async () => {
    const host = mount(`<ce-spinner></ce-spinner>`);
    const spinner = host.querySelector("ce-spinner") as CeSpinner;
    await ready(spinner);
    const inner = spinner.shadowRoot!.querySelector(".spinner");
    expect(inner).not.toBeNull();
    // inner is aria-hidden so screen readers don't describe the decoration
    expect(inner!.getAttribute("aria-hidden")).toBe("true");
    host.remove();
  });

  it("works with all four size values", async () => {
    for (const size of ["xs", "sm", "md", "lg"] as const) {
      const host = mount(`<ce-spinner size="${size}"></ce-spinner>`);
      const spinner = host.querySelector("ce-spinner") as CeSpinner;
      await ready(spinner);
      expect(spinner.getAttribute("size")).toBe(size);
      host.remove();
    }
  });
});

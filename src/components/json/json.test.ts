import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeJson } from "./json.js";

beforeAll(() => {
  defineOnce("ce-json", CeJson);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeJson).updateComplete;
}

describe("<ce-json>", () => {
  it("formats valid JSON via src attribute", async () => {
    const host = mount(`<ce-json src='{"a":1,"b":[2,3]}'></ce-json>`);
    const el = host.querySelector("ce-json") as CeJson;
    await ready(el);
    const pre = el.shadowRoot!.querySelector("pre")!;
    expect(pre.textContent).toContain('"a": 1');
    expect(pre.textContent).toContain('"b": [');
    host.remove();
  });

  it("emits ce-json-parse-error on malformed input", async () => {
    let detail: any = null;
    document.addEventListener("ce-json-parse-error", (e) => {
      detail = (e as CustomEvent).detail;
    }, { once: true });
    const host = mount(`<ce-json src='{not json'></ce-json>`);
    const el = host.querySelector("ce-json") as CeJson;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".err")).not.toBeNull();
    expect(detail).not.toBeNull();
    host.remove();
  });

  it("max-length truncates output", async () => {
    const big = JSON.stringify(Array.from({ length: 100 }, (_, i) => i));
    const host = mount(`<ce-json src=${JSON.stringify(big)} max-length="50"></ce-json>`);
    const el = host.querySelector("ce-json") as CeJson;
    await ready(el);
    const pre = el.shadowRoot!.querySelector("pre")!;
    expect(pre.textContent!.length).toBeLessThan(60);
    expect(pre.textContent).toContain("…");
    host.remove();
  });

  it("collapsed hides the pre", async () => {
    const host = mount(`<ce-json collapsed src='{"a":1}'></ce-json>`);
    const el = host.querySelector("ce-json") as CeJson;
    await ready(el);
    expect(el.shadowRoot!.querySelector("pre")).toBeNull();
    host.remove();
  });

  it("toggle button switches collapse state", async () => {
    const host = mount(`<ce-json src='{"a":1}'></ce-json>`);
    const el = host.querySelector("ce-json") as CeJson;
    await ready(el);
    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    btn.click();
    await ready(el);
    expect(el.shadowRoot!.querySelector("pre")).toBeNull();
    btn.click();
    await ready(el);
    expect(el.shadowRoot!.querySelector("pre")).not.toBeNull();
    host.remove();
  });

  it("indent attribute changes formatting", async () => {
    const host = mount(`<ce-json src='{"a":1}' indent="4"></ce-json>`);
    const el = host.querySelector("ce-json") as CeJson;
    await ready(el);
    expect(el.shadowRoot!.querySelector("pre")!.textContent).toContain('    "a"');
    host.remove();
  });

  it("summary describes object", async () => {
    const host = mount(`<ce-json src='{"a":1,"b":2,"c":3}'></ce-json>`);
    const el = host.querySelector("ce-json") as CeJson;
    await ready(el);
    expect(el.shadowRoot!.querySelector("button")!.textContent).toContain("Object{3}");
    host.remove();
  });
});

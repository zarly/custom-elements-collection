import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeKv } from "./kv.js";

beforeAll(() => defineOnce("ce-kv", CeKv));

describe("<ce-kv>", () => {
  it("renders key label in .ce-kv__key", async () => {
    const el = document.createElement("ce-kv") as CeKv;
    el.key = "Model";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-kv__key")?.textContent).toBe("Model");
    el.remove();
  });

  it("renders value slot in .ce-kv__value", async () => {
    const el = document.createElement("ce-kv") as CeKv;
    el.key = "Status";
    el.textContent = "Active";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-kv__value slot")).not.toBeNull();
    el.remove();
  });

  it("key defaults to empty string", async () => {
    const el = document.createElement("ce-kv") as CeKv;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.key).toBe("");
    el.remove();
  });

  it("key attribute sets property", async () => {
    const el = document.createElement("ce-kv") as CeKv;
    el.setAttribute("key", "Phone");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.key).toBe("Phone");
    el.remove();
  });

  it("accepts link element as slot child", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-kv key="Docs"><a href="https://example.com">Guide</a></ce-kv>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-kv") as CeKv;
    await el.updateComplete;
    expect(el.querySelector("a")?.textContent).toBe("Guide");
    host.remove();
  });

  it("accepts time element as slot child", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-kv key="Updated"><time datetime="2026-05-18">May 18, 2026</time></ce-kv>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-kv") as CeKv;
    await el.updateComplete;
    expect(el.querySelector("time")?.getAttribute("datetime")).toBe("2026-05-18");
    host.remove();
  });

  it("renders grid layout structure: key span + value span", async () => {
    const el = document.createElement("ce-kv") as CeKv;
    el.key = "Region";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-kv__key")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-kv__value")).not.toBeNull();
    el.remove();
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeToc } from "./toc.js";

beforeAll(() => defineOnce("ce-toc", CeToc));

describe("<ce-toc>", () => {
  it("renders entries as links with hrefs", async () => {
    const el = document.createElement("ce-toc") as CeToc;
    el.entries = [
      { href: "intro", label: "Intro" },
      { href: "stats", label: "Stats" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const links = el.shadowRoot!.querySelectorAll("a");
    expect(links.length).toBe(2);
    expect((links[0] as HTMLAnchorElement).getAttribute("href")).toBe("#intro");
    expect(links[0].textContent).toBe("Intro");
    el.remove();
  });

  it("uses <ol> when numbered", async () => {
    const el = document.createElement("ce-toc") as CeToc;
    el.numbered = true;
    el.entries = [{ href: "a", label: "A" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("ol")).not.toBeNull();
    el.remove();
  });

  it("uses <ul> when not numbered", async () => {
    const el = document.createElement("ce-toc") as CeToc;
    el.entries = [{ href: "a", label: "A" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("ul")).not.toBeNull();
    el.remove();
  });

  it("reflects sticky and numbered attributes", async () => {
    const el = document.createElement("ce-toc") as CeToc;
    el.sticky = true;
    el.numbered = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("sticky")).toBe(true);
    expect(el.hasAttribute("numbered")).toBe(true);
    el.remove();
  });

  it("falls back to a slot when entries is empty", async () => {
    const el = document.createElement("ce-toc") as CeToc;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("slot")).not.toBeNull();
    el.remove();
  });

  it("has nav with aria-label", async () => {
    const el = document.createElement("ce-toc") as CeToc;
    el.entries = [{ href: "a", label: "A" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("nav")?.getAttribute("aria-label")).toBe(
      "Table of contents"
    );
    el.remove();
  });

  it("parses entries from a JSON attribute before append", async () => {
    const el = document.createElement("ce-toc") as CeToc;
    const value = [
      { href: "intro", label: "Intro" },
      { href: "stats", label: "Stats" },
    ];
    el.setAttribute("entries", JSON.stringify(value));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.entries).toEqual(value);
    const links = el.shadowRoot!.querySelectorAll("a");
    expect(links.length).toBe(2);
    expect((links[0] as HTMLAnchorElement).getAttribute("href")).toBe("#intro");
    el.remove();
  });

  it("falls back to [] when entries attribute is invalid JSON", async () => {
    const el = document.createElement("ce-toc") as CeToc;
    el.setAttribute("entries", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.entries).toEqual([]);
    el.remove();
  });
});

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeShell } from "./shell.js";

beforeAll(() => defineOnce("ce-shell", CeShell));

afterEach(() => {
  document.documentElement.removeAttribute("data-ce-scaffold");
  document.documentElement.removeAttribute("data-ce-theme");
  document.body.innerHTML = "";
});

describe("<ce-shell>", () => {
  it("sets data-ce-scaffold on <html> when mounted", async () => {
    const el = document.createElement("ce-shell");
    document.body.appendChild(el);
    await (el as CeShell).updateComplete;
    expect(document.documentElement.hasAttribute("data-ce-scaffold")).toBe(true);
  });

  it("defaults theme to dark and applies it", async () => {
    const el = document.createElement("ce-shell") as CeShell;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(document.documentElement.getAttribute("data-ce-theme")).toBe("dark");
  });

  it("respects a pre-existing data-ce-theme on <html>", async () => {
    document.documentElement.setAttribute("data-ce-theme", "light");
    const el = document.createElement("ce-shell") as CeShell;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(document.documentElement.getAttribute("data-ce-theme")).toBe("light");
  });

  it("updates data-ce-theme when the theme property changes", async () => {
    const el = document.createElement("ce-shell") as CeShell;
    document.body.appendChild(el);
    await el.updateComplete;
    el.theme = "light";
    await el.updateComplete;
    expect(document.documentElement.getAttribute("data-ce-theme")).toBe("light");
  });

  it("reflects width attribute", async () => {
    const el = document.createElement("ce-shell") as CeShell;
    el.width = "wide";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("width")).toBe("wide");
  });
});

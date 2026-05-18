import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonNote } from "./lesson-note.js";

beforeAll(() => defineOnce("lesson-note", LessonNote));

describe("<lesson-note>", () => {
  it("renders default slot content", async () => {
    const el = document.createElement("lesson-note") as LessonNote;
    el.textContent = "Test content";
    document.body.appendChild(el);
    await el.updateComplete;
    const slot = el.shadowRoot!.querySelector("slot");
    expect(slot).not.toBeNull();
    el.remove();
  });

  it("default type is info", async () => {
    const el = document.createElement("lesson-note") as LessonNote;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.type).toBe("info");
    el.remove();
  });

  it("auto-selects icon for tip type", async () => {
    const el = document.createElement("lesson-note") as LessonNote;
    el.type = "tip";
    document.body.appendChild(el);
    await el.updateComplete;
    const icon = el.shadowRoot!.querySelector(".ln-icon");
    expect(icon?.textContent).toBe("💡");
    el.remove();
  });

  it("auto-selects icon for warning type", async () => {
    const el = document.createElement("lesson-note") as LessonNote;
    el.type = "warning";
    document.body.appendChild(el);
    await el.updateComplete;
    const icon = el.shadowRoot!.querySelector(".ln-icon");
    expect(icon?.textContent).toBe("⚠");
    el.remove();
  });

  it("auto-selects icon for danger type", async () => {
    const el = document.createElement("lesson-note") as LessonNote;
    el.type = "danger";
    document.body.appendChild(el);
    await el.updateComplete;
    const icon = el.shadowRoot!.querySelector(".ln-icon");
    expect(icon?.textContent).toBe("🚨");
    el.remove();
  });

  it("auto-selects icon for key type", async () => {
    const el = document.createElement("lesson-note") as LessonNote;
    el.type = "key";
    document.body.appendChild(el);
    await el.updateComplete;
    const icon = el.shadowRoot!.querySelector(".ln-icon");
    expect(icon?.textContent).toBe("🔑");
    el.remove();
  });

  it("icon prop overrides auto-icon", async () => {
    const el = document.createElement("lesson-note") as LessonNote;
    el.type = "tip";
    el.icon = "★";
    document.body.appendChild(el);
    await el.updateComplete;
    const icon = el.shadowRoot!.querySelector(".ln-icon");
    expect(icon?.textContent).toBe("★");
    el.remove();
  });

  it("type=danger reflects on host", async () => {
    const el = document.createElement("lesson-note") as LessonNote;
    el.type = "danger";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("type")).toBe("danger");
    el.remove();
  });

  it("shadowRoot contains .ln-wrap element", async () => {
    const el = document.createElement("lesson-note") as LessonNote;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ln-wrap")).not.toBeNull();
    el.remove();
  });
});

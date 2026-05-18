import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonStep } from "./lesson-step.js";

beforeAll(() => defineOnce("lesson-step", LessonStep));

describe("<lesson-step>", () => {
  it("renders number in badge when status is pending", async () => {
    const el = document.createElement("lesson-step") as LessonStep;
    el.number = "3";
    document.body.appendChild(el);
    await el.updateComplete;
    const badge = el.shadowRoot!.querySelector(".ls-badge");
    expect(badge?.textContent?.trim()).toBe("3");
    el.remove();
  });

  it("renders number in badge when status is active", async () => {
    const el = document.createElement("lesson-step") as LessonStep;
    el.number = "2";
    el.status = "active";
    document.body.appendChild(el);
    await el.updateComplete;
    const badge = el.shadowRoot!.querySelector(".ls-badge");
    expect(badge?.textContent?.trim()).toBe("2");
    el.remove();
  });

  it("renders checkmark in badge when status is done", async () => {
    const el = document.createElement("lesson-step") as LessonStep;
    el.number = "1";
    el.status = "done";
    document.body.appendChild(el);
    await el.updateComplete;
    const badge = el.shadowRoot!.querySelector(".ls-badge");
    expect(badge?.textContent?.trim()).toBe("✓");
    el.remove();
  });

  it("title appears in .ls-title", async () => {
    const el = document.createElement("lesson-step") as LessonStep;
    el.title = "Configure the environment";
    document.body.appendChild(el);
    await el.updateComplete;
    const titleEl = el.shadowRoot!.querySelector(".ls-title");
    expect(titleEl?.textContent?.trim()).toBe("Configure the environment");
    el.remove();
  });

  it("status reflects on host element", async () => {
    const el = document.createElement("lesson-step") as LessonStep;
    el.status = "done";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("status")).toBe("done");
    el.remove();
  });

  it("default slot renders body content", async () => {
    const el = document.createElement("lesson-step") as LessonStep;
    el.textContent = "Run the install command.";
    document.body.appendChild(el);
    await el.updateComplete;
    const slot = el.shadowRoot!.querySelector("slot");
    expect(slot).not.toBeNull();
    el.remove();
  });

  it("default status is pending", async () => {
    const el = document.createElement("lesson-step") as LessonStep;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.status).toBe("pending");
    el.remove();
  });

  it("active status reflects on host", async () => {
    const el = document.createElement("lesson-step") as LessonStep;
    el.status = "active";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("status")).toBe("active");
    el.remove();
  });
});

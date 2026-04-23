import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeCallout } from "./callout.js";

beforeAll(() => defineOnce("ce-callout", CeCallout));

describe("<ce-callout>", () => {
  it("defaults type to info and reflects it", async () => {
    const el = document.createElement("ce-callout") as CeCallout;
    el.textContent = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("type")).toBe("info");
    el.remove();
  });

  it("renders a title when title attribute is set", async () => {
    const el = document.createElement("ce-callout") as CeCallout;
    el.title = "Heads up";
    el.textContent = "body";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-callout__title")?.textContent?.trim()).toBe(
      "Heads up"
    );
    el.remove();
  });

  it("omits the title row when title is null and no title slot content is present", async () => {
    const el = document.createElement("ce-callout") as CeCallout;
    el.textContent = "body only";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-callout__title")).toBeNull();
    el.remove();
  });

  it("renders a title row when a [slot=title] child is provided", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-callout><b slot="title">Bold title</b>body</ce-callout>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-callout") as CeCallout;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-callout__title")).not.toBeNull();
    host.remove();
  });

  it("accepts type=danger", async () => {
    const el = document.createElement("ce-callout") as CeCallout;
    el.type = "danger";
    el.textContent = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("type")).toBe("danger");
    el.remove();
  });
});

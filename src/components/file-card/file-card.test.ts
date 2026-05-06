import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFileCard } from "./file-card.js";

beforeAll(() => {
  defineOnce("ce-file-card", CeFileCard);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeFileCard).updateComplete;
}

describe("<ce-file-card>", () => {
  it("renders name and meta", async () => {
    const host = mount(
      `<ce-file-card name="report.pdf" size="1048576" type="pdf"></ce-file-card>`
    );
    const el = host.querySelector("ce-file-card") as CeFileCard;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".name")!.textContent).toBe("report.pdf");
    expect(el.shadowRoot!.querySelector(".meta")!.textContent).toContain("PDF");
    expect(el.shadowRoot!.querySelector(".meta")!.textContent).toContain("MB");
    host.remove();
  });

  it("href turns wrapper into anchor", async () => {
    const host = mount(`<ce-file-card name="x" href="/files/x"></ce-file-card>`);
    const el = host.querySelector("ce-file-card") as CeFileCard;
    await ready(el);
    expect(el.shadowRoot!.querySelector("a")).not.toBeNull();
    expect(el.shadowRoot!.querySelector("a")!.getAttribute("href")).toBe("/files/x");
    host.remove();
  });

  it("emits ce-file-open on click", async () => {
    const host = mount(`<ce-file-card name="x.pdf" href="/x"></ce-file-card>`);
    const el = host.querySelector("ce-file-card") as CeFileCard;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-file-open", (e) => {
      (e as MouseEvent).preventDefault();
      detail = (e as CustomEvent).detail;
    });
    const a = el.shadowRoot!.querySelector("a") as HTMLAnchorElement;
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(detail).toEqual({ name: "x.pdf", href: "/x" });
    host.remove();
  });

  it("thumbnail renders img instead of icon", async () => {
    const host = mount(
      `<ce-file-card name="img.jpg" thumbnail="/thumb.jpg"></ce-file-card>`
    );
    const el = host.querySelector("ce-file-card") as CeFileCard;
    await ready(el);
    expect(el.shadowRoot!.querySelector("img.thumb")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".icon")).toBeNull();
    host.remove();
  });

  it("falls back to default icon for unknown type", async () => {
    const host = mount(`<ce-file-card name="weirdfile.xyz"></ce-file-card>`);
    const el = host.querySelector("ce-file-card") as CeFileCard;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".icon")!.textContent).toContain("📄");
    host.remove();
  });

  it("no href renders div with role=group", async () => {
    const host = mount(`<ce-file-card name="x.pdf"></ce-file-card>`);
    const el = host.querySelector("ce-file-card") as CeFileCard;
    await ready(el);
    const grp = el.shadowRoot!.querySelector("[role=group]");
    expect(grp).not.toBeNull();
    expect(el.shadowRoot!.querySelector("a")).toBeNull();
    host.remove();
  });

  it("inferred type from extension", async () => {
    const host = mount(`<ce-file-card name="data.csv" size="500"></ce-file-card>`);
    const el = host.querySelector("ce-file-card") as CeFileCard;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".icon")!.textContent).toContain("📗");
    host.remove();
  });
});

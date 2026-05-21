import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFileUpload } from "./file-upload.js";

beforeAll(() => {
  defineOnce("ce-file-upload", CeFileUpload);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeFileUpload).updateComplete;
}

function makeFile(name: string, type = "text/plain"): File {
  return new File(["x"], name, { type });
}

/** Synthesise a drop event with a dataTransfer.files payload that survives
 *  happy-dom / jsdom environments that lack the DataTransfer constructor. */
function dropEvent(files: File[]): Event {
  const evt = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(evt, "dataTransfer", { value: { files }, configurable: true });
  return evt;
}

describe("<ce-file-upload>", () => {
  it("renders an idle dropzone with default label and hint", async () => {
    const host = mount(`<ce-file-upload></ce-file-upload>`);
    const fu = host.querySelector("ce-file-upload") as CeFileUpload;
    await ready(fu);
    expect(fu.shadowRoot!.querySelector(".label")!.textContent).toContain("Choose a file");
    expect(fu.shadowRoot!.querySelector(".hint")!.textContent).toContain("drag it here");
    host.remove();
  });

  it("uses label and hint attributes when provided", async () => {
    const host = mount(
      `<ce-file-upload label="Upload screenshot" hint="PNG or JPG"></ce-file-upload>`,
    );
    const fu = host.querySelector("ce-file-upload") as CeFileUpload;
    await ready(fu);
    expect(fu.shadowRoot!.querySelector(".label")!.textContent).toContain("Upload screenshot");
    expect(fu.shadowRoot!.querySelector(".hint")!.textContent).toContain("PNG or JPG");
    host.remove();
  });

  it("forwards accept and multiple to the native input", async () => {
    const host = mount(
      `<ce-file-upload accept="image/*" multiple></ce-file-upload>`,
    );
    const fu = host.querySelector("ce-file-upload") as CeFileUpload;
    await ready(fu);
    const input = fu.shadowRoot!.querySelector("input[type=file]") as HTMLInputElement;
    expect(input.accept).toBe("image/*");
    expect(input.multiple).toBe(true);
    host.remove();
  });

  it("emits ce-files with detail.name + detail.files on change", async () => {
    const host = mount(`<ce-file-upload name="attachments" multiple></ce-file-upload>`);
    const fu = host.querySelector("ce-file-upload") as CeFileUpload;
    await ready(fu);
    let detail: { name: string; files: File[] } | null = null;
    fu.addEventListener("ce-files", (e) => {
      detail = (e as CustomEvent<{ name: string; files: File[] }>).detail;
    });
    const input = fu.shadowRoot!.querySelector("input[type=file]") as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [makeFile("a.txt"), makeFile("b.txt")],
      configurable: true,
    });
    input.dispatchEvent(new Event("change"));
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe("attachments");
    expect(detail!.files.length).toBe(2);
    host.remove();
  });

  it("emits ce-files on drop with dropped files", async () => {
    const host = mount(`<ce-file-upload name="x"></ce-file-upload>`);
    const fu = host.querySelector("ce-file-upload") as CeFileUpload;
    await ready(fu);
    let detail: { files: File[] } | null = null;
    fu.addEventListener("ce-files", (e) => {
      detail = (e as CustomEvent<{ files: File[] }>).detail;
    });
    const zone = fu.shadowRoot!.querySelector(".zone")!;
    zone.dispatchEvent(dropEvent([makeFile("dropped.txt")]));
    expect(detail).not.toBeNull();
    expect(detail!.files[0].name).toBe("dropped.txt");
    host.remove();
  });

  it("truncates dropped files to one when multiple is not set", async () => {
    const host = mount(`<ce-file-upload></ce-file-upload>`);
    const fu = host.querySelector("ce-file-upload") as CeFileUpload;
    await ready(fu);
    let detail: { files: File[] } | null = null;
    fu.addEventListener("ce-files", (e) => {
      detail = (e as CustomEvent<{ files: File[] }>).detail;
    });
    const zone = fu.shadowRoot!.querySelector(".zone")!;
    zone.dispatchEvent(dropEvent([makeFile("a.txt"), makeFile("b.txt")]));
    expect(detail!.files.length).toBe(1);
    host.remove();
  });

  it("reflects disabled and sets aria-disabled + tabindex=-1", async () => {
    const host = mount(`<ce-file-upload disabled></ce-file-upload>`);
    const fu = host.querySelector("ce-file-upload") as CeFileUpload;
    await ready(fu);
    expect(fu.hasAttribute("disabled")).toBe(true);
    const zone = fu.shadowRoot!.querySelector(".zone") as HTMLElement;
    expect(zone.getAttribute("aria-disabled")).toBe("true");
    expect(zone.getAttribute("tabindex")).toBe("-1");
    host.remove();
  });

  it("ignores drop events when disabled", async () => {
    const host = mount(`<ce-file-upload disabled></ce-file-upload>`);
    const fu = host.querySelector("ce-file-upload") as CeFileUpload;
    await ready(fu);
    let fired = 0;
    fu.addEventListener("ce-files", () => fired++);
    const zone = fu.shadowRoot!.querySelector(".zone")!;
    zone.dispatchEvent(dropEvent([makeFile("a.txt")]));
    expect(fired).toBe(0);
    host.remove();
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CePagination } from "./pagination.js";

beforeAll(() => {
  defineOnce("ce-pagination", CePagination);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CePagination).updateComplete;
}

function pageButtons(el: CePagination): HTMLButtonElement[] {
  return Array.from(
    el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button[aria-label^='Page ']"),
  );
}

describe("<ce-pagination>", () => {
  it("renders nav navigation landmark and first/prev/next/last buttons", async () => {
    const host = mount(`<ce-pagination total="5" page="3"></ce-pagination>`);
    const pag = host.querySelector("ce-pagination") as CePagination;
    await ready(pag);
    const sr = pag.shadowRoot!;
    expect(sr.querySelector("nav[aria-label='Pagination']")).not.toBeNull();
    expect(sr.querySelector("button[aria-label='First page']")).not.toBeNull();
    expect(sr.querySelector("button[aria-label='Previous page']")).not.toBeNull();
    expect(sr.querySelector("button[aria-label='Next page']")).not.toBeNull();
    expect(sr.querySelector("button[aria-label='Last page']")).not.toBeNull();
    host.remove();
  });

  it("marks the current page with aria-current=page", async () => {
    const host = mount(`<ce-pagination total="5" page="3"></ce-pagination>`);
    const pag = host.querySelector("ce-pagination") as CePagination;
    await ready(pag);
    const current = pag.shadowRoot!.querySelector("[aria-current='page']")!;
    expect(current.textContent?.trim()).toBe("3");
    host.remove();
  });

  it("disables back controls on page 1 and forward controls on the last page", async () => {
    const host = mount(`<ce-pagination total="5" page="1"></ce-pagination>`);
    const pag = host.querySelector("ce-pagination") as CePagination;
    await ready(pag);
    const sr = pag.shadowRoot!;
    expect((sr.querySelector("button[aria-label='First page']") as HTMLButtonElement).disabled).toBe(true);
    expect((sr.querySelector("button[aria-label='Previous page']") as HTMLButtonElement).disabled).toBe(true);
    expect((sr.querySelector("button[aria-label='Next page']") as HTMLButtonElement).disabled).toBe(false);

    pag.page = 5;
    await ready(pag);
    expect((sr.querySelector("button[aria-label='Next page']") as HTMLButtonElement).disabled).toBe(true);
    expect((sr.querySelector("button[aria-label='Last page']") as HTMLButtonElement).disabled).toBe(true);
    host.remove();
  });

  it("emits ce-pagechange but leaves page unchanged when manage=external (default)", async () => {
    const host = mount(`<ce-pagination total="5" page="2"></ce-pagination>`);
    const pag = host.querySelector("ce-pagination") as CePagination;
    await ready(pag);
    let detail: { page: number } | null = null;
    pag.addEventListener("ce-pagechange", (e) => {
      detail = (e as CustomEvent<{ page: number }>).detail;
    });
    (pag.shadowRoot!.querySelector("button[aria-label='Next page']") as HTMLButtonElement).click();
    expect(detail).not.toBeNull();
    expect(detail!.page).toBe(3);
    expect(pag.page).toBe(2);
    host.remove();
  });

  it("updates page locally when manage=self (CDR-004 opt-in)", async () => {
    const host = mount(
      `<ce-pagination total="5" page="2" manage="self"></ce-pagination>`,
    );
    const pag = host.querySelector("ce-pagination") as CePagination;
    await ready(pag);
    (pag.shadowRoot!.querySelector("button[aria-label='Next page']") as HTMLButtonElement).click();
    await ready(pag);
    expect(pag.page).toBe(3);
    host.remove();
  });

  it("clamps page > total and page < 1 to the valid range", async () => {
    const host = mount(`<ce-pagination total="5" page="99"></ce-pagination>`);
    const pag = host.querySelector("ce-pagination") as CePagination;
    await ready(pag);
    const current = pag.shadowRoot!.querySelector("[aria-current='page']")!;
    expect(current.textContent?.trim()).toBe("5");
    host.remove();
  });

  it("shows ellipses between non-adjacent page ranges", async () => {
    const host = mount(`<ce-pagination total="20" page="10" sibling="1"></ce-pagination>`);
    const pag = host.querySelector("ce-pagination") as CePagination;
    await ready(pag);
    const gaps = pag.shadowRoot!.querySelectorAll(".gap");
    expect(gaps.length).toBe(2);
    const labels = pageButtons(pag).map((b) => b.textContent?.trim());
    expect(labels[0]).toBe("1");
    expect(labels[labels.length - 1]).toBe("20");
    expect(labels).toContain("10");
    host.remove();
  });

  it("compact mode hides number buttons and shows a 'n / total' info line", async () => {
    const host = mount(`<ce-pagination total="5" page="3" compact></ce-pagination>`);
    const pag = host.querySelector("ce-pagination") as CePagination;
    await ready(pag);
    expect(pageButtons(pag).length).toBe(0);
    const info = pag.shadowRoot!.querySelector(".info");
    expect(info?.textContent?.trim()).toBe("3 / 5");
    host.remove();
  });
});

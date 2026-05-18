import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CePricingTier } from "./pricing-tier.js";

beforeAll(() => defineOnce("ce-pricing-tier", CePricingTier));

function make(attrs: Record<string, string | boolean> = {}): CePricingTier {
  const el = document.createElement("ce-pricing-tier") as CePricingTier;
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) el.setAttribute(k, "");
    else if (v !== false) el.setAttribute(k, v as string);
  }
  return el;
}

describe("<ce-pricing-tier>", () => {
  it("renders name and price", async () => {
    const el = make({ name: "Pro", price: "1 990 ₽" });
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-pricing__name")?.textContent?.trim()).toBe("Pro");
    expect(el.shadowRoot!.querySelector(".ce-pricing__price")?.textContent?.trim()).toBe("1 990 ₽");
    el.remove();
  });

  it("renders sub when set", async () => {
    const el = make({ name: "Pro", price: "1 990 ₽", sub: "для команд до 20" });
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-pricing__sub")?.textContent?.trim()).toBe("для команд до 20");
    el.remove();
  });

  it("appends period as smaller text alongside price", async () => {
    const el = make({ name: "Pro", price: "1 990 ₽", period: "мес" });
    document.body.appendChild(el);
    await el.updateComplete;
    const period = el.shadowRoot!.querySelector(".ce-pricing__period");
    expect(period).not.toBeNull();
    expect(period?.textContent?.trim()).toBe("/мес");
    el.remove();
  });

  it("renders badge when badge attribute set", async () => {
    const el = make({ name: "Pro", price: "1 990 ₽", badge: "Популярный" });
    document.body.appendChild(el);
    await el.updateComplete;
    const badge = el.shadowRoot!.querySelector(".ce-pricing__badge");
    expect(badge).not.toBeNull();
    expect(badge?.textContent?.trim()).toBe("Популярный");
    el.remove();
  });

  it("highlighted reflects on host element", async () => {
    const el = make({ name: "Enterprise", highlighted: true });
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("highlighted")).toBe(true);
    el.remove();
  });

  it("renders default slot children as feature items", async () => {
    const el = make({ name: "Free" });
    const f1 = document.createElement("span");
    f1.textContent = "5 projects";
    const f2 = document.createElement("span");
    f2.textContent = "Community support";
    el.appendChild(f1);
    el.appendChild(f2);
    document.body.appendChild(el);
    await el.updateComplete;
    // Slot present — JSON features empty so default slot is used
    const slot = el.shadowRoot!.querySelector("slot:not([name])") as HTMLSlotElement | null;
    expect(slot).not.toBeNull();
    const assigned = slot!.assignedElements();
    expect(assigned.length).toBe(2);
    el.remove();
  });

  it("renders JSON features array as feature items", async () => {
    const el = make({ name: "Pro", price: "1 990 ₽" });
    el.features = [
      { label: "Unlimited storage", included: true },
      { label: "SSO + SAML", included: false },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const rows = el.shadowRoot!.querySelectorAll(".ce-pricing__feature");
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain("Unlimited storage");
    expect(rows[1].classList.contains("is-excluded")).toBe(true);
    expect(rows[1].textContent).toContain("SSO + SAML");
    el.remove();
  });

  it("JSON features win over slot children when both present (CDR-005)", async () => {
    const el = make({ name: "Pro" });
    el.features = [{ label: "From JSON", included: true }];
    const child = document.createElement("span");
    child.textContent = "From slot";
    el.appendChild(child);
    document.body.appendChild(el);
    await el.updateComplete;
    // JSON features rendered — no default slot in shadow DOM
    const jsonRows = el.shadowRoot!.querySelectorAll(".ce-pricing__feature");
    expect(jsonRows.length).toBe(1);
    expect(jsonRows[0].textContent).toContain("From JSON");
    const defaultSlot = el.shadowRoot!.querySelector("slot:not([name])");
    expect(defaultSlot).toBeNull();
    el.remove();
  });

  it("slot=\"price\" overrides price attribute (CDR-002)", async () => {
    const el = make({ name: "Pro", price: "1 990 ₽" });
    const richPrice = document.createElement("span");
    richPrice.setAttribute("slot", "price");
    richPrice.innerHTML = "<s>2 990 ₽</s> <strong>1 990 ₽</strong>";
    el.appendChild(richPrice);
    document.body.appendChild(el);
    await el.updateComplete;
    // price slot rendered, plain .ce-pricing__price not present
    const plainPrice = el.shadowRoot!.querySelector(".ce-pricing__price");
    expect(plainPrice).toBeNull();
    const priceSlot = el.shadowRoot!.querySelector("slot[name='price']");
    expect(priceSlot).not.toBeNull();
    el.remove();
  });

  it("renders CTA button when cta set, emits ce-pricing-cta on click", async () => {
    const el = make({ name: "Pro", cta: "Начать" });
    document.body.appendChild(el);
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector("button.ce-pricing__cta") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    expect(btn?.textContent?.trim()).toBe("Начать");
    let fired = false;
    el.addEventListener("ce-pricing-cta", () => (fired = true));
    btn!.click();
    expect(fired).toBe(true);
    el.remove();
  });

  it("renders CTA as <a> when cta-href set", async () => {
    const el = make({ name: "Pro", cta: "Начать", "cta-href": "/signup" });
    document.body.appendChild(el);
    await el.updateComplete;
    const a = el.shadowRoot!.querySelector("a.ce-pricing__cta") as HTMLAnchorElement | null;
    expect(a).not.toBeNull();
    expect(a?.getAttribute("href")).toBe("/signup");
    el.remove();
  });

  it("renders no CTA when neither cta nor slot=cta present", async () => {
    const el = make({ name: "Free" });
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-pricing__cta")).toBeNull();
    expect(el.shadowRoot!.querySelector("slot[name='cta']")).toBeNull();
    el.remove();
  });

  it("parses features JSON from attribute string (CDR-005)", async () => {
    const el = document.createElement("ce-pricing-tier") as CePricingTier;
    el.setAttribute("name", "Pro");
    el.setAttribute(
      "features",
      '[{"label":"Storage","included":true},{"label":"SSO","included":false}]'
    );
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.features.length).toBe(2);
    expect(el.features[0].label).toBe("Storage");
    expect(el.features[1].included).toBe(false);
    el.remove();
  });
});

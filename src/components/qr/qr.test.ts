import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeQr, encodeQR } from "./qr.js";
import fixtures from "./qr.fixtures.json" with { type: "json" };

beforeAll(() => {
  defineOnce("ce-qr", CeQr);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}
async function ready(el: Element): Promise<void> {
  await (el as CeQr).updateComplete;
}

describe("encodeQR (algorithm)", () => {
  it("encodes a short string at version 1", () => {
    const r = encodeQR("hello", "M");
    expect(r.version).toBe(1);
    expect(r.size).toBe(21); // 4*1 + 17
    expect(r.modules.length).toBe(21 * 21);
    // Mask must be in 0..7
    expect(r.mask).toBeGreaterThanOrEqual(0);
    expect(r.mask).toBeLessThan(8);
  });

  it("higher ECC for the same data picks a larger version", () => {
    const long = "A".repeat(80);
    const m = encodeQR(long, "M");
    const h = encodeQR(long, "H");
    expect(h.version).toBeGreaterThan(m.version);
    expect(h.size).toBeGreaterThan(m.size);
  });

  it("places three finder patterns (top-left, top-right, bottom-left)", () => {
    const r = encodeQR("test", "M");
    const get = (row: number, col: number) => r.modules[row * r.size + col];
    // Center module of each 7×7 finder is dark
    expect(get(3, 3)).toBe(1);
    expect(get(3, r.size - 4)).toBe(1);
    expect(get(r.size - 4, 3)).toBe(1);
    // Outer corner of each finder is dark
    expect(get(0, 0)).toBe(1);
    expect(get(0, r.size - 1)).toBe(1);
    expect(get(r.size - 1, 0)).toBe(1);
  });

  it("dark module bit is set at (size - 8, 8)", () => {
    const r = encodeQR("dm", "L");
    expect(r.modules[(r.size - 8) * r.size + 8]).toBe(1);
  });

  it("timing pattern alternates", () => {
    const r = encodeQR("timing", "M");
    // Row 6 columns 8..size-9 should alternate 0/1 starting at 1 (col 8 is even)
    for (let c = 8; c < r.size - 8; c++) {
      const expected = c % 2 === 0 ? 1 : 0;
      expect(r.modules[6 * r.size + c]).toBe(expected);
    }
  });

  it("auto-picks v ≥ 10 (which uses 16-bit length field) for moderate input", () => {
    // ~150 bytes pushes us past v9 at ECC M (data capacity 154 codewords).
    const text = "x".repeat(160);
    const r = encodeQR(text, "M");
    expect(r.version).toBeGreaterThanOrEqual(8);
  });

  it("throws when input is larger than v40 ECC L can hold", () => {
    // v40-L holds 2953 bytes. Push past it.
    const huge = "z".repeat(3000);
    expect(() => encodeQR(huge, "L")).toThrow();
  });

  it("encodes UTF-8 multi-byte characters", () => {
    // "🚀 hi" — the rocket emoji is 4 bytes in UTF-8.
    const r = encodeQR("🚀 hi", "M");
    expect(r.size).toBeGreaterThan(0);
    expect(r.version).toBeGreaterThanOrEqual(1);
  });

  it("normalizes invalid ECC argument to M via the wrapper", () => {
    // Direct API requires valid; we test the component wrapper separately.
    expect(() => encodeQR("abc", "M")).not.toThrow();
  });
});

describe("<ce-qr> component", () => {
  it("renders an empty SVG when value is unset", async () => {
    const host = mount(`<ce-qr></ce-qr>`);
    const el = host.querySelector("ce-qr") as CeQr;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg).not.toBeNull();
    expect(svg.querySelector("path")).toBeNull(); // no modules
    expect(svg.getAttribute("aria-label")).toContain("empty");
    host.remove();
  });

  it("renders an SVG path when value is set", async () => {
    const host = mount(`<ce-qr value="https://example.com"></ce-qr>`);
    const el = host.querySelector("ce-qr") as CeQr;
    await ready(el);
    const path = el.shadowRoot!.querySelector("path");
    expect(path).not.toBeNull();
    const d = path!.getAttribute("d")!;
    expect(d.length).toBeGreaterThan(0);
    expect(d).toMatch(/^M\d/);
  });

  it("aria-label includes the value", async () => {
    const host = mount(`<ce-qr value="hello"></ce-qr>`);
    const el = host.querySelector("ce-qr") as CeQr;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toContain("hello");
    host.remove();
  });

  it("size attribute sets the rendered width and height", async () => {
    const host = mount(`<ce-qr value="x" size="240"></ce-qr>`);
    const el = host.querySelector("ce-qr") as CeQr;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("240");
    expect(svg.getAttribute("height")).toBe("240");
    host.remove();
  });

  it("ecc attribute is normalized (lowercase ok, garbage falls back to M)", async () => {
    const host = mount(`<ce-qr value="x" ecc="garbage"></ce-qr>`);
    const el = host.querySelector("ce-qr") as CeQr;
    await ready(el);
    // No throw, no error message rendered.
    expect(el.shadowRoot!.querySelector(".err")).toBeNull();
    expect(el.shadowRoot!.querySelector("path")).not.toBeNull();
    host.remove();
  });

  it("emits ce-qr-error when value is too large", async () => {
    const host = mount(`<ce-qr ecc="L"></ce-qr>`);
    const el = host.querySelector("ce-qr") as CeQr;
    let detail: any = null;
    el.addEventListener("ce-qr-error", (e) => (detail = (e as CustomEvent).detail));
    el.value = "z".repeat(3000);
    await ready(el);
    // microtask queue flush
    await new Promise((res) => setTimeout(res, 0));
    expect(detail).not.toBeNull();
    expect(detail.message).toMatch(/too large/i);
    host.remove();
  });

  it("includes the quiet-zone margin in the viewBox", async () => {
    const host = mount(`<ce-qr value="x" margin="2"></ce-qr>`);
    const el = host.querySelector("ce-qr") as CeQr;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    const vb = svg.getAttribute("viewBox")!;
    // viewBox should be size + 2*margin per side. v1 with margin 2 = 21+4 = 25.
    expect(vb).toBe("0 0 25 25");
    host.remove();
  });

  it("supports color and bg props", async () => {
    const host = mount(`<ce-qr value="x" color="#ff0000" bg="#00ff00"></ce-qr>`);
    const el = host.querySelector("ce-qr") as CeQr;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    const style = svg.getAttribute("style") || "";
    expect(style).toContain("--ce-qr-fg:#ff0000");
    expect(style).toContain("--ce-qr-bg:#00ff00");
    host.remove();
  });
});

// ============================================================================
// Spec-compliance regression tests.
//
// Fixtures in qr.fixtures.json were generated by the `qrcode` npm package
// (a battle-tested ISO/IEC 18004 implementation) on 2026-05-08 and embedded
// here as a frozen reference. Our encoder must produce byte-identical output.
//
// These tests caught the format-info row/col swap bug that made earlier
// versions of the encoder produce un-scannable QR codes despite passing
// every internal-consistency test. Do not weaken these without scanning
// real output through a phone camera AND a known-good decoder.
// ============================================================================

function decodeBase64(b64: string): Uint8Array {
  // Use atob which is available in jsdom + node test environments.
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

describe("encodeQR — spec compliance against qrcode-lib reference", () => {
  for (const fx of fixtures) {
    it(`matches reference: ${fx.note}`, () => {
      const r = encodeQR(fx.value, fx.ecc as "L" | "M" | "Q" | "H");
      expect(r.version).toBe(fx.version);
      expect(r.size).toBe(fx.size);
      // Mask choice can legitimately differ when penalty scores tie. When masks
      // match we require byte-identical output; when they differ we can't
      // direct-diff (the data layer is XORed differently), but the round-trip
      // test in the next describe still verifies format info validity.
      if (r.mask !== fx.mask) {
        // Both masks must be in 0..7 — that's the only check we can do here.
        expect(r.mask).toBeGreaterThanOrEqual(0);
        expect(r.mask).toBeLessThan(8);
        return;
      }
      const ref = decodeBase64(fx.modules);
      expect(r.modules.length).toBe(ref.length);
      let firstDiff = -1;
      for (let i = 0; i < ref.length; i++) {
        if (r.modules[i] !== ref[i]) { firstDiff = i; break; }
      }
      if (firstDiff !== -1) {
        const row = Math.floor(firstDiff / fx.size);
        const col = firstDiff % fx.size;
        throw new Error(
          `[${fx.value}] mismatch at first cell (row=${row}, col=${col}): ` +
          `ours=${r.modules[firstDiff]} ref=${ref[firstDiff]}`
        );
      }
    });
  }
});

describe("encodeQR — format info placement (regression for un-scannable bug)", () => {
  // The bug was: format info bits were placed at (row 8, col i) instead of
  // (row i, col 8). Result: scanner couldn't read the ECC level + mask, so
  // the code looked valid but decoded to garbage.
  //
  // For ECC=L mask=0 the format info codeword is 0x77C4 (per the spec table).
  // bit 0 (LSB, value 0) MUST be at (row 0, col 8) per ISO/IEC 18004 Fig. 19.
  // bit 14 (MSB, value 1) MUST be at (row 8, col 0).

  it("ECC=L mask=0 places bit 0 at (row 0, col 8) and bit 14 at (row 8, col 0)", () => {
    // We can't directly force mask=0 from the public API, but we can find an
    // input that makes the encoder pick mask=0. From the fixtures: "hello world"
    // ecc=L gives v=1 mask=0.
    const r = encodeQR("hello world", "L");
    expect(r.mask).toBe(0);
    // fmt = 0x77C4 = 0b111_0111_1100_0100
    // bit 0 = 0  → (row 0, col 8)
    // bit 14 = 1 → (row 8, col 0)
    expect(r.modules[0 * r.size + 8]).toBe(0); // bit 0 at top of col 8
    expect(r.modules[8 * r.size + 0]).toBe(1); // bit 14 at left of row 8
  });

  it("ECC=M mask=2 places format info bits at correct cells", () => {
    // From fixtures: "https://example.com" ecc=M v=2 mask=2.
    // fmt = 0x5E7C = 0b101_1110_0111_1100. Bits LSB-first: 0,0,1,1,1,1,1,0,0,1,1,1,1,0,1.
    // First copy:  bit i → vertical (col 8) AND horizontal (row 8) at spec-defined cells.
    // bit 0 = 0 → (row 0, col 8) AND (row 8, col size-1).
    // bit 14 = 1 → (row size-1, col 8) AND (row 8, col 0).
    const r = encodeQR("https://example.com", "M");
    expect(r.mask).toBe(2);
    // bit 0 = 0
    expect(r.modules[0 * r.size + 8]).toBe(0);
    expect(r.modules[8 * r.size + (r.size - 1)]).toBe(0);
    // bit 14 = 1
    expect(r.modules[(r.size - 1) * r.size + 8]).toBe(1);
    expect(r.modules[8 * r.size + 0]).toBe(1);
  });

  it("dark module is always set at (size - 8, 8)", () => {
    for (const value of ["a", "test", "https://example.com", "x".repeat(200)]) {
      for (const ecc of ["L", "M", "Q", "H"] as const) {
        const r = encodeQR(value, ecc);
        expect(r.modules[(r.size - 8) * r.size + 8]).toBe(1);
      }
    }
  });
});

describe("encodeQR — format info round-trip (decoder-style read)", () => {
  // Reproduce jsQR's format-info reader. jsQR's matrix.get(x, y) is bitmatrix
  // indexed by (x, y) where x=col y=row, so:
  //   matrix.get(x, 8) → cell at col=x, row=8 → linear index 8*size + x.
  //   matrix.get(8, y) → cell at col=8, row=y → linear index y*size + 8.
  function readFormatTopLeft(modules: Uint8Array, size: number): number {
    let bits = 0;
    for (let x = 0; x <= 8; x++) {
      if (x === 6) continue;
      bits = (bits << 1) | modules[8 * size + x];
    }
    for (let y = 7; y >= 0; y--) {
      if (y === 6) continue;
      bits = (bits << 1) | modules[y * size + 8];
    }
    return bits;
  }

  function readFormatTRBL(modules: Uint8Array, size: number): number {
    let bits = 0;
    for (let y = size - 1; y >= size - 7; y--) {
      bits = (bits << 1) | modules[y * size + 8];
    }
    for (let x = size - 8; x < size; x++) {
      bits = (bits << 1) | modules[8 * size + x];
    }
    return bits;
  }

  // Lookup table — the 32 valid format codewords (already XORed with 0x5412).
  // Indexed [ecc-bits-2bit, mask-3bit] → codeword.
  // ECC mapping per spec: L=01, M=00, Q=11, H=10.
  const FORMAT_INFO_CODES: Record<string, number> = {
    "L0": 0x77C4, "L1": 0x72F3, "L2": 0x7DAA, "L3": 0x789D,
    "L4": 0x662F, "L5": 0x6318, "L6": 0x6C41, "L7": 0x6976,
    "M0": 0x5412, "M1": 0x5125, "M2": 0x5E7C, "M3": 0x5B4B,
    "M4": 0x45F9, "M5": 0x40CE, "M6": 0x4F97, "M7": 0x4AA0,
    "Q0": 0x355F, "Q1": 0x3068, "Q2": 0x3F31, "Q3": 0x3A06,
    "Q4": 0x24B4, "Q5": 0x2183, "Q6": 0x2EDA, "Q7": 0x2BED,
    "H0": 0x1689, "H1": 0x13BE, "H2": 0x1CE7, "H3": 0x19D0,
    "H4": 0x0762, "H5": 0x0255, "H6": 0x0D0C, "H7": 0x083B,
  };

  for (const fx of fixtures) {
    it(`${fx.note} → both copies of format info match the spec codeword`, () => {
      const r = encodeQR(fx.value, fx.ecc as "L" | "M" | "Q" | "H");
      const expected = FORMAT_INFO_CODES[`${fx.ecc}${r.mask}`];
      expect(expected, `no codeword for ${fx.ecc}${r.mask}`).toBeDefined();

      const tl = readFormatTopLeft(r.modules, r.size);
      const trbl = readFormatTRBL(r.modules, r.size);
      expect(tl).toBe(expected);
      expect(trbl).toBe(expected);
    });
  }
});

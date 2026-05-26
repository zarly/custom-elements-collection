# `ce-qr` — design rationale

## Why hand-roll the encoder

The PLAN_NEXT.md draft suggested vendoring `qrcode-svg@1.1.0` (~7 KB minified). After looking at the alternatives:

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Vendor `qrcode-svg` | Battle-tested, fast | Adds an external dependency to "no-CDN, no-peer-deps" library; ~5–7 KB gz; vendor's API uses kebab-cased options that don't match our prop style | Rejected — violates the no-runtime-deps stance for one component |
| Dynamic import | Lazy load only when used | Same dep concern; adds first-paint latency; consumers pay full cost on first render anyway | Rejected — penalty without offsetting benefit |
| **Hand-roll** | Zero deps; tailored to our token + meta system; full control over output format; can ship as a tier-brick | Requires a correct implementation of ISO/IEC 18004 (Reed-Solomon, mask scoring, format/version BCH info); ~300 lines + a 40-row capacity table | Chosen |

The 40-version × 4-ECC capacity table and the 40-version alignment-position table are the bulk of the file. Each is hardcoded from the spec; both compress well (the same numbers repeat per ECC level across versions).

## Encoder scope decisions

**Byte mode only.** The spec defines four modes: numeric (10-bits-per-3-digits), alphanumeric (11-bits-per-2-chars from a 45-char set), byte (8-bits-per-byte), kanji. Implementing all four is ~3× the code. Byte mode covers every input — URLs, free text, UTF-8. The density penalty for pure-numeric data (~3% larger codes) is accepted in exchange for code size.

**No ECI (Extended Channel Interpretation) header.** We assume UTF-8 (which is what `TextEncoder` produces). Nearly every modern QR scanner auto-detects UTF-8 byte sequences. Adding ECI would require a 4-byte header per code and ~30 lines of branching that almost no consumer needs.

**No structured-append.** Some QR specs allow splitting a payload across multiple codes. Out of scope; we error past v40 capacity instead.

## Output: SVG path with merged horizontal runs

Instead of one `<rect>` per dark module (the qrcode-svg approach for ~600+ rect elements on a v40 code), we emit a single `<path d="...">` with merged horizontal runs. For each row, we walk left-to-right and emit `Mx,y h<n>v1h-<n>z` per contiguous dark span.

A v1 code (21×21) typically has ~50 horizontal runs vs. 100+ individual modules. A v10 (57×57) has ~400 runs vs. 1500+ modules. The path string is consistently 30–50% smaller than per-rect output, and the browser's path renderer is faster than ~1500 individual `<rect>` elements.

We could merge vertical runs too (full rectangle decomposition), but the algorithmic complexity (~50 lines, with a row-major scan + flood-fill) is not worth the marginal size win. Horizontal merging is the 80/20 sweet spot.

## Theming via local CSS vars

The component exposes `--ce-qr-fg` and `--ce-qr-bg` as local CSS vars, falling back to `--ce-text` and `--ce-surface`. The `color` and `bg` props are escape hatches that set these vars inline (so the prop wins over the cascade).

This means a consumer can theme in three ways:
1. Use the props directly — `<ce-qr color="#0a0a0a" bg="#ffd700">`.
2. Override the local vars in CSS — `ce-qr { --ce-qr-fg: red }`.
3. Override the underlying tokens — `ce-qr { --ce-text: red }`.

`shape-rendering="crispEdges"` is set on the SVG so module boundaries stay sharp at any size — important on retina screens where anti-aliasing can blur 1px lines into 2px gradients.

## Mask selection

All eight standard masks (0–7) are tried; the lowest penalty score wins. The four penalty rules (runs of 5+, 2×2 blocks, finder-like patterns, dark/light balance) follow the spec verbatim. Cost: ~8 mask applications + scoring per render. For a v40 code this is ~1 ms total in V8. We don't cache — render is rare.

## Error path

When the input exceeds v40 ECC L capacity (~2953 bytes), the encoder throws. The component catches this in `render()`, schedules a `ce-qr-error` event via `queueMicrotask` (so it fires after the current render), and shows a styled error block instead of a broken SVG. The error block uses `role="alert"` so screen readers announce it.

## Why `experimental` stability

Open questions for v0.6:
- Should we add an alphanumeric mode for 25–35% denser codes on URL-heavy traffic?
- Should we expose the raw module matrix (Uint8Array) for consumers who want to render their own custom shapes (rounded modules, gradient fills)?
- Should we cache the encoded matrix on a property-comparison basis to avoid re-encoding on size/color-only changes?

Until these are decided, the API surface is `experimental`. Consumers should be prepared for additive changes.

## What's NOT in this component

- **Logo embedding.** Cute, but it requires raising ECC and reserving central modules; out of scope.
- **Dot-style modules / rounded corners.** Would require switching from horizontal-run merging to per-module rendering. If a consumer needs it, they can read the matrix off `result.modules` once we expose that API.
- **Reading / decoding.** This is encode-only. Decoding is a different problem (image processing, perspective correction, error recovery) with libraries an order of magnitude larger.

## Lint carve-out (2026-05-23)

This file disables three ESLint size-budget rules at file scope: `max-lines`, `max-lines-per-function`, and `max-depth`. Rationale:

- The encoder is **one algorithm**, not a coordination layer. Splitting `encodeQR` into matrix-build / mask-select / data-encode phases would push private state through helper signatures, hide the spec-driven step sequence from the reader, and make it harder to verify against ISO/IEC 18004 §7 figure-by-figure.
- The "bug fix log" entry above (format-info row/col swap) is the canonical example of a silent encoder bug — they survive internal-consistency tests; the only durable defense is keeping the code shape close to the spec for visual diffing.
- The data-placement zig-zag (lines ~352–366) legitimately nests `if` inside `for` inside `for` because that's the geometry it describes; flattening it would require synthesizing iterator helpers that obscure the matrix walk.

Reviewed against `docs/decisions/eslint.md` `complexity` row, which already documents this exact carve-out for "QR encoder, parser, scheduler" class algorithms.

### 2026-05-08 — un-scannable codes due to format info row/col swap

**Symptom:** Phone cameras and `jsQR` could not decode any QR produced by the encoder. Internal consistency tests (matrix structure, finder patterns, timing pattern, dark module, RS round-trip) all passed.

**Root cause:** `placeFormatInfo` had row and column swapped in the bit-to-cell mapping. The original code placed bit 0 at `(row 8, col 0)` and bit 14 at `(row 0, col 8)`. Per ISO/IEC 18004 §7.9 Figure 19 (and verified against qrcode npm + jsQR decoder), it must be the opposite: bit 0 at `(row 0, col 8)` and bit 14 at `(row 8, col 0)`.

The bug was hard to catch because:
1. The two copies of format info both got the *same* (wrong) layout, so internal consistency held.
2. Penalty scoring works on data cells regardless of format-info correctness, so masks were chosen.
3. The encoder produces output that *looks* like a QR code visually but encodes the ECC level + mask in cells the scanner doesn't read for that information.

**Verification:** Encoder output now matches qrcode npm package byte-for-byte for any byte-mode input (16/16 fixtures across versions 1-33, all 4 ECC levels). `jsQR` decodes 39/40 versions back to the original string (the v23 "miss" was a jsQR-side image scale limit, confirmed by reproducing the same matrix from qrcode-lib and seeing the same decoder failure).

**Regression guard:** `qr.fixtures.json` carries 12 frozen reference matrices; the test suite now asserts byte-identical encoding against them, plus an explicit format-info round-trip test that reads bits back the way `jsQR` does and matches them against the 32 valid 15-bit codewords from the spec.

**Lesson:** Internal-consistency tests and a working penalty scorer are necessary but not sufficient. Any encoder targeting an interoperable format must be tested against a known-good reference encoder OR by decoding its own output with a known-good decoder. We now do both.

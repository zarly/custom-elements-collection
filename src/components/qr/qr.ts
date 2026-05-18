import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

// ============================================================================
// QR encoder — ISO/IEC 18004:2015, byte mode only, versions 1–40, ECC L/M/Q/H.
// Hand-rolled. See CONCEPT.md for design notes.
// ============================================================================

type Ecc = "L" | "M" | "Q" | "H";
const ECC_INDEX: Record<Ecc, number> = { L: 0, M: 1, Q: 2, H: 3 };

// ---------- GF(256) tables ----------
const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // primitive polynomial x^8+x^4+x^3+x^2+1
  }
  EXP[255] = EXP[0];
}

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[(LOG[a] + LOG[b]) % 255];
}

// ---------- ECC capacity table ----------
// Per (version 1..40, ECC L/M/Q/H): [ecPerBlock, totalBlocks, totalDataCodewords]
// Source: ISO/IEC 18004:2015 Table 9. Encoded as a flat triple per (version, ecc).
const ECC_TABLE: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>> = [
  // v1
  [[7, 1, 19], [10, 1, 16], [13, 1, 13], [17, 1, 9]],
  [[10, 1, 34], [16, 1, 28], [22, 1, 22], [28, 1, 16]],
  [[15, 1, 55], [26, 1, 44], [18, 2, 34], [22, 2, 26]],
  [[20, 1, 80], [18, 2, 64], [26, 2, 48], [16, 4, 36]],
  [[26, 1, 108], [24, 2, 86], [18, 4, 62], [22, 4, 46]],
  [[18, 2, 136], [16, 4, 108], [24, 4, 76], [28, 4, 60]],
  [[20, 2, 156], [18, 4, 124], [18, 6, 88], [26, 5, 66]],
  [[24, 2, 194], [22, 4, 154], [22, 6, 110], [26, 6, 86]],
  [[30, 2, 232], [22, 5, 182], [20, 8, 132], [24, 8, 100]],
  // v10
  [[18, 4, 274], [26, 5, 216], [24, 8, 154], [28, 8, 122]],
  [[20, 4, 324], [30, 5, 254], [28, 8, 180], [24, 11, 140]],
  [[24, 4, 370], [22, 8, 290], [26, 10, 206], [28, 11, 158]],
  [[26, 4, 428], [22, 9, 334], [24, 12, 244], [22, 16, 180]],
  [[30, 4, 461], [24, 9, 365], [20, 16, 261], [24, 16, 197]],
  [[22, 6, 523], [24, 10, 415], [30, 12, 295], [24, 18, 223]],
  [[24, 6, 589], [28, 10, 453], [24, 17, 325], [30, 16, 253]],
  [[28, 6, 647], [28, 11, 507], [28, 16, 367], [28, 19, 283]],
  [[30, 6, 721], [26, 13, 563], [28, 18, 397], [28, 21, 313]],
  [[28, 7, 795], [26, 14, 627], [26, 21, 445], [26, 25, 341]],
  // v20
  [[28, 8, 861], [26, 16, 669], [30, 20, 485], [28, 25, 385]],
  [[28, 8, 932], [26, 17, 714], [28, 23, 512], [30, 25, 406]],
  [[28, 9, 1006], [28, 17, 782], [30, 23, 568], [24, 34, 442]],
  [[30, 9, 1094], [28, 18, 860], [30, 25, 614], [30, 30, 464]],
  [[30, 10, 1174], [28, 20, 914], [30, 27, 664], [30, 32, 514]],
  [[26, 12, 1276], [28, 21, 1000], [30, 29, 718], [30, 35, 538]],
  [[28, 12, 1370], [28, 23, 1062], [28, 34, 754], [30, 37, 596]],
  [[30, 12, 1468], [28, 25, 1128], [30, 34, 808], [30, 40, 628]],
  [[30, 13, 1531], [28, 26, 1193], [30, 35, 871], [30, 42, 661]],
  [[30, 14, 1631], [28, 28, 1267], [30, 38, 911], [30, 45, 701]],
  // v30
  [[30, 15, 1735], [28, 29, 1373], [30, 40, 985], [30, 48, 745]],
  [[30, 16, 1843], [28, 31, 1455], [30, 43, 1033], [30, 51, 793]],
  [[30, 17, 1955], [28, 33, 1541], [30, 45, 1115], [30, 54, 845]],
  [[30, 18, 2071], [28, 35, 1631], [30, 48, 1171], [30, 57, 901]],
  [[30, 19, 2191], [28, 37, 1725], [30, 51, 1231], [30, 60, 961]],
  [[30, 19, 2306], [28, 38, 1812], [30, 53, 1286], [30, 63, 986]],
  [[30, 20, 2434], [28, 40, 1914], [30, 56, 1354], [30, 66, 1054]],
  [[30, 21, 2566], [28, 43, 1992], [30, 59, 1426], [30, 70, 1096]],
  [[30, 22, 2702], [28, 45, 2102], [30, 62, 1502], [30, 74, 1142]],
  [[30, 24, 2812], [28, 47, 2216], [30, 65, 1582], [30, 77, 1222]],
  // v40
  [[30, 25, 2956], [28, 49, 2334], [30, 68, 1666], [30, 81, 1276]],
];

// ---------- Alignment pattern positions ----------
// Per version 1..40. v1 has none; otherwise these are coords (row=col) where
// alignment patterns sit. The encoder skips the three corners that overlap
// with finder patterns.
const ALIGN_POS: ReadonlyArray<ReadonlyArray<number>> = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

// ---------- Reed-Solomon ----------

function rsGenPoly(degree: number): number[] {
  // gen(x) = ∏_{i=0..degree-1} (x - α^i); in GF(2^8) subtraction = XOR.
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]; // x term
      next[j + 1] ^= gfMul(poly[j], EXP[i]); // α^i term (constant)
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], gen: number[]): number[] {
  // Polynomial division: (data * x^ecLen) mod gen. We track only the remainder.
  const ecLen = gen.length - 1;
  const rem = new Array(ecLen).fill(0);
  for (const b of data) {
    const factor = b ^ rem[0];
    rem.shift();
    rem.push(0);
    if (factor !== 0) {
      for (let j = 0; j < ecLen; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

// ---------- Bit stream ----------

class BitStream {
  bits: number[] = [];
  push(value: number, len: number): void {
    for (let i = len - 1; i >= 0; i--) {
      this.bits.push((value >>> i) & 1);
    }
  }
  toBytes(): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8 && i + j < this.bits.length; j++) {
        b = (b << 1) | this.bits[i + j];
      }
      if (this.bits.length - i < 8) b <<= 8 - (this.bits.length - i);
      bytes.push(b);
    }
    return bytes;
  }
}

// ---------- Encoder ----------

export interface QrResult {
  size: number; // module width = 4*version + 17
  modules: Uint8Array; // size*size, 1 = dark, 0 = light
  version: number;
  ecc: Ecc;
  mask: number;
}

export function encodeQR(text: string, ecc: Ecc = "M"): QrResult {
  const bytes = new TextEncoder().encode(text);
  const eccIdx = ECC_INDEX[ecc];

  // 1. Pick the smallest version that fits.
  let version = 0;
  let totalData = 0;
  for (let v = 1; v <= 40; v++) {
    const [, , td] = ECC_TABLE[v - 1][eccIdx];
    // Header: mode (4) + char-count (8 for v1-9, 16 for v10-40) + data + terminator.
    const cciLen = v < 10 ? 8 : 16;
    const headerBits = 4 + cciLen;
    const dataBits = bytes.length * 8;
    if (headerBits + dataBits <= td * 8) {
      version = v;
      totalData = td;
      break;
    }
  }
  if (version === 0) {
    throw new Error("QR data too large (>2953 bytes for ECC L)");
  }

  const cciLen = version < 10 ? 8 : 16;

  // 2. Build the bit stream.
  const bs = new BitStream();
  bs.push(0b0100, 4); // mode: byte
  bs.push(bytes.length, cciLen);
  for (const b of bytes) bs.push(b, 8);

  // Terminator (up to 4 zero bits, but stop at capacity).
  const cap = totalData * 8;
  const termLen = Math.min(4, cap - bs.bits.length);
  bs.push(0, termLen);

  // Pad to byte boundary.
  while (bs.bits.length % 8 !== 0) bs.bits.push(0);

  // Pad with alternating 0xEC, 0x11.
  const dataBytes = bs.toBytes();
  while (dataBytes.length < totalData) {
    dataBytes.push(0xec);
    if (dataBytes.length < totalData) dataBytes.push(0x11);
  }

  // 3. Split into blocks, compute Reed-Solomon EC codewords per block, interleave.
  const [ecPerBlock, totalBlocks] = ECC_TABLE[version - 1][eccIdx];
  const dataPerShortBlock = Math.floor(totalData / totalBlocks);
  const numLongBlocks = totalData - dataPerShortBlock * totalBlocks; // these blocks get +1 data codeword
  const numShortBlocks = totalBlocks - numLongBlocks;

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  const gen = rsGenPoly(ecPerBlock);
  let cursor = 0;
  for (let i = 0; i < totalBlocks; i++) {
    const len = dataPerShortBlock + (i < numShortBlocks ? 0 : 1);
    const block = dataBytes.slice(cursor, cursor + len);
    cursor += len;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, gen));
  }

  // Interleave: column-by-column for data (skipping short blocks once they run out),
  // then column-by-column for EC.
  const finalBytes: number[] = [];
  for (let i = 0; i <= dataPerShortBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < dataBlocks[b].length) finalBytes.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) finalBytes.push(ecBlocks[b][i]);
  }

  // 4. Build matrix with function patterns and reserved cells.
  const size = 4 * version + 17;
  const modules = new Uint8Array(size * size);
  const reserved = new Uint8Array(size * size); // 1 = function pattern / reserved
  const set = (r: number, c: number, v: number, isFn = false) => {
    modules[r * size + c] = v;
    if (isFn) reserved[r * size + c] = 1;
  };
  const isReserved = (r: number, c: number) => reserved[r * size + c] === 1;

  // 4a. Finder patterns (3 corners) + separators.
  const placeFinder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        let v = 0;
        if (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) {
          // 7×7 finder: outer ring + inner 3×3
          const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          v = onBorder || inCenter ? 1 : 0;
        }
        set(r, c, v, true);
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // 4b. Timing patterns.
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0 ? 1 : 0, true);
    set(i, 6, i % 2 === 0 ? 1 : 0, true);
  }

  // 4c. Alignment patterns (skip those overlapping finders).
  const aps = ALIGN_POS[version - 1];
  for (const ar of aps) {
    for (const ac of aps) {
      // Skip the three corners that overlap finder patterns.
      if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const onBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const center = dr === 0 && dc === 0;
          set(ar + dr, ac + dc, onBorder || center ? 1 : 0, true);
        }
      }
    }
  }

  // 4d. Reserve format info cells (filled later).
  for (let i = 0; i < 9; i++) {
    if (!isReserved(8, i)) reserved[8 * size + i] = 1;
    if (!isReserved(i, 8)) reserved[i * size + 8] = 1;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8 * size + (size - 1 - i)] = 1;
    reserved[(size - 1 - i) * size + 8] = 1;
  }
  // Dark module (always 1, always at (4*version+9, 8))
  set(size - 8, 8, 1, true);

  // 4e. Reserve version info cells (v ≥ 7).
  if (version >= 7) {
    for (let r = 0; r < 6; r++) {
      for (let c = size - 11; c < size - 8; c++) {
        reserved[r * size + c] = 1;
        reserved[c * size + r] = 1;
      }
    }
  }

  // 5. Place data codewords in zigzag pattern.
  let bitPos = 0;
  let upward = true;
  for (let colRight = size - 1; colRight > 0; colRight -= 2) {
    if (colRight === 6) colRight--; // skip vertical timing column
    for (let i = 0; i < size; i++) {
      const r = upward ? size - 1 - i : i;
      for (let j = 0; j < 2; j++) {
        const c = colRight - j;
        if (!isReserved(r, c)) {
          let bit = 0;
          if (bitPos >> 3 < finalBytes.length) {
            bit = (finalBytes[bitPos >> 3] >>> (7 - (bitPos & 7))) & 1;
          }
          modules[r * size + c] = bit;
          bitPos++;
        }
      }
    }
    upward = !upward;
  }

  // 6. Try all 8 masks; pick lowest penalty.
  let bestMask = 0;
  let bestPenalty = Infinity;
  let bestModules = modules;
  for (let m = 0; m < 8; m++) {
    const trial = new Uint8Array(modules);
    applyMask(trial, reserved, size, m);
    placeFormatInfo(trial, size, eccIdx, m);
    if (version >= 7) placeVersionInfo(trial, size, version);
    const p = penalty(trial, size);
    if (p < bestPenalty) {
      bestPenalty = p;
      bestMask = m;
      bestModules = trial;
    }
  }

  return { size, modules: bestModules, version, ecc, mask: bestMask };
}

// ---------- Mask + format/version info ----------

function maskBit(r: number, c: number, m: number): boolean {
  switch (m) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return false;
  }
}

function applyMask(modules: Uint8Array, reserved: Uint8Array, size: number, m: number): void {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r * size + c]) continue;
      if (maskBit(r, c, m)) modules[r * size + c] ^= 1;
    }
  }
}

function placeFormatInfo(modules: Uint8Array, size: number, eccIdx: number, mask: number): void {
  // ECC bit-mapping per ISO/IEC 18004 Section 7.9.1: L=01, M=00, Q=11, H=10.
  // Indexed by our internal eccIdx (L=0, M=1, Q=2, H=3).
  const eccBits = [0b01, 0b00, 0b11, 0b10][eccIdx];
  const data = (eccBits << 3) | mask;
  // BCH(15,5) with generator x^10 + x^8 + x^5 + x^4 + x^2 + x + 1 = 0x537.
  let r = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((r >> i) & 1) r ^= 0b10100110111 << (i - 10);
  }
  // Final 15-bit codeword XORed with 0x5412 to ensure no all-zero pattern.
  const fmt = ((data << 10) | (r & 0x3ff)) ^ 0b101010000010010;

  // Each bit i (0..14) is placed in TWO cells per ISO/IEC 18004 Figure 19:
  //   "vertical" placement on column 8 (TL going down + BL going down)
  //   "horizontal" placement on row 8 (TR going left + TL going left)
  // Verified against ISO spec, qrcode npm lib, and jsQR decoder's read order.
  for (let i = 0; i < 15; i++) {
    const bit = (fmt >> i) & 1;
    // Vertical placement (column 8)
    let row: number;
    if (i < 6) row = i;
    else if (i < 8) row = i + 1; // skip row 6 = horizontal timing pattern
    else row = size - 15 + i;
    modules[row * size + 8] = bit;

    // Horizontal placement (row 8)
    let col: number;
    if (i < 8) col = size - i - 1;
    else if (i === 8) col = 7; // skip col 6 = vertical timing pattern
    else col = 14 - i;
    modules[8 * size + col] = bit;
  }
  // Dark module — always 1, at (size - 8, 8).
  modules[(size - 8) * size + 8] = 1;
}

function placeVersionInfo(modules: Uint8Array, size: number, version: number): void {
  // 6 data bits → BCH(18,6) → 18 bits. Generator: 0b1111100100101.
  let r = version << 12;
  for (let i = 17; i >= 12; i--) {
    if ((r >> i) & 1) r ^= 0b1111100100101 << (i - 12);
  }
  const v = (version << 12) | (r & 0xfff);

  for (let i = 0; i < 18; i++) {
    const bit = (v >> i) & 1;
    const a = Math.floor(i / 3);
    const b = (i % 3) + size - 11;
    modules[a * size + b] = bit;
    modules[b * size + a] = bit;
  }
}

// ---------- Penalty score (rules 1..4 of ISO/IEC 18004) ----------

function penalty(modules: Uint8Array, size: number): number {
  let p = 0;
  // Rule 1: runs of 5+ same-color modules in rows or columns.
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (modules[r * size + c] === modules[r * size + c - 1]) {
        run++;
        if (run === 5) p += 3;
        else if (run > 5) p += 1;
      } else run = 1;
    }
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (modules[r * size + c] === modules[(r - 1) * size + c]) {
        run++;
        if (run === 5) p += 3;
        else if (run > 5) p += 1;
      } else run = 1;
    }
  }
  // Rule 2: 2×2 blocks of same color.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r * size + c];
      if (
        modules[r * size + c + 1] === v &&
        modules[(r + 1) * size + c] === v &&
        modules[(r + 1) * size + c + 1] === v
      ) p += 3;
    }
  }
  // Rule 3: finder-like pattern 1011101 with 4-module light strip on either side.
  const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]; // 1011101 + 0000 light
  const pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]; // 0000 light + 1011101
  const matches = (line: number[], pat: number[]) => {
    for (let i = 0; i + pat.length <= line.length; i++) {
      let ok = true;
      for (let j = 0; j < pat.length; j++) {
        if (line[i + j] !== pat[j]) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  };
  for (let r = 0; r < size; r++) {
    const row = Array.from(modules.subarray(r * size, (r + 1) * size));
    if (matches(row, pat1)) p += 40;
    if (matches(row, pat2)) p += 40;
  }
  for (let c = 0; c < size; c++) {
    const col = new Array(size);
    for (let r = 0; r < size; r++) col[r] = modules[r * size + c];
    if (matches(col, pat1)) p += 40;
    if (matches(col, pat2)) p += 40;
  }
  // Rule 4: dark/light balance proximity to 50%.
  let dark = 0;
  for (let i = 0; i < modules.length; i++) if (modules[i]) dark++;
  const ratio = (dark * 100) / modules.length;
  p += Math.floor(Math.abs(ratio - 50) / 5) * 10;
  return p;
}

// ---------- SVG path with merged horizontal runs ----------

function modulesToPath(modules: Uint8Array, size: number): string {
  // Walk row by row, emit "Mx,y h<n>" for each contiguous dark run.
  let path = "";
  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (modules[r * size + c]) {
        let len = 1;
        while (c + len < size && modules[r * size + c + len]) len++;
        path += `M${c},${r}h${len}v1h-${len}z`;
        c += len;
      } else c++;
    }
  }
  return path;
}

// ============================================================================
// Lit component
// ============================================================================

/**
 * `<ce-qr>` — pure-SVG QR code, hand-rolled encoder.
 *
 * Attributes:
 *   value    — string to encode (URL, text, etc.)
 *   ecc      — error correction level: L | M | Q | H (default M)
 *   size     — display size in px (default 160). The internal grid auto-sizes.
 *   margin   — quiet-zone modules around the code (default 4 per spec)
 *   color    — foreground CSS color (default --ce-text via token)
 *   bg       — background CSS color (default --ce-surface via token)
 *
 * Slots: none.
 *
 * Events: ce-qr-error — { message } when value is too large for any version.
 */
export class CeQr extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0; /* prevent inline-block descender gap */
    }
    svg {
      display: block;
      background: var(--ce-qr-bg, var(--ce-surface));
      color: var(--ce-qr-fg, var(--ce-text));
      border-radius: var(--ce-qr-radius, 0);
    }
    .err {
      display: block;
      color: var(--ce-color-red);
      font-family: var(--ce-mono);
      font-size: var(--ce-text-xs);
      padding: var(--ce-space-2);
      background: var(--ce-surface);
      border: 1px solid var(--ce-color-red);
      border-radius: var(--ce-radius-sm);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) value = "";
  @property({ type: String }) ecc: Ecc = "M";
  @property({ type: Number }) size = 160;
  @property({ type: Number }) margin = 4;
  @property({ type: String }) color = "";
  @property({ type: String }) bg = "";

  override render() {
    if (!this.value) {
      return html`<svg
        viewBox="0 0 1 1"
        width=${this.size}
        height=${this.size}
        role="img"
        aria-label="empty QR code"
      ></svg>`;
    }
    let result: QrResult;
    try {
      result = encodeQR(this.value, this.#normalizedEcc());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      queueMicrotask(() =>
        this.dispatchEvent(
          new CustomEvent("ce-qr-error", { bubbles: true, composed: true, detail: { message: msg } })
        )
      );
      return html`<span class="err" role="alert">${msg}</span>`;
    }

    const total = result.size + 2 * this.margin;
    const path = modulesToPath(result.modules, result.size);
    const fg = this.color || "currentColor";
    const bg = this.bg || "transparent";

    return html`<svg
      viewBox="0 0 ${total} ${total}"
      width=${this.size}
      height=${this.size}
      role="img"
      aria-label=${`QR code: ${this.value}`}
      shape-rendering="crispEdges"
      style=${this.color || this.bg
        ? `--ce-qr-fg:${fg};--ce-qr-bg:${bg}`
        : ""}
    >
      <rect width=${total} height=${total} fill="var(--ce-qr-bg, transparent)" />
      <g transform="translate(${this.margin},${this.margin})" fill="var(--ce-qr-fg, currentColor)">
        <path d=${path} />
      </g>
    </svg>`;
  }

  #normalizedEcc(): Ecc {
    const u = this.ecc.toUpperCase();
    return u === "L" || u === "M" || u === "Q" || u === "H" ? u : "M";
  }
}

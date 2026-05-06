/*
 * Tiny parser for `<stem>.examples.html` files.
 *
 * Format: each example begins with a `<!-- @example Title -->` HTML
 * comment on its own line. Everything between that delimiter and the
 * next one (or EOF) is the example body. Whitespace is trimmed.
 *
 * Returns: Array<{ title: string, html: string }>.
 */
const DELIM = /^[ \t]*<!--[ \t]*@example[ \t]+(.+?)[ \t]*-->[ \t]*$/gm;

export function parseExamples(raw) {
  if (typeof raw !== "string" || raw.length === 0) return [];
  const out = [];
  const matches = [...raw.matchAll(DELIM)];
  if (matches.length === 0) {
    // No delimiter — treat the whole file as a single untitled example.
    const body = raw.trim();
    return body ? [{ title: "Example", html: body }] : [];
  }
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const html = raw.slice(start, end).trim();
    if (html) out.push({ title: m[1].trim(), html });
  }
  return out;
}

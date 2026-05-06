import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

interface DiffLine {
  kind: "ctx" | "add" | "del";
  before: string;
  after: string;
}

/**
 * `<ce-diff>` — line-level diff viewer.
 *
 * Attributes:
 *   before   — original text
 *   after    — changed text
 *   layout   — "unified" | "split"
 *   language — informational tag (rendered as a pill)
 *
 * The matcher is an LCS (longest-common-subsequence) implementation
 * to keep added/removed lines aligned correctly. Sufficient for
 * short diffs (< a few hundred lines); not optimised for very large
 * files.
 *
 * Slots:
 *   before — alternative way to supply the original text
 *   after  — alternative way to supply the new text
 */
export class CeDiff extends CecElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-xs);
      color: var(--ce-code-text);
      background: var(--ce-code-bg);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      overflow: hidden;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ce-inset-md) var(--ce-space-3);
      background: var(--ce-surface-2);
      border-bottom: 1px solid var(--ce-border);
      font-family: var(--ce-font-sans);
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
    }
    .pill {
      padding: 1px 6px;
      border-radius: var(--ce-radius-pill);
      background: var(--ce-surface-3);
      color: var(--ce-text);
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 2px var(--ce-space-3);
      vertical-align: top;
      white-space: pre-wrap;
      word-break: break-word;
    }
    tr.add { background: var(--ce-color-green-bg); }
    tr.del { background: var(--ce-color-red-bg); }
    .marker {
      width: 12px;
      color: var(--ce-muted);
      text-align: center;
      user-select: none;
    }
    tr.add .marker { color: var(--ce-color-green); }
    tr.del .marker { color: var(--ce-color-red); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, attribute: "before" }) beforeText = "";
  @property({ type: String, attribute: "after" }) afterText = "";
  @property({ type: String, reflect: true })
  layout: "unified" | "split" = "unified";
  @property({ type: String }) language = "";

  #lcs(a: string[], b: string[]): DiffLine[] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
        else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out: DiffLine[] = [];
    let i = 0;
    let j = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) {
        out.push({ kind: "ctx", before: a[i], after: b[j] });
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        out.push({ kind: "del", before: a[i], after: "" });
        i++;
      } else {
        out.push({ kind: "add", before: "", after: b[j] });
        j++;
      }
    }
    while (i < m) {
      out.push({ kind: "del", before: a[i], after: "" });
      i++;
    }
    while (j < n) {
      out.push({ kind: "add", before: "", after: b[j] });
      j++;
    }
    return out;
  }

  #resolve(): { before: string; after: string } {
    const before =
      this.beforeText ||
      (this.querySelector('[slot="before"]') as HTMLElement | null)?.textContent ||
      "";
    const after =
      this.afterText ||
      (this.querySelector('[slot="after"]') as HTMLElement | null)?.textContent ||
      "";
    return { before, after };
  }

  override render() {
    const { before, after } = this.#resolve();
    const aLines = before.split("\n");
    const bLines = after.split("\n");
    const lines = this.#lcs(aLines, bLines);
    const adds = lines.filter((l) => l.kind === "add").length;
    const dels = lines.filter((l) => l.kind === "del").length;

    const rows = this.layout === "split"
      ? lines.map(
          (l) => html`
            <tr class=${l.kind}>
              <td class="marker">${l.kind === "del" ? "−" : ""}</td>
              <td>${l.before}</td>
              <td class="marker">${l.kind === "add" ? "+" : ""}</td>
              <td>${l.after}</td>
            </tr>
          `
        )
      : lines.map(
          (l) => html`
            <tr class=${l.kind}>
              <td class="marker">${l.kind === "add" ? "+" : l.kind === "del" ? "−" : " "}</td>
              <td>${l.kind === "del" ? l.before : l.after}</td>
            </tr>
          `
        );

    return html`
      <header>
        <span>${this.language ? html`<span class="pill">${this.language}</span>` : ""}</span>
        <span>+${adds} −${dels}</span>
      </header>
      <table role="table" aria-label="Diff">
        <tbody>${rows}</tbody>
      </table>
    `;
  }
}

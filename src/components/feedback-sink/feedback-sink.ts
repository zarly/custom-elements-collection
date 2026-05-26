/* eslint-disable max-lines --
 * ce-feedback-sink is the project's feedback aggregation layer: it owns the
 * subject/item state machine plus five transport implementations
 * (localstorage / http / file / console / custom) and two export formats
 * (Markdown / JSON). The 5 #flush* methods could be extracted to a sibling
 * file, but each reads `#pending`, `#state`, `#fileHandle`, `#hydrated`,
 * and the offline-fallback config — extracting them would either thread
 * that state through ~5 parameters per call or promote it to module-level
 * (breaks multi-instance). Carve-out documented per docs/decisions/eslint.md
 * `max-lines` row pattern; revisit when a 6th transport lands or a transport
 * grows beyond ~100 lines on its own.
 */
import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeFeedbackTransport =
  | "localstorage"
  | "http"
  | "file"
  | "console"
  | "custom";

export type CeFeedbackOfflineFallback = "localstorage" | "none";

export interface FeedbackEvent {
  schema: string;
  subject: string;
  item: string;
  label?: string;
  action: "rate" | "bookmark" | "dismiss" | "comment" | "clear";
  value?:
    | { mode: "thumbs"; v: "up" | "down" | null }
    | { mode: "stars"; v: number; max: number }
    | { active: boolean }
    | { text: string };
  ts: number;
  client?: string;
}

export interface ItemState {
  item: string;
  label?: string;
  thumbs?: "up" | "down" | null;
  stars?: number;
  bookmarked?: boolean;
  dismissed?: boolean;
  comment?: string;
  updatedAt: number;
}

export type SubjectState = Record<string, ItemState>;

export type CeFeedbackTransportImpl = (
  events: FeedbackEvent[]
) => Promise<void>;

const STORAGE_KEY_PREFIX = "ce-feedback:";

/** Markdown export — produced from a SubjectState. */
function buildMarkdown(subject: string, state: SubjectState): string {
  const items = Object.values(state);
  const liked = items.filter((s) => s.thumbs === "up");
  const disliked = items.filter((s) => s.thumbs === "down");
  const bookmarked = items.filter((s) => s.bookmarked);
  const dismissed = items.filter((s) => s.dismissed);
  const rated = items.filter((s) => typeof s.stars === "number" && s.stars > 0);
  const commented = items.filter((s) => s.comment && s.comment.trim().length > 0);

  const out: string[] = [];
  out.push(`## Feedback on "${subject}"`);
  out.push("");
  if (bookmarked.length) {
    out.push(`**Shortlist**: ${bookmarked.map((i) => "`" + i.item + "`").join(", ")}`);
  }
  if (liked.length) {
    out.push(`**Liked**: ${liked.map((i) => "`" + i.item + "`").join(", ")}`);
  }
  if (disliked.length) {
    out.push(`**Disliked**: ${disliked.map((i) => "`" + i.item + "`").join(", ")}`);
  }
  if (dismissed.length) {
    out.push(`**Drop**: ${dismissed.map((i) => "`" + i.item + "`").join(", ")}`);
  }
  if (rated.length) {
    out.push("");
    out.push(`**Ratings**:`);
    for (const i of rated) {
      const n = Math.round(i.stars ?? 0);
      const stars = "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
      out.push(`- \`${i.item}\`: ${stars}`);
    }
  }
  if (commented.length) {
    out.push("");
    out.push(`**Comments**:`);
    for (const i of commented) {
      out.push(`- \`${i.item}\`: ${i.comment}`);
    }
  }
  return out.join("\n");
}

function buildJsonExport(subject: string, schema: string, state: SubjectState): string {
  return JSON.stringify(
    {
      schema,
      subject,
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2
  );
}

/**
 * `<ce-feedback-sink>` — invisible (display: contents) wrapper that owns
 * subject + transport + per-item aggregated state.
 *
 * Listens (via shadow root host) for bubbling change events from descendants
 * and normalizes them into FeedbackEvent records, persists per the configured
 * transport, and re-emits aggregated state.
 */
export class CeFeedbackSink extends CecElement {
  static override styles = css`
    :host {
      display: contents;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String })
  subject = "";

  @property({ type: String, reflect: true })
  transport: CeFeedbackTransport = "localstorage";

  @property({ type: String })
  endpoint = "http://localhost:3600/feedback";

  @property({ type: String, attribute: "offline-fallback" })
  offlineFallback: CeFeedbackOfflineFallback = "localstorage";

  @property({ type: Number, attribute: "batch-ms" })
  batchMs = 0;

  @property({ type: String, attribute: "schema-version" })
  schemaVersion = "1";

  /** Custom-transport hook. Public, settable. */
  transportImpl: CeFeedbackTransportImpl | null = null;

  #state: SubjectState = {};
  #pending: FeedbackEvent[] = [];
  #flushTimer: ReturnType<typeof setTimeout> | null = null;
  #fileHandle: unknown = null; // FileSystemFileHandle when available
  #hydrated = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("ce-rating-change", this.#onRating as EventListener);
    this.addEventListener("ce-bookmark-change", this.#onBookmark as EventListener);
    this.addEventListener("ce-dismiss-change", this.#onDismiss as EventListener);
    this.addEventListener("ce-comment-change", this.#onComment as EventListener);
    this.addEventListener("ce-feedback-clear", this.#onClear as EventListener);
    this.addEventListener(
      "ce-feedback-export-request",
      this.#onExportRequest as EventListener
    );
    this.#hydrate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("ce-rating-change", this.#onRating as EventListener);
    this.removeEventListener("ce-bookmark-change", this.#onBookmark as EventListener);
    this.removeEventListener("ce-dismiss-change", this.#onDismiss as EventListener);
    this.removeEventListener("ce-comment-change", this.#onComment as EventListener);
    this.removeEventListener("ce-feedback-clear", this.#onClear as EventListener);
    this.removeEventListener(
      "ce-feedback-export-request",
      this.#onExportRequest as EventListener
    );
    if (this.#flushTimer) {
      clearTimeout(this.#flushTimer);
      this.#flushTimer = null;
    }
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("subject") && this.#hydrated) {
      // Subject changed — re-hydrate.
      this.#state = {};
      this.#hydrated = false;
      this.#hydrate();
    }
  }

  override render() {
    return html`<slot></slot>`;
  }

  // — public API ——————————————

  getState(): SubjectState {
    return JSON.parse(JSON.stringify(this.#state));
  }

  // — hydration ——————————————

  #hydrate(): void {
    if (!this.subject) return;
    if (this.transport === "localstorage" || this.offlineFallback === "localstorage") {
      const loaded = this.#readStorage();
      if (loaded) {
        this.#state = loaded;
      }
    }
    this.#hydrated = true;
    // Emit initial state event so downstream summaries can render immediately.
    this.#emitState();
  }

  // — event handlers ——————————————

  #resolveSource(e: Event): { item: string; label?: string } | null {
    const path = e.composedPath();
    for (const target of path) {
      if (!(target instanceof HTMLElement)) continue;
      const dataItem = target.getAttribute?.("data-ce-item");
      if (dataItem) {
        const tag = target.tagName.toLowerCase();
        // Try ce-feedback-bar to also pluck a label.
        let label: string | undefined;
        let node: Element | null = target;
        while (node && node.tagName !== "BODY") {
          if (node.tagName.toLowerCase() === "ce-feedback-bar") {
            label = node.getAttribute("label") || undefined;
            break;
          }
          node = node.parentElement;
        }
        void tag;
        return { item: dataItem, label };
      }
    }
    return null;
  }

  #upsertState(item: string, label: string | undefined, patch: Partial<ItemState>): void {
    const cur = this.#state[item] ?? { item, updatedAt: 0 };
    this.#state[item] = {
      ...cur,
      ...patch,
      item,
      label: label ?? cur.label,
      updatedAt: Date.now(),
    };
  }

  #onRating = (e: CustomEvent<{ mode: string; value: unknown; max?: number }>): void => {
    const src = this.#resolveSource(e);
    if (!src) return;
    const d = e.detail ?? {};
    let value: FeedbackEvent["value"];
    if (d.mode === "thumbs") {
      const v = (d.value as "up" | "down" | null) ?? null;
      this.#upsertState(src.item, src.label, { thumbs: v });
      value = { mode: "thumbs", v };
    } else if (d.mode === "stars") {
      const v = typeof d.value === "number" ? d.value : 0;
      const max = typeof d.max === "number" ? d.max : 5;
      this.#upsertState(src.item, src.label, { stars: v });
      value = { mode: "stars", v, max };
    } else {
      return;
    }
    this.#enqueue({
      schema: this.schemaVersion,
      subject: this.subject,
      item: src.item,
      label: src.label,
      action: "rate",
      value,
      ts: Date.now(),
    });
  };

  #onBookmark = (e: CustomEvent<{ active: boolean }>): void => {
    const src = this.#resolveSource(e);
    if (!src) return;
    const active = !!e.detail?.active;
    this.#upsertState(src.item, src.label, { bookmarked: active });
    this.#enqueue({
      schema: this.schemaVersion,
      subject: this.subject,
      item: src.item,
      label: src.label,
      action: "bookmark",
      value: { active },
      ts: Date.now(),
    });
  };

  #onDismiss = (e: CustomEvent<{ active: boolean }>): void => {
    const src = this.#resolveSource(e);
    if (!src) return;
    const active = !!e.detail?.active;
    this.#upsertState(src.item, src.label, { dismissed: active });
    this.#enqueue({
      schema: this.schemaVersion,
      subject: this.subject,
      item: src.item,
      label: src.label,
      action: "dismiss",
      value: { active },
      ts: Date.now(),
    });
  };

  #onComment = (e: CustomEvent<{ value: string }>): void => {
    const src = this.#resolveSource(e);
    if (!src) return;
    const text = e.detail?.value ?? "";
    this.#upsertState(src.item, src.label, { comment: text });
    this.#enqueue({
      schema: this.schemaVersion,
      subject: this.subject,
      item: src.item,
      label: src.label,
      action: "comment",
      value: { text },
      ts: Date.now(),
    });
  };

  #onClear = (): void => {
    this.#state = {};
    this.#writeStorage(); // clears the key
    this.#emitState();
  };

  #onExportRequest = (e: CustomEvent<{ format: string; subject?: string }>): void => {
    const fmt = e.detail?.format;
    if (fmt === "markdown") {
      void this.#exportMarkdown();
    } else if (fmt === "json") {
      this.#exportJson();
    } else if (fmt === "submit") {
      void this.#submitNow();
    } else if (fmt === "clear") {
      this.#onClear();
    }
  };

  // — batching ——————————————

  #enqueue(ev: FeedbackEvent): void {
    this.#pending.push(ev);
    if (this.batchMs <= 0) {
      void this.#flush();
      return;
    }
    if (this.#flushTimer) {
      clearTimeout(this.#flushTimer);
    }
    this.#flushTimer = setTimeout(() => {
      this.#flushTimer = null;
      void this.#flush();
    }, this.batchMs);
  }

  async #flush(): Promise<void> {
    if (this.#pending.length === 0) return;
    const batch = this.#pending;
    this.#pending = [];
    try {
      switch (this.transport) {
        case "localstorage":
          this.#writeStorage();
          this.#emitPersisted(batch, "localstorage");
          break;
        case "http":
          await this.#flushHttp(batch);
          break;
        case "file":
          await this.#flushFile(batch);
          break;
        case "console":
          this.#flushConsole(batch);
          break;
        case "custom":
          await this.#flushCustom(batch);
          break;
      }
    } finally {
      this.#emitState();
    }
  }

  // — transports ——————————————

  #storageKey(): string {
    return `${STORAGE_KEY_PREFIX}${this.subject}`;
  }

  #readStorage(): SubjectState | null {
    if (typeof window === "undefined" || !this.subject) return null;
    try {
      const raw = window.localStorage.getItem(this.#storageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as SubjectState;
      return null;
    } catch {
      return null;
    }
  }

  #writeStorage(): void {
    if (typeof window === "undefined" || !this.subject) return;
    try {
      if (Object.keys(this.#state).length === 0) {
        window.localStorage.removeItem(this.#storageKey());
      } else {
        window.localStorage.setItem(
          this.#storageKey(),
          JSON.stringify(this.#state)
        );
      }
    } catch (e) {
      this.#emitFailed([], "localstorage", e);
    }
  }

  async #flushHttp(batch: FeedbackEvent[]): Promise<void> {
    if (typeof fetch !== "function") {
      const err = new Error("fetch not available");
      this.#emitFailed(batch, "http", err);
      this.#httpFallback(batch);
      return;
    }
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      this.#emitPersisted(batch, "http");
    } catch (err) {
      this.#emitFailed(batch, "http", err);
      this.#httpFallback(batch);
    }
  }

  #httpFallback(batch: FeedbackEvent[]): void {
    if (this.offlineFallback === "localstorage") {
      this.#writeStorage();
      this.#emitPersisted(batch, "localstorage");
    }
  }

  async #flushFile(batch: FeedbackEvent[]): Promise<void> {
    if (typeof window === "undefined" || typeof document === "undefined") {
      this.#emitFailed(batch, "file", new Error("no DOM"));
      return;
    }
    const w = window as unknown as {
      showSaveFilePicker?: (opts: object) => Promise<unknown>;
    };
    if (w.showSaveFilePicker) {
      try {
        if (!this.#fileHandle) {
          this.#fileHandle = await w.showSaveFilePicker({
            suggestedName: `feedback-${this.subject}-${Date.now()}.json`,
            types: [{ description: "Feedback JSON", accept: { "application/json": [".json"] } }],
          });
        }
        const handle = this.#fileHandle as {
          createWritable: () => Promise<{
            write: (data: string) => Promise<void>;
            close: () => Promise<void>;
          }>;
        };
        const writable = await handle.createWritable();
        await writable.write(buildJsonExport(this.subject, this.schemaVersion, this.#state));
        await writable.close();
        this.#emitPersisted(batch, "file");
        return;
      } catch (err) {
        // fall through to anchor-download fallback
        this.#emitFailed(batch, "file", err);
      }
    }
    // Anchor-download fallback.
    try {
      const blob = new Blob(
        [buildJsonExport(this.subject, this.schemaVersion, this.#state)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${this.subject}-${Date.now()}.json`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.#emitPersisted(batch, "file");
    } catch (err) {
      this.#emitFailed(batch, "file", err);
    }
  }

  #flushConsole(batch: FeedbackEvent[]): void {
    this.#emitPersisted(batch, "console");
  }

  async #flushCustom(batch: FeedbackEvent[]): Promise<void> {
    if (typeof this.transportImpl !== "function") {
      this.#writeStorage();
      this.#emitPersisted(batch, "localstorage");
      return;
    }
    try {
      await this.transportImpl(batch);
      this.#emitPersisted(batch, "custom");
    } catch (err) {
      this.#emitFailed(batch, "custom", err);
    }
  }

  // — exports ——————————————

  async #exportMarkdown(): Promise<void> {
    const md = buildMarkdown(this.subject, this.#state);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(md);
        this.#emitPersisted([], "markdown");
        return;
      } catch (err) {
        this.#emitFailed([], "markdown", err);
        return;
      }
    }
    this.#emitFailed([], "markdown", new Error("no clipboard"));
  }

  #exportJson(): void {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    try {
      const json = buildJsonExport(this.subject, this.schemaVersion, this.#state);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${this.subject}-${Date.now()}.json`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.#emitPersisted([], "json");
    } catch (err) {
      this.#emitFailed([], "json", err);
    }
  }

  async #submitNow(): Promise<void> {
    // Build a fresh batch from current state — every item -> rate event etc.
    // Simplest: push all items as a synthetic "rate" + auxiliary actions.
    // Here we just POST current state wrapped as { state, exportedAt, schema, subject }
    // to keep the contract obvious.
    if (typeof fetch !== "function") {
      this.#emitFailed([], "submit", new Error("fetch not available"));
      return;
    }
    try {
      const body = {
        schema: this.schemaVersion,
        subject: this.subject,
        exportedAt: new Date().toISOString(),
        state: this.#state,
      };
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.#emitPersisted([], "http");
    } catch (err) {
      this.#emitFailed([], "http", err);
    }
  }

  // — outbound events ——————————————

  #emitPersisted(events: FeedbackEvent[], transport: string): void {
    this.dispatchEvent(
      new CustomEvent("ce-feedback-persisted", {
        bubbles: true,
        composed: true,
        detail: { events, transport },
      })
    );
  }

  #emitFailed(events: FeedbackEvent[], transport: string, error: unknown): void {
    this.dispatchEvent(
      new CustomEvent("ce-feedback-failed", {
        bubbles: true,
        composed: true,
        detail: { events, transport, error },
      })
    );
  }

  #emitState(): void {
    this.dispatchEvent(
      new CustomEvent("ce-feedback-state", {
        bubbles: true,
        composed: true,
        detail: { state: this.getState() },
      })
    );
  }
}

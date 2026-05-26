import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

// ---------------------------------------------------------------------------
// FeedEntry data shape (used by the data-array path, CDR-005)
// ---------------------------------------------------------------------------

export interface FeedEntryData {
  /** ISO 8601 datetime string. */
  time: string;
  /** Optional HTML content string. Ignored when slot children are used. */
  content?: string;
}

// ---------------------------------------------------------------------------
// Group-by bucket type
// ---------------------------------------------------------------------------

export type CeFeedGroupBy = "none" | "day" | "week" | "month";
export type CeFeedOrder = "newest" | "oldest";

// ---------------------------------------------------------------------------
// Helpers — date bucket key + label
// ---------------------------------------------------------------------------

/**
 * Returns a stable sort key for a bucket so entries group correctly.
 * Day   → "YYYY-MM-DD"
 * Week  → "YYYY-WNN" (ISO week)
 * Month → "YYYY-MM"
 */
function bucketKey(d: Date, groupBy: CeFeedGroupBy): string {
  if (groupBy === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (groupBy === "week") {
    // ISO week: find the Monday of the same week
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
    );
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  }
  // day (and default / fallback)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Human-readable group label, relative to `now` for day/week, absolute for month.
 * Uses Intl.DateTimeFormat for locale-friendly formatting.
 */
function bucketLabel(d: Date, groupBy: CeFeedGroupBy, now: Date): string {
  if (groupBy === "month") {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
    }).format(d);
  }

  if (groupBy === "week") {
    // Calculate the start of the week containing `d` (Monday-based)
    const weekStart = new Date(d);
    const day = d.getDay(); // 0=Sun..6=Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    weekStart.setDate(d.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const nowWeekStart = new Date(now);
    const nowDay = now.getDay();
    const nowDiffToMonday = nowDay === 0 ? -6 : 1 - nowDay;
    nowWeekStart.setDate(now.getDate() + nowDiffToMonday);
    nowWeekStart.setHours(0, 0, 0, 0);

    const diffMs = nowWeekStart.getTime() - weekStart.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 86400000));

    if (diffWeeks === 0) return "This week";
    if (diffWeeks === 1) return "Last week";
    return `Week of ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(weekStart)}`;
  }

  // day grouping
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = nowDay.getTime() - dDay.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

// ---------------------------------------------------------------------------
// CeFeedEntry — individual entry
// ---------------------------------------------------------------------------

/**
 * `<ce-feed-entry>` — A single item inside a `<ce-feed>`.
 *
 * Attributes:
 *   time — ISO 8601 datetime string (required for grouping / sorting).
 *
 * Slots:
 *   (default) — entry content; any HTML or ce-* tags.
 *
 * Accessibility: host carries role="article" per ARIA 1.1 feed pattern.
 */
export class CeFeedEntry extends CecElement {
  static override styles = css`
    :host {
      display: block;
      padding: var(--ce-space-2) 0;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }

    :host([data-dense]) {
      padding: var(--ce-space-1) 0;
    }

    .ce-feed-entry__body {
      display: flex;
      align-items: flex-start;
      gap: var(--ce-space-3);
    }

    .ce-feed-entry__dot {
      flex: 0 0 auto;
      margin-top: 5px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ce-border-strong);
    }

    .ce-feed-entry__content {
      flex: 1 1 auto;
      min-width: 0;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** ISO 8601 datetime. Parsed by ce-feed for sorting and grouping. */
  @property({ type: String, reflect: true })
  time = "";

  override connectedCallback(): void {
    super.connectedCallback();
    // ARIA 1.1 feed pattern: each item is an article
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "article");
    }
  }

  override render() {
    return html`
      <div class="ce-feed-entry__body">
        <span class="ce-feed-entry__dot" aria-hidden="true"></span>
        <div class="ce-feed-entry__content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// ---------------------------------------------------------------------------
// Internal type used during render — a sorted, grouped view of entries
// ---------------------------------------------------------------------------

interface RenderedGroup {
  key: string;
  label: string;
  entries: Array<{ el: HTMLElement | null; time: Date | null; content?: string }>;
}

// ---------------------------------------------------------------------------
// CeFeed — the container
// ---------------------------------------------------------------------------

/**
 * `<ce-feed>` — Reverse-chronological stream of entries with optional time-bucket grouping.
 *
 * Designed for activity logs, social feeds, audit trails, release notes,
 * RSS aggregators, notifications, and commit histories.
 *
 * Attributes:
 *   group-by — "none" | "day" | "week" | "month" (default "none")
 *   order    — "newest" | "oldest" (default "newest")
 *   dense    — boolean; reduces entry spacing
 *
 * Slots:
 *   (default) — `<ce-feed-entry>` children
 *
 * Data array path (CDR-005):
 *   Set the `data` property to an array of `{ time, content? }` objects.
 *   When `data` is non-empty, slot children are ignored.
 *
 * Accessibility:
 *   Host carries role="feed" (ARIA 1.1). Group headers carry role="presentation".
 *   Each entry carries role="article" (set by CeFeedEntry.connectedCallback).
 *
 * Streaming:
 *   Re-groups on every slotchange — new entries can be appended after upgrade.
 */
export class CeFeed extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }

    .ce-feed__list {
      display: flex;
      flex-direction: column;
    }

    .ce-feed__group {
      font-size: var(--ce-text-xs);
      font-weight: 600;
      color: var(--ce-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: var(--ce-space-3) 0 var(--ce-space-1);
      border-bottom: 1px solid var(--ce-border-soft);
      margin-bottom: var(--ce-space-2);
      position: sticky;
      top: 0;
      background: var(--ce-surface, transparent);
      z-index: 1;
    }

    /* First group header: no top padding — already at the top of the list */
    .ce-feed__group:first-child {
      padding-top: 0;
    }

    :host([dense]) .ce-feed__group {
      padding: var(--ce-space-2) 0 0;
      margin-bottom: var(--ce-space-1);
    }

    /* Render-slot is hidden; real output is in .ce-feed__list */
    .ce-feed__slot-capture {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  // -------------------------------------------------------------------------
  // Properties
  // -------------------------------------------------------------------------

  /** Bucket grouping mode. */
  @property({ type: String, attribute: "group-by", reflect: true })
  groupBy: CeFeedGroupBy = "none";

  /** Sort direction. */
  @property({ type: String, reflect: true })
  order: CeFeedOrder = "newest";

  /** Dense spacing mode. */
  @property({ type: Boolean, reflect: true })
  dense = false;

  /**
   * Data array path (CDR-005). When non-empty, slot children are ignored.
   * Accepts either a JSON string attribute or a JS array assignment.
   */
  @property(jsonProp<FeedEntryData[]>([]))
  data: FeedEntryData[] = [];

  // -------------------------------------------------------------------------
  // Internal reactive state — updated on slotchange only
  // -------------------------------------------------------------------------

  /** Tracks slotted ce-feed-entry children; updating this triggers re-render. */
  @state() private _slotEntries: Array<{ el: HTMLElement; time: Date | null }> = [];

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "feed");
    }
  }

  // -------------------------------------------------------------------------
  // Slot change handling (streaming-friendly)
  // -------------------------------------------------------------------------

  #onSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: false }) as HTMLElement[];
    this._slotEntries = assigned.map((el) => ({
      el,
      time: this.#parseTime(el.getAttribute("time") ?? ""),
    }));
  };

  #parseTime(value: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // -------------------------------------------------------------------------
  // Group computation — pure derivation from current props + slotEntries.
  // Called from render() so no secondary reactive cycle is triggered.
  // -------------------------------------------------------------------------

  #computeGroups(): RenderedGroup[] {
    const now = new Date();
    const useData = this.data.length > 0;

    // Normalise entries
    type Entry = { el: HTMLElement | null; time: Date | null; content?: string };
    let entries: Entry[];

    if (useData) {
      entries = this.data.map((d) => ({
        el: null,
        time: this.#parseTime(d.time),
        content: d.content,
      }));
    } else {
      entries = this._slotEntries.map(({ el, time }) => ({ el, time }));
    }

    // Sort — invalid-time entries always land at the end
    entries = [...entries].sort((a, b) => {
      if (a.time === null && b.time === null) return 0;
      if (a.time === null) return 1;
      if (b.time === null) return -1;
      const ta = a.time.getTime();
      const tb = b.time.getTime();
      return this.order === "newest" ? tb - ta : ta - tb;
    });

    // Propagate dense flag to slot children as a side-effect here.
    // This is the only place we need to touch the DOM outside the shadow root.
    if (!useData) {
      for (const { el } of this._slotEntries) {
        if (this.dense) {
          el.setAttribute("data-dense", "");
        } else {
          el.removeAttribute("data-dense");
        }
      }
    }

    if (this.groupBy === "none") {
      return [
        {
          key: "__none__",
          label: "",
          entries: entries as RenderedGroup["entries"],
        },
      ];
    }

    // Bucket grouping — walk sorted entries and open a new group on key change
    const groupMap = new Map<string, RenderedGroup>();
    for (const entry of entries) {
      const d = entry.time;
      if (d === null) {
        const k = "__invalid__";
        let group = groupMap.get(k);
        if (!group) {
          group = { key: k, label: "Unknown time", entries: [] };
          groupMap.set(k, group);
        }
        group.entries.push(entry as RenderedGroup["entries"][number]);
        continue;
      }
      const key = bucketKey(d, this.groupBy);
      let group = groupMap.get(key);
      if (!group) {
        group = { key, label: bucketLabel(d, this.groupBy, now), entries: [] };
        groupMap.set(key, group);
      }
      group.entries.push(entry as RenderedGroup["entries"][number]);
    }

    return Array.from(groupMap.values());
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  override render() {
    const useData = this.data.length > 0;
    const showGroupHeaders = this.groupBy !== "none";
    const groups = this.#computeGroups();

    return html`
      <!-- Hidden slot captures slotted ce-feed-entry children for re-ordering -->
      <slot
        class="ce-feed__slot-capture"
        @slotchange=${this.#onSlotChange}
      ></slot>

      <div class="ce-feed__list" aria-live="polite">
        ${groups.map((group) =>
          html`
            ${showGroupHeaders && group.key !== "__none__"
              ? html`<header
                  class="ce-feed__group"
                  role="presentation"
                >${group.label}</header>`
              : nothing}
            ${group.entries.map(({ el, content }) =>
              useData || el === null
                ? html`<ce-feed-entry>
                    ${content ? html`${content}` : nothing}
                  </ce-feed-entry>`
                : el
            )}
          `
        )}
      </div>
    `;
  }

  // Expose computed groups for test introspection via _groups accessor.
  // (Tests access this via the same path as before.)
  get _groups(): RenderedGroup[] {
    return this.#computeGroups();
  }
}

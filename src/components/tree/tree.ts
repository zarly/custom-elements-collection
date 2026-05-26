/* eslint-disable max-lines --
 * ce-tree pairs the host (ce-tree) with its node (ce-tree-node) — two
 * tightly-coupled custom elements that share visible-node enumeration,
 * roving-tabindex focus management, ARIA tree keyboard nav (Arrow up/down
 * to move, Arrow right/left to expand/collapse / move to parent, Home/End,
 * default-expanded "all" / "depth-N" resolution), and the JSON-vs-slot
 * dual data path. Splitting the host and node into separate files would
 * either re-couple them through a shared mutable focus registry or push
 * #visibleNodes() state through every keyboard branch. Carve-out at 456
 * lines (56 over the 400 limit); revisit when virtualized rendering lands
 * or a second tree-shaped component (file-picker) reuses the substrate.
 */
import { html, css, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, classNames, jsonProp, defineOnce } from "../../core/index.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TreeNodeData {
  label: string;
  children?: TreeNodeData[];
}

export type DefaultExpanded = "all" | "root" | "none" | "depth-1" | "depth-2" | "depth-3";

// ── CeTreeNode ───────────────────────────────────────────────────────────────

/**
 * `<ce-tree-node>` — a single item in a `<ce-tree>`.
 *
 * Can be nested recursively via slot children or rendered by the parent
 * tree from a data array. Sets role="treeitem", aria-expanded, aria-level,
 * aria-setsize, and aria-posinset automatically.
 *
 * Attributes:
 *   label    — text label for this node
 *   expanded — whether children are visible (reflected)
 *   disabled — disables expand/collapse interaction
 *
 * Slots:
 *   label    — custom label markup (overrides the `label` attribute)
 *   (default) — nested `<ce-tree-node>` children
 */
export class CeTreeNode extends CecElement {
  static override styles = css`
    :host {
      display: block;
      outline: none;
    }

    .ce-tree-node__row {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-space-1) var(--ce-space-2);
      border-radius: var(--ce-radius-sm);
      cursor: default;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
      user-select: none;
      position: relative;
      min-height: 28px;
      box-sizing: border-box;
    }

    :host([disabled]) .ce-tree-node__row {
      opacity: 0.45;
      cursor: not-allowed;
    }

    :host(:not([disabled])) .ce-tree-node__row:hover {
      background: var(--ce-state-hover);
    }

    :host([tabindex="0"]) .ce-tree-node__row,
    :host(:focus-visible) .ce-tree-node__row {
      background: var(--ce-state-hover);
      outline: none;
    }

    :host(:focus-visible) .ce-tree-node__row {
      box-shadow: var(--ce-focus-ring);
    }

    .ce-tree-node__chevron {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ce-muted);
      transition: transform 120ms ease;
      border-radius: var(--ce-radius-sm);
    }

    .ce-tree-node__chevron--leaf {
      opacity: 0;
      pointer-events: none;
    }

    :host([expanded]) .ce-tree-node__chevron:not(.ce-tree-node__chevron--leaf) {
      transform: rotate(90deg);
    }

    .ce-tree-node__chevron:hover {
      color: var(--ce-text);
    }

    .ce-tree-node__label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ce-tree-node__children {
      padding-left: var(--ce-space-5);
      display: block;
    }

    /* Lines variant — drawn via host context class set by ce-tree */
    :host-context(.ce-tree--lines) .ce-tree-node__children {
      border-left: 1px solid var(--ce-border-soft);
      margin-left: 7px;
      padding-left: calc(var(--ce-space-5) - 1px);
    }

    .ce-tree-node__children[hidden] {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  label = "";

  @property({ type: Boolean, reflect: true })
  expanded = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  // Set by parent tree during aria computation.
  @state() private _level = 1;
  @state() private _setsize = 1;
  @state() private _posinset = 1;
  @state() private _hasChildren = false;

  /** Called by parent tree to set ARIA position metadata. */
  setAriaPosition(level: number, setsize: number, posinset: number, hasChildren: boolean): void {
    this._level = level;
    this._setsize = setsize;
    this._posinset = posinset;
    this._hasChildren = hasChildren;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "treeitem");
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "-1");
    }
    this.addEventListener("keydown", this.#onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.#onKeyDown);
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    this.setAttribute("aria-level", String(this._level));
    this.setAttribute("aria-setsize", String(this._setsize));
    this.setAttribute("aria-posinset", String(this._posinset));
    if (this._hasChildren) {
      this.setAttribute("aria-expanded", String(this.expanded));
    } else {
      this.removeAttribute("aria-expanded");
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  #toggleExpanded(e?: Event): void {
    e?.stopPropagation();
    if (this.disabled) return;
    if (!this._hasChildren) return;
    this.expanded = !this.expanded;
    this.dispatchEvent(
      new CustomEvent("ce-tree-node-toggle", {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded, node: this },
      })
    );
  }

  #onKeyDown = (e: KeyboardEvent): void => {
    // Navigation keys are delegated up to the tree root via composed events.
    // Only handle local keys here; tree root handles ArrowDown/Up/Right/Left.
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.#toggleExpanded();
    }
  };

  override render() {
    const isLeaf = !this._hasChildren;
    return html`
      <div
        class=${classNames("ce-tree-node__row")}
        @click=${this.#toggleExpanded}
        part="row"
      >
        <span
          class=${classNames(
            "ce-tree-node__chevron",
            isLeaf ? "ce-tree-node__chevron--leaf" : ""
          )}
          aria-hidden="true"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M3 2l4 3-4 3"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="ce-tree-node__label">
          <slot name="label">${this.label}</slot>
        </span>
      </div>
      <div
        class="ce-tree-node__children"
        role="group"
        ?hidden=${!this.expanded}
      >
        <slot></slot>
      </div>
    `;
  }
}

// ── CeTree ───────────────────────────────────────────────────────────────────

/**
 * `<ce-tree>` — generic recursive expand/collapse tree.
 *
 * Accepts either slot children (`<ce-tree-node>` recursively) or a JSON
 * `data` array (`[{label, children?:[…]}]`). Both are supported per CDR-005.
 *
 * Attributes:
 *   data              — JSON array of `{label, children?}` nodes
 *   default-expanded  — startup directive: all|root|none|depth-1|depth-2|depth-3
 *   lines             — boolean; draw connector lines between nodes
 *   dense             — boolean; tighter row padding
 *
 * Keyboard navigation (ARIA tree pattern):
 *   ArrowDown  — next visible node
 *   ArrowUp    — prev visible node
 *   ArrowRight — expand collapsed node; or move to first child when expanded
 *   ArrowLeft  — collapse expanded node; or move to parent when collapsed
 *   Home       — first visible node
 *   End        — last visible node
 *
 * A11y:
 *   role="tree" on the root; each node gets role="treeitem",
 *   aria-expanded, aria-level, aria-setsize, aria-posinset.
 *   Roving tabindex — only the focused node holds tabindex="0".
 */
export class CeTree extends CecElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--ce-font-sans);
      color: var(--ce-text);
      outline: none;
    }

    :host([dense]) {
      --ce-tree-row-min-height: 22px;
      font-size: var(--ce-text-xs);
    }

    .ce-tree__root {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    /* data-mode virtual nodes */
    .ce-tree__virtual {
      display: block;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<TreeNodeData[]>([], "data"))
  data: TreeNodeData[] = [];

  @property({ type: String, attribute: "default-expanded", reflect: true })
  defaultExpanded: DefaultExpanded = "none";

  @property({ type: Boolean, reflect: true })
  lines = false;

  @property({ type: Boolean, reflect: true })
  dense = false;

  // Currently focused node (for roving tabindex).
  #focusedNode: CeTreeNode | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "tree");
    this.addEventListener("keydown", this.#onKeyDown);
    this.addEventListener("ce-tree-node-toggle", this.#onNodeToggle);
    this.addEventListener("focusin", this.#onFocusIn);
    // Lines class for :host-context CSS on nodes
    this.classList.toggle("ce-tree--lines", this.lines);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.#onKeyDown);
    this.removeEventListener("ce-tree-node-toggle", this.#onNodeToggle);
    this.removeEventListener("focusin", this.#onFocusIn);
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has("lines")) {
      this.classList.toggle("ce-tree--lines", this.lines);
    }
  }

  // ── Slot-mode: initialise after first slot update ─────────────────────────

  override firstUpdated(): void {
    // Give slot children one microtask to upgrade before we touch them.
    Promise.resolve().then(() => {
      this.#applyDefaultExpanded();
      this.#updateAriaOnAll();
      this.#initFocus();
    });
  }

  // ── Default-expanded logic ────────────────────────────────────────────────

  #applyDefaultExpanded(): void {
    const mode = this.defaultExpanded;
    if (mode === "none") return;

    const allNodes = this.#allNodesInDom();
    if (mode === "all") {
      allNodes.forEach((n) => { n.expanded = true; });
      return;
    }
    if (mode === "root") {
      // Only direct children of <ce-tree> root group.
      this.#directNodeChildren(this).forEach((n) => { n.expanded = true; });
      return;
    }
    const depthMap: Record<string, number> = {
      "depth-1": 1,
      "depth-2": 2,
      "depth-3": 3,
    };
    const maxDepth = depthMap[mode];
    if (maxDepth !== undefined) {
      allNodes.forEach((n) => {
        const depth = this.#nodeDepth(n);
        if (depth <= maxDepth) n.expanded = true;
      });
    }
  }

  // ── ARIA position metadata ────────────────────────────────────────────────

  #updateAriaOnAll(): void {
    this.#updateAriaGroup(this, 1);
  }

  #updateAriaGroup(container: Element, level: number): void {
    const children = this.#directNodeChildren(container);
    const setsize = children.length;
    children.forEach((node, idx) => {
      const hasKids = this.#directNodeChildren(node).length > 0;
      node.setAriaPosition(level, setsize, idx + 1, hasKids);
      // Recurse into children regardless of expanded state (ARIA needs values)
      this.#updateAriaGroup(node, level + 1);
    });
  }

  // ── Focus management ─────────────────────────────────────────────────────

  #initFocus(): void {
    const first = this.#visibleNodes()[0];
    if (first) this.#setFocus(first, false);
  }

  #setFocus(node: CeTreeNode, doFocus = true): void {
    // Remove tabindex=0 from previous
    this.#allNodesInDom().forEach((n) => n.setAttribute("tabindex", "-1"));
    node.setAttribute("tabindex", "0");
    this.#focusedNode = node;
    if (doFocus) node.focus();
  }

  #onFocusIn = (e: FocusEvent): void => {
    const target = e.target as Element;
    if (target instanceof CeTreeNode) {
      // Update roving tabindex when a node receives focus by any means
      this.#allNodesInDom().forEach((n) => n.setAttribute("tabindex", "-1"));
      target.setAttribute("tabindex", "0");
      this.#focusedNode = target;
    }
  };

  // ── Keyboard navigation ───────────────────────────────────────────────────

  #targetForLinearKey(
    key: string,
    visible: CeTreeNode[],
    idx: number,
  ): CeTreeNode | undefined {
    if (key === "ArrowDown") return visible[idx + 1];
    if (key === "ArrowUp") return visible[idx - 1];
    if (key === "Home") return visible[0];
    if (key === "End") return visible[visible.length - 1];
    return undefined;
  }

  #onKeyDown = (e: KeyboardEvent): void => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
      return;
    }
    e.preventDefault();

    const visible = this.#visibleNodes();
    const focused = this.#focusedNode;
    if (visible.length === 0) return;

    if (e.key === "ArrowRight") {
      if (focused) this.#onArrowRight(focused);
      return;
    }
    if (e.key === "ArrowLeft") {
      if (focused) this.#onArrowLeft(focused);
      return;
    }
    const idx = focused ? visible.indexOf(focused) : -1;
    const target = this.#targetForLinearKey(e.key, visible, idx);
    if (target) this.#setFocus(target);
  };

  #onArrowRight(focused: CeTreeNode): void {
    const hasKids = this.#directNodeChildren(focused).length > 0;
    if (!focused.expanded && hasKids) {
      focused.expanded = true;
      this.#notifyToggle(focused);
    } else if (focused.expanded && hasKids) {
      const newVisible = this.#visibleNodes();
      const newIdx = newVisible.indexOf(focused);
      const firstChild = newVisible[newIdx + 1];
      if (firstChild) this.#setFocus(firstChild);
    }
    this.#updateAriaOnAll();
  }

  #onArrowLeft(focused: CeTreeNode): void {
    const hasKids = this.#directNodeChildren(focused).length > 0;
    if (focused.expanded && hasKids) {
      focused.expanded = false;
      this.#notifyToggle(focused);
      this.#updateAriaOnAll();
      return;
    }
    const parent = this.#parentNode(focused);
    if (parent) this.#setFocus(parent);
  }

  #onNodeToggle = (): void => {
    this.#updateAriaOnAll();
  };

  #notifyToggle(node: CeTreeNode): void {
    node.dispatchEvent(
      new CustomEvent("ce-tree-node-toggle", {
        bubbles: true,
        composed: true,
        detail: { expanded: node.expanded, node },
      })
    );
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────

  /** All ce-tree-node elements in this tree, in DOM tree order. */
  #allNodesInDom(): CeTreeNode[] {
    if (this.data.length > 0) {
      // Data mode: nodes are in shadow DOM
      return Array.from(
        (this.shadowRoot ?? this).querySelectorAll<CeTreeNode>("ce-tree-node")
      );
    }
    // Slot mode: nodes are in light DOM
    return Array.from(this.querySelectorAll<CeTreeNode>("ce-tree-node"));
  }

  /** Direct ce-tree-node children of a given container (tree root or another node). */
  #directNodeChildren(container: Element): CeTreeNode[] {
    if (container instanceof CeTree) {
      if (this.data.length > 0) {
        // Data mode: direct children of the virtual root ul
        const root = this.shadowRoot?.querySelector(".ce-tree__root");
        if (!root) return [];
        return Array.from(root.children).filter(
          (c): c is CeTreeNode => c instanceof CeTreeNode
        );
      }
      // Slot mode: direct ce-tree-node children
      return Array.from(container.children).filter(
        (c): c is CeTreeNode => c instanceof CeTreeNode
      );
    }
    // For a node: its slot children (in light DOM) or its shadow slot assignment
    if (container instanceof CeTreeNode) {
      // Slot children are in light DOM — they're children of the node element itself
      return Array.from(container.children).filter(
        (c): c is CeTreeNode => c instanceof CeTreeNode
      );
    }
    return [];
  }

  /** Compute the tree depth of a node (1 = direct child of root). */
  #nodeDepth(node: CeTreeNode): number {
    let depth = 0;
    let current: Element | null = node;
    while (current && current !== this) {
      if (current instanceof CeTreeNode) depth++;
      current = current.parentElement;
    }
    return depth;
  }

  /** Parent ce-tree-node of a given node, if any (null if at root level). */
  #parentNode(node: CeTreeNode): CeTreeNode | null {
    let current: Element | null = node.parentElement;
    while (current && current !== this) {
      if (current instanceof CeTreeNode) return current;
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Collect all visible nodes in tree order.
   * A node is visible when all its ancestors are expanded.
   */
  #visibleNodes(): CeTreeNode[] {
    const result: CeTreeNode[] = [];
    this.#collectVisible(this, result);
    return result;
  }

  #collectVisible(container: Element, out: CeTreeNode[]): void {
    const children = this.#directNodeChildren(container);
    for (const node of children) {
      out.push(node);
      if (node.expanded) {
        this.#collectVisible(node, out);
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  override render() {
    if (this.data.length > 0) {
      // Data mode: render virtual nodes in shadow DOM
      return html`
        <div class="ce-tree__root" part="root">
          ${this.#renderDataNodes(this.data)}
        </div>
      `;
    }
    // Slot mode: light DOM children are the nodes
    return html`<slot></slot>`;
  }

  #renderDataNodes(nodes: TreeNodeData[]): unknown {
    return nodes.map((item) => {
      const hasKids = Boolean(item.children && item.children.length > 0);
      return html`
        <ce-tree-node
          label=${item.label}
          class="ce-tree__virtual"
        >
          ${hasKids && item.children ? this.#renderDataNodes(item.children) : nothing}
        </ce-tree-node>
      `;
    });
  }
}

// ── Registration ─────────────────────────────────────────────────────────────

defineOnce("ce-tree-node", CeTreeNode);
defineOnce("ce-tree", CeTree);

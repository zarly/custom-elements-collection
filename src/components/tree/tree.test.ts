import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeTree, CeTreeNode } from "./tree.js";

beforeAll(() => {
  defineOnce("ce-tree", CeTree);
  defineOnce("ce-tree-node", CeTreeNode);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeTree | CeTreeNode).updateComplete;
}

async function readyAll(container: HTMLElement): Promise<void> {
  const tree = container.querySelector("ce-tree");
  if (tree) await ready(tree);
  const nodes = container.querySelectorAll("ce-tree-node");
  for (const node of nodes) await ready(node);
  // Allow firstUpdated Promise.resolve to settle
  await new Promise<void>((r) => setTimeout(r, 0));
}

const isParentNode = (n: CeTreeNode): boolean =>
  Array.from(n.children).some((c) => c instanceof CeTreeNode);

// ── 1. Upgrades and renders ───────────────────────────────────────────────

describe("<ce-tree> — upgrade", () => {
  it("upgrades and creates a shadow root", async () => {
    const host = mount(`<ce-tree></ce-tree>`);
    const tree = host.querySelector("ce-tree") as CeTree;
    await readyAll(host);
    expect(tree.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("has role=tree on the root element", async () => {
    const host = mount(`<ce-tree></ce-tree>`);
    const tree = host.querySelector("ce-tree")!;
    await readyAll(host);
    expect(tree.getAttribute("role")).toBe("tree");
    host.remove();
  });
});

// ── 2. Slot children mode ─────────────────────────────────────────────────

describe("<ce-tree> — slot children", () => {
  it("renders the tree structure from slot children", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="src">
          <ce-tree-node label="components"></ce-tree-node>
          <ce-tree-node label="core"></ce-tree-node>
        </ce-tree-node>
        <ce-tree-node label="docs"></ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);
    const nodes = host.querySelectorAll("ce-tree-node");
    expect(nodes.length).toBe(4);
    const labels = Array.from(nodes).map((n) => (n as CeTreeNode).label);
    expect(labels).toContain("src");
    expect(labels).toContain("components");
    expect(labels).toContain("core");
    expect(labels).toContain("docs");
    host.remove();
  });

  it("nodes have role=treeitem", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="alpha"></ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);
    const node = host.querySelector("ce-tree-node")!;
    expect(node.getAttribute("role")).toBe("treeitem");
    host.remove();
  });
});

// ── 3. Data array mode ────────────────────────────────────────────────────

describe("<ce-tree> — data array", () => {
  it("renders nodes from JSON data attribute", async () => {
    const data = JSON.stringify([
      { label: "Root", children: [{ label: "Child A" }, { label: "Child B" }] },
    ]);
    const host = mount(`<ce-tree data='${data}'></ce-tree>`);
    const tree = host.querySelector("ce-tree") as CeTree;
    await ready(tree);
    await new Promise<void>((r) => setTimeout(r, 0));
    // Virtual nodes are in shadow DOM
    const shadowNodes = tree.shadowRoot!.querySelectorAll("ce-tree-node");
    expect(shadowNodes.length).toBe(3); // Root + Child A + Child B
    host.remove();
  });

  it("renders empty gracefully when data is empty", async () => {
    const host = mount(`<ce-tree></ce-tree>`);
    await readyAll(host);
    // No error, no nodes
    const nodes = host.querySelectorAll("ce-tree-node");
    expect(nodes.length).toBe(0);
    host.remove();
  });
});

// ── 4. default-expanded="all" ─────────────────────────────────────────────

describe("<ce-tree> — default-expanded", () => {
  it('default-expanded="all" expands every node', async () => {
    const host = mount(`
      <ce-tree default-expanded="all">
        <ce-tree-node label="A">
          <ce-tree-node label="A1">
            <ce-tree-node label="A1a"></ce-tree-node>
          </ce-tree-node>
        </ce-tree-node>
        <ce-tree-node label="B"></ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);
    const nodes = Array.from(host.querySelectorAll("ce-tree-node")) as CeTreeNode[];
    // Only nodes that have children should be expanded.
    // A and A1 have children; A1a and B are leaves.
    const parentNodes = nodes.filter(isParentNode);
    expect(parentNodes.length).toBeGreaterThan(0);
    parentNodes.forEach((n) => expect(n.expanded).toBe(true));
    host.remove();
  });

  it('default-expanded="depth-1" expands only first-level nodes', async () => {
    const host = mount(`
      <ce-tree default-expanded="depth-1">
        <ce-tree-node label="Root1">
          <ce-tree-node label="Child1">
            <ce-tree-node label="GrandChild1"></ce-tree-node>
          </ce-tree-node>
        </ce-tree-node>
        <ce-tree-node label="Root2">
          <ce-tree-node label="Child2"></ce-tree-node>
        </ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    // depth-1 nodes: Root1, Root2 should be expanded
    const root1 = host.querySelector("ce-tree-node[label='Root1']") as CeTreeNode;
    const root2 = host.querySelector("ce-tree-node[label='Root2']") as CeTreeNode;
    const child1 = host.querySelector("ce-tree-node[label='Child1']") as CeTreeNode;

    expect(root1.expanded).toBe(true);
    expect(root2.expanded).toBe(true);
    // Child1 is at depth 2 — should not be expanded
    expect(child1.expanded).toBe(false);
    host.remove();
  });

  it('default-expanded="none" leaves all nodes collapsed', async () => {
    const host = mount(`
      <ce-tree default-expanded="none">
        <ce-tree-node label="X">
          <ce-tree-node label="Y"></ce-tree-node>
        </ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);
    const nodes = Array.from(host.querySelectorAll("ce-tree-node")) as CeTreeNode[];
    nodes.forEach((n) => expect(n.expanded).toBe(false));
    host.remove();
  });
});

// ── 5. Chevron click toggles expanded ─────────────────────────────────────

describe("<ce-tree-node> — toggle", () => {
  it("clicking the row toggles expanded and updates aria-expanded", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="parent">
          <ce-tree-node label="child"></ce-tree-node>
        </ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    const parent = host.querySelector("ce-tree-node[label='parent']") as CeTreeNode;
    await ready(parent);

    expect(parent.expanded).toBe(false);
    expect(parent.getAttribute("aria-expanded")).toBe("false");

    // Click the row in the shadow root
    const row = parent.shadowRoot!.querySelector(".ce-tree-node__row") as HTMLElement;
    row.click();
    await ready(parent);

    expect(parent.expanded).toBe(true);
    expect(parent.getAttribute("aria-expanded")).toBe("true");

    // Click again — collapse
    row.click();
    await ready(parent);
    expect(parent.expanded).toBe(false);
    host.remove();
  });

  it("ce-tree-node-toggle event fires on click", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="toggler">
          <ce-tree-node label="inner"></ce-tree-node>
        </ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    const parent = host.querySelector("ce-tree-node[label='toggler']") as CeTreeNode;
    let fired = 0;
    let firedExpanded: boolean | undefined;
    host.addEventListener("ce-tree-node-toggle", (e) => {
      fired++;
      firedExpanded = (e as CustomEvent).detail.expanded;
    });

    const row = parent.shadowRoot!.querySelector(".ce-tree-node__row") as HTMLElement;
    row.click();
    await ready(parent);

    expect(fired).toBe(1);
    expect(firedExpanded).toBe(true);
    host.remove();
  });
});

// ── 6. Keyboard navigation ────────────────────────────────────────────────

describe("<ce-tree> — keyboard navigation", () => {
  it("ArrowDown moves focus to the next visible node", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="A"></ce-tree-node>
        <ce-tree-node label="B"></ce-tree-node>
        <ce-tree-node label="C"></ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    const tree = host.querySelector("ce-tree") as CeTree;
    const nodeA = host.querySelector("ce-tree-node[label='A']") as CeTreeNode;
    const nodeB = host.querySelector("ce-tree-node[label='B']") as CeTreeNode;

    // Focus node A
    nodeA.setAttribute("tabindex", "0");
    nodeA.focus();
    (tree as unknown as { _focusedNode: CeTreeNode })["_CeTree__focusedNode" as keyof CeTree] = nodeA as unknown as never;
    // Use the tree's internal focus tracking via focusin
    nodeA.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    tree.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(nodeB.getAttribute("tabindex")).toBe("0");
    host.remove();
  });

  it("ArrowRight expands a collapsed node", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="parent">
          <ce-tree-node label="child"></ce-tree-node>
        </ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    const tree = host.querySelector("ce-tree") as CeTree;
    const parent = host.querySelector("ce-tree-node[label='parent']") as CeTreeNode;

    expect(parent.expanded).toBe(false);

    // Focus parent node
    parent.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    tree.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await ready(parent);

    expect(parent.expanded).toBe(true);
    host.remove();
  });

  it("ArrowLeft collapses an expanded node", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="parent" expanded>
          <ce-tree-node label="child"></ce-tree-node>
        </ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    const tree = host.querySelector("ce-tree") as CeTree;
    const parent = host.querySelector("ce-tree-node[label='parent']") as CeTreeNode;

    expect(parent.expanded).toBe(true);

    parent.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    tree.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await ready(parent);

    expect(parent.expanded).toBe(false);
    host.remove();
  });

  it("ArrowLeft on a collapsed node moves focus to parent", async () => {
    const host = mount(`
      <ce-tree default-expanded="all">
        <ce-tree-node label="parent">
          <ce-tree-node label="child"></ce-tree-node>
        </ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    const tree = host.querySelector("ce-tree") as CeTree;
    const parent = host.querySelector("ce-tree-node[label='parent']") as CeTreeNode;
    const child = host.querySelector("ce-tree-node[label='child']") as CeTreeNode;

    // Focus the child (which is a leaf, so collapsed = false from the leaf's perspective)
    child.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    tree.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));

    // Parent should now have tabindex=0
    expect(parent.getAttribute("tabindex")).toBe("0");
    host.remove();
  });

  it("Home moves focus to the first visible node", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="first"></ce-tree-node>
        <ce-tree-node label="second"></ce-tree-node>
        <ce-tree-node label="third"></ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    const tree = host.querySelector("ce-tree") as CeTree;
    const first = host.querySelector("ce-tree-node[label='first']") as CeTreeNode;
    const third = host.querySelector("ce-tree-node[label='third']") as CeTreeNode;

    // Focus third, then press Home
    third.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    tree.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));

    expect(first.getAttribute("tabindex")).toBe("0");
    host.remove();
  });

  it("End moves focus to the last visible node", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="first"></ce-tree-node>
        <ce-tree-node label="second"></ce-tree-node>
        <ce-tree-node label="last"></ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    const tree = host.querySelector("ce-tree") as CeTree;
    const first = host.querySelector("ce-tree-node[label='first']") as CeTreeNode;
    const last = host.querySelector("ce-tree-node[label='last']") as CeTreeNode;

    first.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    tree.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));

    expect(last.getAttribute("tabindex")).toBe("0");
    host.remove();
  });
});

// ── 7. Disabled node ─────────────────────────────────────────────────────

describe("<ce-tree-node> — disabled", () => {
  it("disabled node does not toggle on click", async () => {
    const host = mount(`
      <ce-tree>
        <ce-tree-node label="disabled-parent" disabled>
          <ce-tree-node label="child"></ce-tree-node>
        </ce-tree-node>
      </ce-tree>
    `);
    await readyAll(host);

    const parent = host.querySelector("ce-tree-node[label='disabled-parent']") as CeTreeNode;
    const row = parent.shadowRoot!.querySelector(".ce-tree-node__row") as HTMLElement;
    row.click();
    await ready(parent);

    expect(parent.expanded).toBe(false);
    host.remove();
  });
});

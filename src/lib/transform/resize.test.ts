import { describe, expect, it } from "vitest";

import type { StickerNode } from "@/lib/scene/types";

import { add, rotate, type Vec2 } from "./geometry";
import { HANDLE_DIR, type ResizeHandle, resizeNode } from "./resize";

function makeNode(over: Partial<StickerNode> = {}): StickerNode {
  return {
    id: "n",
    giphyId: "g",
    src: "/x",
    baseWidth: 100,
    baseHeight: 100,
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    z: 0,
    title: "",
    ...over,
  };
}

/** World-space position of a handle for a given node (test oracle). */
function handleWorld(node: StickerNode, handle: ResizeHandle): Vec2 {
  const dir = HANDLE_DIR[handle];
  const hx = (node.baseWidth * node.scaleX) / 2;
  const hy = (node.baseHeight * node.scaleY) / 2;
  return add(
    { x: node.x, y: node.y },
    rotate({ x: dir.x * hx, y: dir.y * hy }, node.rotation),
  );
}

const OPPOSITE: Record<ResizeHandle, ResizeHandle> = {
  nw: "se",
  n: "s",
  ne: "sw",
  e: "w",
  se: "nw",
  s: "n",
  sw: "ne",
  w: "e",
};

describe("resizeNode — axis-aligned (rotation 0)", () => {
  it("drags a corner and anchors the opposite corner", () => {
    const node = makeNode(); // 100×100, corners at ±50
    const r = resizeNode(node, "se", { x: 100, y: 100 }, false);
    expect(r.x).toBeCloseTo(25, 6);
    expect(r.y).toBeCloseTo(25, 6);
    expect(r.scaleX).toBeCloseTo(1.5, 6);
    expect(r.scaleY).toBeCloseTo(1.5, 6);
  });

  it("edge handle resizes only its own axis", () => {
    const node = makeNode();
    // Dragging the east edge; the wild y value must be ignored.
    const r = resizeNode(node, "e", { x: 100, y: 999 }, false);
    expect(r.scaleX).toBeCloseTo(1.5, 6);
    expect(r.scaleY).toBeCloseTo(1, 6);
    expect(r.x).toBeCloseTo(25, 6);
    expect(r.y).toBeCloseTo(0, 6);
  });

  it("keeps the opposite corner pinned after a corner resize", () => {
    const node = makeNode();
    const before = handleWorld(node, "nw");
    const r = resizeNode(node, "se", { x: 220, y: 80 }, false);
    const after = handleWorld(
      { ...node, x: r.x, y: r.y, scaleX: r.scaleX, scaleY: r.scaleY },
      "nw",
    );
    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.y).toBeCloseTo(before.y, 6);
  });

  it("clamps to a minimum size instead of collapsing to zero", () => {
    const node = makeNode();
    // Drag the SE handle onto its NW anchor → zero size, must clamp.
    const r = resizeNode(node, "se", { x: -50, y: -50 }, false);
    expect(r.scaleX).toBeCloseTo(0.08, 6); // 8px / 100px base
    expect(r.scaleY).toBeCloseTo(0.08, 6);
  });
});

describe("resizeNode — aspect lock", () => {
  it("preserves the aspect ratio on a corner drag", () => {
    const node = makeNode({ scaleY: 0.5 }); // 100×50, ratio 2:1
    const r = resizeNode(node, "se", { x: 60, y: 200 }, true);
    const ratio = (r.scaleX * 100) / (r.scaleY * 100);
    expect(ratio).toBeCloseTo(2, 6);
  });

  it("scales the cross axis when an edge is dragged with lock", () => {
    const node = makeNode(); // 100×100
    const r = resizeNode(node, "e", { x: 150, y: 0 }, true); // width → 200
    expect(r.scaleX).toBeCloseTo(2, 6);
    expect(r.scaleY).toBeCloseTo(2, 6); // height followed proportionally
  });
});

describe("resizeNode — rotated (the credibility case)", () => {
  const rotations = [Math.PI / 6, Math.PI / 2, -Math.PI / 3, 2.4];
  const handles: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  /**
   * A non-flipping pointer: push the handle further OUT along its own world
   * direction. (Dragging a handle past its anchor is a legitimate flip, after
   * which the pinned world point is a differently-named corner — not what this
   * invariant is about.)
   */
  function outwardPointer(node: StickerNode, handle: ResizeHandle): Vec2 {
    const dir = HANDLE_DIR[handle];
    const h = handleWorld(node, handle);
    const worldDir = rotate({ x: dir.x, y: dir.y }, node.rotation);
    return { x: h.x + worldDir.x * 30, y: h.y + worldDir.y * 30 };
  }

  it("keeps the opposite handle fixed in world space at every rotation", () => {
    for (const rotation of rotations) {
      for (const handle of handles) {
        const node = makeNode({ rotation, scaleX: 1.3, scaleY: 0.8 });
        const anchorHandle = OPPOSITE[handle];
        const anchorBefore = handleWorld(node, anchorHandle);

        const r = resizeNode(node, handle, outwardPointer(node, handle), false);
        const anchorAfter = handleWorld(
          { ...node, x: r.x, y: r.y, scaleX: r.scaleX, scaleY: r.scaleY },
          anchorHandle,
        );

        expect(anchorAfter.x).toBeCloseTo(anchorBefore.x, 4);
        expect(anchorAfter.y).toBeCloseTo(anchorBefore.y, 4);
      }
    }
  });

  it("makes the dragged corner follow the pointer when rotated", () => {
    const node = makeNode({ rotation: Math.PI / 2, scaleX: 1.2, scaleY: 0.9 });
    const pointer = outwardPointer(node, "se");
    const r = resizeNode(node, "se", pointer, false);
    const draggedAfter = handleWorld(
      { ...node, x: r.x, y: r.y, scaleX: r.scaleX, scaleY: r.scaleY },
      "se",
    );
    expect(draggedAfter.x).toBeCloseTo(pointer.x, 4);
    expect(draggedAfter.y).toBeCloseTo(pointer.y, 4);
  });
});

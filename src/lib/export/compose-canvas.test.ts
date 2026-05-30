import { describe, expect, it } from "vitest";

import type { Scene, StickerNode } from "@/lib/scene/types";

import { computeSceneBounds } from "./compose-canvas";

function node(over: Partial<StickerNode> & { id: string }): StickerNode {
  return {
    giphyId: "g",
    src: "/x",
    baseWidth: 100,
    baseHeight: 100,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    z: 0,
    title: "",
    ...over,
  };
}

function scene(nodes: StickerNode[]): Scene {
  return {
    nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
    order: nodes.map((n) => n.id),
  };
}

describe("computeSceneBounds", () => {
  it("returns null for an empty scene", () => {
    expect(computeSceneBounds({ nodes: {}, order: [] })).toBeNull();
  });

  it("bounds a single centered node by its half-extents", () => {
    const bounds = computeSceneBounds(scene([node({ id: "a" })]));
    expect(bounds).toEqual({ minX: -50, minY: -50, maxX: 50, maxY: 50 });
  });

  it("unions bounds across multiple offset nodes", () => {
    const bounds = computeSceneBounds(
      scene([
        node({ id: "a", x: -100, y: 0 }),
        node({ id: "b", x: 100, y: 50 }),
      ]),
    );
    expect(bounds).toEqual({ minX: -150, minY: -50, maxX: 150, maxY: 100 });
  });

  it("skips ids in order that have no matching node", () => {
    const s: Scene = {
      nodes: { a: node({ id: "a" }) },
      order: ["ghost", "a"],
    };
    expect(computeSceneBounds(s)).toEqual({
      minX: -50,
      minY: -50,
      maxX: 50,
      maxY: 50,
    });
  });
});

import { describe, expect, it } from "vitest";

import { deserializeScene, serializeScene } from "./serialize";
import type { Scene, StickerNode } from "./types";

const PROXY = "/api/giphy/image?u=https%3A%2F%2Fmedia.giphy.com%2Fx.gif";

function node(over: Partial<StickerNode> & { id: string }): StickerNode {
  return {
    giphyId: "g",
    src: PROXY,
    baseWidth: 200,
    baseHeight: 100,
    x: 10,
    y: -20,
    scaleX: 0.9,
    scaleY: 0.9,
    rotation: 0.5,
    z: 0,
    title: "hello",
    ...over,
  };
}

function scene(nodes: StickerNode[]): Scene {
  return {
    nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
    order: nodes.map((n) => n.id),
  };
}

describe("serialize / deserialize round-trip", () => {
  it("preserves nodes and order", () => {
    const original = scene([
      node({ id: "a", z: 0 }),
      node({ id: "b", z: 1, x: 99 }),
    ]);
    const restored = deserializeScene(serializeScene(original));
    expect(restored).toEqual(original);
  });

  it("reindexes z from array position", () => {
    const restored = deserializeScene(
      serializeScene(scene([node({ id: "a" }), node({ id: "b" })])),
    );
    expect(restored?.nodes["a"]?.z).toBe(0);
    expect(restored?.nodes["b"]?.z).toBe(1);
  });

  it("round-trips an empty scene", () => {
    const restored = deserializeScene(serializeScene({ nodes: {}, order: [] }));
    expect(restored).toEqual({ nodes: {}, order: [] });
  });
});

describe("deserialize — trust boundary", () => {
  it("returns null for non-JSON", () => {
    expect(deserializeScene("not json")).toBeNull();
  });

  it("returns null when the top level is not an array", () => {
    expect(deserializeScene('{"nodes":{}}')).toBeNull();
  });

  it("drops a node whose src is not the image-proxy path (anti-SSRF/track)", () => {
    const json = JSON.stringify([
      {
        id: "x",
        g: "g",
        s: "https://evil.com/pixel.gif",
        bw: 10,
        bh: 10,
        x: 0,
        y: 0,
        sx: 1,
        sy: 1,
        r: 0,
        t: "",
      },
    ]);
    expect(deserializeScene(json)).toEqual({ nodes: {}, order: [] });
  });

  it("drops nodes with out-of-range values", () => {
    const json = JSON.stringify([
      {
        id: "x",
        g: "g",
        s: PROXY,
        bw: 10,
        bh: 10,
        x: 0,
        y: 0,
        sx: 9999,
        sy: 1,
        r: 0,
        t: "",
      },
    ]);
    expect(deserializeScene(json)).toEqual({ nodes: {}, order: [] });
  });

  it("drops duplicate ids, keeping the first", () => {
    const json = JSON.stringify([
      {
        id: "x",
        g: "g",
        s: PROXY,
        bw: 10,
        bh: 10,
        x: 1,
        y: 0,
        sx: 1,
        sy: 1,
        r: 0,
        t: "",
      },
      {
        id: "x",
        g: "g",
        s: PROXY,
        bw: 10,
        bh: 10,
        x: 2,
        y: 0,
        sx: 1,
        sy: 1,
        r: 0,
        t: "",
      },
    ]);
    const restored = deserializeScene(json);
    expect(restored?.order).toEqual(["x"]);
    expect(restored?.nodes["x"]?.x).toBe(1);
  });

  it("sanitizes control characters out of titles", () => {
    const json = JSON.stringify([
      {
        id: "x",
        g: "g",
        s: PROXY,
        bw: 10,
        bh: 10,
        x: 0,
        y: 0,
        sx: 1,
        sy: 1,
        r: 0,
        t: "a\tb\nc",
      },
    ]);
    expect(deserializeScene(json)?.nodes["x"]?.title).toBe("abc");
  });
});

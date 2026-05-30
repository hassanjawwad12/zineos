import { describe, expect, it } from "vitest";

import type { StickerNode } from "@/lib/scene/types";

import {
  angleOf,
  pointInRotatedRect,
  rotate,
  rotateAbout,
  rotatedAABB,
  sub,
} from "./geometry";

const HALF_PI = Math.PI / 2;

function makeNode(overrides: Partial<StickerNode> = {}): StickerNode {
  return {
    id: "n1",
    giphyId: "g1",
    src: "/x",
    baseWidth: 100,
    baseHeight: 40,
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    z: 0,
    title: "",
    ...overrides,
  };
}

describe("rotate", () => {
  it("rotates the +x axis by 90° to +y (clockwise screen coords)", () => {
    const r = rotate({ x: 1, y: 0 }, HALF_PI);
    expect(r.x).toBeCloseTo(0, 10);
    expect(r.y).toBeCloseTo(1, 10);
  });

  it("is the identity at angle 0", () => {
    expect(rotate({ x: 3, y: -7 }, 0)).toEqual({ x: 3, y: -7 });
  });

  it("composing +θ then −θ returns the original vector", () => {
    const v = { x: 5, y: 2 };
    const round = rotate(rotate(v, 0.9), -0.9);
    expect(round.x).toBeCloseTo(5, 10);
    expect(round.y).toBeCloseTo(2, 10);
  });
});

describe("rotateAbout", () => {
  it("rotates a point about a non-origin center", () => {
    const p = rotateAbout({ x: 2, y: 1 }, { x: 1, y: 1 }, HALF_PI);
    // (2,1) is 1 unit right of center → rotates to 1 unit below center
    expect(p.x).toBeCloseTo(1, 10);
    expect(p.y).toBeCloseTo(2, 10);
  });
});

describe("angleOf", () => {
  it("returns 0 for a point directly right of center", () => {
    expect(angleOf({ x: 5, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(0, 10);
  });
  it("returns +90° for a point directly below center", () => {
    expect(angleOf({ x: 0, y: 5 }, { x: 0, y: 0 })).toBeCloseTo(HALF_PI, 10);
  });
});

describe("rotatedAABB", () => {
  it("matches the rect itself when unrotated", () => {
    const box = rotatedAABB(makeNode());
    expect(box).toEqual({ minX: -50, minY: -20, maxX: 50, maxY: 20 });
  });

  it("accounts for scale", () => {
    const box = rotatedAABB(makeNode({ scaleX: 2, scaleY: 2 }));
    expect(box).toEqual({ minX: -100, minY: -40, maxX: 100, maxY: 40 });
  });

  it("grows the bounding box for a 90°-rotated rect (w/h swap)", () => {
    const box = rotatedAABB(makeNode({ rotation: HALF_PI }));
    expect(box.maxX).toBeCloseTo(20, 6);
    expect(box.maxY).toBeCloseTo(50, 6);
  });

  it("is centered on the node center after translation", () => {
    const box = rotatedAABB(makeNode({ x: 10, y: 5 }));
    expect(box).toEqual({ minX: -40, minY: -15, maxX: 60, maxY: 25 });
  });
});

describe("pointInRotatedRect", () => {
  it("accepts the center", () => {
    expect(pointInRotatedRect({ x: 0, y: 0 }, makeNode())).toBe(true);
  });

  it("rejects a point outside an unrotated rect", () => {
    expect(pointInRotatedRect({ x: 60, y: 0 }, makeNode())).toBe(false);
  });

  it("hit-tests correctly in the rotated frame", () => {
    const node = makeNode({ rotation: HALF_PI }); // tall after rotation
    // Point at (0, 45) is outside the unrotated rect (half-h 20) but inside
    // the 90°-rotated one (now half-h 50 in world space).
    expect(pointInRotatedRect({ x: 0, y: 45 }, node)).toBe(true);
    expect(pointInRotatedRect({ x: 45, y: 0 }, node)).toBe(false);
  });
});

describe("sub", () => {
  it("subtracts componentwise", () => {
    expect(sub({ x: 3, y: 4 }, { x: 1, y: 2 })).toEqual({ x: 2, y: 2 });
  });
});

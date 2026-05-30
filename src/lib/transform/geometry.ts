import type { StickerNode } from "@/lib/scene/types";

/**
 * Pure 2D geometry for the hand-built transform engine. No editor library.
 * Everything here is side-effect-free and unit-tested — this is where the
 * engineering credibility of the project lives.
 */

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface AABB {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k };
}

/** Rotate a vector about the origin by `angle` radians (clockwise in screen coords). */
export function rotate(v: Vec2, angle: number): Vec2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

/** Rotate `point` about `center` by `angle` radians. */
export function rotateAbout(point: Vec2, center: Vec2, angle: number): Vec2 {
  return add(rotate(sub(point, center), angle), center);
}

/** Angle (radians) of the vector from `center` to `point`, via atan2. */
export function angleOf(point: Vec2, center: Vec2): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

/** Rendered (scaled) half-extents of a node, before rotation. */
export function halfExtents(node: StickerNode): Vec2 {
  return {
    x: (node.baseWidth * node.scaleX) / 2,
    y: (node.baseHeight * node.scaleY) / 2,
  };
}

/**
 * The four corners of a node's rendered rect, in world space, after rotation.
 * Order: top-left, top-right, bottom-right, bottom-left (in the node's local
 * frame, before rotation is applied).
 */
export function rotatedCorners(node: StickerNode): readonly Vec2[] {
  const center: Vec2 = { x: node.x, y: node.y };
  const h = halfExtents(node);
  const localCorners: Vec2[] = [
    { x: -h.x, y: -h.y },
    { x: h.x, y: -h.y },
    { x: h.x, y: h.y },
    { x: -h.x, y: h.y },
  ];
  return localCorners.map((corner) =>
    add(rotate(corner, node.rotation), center),
  );
}

/** Axis-aligned bounding box of a (possibly rotated) node, in world space. */
export function rotatedAABB(node: StickerNode): AABB {
  const corners = rotatedCorners(node);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const corner of corners) {
    minX = Math.min(minX, corner.x);
    minY = Math.min(minY, corner.y);
    maxX = Math.max(maxX, corner.x);
    maxY = Math.max(maxY, corner.y);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Hit-test a world-space point against a rotated node. We transform the point
 * into the node's local (un-rotated) frame and test against the axis-aligned
 * half-extents — far simpler and exact compared to polygon containment.
 */
export function pointInRotatedRect(point: Vec2, node: StickerNode): boolean {
  const center: Vec2 = { x: node.x, y: node.y };
  // Inverse-rotate the point into local space.
  const local = rotate(sub(point, center), -node.rotation);
  const h = halfExtents(node);
  return Math.abs(local.x) <= h.x && Math.abs(local.y) <= h.y;
}

/** Clamp helper used across transform math. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

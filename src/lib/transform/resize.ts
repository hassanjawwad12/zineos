import type { StickerNode } from "@/lib/scene/types";

import { add, clamp, rotate, sub, type Vec2 } from "./geometry";

/**
 * Resize-while-rotated — the hard, signal-rich part. No editor library.
 *
 * The trick that makes a rotated resize behave: keep the OPPOSITE handle fixed
 * in world space as an anchor, transform the live pointer into the node's local
 * (un-rotated) frame relative to that anchor, derive the new per-axis size from
 * that local vector, then recompute the center as `anchor + rotate(localHalf)`
 * so the anchor stays pinned. Axis-aligned resize is simply the rotation-0 case
 * of this same function.
 */

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** Direction each handle points from the node center, in local axes. */
export const HANDLE_DIR: Record<ResizeHandle, Vec2> = {
  nw: { x: -1, y: -1 },
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
};

export interface ResizeResult {
  readonly x: number;
  readonly y: number;
  readonly scaleX: number;
  readonly scaleY: number;
}

const MIN_SIZE = 8; // px — never let a sticker collapse to zero

function sign(value: number): number {
  return value < 0 ? -1 : 1;
}

/**
 * Compute the new transform for `node` when `handle` is dragged to `pointer`
 * (both in canvas coords). `keepAspect` locks the aspect ratio (corner handles
 * scale uniformly; edge handles scale the cross axis proportionally).
 */
export function resizeNode(
  node: StickerNode,
  handle: ResizeHandle,
  pointer: Vec2,
  keepAspect: boolean,
): ResizeResult {
  const dir = HANDLE_DIR[handle];
  const center: Vec2 = { x: node.x, y: node.y };

  const oldW = node.baseWidth * node.scaleX;
  const oldH = node.baseHeight * node.scaleY;
  const halfX = oldW / 2;
  const halfY = oldH / 2;

  // Anchor = the opposite handle, fixed in world space.
  const anchorLocal: Vec2 = { x: -dir.x * halfX, y: -dir.y * halfY };
  const anchor = add(center, rotate(anchorLocal, node.rotation));

  // Pointer relative to the anchor, in the node's un-rotated frame.
  const localP = rotate(sub(pointer, anchor), -node.rotation);

  // New size: a driven axis follows the pointer; an undriven axis is unchanged.
  let newW = dir.x !== 0 ? Math.abs(localP.x) : oldW;
  let newH = dir.y !== 0 ? Math.abs(localP.y) : oldH;

  if (keepAspect && oldW > 0 && oldH > 0) {
    if (dir.x !== 0 && dir.y !== 0) {
      // Corner: scale both axes by the larger factor so the corner stays at or
      // beyond the pointer along the diagonal.
      const f = Math.max(newW / oldW, newH / oldH);
      newW = oldW * f;
      newH = oldH * f;
    } else if (dir.x !== 0) {
      // Horizontal edge drives width; height follows proportionally.
      const f = newW / oldW;
      newH = oldH * f;
    } else if (dir.y !== 0) {
      const f = newH / oldH;
      newW = oldW * f;
    }
  }

  newW = clamp(newW, MIN_SIZE, Infinity);
  newH = clamp(newH, MIN_SIZE, Infinity);

  // New center, in the anchor-relative local frame: offset from the anchor
  // toward the dragged side by half the new size. An undriven axis keeps the
  // anchor's center line (offset 0 → symmetric growth).
  const centerLocal: Vec2 = {
    x: dir.x !== 0 ? sign(localP.x) * (newW / 2) : 0,
    y: dir.y !== 0 ? sign(localP.y) * (newH / 2) : 0,
  };
  const newCenter = add(anchor, rotate(centerLocal, node.rotation));

  return {
    x: newCenter.x,
    y: newCenter.y,
    scaleX: newW / node.baseWidth,
    scaleY: newH / node.baseHeight,
  };
}

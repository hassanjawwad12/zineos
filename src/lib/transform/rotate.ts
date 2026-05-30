import { angleOf, type Vec2 } from "./geometry";

/**
 * Rotation gesture math. The rotation handle sits above the node; rotation is
 * the pointer's angle around the center minus the angle the pointer was grabbed
 * at, plus the rotation the node already had. Holding a modifier snaps to 15°.
 */

export const SNAP_STEP = Math.PI / 12; // 15°

/**
 * The fixed offset between the pointer's angle and the node's rotation at the
 * moment the handle is grabbed. Capturing this on `pointerdown` means the node
 * doesn't jump to the pointer — it rotates relative to where you grabbed.
 */
export function grabOffset(
  center: Vec2,
  startPointer: Vec2,
  startRotation: number,
): number {
  return angleOf(startPointer, center) - startRotation;
}

/** Normalize an angle to (-π, π]. */
export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  let a = angle % twoPi;
  if (a <= -Math.PI) a += twoPi;
  else if (a > Math.PI) a -= twoPi;
  return a;
}

/**
 * New rotation (radians) given the live pointer. `offset` comes from
 * `grabOffset` at gesture start. When `snap` is true, the result is rounded to
 * the nearest 15°.
 */
export function rotateNode(
  center: Vec2,
  pointer: Vec2,
  offset: number,
  snap: boolean,
): number {
  const raw = angleOf(pointer, center) - offset;
  const snapped = snap ? Math.round(raw / SNAP_STEP) * SNAP_STEP : raw;
  return normalizeAngle(snapped);
}

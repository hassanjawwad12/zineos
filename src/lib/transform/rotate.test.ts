import { describe, expect, it } from "vitest";

import { grabOffset, normalizeAngle, rotateNode, SNAP_STEP } from "./rotate";

const CENTER = { x: 0, y: 0 };
const HALF_PI = Math.PI / 2;

describe("grabOffset + rotateNode", () => {
  it("rotates to match pointer angle when grabbed at rotation 0", () => {
    const offset = grabOffset(CENTER, { x: 10, y: 0 }, 0); // pointer angle 0
    const rot = rotateNode(CENTER, { x: 0, y: 10 }, offset, false); // angle +90°
    expect(rot).toBeCloseTo(HALF_PI, 6);
  });

  it("does not jump: keeping the pointer still preserves the start rotation", () => {
    const startRotation = Math.PI / 4;
    const startPointer = { x: 10, y: 0 };
    const offset = grabOffset(CENTER, startPointer, startRotation);
    // Pointer hasn't moved → rotation should equal the original.
    const rot = rotateNode(CENTER, startPointer, offset, false);
    expect(rot).toBeCloseTo(startRotation, 6);
  });

  it("applies the same pointer delta as a rotation delta", () => {
    const startPointer = { x: 10, y: 0 }; // angle 0
    const offset = grabOffset(CENTER, startPointer, 1.0); // start rotation 1 rad
    const rot = rotateNode(CENTER, { x: 0, y: 10 }, offset, false); // +90° move
    expect(rot).toBeCloseTo(normalizeAngle(1.0 + HALF_PI), 6);
  });
});

describe("rotateNode — snapping", () => {
  it("snaps to the nearest 15° when enabled", () => {
    const offset = grabOffset(CENTER, { x: 10, y: 0 }, 0);
    // A pointer at ~0.2rad should snap to one 15° step (≈0.2618rad).
    const angle = 0.2;
    const rot = rotateNode(
      CENTER,
      { x: Math.cos(angle) * 10, y: Math.sin(angle) * 10 },
      offset,
      true,
    );
    expect(rot).toBeCloseTo(SNAP_STEP, 6);
  });

  it("does not snap when disabled", () => {
    const offset = grabOffset(CENTER, { x: 10, y: 0 }, 0);
    const angle = 0.2;
    const rot = rotateNode(
      CENTER,
      { x: Math.cos(angle) * 10, y: Math.sin(angle) * 10 },
      offset,
      false,
    );
    expect(rot).toBeCloseTo(0.2, 6);
  });
});

describe("normalizeAngle", () => {
  it("wraps angles into (-π, π]", () => {
    expect(normalizeAngle((3 * Math.PI) / 2)).toBeCloseTo(-HALF_PI, 6);
    expect(normalizeAngle((-3 * Math.PI) / 2)).toBeCloseTo(HALF_PI, 6);
    expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI, 6);
    expect(normalizeAngle(0)).toBe(0);
  });
});

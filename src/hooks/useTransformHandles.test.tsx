import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { fireEvent, render } from "@testing-library/react";

import { useSceneStore } from "@/store/useSceneStore";

import { useTransformHandles } from "./useTransformHandles";

const input = {
  giphyId: "g",
  src: "/x",
  baseWidth: 100,
  baseHeight: 100,
  title: "t",
  x: 0,
  y: 0,
  scale: 1,
};

function Harness({ id }: { id: string }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { onResizePointerDown, onRotatePointerDown } = useTransformHandles(
    id,
    overlayRef,
  );
  return (
    <div className="canvas">
      <div className="sticker" data-node-id={id} />
      <div ref={overlayRef} className="sel-box" data-testid="overlay">
        <div data-testid="se" onPointerDown={onResizePointerDown("se")} />
        <div data-testid="rot" onPointerDown={onRotatePointerDown} />
      </div>
    </div>
  );
}

function windowPointer(type: string, clientX: number, clientY: number) {
  const ev = new Event(type) as Event & {
    pointerId: number;
    clientX: number;
    clientY: number;
    shiftKey: boolean;
  };
  ev.pointerId = 1;
  ev.clientX = clientX;
  ev.clientY = clientY;
  ev.shiftKey = false;
  window.dispatchEvent(ev);
}

describe("useTransformHandles", () => {
  // happy-dom getBoundingClientRect is all-zero, so canvas center is (0,0) and
  // client coords map directly to canvas coords — convenient for assertions.
  beforeEach(() => {
    useSceneStore.setState({ nodes: {}, order: [] });
    useSceneStore.temporal.getState().clear();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => vi.unstubAllGlobals());

  it("commits a corner resize on pointerup (opposite corner anchored)", () => {
    const id = useSceneStore.getState().add(input); // 100×100 at origin
    const { getByTestId } = render(<Harness id={id} />);

    fireEvent.pointerDown(getByTestId("se"), {
      button: 0,
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    });
    windowPointer("pointermove", 100, 100);
    windowPointer("pointerup", 100, 100);

    const node = useSceneStore.getState().nodes[id];
    expect(node?.scaleX).toBeCloseTo(1.5, 4);
    expect(node?.scaleY).toBeCloseTo(1.5, 4);
    expect(node?.x).toBeCloseTo(25, 4);
    expect(node?.y).toBeCloseTo(25, 4);
  });

  it("writes the live transform to the DOM before committing", () => {
    const id = useSceneStore.getState().add(input);
    const { getByTestId } = render(<Harness id={id} />);
    const overlay = getByTestId("overlay");

    fireEvent.pointerDown(getByTestId("se"), {
      button: 0,
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    });
    windowPointer("pointermove", 100, 100);

    expect(overlay.style.getPropertyValue("--x")).toBe("25px");
    expect(overlay.style.width).toBe("150px");
    // Not committed to the store until pointerup.
    expect(useSceneStore.getState().nodes[id]?.scaleX).toBe(1);

    windowPointer("pointerup", 100, 100);
    expect(useSceneStore.getState().nodes[id]?.scaleX).toBeCloseTo(1.5, 4);
  });

  it("commits a rotation on pointerup without jumping", () => {
    const id = useSceneStore.getState().add(input);
    const { getByTestId } = render(<Harness id={id} />);

    // Grab the rotate knob at angle -90° (straight up from center).
    fireEvent.pointerDown(getByTestId("rot"), {
      button: 0,
      pointerId: 1,
      clientX: 0,
      clientY: -10,
    });
    // Move to angle 0° (straight right) → +90° rotation.
    windowPointer("pointermove", 10, 0);
    windowPointer("pointerup", 10, 0);

    expect(useSceneStore.getState().nodes[id]?.rotation).toBeCloseTo(
      Math.PI / 2,
      4,
    );
  });
});

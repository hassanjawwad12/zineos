import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";

import { useSceneStore } from "@/store/useSceneStore";

import { usePointerDrag } from "./usePointerDrag";

const input = {
  giphyId: "g",
  src: "/x",
  baseWidth: 100,
  baseHeight: 100,
  title: "t",
  x: 0,
  y: 0,
};

function Probe({ id }: { id: string }) {
  const onPointerDown = usePointerDrag(id);
  return <div data-testid="sticker" onPointerDown={onPointerDown} />;
}

/** Dispatch a window pointer event with the fields the hook reads. */
function windowPointer(type: string, clientX: number, clientY: number) {
  const ev = new Event(type) as Event & {
    pointerId: number;
    clientX: number;
    clientY: number;
  };
  ev.pointerId = 1;
  ev.clientX = clientX;
  ev.clientY = clientY;
  window.dispatchEvent(ev);
}

describe("usePointerDrag", () => {
  beforeEach(() => {
    useSceneStore.setState({ nodes: {}, order: [] });
    useSceneStore.temporal.getState().clear();
    // Run rAF callbacks synchronously so the DOM flush is observable.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("commits the dragged position to the store on pointerup", () => {
    const id = useSceneStore.getState().add(input); // x:0, y:0
    const { getByTestId } = render(<Probe id={id} />);
    const el = getByTestId("sticker");

    fireEvent.pointerDown(el, {
      button: 0,
      pointerId: 1,
      clientX: 50,
      clientY: 60,
    });
    windowPointer("pointermove", 80, 110); // dx=30, dy=50
    windowPointer("pointerup", 80, 110);

    const node = useSceneStore.getState().nodes[id];
    expect(node?.x).toBe(30);
    expect(node?.y).toBe(50);
  });

  it("writes the live transform directly to the DOM during the gesture", () => {
    const id = useSceneStore.getState().add(input);
    const { getByTestId } = render(<Probe id={id} />);
    const el = getByTestId("sticker");

    fireEvent.pointerDown(el, {
      button: 0,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    });
    windowPointer("pointermove", 25, 0);

    // Direct DOM write (bypassing React) before any commit.
    expect(el.style.getPropertyValue("--x")).toBe("25px");
    expect(useSceneStore.getState().nodes[id]?.x).toBe(0); // not committed yet

    windowPointer("pointerup", 25, 0);
    expect(useSceneStore.getState().nodes[id]?.x).toBe(25);
  });

  it("treats a sub-threshold gesture as a click (no commit)", () => {
    const id = useSceneStore.getState().add(input);
    const { getByTestId } = render(<Probe id={id} />);
    const el = getByTestId("sticker");

    fireEvent.pointerDown(el, {
      button: 0,
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    });
    windowPointer("pointermove", 10.2, 10.1); // below MOVE_EPSILON
    windowPointer("pointerup", 10.2, 10.1);

    // Store node reference unchanged (no transform commit).
    expect(useSceneStore.getState().nodes[id]?.x).toBe(0);
  });

  it("ignores non-primary buttons", () => {
    const id = useSceneStore.getState().add(input);
    const { getByTestId } = render(<Probe id={id} />);
    const el = getByTestId("sticker");

    fireEvent.pointerDown(el, {
      button: 2,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    });
    windowPointer("pointermove", 100, 100);
    windowPointer("pointerup", 100, 100);

    expect(useSceneStore.getState().nodes[id]?.x).toBe(0);
  });
});

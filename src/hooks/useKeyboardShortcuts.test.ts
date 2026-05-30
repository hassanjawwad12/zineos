import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

const input = {
  giphyId: "g",
  src: "/x",
  baseWidth: 100,
  baseHeight: 100,
  title: "t",
  x: 0,
  y: 0,
};

function reset() {
  useSceneStore.setState({ nodes: {}, order: [] });
  useSceneStore.temporal.getState().clear();
  useUiStore.setState({ selectedId: null, drawerOpen: false, tool: "select" });
}

/** Dispatch a keydown on window (optionally from a typing element). */
function press(
  key: string,
  opts: { meta?: boolean; shift?: boolean; from?: HTMLElement } = {},
) {
  const event = new KeyboardEvent("keydown", {
    key,
    metaKey: opts.meta ?? false,
    shiftKey: opts.shift ?? false,
    bubbles: true,
    cancelable: true,
  });
  (opts.from ?? window).dispatchEvent(event);
}

describe("useKeyboardShortcuts", () => {
  beforeEach(reset);

  it("deletes the selected node on Delete", () => {
    renderHook(() => useKeyboardShortcuts());
    const id = useSceneStore.getState().add(input);
    useUiStore.getState().select(id);

    press("Delete");
    expect(useSceneStore.getState().nodes[id]).toBeUndefined();
    expect(useUiStore.getState().selectedId).toBeNull();
  });

  it("deselects on Escape", () => {
    renderHook(() => useKeyboardShortcuts());
    const id = useSceneStore.getState().add(input);
    useUiStore.getState().select(id);

    press("Escape");
    expect(useUiStore.getState().selectedId).toBeNull();
  });

  it("duplicates the selection on Cmd/Ctrl+D and selects the clone", () => {
    renderHook(() => useKeyboardShortcuts());
    const id = useSceneStore.getState().add(input);
    useUiStore.getState().select(id);

    press("d", { meta: true });
    expect(useSceneStore.getState().order).toHaveLength(2);
    expect(useUiStore.getState().selectedId).not.toBe(id);
  });

  it("nudges the selection by 1px with an arrow key", () => {
    renderHook(() => useKeyboardShortcuts());
    const id = useSceneStore.getState().add(input);
    useUiStore.getState().select(id);

    press("ArrowRight");
    expect(useSceneStore.getState().nodes[id]?.x).toBe(1);
    press("ArrowUp");
    expect(useSceneStore.getState().nodes[id]?.y).toBe(-1);
  });

  it("nudges by 10px with Shift held", () => {
    renderHook(() => useKeyboardShortcuts());
    const id = useSceneStore.getState().add(input);
    useUiStore.getState().select(id);

    press("ArrowLeft", { shift: true });
    expect(useSceneStore.getState().nodes[id]?.x).toBe(-10);
  });

  it("undoes and redoes with Cmd/Ctrl+Z / Shift+Cmd+Z", () => {
    renderHook(() => useKeyboardShortcuts());
    const id = useSceneStore.getState().add(input);
    useUiStore.getState().select(id);
    useSceneStore.getState().updateTransform(id, { x: 250 });

    press("z", { meta: true });
    expect(useSceneStore.getState().nodes[id]?.x).toBe(0);
    press("z", { meta: true, shift: true });
    expect(useSceneStore.getState().nodes[id]?.x).toBe(250);
  });

  it("ignores shortcuts while typing in an input", () => {
    renderHook(() => useKeyboardShortcuts());
    const id = useSceneStore.getState().add(input);
    useUiStore.getState().select(id);

    const field = document.createElement("input");
    document.body.appendChild(field);
    press("Delete", { from: field });
    expect(useSceneStore.getState().nodes[id]).toBeDefined();
    field.remove();
  });

  it("does nothing when no node is selected", () => {
    renderHook(() => useKeyboardShortcuts());
    const id = useSceneStore.getState().add(input);
    // nothing selected
    press("Delete");
    expect(useSceneStore.getState().nodes[id]).toBeDefined();
  });
});

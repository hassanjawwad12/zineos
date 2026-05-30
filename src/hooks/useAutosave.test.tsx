import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { encodeSceneToParam } from "@/lib/scene/share-url";
import type { Scene } from "@/lib/scene/types";
import { useSceneStore } from "@/store/useSceneStore";

import { useAutosave } from "./useAutosave";

const PROXY = "/api/giphy/image?u=https%3A%2F%2Fmedia.giphy.com%2Fx.gif";

function sampleScene(x: number): Scene {
  return {
    nodes: {
      a: {
        id: "a",
        giphyId: "g",
        src: PROXY,
        baseWidth: 100,
        baseHeight: 100,
        x,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        z: 0,
        title: "t",
      },
    },
    order: ["a"],
  };
}

describe("useAutosave", () => {
  beforeEach(() => {
    useSceneStore.setState({ nodes: {}, order: [] });
    useSceneStore.temporal.getState().clear();
    localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads a scene from the ?z= share param (takes precedence)", () => {
    const param = encodeSceneToParam(sampleScene(123));
    window.history.replaceState(null, "", `/?z=${param}`);

    renderHook(() => useAutosave());

    expect(useSceneStore.getState().order).toEqual(["a"]);
    expect(useSceneStore.getState().nodes["a"]?.x).toBe(123);
  });

  it("ignores a malformed ?z= param and falls back", () => {
    window.history.replaceState(null, "", "/?z=%%%garbage%%%");
    renderHook(() => useAutosave());
    // Malformed param → no scene loaded from URL.
    expect(useSceneStore.getState().order).toEqual([]);
  });

  it("rehydrates from localStorage when there is no share param", async () => {
    localStorage.setItem(
      "zineos-scene-v1",
      JSON.stringify({ state: sampleScene(77), version: 0 }),
    );

    renderHook(() => useAutosave());

    await waitFor(() =>
      expect(useSceneStore.getState().nodes["a"]?.x).toBe(77),
    );
  });
});

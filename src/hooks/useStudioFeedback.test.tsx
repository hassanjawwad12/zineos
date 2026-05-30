import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useAnnouncer } from "@/store/useAnnouncer";
import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

import { useStudioFeedback } from "./useStudioFeedback";

const playUiSound = vi.hoisted(() => vi.fn());
vi.mock("@/lib/audio/play", () => ({ playUiSound }));

const input = {
  giphyId: "g",
  src: "/x",
  baseWidth: 100,
  baseHeight: 100,
  title: "t",
};

describe("useStudioFeedback", () => {
  beforeEach(() => {
    playUiSound.mockClear();
    useSceneStore.setState({ nodes: {}, order: [] });
    useSceneStore.temporal.getState().clear();
    useUiStore.setState({ soundEnabled: true });
    useAnnouncer.setState({ message: "", nth: 0 });
  });

  afterEach(() => vi.restoreAllMocks());

  it("plays stamp + announces when a node is added", () => {
    renderHook(() => useStudioFeedback());
    useSceneStore.getState().add(input);
    expect(playUiSound).toHaveBeenCalledWith("stamp");
    expect(useAnnouncer.getState().message).toBe("Sticker added");
  });

  it("plays trash + announces when a node is removed", () => {
    const id = useSceneStore.getState().add(input);
    renderHook(() => useStudioFeedback());
    playUiSound.mockClear();
    useSceneStore.getState().remove(id);
    expect(playUiSound).toHaveBeenCalledWith("trash");
    expect(useAnnouncer.getState().message).toBe("Sticker removed");
  });

  it("stays silent (but still announces) when sound is disabled", () => {
    useUiStore.setState({ soundEnabled: false });
    renderHook(() => useStudioFeedback());
    useSceneStore.getState().add(input);
    expect(playUiSound).not.toHaveBeenCalled();
    expect(useAnnouncer.getState().message).toBe("Sticker added");
  });

  it("plays a click when a chrome button is pressed", () => {
    renderHook(() => useStudioFeedback());
    const btn = document.createElement("button");
    btn.className = "btn";
    document.body.appendChild(btn);
    btn.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(playUiSound).toHaveBeenCalledWith("click");
    btn.remove();
  });
});

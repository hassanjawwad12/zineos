"use client";

import { useEffect } from "react";

import { playUiSound } from "@/lib/audio/play";
import { announce } from "@/store/useAnnouncer";
import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

/**
 * Centralized audio + screen-reader feedback. Rather than wiring sound and
 * announcements into every call site, we observe the scene: a node count going
 * up is an "add" (stamp), going down is a "remove" (trash). Chrome buttons get
 * a soft click via one delegated pointer listener. All gated on the user's
 * sound preference; audio is dynamically imported on first play.
 */
export function useStudioFeedback() {
  useEffect(() => {
    let prevCount = useSceneStore.getState().order.length;

    const unsub = useSceneStore.subscribe((state) => {
      const count = state.order.length;
      if (count === prevCount) return;
      const soundOn = useUiStore.getState().soundEnabled;
      if (count > prevCount) {
        if (soundOn) playUiSound("stamp");
        announce("Sticker added");
      } else {
        if (soundOn) playUiSound("trash");
        announce("Sticker removed");
      }
      prevCount = count;
    });

    function onPointerDown(e: PointerEvent) {
      if (!useUiStore.getState().soundEnabled) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(".btn")) playUiSound("click");
    }
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      unsub();
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);
}

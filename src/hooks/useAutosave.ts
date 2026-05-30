"use client";

import { useEffect } from "react";

import { decodeSceneFromParam, SHARE_PARAM } from "@/lib/scene/share-url";
import { useSceneStore } from "@/store/useSceneStore";

/**
 * One-time hydration on mount, with this precedence:
 *   1. a `?z=` share param  → load that scene (and clear undo history)
 *   2. otherwise            → rehydrate the persisted localStorage scene
 *   3. otherwise            → empty canvas
 *
 * Persistence itself is automatic: the store's `persist` middleware writes to
 * localStorage on every change. We only own the initial load, which is why the
 * store is created with `skipHydration` (avoids an SSR/client mismatch).
 */
export function useAutosave() {
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get(SHARE_PARAM);

    if (param) {
      const scene = decodeSceneFromParam(param);
      if (scene) {
        useSceneStore.getState().loadScene(scene);
        // A loaded share is the new baseline — don't let undo revert to empty.
        useSceneStore.temporal.getState().clear();
        return;
      }
    }

    void useSceneStore.persist.rehydrate();
  }, []);
}

"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

import type { Vec2 } from "@/lib/transform/geometry";
import { grabOffset, rotateNode } from "@/lib/transform/rotate";
import {
  type ResizeHandle,
  resizeNode,
  type ResizeResult,
} from "@/lib/transform/resize";
import type { StickerNode } from "@/lib/scene/types";
import { useSceneStore } from "@/store/useSceneStore";

/**
 * Resize + rotate gestures, hand-built. Same perf pattern as drag: compute the
 * new transform from pure math (lib/transform/*), write it DIRECTLY to the
 * sticker AND the selection overlay via CSS custom props (batched in rAF), and
 * commit to the store only on pointerup — so one resize is one undo step, not
 * hundreds.
 *
 * Resize/rotate need the pointer in CANVAS coords (origin = canvas center),
 * which is where node.x/y live; we convert from client coords using the canvas
 * rect captured at gesture start (no zoom in these phases, so 1px = 1px).
 */

type Pending = ResizeResult | { rotation: number };

interface GestureState {
  kind: "resize" | "rotate";
  pointerId: number;
  handle: ResizeHandle | null;
  startNode: StickerNode;
  canvasCenter: Vec2; // client-space center of the canvas
  offset: number; // rotate grab offset
  stickerEl: HTMLElement | null;
  overlayEl: HTMLElement | null;
  rafId: number | null;
  pending: Pending | null;
  onMove: (e: PointerEvent) => void;
  onUp: (e: PointerEvent) => void;
}

function canvasCenterOf(overlay: HTMLElement): Vec2 {
  const canvas = overlay.closest(".canvas");
  const rect = (canvas ?? overlay).getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function useTransformHandles(
  nodeId: string,
  overlayRef: RefObject<HTMLDivElement | null>,
) {
  const gesture = useRef<GestureState | null>(null);
  const updateTransform = useSceneStore((s) => s.updateTransform);

  const flush = useCallback(() => {
    const g = gesture.current;
    if (!g || !g.pending) return;
    const { stickerEl, overlayEl, pending, startNode } = g;

    if ("rotation" in pending) {
      stickerEl?.style.setProperty("--rot", `${pending.rotation}rad`);
      overlayEl?.style.setProperty("--rot", `${pending.rotation}rad`);
    } else {
      const w = startNode.baseWidth * pending.scaleX;
      const h = startNode.baseHeight * pending.scaleY;
      if (stickerEl) {
        stickerEl.style.setProperty("--x", `${pending.x}px`);
        stickerEl.style.setProperty("--y", `${pending.y}px`);
        stickerEl.style.setProperty("--scale-x", `${pending.scaleX}`);
        stickerEl.style.setProperty("--scale-y", `${pending.scaleY}`);
      }
      if (overlayEl) {
        overlayEl.style.setProperty("--x", `${pending.x}px`);
        overlayEl.style.setProperty("--y", `${pending.y}px`);
        overlayEl.style.width = `${w}px`;
        overlayEl.style.height = `${h}px`;
      }
    }
    g.rafId = null;
  }, []);

  const teardown = useCallback(() => {
    const g = gesture.current;
    if (!g) return;
    window.removeEventListener("pointermove", g.onMove);
    window.removeEventListener("pointerup", g.onUp);
    window.removeEventListener("pointercancel", g.onUp);
    if (g.rafId !== null) cancelAnimationFrame(g.rafId);
    if (g.stickerEl) g.stickerEl.style.willChange = "auto";
  }, []);

  const begin = useCallback(
    (
      kind: "resize" | "rotate",
      handle: ResizeHandle | null,
      e: ReactPointerEvent<HTMLElement>,
    ) => {
      if (e.button !== 0) return;
      e.stopPropagation(); // don't let the sticker's drag handler also fire
      const overlayEl = overlayRef.current;
      const startNode = useSceneStore.getState().nodes[nodeId];
      if (!overlayEl || !startNode) return;

      const canvasCenter = canvasCenterOf(overlayEl);
      const stickerEl = document.querySelector<HTMLElement>(
        `[data-node-id="${nodeId}"]`,
      );

      const center: Vec2 = { x: startNode.x, y: startNode.y };
      const startCanvasPointer: Vec2 = {
        x: e.clientX - canvasCenter.x,
        y: e.clientY - canvasCenter.y,
      };

      const onMove = (ev: PointerEvent) => {
        const g = gesture.current;
        if (!g || ev.pointerId !== g.pointerId) return;
        const pointer: Vec2 = {
          x: ev.clientX - g.canvasCenter.x,
          y: ev.clientY - g.canvasCenter.y,
        };
        if (g.kind === "rotate") {
          g.pending = {
            rotation: rotateNode(center, pointer, g.offset, ev.shiftKey),
          };
        } else if (g.handle) {
          g.pending = resizeNode(g.startNode, g.handle, pointer, ev.shiftKey);
        }
        if (g.rafId === null) g.rafId = requestAnimationFrame(flush);
      };

      const onUp = (ev: PointerEvent) => {
        const g = gesture.current;
        if (!g || ev.pointerId !== g.pointerId) return;
        const pending = g.pending;
        teardown();
        gesture.current = null;
        if (pending) updateTransform(nodeId, pending);
      };

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // unsupported environment — window listeners still drive the gesture
      }
      if (stickerEl) stickerEl.style.willChange = "transform";

      gesture.current = {
        kind,
        pointerId: e.pointerId,
        handle,
        startNode,
        canvasCenter,
        offset:
          kind === "rotate"
            ? grabOffset(center, startCanvasPointer, startNode.rotation)
            : 0,
        stickerEl,
        overlayEl,
        rafId: null,
        pending: null,
        onMove,
        onUp,
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [nodeId, overlayRef, flush, teardown, updateTransform],
  );

  const onResizePointerDown = useCallback(
    (handle: ResizeHandle) => (e: ReactPointerEvent<HTMLElement>) =>
      begin("resize", handle, e),
    [begin],
  );

  const onRotatePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => begin("rotate", null, e),
    [begin],
  );

  useEffect(() => {
    return () => {
      if (gesture.current) {
        teardown();
        gesture.current = null;
      }
    };
  }, [teardown]);

  return { onResizePointerDown, onRotatePointerDown };
}

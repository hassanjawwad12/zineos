"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { useSceneStore } from "@/store/useSceneStore";

/**
 * Hand-built drag — no react-rnd / interact.js / moveable.
 *
 * The canonical canvas-editor perf pattern: during an active gesture we write
 * the transform DIRECTLY to the DOM node (via its `--x`/`--y` custom props),
 * batched in `requestAnimationFrame`, bypassing React entirely. The store is
 * committed only on `pointerup`. Result: dragging one sticker re-renders
 * neither React nor any sibling node.
 *
 * Screen-space pointer delta maps 1:1 to canvas delta in Phase 1 (no zoom yet).
 */

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number; // node center at gesture start
  startY: number;
  curX: number;
  curY: number;
  rafId: number | null;
  el: HTMLElement;
  moved: boolean;
  // The exact listener references for this gesture, so teardown removes them.
  onMove: (e: PointerEvent) => void;
  onUp: (e: PointerEvent) => void;
}

const MOVE_EPSILON = 0.5; // px; below this a gesture is a click, not a drag

export function usePointerDrag(nodeId: string) {
  const drag = useRef<DragState | null>(null);
  const updateTransform = useSceneStore((s) => s.updateTransform);

  const flush = useCallback(() => {
    const d = drag.current;
    if (!d) return;
    d.el.style.setProperty("--x", `${d.curX}px`);
    d.el.style.setProperty("--y", `${d.curY}px`);
    d.rafId = null;
  }, []);

  const teardown = useCallback(() => {
    const d = drag.current;
    if (!d) return;
    window.removeEventListener("pointermove", d.onMove);
    window.removeEventListener("pointerup", d.onUp);
    window.removeEventListener("pointercancel", d.onUp);
    if (d.rafId !== null) cancelAnimationFrame(d.rafId);
    d.el.style.willChange = "auto";
    try {
      d.el.releasePointerCapture(d.pointerId);
    } catch {
      // capture may already be released (pointercancel) — ignore
    }
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return; // primary button only
      const node = useSceneStore.getState().nodes[nodeId];
      if (!node) return;

      const el = e.currentTarget;

      const onMove = (ev: PointerEvent) => {
        const d = drag.current;
        if (!d || ev.pointerId !== d.pointerId) return;
        const dx = ev.clientX - d.startClientX;
        const dy = ev.clientY - d.startClientY;
        d.curX = d.startX + dx;
        d.curY = d.startY + dy;
        if (Math.abs(dx) > MOVE_EPSILON || Math.abs(dy) > MOVE_EPSILON) {
          d.moved = true;
        }
        // Coalesce multiple moves into one paint per frame.
        if (d.rafId === null) d.rafId = requestAnimationFrame(flush);
      };

      const onUp = (ev: PointerEvent) => {
        const d = drag.current;
        if (!d || ev.pointerId !== d.pointerId) return;
        const { curX, curY, moved } = d;
        teardown();
        drag.current = null;
        // Commit once, on release — never per frame.
        if (moved) updateTransform(nodeId, { x: curX, y: curY });
      };

      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // happy-dom / unsupported — drag still works via window listeners
      }
      el.style.willChange = "transform";

      drag.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startX: node.x,
        startY: node.y,
        curX: node.x,
        curY: node.y,
        rafId: null,
        el,
        moved: false,
        onMove,
        onUp,
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [nodeId, flush, teardown, updateTransform],
  );

  // Tear down a gesture in flight if the node unmounts mid-drag.
  useEffect(() => {
    return () => {
      if (drag.current) {
        teardown();
        drag.current = null;
      }
    };
  }, [teardown]);

  return onPointerDown;
}

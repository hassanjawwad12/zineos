"use client";

import { useEffect } from "react";

import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

/**
 * Global keyboard map for the studio. Pointer drag is mouse-centric, so these
 * shortcuts (plus the Layers panel in Phase 4) are how the canvas stays
 * operable without a pointer. Ignored while typing in a field.
 */

const NUDGE = 1; // px
const NUDGE_COARSE = 10; // px (with Shift)

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      const scene = useSceneStore.getState();
      const ui = useUiStore.getState();
      const selectedId = ui.selectedId;
      const mod = e.metaKey || e.ctrlKey;

      // Undo / redo work regardless of selection.
      if (mod && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        const temporal = useSceneStore.temporal.getState();
        if (e.shiftKey) temporal.redo();
        else temporal.undo();
        return;
      }

      if (!selectedId) {
        if (e.key === "Escape") ui.select(null);
        return;
      }

      const node = scene.nodes[selectedId];
      if (!node) return;

      switch (e.key) {
        case "Delete":
        case "Backspace": {
          e.preventDefault();
          scene.remove(selectedId);
          ui.select(null);
          break;
        }
        case "Escape": {
          ui.select(null);
          break;
        }
        case "d":
        case "D": {
          if (mod) {
            e.preventDefault();
            const newId = scene.duplicate(selectedId);
            if (newId) ui.select(newId);
          }
          break;
        }
        case "]": {
          e.preventDefault();
          if (mod) scene.bringToFront(selectedId);
          else scene.bringForward(selectedId);
          break;
        }
        case "[": {
          e.preventDefault();
          if (mod) scene.sendToBack(selectedId);
          else scene.sendBackward(selectedId);
          break;
        }
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault();
          const step = e.shiftKey ? NUDGE_COARSE : NUDGE;
          const dx =
            e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy =
            e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          scene.updateTransform(selectedId, {
            x: node.x + dx,
            y: node.y + dy,
          });
          break;
        }
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

"use client";

import "./canvas.css";

import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

import { StickerNodeView } from "./StickerNodeView";

/**
 * The creative canvas — the loud, holographic layer. Origin (0,0) is the canvas
 * center; nodes position relative to it so rotation/scale math stays simple.
 *
 * Subscribes to `order` only: adding/removing/reordering re-renders the canvas,
 * but moving or selecting a sticker does not (each node owns its subscription).
 * Clicking empty space deselects.
 */
export function Canvas() {
  const order = useSceneStore((s) => s.order);
  const select = useUiStore((s) => s.select);

  return (
    <main
      className="canvas"
      aria-label="Collage canvas"
      onPointerDown={(e) => {
        // Deselect when the gesture starts anywhere that isn't a sticker.
        if (!(e.target as HTMLElement).closest(".sticker")) select(null);
      }}
    >
      {order.length === 0 && (
        <p className="canvas-empty">
          empty canvas — add a sticker to start your zine
        </p>
      )}
      {order.map((id) => (
        <StickerNodeView key={id} id={id} />
      ))}
    </main>
  );
}

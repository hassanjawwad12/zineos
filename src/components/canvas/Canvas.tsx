"use client";

import "./canvas.css";

import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

import { StickerNodeView } from "./StickerNodeView";

/**
 * The creative canvas — the loud, holographic layer. Origin (0,0) is the canvas
 * center; nodes position relative to it so rotation/scale math stays simple.
 * Clicking empty space deselects.
 */
export function Canvas() {
  const order = useSceneStore((s) => s.order);
  const nodes = useSceneStore((s) => s.nodes);
  const selectedId = useUiStore((s) => s.selectedId);
  const select = useUiStore((s) => s.select);

  return (
    <main
      className="canvas"
      aria-label="Collage canvas"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) select(null);
      }}
    >
      <div className="canvas-origin">
        {order.length === 0 && (
          <p className="canvas-empty">
            empty canvas — add a sticker to start your zine
          </p>
        )}
        {order.map((id) => {
          const node = nodes[id];
          if (!node) return null;
          return (
            <StickerNodeView
              key={id}
              node={node}
              selected={id === selectedId}
              onSelect={select}
            />
          );
        })}
      </div>
    </main>
  );
}

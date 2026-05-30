"use client";

import type { CSSProperties } from "react";

import { usePointerDrag } from "@/hooks/usePointerDrag";
import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

interface StickerNodeViewProps {
  id: string;
}

/**
 * Renders a single sticker via the composed center-origin transform. Subscribes
 * to ONLY its own node slice and its own selected state, so moving or selecting
 * one sticker re-renders neither React siblings nor the canvas — the per-node
 * selector pattern from the perf budget.
 *
 * The transform is driven entirely by CSS custom properties, which lets the
 * drag hook write `--x`/`--y` straight to this DOM node during a gesture.
 */
export function StickerNodeView({ id }: StickerNodeViewProps) {
  const node = useSceneStore((s) => s.nodes[id]);
  const selected = useUiStore((s) => s.selectedId === id);
  const select = useUiStore((s) => s.select);
  const beginDrag = usePointerDrag(id);

  if (!node) return null;

  const style = {
    "--x": `${node.x}px`,
    "--y": `${node.y}px`,
    "--rot": `${node.rotation}rad`,
    "--scale": node.scale,
    "--base-w": `${node.baseWidth}px`,
    "--base-h": `${node.baseHeight}px`,
    zIndex: node.z + 1,
  } as CSSProperties;

  return (
    <div
      className={`sticker${selected ? " is-selected" : ""}`}
      style={style}
      data-node-id={node.id}
      onPointerDown={(e) => {
        select(id);
        beginDrag(e);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- proxied,
          dynamically-sized canvas content; next/image gives no benefit here */}
      <img src={node.src} alt={node.title || "sticker"} draggable={false} />
    </div>
  );
}

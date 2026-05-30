"use client";

import type { CSSProperties } from "react";

import type { StickerNode } from "@/lib/scene/types";

interface StickerNodeViewProps {
  node: StickerNode;
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * Renders a single sticker via the composed center-origin transform. During
 * Phase 0 it is selectable but not yet draggable (drag arrives in Phase 1).
 * The transform is driven entirely by CSS custom properties so a gesture can
 * later write them directly to the DOM node, bypassing React.
 */
export function StickerNodeView({
  node,
  selected,
  onSelect,
}: StickerNodeViewProps) {
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
      onPointerDown={() => onSelect(node.id)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- proxied,
          dynamically-sized canvas content; next/image gives no benefit here */}
      <img src={node.src} alt={node.title || "sticker"} draggable={false} />
    </div>
  );
}

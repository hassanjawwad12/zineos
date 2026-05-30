"use client";

import "./selection.css";

import type { CSSProperties } from "react";
import { useRef } from "react";

import { useTransformHandles } from "@/hooks/useTransformHandles";
import type { ResizeHandle } from "@/lib/transform/resize";
import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

const RESIZE_HANDLES: readonly ResizeHandle[] = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
];

/** Renders the transform overlay for whichever node is selected. */
export function SelectionOverlay() {
  const selectedId = useUiStore((s) => s.selectedId);
  if (!selectedId) return null;
  // key remounts the box (and its gesture refs) when the selection changes.
  return <SelectionBox key={selectedId} id={selectedId} />;
}

function SelectionBox({ id }: { id: string }) {
  const node = useSceneStore((s) => s.nodes[id]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { onResizePointerDown, onRotatePointerDown } = useTransformHandles(
    id,
    overlayRef,
  );

  if (!node) return null;

  const width = node.baseWidth * node.scaleX;
  const height = node.baseHeight * node.scaleY;
  const style = {
    "--x": `${node.x}px`,
    "--y": `${node.y}px`,
    "--rot": `${node.rotation}rad`,
    width: `${width}px`,
    height: `${height}px`,
  } as CSSProperties;

  return (
    <div ref={overlayRef} className="sel-box" style={style} aria-hidden="true">
      <div
        className="sel-rotate"
        onPointerDown={onRotatePointerDown}
        title="Rotate (hold Shift to snap to 15°)"
      />
      {RESIZE_HANDLES.map((handle) => (
        <div
          key={handle}
          className={`sel-handle sel-handle--${handle}`}
          data-handle={handle}
          onPointerDown={onResizePointerDown(handle)}
        />
      ))}
    </div>
  );
}

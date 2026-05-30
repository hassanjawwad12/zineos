"use client";

import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

interface LayerRowProps {
  id: string;
  /** Whether this layer is already frontmost / backmost (disables a button). */
  isFront: boolean;
  isBack: boolean;
  /** 1-based position from the front, for the accessible label. */
  position: number;
  total: number;
}

/**
 * One row of the Layers panel. Subscribes to only its own node + selected state.
 * Selecting, reordering, and deleting here are the keyboard/pointer-accessible
 * equivalents of direct canvas manipulation.
 */
export function LayerRow({
  id,
  isFront,
  isBack,
  position,
  total,
}: LayerRowProps) {
  const node = useSceneStore((s) => s.nodes[id]);
  const selected = useUiStore((s) => s.selectedId === id);
  const select = useUiStore((s) => s.select);
  const bringForward = useSceneStore((s) => s.bringForward);
  const sendBackward = useSceneStore((s) => s.sendBackward);
  const remove = useSceneStore((s) => s.remove);

  if (!node) return null;
  const label = node.title || "sticker";

  return (
    <li className={`layer-row${selected ? " is-selected" : ""}`}>
      <button
        type="button"
        className="layer-select"
        aria-pressed={selected}
        aria-label={`Layer ${position} of ${total}: ${label}`}
        onClick={() => select(id)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- proxied thumbnail */}
        <img className="layer-thumb" src={node.src} alt="" aria-hidden="true" />
        <span className="layer-name">{label}</span>
      </button>
      <div className="layer-actions">
        <button
          type="button"
          className="layer-btn"
          title="Bring forward (])"
          aria-label="Bring forward"
          disabled={isFront}
          onClick={() => bringForward(id)}
        >
          ▲
        </button>
        <button
          type="button"
          className="layer-btn"
          title="Send backward ([)"
          aria-label="Send backward"
          disabled={isBack}
          onClick={() => sendBackward(id)}
        >
          ▼
        </button>
        <button
          type="button"
          className="layer-btn"
          title="Delete (Del)"
          aria-label="Delete layer"
          onClick={() => {
            remove(id);
            if (selected) select(null);
          }}
        >
          ✕
        </button>
      </div>
    </li>
  );
}

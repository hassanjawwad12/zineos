"use client";

import "./layers.css";

import { useSceneStore } from "@/store/useSceneStore";

import { LayerRow } from "./LayerRow";

/**
 * The Layers panel — a fully keyboard-navigable list of every node, the
 * accessible equal of the freeform canvas. Listed front → back (top = front),
 * which is the inverse of the store's back → front `order`.
 */
export function LayersPanel() {
  const order = useSceneStore((s) => s.order);
  const total = order.length;
  const frontToBack = [...order].reverse();

  return (
    <aside className="layers" aria-label="Layers">
      <h2 className="layers-title">Layers</h2>
      {total === 0 ? (
        <p className="layers-empty">No layers yet. Add a sticker to begin.</p>
      ) : (
        <ul className="layers-list">
          {frontToBack.map((id, index) => (
            <LayerRow
              key={id}
              id={id}
              position={index + 1}
              total={total}
              isFront={index === 0}
              isBack={index === total - 1}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}

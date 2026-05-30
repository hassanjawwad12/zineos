"use client";

import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

/** Win98-style status bar: object count, selection, zoom, and a live message. */
export function StatusBar({ message }: { message: string }) {
  const count = useSceneStore((s) => s.order.length);
  const selectedId = useUiStore((s) => s.selectedId);

  return (
    <div className="statusbar" role="status" aria-live="polite">
      <span className="statusbar-field">
        {count} {count === 1 ? "object" : "objects"}
      </span>
      <span className="statusbar-field">
        {selectedId ? "1 selected" : "no selection"}
      </span>
      <span className="statusbar-field statusbar-field--grow">{message}</span>
      <span className="statusbar-field">100%</span>
    </div>
  );
}

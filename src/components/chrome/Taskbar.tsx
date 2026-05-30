"use client";

import { useEffect, useState } from "react";

import { useUiStore } from "@/store/useUiStore";

/** Win98 taskbar: Start (opens About), window buttons, and a live clock. */
export function Taskbar({ onStart }: { onStart: () => void }) {
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const toggleDrawer = useUiStore((s) => s.toggleDrawer);
  const [clock, setClock] = useState<string | null>(null);

  // Clock is client-only to avoid an SSR/client mismatch.
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="taskbar">
      <button type="button" className="taskbar-start" onClick={onStart}>
        <span aria-hidden="true">◈</span> Start
      </button>
      <button type="button" className="taskbar-win is-active">
        Layers
      </button>
      <button
        type="button"
        className={`taskbar-win${drawerOpen ? " is-active" : ""}`}
        aria-pressed={drawerOpen}
        onClick={toggleDrawer}
      >
        Stickers
      </button>
      <time className="taskbar-clock" aria-label="Current time">
        {clock ?? "--:--"}
      </time>
    </footer>
  );
}
